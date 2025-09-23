<script>
	import { ChevronLeft, ChevronRight, X } from "@lucide/svelte";
	import { createEventDispatcher } from "svelte";
	const dispatch = createEventDispatcher();
	let { dateRange = $bindable(), minDate, maxDate } = $props();

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
</script>

<div class="date-picker-wrapper">
	<button class="close-button" on:click={() => dispatch('close')}>
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

<style lang="scss">
	.date-picker-wrapper {
		position: relative;
		display: flex;
		gap: 1rem;
		padding: 1rem;
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
