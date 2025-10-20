<script>
	import { extent } from "d3-array";
	import Guidance from "./Guidance.svelte";
	import EventCard from "./EventCard.svelte";


	let { data, xDomain } = $props();

	const groupedByEvent = $derived.by(() => {
		return Array.from(
			new Map(data.filter((d) => d.event).map((item) => [item.event, item])).values()
		)
			.map((item) => {
				return {
					name: item.event,
					articles: data.filter((d) => d.event === item.event)
				};
			})
			.sort((a, b) => b.articles.length - a.articles.length);
	});

	let openAccordionItems = $state([]);
	let initialized = false; // Add a flag to run the effect only once

	$effect(() => {
		if (!initialized && groupedByEvent.length > 0) {
			openAccordionItems = [groupedByEvent[0].name];
			initialized = true;
		}
	});
</script>

<div class="theme-section-container">
	<Guidance />
	<div class="events-container">
		<h2>
			<strong>{groupedByEvent.length} events</strong> match your current selections
		</h2>

		<div class="accordion">
			{#each groupedByEvent as event, i}
				{@const isOpen = openAccordionItems.includes(event.name)}
				<EventCard
					{event}
					{isOpen}
					eventIndex={i}
					{xDomain}
					onToggle={() => {
						if (isOpen) {
							openAccordionItems = openAccordionItems.filter(
								(item) => item !== event.name
							);
						} else {
							openAccordionItems = [...openAccordionItems, event.name];
						}
					}}
				/>
			{/each}
		</div>
	</div>
</div>

<style lang="scss">
	.theme-section-container {
		display:flex;
		flex-direction: row;
		gap: 2rem;

		// border-radius: 8px;
	}

	.events-container {
		padding-top: 1.5rem;
		width: calc(100% - 300px - 2rem);


		h2 {
			font-size: 2rem;
			margin-bottom: 1.5rem;
			font-weight: 400;
			strong {
				font-weight: 600;
			}
		}
	}
	.accordion {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	@media(max-width: 1000px) {
		.theme-section-container {
			display: flex;
			flex-direction: column;

			.events-container {
				width: 100%;
			}
		}
	}
</style>
