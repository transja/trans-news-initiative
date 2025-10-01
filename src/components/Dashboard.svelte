<script>
	import { debounce } from "$utils/debounce.js";
	import { fade } from "svelte/transition";


	// stores
	import { inThemeView } from "../stores/global.js";

	// components
	import Steamplot from "./charts/Steamplot.svelte";
	import CirclePack from "./charts/CirclePack.svelte";

	let {
		data,
		filteredDataWithDateRange,
		minDate,
		maxDate,
		introFinished,
		filters = $bindable(),
		themes,
		highlightedContent = $bindable(),
		isHoveringOverPlot = $bindable(),
		transitionDuration,
		summaryContent,
		controlsHeight,
		vizColors,
	} = $props();

	let dashboardHeight = $state();
	let contentHeight = $state();
	let renderCirclePack = $state(false);

	$effect(() => {
		let timer;
		if ($inThemeView) {
			timer = setTimeout(() => {
				renderCirclePack = true;
			}, transitionDuration);
		} else {
			renderCirclePack = false;
		}

		return () => {
			clearTimeout(timer);
		};
	});

	

	const brushHeight = $derived($inThemeView ? 150 : 0);
	
</script>

<div
	id="dashboard"
	bind:clientHeight={dashboardHeight}
	style:--brush-height="{brushHeight}px"
	style:--controls-height="{controlsHeight}px"
	class:in-theme-view={$inThemeView}
>
	<div
		id="content-container"
		bind:clientHeight={contentHeight}
		style="--duration: {transitionDuration}ms"
		class:in-theme-view={$inThemeView}
	>
		{#if contentHeight}
			<div class="circlepack-wrapper" class:in-theme-view={$inThemeView}>
				{#if renderCirclePack}
					<div
						class="circlepack-fade-in"
						transition:fade={{ duration: 300 }}
					>
						<CirclePack
							data={filteredDataWithDateRange}
							height="{contentHeight - brushHeight}px"
							colors={vizColors}
						/>
					</div>
				{/if}
			</div>

			<Steamplot
				{data}
				{themes}
				height="{$inThemeView ? controlsHeight : contentHeight}px"
				{transitionDuration}
				bind:filters
				colors={vizColors}
				bind:highlightedContent
				contentOptions={summaryContent}
				bind:isHoveringOverPlot
				mode={introFinished ? "default" : "intro"}
				dateExtent={[minDate, maxDate]}
			/>
		{/if}
	</div>
</div>

<style lang="scss">
	#dashboard {
		display: flex;
		flex-direction: row;
		width: 100%;
		height: calc(
			100vh - var(--header-height, 0px) - 100px
		);

		margin-top: var(--header-height, 0px);

		// margin: 1rem 2rem;
		transition: height 0.5s ease-in-out;

		&.in-theme-view {
			transition: height 0.5s ease-in-out;
			height: calc(80vh);
		}
	}

	#content-container {
		position: relative;
		flex-grow: 1;
		height: 100%;

		&.in-theme-view {
			height: calc(100%);
		}
	}

	.circlepack-wrapper {
		width: calc(100% - 4rem);
		margin: 0 auto;
		height: 0;
		overflow: hidden;
		transition:
			height var(--duration) ease-in-out,
			opacity var(--duration) ease-in-out;
		opacity: 0;

		background: var(--color-gray-50);
		border-radius: 10px;
		border: 1px solid var(--color-gray-200);
		// box-shadow: inset 0px 2px 8px rgba(0, 0, 0, 0.15);

		&.in-theme-view {
			height: calc(100% - var(--controls-height, 0px));
			opacity: 1;
		}
	}

	.circlepack-fade-in {
		height: 100%;
	}

	.back-button {
		position: absolute;
		top: 2rem;
		left: 2rem;
		z-index: 1;
		background: #fff;
		border: 1px solid #ccc;
		padding: 0.5rem 1rem;
		cursor: pointer;
		font-size: 1rem;
		border-radius: 5px;
	}

	@media(max-width: 1000px) {
		#dashboard {
			height: calc(
				100vh - var(--header-height, 0px) - 210px
			);

			&.in-theme-view {
				height: calc(60vh);
			}
		}

		.circlepack-wrapper {
			width: calc(100% - 2rem);
		}
	}
</style>
