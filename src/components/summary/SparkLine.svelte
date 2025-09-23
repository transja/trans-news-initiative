<script>
	import { line } from "d3-shape";
	import { scaleLinear, scaleTime } from "d3-scale";

	const { data } = $props();

	let width = $state(150);
	const height = 30;
	const margin = { top: 5, right: 5, bottom: 5, left: 5 };

	const x = $derived(
		scaleTime()
			.domain([data[0].date, data[data.length - 1].date])
			.range([margin.left, width - margin.right])
	);

	const y = scaleLinear()
		.domain([0, Math.max(...data.map((d) => d.count))])
		.range([height - margin.bottom, margin.top]);

	const lineGenerator = $derived(
		line()
			.x((d) => x(d.date))
			.y((d) => y(d.count))
	);

	const path = $derived(lineGenerator(data));
</script>

<div class="sparkline" bind:clientWidth={width}>
	<svg {width} {height}>
		<path d={path} fill="none" stroke="#F9A011" stroke-width="1.5" />
	</svg>
</div>

<style>
	.sparkline {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	svg {
		overflow: visible;
	}
</style>
