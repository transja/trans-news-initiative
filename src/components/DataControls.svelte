<script>
	let { data, filters = $bindable() } = $props();

	const topics = new Set(data.map((d) => d.topic));
	const publications = new Set(data.map((d) => d.media_name));
	const allTopics = ["All", ...topics];
	const allPublications = ["All", ...publications];

	// Create derived values for the date input strings
	const dateRangeStartString = $derived(
		filters.dateRange.start.toISOString().split("T")[0]
	);
	const dateRangeEndString = $derived(
		filters.dateRange.end.toISOString().split("T")[0]
	);

	function handleDateChange(event, part) {
		const value = event.currentTarget.value;
		const [year, month, day] = value.split("-").map(Number);
		if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
			const newDate = new Date(Date.UTC(year, month - 1, day));
			if (part === "start") {
				filters.dateRange.start = newDate;
			} else {
				filters.dateRange.end = newDate;
			}
		}
	}
</script>

<div class="filter-bar">
	<div class="filter-control">
		<div class="input-wrapper">
			<label for="topics-select" class="filter-control__label">Topic</label>
			<select
				id="topics-select"
				class="filter-control__input"
				bind:value={filters.topic}
			>
				{#each allTopics as topic}
					<option value={topic}>{topic}</option>
				{/each}
			</select>
		</div>
	</div>

    <div class="filter-control">
        <div class="input-wrapper">
			<label for="publications-select">Publication</label>
			<select id="publications-select" class="filter-control__input" bind:value={filters.publication}>
				{#each allPublications as publication}
					<option value={publication}>{publication}</option>
				{/each}
			</select>
		</div>
    </div>

	<div class="filter-control">
		<div class="input-wrapper">
			<label for="date-range-start">Start Date</label>
			<input
				type="date"
				id="date-range-start"
				value={dateRangeStartString}
				oninput={(e) => handleDateChange(e, "start")}
			/>
		</div>
		<div class="input-wrapper">
			<label for="date-range-end">End Date</label>
			<input
				type="date"
				id="date-range-end"
				value={dateRangeEndString}
				oninput={(e) => handleDateChange(e, "end")}
			/>
		</div>
	</div>
</div>

<style lang="scss">
	:global {
		.filter-bar {
			display: flex;
			flex-wrap: wrap;
			align-items: flex-end;
			gap: 1rem;
			font-family: system-ui, sans-serif;
		}

		.filter-control {
			display: flex;

			gap: 0.25rem;
			min-width: 180px;

			.input-wrapper {
				display: flex;
				flex-direction: column;
				gap: 0.25rem;
			}
		}

		.filter-control__label {
			font-size: 0.75rem;
			font-weight: 600;
			color: #4b5563;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			padding-left: 0.25rem;
		}

		.filter-control__input {
			display: flex;
			align-items: center;
			height: 38px;
			padding: 0.5rem 0.75rem;
			border: 1px solid #d1d5db;
			border-radius: 0.375rem;
			background-color: #ffffff;
			box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
			transition:
				border-color 0.2s,
				box-shadow 0.2s;
			cursor: pointer;
			font-size: 0.875rem;
			color: #111827;
			appearance: none;
			background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
			background-position: right 0.5rem center;
			background-repeat: no-repeat;
			background-size: 1.5em 1.5em;
			padding-right: 2.5rem;
		}

		.filter-control__input:focus {
			outline: 2px solid transparent;
			outline-offset: 2px;
			border-color: #3b82f6;
			box-shadow: 0 0 0 2px rgb(59 130 230 / 40%);
		}
	}
</style>
