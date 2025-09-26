<script>
	import { scaleBand, scaleLinear } from "d3-scale";
	import { stack, stackOrderNone, stackOffsetExpand } from "d3-shape";
	import { format } from "d3-format";

	let { data = [], xKey = "year", seriesKeys = [], colors = {} } = $props();

	let width = $state(0);
	let height = $state(0);

	const margin = { top: 10, right: 0, bottom: 20, left: 40 };

	const stackedData = $derived(
		stack().keys(seriesKeys).order(stackOrderNone).offset(stackOffsetExpand)(
			data
		)
	);

	const innerWidth = $derived(width - margin.left - margin.right);
	const innerHeight = $derived(height - margin.top - margin.bottom);

	const xScale = $derived(
		scaleBand()
			.domain(data.map((d) => d[xKey]))
			.range([0, innerWidth])
			.padding(0.2)
	);

	const yScale = $derived(scaleLinear().domain([0, 1]).range([innerHeight, 0]));

	const yFmt = format(".0%");

	$inspect(stackedData);
</script>

<div
	class="chart-container"
	bind:clientWidth={width}
	bind:clientHeight={height}
>


	{#if width && height}
		<svg {width} {height}>
			<defs>
				<pattern
					id="diagonal-stripe-pattern"
					patternUnits="userSpaceOnUse"
					width="8"
					height="8"
				>
					<rect width="8" height="8" style="fill: var(--color-gray-50)"></rect>
					<path
						d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4"
						style="stroke: var(--color-gray-300)"
						stroke-width="1"
					></path>
				</pattern>
			</defs>
			<g transform="translate({margin.left}, {margin.top})">
				<!-- Y axis -->
				<g class="axis y-axis" style="font-size: 0.8rem; color: #777;">
					{#each yScale.ticks(4) as tick}
						<g class="tick" transform="translate(0, {yScale(tick)})">
							<text y="3" x="-5" text-anchor="end" alignment-baseline="middle"
								>{yFmt(tick)}</text
							>
						</g>
					{/each}
				</g>

				<!-- X axis -->
				<g class="axis x-axis" style="font-size: 0.8rem; color: #777;">
					{#each xScale.domain() as tick}
						<g
							class="tick"
							transform="translate({xScale(tick) +
								xScale.bandwidth() / 2}, {innerHeight})"
						>
							<text y="15" text-anchor="middle">{tick}</text>
						</g>
					{/each}
				</g>

				<!-- Rects -->
				<g class="series-group">
					{#each stackedData as series}
						{@const key = series.key}
						{#each series as d} 
							{@const [y0, y1] = d}
							{#if !isNaN(y0) && !isNaN(y1)}
								<rect
									x={xScale(d.data[xKey])}
									y={yScale(y1)}
									width={xScale.bandwidth()}
									height={yScale(y0) - yScale(y1)}
									fill={colors[key] ?? "#ccc"}
								>
									<title>{key}: {yFmt(d.data[key])}</title>
								</rect>
							{/if}
						{/each}
					{/each}
				</g>

				<!-- Placeholder rects for no data -->
				<g class="placeholder-group">
					{#each data as d}
						{@const yearHasData = seriesKeys.reduce(
							(sum, key) => sum + (d[key] || 0),
							0
						) > 0}
						{#if !yearHasData}
							<rect
								x={xScale(d[xKey])}
								y={yScale(1)}
								width={xScale.bandwidth()}
								height={innerHeight}
								fill="url(#diagonal-stripe-pattern)"
							></rect>
						{/if}
					{/each}
				</g>
			</g>
		</svg>
	{/if}
</div>

<style>
	.chart-container {
		width: 100%;
		height: 250px;
	}

	.x-axis text {
		fill: black;
		text-anchor: middle;
		dominant-baseline: middle;
		font-size: 12px;
		font-weight: 600;
		font-family: sans-serif;
		stroke-width: 4px;
		stroke: white;
		paint-order: stroke;
	}

</style>
