<script>
	import { getContext } from "svelte";

	const copy = getContext("copy");
</script>

<aside class="data-cta">
	<h3>{@html copy.dataCtaHed}</h3>
	<p>{@html copy.dataCtaText}</p>
	<a class="cta-button" href="/download/">{copy.dataCtaButton}</a>
</aside>

<style>
	.data-cta {
		width: 100%;
		padding: 2rem;
		background: var(--color-gray-50);
		border-radius: 4px;
		font-family: var(--sans);
	}

	h3 {
		font-size: var(--20px);
		font-weight: 700;
		margin: 0 0 0.5rem 0;
	}

	p {
		font-size: var(--16px);
		line-height: 1.65;
		margin: 0 0 1.5rem 0;
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 48px;
		min-width: 180px;
		padding: 0 1.25rem;
		font-size: var(--16px);
		font-weight: 500;
		color: #fff;
		background: #18bd5b;
		border-radius: 4px;
		text-decoration: none;
		transition: background-color 0.15s;
	}

	/* !important beats the pages' `#about a:hover` / `#methodology a:hover` link colors */
	.cta-button:hover {
		color: #fff !important;
		background: #16aa52;
	}

	@media (max-width: 600px) {
		.data-cta {
			padding: 1.5rem;
		}

		p {
			font-size: var(--14px);
		}
	}
</style>
