<script>
	import { forceSimulation, forceX, forceY, forceCollide } from "d3-force";
	import { scaleTime } from "d3-scale";
	import { select } from "d3-selection";
	import { extent } from "d3-array";
	import { timeYear, timeMonth } from "d3-time";
	import tippy from "tippy.js";
	import "tippy.js/dist/tippy.css";
	import "tippy.js/themes/light.css";

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
	let hoverInstance = null;
	let activeDotIndex = $state(-1);

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
			instances = tippy(svgEl.querySelectorAll('[data-tippy-content]'), {
				// Your existing options are good
				allowHTML: true,
				interactive: true,
				appendTo: () => document.body,
				theme: 'light',
				trigger: 'mouseenter click',
				// Add an offset to prevent flickering, just in case
				popperOptions: {
					modifiers: [
						{ name: 'offset', options: { offset: [0, 10] } },
					],
				},

				// --- REVISED LOGIC STARTS HERE ---

				// onShow is the first gatekeeper. It runs before the tooltip appears.
				onShow(instance) {
					// RULE 1: If a tooltip is already sticky, don't show any other tooltips on hover.
					if (stickyInstance && stickyInstance !== instance) {
						return false; // Prevents the tooltip from showing
					}

					// RULE 2: If we are showing a new tooltip on hover, hide the previous one first.
					// We check the trigger source to ensure this only applies to 'mouseenter' events.
					if (instance.state.isShown === false && instance.props.trigger.includes('mouseenter')) {
						if (hoverInstance && hoverInstance !== instance) {
							hoverInstance.hide();
						}
						hoverInstance = instance;
					}
				},

				// onTrigger handles the click logic for making tooltips sticky.
				onTrigger(instance, event) {
					if (event.type === 'click') {
						const isCurrentlySticky = stickyInstance === instance;

						// If another tooltip is sticky, hide it.
						if (stickyInstance && !isCurrentlySticky) {
							stickyInstance.hide();
						}
						
						// Toggle the current tooltip's sticky state.
						stickyInstance = isCurrentlySticky ? null : instance;

						// A click overrides any hover tooltips.
						if (hoverInstance) {
							hoverInstance = null;
						}
					}
				},

				// onHide cleans up our state variables when a tooltip closes.
				onHide(instance) {
					// If the closing tooltip was the sticky one, clear the sticky state.
					if (stickyInstance === instance) {
						stickyInstance = null;
					}
					// If the closing tooltip was the hovered one, clear the hover state.
					if (hoverInstance === instance) {
						hoverInstance = null;
					}
				},
			});
		}, 100);

		return () => {
			clearTimeout(timer);
			instances.forEach((instance) => instance.destroy());
			// Reset state on cleanup
			stickyInstance = null;
			hoverInstance = null;
		};
	});

	$effect(() => {
		if (!container) return;

		const inactiveDots = container.querySelectorAll(`.beeswarm-svg circle:not([data-index='${activeDotIndex}'])`);
		inactiveDots.forEach(el => el._tippy?.hide());

		if (activeDotIndex > -1) {
			const activeEl = container.querySelector(`[data-index='${activeDotIndex}']`);
			if (activeEl?._tippy) {
				activeEl._tippy.show();
			}
		}
	});

	$effect(() => {
		if (!container) return;

		// Hide any tooltips on inactive dots
		const inactiveDots = container.querySelectorAll(`.beeswarm-svg circle:not([data-index='${activeDotIndex}'])`);
		inactiveDots.forEach(el => el._tippy?.hide());

		if (activeDotIndex > -1) {
			const activeEl = container.querySelector(`[data-index='${activeDotIndex}']`);
			raiseCircle(activeEl);
			if (activeEl?._tippy) {
				activeEl._tippy.show();
			}
		}
	});

	function handleKeydown(event) {
		if (event.key === 'Tab') {
			activeDotIndex = -1;
			return;
		}

		if (!simulationData.length) return;

		event.preventDefault();

		let newIndex = activeDotIndex;
		const maxIndex = simulationData.length - 1;

		switch (event.key) {
			case "ArrowRight":
			case "ArrowDown":
				newIndex = activeDotIndex >= maxIndex ? 0 : activeDotIndex + 1;
				break;
			case "ArrowLeft":
			case "ArrowUp":
				newIndex = activeDotIndex <= 0 ? maxIndex : activeDotIndex - 1;
				break;
			case "Home":
				newIndex = 0;
				break;
			case "End":
				newIndex = maxIndex;
				break;
			case "Escape":
				event.preventDefault();
				event.stopPropagation();
				const currentEl = container.querySelector(`[data-index='${activeDotIndex}']`);
				if (currentEl?._tippy) {
					currentEl._tippy.hide();
				}
				newIndex = -1;
				if (container) container.blur();
				break;
			default:
				return;
		}

		if (newIndex !== activeDotIndex) {
			activeDotIndex = newIndex;
		}
	}

	const raiseCircle = (element) => {
		if (!element) return;
		select(element).raise(); // Brings the circle to the front
	};
</script>

<div
	class="beeswarm-container"
	bind:this={container}
    style:height="{dynamicHeight}px"
    tabindex="0"
    role="application"
    aria-label="Interactive beeswarm chart of news articles"
    onkeydown={handleKeydown}
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
				{#each simulationData as node, i}
					<circle
						cx={node.x}
						cy={node.y}
						r={NODE_RADIUS}
						fill="var(--tni-yellow)"
						stroke="#fff"
						stroke-width={1}
						opacity={0.75}
						role="tooltip"
						onmouseover={(event) => raiseCircle(event.currentTarget)}
						data-tippy-content={createTooltipContent(node)}
						data-index={i}
                        class:is-active={i === activeDotIndex}
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
		font-family: var(--sans);
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
			&.is-active {
				stroke: #000;
				stroke-width: 2;
			}
		}
		text {
			pointer-events: none;
			font-family: var(--sans);
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
