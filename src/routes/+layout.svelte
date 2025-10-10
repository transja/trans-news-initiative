<script>
	import "$styles/app.css";
	import { onMount } from "svelte";
	import { browser } from "$app/environment";
	import { activeTheme } from "$runes/misc.svelte.js";

	let { children } = $props();

</script>

<svelte:head>
	<link rel="stylesheet" href="https://use.typekit.net/hqz2yin.css">
</svelte:head>

<main id="content">
	{@render children?.()}
</main>
