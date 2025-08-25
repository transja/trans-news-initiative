<script>
	import SparkLine from "./SparkLine.svelte";
	import Heatmap from "./Heatmap.svelte";
	import { ChevronRight } from "@lucide/svelte";

	let { topic, data } = $props();
	let open = $state(false);

	const toggle = () => (open = !open);
</script>

<div class="topic-row" class:open on:click={toggle}>
	<div class="cell topic-cell">
		<div class="topic-name">
			{topic}
		</div>
		<div class="chevron">
			<ChevronRight />
		</div>
	</div>
	<div class="cell articles-cell">{data.articles.length.toLocaleString()}</div>
	<div class="cell sparkline-cell">
		<SparkLine data={data.dailyCounts} />
	</div>
	<div class="cell publication-cell">
		{data.mostPrevalentPublication.join(", ")}
	</div>
	<div class="cell lean-cell">
		<Heatmap data={data.publicationLean} />
	</div>
</div>
{#if open}
	<div class="drawer">
		<p>TKTK.</p>
	</div>
{/if}

<style>
	.topic-row {
		display: grid;
		grid-template-columns: 2fr 1fr 1.5fr 1fr 1fr;
		gap: 1rem;

		border-bottom: 1px solid #eee;
		cursor: pointer;
		align-items: center;
	}
	.topic-row.open .chevron {
		transform: rotate(90deg);
	}

	.cell {
		padding: 1rem;
		height: 100%;
		display: flex;
		align-items: center;
	}

	.topic-cell {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: bold;
	}
	.chevron {
		width: 1em;
		height: 1em;
		transition: transform 0.2s;
	}
	.articles-cell {
		justify-content: flex-end;
		text-align: right;
	}

	.articles-cell,
	.sparkline-cell,
	.publication-cell {
		border-right: 1px solid #eee;
	}

	.drawer {
		padding: 1rem;
	}
</style>
