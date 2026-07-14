<script>
	/**
	 * Shared bottom axis for band (category) scales — used by ColumnChart and LineChart.
	 * Tick labels sit at the center of each band so both charts align.
	 */
	let {
		scale,
		ticks = null,
		innerHeight = 0,
		yOffset = 15
	} = $props();

	const tickValues = $derived(ticks ?? scale.domain());
</script>

<g class="axis x-axis" aria-hidden="true">
	{#each tickValues as tick}
		{@const x =
			typeof scale.bandwidth === "function"
				? scale(tick) + scale.bandwidth() / 2
				: scale(tick)}
		{#if x != null && !Number.isNaN(x)}
			<g class="tick" transform="translate({x}, {innerHeight})">
				<text y={yOffset} text-anchor="middle">{tick}</text>
			</g>
		{/if}
	{/each}
</g>

<style>
	.x-axis text {
		fill: black;
		text-anchor: middle;
		dominant-baseline: middle;
		font-size: 12px;
		font-weight: 600;
		font-family: var(--sans);
		stroke-width: 4px;
		stroke: white;
		paint-order: stroke;
	}
</style>
