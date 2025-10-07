<script>
	import { onMount, getContext } from "svelte";
	import { browser } from "$app/environment";
	import tniLogo from "$svg/logos/TNI_static.svg";
	import circleX from "$svg/circle-x.svg";
	import { activePage } from "$runes/misc.svelte.js";
	import { dev } from "$app/environment";

	import tjaLogo from "$svg/logos/TJA_black.svg";
	import umLogo from "$svg/logos/UM_black.svg";
	import polygraphLogo from "$svg/logos/Polygraph_black.svg";
	const copy = getContext("copy");
	const logos = [tjaLogo, umLogo, polygraphLogo];
	let pages = ["home", "about"];

	if (dev) {
		pages.push("methodology");
	}

	function handlePageClick(btn) {
		activePage.page = btn;
	}

	let headerHeight = 0;

	$effect(() => {
		if (browser) {
			document.documentElement.style.setProperty(
				"--header-height",
				`${headerHeight}px`
			);
		}
	});
</script>

<header bind:clientHeight={headerHeight}>
	<div class="logo">
		{@html tniLogo}
	</div>

	<div class="right-side">
		<div class="logo-lockup">
			<p>A collaboration between</p>
			<div class="org-wrapper">
				{#each copy.orgBios as org, i}
					<a href={org.website} aria-label="Learn more about {org.name}">
						{@html logos[i]}
					</a>
				{/each}
			</div>
		</div>
		<div class="divider"></div>
		<nav>
			{#each pages as btn, i}
				<button
					class:active={activePage.page == btn}
					onclick={() => handlePageClick(btn)}
				>
					{btn}
				</button>
			{/each}
		</nav>
	</div>
</header>

<style lang="scss">
	header {
		width: 100%;
		position: fixed;
		height: 90px;
		padding: 1rem 1.75rem;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		z-index: 1000;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(6px);
		top: 0;

		@media (max-width: 1000px) {
			padding: 0.5rem 1rem;
		}
	}

	.logo {
		min-width: 80px;
	}

	nav {
		display: flex;
		flex-direction: row;
		gap: 1rem;
		padding-bottom: 0.5rem;
	}

	.right-side {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-end;
		gap: 1rem;

		.divider {
			width: 1px;
			height: 40px;
			background: var(--color-gray-200);
		}
	}

	button {
		text-transform: uppercase;
		font-size: var(--12px);
		background: transparent;
		border-radius: 0;
		position: relative;
	}

	button::after {
		content: "";
		position: absolute;
		left: 0;
		bottom: 0;
		width: 0%;
		height: 2px;
		background-image: linear-gradient(to right, #7cdee0, #e5bdf5);
		pointer-events: none;
		transition: width 0.25s linear;
	}

	button.active::after,
	button:hover::after {
		width: 100%;
	}

	button.active {
		font-weight: 700;
		pointer-events: none;
	}

	.logo-lockup {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-end;
		font-family: var(--sans);
		padding: 1rem;
		color: var(--color-gray-600);
		font-size: var(--14px);

		.org-wrapper {
			display: flex;
			flex-direction: row;
			align-items: center;
			gap: 2rem;
		}

		p {
			margin-right: 1rem;
		}

		@media (max-width: 1000px) {
			display: none;
		}
	}

	.org-wrapper a {
		opacity: 0.3;
		transition: transform 0.25s linear;
	}

	.org-wrapper a:hover {
		transform: translateY(-2px);
		opacity: 0.4;
	}

	:global(.org-wrapper svg) {
		height: 2rem;
	}

	:global(.org-wrapper a:last-of-type svg) {
		height: 1.4rem;
	}

	@media (max-width: 720px) {
		footer {
			justify-content: center;
		}

		p {
			font-size: var(--12px);
		}
	}
</style>
