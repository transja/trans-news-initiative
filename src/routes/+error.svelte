<script>
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";

	onMount(() => {
		// Redirect to root for 404 errors
		if ($page.status === 404) {
			goto('/');
		}
	});
</script>

{#if $page.status === 404}
	<!-- This will redirect automatically -->
	<p>Redirecting to home page...</p>
{:else}
	<h1>{$page.status}: {$page.error.message}</h1>
{/if}
