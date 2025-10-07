<script>
	import { ChevronDown, ChevronRight } from "@lucide/svelte";

	let {
		label,
		options,
		groupValue = $bindable(),
		itemValue = $bindable(),
		groupKey = "group",
		itemsKey = "items",
		sortOrder = [],
		groupColors = {},
		groupTextColors = {},
		class: className = ""
	} = $props();

	let showDropdown = $state(false);
	let wrapperEl;
	let openGroups = $state(new Set());

	let isGroupSelected = $derived(
		groupValue && groupValue !== "All" && itemValue === "All"
	);

	function getGroupStyle(groupName) {
		if (!groupName) return "";
		const backgroundColor = groupColors[groupName] ?? groupColors.unknown;
		const color = groupTextColors[groupName] ?? groupTextColors.unknown;
		return `background-color: ${backgroundColor}; color: ${color}`;
	}

	let selectedGroupStyle = $derived(
		isGroupSelected ? getGroupStyle(groupValue) : ""
	);

	function toggleGroup(groupName) {
		const newSet = new Set(openGroups);
		if (newSet.has(groupName)) {
			newSet.delete(groupName);
		} else {
			newSet.add(groupName);
		}
		openGroups = newSet;
	}

	function selectAll() {
		itemValue = "All";
		groupValue = "All";
		showDropdown = false;
	}

	function selectGroup(group) {
		itemValue = "All";
		groupValue = group;
		// Do not close dropdown, allowing accordion interaction
	}

	function handleToggleGroupClick(event, groupName) {
		event.stopPropagation();
		toggleGroup(groupName);
	}

	function handleToggleGroupKeydown(event, groupName) {
		event.stopPropagation();
		handleOptionKeydown(event, () => toggleGroup(groupName));
	}

	function selectItem(item) {
		itemValue = item;
		// groupValue will be set to "All" by an effect in Controls.svelte
		showDropdown = false;
	}

	function handleSelectItem(event, item) {
		event.stopPropagation();
		selectItem(item);
	}

	function handleSelectItemKeydown(event, item) {
		event.stopPropagation();
		handleOptionKeydown(event, () => selectItem(item));
	}

	function handleKeydown(event) {
		if (!showDropdown) {
			if (event.key === "Enter" || event.key === "ArrowDown") {
				showDropdown = true;
			}
			return;
		}
		if (event.key === "Escape") {
			showDropdown = false;
		}
	}

	function clickOutside(node) {
		const handleClick = (event) => {
			if (node && !node.contains(event.target)) {
				showDropdown = false;
			}
		};
		document.addEventListener("click", handleClick, true);
		return {
			destroy() {
				document.removeEventListener("click", handleClick, true);
			}
		};
	}

	function positionDropdown(node) {
		const wrapper = wrapperEl;
		if (!wrapper) return;

		const trigger = wrapper.querySelector("button");
		if (!trigger) return;

		const rect = trigger.getBoundingClientRect();
		const spaceBelow = window.innerHeight - rect.bottom;
		const spaceAbove = rect.top;
		const dropdownHeight = 200; // Corresponds to max-height in CSS

		if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
			// Open upwards
			node.style.bottom = `${wrapper.offsetHeight - trigger.offsetTop}px`;
			node.style.top = "auto";
		} else {
			// Open downwards
			node.style.top = `${trigger.offsetTop + trigger.offsetHeight}px`;
			node.style.bottom = "auto";
		}
	}

	let selectedText = $derived(
		(() => {
			if (itemValue && itemValue !== "All") {
				return itemValue;
			}
			if (groupValue && groupValue !== "All") {
				return groupValue;
			}
			return "All";
		})()
	);

	function handleOptionKeydown(event, handler) {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			handler();
		}
	}

	let sortedOptions = $derived(
		(() => {
			if (!sortOrder || sortOrder.length === 0) {
				return options;
			}
			return [...options].sort((a, b) => {
				const indexA = sortOrder.indexOf(a[groupKey]);
				const indexB = sortOrder.indexOf(b[groupKey]);
				if (indexA === -1 && indexB === -1) return 0;
				if (indexA === -1) return 1;
				if (indexB === -1) return -1;
				return indexA - indexB;
			});
		})()
	);
</script>

<div
	class={`filter-control ${className}`}
	use:clickOutside
	bind:this={wrapperEl}
>
	<div class="input-wrapper">
		<label class="filter-control__label" for="nested-select-button"
			>{label}</label
		>
		<button
			id="nested-select-button"
			class="filter-control__input"
			onclick={() => (showDropdown = !showDropdown)}
			onkeydown={handleKeydown}
			aria-expanded={showDropdown}
		>
			<span class:selected-group={isGroupSelected} style={selectedGroupStyle}>
				{selectedText}
			</span>
			<ChevronDown size={16} class="chevron" />
		</button>
		{#if showDropdown}
			<div class="dropdown-options" use:positionDropdown>
				<div
					class="dropdown-option"
					onclick={selectAll}
					onkeydown={(e) => handleOptionKeydown(e, selectAll)}
					role="button"
					tabindex="0"
				>
					All
				</div>
				{#each sortedOptions as group}
					<div class="lean-group">
						<div
							class="dropdown-option group-header"
							onclick={() => selectGroup(group[groupKey])}
							onkeydown={(e) =>
								handleOptionKeydown(e, () => selectGroup(group[groupKey]))}
							role="button"
							tabindex="0"
							aria-expanded={openGroups.has(group[groupKey])}
						>
							<span style={getGroupStyle(group[groupKey])}
								>{group[groupKey]}</span
							>
							<div
								class="chevron-wrapper"
								role="button"
								tabindex="0"
								aria-label={`Toggle ${group[groupKey]} options`}
								onclick={(e) => handleToggleGroupClick(e, group[groupKey])}
								onkeydown={(e) => handleToggleGroupKeydown(e, group[groupKey])}
							>
								{#if openGroups.has(group[groupKey])}
									<ChevronDown size={16} />
								{:else}
									<ChevronRight size={16} />
								{/if}
							</div>
						</div>
						{#if openGroups.has(group[groupKey])}
							<div class="publication-list">
								{#each group[itemsKey] as item}
									<div
										class="dropdown-option publication-option"
										onclick={(e) => handleSelectItem(e, item)}
										onkeydown={(e) => handleSelectItemKeydown(e, item)}
										role="button"
										tabindex="0"
									>
										{item}
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.filter-control {
		display: flex;
		gap: 0.25rem;
		position: relative;
	}

	.input-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex-grow: 1;
		position: relative;
	}

	.filter-control__label {
		font-size: 12px;
		font-weight: 600;
		color: var(--color-gray-1000);
		text-transform: uppercase;
		padding-left: 0.25rem;
	}

	.filter-control__input {
		display: flex;
		align-items: center;
		justify-content: space-between;
		text-align: left;
		width: 100%;
		height: 38px;
		padding: 0.5rem;
		border: 1px solid var(--color-gray-200);
		border-radius: 0.375rem;
		background-color: #ffffff;
		box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
		cursor: pointer;
		font-size: 0.875rem;
		color: #111827;

		&:focus {
			outline: 2px solid transparent;
			outline-offset: 2px;
			border-color: #3b82f6;
			box-shadow: 0 0 0 2px rgb(59 130 230 / 40%);
		}

		&:hover {
			background: var(--color-gray-50);
		}
	}

	.dropdown-options {
		background-color: #fff;
		border-radius: 0.375rem;
		border: 1px solid var(--color-gray-50);
		box-shadow:
			0 4px 6px -1px rgb(0 0 0 / 0.1),
			0 2px 4px -2px rgb(0 0 0 / 0.1);
		list-style: none;
		margin: 0;
		margin-top: 0.25rem;
		padding: 0.25rem;
		position: absolute;
		z-index: 10;
		width: 100%;
		max-height: 300px;
		overflow-y: auto;
	}

	.dropdown-option {
		padding: 0.5rem;
		cursor: pointer;
		white-space: nowrap;
		border-radius: 2px;
		font-weight: 500;

		&:hover {
			background: var(--color-gray-100);
		}
	}

	.group-header {
		font-weight: 700;
		background-color: var(--color-gray-50);
		display: flex;
		justify-content: space-between;
		align-items: center;
		text-transform: uppercase;

		span {
			padding: 0.25rem 0.5rem;
			text-align: center;
			justify-content: center;
			// height: 20px;
			border-radius: 5px;
			text-align: center;
			color: #fff;
			text-transform: uppercase;
			white-space: nowrap;
			font-size: 0.8rem;
			font-weight: 700;
		}
	}

	.publication-option {
		padding-left: 1.5rem;
	}

	.chevron-wrapper {
		padding: 0.25rem;
		border-radius: 4px;
		display: flex;
		align-items: center;
		background-color: var(--color-gray-1000);
		color: var(--color-white);

		&:hover {
			transform: translateY(-2px);
		}
	}

	.chevron {
		transition: transform 0.2s;
	}

	.group-chevron.open {
		transform: rotate(180deg);
	}

	.selected-group {
		padding: 0.25rem 0.5rem;
		border-radius: 5px;
		text-transform: uppercase;
		white-space: nowrap;
		font-size: 0.8rem;
		font-weight: 700;
	}

	:global(button[aria-expanded="true"] .chevron) {
		transform: rotate(180deg);
	}

	.wide {
		min-width: 0;
		flex-shrink: 1;
	}
</style>
