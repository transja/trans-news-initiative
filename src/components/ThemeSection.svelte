<script>
	import { ArrowLeft, ArrowRight } from "@lucide/svelte";
	import Guidance from "./Guidance.svelte";
	import EventCard from "./EventCard.svelte";
	import { isMobile } from "$utils/breakpoints.js";

	let { groupedByEvent, xDomain } = $props();

	let openAccordionItems = $state([]);
	let currentPage = $state(1);
	let initialized = false;

	const itemsPerPage = $derived($isMobile ? 25 : 50);

	const totalPages = $derived(
		Math.max(1, Math.ceil(groupedByEvent.length / itemsPerPage))
	);

	const paginatedEvents = $derived(
		groupedByEvent.slice(
			(currentPage - 1) * itemsPerPage,
			currentPage * itemsPerPage
		)
	);

	const rangeStart = $derived(
		groupedByEvent.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
	);
	const rangeEnd = $derived(
		Math.min(currentPage * itemsPerPage, groupedByEvent.length)
	);

	$effect(() => {
		void groupedByEvent;
		void itemsPerPage;
		if (currentPage > totalPages) currentPage = totalPages;
	});

	$effect(() => {
		if (!initialized && paginatedEvents.length > 0) {
			openAccordionItems = [paginatedEvents[0].name];
			initialized = true;
		}
	});

	function goToPage(page) {
		currentPage = page;
		const first = groupedByEvent[(page - 1) * itemsPerPage];
		openAccordionItems = first ? [first.name] : [];
	}

	function getPaginationButtons(totalPages, currentPage, isMobile) {
		totalPages = Math.max(1, Number(totalPages) || 1);
		currentPage = Math.min(Math.max(1, Number(currentPage) || 1), totalPages);

		const boundaryCount = 1;
		const siblingCount = isMobile ? 0 : 1;

		const range = (start, end) => {
			const out = [];
			for (let i = start; i <= end; i++) out.push(i);
			return out;
		};

		const startPages = range(1, Math.min(boundaryCount, totalPages));
		const endPages = range(
			Math.max(totalPages - boundaryCount + 1, boundaryCount + 1),
			totalPages
		);

		const middleStart = Math.max(
			Math.min(
				currentPage - siblingCount,
				totalPages - boundaryCount - siblingCount
			),
			boundaryCount + 1
		);

		const middleEnd = Math.min(
			Math.max(currentPage + siblingCount, boundaryCount + 1),
			endPages.length ? endPages[0] - 1 : totalPages
		);

		const middlePages =
			middleStart <= middleEnd ? range(middleStart, middleEnd) : [];

		const showLeftEllipsis = middleStart > boundaryCount + 1;
		const showRightEllipsis = middleEnd < (endPages[0] ?? totalPages) - 1;

		return [
			...startPages,
			...(showLeftEllipsis ? ["…"] : []),
			...middlePages,
			...(showRightEllipsis ? ["…"] : []),
			...endPages
		];
	}
</script>

<div class="theme-section-container">
	<Guidance />
	<div class="events-container">
		{#if groupedByEvent.length}
			<p class="page-meta">
				Showing {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} of
				{groupedByEvent.length.toLocaleString()} events
			</p>
		{/if}

		<div class="accordion">
			{#each paginatedEvents as event, i (event.name)}
				{@const eventIndex = (currentPage - 1) * itemsPerPage + i}
				{@const isOpen = openAccordionItems.includes(event.name)}
				<EventCard
					{event}
					{isOpen}
					{eventIndex}
					{xDomain}
					onToggle={() => {
						if (isOpen) {
							openAccordionItems = openAccordionItems.filter(
								(item) => item !== event.name
							);
						} else {
							openAccordionItems = [...openAccordionItems, event.name];
						}
					}}
				/>
			{/each}
		</div>

		{#if totalPages > 1}
			<div class="pagination">
				<button
					class="arrow-button"
					onclick={() => goToPage(currentPage - 1)}
					disabled={currentPage === 1}
				>
					<ArrowLeft size={14} />
					Previous
				</button>
				<div class="page-buttons">
					{#each getPaginationButtons(totalPages, currentPage, $isMobile) as page}
						{#if typeof page === "number"}
							<button
								class:active={currentPage === page}
								onclick={() => goToPage(page)}
							>
								{page}
							</button>
						{:else}
							<span>{page}</span>
						{/if}
					{/each}
				</div>
				<button
					class="arrow-button"
					onclick={() => goToPage(currentPage + 1)}
					disabled={currentPage === totalPages}
				>
					Next
					<ArrowRight size={14} />
				</button>
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.theme-section-container {
		display: flex;
		flex-direction: row;
		gap: 2rem;
	}

	.events-container {
		padding-top: 1.5rem;
		width: calc(100% - 300px - 2rem);

		h2 {
			font-size: 2rem;
			margin-bottom: 1.5rem;
			font-weight: 400;
			strong {
				font-weight: 600;
			}
		}
	}

	.page-meta {
		margin: 0 0 1rem;
		font-size: 0.9rem;
		color: var(--color-gray-600, #666);
	}

	.accordion {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.pagination {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1.5rem;

		.page-buttons {
			display: flex;
			gap: 0.25rem;
			align-items: center;

			button {
				border: 1px solid var(--color-gray-200);
				border-radius: 4px;
				background-color: #fff;
				padding: 0.5rem 0.75rem;
				cursor: pointer;

				&.active {
					background-color: var(--color-gray-100);
					font-weight: 700;
				}
			}

			span {
				padding: 0.5rem;
			}
		}

		.arrow-button {
			background: none;
			border: none;
			cursor: pointer;
			font-weight: 600;
			display: flex;
			align-items: center;
			gap: 0.5rem;
			line-height: 0;

			&:disabled {
				color: var(--color-gray-500);
				cursor: not-allowed;
			}
		}
	}

	@media (max-width: 1000px) {
		.theme-section-container {
			display: flex;
			flex-direction: column;

			.events-container {
				width: 100%;
			}
		}
	}
</style>
