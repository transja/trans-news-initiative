<script>
	import {
		stack,
		area,
		stackOffsetWiggle,
		stackOrderInsideOut,
		curveBasis,
		stackOffsetNone
	} from "d3-shape";
	import { scaleTime, scaleLinear, scalePoint } from "d3-scale";
	import { extent, max, min, bisector } from "d3-array";
	import { timeMonth, timeMonths } from "d3-time";
	import { fade } from "svelte/transition";
	import { cubicInOut } from "svelte/easing";

	import Brush from "./Brush.svelte";

	// runes
	import { activeTheme, inThemeView } from "$runes/misc.svelte.js";

	// utils
	import { isMobile } from "$utils/breakpoints";

	let {
		data = [],
		themes = [],
		height = "0px",
		highlightedContent = $bindable(),
		transitionDuration = 500,
		filters = $bindable(),
		colors = [],
		dateExtent = [],
		contentOptions = [],
		mode = "default",
		isHoveringOverPlot = $bindable()
	} = $props();


	let container;
	let width = $state(0);

	let applyWidthChange = $state(false);
	$effect(() => {
		if (inThemeView.state) {
			const timer = setTimeout(() => {
				applyWidthChange = true;
			}, transitionDuration);
			return () => clearTimeout(timer);
		} else {
			applyWidthChange = false;
		}
	});



	let isWidthTransitioning = $state(false);
	$effect(() => {
		if (applyWidthChange) {
			isWidthTransitioning = true;
			const timer = setTimeout(() => {
				isWidthTransitioning = false;
			}, transitionDuration * 2);
			return () => clearTimeout(timer);
		} else {
			isWidthTransitioning = false;
		}
	});

	const numericHeight = $derived(parseInt(height, 10) || 0);

	const marginTop = 0;
	const marginRight = 0;
	const marginBottom = $derived(inThemeView.state ? 25 : 0);
	const marginLeft = 0;

	// State for inter-theme transitions
	let themeForAreaChart = $state(inThemeView.state ? activeTheme.theme : null);
	let isMorphingToFlat = $state(false);

	$effect(() => {
		if (inThemeView.state) {
			// We are in theme view.
			if (themeForAreaChart === null) {
				// This is the Main -> Theme transition.
				themeForAreaChart = activeTheme.theme;
				isMorphingToFlat = false;
			} else if (activeTheme.theme !== themeForAreaChart) {
				// This is Theme A -> Theme B.
				isMorphingToFlat = true;
				const timer = setTimeout(() => {
					themeForAreaChart = activeTheme.theme;
					isMorphingToFlat = false;
				}, transitionDuration);
				return () => clearTimeout(timer);
			}
		} else {
			// We are not in theme view. Reset the area chart theme.
			themeForAreaChart = null;
		}
	});

	// New state to control the timing of the highlight outline
	let showHighlight = $state(!inThemeView.state);
	$effect(() => {
		let timer;
		if (inThemeView.state) {
			showHighlight = false; // Hide immediately on enter
		} else {
			// On exit, wait for the main morph animation to finish before showing the highlight
			timer = setTimeout(() => {
				showHighlight = true;
			}, transitionDuration);
		}
		return () => clearTimeout(timer);
	});

	// State to differentiate view transitions from hover effects
	let isViewTransitioning = $state(false);
	let previnThemeView = $state(inThemeView.state);

	$effect(() => {
		if (inThemeView.state !== previnThemeView) {
			isViewTransitioning = true;

			// The flag should remain true for the duration of the exit animation,
			// which includes the steamplot morphing and the highlight's fade-in.
			const timer = setTimeout(
				() => {
					isViewTransitioning = false;
				},
				transitionDuration * 2.5 + 50
			); // Add a small buffer

			previnThemeView = inThemeView.state;
			return () => clearTimeout(timer);
		}

		if (!inThemeView.state) {
			isViewTransitioning = false;
		}
	});



	const binnedData = $derived.by(() => {

		const byMonth = new Map();

		// If monthly data already include zero-filled grid from the DB, this
		// will just map them; if not, we’ll still create zeros per month.
		for (const { month, theme, count } of data) {
			if (!byMonth.has(month)) {
				const base = { date: new Date(month) };
				// initialize all displayed themes to 0
				for (const th of themes) base[th] = 0;
				byMonth.set(month, base);
			}
			if (themes.includes(theme)) {
				byMonth.get(month)[theme] = count ?? 0;
			}
		}

		// Ensure months are sorted
		return Array.from(byMonth.values()).sort((a, b) => a.date - b.date);
	});

	const steamSeries = $derived.by(() => {
		if (!binnedData.length) return [];
		const stackGenerator = stack()
			.keys(themes)
			.order(stackOrderInsideOut)
			.offset(stackOffsetWiggle);
		return stackGenerator(binnedData);
	});

	const areaSeries = $derived.by(() => {
		if (!binnedData.length || !themeForAreaChart) return [];
		const stackGenerator = stack()
			.keys([themeForAreaChart]) // Use themeForAreaChart for data consistency
			.order(stackOrderInsideOut)
			.offset(stackOffsetNone); // Zero baseline
		return stackGenerator(binnedData);
	});

	// Use scalePoint for equal spacing of monthly bins
	const xScale = $derived(
		scalePoint()
			.domain(binnedData.map((d) => d.date.getTime()))
			.range([0, width - marginLeft - marginRight])
			.padding(0)
	);

	// Keep a time scale for brush/filter date mapping
	const xTimeScale = $derived(
		scaleTime()
			.domain(dateExtent || [new Date(), new Date()])
			.range([0, width - marginLeft - marginRight])
	);

	const unifiedYScale = $derived.by(() => {
		if (
			(inThemeView.state && !areaSeries.length) ||
			(!inThemeView.state && !steamSeries.length)
		) {
			return scaleLinear();
		}

		let yMin, yMax;

		if (inThemeView.state) {
			// In theme view, scale is based on the active theme's data (areaSeries)
			yMin = 0; // Area chart starts at 0 baseline
			yMax = max(areaSeries[0], (d) => d[1]);
		} else {
			// In steamgraph view, scale is based on all themes
			yMax = max(steamSeries, (s) => max(s, (d) => d[1]));
			yMin = min(steamSeries, (s) => min(s, (d) => d[0]));
		}

		// Ensure yMax is not 0 to avoid a flat scale
		if (yMax === 0) yMax = 1;

		return scaleLinear()
			.domain([yMin, yMax])
			.range([numericHeight - marginTop - marginBottom, 0]);
	});

	const yearLabels = $derived.by(() => {
		if (!dateExtent || !dateExtent[0] || !binnedData.length) return [];

		const labels = [];
		const bisectDate = bisector((d) => d.date).left;
		const startYear = dateExtent[0].getFullYear();
		const endYear = dateExtent[1].getFullYear();

		const yPosition = inThemeView.state
			? numericHeight - marginTop - marginBottom + 15 // Position near bottom for area chart
			: (numericHeight - marginTop - marginBottom) / 2 + 15; // Centered for steamgraph

		for (let year = startYear; year <= endYear; year++) {
			const yearStartDate = new Date(year, 0, 1);
			const yearEndDate = new Date(year + 1, 0, 1);
			const searchStart =
				yearStartDate > dateExtent[0] ? yearStartDate : dateExtent[0];
			const searchEnd =
				yearEndDate < dateExtent[1] ? yearEndDate : dateExtent[1];

			if (searchStart >= searchEnd) continue;

			const midDate = new Date(
				(searchStart.getTime() + searchEnd.getTime()) / 2
			);
			const dataIndex = bisectDate(binnedData, midDate, 1);
			const d0 = binnedData[dataIndex - 1];
			const d1 = binnedData[dataIndex];

			if (!d0 || !d1) continue;

			const dataPoint = midDate - d0.date > d1.date - midDate ? d1 : d0;
			labels.push({
				year: year,
				x: xScale(dataPoint.date.getTime()),
				y: yPosition
			});
		}
		return labels;
	});

	const steamAreaGenerator = $derived(
		area()
			.x((d) => xScale(d.data.date.getTime()))
			.y0((d) => unifiedYScale(d[0]))
			.y1((d) => unifiedYScale(d[1]))
			.curve(curveBasis)
	);

	const flattenedAreaGenerator = $derived(
		area()
			.x((d) => xScale(d.data.date.getTime()))
			.y0(numericHeight - marginBottom)
			.y1(numericHeight - marginBottom)
			.curve(curveBasis)
	);

	const seriesToHighlight = $derived.by(() => {
		const themeToHighlight = highlightedContent?.theme;
		if (!steamSeries.length || !themeToHighlight) return null;
		return steamSeries.find((s) => s.key === themeToHighlight);
	});

	function handlePathClick(theme) {
		if (inThemeView.state) return;

		// If a theme is not highlighted, the behavior depends on the device.
		if (highlightedContent?.theme !== theme) {
			if ($isMobile) {
				// On mobile, the first tap on a theme highlights it.
				highlightedContent = contentOptions.find((c) => c.theme === theme);
			} else {
				// On desktop, clicking a non-hovered theme resets any highlight.
				highlightedContent = contentOptions[0];
			}
			return; // In both cases, we do nothing further on the first click.
		}

		// If a theme *is* highlighted, a click/tap will enter theme view.
		// On mobile, this is the second tap.
		// On desktop, this is a click on a hovered theme.
		if (contentOptions.length > 0) {
			highlightedContent = contentOptions[0];
		}
		activeTheme.theme = theme;
		highlightedContent = contentOptions.find((c) => c.theme === theme);
		isHoveringOverPlot = false;
		inThemeView.state = true;
	}

	function handlePathMousemove(theme) {
		if (
			$isMobile ||
			inThemeView.state ||
			(!isHoveringOverPlot && highlightedContent.theme)
		)
			return;
		highlightedContent = contentOptions.find((c) => c.theme === theme);
		isHoveringOverPlot = true;
	}

	function handlePathMouseleave(theme) {
		if (
			$isMobile ||
			inThemeView.state ||
			(!isHoveringOverPlot && highlightedContent.theme)
		)
			return;
		highlightedContent = contentOptions[0];
		isHoveringOverPlot = false;
	}

	function handleOutsideClick() {
		if (inThemeView.state) return;
		highlightedContent = contentOptions[0];
	}

	function getPathOpacity(seriesKey) {
		if (inThemeView.state) {
			return seriesKey === themeForAreaChart ? 1 : 0;
		}
		if (highlightedContent?.theme) {
			return seriesKey === highlightedContent.theme ? 1 : 0.7;
		}
		return 1;
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="steamplot-container"
	bind:this={container}
	bind:clientWidth={width}
	style:--height={height}
	style:--duration="{transitionDuration}ms"
	class:interactive={mode === "default"}
	class:in-theme-view={inThemeView.state}
	class:apply-width={applyWidthChange}
	onclick={(event) => {
		event.stopPropagation();
		handleOutsideClick();
	}}
>
	{#if inThemeView.state}
		<Brush
			bind:filters
			{dateExtent}
		/>
	{/if}

	{#if width && numericHeight}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<svg width="100%" height={numericHeight}>
			<defs>
				<linearGradient id="steam-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
					{#if colors.length > 0}
						{#each colors as color, i}
							<stop
								offset={colors.length === 1
									? "50%"
									: `${(i / (colors.length - 1)) * 100}%`}
								stop-color={color}
							/>
						{/each}
					{:else}
						<stop offset="0%" stop-color="#a8d8f0" />
						<stop offset="50%" stop-color="#c8b4e2" />
						<stop offset="100%" stop-color="#f3c2d7" />
					{/if}
				</linearGradient>
			</defs>
			<g transform={`translate(${marginLeft}, ${marginTop})`}>
				{#each steamSeries as s}
					<g style="transition: transform 0.5s ease-in-out;">
						<path
							d={inThemeView.state && areaSeries.length
								? isMorphingToFlat
									? flattenedAreaGenerator(areaSeries[0])
									: steamAreaGenerator(areaSeries[0])
								: steamAreaGenerator(s)}
							fill="url(#steam-gradient)"
							stroke="white"
							stroke-width={$isMobile ? "0.5px" : "1px"}
							opacity={getPathOpacity(s.key)}
							style="
								transition-property: d, opacity;
								transition-duration: {isWidthTransitioning  || mode === 'intro'
								? 0
								: transitionDuration}ms, {inThemeView.state || mode === 'intro'
								? transitionDuration / 2
								: 0}ms;
								transition-timing-function: ease-in-out, ease-in-out;
							"
							onclick={(event) => {
								event.stopPropagation();
								handlePathClick(s.key);
							}}
							onmousemove={(event) => {
								event.stopPropagation();
								handlePathMousemove(s.key);
							}}
							onmouseleave={(event) => {
								event.stopPropagation();
								handlePathMouseleave(s.key);
							}}
						/>
					</g>
				{/each}

				{#if !inThemeView.state && seriesToHighlight}
					<path
						d={steamAreaGenerator(seriesToHighlight)}
						class="highlight-outline"
						fill="none"
						stroke="black"
						stroke-width="2px"
						pointer-events="none"
						style="
								transition-property: d, opacity;
								transition-duration: {isWidthTransitioning || mode === 'intro'
								? 0
								: transitionDuration}ms, {inThemeView.state || mode === 'intro'
								? transitionDuration / 2
								: 0}ms;
								transition-timing-function: ease-in-out, ease-in-out;
							"
						out:fade={{
							duration: mode === "intro" ? transitionDuration / 2 : 0
						}}
						in:fade={{
							duration:
								mode === "intro" || isViewTransitioning
									? transitionDuration / 2
									: 0,
							delay: isViewTransitioning ? transitionDuration * 2 : 0
						}}
					/>
				{/if}

				{#each yearLabels as label}
					<g
						class="year-label"
						transform={`translate(${label.x}, ${label.y})`}
						style="transition: transform {isWidthTransitioning || mode === 'intro'
							? 0
							: transitionDuration}ms ease-in-out;"
					>
						<text
							fill="black"
							text-anchor="middle"
							dominant-baseline="middle"
							font-size="12px"
							font-weight="600"
							stroke-width="4px"
							stroke="white"
							paint-order="stroke"
						>
							{label.year}
						</text>
					</g>
				{/each}
			</g>
		</svg>
	{/if}
</div>

<style lang="scss">
	.steamplot-container {
		width: 100%;
		height: var(--height);
		position: relative;
		transition:
			height var(--duration) ease-in-out,
			width var(--duration) ease-in-out,
			background-color 300ms ease-in-out;
		pointer-events: none;
		background-color: transparent;
		margin: 0 auto;
		font-family: var(--sans);

		&.interactive {
			pointer-events: auto;
		}

		&.in-theme-view {
			position: sticky;
			bottom: 100px;
			background-color: white;

			&.apply-width {
				width: calc(100% - 6rem);
				@media (max-width: 600px) {
					width: calc(100% - 4rem);
				}
			}

			@media (max-width: 600px) {
				position: relative;
				bottom: 0;
				background-color: transparent;
			}
		}
	}
	svg {
		font-family: var(--sans);
		height: 100%;
		display: block;

		.year-label {
			display: block;
		}

		text {
			pointer-events: none;
			font-family: var(--sans);
		}

		path {
			cursor: pointer;
		}
	}
</style>
