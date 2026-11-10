<script>
	import Home from "$components/Home.svelte";
	import { activePage } from "$runes/misc.svelte.js";

	$effect(() => {
		if (activePage.page) {
			if (typeof window !== "undefined") {
				window.scrollTo(0, 0);
			}
		}
	});
</script>

<div id="main-content-wrapper">
	<Home />
</div>
