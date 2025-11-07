<script>
	import { onMount, getContext } from "svelte";
	import { activePage } from "$runes/misc.svelte.js";
	import tjaLogo from "$svg/logos/TJA_color.svg";
	import umLogo from "$svg/logos/UM_color.svg";
	import polygraphLogo from "$svg/logos/Polygraph_color.svg";

	const copyPromise = Promise.resolve(getContext("copy"));
	const logos = [tjaLogo, umLogo, polygraphLogo];
</script>

<section id="about">
	{#await copyPromise}
		<div class="inner">
			<p>Loading...</p>
		</div>
	{:then copy}
		<div class="inner">
			<div class="about-wrapper">
				<h2>About the initiative</h2>
				{#each copy.longdesc as graf, i}
					<p>{@html graf.value}</p>
				{/each}
			</div>
			<div class="org-contributor-wrapper">
				<div class="orgs">
					<h3>Organizations</h3>
					{#each copy.orgBios as org, i}
						<div class="org">
							<a href={org.website}>
								<div class="logo">
									{@html logos[i]}
								</div>
							</a>
							<p>{@html org.bio}</p>
						</div>
					{/each}
				</div>
				<div class="contributors">
					<h3>Contributors</h3>
					{#each copy.individualBios as individual, i}
						<div class="contributor">
							<p class="name">{@html individual.name}</p>
							<p class="title">{@html individual.title}</p>
							<p class="bio">{@html individual.bio}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
		<p class="copyright">{@html copy.copyright}</p>
	{:catch error}
		<div class="inner">
			<p>There was an error loading this content. Please try again later.</p>
		</div>
	{/await}
</section>

<style>
	#about {
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
	}

	p {
		font-size: var(--18px);
		line-height: 1.65;
	}

	.copyright {
		font-size: var(--12px);
		font-style: italic;
		margin: 0;
	}

	:global(#about a:hover) {
		color: var(--color-gray-600);
		text-decoration-color: var(--color-gray-600);
	}

	.inner {
		max-width: 900px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10rem;
	}

	.about-wrapper {
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

		.inner {
			gap: 6rem;
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
