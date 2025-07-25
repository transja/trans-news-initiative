<script>
	import { ChevronLeft, ChevronRight } from "@lucide/svelte";

	// Props
	let { data, dateRange } = $props();

	// Process histogram data - group articles by month
	const histogramData = $derived.by(() => {
		const monthCounts = new Map();

		data.forEach((item) => {
			if (!item.publish_date) return;
			const date = new Date(item.publish_date);
			if (isNaN(date.getTime())) return; // Skip invalid dates
			const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
			monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1);
		});

		return Array.from(monthCounts.entries())
			.map(([month, count]) => ({
				month: new Date(`${month}-01T12:00:00Z`),
				count
			}))
			.sort((a, b) => a.month - b.month);
	});

	// Scrubber state
	let isDragging = $state(false);
	let dragType = $state(""); // 'start', 'end', or 'range'

	// Handle scrubber interactions
	function handleScrubberStart(event, type) {
		isDragging = true;
		dragType = type;
		event.preventDefault();
	}

	function handleScrubberMove(event) {
		if (!isDragging || histogramData.length === 0) return;

		const rect = event.currentTarget.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const percent = Math.max(0, Math.min(1, x / rect.width));
		const totalMonths = histogramData.length;
		const hoverIndex = Math.round(percent * (totalMonths - 1));

		const startDate = $dateRange[0];
		const endDate = $dateRange[1];

		const startIndex = findClosestMonthIndex(startDate);
		// For finding the end index, we should use the start of the month
		// to avoid snapping to the next month.
		const dateForEndIndexSearch = new Date(
			Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1)
		);
		const endIndex = findClosestMonthIndex(dateForEndIndexSearch);

		let newStartIndex = startIndex;
		let newEndIndex = endIndex;

		if (dragType === "start") {
			newStartIndex = Math.min(hoverIndex, endIndex);
		} else if (dragType === "end") {
			newEndIndex = Math.max(hoverIndex, startIndex);
		}

		newStartIndex = Math.max(0, Math.min(totalMonths - 1, newStartIndex));
		newEndIndex = Math.max(0, Math.min(totalMonths - 1, newEndIndex));

		const finalStartDate = new Date(histogramData[newStartIndex].month);

		const finalEndDate = new Date(histogramData[newEndIndex].month);
		const finalEndOfMonth = new Date(
			Date.UTC(finalEndDate.getUTCFullYear(), finalEndDate.getUTCMonth() + 1, 0)
		);

		$dateRange = [finalStartDate, finalEndOfMonth];
	}

	function findClosestMonthIndex(targetDate) {
		if (histogramData.length === 0) return -1;
		let closestIndex = 0;
		let minDiff = Math.abs(
			targetDate.getTime() - histogramData[0].month.getTime()
		);

		for (let i = 1; i < histogramData.length; i++) {
			const diff = Math.abs(
				targetDate.getTime() - histogramData[i].month.getTime()
			);
			if (diff < minDiff) {
				minDiff = diff;
				closestIndex = i;
			}
		}
		return closestIndex;
	}

	function handleScrubberEnd() {
		isDragging = false;
		dragType = "";
	}

	let chartWidth = $state(0);
	let histogramBarWidth = $derived(
		histogramData.length > 0 ? chartWidth / histogramData.length : 0
	);

	// Tooltip state
	let hoveredIndex = $state(-1);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	const chartHeight = 120; // Must match the CSS height for .histogram-chart

	function handleChartMouseMove(event) {
		const rect = event.currentTarget.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const index = Math.floor(x / histogramBarWidth);

		if (index >= 0 && index < histogramData.length) {
			hoveredIndex = index;
			const bar = histogramData[index];
			const maxCount = Math.max(...histogramData.map((d) => d.count));
			const barHeight = maxCount > 0 ? (bar.count / maxCount) * chartHeight : 0;

			tooltipX = (index + 0.5) * histogramBarWidth;
			tooltipY = chartHeight - barHeight;
		} else {
			hoveredIndex = -1;
		}
	}

	function handleChartMouseLeave() {
		hoveredIndex = -1;
	}

	$inspect(histogramBarWidth);
</script>

<div class="histogram-controls">
	<div
		class="histogram"
		onmousemove={handleChartMouseMove}
		onmouseleave={handleChartMouseLeave}
	>
		{#if hoveredIndex !== -1}
			<div class="tooltip" style="top: {tooltipY}px; left: {tooltipX}px;">
				{histogramData[hoveredIndex].count} articles
			</div>
		{/if}
		<div class="histogram-chart" bind:clientWidth={chartWidth}>
			{#if histogramData.length > 0}
				{@const maxCount = Math.max(...histogramData.map((d) => d.count))}
				{#each histogramData as item, i}
					{@const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0}
					{@const isInRange =
						item.month >= $dateRange[0] && item.month <= $dateRange[1]}
					<div
						class="histogram-bar"
						style="height: {height}%"
						class:in-range={isInRange}
						class:hovered={i === hoveredIndex}
					></div>
				{/each}
			{:else}
				<div class="histogram-empty">No data available</div>
			{/if}
		</div>

		<div class="histogram-xaxis">
			{#each histogramData as item, i (item.month)}
				{#if i === 0 || item.month.getUTCFullYear() !== histogramData[i - 1].month.getUTCFullYear()}
					<div class="year-label" style="left: {i * histogramBarWidth}px;">
						{item.month.getUTCFullYear()}
					</div>
				{/if}
			{/each}
		</div>

		{#if $dateRange[0] && $dateRange[1]}
			{#snippet scrubberContent()}
				{@const getMonthPosition = (targetDate, handleType = "start") => {
					if (histogramData.length === 0) return 0;

					// For the end handle, find the index based on the start of its month
					// to prevent it from snapping to the *next* month (e.g., Nov 30 is closer to Dec 1).
					const dateForIndexSearch =
						handleType === "end"
							? new Date(
									Date.UTC(
										targetDate.getUTCFullYear(),
										targetDate.getUTCMonth(),
										1
									)
								)
							: targetDate;

					const monthIndex = findClosestMonthIndex(dateForIndexSearch);
					if (monthIndex === -1) return 0;

					const barWidthPercent = 100 / histogramData.length;
					const percent = (monthIndex / histogramData.length) * 100;

					return handleType === "end" ? percent + barWidthPercent : percent;
				}}
				{@const startPercent = getMonthPosition($dateRange[0], "start")}
				{@const endPercent = getMonthPosition($dateRange[1], "end")}

				<div
					class="histogram-scrubber"
					onmousemove={handleScrubberMove}
					onmouseup={handleScrubberEnd}
					onmouseleave={handleScrubberEnd}
					style:--handle-width="{histogramBarWidth}px"
				>
					<!-- Selected range overlay -->
					<div
						class="scrubber-range"
						style="left: {startPercent}%; width: {endPercent - startPercent}%"
					></div>

					<!-- Start handle -->
					<div
						class="scrubber-handle start"
						style="left: {startPercent}%"
						onmousedown={(e) => handleScrubberStart(e, "start")}
					>
						<ChevronLeft color="white" />
					</div>

					<!-- End handle -->
					<div
						class="scrubber-handle end"
						style="left: {endPercent}%"
						onmousedown={(e) => handleScrubberStart(e, "end")}
					>
						<ChevronRight color="white" />
					</div>
				</div>
			{/snippet}

			{@render scrubberContent()}
		{/if}
	</div>
</div>

<style lang="scss">
	// Color variables
	$primary-color: #f9a011;
	$hover-color:#aa7014;

	$light-gray: #f9a01133;
	$placeholder-color: #aaa;

	.histogram {
		position: relative;
		margin: 1rem 2rem;

		&-controls {
			text-align: center;
		}

		&-chart {
			display: flex;
			align-items: flex-end;
			height: 120px;
		}

		&-bar {
			flex: 1;
			background: $primary-color;
			min-height: 2px;
			// transition: background-color 0.2s;
			cursor: pointer;
			border-right: 1px solid white;
			box-sizing: border-box;
			opacity: 0.25;

			&.hovered {
				background: $hover-color;
				opacity: 0.5;
			}

			&.in-range {
				opacity: 1;
			}

			
		}

		&-empty {
			display: flex;
			align-items: center;
			justify-content: center;
			height: 100%;
			color: $placeholder-color;
			font-size: 1rem;
		}

		&-xaxis {
			position: relative;
			height: 20px;
		}

		&-scrubber {
			position: absolute;
			width: 100%;
			height: 100%;
			top: 0;
			height: 100%;
			border-radius: 4px;
			// margin: 0 20px;
			cursor: pointer;
		}
	}

	.scrubber {
		&-range {
			position: absolute;
			top: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.075);
			border-radius: 4px;
		}

		$handle-size: 20px;
		&-handle {
			position: absolute;
			width: var(--handle-width);
			height: $handle-size;
			width: $handle-size;
			top: calc(50% - $handle-size / 2);
			transform: translateY(-50%);
			background: #000;
			border-radius: 2px;
			cursor: grab;
			transform: translateX(-50%);
			// border: 2px solid white;

			&:active {
				cursor: grabbing;
			}
		}
	}

	.year-label {
		position: absolute;
		top: 4px;
		font-size: 12px;
		color: #000;
		font-weight: 600;
	}

	.tooltip {
		position: absolute;
		background: #000;
		color: white;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 12px;
		pointer-events: none;
		transform: translate(-50%, -110%);
		white-space: nowrap;
		z-index: 10;
	}
</style>
