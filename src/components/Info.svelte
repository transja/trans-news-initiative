<script>
	import { Info } from "@lucide/svelte";
	import tippy from "tippy.js";
	import "tippy.js/dist/tippy.css";
	import "tippy.js/themes/light.css";
	import { onMount } from "svelte";
	import { getContext } from "svelte";
	const copy = getContext("copy");

	let { instance, size = 16 } = $props();
	let content = copy.moreInfo.find((d) => d.instance === instance);

	let element = $state(null);

	onMount(() => {
		tippy(element, {
			allowHTML: true,
			interactive: true,
			content: `<div style="z-index: 1000; text-align: left; font-family: var(--sans); padding: 5px; min-width: 300px; text-transform: none;">
 <div style="font-size: 1,2em; color: #000; font-weight: bold; margin-bottom: 5px; border-bottom: 2px solid #000; padding-bottom: 5px;">${content.title}</div>

            ${content.text
							.split("\r")
							.map((d) => `<p style="font-weight: 400">${d}</p>`)
							.join("")}
		</div>`,
			theme: "light",
			appendTo: () => document.body,
			zIndex: 10000
		});
	});
</script>

<div bind:this={element} class="info-container"><Info {size} /></div>

<style>
	.info-container {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		cursor: pointer;
	}
</style>
