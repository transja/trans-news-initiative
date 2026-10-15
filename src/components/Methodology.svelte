<script>
	import { getContext } from "svelte";

	import MethodologyTable from "$components/MethodologyTable.svelte";
	import themeData from "$data/themeDefs.csv";

	const copy = getContext("copy");

	const tables = { ...copy, themeData };
</script>

<section id="methodology">
	<div class="inner">
		<h2>Methods</h2>
		<p class="error-form">{@html copy.errorForm}</p>
		{#each copy.methods as block, i (i)}
			{#if block.type === "hed"}
				<h3>{@html block.value}</h3>
			{:else if block.type === "text"}
				<p>{@html block.value}</p>
			{:else if block.type === "list"}
				<ul>
					{#each block.value as item, j (j)}
						<li>{@html item.value}</li>
					{/each}
				</ul>
			{:else if block.type === "table" && tables[block.value]}
				<MethodologyTable data={tables[block.value]} />
			{/if}
		{/each}
	</div>
</section>

<style>
	#methodology {
		width: 100%;
		position: absolute;
		padding: 10rem 1rem 1rem 1rem;
		font-family: var(--sans);
	}

	h2 {
		font-weight: 700;
	}

	h3 {
		font-weight: 700;
		margin: 0;
	}

	p,
	li {
		font-size: var(--16px);
		line-height: 1.65;
		margin: 0 0 1rem 0;
	}

	ul {
		margin: 0 0 1rem 0;
		padding-left: 1.5rem;
	}

	li {
		margin-bottom: 0.5rem;
	}

	.error-form {
		font-style: italic;
		padding: 1rem;
		background: #f9f9f9;
	}

	:global(#methodology a:hover) {
		color: var(--color-gray-600);
		text-decoration-color: var(--color-gray-600);
	}

	.inner {
		max-width: 720px;
		margin: 0 auto 4rem auto;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.methodology-wrapper {
		max-width: 720px;
	}

	.org-contributor-wrapper {
		width: 100%;
		display: flex;
		flex-direction: row;
		gap: 10rem;
	}

	.orgs,
	.contributors {
		width: 50%;
		display: flex;
		flex-direction: column;
	}

	.orgs p,
	.contributors p {
		font-size: var(--16px);
		margin: 0;
	}

	.logo {
		width: 200px;
		transition: transform 0.25s linear;
	}

	.logo:hover {
		transform: translateY(-2px);
	}

	.org,
	.contributor {
		display: flex;
		flex-direction: column;
		gap: 0;
		border-top: 1px solid var(--color-gray-200);
		padding-top: 1rem;
		margin-bottom: 4rem;
	}

	.org {
		gap: 1rem;
	}

	.contributors p.name {
		font-weight: 700;
		font-size: var(--20px);
	}

	.contributors p.title {
		font-style: italic;
	}

	.contributors p.bio {
		margin-top: 1rem;
	}

	@media (max-width: 900px) {
		.org-contributor-wrapper {
			gap: 4rem;
		}
	}

	@media (max-width: 720px) {
		.org-contributor-wrapper {
			flex-direction: column;
		}

		.orgs,
		.contributors {
			width: 100%;
		}
	}

	@media (max-width: 600px) {
		#about {
			padding: 8rem 1rem 1rem 1rem;
		}

		h2 {
			font-size: var(--32px);
		}

		p,
		.orgs p,
		.contributors p {
			font-size: var(--14px);
		}
	}
</style>
