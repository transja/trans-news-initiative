<script>
	import { setContext } from "svelte";
	import copy from "$data/copy.json";
	import version from "$utils/version.js";
	import Meta from "$components/Meta.svelte";
	import { page } from "$app/stores";
	import { activePage } from "$runes/misc.svelte.js";

	import "$styles/app.css";
	import Header from "$components/Header.svelte";
	import { browser } from "$app/environment";

	let { children } = $props();

	version();

	const { title, description, url, keywords } = copy;
	setContext("copy", copy);

	$effect(() => {
		const path = $page.url.pathname.replaceAll("/", "");
		if (path === "") {
			activePage.page = "home";
		} else if (path.includes("dashboard")) {
			activePage.page = "home";
		} else {
			activePage.page = path;
		}
	});

</script>

<svelte:head>
	<link rel="stylesheet" href="https://use.typekit.net/hqz2yin.css" />
</svelte:head>

<Meta {title} {description} {url} {keywords} />
<Header />
<svelte:boundary onerror={(e) => console.error(e)}>
	<main id="content">
		{@render children?.()}
	</main>
</svelte:boundary>
