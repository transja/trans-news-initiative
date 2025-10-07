<script>
	import { ChevronLeft, ChevronRight, X } from "@lucide/svelte";
	import { createEventDispatcher } from "svelte";
	import { isMobile } from "$utils/breakpoints.js";

	const dispatch = createEventDispatcher();
	let { dateRange = $bindable(), minDate, maxDate, closeMonthPicker } = $props();

	let startViewDate = $state(new Date(dateRange.start));
	let endViewDate = $state(new Date(dateRange.end));

	function getMonths(viewDate) {
		return Array.from({ length: 12 }, (_, i) => {
			const monthDate = new Date(viewDate.getFullYear(), i, 15);
			return {
				date: monthDate,
				name: monthDate.toLocaleString("default", { month: "short" })
			};
		});
	}

	const startMonths = $derived(getMonths(startViewDate));
	const endMonths = $derived(getMonths(endViewDate));

	function selectStartMonth(monthDate) {
		const newStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
		dateRange.start = newStart;
		if (newStart > dateRange.end) {
			dateRange.end = new Date(
				monthDate.getFullYear(),
				monthDate.getMonth() + 1,
				0
			);
		}
	}

	function selectEndMonth(monthDate) {
		const newEnd = new Date(
			monthDate.getFullYear(),
			monthDate.getMonth() + 1,
			0
		);
		dateRange.end = newEnd;
		if (newEnd < dateRange.start) {
			dateRange.start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
		}
	}

	const isStartSelected = (d) =>
		d.getFullYear() === dateRange.start.getFullYear() &&
		d.getMonth() === dateRange.start.getMonth();

	const isEndSelected = (d) =>
		d.getFullYear() === dateRange.end.getFullYear() &&
		d.getMonth() === dateRange.end.getMonth();

	function isStartDisabled(monthDate) {
		const monthEnd = new Date(
			monthDate.getFullYear(),
			monthDate.getMonth() + 1,
			0
		);
		return monthEnd < minDate || monthDate > maxDate;
	}

	function isEndDisabled(monthDate) {
		const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
		return (
			monthStart > maxDate || monthStart < dateRange.start || monthStart < minDate
		);
	}

	function nav(dateState, amount) {
		const newDate = new Date(dateState);
		newDate.setFullYear(newDate.getFullYear() + amount);
		return newDate;
	}

	// Mobile picker logic
	let startMonthScroller, startYearScroller, endMonthScroller, endYearScroller;
	const itemHeight = 36;
	let scrollTimeout;

	const allMonths = Array.from({ length: 12 }, (_, i) =>
		new Date(2000, i, 1).toLocaleString("default", { month: "short" })
	);

	const allYears = $derived(
		!minDate || !maxDate
			? []
			: Array.from(
					{ length: maxDate.getFullYear() - minDate.getFullYear() + 1 },
					(_, i) => minDate.getFullYear() + i
				)
	);

	function handleScroll(scroller, part, column) {
		clearTimeout(scrollTimeout);
		scrollTimeout = setTimeout(() => {
			if (!scroller) return;
			const selectedIndex = Math.round(scroller.scrollTop / itemHeight);

			const currentDate = part === "start" ? dateRange.start : dateRange.end;
			const newDate = new Date(currentDate);

			if (column === "month") {
				newDate.setMonth(selectedIndex);
			} else if (column === "year") {
				const year = allYears[selectedIndex];
				if (year) newDate.setFullYear(year);
			}

			if (part === "start") {
				const newStart = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
				dateRange.start = newStart;
				if (newStart > dateRange.end) {
					dateRange.end = new Date(
						newDate.getFullYear(),
						newDate.getMonth() + 1,
						0
					);
				}
			} else {
				// end
				const newEnd = new Date(
					newDate.getFullYear(),
					newDate.getMonth() + 1,
					0
				);
				dateRange.end = newEnd;
				if (newEnd < dateRange.start) {
					dateRange.start = new Date(
						newDate.getFullYear(),
						newDate.getMonth(),
						1
					);
				}
			}
		}, 150);
	}

	function scrollToInitial() {
		if (
			!startMonthScroller ||
			!startYearScroller ||
			!endMonthScroller ||
			!endYearScroller
		)
			return;

		startMonthScroller.scrollTop = dateRange.start.getMonth() * itemHeight;
		const startYearIndex = allYears.indexOf(dateRange.start.getFullYear());
		if (startYearIndex > -1) {
			startYearScroller.scrollTop = startYearIndex * itemHeight;
		}

		endMonthScroller.scrollTop = dateRange.end.getMonth() * itemHeight;
		const endYearIndex = allYears.indexOf(dateRange.end.getFullYear());
		if (endYearIndex > -1) {
			endYearScroller.scrollTop = endYearIndex * itemHeight;
		}
	}

	$effect(() => {
		if ($isMobile) {
			setTimeout(scrollToInitial, 50); // small delay to ensure DOM is ready
		}
	});
</script>

{#if $isMobile}
	<div class="mobile-date-picker-wrapper">
		<button class="close-button" on:click={closeMonthPicker}>
			<X size={18} />
		</button>
		<div class="panel">
			<div class="panel-label">Start Date</div>
			<div class="mobile-picker">
				<div
					class="picker-column"
					bind:this={startMonthScroller}
					on:scroll={(e) => handleScroll(e.currentTarget, "start", "month")}
				>
					<div class="picker-padding"></div>
					{#each allMonths as month}
						<div class="picker-item">{month}</div>
					{/each}
					<div class="picker-padding"></div>
				</div>
				<div
					class="picker-column"
					bind:this={startYearScroller}
					on:scroll={(e) => handleScroll(e.currentTarget, "start", "year")}
				>
					<div class="picker-padding"></div>
					{#each allYears as year}
						<div class="picker-item">{year}</div>
					{/each}
					<div class="picker-padding"></div>
				</div>
				<div class="picker-highlight"></div>
			</div>
		</div>
		<div class="panel">
			<div class="panel-label">End Date</div>
			<div class="mobile-picker">
				<div
					class="picker-column"
					bind:this={endMonthScroller}
					on:scroll={(e) => handleScroll(e.currentTarget, "end", "month")}
				>
					<div class="picker-padding"></div>
					{#each allMonths as month}
						<div class="picker-item">{month}</div>
					{/each}
					<div class="picker-padding"></div>
				</div>
				<div
					class="picker-column"
					bind:this={endYearScroller}
					on:scroll={(e) => handleScroll(e.currentTarget, "end", "year")}
				>
					<div class="picker-padding"></div>
					{#each allYears as year}
						<div class="picker-item">{year}</div>
					{/each}
					<div class="picker-padding"></div>
				</div>
				<div class="picker-highlight"></div>
			</div>
		</div>
	</div>
{:else}
	<div class="date-picker-wrapper">
		<button class="close-button" on:click={() => dispatch("close")}>
			<X size={18} />
		</button>
		<div class="panel">
			<div class="panel-label">Start Month</div>
			<div class="date-picker">
				<div class="header">
					<button
						on:click={() => (startViewDate = nav(startViewDate, -1))}
						class="nav-button"
						disabled={startViewDate.getFullYear() <= minDate.getFullYear()}
					>
						<ChevronLeft size={16} />
					</button>
					<div class="year">{startViewDate.getFullYear()}</div>
					<button
						on:click={() => (startViewDate = nav(startViewDate, 1))}
						class="nav-button"
						disabled={startViewDate.getFullYear() >= maxDate.getFullYear()}
					>
						<ChevronRight size={16} />
					</button>
				</div>
				<div class="months-grid">
					{#each startMonths as month}
						<button
							class="month"
							class:selected={isStartSelected(month.date)}
							disabled={isStartDisabled(month.date)}
							on:click={() => selectStartMonth(month.date)}
						>
							{month.name}
						</button>
					{/each}
				</div>
			</div>
		</div>
		<div class="panel">
			<div class="panel-label">End Month</div>
			<div class="date-picker">
				<div class="header">
					<button
						on:click={() => (endViewDate = nav(endViewDate, -1))}
						class="nav-button"
						disabled={endViewDate.getFullYear() <= dateRange.start.getFullYear()}
					>
						<ChevronLeft size={16} />
					</button>
					<div class="year">{endViewDate.getFullYear()}</div>
					<button
						on:click={() => (endViewDate = nav(endViewDate, 1))}
						class="nav-button"
						disabled={endViewDate.getFullYear() >= maxDate.getFullYear()}
					>
						<ChevronRight size={16} />
					</button>
				</div>
				<div class="months-grid">
					{#each endMonths as month}
						<button
							class="month"
							class:selected={isEndSelected(month.date)}
							disabled={isEndDisabled(month.date)}
							on:click={() => selectEndMonth(month.date)}
						>
							{month.name}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.date-picker-wrapper {
		position: relative;
		display: flex;
		gap: 1rem;
		padding: 1rem;

		@media (max-width: 600px) {
			flex-direction: column;
		}
	}

	.mobile-date-picker-wrapper {
		display: flex;
		// flex-direction: column;
		gap: 1rem;
		padding: 2.5rem 1rem 1rem;
		position: relative;
		width: calc(100vw - 2rem);
		.panel {
			width: 100%;
		}
	}

	.mobile-picker {
		display: flex;
		justify-content: center;
		position: relative;
		height: 200px;
		-webkit-mask-image: linear-gradient(
			to bottom,
			transparent,
			black 25%,
			black 75%,
			transparent
		);
		mask-image: linear-gradient(
			to bottom,
			transparent,
			black 25%,
			black 75%,
			transparent
		);

	
	}

	.picker-highlight {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 100%;
		height: 36px; /* itemHeight */
		background: rgba(0, 0, 0, 0.05);
		border-top: 1px solid #ddd;
		border-bottom: 1px solid #ddd;
		pointer-events: none;
		border-radius: 4px;
	}

	.picker-column {
		overflow-y: scroll;
		overflow-x: hidden;
		scroll-snap-type: y mandatory;
		-webkit-overflow-scrolling: touch;
		flex: 1;

		&::-webkit-scrollbar {
			display: none;
		}
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.picker-item,
	.picker-padding {
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		scroll-snap-align: center;
		font-size: 1rem;
		text-align: center;
	}

	.picker-padding {
		height: 82px; /* (picker_height - item_height) / 2 */
	}

	.close-button {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		background: none;
		border: none;
		padding: 0.25rem;
		border-radius: 99px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;

		&:hover {
			background-color: #f0f0f0;
		}
	}

	.panel-label {
		font-weight: 600;
		margin-bottom: 0.5rem;
		text-align: center;
		font-size: 0.875rem;
	}

	.date-picker {
		background: white;
		width: 240px;
	}
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.25rem 0.5rem;
		margin-bottom: 0.5rem;
	}
	.year {
		font-weight: 600;
	}
	.nav-button {
		background: none;
		border: 1px solid transparent;
		cursor: pointer;
		border-radius: 4px;
		padding: 0.25rem;
		&:hover {
			background-color: #f0f0f0;
		}
		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}
	.months-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 4px;
	}
	.month {
		padding: 0.5rem;
		border-radius: 4px;
		border: 1px solid transparent;
		background: none;
		cursor: pointer;
		text-align: center;
		font-size: 0.875rem;

		&:hover {
			background-color: #f0f0f0;
			border-color: #ddd;
		}

		&.selected {
			background-color: #e5bdf5;
		}

		&:disabled {
			color: #ccc;
			cursor: not-allowed;
			background-color: transparent;
		}
	}
</style>
