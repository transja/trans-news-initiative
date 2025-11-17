<script>
	import { onMount } from "svelte";
	import { select } from "d3-selection";
	import "d3-transition";
	import { easeLinear } from "d3-ease";
	import { browser } from "$app/environment";
	import tniLogo from "$svg/logos/TNI_animate.svg";
	import circleX from "$svg/circle-x.svg";
	import { activePage } from "$runes/misc.svelte.js";
	import { dev } from "$app/environment";
	import { isDesktop, isMobile, isTablet, isXSmall } from "$utils/breakpoints";
	import LogoLockup from "./LogoLockup.svelte";
	import { goto } from "$app/navigation";
	import { activeTheme, inThemeView } from "$runes/misc.svelte.js";

	let pages = ["home", "about", "methods"];

	function handlePageClick(btn) {
		activePage.page = btn;
		if (btn === "home") {
			goto("/");
		} else {
			goto(`/${btn}`);
		}
	}

	let headerHeight = 0;
	let transposePath;
	let letterA;

	function drawInPath() {
		let pathElement = transposePath.node();
		if (!pathElement) return;

		let pathLen = pathElement.getTotalLength();

		// Stop ongoing transitions to prevent overlaps
		transposePath.interrupt();
		letterA.interrupt();

		// Reset to initial state
		transposePath
			.attr("stroke-dasharray", pathLen)
			.attr("stroke-dashoffset", pathLen);

		letterA.style("opacity", 1); // Reset letter A visibility

		// Restart animation
		transposePath
			.transition()
			.delay(500)
			.duration(1000)
			.ease(easeLinear)
			.attr("stroke-dashoffset", 0);

		letterA
			.transition()
			.delay(1500)
			.duration(500)
			.ease(easeLinear)
			.style("opacity", 0);
	}

	onMount(() => {
		transposePath = select("header #transposePath");
		letterA = select("header #letter-a");

		letterA
			.transition()
			.delay(1500)
			.duration(500)
			.ease(easeLinear)
			.style("opacity", 0);
	});

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
	<button
		id="tni-logo"
		class="logo"
		onmouseenter={() => {
			drawInPath();
		}}
		onclick={() => {
			handlePageClick("home");
			inThemeView.state = false;
			activeTheme.theme = null;
			goto("/");
		}}
	>
		{@html tniLogo}
	</button>

	<div class="right-side">
		{#if $isDesktop || $isTablet}
			<LogoLockup type={$isTablet ? "icon" : "full"} />
			<div class="divider"></div>
		{/if}
		<nav>
			{#each pages as btn, i}
				<button
					class="page-btn"
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
		padding: 1rem;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		z-index: 999;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(6px);
		top: 0;

		@media (max-width: 1000px) {
			padding: 0.5rem;
		}

		@media (max-width: 600px) {
			height: auto;
		}
	}

	.logo {
		min-width: 80px;
		cursor: pointer;
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

	#tni-logo {
		padding: 0;
		background: transparent;
		transition: transform 0.25s linear;

		// &:hover {
		// 	transform: translateY(-2px);
		// }
	}

	.page-btn {
		text-transform: uppercase;
		font-size: var(--12px);
		background: transparent;
		border-radius: 0;
		position: relative;
	}

	.page-btn::after {
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

	.page-btn.active::after,
	.page-btn:hover::after {
		width: 100%;
	}

	.page-btn.active {
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

		nav {
			gap: 0.5rem;
		}
	}
</style>
