<script>
	import { Info } from "@lucide/svelte";
</script>

<div class="guidance-container">
	<div class="sticky-inner">
		<div class="guidance-header">
			<img src="/assets/tja-logo.png" alt="TJA Logo" class="logo" />
			<h3>Coverage guidance</h3>
		</div>
		<div class="guidance-content">
			<div class="guidance-item">
				<h4>Guidance Headline</h4>
				<p>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus sit
					amet varius leo. In ut orci ac est dapibus aliquam. Nullam velit
					lorem, vehicula at nulla condimentum, malesuada pharetra felis.
				</p>
			</div>
			<div class="guidance-item">
				<h4>Guidance Headline</h4>
				<p>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus sit
					amet varius leo. In ut orci ac est dapibus aliquam. Nullam velit
					lorem, vehicula at nulla condimentum, malesuada pharetra felis.
				</p>
			</div>
			<div class="guidance-item">
				<h4>Guidance Headline</h4>
				<p>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus sit
					amet varius leo. In ut orci ac est dapibus aliquam. Nullam velit
					lorem, vehicula at nulla condimentum, malesuada pharetra felis.
				</p>
			</div>
		</div>
		<div class="methodology-link">
			<a href="/methodology">See the methodology <Info size={18} /></a>
		</div>
	</div>
</div>

<style lang="scss">
	.guidance-container {
		width: 300px;

		.guidance-header {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			margin-bottom: 1.5rem;
			.logo {
				width: 32px;
				height: 32px;
			}
			h3 {
				font-weight: 600;
				font-size: 1.5rem;
			}
		}

		.guidance-content {
			display: flex;
			flex-direction: column;
			gap: 1rem;
			.guidance-item {
	
				h4 {
					font-weight: 600;
					margin-bottom: 0.5rem;
                    font-size: 1rem;
				}
				p {
					font-size: 0.9rem;
					line-height: 1.4;
					color: #555;
				}
			}
		}

		.methodology-link {
			margin-top: 1.5rem;
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

	.sticky-inner {
		position: sticky;
		padding-top: 1rem;
		top: calc(var(--header-height) + var(--controls-height));
	}

	@media(max-width: 1000px) {
		.sticky-inner {
			padding-top: 0;
		}

		.guidance-container {
			width: 100%;

			.guidance-content {
				flex-direction: row;

				.guidance-item {
					width: 33.33%;
				}
			}
		}
	}

	@media(max-width: 600px) {
		.guidance-container {
			.guidance-content {
				flex-direction: column;

				.guidance-item {
					width: 100%;
				}
			}
		}
	}
</style>
