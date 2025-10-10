<script>

	import { browser } from "$app/environment";
	import tniLogo from "$svg/logos/TNI_static.svg";
	import circleX from "$svg/circle-x.svg";
	import { activePage } from "$runes/misc.svelte.js";
	import { dev } from "$app/environment";
	import { isDesktop } from "$utils/breakpoints";
	import LogoLockup from "./LogoLockup.svelte";
	import { goto } from "$app/navigation";
	import { activeTheme, inThemeView } from "$runes/misc.svelte.js";


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
	<div class="logo" onclick={() => {
		handlePageClick("home")
		inThemeView.state = false;
		activeTheme.theme = null;
		// TODO: This is a temporary and will need to be updated to the actual path
		goto("/staging");

	}}>
		{@html tniLogo}
	</div>

	<div class="right-side">
		{#if $isDesktop}
			<LogoLockup />
			<div class="divider"></div>
		{/if}
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

		@media (max-width: 600px) {
			height: auto;
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


	@media (max-width: 720px) {
		footer {
			justify-content: center;
		}

		p {
			font-size: var(--12px);
		}
	}
</style>
