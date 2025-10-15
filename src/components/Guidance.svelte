<script>
	import { Info, ArrowRight } from "@lucide/svelte";
	import guidanceData from "$data/guidance.csv";
	import { activeTheme } from "$runes/misc.svelte.js";

	let activeGuidance = $state(guidanceData.filter(d => d.theme === activeTheme.theme));
</script>

<div class="guidance-container">
	<div class="sticky-inner">
		<div class="header-wrapper">
			<div class="guidance-header">
				<img src="/assets/tja-logo.png" alt="TJA Logo" class="logo" />
				<h3>Coverage guidance</h3>
			</div>
			<div class="methodology-link">
				<a href="/methodology">See the methodology <Info size={18} /></a>
			</div>
		</div>
		<div class="guidance-content">
			{#if activeGuidance}
				{#each activeGuidance as item, i}
					<div class="guidance-item">
						<h4>{item.title}</h4>
						<p>{item.text}</p>
						<a href={item.url} target="_blank">
							{item.urlText}
							<ArrowRight size={14} />
						</a>
					</div>
				{/each}
			{/if}
		</div>
		<div class="bottom-fade"></div>
	</div>
</div>

<style lang="scss">
	.guidance-container {
		width: 300px;
		font-family: var(--sans);

		.header-wrapper {
			display: flex;
			flex-direction: column;
			margin-top: 1rem;

			.guidance-header {
				display: flex;
				align-items: center;
				gap: 0.5rem;
				margin: 0;
				.logo {
					width: 32px;
					height: 32px;
				}
				h3 {
					font-weight: 600;
					font-size: 1.5rem;
				}
			}

			.methodology-link {
				margin: 0;
				font-style: italic;
				font-size: var(--14px);
				a {
					color: #555;
					text-decoration: none;
					display: flex;
					flex-direction: row;
					align-items: center;
					gap: 0.25rem;
					&:hover {
						text-decoration: underline;
					}
					span {
						display: inline-block;
						border: 1px solid #555;
						border-radius: 50%;
						width: 16px;
						height: 16px;
						text-align: center;
						line-height: 16px;
						font-size: 0.75rem;
						font-style: italic;
					}
				}
			}
		}

		.guidance-content {
			display: flex;
			flex-direction: column;
			position: relative;
			gap: 1rem;
			overflow-y: auto;
			flex: 1;
			padding: 0 0 4rem 0;

			.guidance-item {
				font-family: var(--sans);
				h4 {
					font-weight: 600;
					margin-bottom: 0.5rem;
                    font-size: 1.12rem;
				}
				p {
					font-size: 0.9rem;
					line-height: 1.4;
					color: var(--color-gray-600);
					margin: 0;
				}
				a {
					font-size: var(--12px);
					text-decoration: none;
					color: var(--color-gray-1000);
					font-weight: 700;
					text-transform: uppercase;

					&:hover {
						text-decoration: underline;
					}
				}
			}
		}
	}

	.sticky-inner {
		position: sticky;
		padding-top: 1rem;
		top: calc(var(--header-height) + var(--controls-height));
		max-height: calc(100vh - var(--header-height) - var(--controls-height));
		display: flex;
    	flex-direction: column;
		gap: 1rem;

		.bottom-fade {
			position: absolute;
			bottom: 0;
			left: 0;
			width: 100%;
			height: 4rem;
			pointer-events: none;
			background: linear-gradient(to top, var(--color-gray-50), transparent);
		}
	}

	:global(.guidance-item a svg) {
		position: relative;
		top: 2px;
	}

	:global(.guidance-item a:hover svg) {
		top: 2px;
		transform: translateX(2px);
	}

	@media(max-width: 1000px) {
		.sticky-inner {
			padding-top: 0;

			.bottom-fade {
				display: none;
			}
		}

		.guidance-container {
			width: 100%;
			
			.header-wrapper {
				margin: 0;
				flex-direction: row;
				align-items: center;
				justify-content: space-between;
			}

			.guidance-content {
				flex-direction: row;
				justify-content: space-between;
				padding: 0;
				flex-wrap: wrap;

				.guidance-item {
					width: 30%;
				}
			}
		}
	}

	@media(max-width: 600px) {
		.guidance-container {

			.header-wrapper {
				flex-direction: column;
				align-items: flex-start;
			}

			.guidance-content {
				flex-direction: column;

				.guidance-item {
					width: 100%;
				}
			}
		}
	}
</style>
