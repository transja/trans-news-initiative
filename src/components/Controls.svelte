<script>
	import { fade } from "svelte/transition";
	import { cubicInOut } from "svelte/easing";
	import {
		MousePointerClick,
		Pointer,
		ChevronDown,
		ChevronLeft
	} from "@lucide/svelte";
	import MonthPicker from "./inputs/MonthPicker.svelte";
	import Select from "./inputs/Select.svelte";

	let {
		highlightedContent = $bindable(),
		transitionDuration,
		mode,
		summaryContent = [],
		inThemeView = $bindable(),
		activeTheme = $bindable(),
		filters = $bindable(),
		data,
		controlsHeight = $bindable(),
		minDate,
		maxDate
	} = $props();

	const publications = new Set(data.map((d) => d.media_name));
	const allPublications = ["All", ...publications];
	const publicationLean = new Set(data.map((d) => d.lean));
	const allPublicationLean = ["All", ...publicationLean];

	let selectedPublicationLean = $derived(
		data.find((d) => d.media_name === filters.publication)?.lean
	);

	let showThemeDropdown = $state(false);
	let showPublicationDropdown = $state(false);
	let showLeanDropdown = $state(false);
	let showMonthPicker = $state(false);

	$effect(() => {
		if (filters.publication !== "All") {
			filters.publicationLean = "All";
		}
	});

	const filteredSummaryContent = $derived(
		summaryContent.filter((t) => t.title !== highlightedContent.title)
	);

	let focusedThemeIndex = $state(-1);
	let focusedPubIndex = $state(-1);
	let focusedLeanIndex = $state(-1);

	function handleThemeSelect(theme) {
		highlightedContent = theme;
		showThemeDropdown = false;
		if (inThemeView) {
			if (!theme.theme) {
				activeTheme = null;
				inThemeView = false;
			} else {
				activeTheme = theme.theme;
			}
		}
	}

	function handleExploreButtonClick() {
		if (highlightedContent.theme) {
			inThemeView = true;
			activeTheme = highlightedContent.theme;
		}
		showThemeDropdown = false;
	}

	function handleThemeExit() {
		if (!inThemeView) return;
		inThemeView = false;
		activeTheme = null;
	}

	function handleThemeKeydown(event) {
		if (!showThemeDropdown) return;
		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				focusedThemeIndex =
					(focusedThemeIndex + 1) % filteredSummaryContent.length;
				break;
			case "ArrowUp":
				event.preventDefault();
				focusedThemeIndex =
					(focusedThemeIndex - 1 + filteredSummaryContent.length) %
					filteredSummaryContent.length;
				break;
			case "Enter":
				event.preventDefault();
				if (focusedThemeIndex > -1) {
					handleThemeSelect(filteredSummaryContent[focusedThemeIndex]);
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
		year: "2-digit"
	});
</script>

<div class="controls-container" bind:clientHeight={controlsHeight}>
	{#if highlightedContent}
		<div class="controls-content">
			<div class="left-content">
				<div class="eyebrow">THE TRANS NEWS INITIATIVE IDENTIFIED</div>
				<div class="subtitle-container">
					<div class="subtitle-sizer" aria-hidden="true">
						<span>{highlightedContent.count.toLocaleString()} articles</span>
						about
						<span style={mode == "default" ? "margin-right: 1rem" : ""}
							>{highlightedContent.title}</span
						>
					</div>
					{#key highlightedContent.title}
						<div
							class="subtitle"
							in:fade={{
								duration: mode == "intro" ? transitionDuration : 0,
								easing: cubicInOut
							}}
							out:fade={{
								duration: mode == "intro" ? transitionDuration / 2 : 0,
								easing: cubicInOut
							}}
						>
							<span>{highlightedContent.count.toLocaleString()} articles</span>
							about

							{#if mode == "default"}
								<div
									class="interactive-title-wrapper"
									use:clickOutside
									on:clickoutside={() => {
										if (showThemeDropdown) handleExploreButtonClick();
									}}
								>
									<button
										class="interactive-title"
										on:click={() => (showThemeDropdown = !showThemeDropdown)}
										on:keydown={handleThemeKeydown}
									>
										{highlightedContent.title}
										<ChevronDown size={24} />
									</button>
									{#if showThemeDropdown}
										<div
											class="dropdown-options theme-dropdown"
											use:positionDropdown
										>
											{#each filteredSummaryContent as theme, i}
												<div
													class="dropdown-option"
													class:focused={i === focusedThemeIndex}
													on:mouseenter={() => (focusedThemeIndex = i)}
													on:click|stopPropagation={() =>
														handleThemeSelect(theme)}
												>
													{theme.title}
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
			<div class="right-content">
				{#if mode === "intro"}
					<MousePointerClick size={30} /> Click anywhere to explore them all
				{:else if highlightedContent.title !== "trans issues" && !inThemeView}
					<button class="explore-button" on:click={handleExploreButtonClick}
						><Pointer size={30} /> Click to explore this theme more</button
					>
				{:else if inThemeView}
					<div
						class="filter-control"
						use:clickOutside
						on:clickoutside={() => (showMonthPicker = false)}
					>
						<div class="input-wrapper">
							<label class="filter-control__label">Date</label>
							<button
								class="filter-control__input calendar-button"
								on:click={() => (showMonthPicker = !showMonthPicker)}
							>
								<svg
									width="20"
									height="22"
									viewBox="0 0 20 22"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M5.99023 1V5M13.9902 1V5M0.990234 9H18.9902M2.99023 3H16.9902C18.0948 3 18.9902 3.89543 18.9902 5V19C18.9902 20.1046 18.0948 21 16.9902 21H2.99023C1.88566 21 0.990234 20.1046 0.990234 19V5C0.990234 3.89543 1.88566 3 2.99023 3Z"
										stroke="#191919"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
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
										on:close={() => (showMonthPicker = false)}
									/>
								</div>
							{/if}
						</div>
					</div>

					<Select
						label="Publication"
						options={allPublications}
						bind:value={filters.publication}
						class="wide"
					/>
					{#if filters.publication === "All"}
						<Select
							label="Publication Lean"
							options={allPublicationLean}
							bind:value={filters.publicationLean}
							class="wide"
						/>
					{:else}
						<div class="filter-control">
							<div class="input-wrapper">
								<label class="filter-control__label">Publication Lean</label>
								<div class="static-lean-value">
									{selectedPublicationLean}
								</div>
							</div>
						</div>
					{/if}
					<button class="explore-button" on:click={handleThemeExit}
						><ChevronLeft size={30} /> Back</button
					>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.controls-container {
		padding: 1rem 0px;
		width: calc(100% - 6rem);
		margin: 0 auto;
		min-height: 100px;
		display: flex;
		justify-content: center;
		align-items: flex-start;
		flex-direction: column;
		gap: 10px;
		position: sticky;
		top: var(--header-height);
		left: 0;
		right: 0;
		z-index: 2000;
		font-family: var(--sans);
		background: white;
		// border-bottom: 1px solid #e5e5e5;

		.controls-content {
			width: 100%;
			display: flex;
			justify-content: space-between;
			align-items: end;
			gap: 1rem;

			.subtitle-container {
				position: relative;
			}

			.subtitle-sizer {
				visibility: hidden;
			}

			.eyebrow {
				font-style: normal;
				font-weight: 400;
				font-size: 16px;
				line-height: 19px;
				text-transform: uppercase;

				color: var(--color-gray-700);
			}

			.subtitle,
			.subtitle-sizer {
				font-style: normal;
				font-size: 36px;
				line-height: 44px;
				color: #000000;
				span {
					font-weight: 700;
				}
			}

			.subtitle {
				position: absolute;
				width: 100%;
				left: 0;
				top: 0;
			}

			.left-content {
				flex-grow: 1; /* Fill available space */
				min-width: 0; /* Allow content to wrap */
			}

			.right-content {
				display: flex;
				align-items: flex-end; /* Align items to the bottom */
				gap: 10px;
				justify-content: flex-end;
				flex-shrink: 0;

				.filter-control {
					display: flex;
					gap: 0.25rem;

					&.wide {
						min-width: 180px;
					}

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
				}

				.calendar-button {
					justify-content: center;
				}

				.filter-control__label {
					font-size: 0.75rem;
					font-weight: 600;
					color: #4b5563;
					text-transform: uppercase;
					letter-spacing: 0.05em;
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
				}
				.static-lean-value {
					display: flex;
					align-items: center;
					height: 38px;
					padding: 0.5rem 0.75rem;
					font-size: 0.875rem;
					color: #4b5563;
					background-color: #f3f4f6;
					border-radius: 0.375rem;
				}
			}

			.interactive-title-wrapper {
				display: inline;
			}
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
				font-size: 36px;
				line-height: 44px;
				padding: 0;

				&:after {
					content: "";
					position: absolute;
					bottom: -2px;
					left: 0;
					right: 0;
					height: 2px;
					background: #000;
				}
			}

			.dropdown-options {
				background-color: #fff;
				border-radius: 0.375rem;
				border: 1px solid #d1d5db;
				box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1),
					0 2px 4px -2px rgb(0 0 0 / 0.1);
				list-style: none;
				margin: 0;
				margin-top: 0.25rem;
				padding: 0.25rem;
				position: absolute;
				z-index: 10;
			}

			.theme-dropdown {
				bottom: 100%;
			}

			.dropdown-option {
				padding: 0.5rem;
				cursor: pointer;
				white-space: nowrap;
				border-radius: 2px;

				&:hover,
				&.focused {
					background: #f0f0f0;
				}
			}
		}
	}

	svg.lucide-mouse-pointer-click {
		width: 30px;
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
		height: 38px;

		&:hover {
			transform: scale(1.05);
		}
	}
</style>
