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
			<defs>
				<linearGradient id="transGradient" x1="0" y1="16" x2="100" y2="16" gradientUnits="userSpaceOnUse">
					<stop offset="0" stop-color="var(--color-stop-0)"/>
					<stop offset="1" stop-color="var(--color-stop-1)"/>
				</linearGradient>
			</defs>
			<g transform="translate({margin.left}, {margin.top})">
				<path d={pathData} fill="none" stroke-width="2" />
			</g>
		</svg>
	{/if}
</div>

<style>
	.sparkline-container {
		width: 100px;
		height: 30px;
	}

	:global(.sparkline-container svg path) {
		stroke: url(#transGradient);
	}

	#transGradient {
        --color-stop-0: #4BC1C4;
        --color-stop-1: #CB9DDD;
      }
</style>
