<script>
	import tniLogo from "$svg/logos/TNI.svg";
	import circleX from "$svg/circle-x.svg";
	import { activePage } from "$runes/misc.svelte.js";

	const pages = ["home", "about"];

	function handlePageClick(btn) {
		activePage.page = btn;
	}

	// $effect(() => {
	// 	console.log(activePage.page)
	// });
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
		position: relative;
	}

	button::after {
		content: "";
		position: absolute;
		left: 0;
		bottom: 0;
		width: 0%;
		height: 2px;
		background-image: linear-gradient(to right, #5bcefa, #f5a9b8);
		pointer-events: none;
		transition: width 0.25s linear;
	}

	button.active::after, button:hover::after {
		width: 100%;
	}

	button.active {
		font-weight: 700;
		pointer-events: none;
	}

	button:hover {
		
	}
</style>
