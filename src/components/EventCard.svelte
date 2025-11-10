<script>
	import { tick } from "svelte";
	import { slide } from "svelte/transition";
	import { quintOut } from "svelte/easing";
	import Beeswarm from "./charts/Beeswarm.svelte";
	import { ChevronUp } from "@lucide/svelte";
	import { group } from "d3-array";
	import { timeMonths, timeMonth } from "d3-time";
	import ColumnChart from "./charts/ColumnChart.svelte";
	import ArticleTable from "./ArticleTable.svelte";
	import Sparkline from "./charts/Sparkline.svelte";
	import Info from "$components/Info.svelte";
	import {
		leanOrder,
		leanColors,
		leanTextColors
	} from "../utils/getLeanProperty.js";
	import { downloadEventCsv } from "../utils/downloadEventCsv.js";

	let { event, eventIndex, isOpen, xDomain, onToggle } = $props();

	let contentEl;
	let headerButtonEl;

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

	async function handleToggleAndFocus() {
		onToggle();

		await tick();

		if (isOpen && contentEl) {
			const firstFocusable = contentEl.querySelector(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);
			if (firstFocusable) {
				firstFocusable.focus();
			}
		}
	}

	function handleContentKeydown(event) {
		if (event.key === "Escape") {
			event.preventDefault();

			onToggle();

			if (headerButtonEl) {
				headerButtonEl.focus();
			}
		}
	}
</script>

<div class="accordion-item" class:is-open={isOpen}>
	<button
		class="accordion-header"
		onclick={handleToggleAndFocus}
		bind:this={headerButtonEl}
		aria-expanded={isOpen}
		aria-controls="accordion-content-{eventIndex}"
	>
		<div class="accordion-header-content">
			<h3>{event.name}</h3>
			<span>{event.articles.length} news articles</span>
		</div>

		<div class="sparkline-wrapper" aria-hidden="true">
			<Sparkline data={sparklineData} {xDomain} />
		</div>

		<div class="accordion-icon" class:is-open={isOpen} aria-hidden="true">
			<ChevronUp />
		</div>
	</button>

	{#if isOpen}
		<div
			class="accordion-content"
			bind:this={contentEl}
			transition:slide={{ duration: 300, easing: quintOut }}
			role="region"
			aria-labelledby="accordion-header-{eventIndex}"
			onkeydown={handleContentKeydown}
		>
			<div class="beeswarm-container event-content-block">
				<h4 class="chart-label">
					News articles by publish date <Info instance="chart_beeswarm" />
				</h4>
				<Beeswarm data={event.articles} {xDomain} />
			</div>
			<div class="column-chart-container event-content-block">
				<h4 class="chart-label">Publication political lean by year <Info instance="lean" /></h4>
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
				<h4>Articles in this event</h4>
				<ArticleTable articles={event.articles} {leanColors} />
				{#if false}
					// hide for now
					<button
						class="download-button"
						onclick={() => downloadEventCsv(event.articles, event.name)}
					>
						Download data
					</button>
				{/if}
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

		&:focus {
			/* This glowing ring is now on the container and won't be clipped */
			box-shadow: 0 0 0 3px rgba(59, 130, 230, 0.4);
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

		&:focus {
			outline: none;
		}

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

		@media (max-width: 600px) {
			padding: 0 0.5rem 1.5rem;
		}
	}

	.event-content-block {
		h4 {
			font-size: 1rem;
			font-weight: 600;
			margin-bottom: 0.5rem;

			&.chart-label {
				font-size: var(--14px);
				display: flex;
				align-items: center;
				gap: 0.5rem;
			}
		}
	}

	.column-chart-container {
		margin-top: 2rem;
	}

	.download-button {
		background: none;
		border: none;
		color: #666;
		text-decoration: underline;
		cursor: pointer;
		font-size: 0.9rem;
		margin-top: 1rem;
		padding: 0;
		font-family: inherit;

		&:hover {
			color: #333;
		}

		&:focus {
			outline: 2px solid var(--color-primary, #007bff);
			outline-offset: 2px;
		}
	}

	.div-legend {
		display: flex;
		gap: 0.25rem;
		margin-bottom: 1rem;
		@media (max-width: 600px) {
			flex-wrap: wrap;

			.legend-item {
				&.no-data {
					margin-left: 0;
				}
			}
		}
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

		@media (max-width: 600px) {
			padding: 0.75rem 0.5rem;
		}

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

	@media (max-width: 600px) {
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
