<script module>
	let autoRetried = false;
</script>

<script>
	import { getContext, onMount } from "svelte";

	let { reset } = $props();

	const copy = getContext("copy");
	let retrying = $state(!autoRetried);

	// Hydration mismatches (e.g. from browser extensions editing the DOM) recover
	// with a fresh client-side render, so retry once before showing the message
	onMount(() => {
		if (autoRetried) return;
		autoRetried = true;
		reset();
	});
</script>

{#if !retrying}
	<div class="error-fallback" role="alert">
		<p>{copy.dataError}</p>
		<button type="button" onclick={reset}>Try again</button>
	</div>
{/if}

<style>
	.error-fallback {
		max-width: 720px;
		margin: 0 auto;
		padding: 10rem 1rem 4rem 1rem;
		font-family: var(--sans);
	}

	p {
		font-size: var(--16px);
		line-height: 1.65;
		margin: 0 0 1rem 0;
	}
</style>
