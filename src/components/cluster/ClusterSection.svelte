<script>
	import { MousePointerClick, Pointer } from "@lucide/svelte";
	import { fade } from "svelte/transition";

    let {data, minDate, maxDate} = $props();

	// components
	import SigmaMap from "../../components/SigmaMap.svelte";
	import Histogram from "../../components/Histogram.svelte";
	import DataControls from "../../components/DataControls.svelte";



	let filters = $state({
		topic: "All",
		publication: "All",
		dateRange: {
			start: minDate,
			end: maxDate
		}
	});

	const filteredData = $derived(
		data
			.filter((item) => {
				const d = new Date(item.publish_date);
				return d >= filters.dateRange.start && d <= filters.dateRange.end;
			})
			.filter((item) => {
				if (filters.publication === "All") {
					return true;
				}
				return item.media_name === filters.publication;
			})
	);

	const articleCount = $derived(filteredData.length);

	const isSameMonth = $derived(
		filters.dateRange.start.getFullYear() ===
			filters.dateRange.end.getFullYear() &&
			filters.dateRange.start.getMonth() === filters.dateRange.end.getMonth()
	);

	$inspect(isSameMonth);

	// Overlay state
	let showOverlay = $state(true);
</script>

{#snippet dateRangeInfo()}
	{#if isSameMonth}
		In {filters.dateRange.start.toLocaleDateString(undefined, {
			year: "numeric",
			month: "long"
		})}, we found
	{:else}
		Between {filters.dateRange.start.toLocaleDateString(undefined, {
			year: "numeric",
			month: "long"
		})} and {filters.dateRange.end.toLocaleDateString(undefined, {
			year: "numeric",
			month: "long"
		})}
	{/if}
{/snippet}


{#if showOverlay}
	<button
		class="overlay"
		onclick={() => (showOverlay = false)}
		onkeydown={(e) => e.key === "Escape" && (showOverlay = false)}
	>
		<div class="overlay-content">
			<div class="overlay-desc">
				{@render dateRangeInfo()}, we found
			</div>
			<div class="overlay-count">
				{articleCount.toLocaleString()} news articles
			</div>

			<div class="overlay-desc">
				about trans issues, <span class="icon"
					><Pointer size={4} color="black" /></span
				> explore them all
			</div>
		</div>
	</button>
{/if}

<SigmaMap
	allData={data}
	visibleData={filteredData}
	height={showOverlay ? "100vh" : "calc(100vh - 300px)"}
	{filters}
/>

{#if !showOverlay}
	<div transition:fade>
		<Histogram data={data} {filters} {minDate} {maxDate} />

		<div class="selection-info">
			{@render dateRangeInfo()},
			<b>{articleCount.toLocaleString()}</b> articles match your selections
		</div>

		<DataControls data={data} bind:filters />
	</div>
{/if}

<style lang="scss">
	// Color variables
	$primary-color: #111;
	$hover-color: #444;
	$light-gray: #f3f3f3;
	$text-dark: #333;
	$text-medium: #444;
	$placeholder-color: #aaa;

	.overlay {
		position: absolute;
		z-index: 2000;
		height: 100%;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: #ffffff;
		background: radial-gradient(
			circle,
			rgba(255, 255, 255, 1) 10%,
			rgba(255, 255, 255, 0.5) 50%,
			rgba(255, 255, 255, 0) 100%
		);

		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		text-align: center;

		&-content {
			max-width: calc(100% - 40px);
		}

		&-desc {
			font-size: 1.6rem;
			color: $text-dark;
		}

		&-count {
			font-size: 6rem;
			font-weight: bold;
			margin-bottom: 1rem;
			color: $primary-color;
		}

		.explore-btn {
			background: none;
			margin: 0px;
			padding: 0px;
			font-family: inherit;
			font-size: inherit;
			font-weight: inherit;
			color: inherit;
			cursor: pointer;
			border: none;
			outline: none;
		}
	}

	.button-row {
		display: flex;
		gap: 16px;
		justify-content: center;

		button {
			background: $primary-color;
			color: #fff;
			border: none;
			border-radius: 6px;
			padding: 12px 24px;
			font-size: 1rem;
			cursor: pointer;
			font-weight: 500;
			transition: background 0.2s;

			&:hover {
				background: $hover-color;
			}
		}
	}

	.icon {
		display: inline-flex;
		width: 24px;
		vertical-align: middle;
	}

	.selection-info {
		text-align: right;
		margin: 1rem 2rem;
	}
</style>
