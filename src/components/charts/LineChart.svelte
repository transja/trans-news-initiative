<script>
	import { scaleBand, scaleLinear } from "d3-scale";
	import { line, curveMonotoneX } from "d3-shape";
	import { max } from "d3-array";
	import AxisX from "./axes/AxisX.svelte";
	import AxisY from "./axes/AxisY.svelte";
	import { CHART_MARGIN } from "./axes/chartLayout.js";
	import { LINE_GRADIENT } from "./lineGradient.js";

	/**
	 * Full-width line chart matching Sparkline styling (gradient + curveMonotoneX),
	 * with year axes aligned to ColumnChart.
	 *
	 * @prop {{ date: Date, value: number }[]} data — typically monthly counts
	 * @prop {string[]} years — same year strings as ColumnChart domain
	 */
	let { data = [], years = [] } = $props();

	let width = $state(0);
	let height = $state(0);
	let hover = $state(null);

	const margin = CHART_MARGIN;
	const gradientId = `line-grad-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;

	const innerWidth = $derived(width - margin.left - margin.right);
	const innerHeight = $derived(height - margin.top - margin.bottom);

	const xScale = $derived(
		scaleBand().domain(years).range([0, Math.max(0, innerWidth)]).padding(0.2)
	);

	const yMax = $derived(Math.max(1, max(data, (d) => d.value) || 0));

	const yScale = $derived(
		scaleLinear().domain([0, yMax]).nice().range([Math.max(0, innerHeight), 0])
	);

	function xForDate(date, band = xScale) {
		if (!date) return null;
		const year = String(date.getFullYear());
		const bandStart = band(year);
		if (bandStart == null) return null;

		const yearStart = new Date(date.getFullYear(), 0, 1).valueOf();
		const yearEnd = new Date(date.getFullYear() + 1, 0, 1).valueOf();
		const frac = Math.min(
			1,
			Math.max(0, (date.valueOf() - yearStart) / (yearEnd - yearStart))
		);
		return bandStart + frac * band.bandwidth();
	}

	const plotted = $derived.by(() => {
		if (!data.length || !years.length || !innerWidth || !innerHeight) return [];
		const band = xScale;
		const y = yScale;
		return data
			.map((d) => {
				const x = xForDate(d.date, band);
				if (x == null) return null;
				return { ...d, x, y: y(d.value) };
			})
			.filter(Boolean);
	});

	const pathData = $derived.by(() => {
		if (!plotted.length) return null;
		return line()
			.x((d) => d.x)
			.y((d) => d.y)
			.curve(curveMonotoneX)(plotted);
	});

	function formatY(value) {
		return Number.isInteger(value)
			? value.toLocaleString()
			: value.toLocaleString(undefined, { maximumFractionDigits: 1 });
	}

	function formatMonth(date) {
		return date.toLocaleDateString("en-US", {
			month: "long",
			year: "numeric"
		});
	}

	function handlePointerMove(event) {
		if (!plotted.length) return;
		const bounds = event.currentTarget.getBoundingClientRect();
		const mx = event.clientX - bounds.left;

		let nearest = plotted[0];
		let best = Infinity;
		for (const point of plotted) {
			const dist = Math.abs(point.x - mx);
			if (dist < best) {
				best = dist;
				nearest = point;
			}
		}
		hover = nearest;
	}

	function handlePointerLeave() {
		hover = null;
	}
</script>

<div
	class="line-chart-container"
	bind:clientWidth={width}
	bind:clientHeight={height}
	role="img"
	aria-label="Articles over time"
>
	{#if width && height && years.length && pathData}
		<svg {width} {height}>
			<defs>
				<linearGradient
					id={gradientId}
					gradientUnits="userSpaceOnUse"
					x1={margin.left}
					y1="0"
					x2={margin.left + innerWidth}
					y2="0"
				>
					<stop offset="0%" stop-color={LINE_GRADIENT.start} />
					<stop offset="100%" stop-color={LINE_GRADIENT.end} />
				</linearGradient>
			</defs>
			<g transform="translate({margin.left}, {margin.top})">
				<AxisY scale={yScale} ticks={4} tickFormat={formatY} />
				<AxisX scale={xScale} innerHeight={innerHeight} />
				<path
					class="line"
					d={pathData}
					fill="none"
					stroke="url(#{gradientId})"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				{#if hover}
					<line
						class="hover-rule"
						x1={hover.x}
						x2={hover.x}
						y1={0}
						y2={innerHeight}
					/>
					<circle
						class="hover-dot"
						cx={hover.x}
						cy={hover.y}
						r="5"
						fill="currentColor"
						stroke="#fff"
						stroke-width="2"
					/>
				{/if}
				<rect
					class="hover-overlay"
					x={0}
					y={0}
					width={innerWidth}
					height={innerHeight}
					fill="transparent"
					onpointermove={handlePointerMove}
					onpointerleave={handlePointerLeave}
				/>
			</g>
		</svg>
		{#if hover}
			<div
				class="tooltip"
				style:left="{margin.left + hover.x}px"
				style:top="{margin.top + hover.y}px"
			>
				<div class="tooltip-month">{formatMonth(hover.date)}</div>
				<div class="tooltip-count">
					{hover.value.toLocaleString()}
					{hover.value === 1 ? "article" : "articles"}
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.line-chart-container {
		position: relative;
		width: 100%;
		height: 250px;
		font-family: var(--sans);
	}

	.hover-overlay {
		cursor: crosshair;
		touch-action: none;
	}

	.hover-rule {
		stroke: var(--color-gray-300, #ccc);
		stroke-width: 1;
		stroke-dasharray: 3 3;
		pointer-events: none;
	}

	.hover-dot {
		pointer-events: none;
	}

	.tooltip {
		position: absolute;
		transform: translate(-50%, calc(-100% - 12px));
		background: #fff;
		border: 1px solid var(--color-gray-200, #e5e5e5);
		border-radius: 6px;
		padding: 0.5rem 0.75rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		pointer-events: none;
		z-index: 2;
		white-space: nowrap;
	}

	.tooltip-month {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		color: #555;
		margin-bottom: 0.15rem;
	}

	.tooltip-count {
		font-size: 0.95rem;
		font-weight: 600;
		color: #111;
	}
</style>
