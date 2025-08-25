<script>
	import useWindowDimensions from "$runes/useWindowDimensions.svelte.js";

	import csvdata from "../../data/articles_with_themes.csv";

	// components
	import ClusterSection from "../../components/cluster/ClusterSection.svelte";
	import SummarySection from "../../components/summary/SummarySection.svelte";

	// Process data and filter for top 15 largest clusters
	const processedData = csvdata
		.filter((item) => item.publish_date > "2020-01-01")
		.map((item, index) => ({
			...item,
			id: index.toString(),
			UMAP1: Number(item.UMAP1),
			UMAP2: Number(item.UMAP2)
		}))
		.filter((item) => item.cluster != "-1")
		.filter((item) => !isNaN(item.UMAP1) && !isNaN(item.UMAP2));

	// Share/download handlers
	function handleShare() {
		console.log("Share this chart clicked");
	}
	function handleDownload() {
		console.log("Download the data clicked");
	}

	const allDates = processedData.map((d) => d.publish_date).filter(Boolean);

	const minDate = allDates.length
		? new Date(Math.min(...allDates.map((d) => new Date(d))))
		: new Date();

	const maxDate = allDates.length
		? new Date(Math.max(...allDates.map((d) => new Date(d))))
		: new Date();
</script>

<div class="main-content">
	<ClusterSection data={processedData} {minDate} {maxDate} />

	<!-- <SummarySection data={processedData} {minDate} {maxDate} /> -->
</div>

<style lang="scss">
	.main-content {
		// height: 00px;
		font-family: "Inter", sans-serif;
		position: relative;
		overflow: hidden;
	}
</style>
