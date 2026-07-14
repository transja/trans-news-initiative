<script>
	import { scaleTime, scaleLinear } from "d3-scale";
	import { line, curveMonotoneX } from "d3-shape";
	import { max } from "d3-array";
	import { LINE_GRADIENT } from "./lineGradient.js";

	let { data = [], xDomain = [] } = $props();

	let width = $state(0);
	let height = $state(0);
	const margin = { top: 5, right: 0, bottom: 5, left: 0 };
	const gradientId = `spark-grad-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;

	const innerWidth = $derived(width - margin.left - margin.right);
	const innerHeight = $derived(height - margin.top - margin.bottom);

	const xScale = $derived(
		scaleTime().domain(xDomain).range([0, Math.max(0, innerWidth)])
	);

	const yScale = $derived(
		scaleLinear()
			.domain([0, max(data, (d) => d.value) || 0])
			.range([Math.max(0, innerHeight), 0])
	);

	const pathData = $derived.by(() => {
		if (!data.length || !innerWidth || !innerHeight) return null;
		return line()
			.x((d) => xScale(d.date))
			.y((d) => yScale(d.value))
			.curve(curveMonotoneX)(data);
	});
</script>

<div
	class="sparkline-container"
	bind:clientWidth={width}
	bind:clientHeight={height}
>
	{#if width && height && pathData && max(data, (d) => d.value) > 0}
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
				<path
					d={pathData}
					fill="none"
					stroke="url(#{gradientId})"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</g>
		</svg>
	{/if}
</div>

<style>
	.sparkline-container {
		width: 100px;
		height: 30px;
	}
</style>
