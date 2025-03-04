<script>
	import tniLogo from "$svg/logos/TNI.svg";
	import circleX from "$svg/circle-x.svg";
	import { activePage } from "$runes/misc.svelte.js";

	const pages = ["home", "about"];

	function handlePageClick(btn) {
		activePage.page = btn;
	}

	$effect(() => {
		console.log(activePage.page)
	});
</script>

<header>
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
		background: rgba(255,255,255,0.95);
		backdrop-filter: blur(6px);
	}

	.logo {
		width: 80px;
	}

	p {
		font-family: var(--sans);
		font-weight: 700;
		text-transform: uppercase;
		font-size: var(--14px);
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
		border-bottom: 2px solid transparent;
	}

	button.active {
		border-bottom: 2px solid var(--tni-yellow);
		font-weight: 700;
		pointer-events: none;
	}

	button:hover {
		border-bottom: 2px solid var(--color-gray-1000);
	}
</style>
