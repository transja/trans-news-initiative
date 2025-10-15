<script>
	import { getContext } from "svelte";
	import Header from "$components/Header.svelte";
	import Footer from "$components/Footer.svelte";
	import ComingSoon from "$components/ComingSoon.svelte";
	import About from "$components/About.svelte";
	import Methodology from "$components/Methodology.svelte";

	// const copy = getContext("copy");
	// const data = getContext("data");
</script>

<svelte:boundary onerror={(e) => console.error(e)}>
	<Header />
	<ComingSoon />
	<About />
	<Methodology />
	<!-- <Footer /> -->
</svelte:boundary>
