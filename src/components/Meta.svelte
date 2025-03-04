<script>
	let {
		title = "Trans News Initiative",
		description = "A database and analysis of legislation and news coverage affecting trans communities.",
		url = "https://transnewsinit.org",
		keywords = "trans, transgender, government action, executive order, legisaltion, law, news, coverage, articles, reporting, data, analysis",
		preloadFont = []
	} = $props();
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="author" content="Trans News Initiative" />
	<meta name="news_keywords" content={keywords} />

	<meta property="og:title" content={title} />
	<meta property="og:site_name" content="Trans News Initiative" />
	<meta property="og:url" content={url} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="article" />
	<meta property="og:locale" content="en_US" />

	<meta property="og:image" content="{url}/assets/social.jpg" />
	<meta property="og:image:type" content="image/jpeg" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="628" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="https://transnewsinit.org" />
	<meta name="twitter:creator" content="" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image:src" content="{url}/assets/social.jpg" />

	<meta name="robots" content="max-image-preview:large" />

	<link rel="canonical" href="{url}/" />

	{#each preloadFont as href}
		<link rel="preload" {href} as="font" type="font/woff2" crossorigin />
	{/each}
</svelte:head>
