<script>
	import { Search, ArrowDown, ArrowUp, ArrowLeft, ArrowRight } from "@lucide/svelte";
	import {
		leanOrder,
		leanColors,
		leanTextColors
	} from "../utils/getLeanProperty.js";
	import { getPublicationName } from "../utils/getPublicationName.js";

	let { articles = [] } = $props();

	// State
	let sortKey = $state("publish_date");
	let sortDirection = $state("desc");
	let currentPage = $state(1);
	let itemsPerPage = 10;
	let searchTerm = $state("");

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

	function getPaginationButtons() {
		const buttons = [];
		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) buttons.push(i);
		} else {
			buttons.push(1, 2, 3);
			if (currentPage > 4 && currentPage < totalPages - 3) {
				buttons.push("...");
				buttons.push(currentPage - 1, currentPage, currentPage + 1);
			}
			buttons.push("...");
			buttons.push(totalPages - 2, totalPages - 1, totalPages);
		}
		return [...new Set(buttons)];
	}
</script>

<div class="article-table-container">
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
							PUB. LEAN
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

	{#if totalPages > 1}
		<div class="pagination">
			<button
				class="arrow-button"
				onclick={() => (currentPage -= 1)}
				disabled={currentPage === 1}><ArrowLeft size={14} /> Previous</button
			>
			<div class="page-buttons">
				{#each getPaginationButtons() as page}
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
				disabled={currentPage === totalPages}>Next <ArrowRight size={14} /></button
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
		padding: 1rem;
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

		padding: .5rem 0;
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
		width: 90px;
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
					background-color: var(--color-gray-100);;
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
</style>
