<script>
	let { data } = $props();

	let heatmapSections = [
		{
			name: "left",
			color: "#174D58"
		},
		{
			name: "lean left",
			color: "#3F8E9E"
		},
		{
			name: "center",
			color: "#E6E6E6"
		},
		{
			name: "lean right",
			color: "#FFA98E"
		},
		{
			name: "right",
			color: "#F2693E"
		}
	];
</script>

<div class="heatmap">
	{#each heatmapSections as section}
		<div
			class="heatmap-section"
			style="background-color: {section.color}"
			style:--width="{data[section.name] * 100}%"
		></div>
	{/each}
	<div class="heatmap-section unknown"></div>
</div>

<style lang="scss">
	.heatmap {
		display: flex;
		width: 100%;
		height: 30px;
	}

	.heatmap-section {
		height: 100%;
		transition: width 0.3s ease-in-out;
		width: var(--width);

		&.unknown {
			flex: 1;

			$stripe-color-1: #ffffff;
			$stripe-color-2: #cccccc;
			background-image: linear-gradient(
				135deg,
				$stripe-color-1 25%,
				$stripe-color-2 25%,
				$stripe-color-2 50%,
				$stripe-color-1 50%,
				$stripe-color-1 75%,
				$stripe-color-2 75%,
				$stripe-color-2 100%
			);
			background-size: 5px 5px;
		}
	}
</style>
