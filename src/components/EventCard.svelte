<script>
	import { slide } from "svelte/transition";
	import { quintOut } from "svelte/easing";
	import Beeswarm from "./charts/Beeswarm.svelte";
	import { ChevronUp } from "@lucide/svelte";
	import { group } from "d3-array";
	import ColumnChart from "./charts/ColumnChart.svelte";
	import ArticleTable from "./ArticleTable.svelte";
	import {
		leanOrder,
		leanColors,
		leanTextColors
	} from "../utils/getLeanProperty.js";

	let { event, isOpen, xDomain, onToggle } = $props();

	const chartData = $derived.by(() => {
		const articlesByYear = group(event.articles, (d) =>
			new Date(d.publish_date).getFullYear().toString()
		);

		const startYear = xDomain[0].getFullYear();
		const endYear = xDomain[1].getFullYear();
		const years = [];
		for (let year = startYear; year <= endYear; year++) {
			years.push(year.toString());
		}

		return years.map((year) => {
			const articlesInYear = articlesByYear.get(year) || [];
			const counts = leanOrder.reduce(
				(acc, lean) => ({ ...acc, [lean]: 0 }),
				{}
			);

			articlesInYear.forEach((article) => {
				if (leanOrder.includes(article.lean)) {
					counts[article.lean]++;
				}
			});
			return { year: year.toString(), ...counts };
		});
	});
</script>

<div class="accordion-item">
	<button class="accordion-header" onclick={onToggle}>
		<div class="accordion-header-content">
			<h3>{event.name}</h3>
			<span>{event.articles.length} news articles</span>
		</div>

		<div class="accordion-icon" class:is-open={isOpen}>
			<ChevronUp />
		</div>
	</button>

	{#if isOpen}
		<div
			class="accordion-content"
			transition:slide={{ duration: 300, easing: quintOut }}
		>
			<div class="beeswarm-container event-content-block">
				<h4>News articles by publish date</h4>
				<Beeswarm data={event.articles} {xDomain} />
			</div>
			<div class="column-chart-container event-content-block">
				<h4>Publisher political lean by year</h4>
				<div class="div-legend">
					{#each leanOrder as key, i}
						<div
							class="legend-item"
							style="background-color: {leanColors[key] ??
								leanColors.unknown}; color: {leanTextColors[key] ??
								leanTextColors.unknown} "
						>
							{key}
						</div>
					{/each}
					<div
						class="legend-item no-data"
						style="color: {leanTextColors.unknown};"
					>
						No data
					</div>
				</div>
				<ColumnChart
					data={chartData}
					xKey="year"
					seriesKeys={leanOrder}
					colors={leanColors}
				/>
			</div>

			<div class="article-table-container event-content-block">
				<h4>Sample articles</h4>
				<ArticleTable articles={event.articles} {leanColors} />
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.accordion-item {
		border-radius: 8px;
		border: 1px solid var(--color-gray-100);
		background: #fff;
	}

	.accordion-header {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		width: 100%;
		padding: 1rem 1.5rem;
		text-align: left;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		gap: 1rem;
		background: var(--color-gray-100);

		.accordion-header-content {
			display: flex;
			gap: 1rem;
			align-items: center;
		}

		h3 {
			font-size: 1.25rem;
			font-weight: 600;
		}

		span {
			color: #555;
			font-size: 0.9rem;
		}
	}

	.accordion-icon {
		transition: transform 0.3s ease;
		&.is-open {
			transform: rotate(180deg);
		}
	}

	.accordion-content {
		padding: 0 1.5rem 1.5rem;
		border-top: 1px solid #eee;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.event-content-block {
		h4 {
			font-size: 1rem;
			font-weight: 600;
			margin-bottom: 0.5rem;
		}
	}

	.column-chart-container {
		margin-top: 2rem;
	}

	.div-legend {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.legend-item {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		width: fit-content;
		padding: 0.75rem 1rem;
		text-align: center;
		justify-content: center;
		height: 20px;
		border-radius: 5px;
		text-align: center;
		color: #fff;
		text-transform: uppercase;
		white-space: nowrap;
		font-size: 0.8rem;
		font-weight: 700;

		&.no-data {
			color: var(--color-gray-500);
			margin-left: 1rem;
			background-image: linear-gradient(
				135deg,
				var(--color-gray-50) 40%,
				var(--color-gray-300) 40%,
				var(--color-gray-300) 50%,
				var(--color-gray-50) 50%,
				var(--color-gray-50) 90%,
				var(--color-gray-300) 90%,
				var(--color-gray-300) 100%
			);
			background-size: 7.07px 7.07px;
		}
	}
</style>
