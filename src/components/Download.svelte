<script>
	import { getContext } from "svelte";

	import RequestForm from "$components/RequestForm.svelte";
	import DataDownload from "$components/DataDownload.svelte";

	const copy = getContext("copy");
</script>

<section id="download">
	<div class="intro">
		<h2>{@html copy.downloadHed}</h2>
		{#each copy.downloadIntro ?? [] as graf, i (i)}
			<p>{@html graf}</p>
		{/each}
	</div>

	<div class="panel">
		<RequestForm />
		<DataDownload />
	</div>
</section>

<style>
	#download {
		width: 100%;
		position: absolute;
		padding-top: 10rem;
		font-family: var(--sans);
	}

	.intro {
		max-width: 720px;
		margin: 0 auto 3rem auto;
		padding: 0 1rem;
	}

	h2 {
		font-weight: 700;
	}

	p {
		font-size: var(--16px);
		line-height: 1.65;
		margin: 0 0 1rem 0;
	}

	:global(#download .intro a:hover) {
		color: var(--color-gray-600);
		text-decoration-color: var(--color-gray-600);
	}

	.panel {
		background: #f3f3fe;
		padding-bottom: 6rem;
	}

	@media (max-width: 600px) {
		#download {
			padding-top: 8rem;
		}

		h2 {
			font-size: var(--32px);
		}

		p {
			font-size: var(--14px);
		}
	}
</style>
