<script>
	import { getContext } from "svelte";
	const copy = getContext("copy");

	import { isMobile, isDesktop } from "$utils/breakpoints";
	import tjaLogo from "$svg/logos/TJA_black.svg";
	import umLogo from "$svg/logos/UM_black.svg";
	import polygraphLogo from "$svg/logos/Polygraph_black.svg";

	import tjaLogoIcon from "$svg/logos/TJA-logo-small.svg";
	import umLogoIcon from "$svg/logos/UM-logo-small.svg";
	import polygraphLogoIcon from "$svg/logos/polygraph-logo-small.svg";

	let { type } = $props();

	const logos = [tjaLogo, umLogo, polygraphLogo];
	const logosIcon = [tjaLogoIcon, umLogoIcon, polygraphLogoIcon];
</script>

<div class="logo-lockup" style="padding: { $isDesktop ? '1rem' : '0.5rem 0' }">
	{#if !$isMobile}
		<p>A collaboration between</p>
	{/if}
	<div class="org-wrapper {type === 'icon' ? 'icon' : 'full'}">
		{#each copy.orgBios as org, i}
			<a href={org.website} target="_blank" aria-label="Learn more about {org.name}">
				{@html type === "icon" ? logosIcon[i] : logos[i]}
			</a>
		{/each}
	</div>
</div>

<style lang="scss">
	.logo-lockup {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-end;
		font-family: var(--sans);
		color: var(--color-gray-600);
		font-size: var(--14px);

		p {
			margin-right: 1rem;
			font-style: italic;
		}
	}

	.org-wrapper {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 2rem;

		a {
			transition: transform 0.25s linear;
		}

		&.full {
			a {
				opacity: 0.3;
				&:hover {
					transform: translateY(-2px);
					opacity: 0.4;
				}
			}

			:global(svg) {
				height: 2rem;
			}
			:global(a:last-of-type svg) {
				height: 1.4rem;
			}
		}

		&.icon {
            gap: .6rem;
			a {
				opacity: 0.6;
				&:hover {
					opacity: 0.8;
				}
			}

			:global(svg) {
				height: 30px;
				width: 30px;
			}
		}
	}
</style>
