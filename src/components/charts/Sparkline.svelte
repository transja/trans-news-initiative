<script>
	import { scaleTime, scaleLinear } from "d3-scale";
	import { line, curveBasis } from "d3-shape";
	import { max } from "d3-array";

	let { data = [], xDomain = [] } = $props();

	let width = $state(0);
	let height = $state(0);
	const margin = { top: 5, right: 0, bottom: 5, left: 0 };

	const innerWidth = $derived(width - margin.left - margin.right);
	const innerHeight = $derived(height - margin.top - margin.bottom);

	const xScale = $derived(
		scaleTime().domain(xDomain).range([0, innerWidth])
	);

	const yScale = $derived(
		scaleLinear()
			.domain([0, max(data, (d) => d.value)])
			.range([innerHeight, 0])
	);

	const lineGenerator = $derived(
		line()
			.x((d) => xScale(d.date))
			.y((d) => yScale(d.value))
			.curve(curveBasis)
	);

	const pathData = $derived(lineGenerator(data));
</script>

<div class="sparkline-container" bind:clientWidth={width} bind:clientHeight={height}>
	{#if width && height && data.length > 0 && max(data, (d) => d.value) > 0}
		<svg {width} {height}>
			<g transform="translate({margin.left}, {margin.top})">
				<path d={pathData} fill="none" stroke="var(--color-gray-400)" stroke-width="2" />
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
