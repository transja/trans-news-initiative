<script>
	import "$styles/app.css";
	import { onMount } from "svelte";
	import { browser } from "$app/environment";
	import { activeTheme } from "../stores/global.js";

	let { children } = $props();

	onMount(() => {
		if (browser) {
			window.setActiveTheme = (theme) => {
				activeTheme.set(theme);
				window.scrollTo(0, 0);
			};
			
		}
	});
</script>

<svelte:head>
	<link rel="stylesheet" href="https://use.typekit.net/hqz2yin.css">
</svelte:head>

<main id="content">
	{@render children?.()}
</main>
