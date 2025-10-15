<script>
	import { onMount, onDestroy } from "svelte";
	import { forceSimulation, forceX, forceY, forceCollide } from "d3-force";
	import { scaleTime, scaleLinear } from "d3-scale";
	import { select } from "d3-selection";
	import { extent } from "d3-array";
	import { timeYear, timeMonth } from "d3-time";
	import tippy from "tippy.js";
	import "tippy.js/dist/tippy.css";
	import "tippy.js/themes/light.css";
	import { isMobile } from "$utils/breakpoints.js";

	import { createTooltipContent } from "../../utils/createTooltipContent.js";

	// Config
	const NODE_RADIUS = 4.5;
	const COLLIDE_RADIUS = NODE_RADIUS;
	const COLLIDE_STRENGTH = 1;
	const FORCE_X_STRENGTH = 0.9;
	const FORCE_Y_STRENGTH = 0.04;
	const STATIC_SIMULATION_TICKS = 300;

	const { data = [], xDomain = null } = $props();

	let container;
	let svgEl = $state(null);
	let width = $state(0);
	let dynamicHeight = $state(150);
	let loading = $state(true);
	let simulationData = $state([]);
	let yOffset = $state(0);
	let simulation = null;
	let stickyInstance = null;

	const marginTop = 50;
	const marginRight = 50;
	const marginBottom = 50;
	const marginLeft = 50;

	$effect(() => {
		if (!container) return;
		const resizeObserver = new ResizeObserver((entries) => {
			for (let entry of entries) {
				width = entry.contentRect.width;
			}
		});

		resizeObserver.observe(container);

		return () => resizeObserver.disconnect();
	});

	const processedData = $derived(
		data
			.map((d) => ({
				...d,
				publish_date: new Date(d.publish_date)
			}))
			.filter(
				(d) => d.publish_date && !isNaN(d.publish_date.valueOf()) && d.title
			)
	);

	const xScale = $derived(
		scaleTime()
			.domain(xDomain || extent(processedData, (d) => d.publish_date))
			.range([marginLeft, width - marginRight])
	);

	const colorScale = $derived(
		scaleLinear()
			.domain([
				xScale.domain()[0],
				new Date(
					(xScale.domain()[0].getTime() + xScale.domain()[1].getTime()) / 2
				),
				xScale.domain()[1]
			])
			.range(["#a8d8f0", "#c8b4e2", "#f3c2d7"])
	);

	const yearLabels = $derived.by(() => {
		if (!width || !dynamicHeight) return [];

		const dateExtent = xScale.domain();
		if (
			!dateExtent ||
			!dateExtent[0] ||
			dateExtent[0].toString() === "Invalid Date"
		)
			return [];

		const oneYear = 1000 * 60 * 60 * 24 * 365;
		const duration = dateExtent[1].getTime() - dateExtent[0].getTime();
		const useMonths = duration < oneYear * 2;

		const labels = xScale
			.ticks(useMonths ? timeMonth : timeYear)
			.map((date) => ({
				date,
				label: useMonths
					? date.toLocaleDateString(undefined, {
							month: "short",
							year: "2-digit"
						})
					: date.getFullYear()
			}));

		const yPosition = dynamicHeight / 2;

		return labels.map((d) => ({
			x: xScale(d.date),
			y: yPosition,
			label: d.label
		}));
	});

	$effect(() => {
		if (!processedData.length || !width) return;
		loading = true;

		const simData = processedData.map((d) => ({ ...d }));

		simData.forEach((d) => {
			d.x = xScale(d.publish_date);
			d.y = 0;
		});

		simulation = forceSimulation(simData)
			.force(
				"x",
				forceX((d) => xScale(d.publish_date)).strength(FORCE_X_STRENGTH)
			)
			.force("y", forceY(0).strength(FORCE_Y_STRENGTH))
			.force(
				"collide",
				forceCollide(COLLIDE_RADIUS).strength(COLLIDE_STRENGTH)
			);

		setTimeout(() => {
			if (!simulation) return;
			simulation.tick(STATIC_SIMULATION_TICKS);

			const [minY, maxY] = extent(simData, (d) => d.y);
			const contentHeight = maxY - minY + NODE_RADIUS * 2;
			dynamicHeight = Math.max(150, contentHeight + marginTop + marginBottom);
			yOffset = dynamicHeight / 2 - (minY + maxY) / 2;
			simulationData = simData;

			loading = false;
		}, 0);

		return () => {
			if (simulation) {
				simulation.stop();
				simulation = null;
			}
		};
	});

	$effect(() => {
		if (loading || !svgEl) return;
		let instances = [];
		const timer = setTimeout(() => {
			instances = tippy(svgEl.querySelectorAll("[data-tippy-content]"), {
				allowHTML: true,
				interactive: true,
				appendTo: () => document.body,
				theme: "light",
				trigger: "mouseenter click",

				onShow(instance) {
					if (stickyInstance && stickyInstance !== instance) {
						return false;
					}
				},

				onTrigger(instance, event) {
					if (event.type === "click") {
						const isCurrentlySticky = stickyInstance === instance;
						if (stickyInstance && !isCurrentlySticky) {
							stickyInstance.hide();
						}
						if (!isCurrentlySticky) {
							stickyInstance = instance;
							if (!$isMobile) {
								instance.setProps({ interactive: true });
							}
						}
					}
				},

				onHide(instance) {
					if (stickyInstance === instance) {
						stickyInstance = null;
					}
				}
			});
		}, 100);
		return () => {
			clearTimeout(timer);
			instances.forEach((instance) => instance.destroy());
			stickyInstance = null;
		};
	});
</script>

<div
	class="beeswarm-container"
	bind:this={container}
	style:height="{dynamicHeight}px"
>
	{#if loading}
		<div class="loading-spinner"></div>
	{/if}
	{#if !loading && width && dynamicHeight}
		{@const axisY = dynamicHeight / 2}

		<svg bind:this={svgEl} {width} height={dynamicHeight} class="beeswarm-svg">
			<!-- Axis Line -->
			<line
				x1={marginLeft}
				x2={width - marginRight}
				y1={axisY}
				y2={axisY}
				stroke="var(--color-gray-300)"
				stroke-width="1"
			/>

			<!-- Circles -->
			<g transform="translate(0, {yOffset})">
				{#each simulationData as node}
					<circle
						cx={node.x}
						cy={node.y}
						r={NODE_RADIUS}
						fill={colorScale(node.publish_date)}
						stroke="#fff"
						stroke-width={1}
						on:mouseover={(event) => {
							const circle = select(event.currentTarget);
							console.log(circle)
							circle.raise();
						}}
						data-tippy-content={createTooltipContent(node)}
					/>
				{/each}
			</g>

			<!-- Labels -->
			<g>
				{#each yearLabels as label}
					<g transform="translate({label.x}, {axisY + 17})">
						<text
							fill="black"
							text-anchor="middle"
							dominant-baseline="middle"
							font-size="12px"
							font-weight="600"
							font-family="sans-serif"
							stroke-width="4px"
							stroke="white"
							paint-order="stroke"
						>
							{label.label}
						</text>
					</g>
				{/each}
			</g>
		</svg>
	{/if}
</div>

<style lang="scss">
	.beeswarm-container {
		width: 100%;
		overflow: hidden;
		position: relative;
	}

	.beeswarm-svg {
		display: block;

		circle {
			cursor: pointer;
			transition:
				stroke 0.2s ease-in-out,
				stroke-width 0.2s ease-in-out;

			&:hover {
				stroke: #000;
				stroke-width: 2;
			}
		}
		text {
			pointer-events: none;
		}
	}

	.loading-spinner {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 50px;
		height: 50px;
		border: 5px solid rgba(0, 0, 0, 0.1);
		border-radius: 50%;
		border-top-color: #000;
		animation: spin 1s ease-in-out infinite;
		transform: translate(-50%, -50%);
		z-index: 20;
	}
	@keyframes spin {
		to {
			transform: translate(-50%, -50%) rotate(360deg);
		}
	}
</style>
