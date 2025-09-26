<script>
	import { browser } from "$app/environment";
	import tniLogo from "$svg/logos/TNI_static.svg";
	import circleX from "$svg/circle-x.svg";
	import { activePage } from "$runes/misc.svelte.js";
	import { dev } from "$app/environment";

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
</header>

<style>
	header {
		width: 100%;
		position: fixed;
		padding: 1rem;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		z-index: 1000;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(6px);
		top: 0;
	}

	.logo {
		width: 80px;
	}

	nav {
		display: flex;
		flex-direction: row;
		gap: 1rem;
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
</style>
