<script>
	import { processDataByTopic } from '../../utils/processTopics.js';
	import TopicRow from './TopicRow.svelte';

	let { data, minDate, maxDate } = $props();

	const groupedByTopic = processDataByTopic(data, minDate, maxDate);
</script>

<div class="summary-section">
	<header>
		<h2>Topic summary</h2>
	</header>
	<div class="table-header">
		<div class="header-cell">Topic</div>
		<div class="header-cell">Articles</div>
		<div class="header-cell">Coverage Over Time</div>
		<div class="header-cell">Most Covered By</div>
		<div class="header-cell">Coverage by Publication Lean</div>
	</div>
	{#each Object.entries(groupedByTopic).filter(([topic]) => topic !== 'Other') as [topic, topicData]}
		<TopicRow {topic} data={topicData} />
	{/each}
</div>

<style>
	.summary-section {
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
	}
	header {
		padding: 2rem 1rem;
	}
	.table-header {
		display: grid;
		grid-template-columns: 2fr 1fr 1.5fr 1fr 1fr;
		gap: 1rem;
		padding: 0 1rem 0.5rem;
		border-bottom: 2px solid #000;
		font-weight: bold;
		text-transform: uppercase;
		font-size: 0.8rem;
	}
	.header-cell:not(:first-child) {
		text-align: right;
	}
</style>
