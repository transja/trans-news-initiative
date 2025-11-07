<script>
	import {
		Search,
		ArrowDown,
		ArrowUp,
		ArrowLeft,
		ArrowRight,
		ArrowLeftRight
	} from "@lucide/svelte";
	import {
		leanOrder,
		leanColors,
		leanTextColors
	} from "../utils/getLeanProperty.js";
	import { getPublicationName } from "../utils/getPublicationName.js";
	import Info from "$components/Info.svelte";

	let { articles = [] } = $props();

	// utils
	import { isMobile } from "$utils/breakpoints.js";

	const uniqueArticles = Array.from(
		new Map(articles.map((item) => [item.url, item])).values()
	);

	// State
	let sortKey = $state("publish_date");
	let sortDirection = $state("desc");
	let currentPage = $state(1);
	let itemsPerPage = $derived($isMobile ? 5 : 10);
	let searchTerm = $state("");
	let tableContainerEl;

	// Derived state
	const filteredArticles = $derived(
		articles.filter((article) =>
			article.title.toLowerCase().includes(searchTerm.toLowerCase())
		)
	);

	const sortedArticles = $derived(
		[...filteredArticles].sort((a, b) => {
			const valA = a[sortKey];
			const valB = b[sortKey];

			if (sortKey === "publish_date") {
				return sortDirection === "asc"
					? new Date(valA) - new Date(valB)
					: new Date(valB) - new Date(valA);
			}

			if (sortKey === "lean") {
				const indexA = leanOrder.indexOf(valA);
				const indexB = leanOrder.indexOf(valB);
				return sortDirection === "asc" ? indexA - indexB : indexB - indexA;
			}

			if (valA < valB) return sortDirection === "asc" ? -1 : 1;
			if (valA > valB) return sortDirection === "asc" ? 1 : -1;
			return 0;
		})
	);

	const totalPages = $derived(Math.ceil(sortedArticles.length / itemsPerPage));
	const paginatedArticles = $derived(
		sortedArticles.slice(
			(currentPage - 1) * itemsPerPage,
			currentPage * itemsPerPage
		)
	);

	// Methods
	function setSort(key) {
		if (sortKey === key) {
			sortDirection = sortDirection === "asc" ? "desc" : "asc";
		} else {
			sortKey = key;
			sortDirection = "desc";
		}
		currentPage = 1;
	}

	function formatDate(dateString) {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric"
		});
	}

	// Svelte usage example:
	//  $: buttons = getPaginationButtons(totalPages, currentPage, $isMobile);

	function getPaginationButtons(totalPages, currentPage, isMobile) {
		// Guard rails
		totalPages = Math.max(1, Number(totalPages) || 1);
		currentPage = Math.min(Math.max(1, Number(currentPage) || 1), totalPages);

		// Mobile shows fewer buttons
		const boundaryCount = 1; // always show first & last groups
		const siblingCount = isMobile ? 0 : 1; // fewer neighbors on mobile

		const range = (start, end) => {
			const out = [];
			for (let i = start; i <= end; i++) out.push(i);
			return out;
		};

		// 1) Always-visible boundaries
		const startPages = range(1, Math.min(boundaryCount, totalPages));
		const endPages = range(
			Math.max(totalPages - boundaryCount + 1, boundaryCount + 1),
			totalPages
		);

		// 2) Middle window around current page
		const middleStart = Math.max(
			Math.min(
				currentPage - siblingCount,
				// keep room so window doesn’t push past the end
				totalPages - boundaryCount - siblingCount
			),
			boundaryCount + 1
		);

		const middleEnd = Math.min(
			Math.max(
				currentPage + siblingCount,
				// keep room so window doesn’t push past the start
				boundaryCount + 1
			),
			endPages.length ? endPages[0] - 1 : totalPages
		);

		const middlePages =
			middleStart <= middleEnd ? range(middleStart, middleEnd) : [];

		// 3) Assemble with ellipses as needed
		const showLeftEllipsis = middleStart > boundaryCount + 1;
		const showRightEllipsis = middleEnd < (endPages[0] ?? totalPages) - 1;

		const buttons = [
			...startPages,
			...(showLeftEllipsis ? ["…"] : []),
			...middlePages,
			...(showRightEllipsis ? ["…"] : []),
			...endPages
		];

		return buttons;
	}

	function handleTableKeydown(event) {
        if (event.key === 'Escape') {
            event.stopPropagation();
            event.preventDefault();

            if (tableContainerEl) {
                tableContainerEl.focus();
            }
        }
    }
</script>

<div 
	class="article-table-container" 
	bind:this={tableContainerEl}
	onkeydown={handleTableKeydown}
    tabindex="-1"
    aria-label="Articles table and controls"
>
	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<th style="width: 50%;">
						<div class="header-content search-header">
							<!-- <label for="search-headline">HEADLINE</label> -->
							<div class="search-input-wrapper">
								<Search size={16} />
								<input
									id="search-headline"
									type="text"
									bind:value={searchTerm}
									placeholder="HEADLINE"
								/>
							</div>
						</div>
					</th>
					<th>
						<button
							class="header-button"
							onclick={() => setSort("publish_date")}
						>
							DATE
							{#if sortKey === "publish_date"}
								{#if sortDirection === "desc"}
									<ArrowDown size={14} />
								{:else}
									<ArrowUp size={14} />
								{/if}
							{/if}
						</button>
					</th>
					<th>
						<button class="header-button" onclick={() => setSort("media_name")}>
							PUBLICATION
							{#if sortKey === "media_name"}
								{#if sortDirection === "desc"}
									<ArrowDown size={14} />
								{:else}
									<ArrowUp size={14} />
								{/if}
							{/if}
						</button>
					</th>
					<th>
						<button class="header-button" onclick={() => setSort("lean")}>
							PUB. LEAN <Info instance="lean" />
							{#if sortKey === "lean"}
								{#if sortDirection === "desc"}
									<ArrowDown size={14} />
								{:else}
									<ArrowUp size={14} />
								{/if}
							{/if}
						</button>
					</th>
				</tr>
			</thead>
			<tbody>
				{#each paginatedArticles as article (article.url)}
					<tr>
						<td>
							<a href={article.url} target="_blank" rel="noopener noreferrer">
								{article.title}
							</a>
						</td>
						<td>{formatDate(article.publish_date)}</td>
						<td>{getPublicationName(article.media_name)}</td>
						<td>
							<span
								class="lean-pill"
								style="background-color: {leanColors[article.lean] ??
									leanColors.unknown};
									 color: {leanTextColors[article.lean] ?? leanTextColors.unknown}"
							>
								{article.lean}
							</span>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="scroll-indicator">
		Scroll to see more <ArrowLeftRight size={14} />
	</div>

	{#if totalPages > 1}
		<div class="pagination">
			<button
				class="arrow-button"
				onclick={() => (currentPage -= 1)}
				disabled={currentPage === 1}
				><ArrowLeft size={14} />
				Previous</button
			>
			<div class="page-buttons">
				{#each getPaginationButtons(totalPages, currentPage, $isMobile) as page}
					{#if typeof page === "number"}
						<button
							class:active={currentPage === page}
							onclick={() => (currentPage = page)}
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
				onclick={() => (currentPage += 1)}
				disabled={currentPage === totalPages}
				>Next
				<ArrowRight size={14} /></button
			>
		</div>
	{/if}
</div>

<style lang="scss">
	.article-table-container {
		color: var(--color-gray-700);
		font-size: 0.8rem;
	}
	.table-wrapper {
		overflow: hidden;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th,
	td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #eee;
	}
	th {
		background-color: #f9f9f9;
		font-weight: 700;
		font-size: var(--12px);
		text-transform: uppercase;
		color: #555;
	}
	tbody tr:last-child td {
		border-bottom: none;
	}
	.header-content,
	.header-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.header-button {
		background: none;
		border: none;
		cursor: pointer;
		font-weight: 700;
		font-size: var(--12px);
		text-transform: uppercase;

		padding: 0.5rem 0;
	}
	.search-header {
		flex-direction: row;
		align-items: center;
		justify-content: flex-start;
		gap: 1rem;
		width: 100%;
		.search-input-wrapper {
			display: flex;
			align-items: center;
			border: none;
			border-radius: 4px;
			padding: 0;
			background-color: transparent;
			border-bottom: 1px solid #999;
			border-radius: 0;
			color: var(--color-gray-1000);
			input {
				border: none;
				outline: none;
				background: none;
				font-weight: 700;
				color: var(--color-gray-1000);
			}
			input::placeholder {
				font-weight: 700;
				color: var(--color-gray-1000);
			}
			input:-internal-autofill-selected {
				background-color: transparent;
			}
		}
	}
	td a {
		text-decoration: none;
		color: var(--color-gray-700);
		&:hover {
			text-decoration: underline;
		}
	}
	.lean-pill {
		padding: 0.4rem 0.75rem;
		border-radius: 5px;
		text-transform: uppercase;
		white-space: nowrap;
		font-weight: 700;
		font-size: 10px;
		width: 80px;
		text-align: center;
		display: inline-block;
	}
	.pagination {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1rem;
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

	.scroll-indicator {
		display: none;
	}

	@media (max-width: 1000px) {
		.scroll-indicator {
			display: inline-block;
			cursor: pointer;
			color: var(--color-gray-500);
			font-size: var(--12px);
			text-transform: uppercase;
			font-weight: 700;
			gap: 0.5rem;
			margin-top: 1rem;
			margin-bottom: 1rem;
			margin-left: 1rem;
			margin-right: 1rem;
			text-align: center;
			justify-content: center;
			align-items: center;
			display: flex;
			flex-direction: row;
			align-items: center;
			justify-content: right;
			gap: 0.5rem;
		}

		.table-wrapper {
			overflow-x: auto;
		}
		table {
			min-width: 800px;
		}
	}
</style>
