<script>
	import "$styles/app.css";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="stylesheet" href="https://use.typekit.net/hqz2yin.css">
</svelte:head>

<main id="content">
	{@render children?.()}
</main>
