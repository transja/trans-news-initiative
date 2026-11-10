<script>
	import { getContext } from "svelte";

	import MethodologyTable from "$components/MethodologyTable.svelte";
	import DataCta from "$components/DataCta.svelte";
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
		<div class="data-cta-wrapper">
			<DataCta />
		</div>
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

	.data-cta-wrapper {
		margin-top: 3rem;
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

	@media (max-width: 600px) {
		h2 {
			font-size: var(--32px);
		}

		p,
		li {
			font-size: var(--14px);
		}
	}
</style>
