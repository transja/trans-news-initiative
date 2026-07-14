<script>
	/**
	 * Shared left axis for linear scales.
	 */
	let {
		scale,
		ticks = 4,
		tickFormat = (d) => d,
		xOffset = -5
	} = $props();

	const tickValues = $derived(
		typeof ticks === "number" ? scale.ticks(ticks) : ticks
	);
</script>

<g class="axis y-axis" aria-hidden="true">
	{#each tickValues as tick}
		<g class="tick" transform="translate(0, {scale(tick)})">
			<text
				y="3"
				x={xOffset}
				text-anchor="end"
				alignment-baseline="middle"
			>
				{tickFormat(tick)}
			</text>
		</g>
	{/each}
</g>

<style>
	.y-axis text {
		fill: #777;
		font-size: 0.8rem;
		font-family: var(--sans);
	}
</style>
