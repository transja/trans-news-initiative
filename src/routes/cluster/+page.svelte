<script>
	import useWindowDimensions from "$runes/useWindowDimensions.svelte.js";
	import SigmaMap from "../../components/SigmaMap.svelte";
	import Histogram from "../../components/Histogram.svelte";
	import csvdata from "../../data/clustered_articles.csv";
	import { MousePointerClick, Pointer } from "@lucide/svelte";
	import { fade } from "svelte/transition";

	import { writable, derived } from "svelte/store";

	// Process data and filter for top 15 largest clusters
	const processedData = csvdata
		.filter((item) => item.publish_date > "2020-01-01")
		.map((item, index) => ({
			...item,
			id: index.toString(),
			UMAP1: Number(item.UMAP1),
			UMAP2: Number(item.UMAP2)
		}))
		.filter((item) => item.cluster != "-1")
		.filter((item) => !isNaN(item.UMAP1) && !isNaN(item.UMAP2));

	// Get all publish dates for histogram
	const allDates = processedData.map((d) => d.publish_date).filter(Boolean);

	const minDate = allDates.length
		? new Date(Math.min(...allDates.map((d) => new Date(d))))
		: new Date();

	const maxDate = allDates.length
		? new Date(Math.max(...allDates.map((d) => new Date(d))))
		: new Date();

	// 1. Declare dateRange FIRST
	const dateRange = writable([minDate, maxDate]);

	console.log(maxDate);

	// 2. Then declare filteredData and articleCount
	const filteredData = derived(dateRange, ($dateRange) =>
		processedData.filter((item) => {
			const d = new Date(item.publish_date);
			return d >= $dateRange[0] && d <= $dateRange[1];
		})
	);

	const articleCount = derived(
		filteredData,
		($filteredData) => $filteredData.length
	);

	const isSameMonth = derived(dateRange, ([$start, $end]) => {
		return (
			$start.getFullYear() === $end.getFullYear() &&
			$start.getMonth() === $end.getMonth()
		);
	});

	// Overlay state
	let showOverlay = $state(true);

	// Share/download handlers
	function handleShare() {
		console.log("Share this chart clicked");
	}
	function handleDownload() {
		console.log("Download the data clicked");
	}

	// $inspect($dateRange);
</script>

{#snippet dateRangeInfo()}
	{#if $isSameMonth}
		In {$dateRange[0].toLocaleDateString(undefined, {
			year: "numeric",
			month: "long"
		})}, we found
	{:else}
		Between {$dateRange[0].toLocaleDateString(undefined, {
			year: "numeric",
			month: "long"
		})} and {$dateRange[1].toLocaleDateString(undefined, {
			year: "numeric",
			month: "long"
		})}
	{/if}
{/snippet}

<div class="main-content">
	{#if showOverlay}
		<button
			class="overlay"
			onclick={() => (showOverlay = false)}
			onkeydown={(e) => e.key === "Escape" && (showOverlay = false)}
		>
			<div class="overlay-content">
				<div class="overlay-desc">
					{@render dateRangeInfo()}, we found
				</div>
				<div class="overlay-count">
					{$articleCount.toLocaleString()} news articles
				</div>

				<div class="overlay-desc">
					about trans issues, <span class="icon"
						><Pointer size={4} color="black" /></span
					> explore them all
				</div>
			</div>
		</button>
	{/if}

	<SigmaMap
		allData={processedData}
		visibleData={$filteredData}
		dateRange={$dateRange}
		onShare={handleShare}
		onDownload={handleDownload}
		height={showOverlay ? "100vh" : "calc(100vh - 300px)"}
	/>

	{#if !showOverlay}
		<div transition:fade>
			<Histogram data={processedData} {dateRange} {minDate} {maxDate} />

			<div class="selection-info">
				{@render dateRangeInfo()},
				<b>{$articleCount.toLocaleString()}</b> articles match your selections
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	// Color variables
	$primary-color: #111;
	$hover-color: #444;
	$light-gray: #f3f3f3;
	$text-dark: #333;
	$text-medium: #444;
	$placeholder-color: #aaa;

	.main-content {
		// height: 00px;
		font-family: "Inter", sans-serif;
		position: relative;
		overflow: hidden;
	}

	.overlay {
		position: absolute;
		z-index: 2000;
		height: 100%;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: #ffffff;
		background: radial-gradient(
			circle,
			rgba(255, 255, 255, 1) 10%,
			rgba(255, 255, 255, 0.5) 50%,
			rgba(255, 255, 255, 0) 100%
		);

		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		text-align: center;

		&-content {
			max-width: calc(100% - 40px);
		}

		&-desc {
			font-size: 1.6rem;
			color: $text-dark;
		}

		&-count {
			font-size: 6rem;
			font-weight: bold;
			margin-bottom: 1rem;
			color: $primary-color;
		}

		.explore-btn {
			background: none;
			margin: 0px;
			padding: 0px;
			font-family: inherit;
			font-size: inherit;
			font-weight: inherit;
			color: inherit;
			cursor: pointer;
			border: none;
			outline: none;
		}
	}

	.button-row {
		display: flex;
		gap: 16px;
		justify-content: center;

		button {
			background: $primary-color;
			color: #fff;
			border: none;
			border-radius: 6px;
			padding: 12px 24px;
			font-size: 1rem;
			cursor: pointer;
			font-weight: 500;
			transition: background 0.2s;

			&:hover {
				background: $hover-color;
			}
		}
	}

	.icon {
		display: inline-flex;
		width: 24px;
		vertical-align: middle;
	}

	.selection-info {
		text-align: right;
		margin: 1rem 2rem;
	}
</style>
