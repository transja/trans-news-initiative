<script>
	import { fade } from "svelte/transition";
	import { cubicInOut } from "svelte/easing";
	import {
		MousePointerClick,
		Pointer,
		Calendar,
		ChevronDown,
		ChevronLeft,
		ArrowLeft,
		ArrowRight
	} from "@lucide/svelte";
	import MonthPicker from "./inputs/MonthPicker.svelte";

	import NestedSelect from "./inputs/NestedSelect.svelte";
	import LogoLockup from "./LogoLockup.svelte";
	// utils
	import {
		leanOrder,
		leanColors,
		leanTextColors
	} from "../utils/getLeanProperty.js";
	import { getPublicationName } from "../utils/getPublicationName.js";
	import { isDesktop, isMobile, isXSmall } from "$utils/breakpoints";
	import Spinner from "$components/helpers/loaders/Loader.Spinner.svelte";

	// stores
	import { inThemeView, activeTheme } from "$runes/misc.svelte.js";

	$effect(() => {
		if (activeTheme.theme) {
			highlightedContent = summaryContent.find(
				(t) => t.theme === activeTheme.theme
			);
		}
	});

	let {
		highlightedContent = $bindable(),
		transitionDuration,
		mode,
		summaryContent = [],
		filters = $bindable(),
		allData,
		filteredData,
		minDate,
		maxDate,
		resetFilters,
		controlsHeight = $bindable(),
		loadingThemeArticles
	} = $props();

	// TODO see why default allData and filteredData are different lengths

	const publicationDomainToName = new Map(
		allData.map((d) => [d.media_name, getPublicationName(d.media_name)])
	);
	const publicationNameToDomain = new Map(
		allData.map((d) => [getPublicationName(d.media_name), d.media_name])
	);

	const publicationsByLean = $derived(
		Object.entries(
			allData.reduce((acc, d) => {
				if (!d.lean || !d.media_name) return acc;
				if (!acc[d.lean]) {
					acc[d.lean] = new Set();
				}
				acc[d.lean].add(getPublicationName(d.media_name));
				return acc;
			}, {})
		)
			.map(([lean, publicationsSet]) => ({
				lean,
				publications: [...publicationsSet].sort()
			}))
			.sort((a, b) => a.lean.localeCompare(b.lean))
	);

	let selectedPublicationName = $state(
		publicationDomainToName.get(filters.publication) || filters.publication
	);

	$effect(() => {
		const domain =
			publicationNameToDomain.get(selectedPublicationName) ||
			selectedPublicationName;
		if (filters.publication !== domain) {
			filters.publication = domain;
		}
	});

	$effect(() => {
		const name =
			publicationDomainToName.get(filters.publication) || filters.publication;
		if (selectedPublicationName !== name) {
			selectedPublicationName = name;
		}
	});

	let showThemeDropdown = $state(false);
	let showMonthPicker = $state(false);

	$effect(() => {
		if (filters.publication !== "All") {
			filters.publicationLean = "All";
		}
	});

	let hoveredThemeIndex = $state(-1);

	$effect(() => {
		if (!showThemeDropdown) {
			hoveredThemeIndex = -1;
		}
	});

	function handleThemeSelect(theme) {
		highlightedContent = theme;
		showThemeDropdown = false;
		if (inThemeView.state) {
			if (!theme.theme) {
				activeTheme.theme = null;
				inThemeView.state = false;
			} else {
				activeTheme.theme = theme.theme;
			}
		}
	}

	function handleThemeSelectWithStopPropagation(event, theme) {
		event.stopPropagation();
		handleThemeSelect(theme);
	}

	function handleThemeSelectKeydown(event, theme) {
		event.stopPropagation();
		if (event.key === "Enter") {
			handleThemeSelect(theme);
		}
	}

	function handleExploreButtonClick() {
		if (highlightedContent.theme) {
			inThemeView.state = true;
			activeTheme.theme = highlightedContent.theme;
		}
		showThemeDropdown = false;
	}

	function handleThemeExit() {
		if (!inThemeView.state) return;
		inThemeView.state = false;
		activeTheme.theme = null;
		highlightedContent = summaryContent[0];
		resetFilters(["publicationLean", "publication", "dateRange"]);
	}

	function handleThemeKeydown(event) {
		if (!showThemeDropdown) return;
		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				if (hoveredThemeIndex === -1) {
					const selectedIndex = summaryContent.findIndex(
						(t) => t.title === highlightedContent.title
					);
					hoveredThemeIndex = (selectedIndex + 1) % summaryContent.length;
				} else {
					hoveredThemeIndex = (hoveredThemeIndex + 1) % summaryContent.length;
				}
				break;
			case "ArrowUp":
				event.preventDefault();
				if (hoveredThemeIndex === -1) {
					const selectedIndex = summaryContent.findIndex(
						(t) => t.title === highlightedContent.title
					);
					hoveredThemeIndex =
						(selectedIndex - 1 + summaryContent.length) % summaryContent.length;
				} else {
					hoveredThemeIndex =
						(hoveredThemeIndex - 1 + summaryContent.length) %
						summaryContent.length;
				}
				break;
			case "Enter":
				event.preventDefault();
				if (hoveredThemeIndex > -1) {
					handleThemeSelect(summaryContent[hoveredThemeIndex]);
				}
				break;
			case "Escape":
				showThemeDropdown = false;
				break;
		}
	}

	function clickOutside(node) {
		const handleClick = (event) => {
			if (node && !node.contains(event.target)) {
				node.dispatchEvent(new CustomEvent("clickoutside"));
			}
		};
		document.addEventListener("click", handleClick, true);
		return {
			destroy() {
				document.removeEventListener("click", handleClick, true);
			}
		};
	}

	function positionDropdown(node) {
		const wrapper = node.parentElement;
		if (!wrapper) return;

		const trigger = wrapper.querySelector("button");
		if (!trigger) return;

		const rect = trigger.getBoundingClientRect();
		const spaceBelow = window.innerHeight - rect.bottom;
		const spaceAbove = rect.top;
		const dropdownHeight = 200; // Corresponds to max-height in CSS

		if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
			// Open upwards
			node.style.bottom = `${wrapper.offsetHeight - trigger.offsetTop}px`;
			node.style.top = "auto";
		} else {
			// Open downwards
			node.style.top = `${trigger.offsetTop + trigger.offsetHeight}px`;
			node.style.bottom = "auto";
		}
	}

	const formatter = new Intl.DateTimeFormat("en-US", {
		month: "short",
		year: "numeric"
	});

</script>

<div
	class="controls-container"
	class:in-theme-view={inThemeView.state}
	bind:clientHeight={controlsHeight}
>
	{#if highlightedContent}
		<div class="controls-content">
			<div class="left-content">
				<div class="eyebrow">
					{#if inThemeView.state}
						With these filters, the Trans News Initiative identified
					{:else}
						The Trans News Initiative identified
					{/if}
				</div>
				<div class="subtitle-container">
					{#if mode == "intro"}
						<div class="subtitle-sizer" aria-hidden="true">
							<span class:introBreak={!$isDesktop}
								>{inThemeView.state
									? filteredData.length.toLocaleString()
									: highlightedContent.count.toLocaleString()} articles about</span
							>
							<span class:introBreak={!$isDesktop} style={mode == "default" ? "margin-right: 2rem" : ""}
								>{highlightedContent.title}</span
							>
						</div>
					{/if}
					{#key highlightedContent.title}
						<div
							class="subtitle"
							class:disabled={loadingThemeArticles}
							class:intro={mode == "intro"}
							style="display:{$isDesktop || $isMobile ? 'inline-block' : 'flex'}; flex-direction: {$isDesktop || $isMobile ? 'none' : 'column'}"
							in:fade={{
								duration: mode == "intro" ? transitionDuration / 4 : 0,
								easing: cubicInOut
							}}
							out:fade={{
								duration: mode == "intro" ? transitionDuration / 4 : 0,
								easing: cubicInOut
							}}
						>
							<span
								>{#if loadingThemeArticles}
									<Spinner />
								{:else if inThemeView.state}
									{filteredData.length.toLocaleString()}
								{:else}
									{highlightedContent.count.toLocaleString()}
								{/if}
								articles <span style="font-weight: 400;">about</span></span
							>

							{#if mode == "default"}
								<div
									class="interactive-title-wrapper"
									use:clickOutside
									onclickoutside={() => {
										if (showThemeDropdown) handleExploreButtonClick();
									}}
								>
									<button
										class="interactive-title"
										onclick={() => (showThemeDropdown = !showThemeDropdown)}
										onkeydown={handleThemeKeydown}
										disabled={loadingThemeArticles}
									>
										{highlightedContent.title}
										<ChevronDown size={24} />
									</button>
									{#if showThemeDropdown}
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<div
											class="dropdown-options theme-dropdown"
											use:positionDropdown
											onmouseleave={() => (hoveredThemeIndex = -1)}
										>
											{#each summaryContent as theme, i}
												<div
													class="dropdown-option"
													class:selected={theme.title ===
														highlightedContent.title}
													class:hovered={i === hoveredThemeIndex}
													onmouseenter={() => (hoveredThemeIndex = i)}
													onclick={(e) =>
														handleThemeSelectWithStopPropagation(e, theme)}
													onkeydown={(e) => handleThemeSelectKeydown(e, theme)}
													role="button"
													tabindex="0"
													class:top-theme={theme.title.toLowerCase() ===
														"trans communities"}
												>
													{#if theme.title === "trans communities" && inThemeView.state}
														<span class="in-dropdown-back-button">
															<ArrowLeft size={24} /> Back
														</span>
													{:else}
														{theme.title}
													{/if}
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{:else}{highlightedContent.title}{/if}
						</div>
					{/key}
				</div>
			</div>
			<div class="right-content" class:in-theme-view={inThemeView.state}>
				{#if $isMobile && !inThemeView.state}
					<LogoLockup type="icon" />
				{/if}

				{#if mode === "intro"}
					<div class="instructions-content">
						{#if $isDesktop}
							<MousePointerClick size={24} /> 
							<p>Click anywhere to explore</p>
						{:else}
							<Pointer size={24} /> 
							<p>Tap anywhere to explore</p>
						{/if}
					</div>
				{:else if highlightedContent.title !== "trans communities" && !inThemeView.state}
					<button
						class="explore-button"
						onclick={handleExploreButtonClick}
						disabled={loadingThemeArticles}
						>Explore more<ArrowRight size={24} />
					</button>
				{:else if inThemeView.state}
					<div
						class="filter-control"
						use:clickOutside
						onclickoutside={() => (showMonthPicker = false)}
					>
						<div class="input-wrapper">
							<label class="filter-control__label" for="calendar-button"
								>Date</label
							>
							<button
								id="calendar-button"
								class="filter-control__input calendar-button"
								onclick={() => (showMonthPicker = !showMonthPicker)}
								aria-label="Select date range"
								disabled={loadingThemeArticles}
							>
								<Calendar size={18} />

								{formatter.format(filters.dateRange.start)} - {formatter.format(
									filters.dateRange.end
								)}
							</button>

							{#if showMonthPicker}
								<div
									class="dropdown-options date-picker-dropdown"
									use:positionDropdown
								>
									<MonthPicker
										bind:dateRange={filters.dateRange}
										{minDate}
										{maxDate}
										closeMonthPicker={() => (showMonthPicker = false)}
									/>
								</div>
							{/if}
						</div>
					</div>

					<NestedSelect
						label="Publications by lean"
						options={publicationsByLean}
						bind:itemValue={selectedPublicationName}
						bind:groupValue={filters.publicationLean}
						groupKey="lean"
						itemsKey="publications"
						sortOrder={leanOrder}
						groupColors={leanColors}
						groupTextColors={leanTextColors}
						class="wide"
						disabled={loadingThemeArticles}
					/>
					{#if !$isMobile}
						<button
							class="explore-button back-button"
							onclick={handleThemeExit}
							disabled={loadingThemeArticles}
							><ArrowLeft size={24} /> Back</button
						>
					{/if}
				{/if}
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.controls-container {
		padding: 1rem;
		width: 100%;
		margin: 0 auto;
		// min-height: var(--controls-height, 0px);
		display: flex;
		justify-content: center;
		align-items: flex-start;
		flex-direction: column;
		gap: 10px;
		position: sticky;
		top: calc(var(--header-height) - 1rem);
		left: 0;
		right: 0;

		font-family: var(--sans);
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(6px);
		z-index: 500;

		--subtitle-font-size: 32px;
		--subtitle-line-height: 40px;

		&.in-theme-view {
			--subtitle-font-size: 24px;
			--subtitle-line-height: 30px;
			border-bottom: 1px solid var(--color-gray-200);
			box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.025);
		}

		.controls-content {
			width: 100%;
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: 1rem;
			.subtitle-container {
				position: relative;
			}

			.subtitle-sizer {
				visibility: hidden;
			}

			.eyebrow {
				font-style: italic;
				font-weight: 400;
				font-size: 14px;
				line-height: 19px;

				color: var(--color-gray-700);
			}

			.subtitle,
			.subtitle-sizer {
				font-style: normal;
				font-size: var(--subtitle-font-size);
				line-height: var(--subtitle-line-height);
				color: #000000;

				transition:
					font-size 0.3s ease,
					line-height 0.3s ease;
				span {
					font-weight: 700;
				}
				span.introBreak {
					display: block;
				}
			}

			.subtitle.disabled {
				opacity: 0.5;
				transition: opacity 0.3s ease;
			}

			.subtitle.intro {
				position: absolute;
				width: 100%;
				left: 0;
				top: 0;
			}

			.left-content {
				flex-grow: 1;
				min-width: 0; /* Allow content to wrap */
				display: flex;
				flex-direction: column;
				justify-content: flex-end;
			}

			.right-content {
				display: flex;
				align-items: flex-end; /* Align items to the bottom */
				gap: 10px;
				justify-content: flex-end;
				flex-shrink: 0;
				margin-top: 1rem;

				.instructions-content {
					display: flex;
					align-items: center;
					justify-content: flex-end;
					gap: 0.5rem;
					font-size: var(--14px);
					font-style: italic;
					color: var(--color-gray-700);

					p {
						margin: 0;
						max-width: 100px;
					}
				}

				.filter-control {
					display: flex;
					gap: 0.25rem;

					.input-wrapper {
						display: flex;
						flex-direction: column;
						gap: 0.25rem;
						flex-grow: 1;
						position: relative;
					}
				}

				.date-picker-dropdown {
					min-width: fit-content !important;
					left: calc(540px / -2 + 50%);
					@media (max-width: 600px) {
						left: 0;
					}
				}

				.calendar-button {
					justify-content: center;
					gap: 0.5rem;
					white-space: nowrap;
				}

				.filter-control__label {
					font-size: 12px;
					font-weight: 600;
					color: var(--color-gray-1000);
					text-transform: uppercase;
					padding-left: 0.25rem;
				}

				.filter-control__input {
					display: flex;
					align-items: center;
					justify-content: space-between;
					text-align: left;
					width: 100%;
					height: 38px;
					padding: 0.5rem 0.75rem;
					border: 1px solid #d1d5db;
					border-radius: 0.375rem;
					background-color: #ffffff;
					box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
					transition:
						border-color 0.2s,
						box-shadow 0.2s;
					cursor: pointer;
					font-size: 0.875rem;
					color: #111827;

					&:focus {
						outline: 2px solid transparent;
						outline-offset: 2px;
						border-color: #3b82f6;
						box-shadow: 0 0 0 2px rgb(59 130 230 / 40%);
					}

					&:hover {
						background: var(--color-gray-50);
					}
				}
			}

			.interactive-title-wrapper {
				display: inline;

				.interactive-title {
					position: relative;
					cursor: pointer;
					display: inline-flex;
					align-items: center;
					gap: 0.5rem;
					display: inline;
					border-bottom: 3px solid #000;
					background: none;
					border: none;
					font-size: var(--subtitle-font-size);
					line-height: var(--subtitle-line-height);
					padding: 0;
					transition:
						font-size 0.3s ease,
						line-height 0.3s ease;
					text-align: left;

					&:after {
						content: "";
						position: absolute;
						bottom: -2px;
						left: 0;
						right: 0;
						height: 2px;
						background: #000;
					}

					&:disabled {
						cursor: not-allowed;
						opacity: 0.5;
					}

					@media (max-width: 600px) {
						width: 100%;
						display: flex;
						justify-content: space-between;
					}
				}
			}

			.dropdown-options {
				background-color: #fff;
				border-radius: 0.375rem;
				border: 1px solid #d1d5db;
				box-shadow:
					0 4px 6px -1px rgb(0 0 0 / 0.1),
					0 2px 4px -2px rgb(0 0 0 / 0.1);
				list-style: none;
				margin: 0;
				margin-top: 0.25rem;
				position: absolute;
				z-index: 1000;

				overflow-x: hidden;

				@media (max-width: 600px) {
					width: 100%;
					font-size: 1rem;
					line-height: 0.8rem;
				}
			}

			.theme-dropdown {
				bottom: 100%;

				.dropdown-option {
					text-transform: lowercase;
				}
			}

			.dropdown-option {
				padding: 0.5rem;
				cursor: pointer;
				white-space: nowrap;
				border-radius: 2px;
				margin-left: 1rem;
				text-transform: capitalize;

				&.top-theme {
					font-weight: bold;
					margin-left: 0;
				}

				&.selected {
					background-color: #e5e7eb;
				}

				&:hover,
				&.hovered {
					background: #f0f0f0;
				}

				.in-dropdown-back-button {
					display: flex;
					align-items: center;
					gap: 0.5rem;

					text-transform: capitalize;
					font-weight: 600;
				}
			}
		}
	}

	.explore-button {
		margin-right: 0rem;
		background: #e5bdf5;
		padding: 0.5rem;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		color: #000;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		transition: transform 0.2s ease-in-out;
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
		height: 38px;

		&.back-button:hover {
			transform: translateX(-2px);
		}

		&:hover {
			transform: translateX(2px);
		}

		&:disabled {
			background-color: var(--color-gray-200);
			cursor: not-allowed;
			transform: none;

			&:hover {
				transform: none;
			}
		}
	}

	@media (max-width: 768px) {
		.controls-container {
			padding: 1rem;
			--subtitle-font-size: 32px;
			--subtitle-line-height: 40px;

			&.in-theme-view {
				--subtitle-font-size: 24px;
				--subtitle-line-height: 30px;
			}

			.controls-content {
				flex-direction: column;
				align-items: start;
				gap: 1rem;

				.left-content {
					width: 100%;
					justify-content: flex-start;
					height: auto;
					min-height: 4rem;
				}
				.right-content {
					width: 100%;
					justify-content: space-between;
					align-items: center;
				}
			}
		}
	}

	@media (max-width: 600px) {
		.controls-container {
			--subtitle-font-size: 24px;
			--subtitle-line-height: 32px;

			top: calc(var(--header-height) - 1.1rem);

			&.in-theme-view {
				--subtitle-font-size: 24px;
				--subtitle-line-height: 32px;
			}

			.controls-content {
				gap: 1rem;
				.right-content {
					align-items: anchor-center;
					justify-content: space-between;
					&.in-theme-view {
						align-items: flex-end;
					}
					.instructions-content {
						font-size: var(--14px);
						gap: 0.5rem;

						p {
							margin: 0;
							max-width: 100px;
						}
					}
				}
			}
		}
	}

	:global(.instructions-content svg, .explore-button svg) {
		animation: wiggle 0.5s ease-in-out infinite;
	}

	:global(.back-button svg) {
		animation: none;
	}

	@keyframes wiggle {
        0%, 100% { transform: translateX(0px) }
        25% { transform: translateX(-1px) }
        75% { transform: translateX(1px) }
    }
</style>
