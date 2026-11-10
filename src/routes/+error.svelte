<script>
	import { page } from "$app/state";

	const links = [
		{ href: "/", label: "Explore the data" },
		{ href: "/about/", label: "About the initiative" },
		{ href: "/methods/", label: "Read the methods" }
	];

	let notFound = $derived(page.status === 404);
</script>

<section id="error-page">
	<div class="inner">
		<p class="status">{page.status}</p>
		<h2>{notFound ? "Page not found" : "Something went wrong"}</h2>
		<p>
			{#if notFound}
				We couldn’t find the page you were looking for. It may have moved, or
				the link may be incorrect.
			{:else}
				Sorry, we’re having trouble loading this page. Please refresh your
				browser or try again later.
			{/if}
		</p>
		<ul>
			{#each links as link (link.href)}
				<li><a href={link.href}>{link.label}</a></li>
			{/each}
		</ul>
	</div>
</section>

<style>
	#error-page {
		width: 100%;
		position: absolute;
		padding: 10rem 1rem 4rem 1rem;
		font-family: var(--sans);
	}

	.inner {
		max-width: 720px;
		margin: 0 auto;
	}

	.status {
		font-size: var(--14px);
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-gray-600);
		margin: 0 0 0.5rem 0;
	}

	h2 {
		font-weight: 700;
		margin: 0 0 1rem 0;
	}

	p {
		font-size: var(--16px);
		line-height: 1.65;
		margin: 0 0 1.5rem 0;
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 1rem 2rem;
	}

	li {
		font-size: var(--16px);
	}

	a:hover {
		color: var(--color-gray-600);
		text-decoration-color: var(--color-gray-600);
	}

	@media (max-width: 600px) {
		#error-page {
			padding-top: 8rem;
		}

		h2 {
			font-size: var(--32px);
		}

		p,
		li {
			font-size: var(--14px);
		}
	}
</style>
