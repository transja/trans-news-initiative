<script>
	import { getContext } from "svelte";
	import Header from "$components/Header.svelte";
	import Footer from "$components/Footer.svelte";
	import Home from "./Home.svelte";
	import About from "$components/About.svelte";
	import Methodology from "$components/Methodology.svelte";
	import { activePage } from "$runes/misc.svelte.js";

	$effect(() => {
		if (activePage.page) {
			if (typeof window !== 'undefined') {
				window.scrollTo(0, 0);
			}
		}
    });
</script>

<svelte:boundary onerror={(e) => console.error(e)}>
	<Header />
	<div id="main-content-wrapper">
		<Home />
	</div>
</svelte:boundary>
