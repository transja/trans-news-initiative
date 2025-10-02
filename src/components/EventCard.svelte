<script>
	import { slide } from "svelte/transition";
	import { quintOut } from "svelte/easing";
	import Beeswarm from "./charts/Beeswarm.svelte";
	import { ChevronUp } from "@lucide/svelte";
	import { group } from "d3-array";
	import { timeMonths, timeMonth } from "d3-time";
	import ColumnChart from "./charts/ColumnChart.svelte";
	import ArticleTable from "./ArticleTable.svelte";
	import Sparkline from "./charts/Sparkline.svelte";
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

	const sparklineData = $derived.by(() => {
		const [start, end] = xDomain;
		const months = timeMonths(start, end);

		const articlesByMonth = group(event.articles, (d) =>
			timeMonth.floor(new Date(d.publish_date))
		);

		return months.map((month) => {
			const articlesInMonth = articlesByMonth.get(month) || [];
			return {
				date: month,
				value: articlesInMonth.length
			};
		});
	});
</script>

<div class="accordion-item" class:is-open={isOpen}>
	<button class="accordion-header" onclick={onToggle}>
		<div class="accordion-header-content">
			<h3>{event.name}</h3>
			<span>{event.articles.length} news articles</span>
		</div>

		<div class="sparkline-wrapper">
			<Sparkline data={sparklineData} {xDomain} />
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
				<h4>Publication political lean by year</h4>
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
		border: 1px solid var(--color-gray-200);
		background: #fff;
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.025);
		transition: transform 0.125s ease-out;
		overflow: hidden;

		&.is-open {
				&:hover {
					transform: translateY(0);
				}	
			}

		&:hover {
			transform: translateY(-4px);	
		}
	}

	.accordion-header {
		display: grid;
		grid-template-columns: 1fr auto auto;
		align-items: center;
		width: 100%;
		padding: 1rem 1.5rem;
		text-align: left;
		background: none;
		border: none;
		border-radius: 8px 8px 0 0;
		cursor: pointer;
		font-size: 1rem;
		gap: 1rem;
		background: var(--color-gray-100);

		.sparkline-wrapper {
			margin-right: 1rem;
		}

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
		width: 2rem;
		height: 2rem;
		background-color: black;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		color: var(--color-white);
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
		gap: 0.25rem;
		margin-bottom: 1rem;
	}

	.legend-item {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		width: 90px;
		padding: 0.75rem 1rem;
		text-align: center;
		justify-content: center;
		height: 20px;
		border-radius: 5px;
		text-align: center;
		color: #fff;
		text-transform: uppercase;
		white-space: nowrap;
		font-size: 10px;
		font-weight: 700;

		&.no-data {
			color: var(--color-gray-500);
			margin-left: 2rem;
			background-image: linear-gradient(
				135deg,
				var(--color-gray-50) 40%,
				var(--color-gray-200) 40%,
				var(--color-gray-200) 50%,
				var(--color-gray-50) 50%,
				var(--color-gray-50) 90%,
				var(--color-gray-200) 90%,
				var(--color-gray-200) 100%
			);
			background-size: 7.07px 7.07px;
		}
	}

	@media(max-width: 600px) {
		.accordion-header {
			.accordion-header-content {
				flex-direction: column;
				align-items: start;
				gap: 0;

				h3 {
					margin: 0.5rem 0;
				}
			}
		}
	}
</style>
