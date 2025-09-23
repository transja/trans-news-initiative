<script>
	import { ChevronDown } from "@lucide/svelte";

	let {
		label,
		options,
		value = $bindable(),
		placeholder = "Select an option",
		class: className = ""
	} = $props();

	let showDropdown = $state(false);
	let focusedIndex = $state(-1);
	let wrapperEl;

	function handleSelect(option) {
		value = option;
		showDropdown = false;
	}

	function handleKeydown(event) {
		if (!showDropdown) {
			if (event.key === "Enter" || event.key === "ArrowDown") {
				showDropdown = true;
			}
			return;
		}
		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				focusedIndex = (focusedIndex + 1) % options.length;
				break;
			case "ArrowUp":
				event.preventDefault();
				focusedIndex = (focusedIndex - 1 + options.length) % options.length;
				break;
			case "Enter":
				event.preventDefault();
				if (focusedIndex > -1) {
					handleSelect(options[focusedIndex]);
				}
				break;
			case "Escape":
				showDropdown = false;
				break;
		}
	}

	$effect(() => {
		if (!showDropdown) focusedIndex = -1;
	});

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
</script>

<div class={`filter-control ${className}`} use:clickOutside bind:this={wrapperEl}>
	<div class="input-wrapper">
		<label class="filter-control__label">{label}</label>
		<button
			class="filter-control__input"
			on:click={() => (showDropdown = !showDropdown)}
			on:keydown={handleKeydown}
			aria-expanded={showDropdown}
		>
			<span>{value || placeholder}</span>
			<ChevronDown size={16} class="chevron" />
		</button>
		{#if showDropdown}
			<div class="dropdown-options" use:positionDropdown>
				{#each options as option, i}
					<div
						class="dropdown-option"
						class:focused={i === focusedIndex}
						on:mouseenter={() => (focusedIndex = i)}
						on:click={() => handleSelect(option)}
					>
						{#if $$slots.option}
							<slot name="option" {option}></slot>
						{:else}
							{option}
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

		.input-wrapper {
			display: flex;
			flex-direction: column;
			gap: 0.25rem;
			flex-grow: 1;
			position: relative;
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
		justify-content: space-between;
		text-align: left;
		width: 100%;
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

		&:focus {
			outline: 2px solid transparent;
			outline-offset: 2px;
			border-color: #3b82f6;
			box-shadow: 0 0 0 2px rgb(59 130 230 / 40%);
		}
	}

	.dropdown-options {
		background-color: #fff;
		border-radius: 0.375rem;
		border: 1px solid #d1d5db;
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1),
			0 2px 4px -2px rgb(0 0 0 / 0.1);
		list-style: none;
		margin: 0;
		margin-top: 0.25rem;
		padding: 0.25rem;
		position: absolute;
		z-index: 10;
		width: 100%;
		max-height: 200px;
		overflow-y: auto;
	}

	.dropdown-option {
		padding: 0.5rem;
		cursor: pointer;
		white-space: nowrap;
		border-radius: 2px;

		&:hover,
		&.focused {
			background: #f0f0f0;
		}
	}

	.chevron {
		transition: transform 0.2s;
	}

	button[aria-expanded="true"] .chevron {
		transform: rotate(180deg);
	}
</style>
