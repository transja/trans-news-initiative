<script>
	import { onMount, getContext } from "svelte";
  import { browser } from "$app/environment";
	import tjaLogo from "$svg/logos/TJA_black.svg";
	import umLogo from "$svg/logos/UM_black.svg";
	import polygraphLogo from "$svg/logos/Polygraph_black.svg";
	import { activePage } from "$runes/misc.svelte.js";
  import {inThemeView} from "$runes/misc.svelte.js";

  
	const copy = getContext("copy");
	const logos = [tjaLogo, umLogo, polygraphLogo];

	let footerHeight = 0;

	$effect(() => {
		if (browser) {
			document.documentElement.style.setProperty(
				"--footer-height",
				`${footerHeight}px`
			);
		}
	});
</script>

{#if activePage.page == "home"}
	<footer bind:clientHeight={footerHeight} class:in-theme-view={inThemeView.state}>
		<p>A collaboration between</p>
		<div class="org-wrapper">
			{#each copy.orgBios as org, i}
				<a href={org.website} aria-label="Learn more about {org.name}">
					{@html logos[i]}
				</a>
			{/each}
		</div>
	</footer>
{/if}

<style lang="scss">
	footer {
		width: 100%;
		/* margin-top: 100px; */
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-end;
		font-family: var(--sans);
		padding: 1rem;
		position: fixed;
		bottom: 0;
		left: 0;
		z-index: 2000;
    border-top: 1px solid var(--color-gray-200);
		background: rgba(255, 255, 255, 0.95);

		/* &.in-theme-view {
			position: relative;
		} */
	}

	.org-wrapper {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 2rem;
	}

	p {
		margin-right: 1rem;
	}

	.org-wrapper a {
		opacity: 0.3;
		transition: transform 0.25s linear;
	}

	.org-wrapper a:hover {
		transform: translateY(-2px);
		opacity: 0.4;
	}

	@media (max-width: 720px) {
		footer {
			justify-content: center;
		}

		p {
			font-size: var(--12px);
		}
	}

	@media (max-width: 600px) {
		footer {
			flex-direction: column;
			padding: 1rem;
			gap: 0;
		}
	}
</style>
