<script>
	import { onMount } from "svelte";
	import { forceSimulation, forceX, forceY, forceCollide } from "d3-force";
	import { scaleTime, scaleLinear } from "d3-scale";
	import { extent } from "d3-array";
	import { select } from "d3-selection";
	import { axisBottom } from "d3-axis";
	import { timeYear, timeMonth } from "d3-time";
	import tippy from "tippy.js";
	import "tippy.js/dist/tippy.css";
	import "tippy.js/themes/light.css";

	import { createTooltipContent } from "../../utils/createTooltipContent.js";

	// Config
	const NODE_RADIUS = 4.5;
	const COLLIDE_RADIUS = NODE_RADIUS;
	const COLLIDE_STRENGTH = 1;
	const FORCE_X_STRENGTH = 0.5;
	const FORCE_Y_STRENGTH = 0.05; // Weaker Y-force to encourage horizontal spread/ Set to false to render statically
	const STATIC_SIMULATION_TICKS = 300; // Used when ANIMATED is false

	const { data = [], xDomain = null } = $props();

	let container;
	let canvasEl = $state(null);
	let width = $state(0);
	let dynamicHeight = $state(150);
	let loading = $state(true);
	let hoveredNode = $state(null);
	let stickyNode = $state(null);
	let simulationData = $state([]);
	let yOffset = $state(0);
	let simulation = null;

	const marginTop = 50;
	const marginRight = 50;
	const marginBottom = 50;
	const marginLeft = 50;

	onMount(() => {
		const handleClickOutside = (event) => {
			if (stickyNode && canvasEl && !canvasEl.contains(event.target)) {
				// Clicks inside the tooltip popper should not close it
				const popper = document.querySelector(".tippy-popper");
				if (popper && popper.contains(event.target)) {
					return;
				}
				stickyNode = null;
			}
		};
		document.addEventListener("click", handleClickOutside, true);
		return () =>
			document.removeEventListener("click", handleClickOutside, true);
	});

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

		// Set initial positions for a more stable simulation
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

		// Use setTimeout to avoid blocking the main thread during intensive calculation
		setTimeout(() => {
			if (!simulation) return; // Component might have been destroyed
			simulation.tick(STATIC_SIMULATION_TICKS);

			const [minY, maxY] = extent(simData, (d) => d.y);
			const contentHeight = maxY - minY + NODE_RADIUS * 2;
			dynamicHeight = Math.max(150, contentHeight + marginTop + marginBottom);
			yOffset = dynamicHeight / 2 - (minY + maxY) / 2;
			simulationData = simData; // Trigger drawing effect

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
		if (!simulationData.length || !canvasEl) return;

		const context = canvasEl.getContext("2d");

		const ratio = window.devicePixelRatio || 1;

		canvasEl.width = width * ratio;
		canvasEl.height = dynamicHeight * ratio;

		canvasEl.style.width = `${width}px`;
		canvasEl.style.height = `${dynamicHeight}px`;

		context.setTransform(ratio, 0, 0, ratio, 0, 0);

		const colorScale = scaleLinear()
			.domain([
				xScale.domain()[0],
				new Date(
					(xScale.domain()[0].getTime() + xScale.domain()[1].getTime()) / 2
				),
				xScale.domain()[1]
			])
			.range(["#a8d8f0", "#c8b4e2", "#f3c2d7"]);

		function draw() {
			context.clearRect(0, 0, width, dynamicHeight);
			context.save();
			context.translate(0, yOffset);

			simulationData.forEach((node) => {
				if (node === hoveredNode || node === stickyNode) return; // skip highlight ones

				context.beginPath();
				context.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);
				context.fillStyle = colorScale(node.publish_date);
				context.fill();
				context.lineWidth = 1;
				context.strokeStyle = "#fff";
				context.stroke();
			});

			[hoveredNode, stickyNode].forEach((node) => {
				if (!node) return;

				context.beginPath();
				context.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);
				context.fillStyle = colorScale(node.publish_date);
				context.fill();
				context.lineWidth = 3;
				context.strokeStyle = "#000"; // highlight stroke
				context.stroke();
			});

			context.restore();
		}

		draw();

		const canvas = select(canvasEl);

		const findNodeAt = (mx, my) => {
			const transformedMy = my - yOffset;
			let foundNode = null;
			// Iterate backwards to find the topmost node
			for (let i = simulationData.length - 1; i >= 0; i--) {
				const node = simulationData[i];
				const dx = mx - node.x;
				const dy = transformedMy - node.y;
				if (dx * dx + dy * dy < NODE_RADIUS * NODE_RADIUS) {
					foundNode = node;
					break;
				}
			}
			return foundNode;
		};

		const mousemove = (event) => {
			const [mx, my] = [event.offsetX, event.offsetY];
			hoveredNode = findNodeAt(mx, my);

			if (hoveredNode) {
				canvasEl.style.cursor = "pointer";
			} else {
				canvasEl.style.cursor = "default";
			}
		};

		const mouseleave = () => {
			hoveredNode = null;
		};

		const click = (event) => {
			const [mx, my] = [event.offsetX, event.offsetY];
			const foundNode = findNodeAt(mx, my);
			if (foundNode) {
				if (stickyNode?.url === foundNode.url) {
					stickyNode = null;
				} else {
					stickyNode = foundNode;
				}
			} else {
				stickyNode = null;
			}
		};

		canvas.on("mousemove", mousemove);
		canvas.on("mouseleave", mouseleave);
		canvas.on("click", click);

		return () => {
			canvas.on("mousemove", null);
			canvas.on("mouseleave", null);
			canvas.on("click", null);
		};
	});

	const tooltipTargetNode = $derived(stickyNode ?? hoveredNode);

	const tooltipContent = $derived.by(() => {
		if (!tooltipTargetNode) return null;
		return createTooltipContent(tooltipTargetNode);
	});

	const isSticky = $derived(!!stickyNode);

	function tooltip(node, params) {
		const getOptions = (p) => {
			if (typeof p === "string" || !p) {
				return { content: p, trigger: "mouseenter focus", interactive: false };
			}
			return { trigger: "mouseenter focus", interactive: false, ...p };
		};

		let options = getOptions(params);

		const instance = tippy(node, {
			allowHTML: true,
			arrow: true,
			duration: 0,
			theme: "light",
			content: options.content,
			trigger: options.trigger,
			interactive: options.interactive,
			appendTo: () => document.body
		});

		if (!options.content) {
			instance.disable();
		}

		if (options.trigger === "manual" && options.content) {
			instance.show();
		}

		return {
			update(newParams) {
				const newOptions = getOptions(newParams);
				instance.setProps({
					trigger: newOptions.trigger,
					interactive: newOptions.interactive
				});

				if (newOptions.content) {
					instance.setContent(newOptions.content);
					instance.enable();
					if (newOptions.trigger === "manual") {
						instance.show();
					}
				} else {
					instance.disable();
					if (newOptions.trigger === "manual") {
						instance.hide();
					}
				}
			},
			destroy() {
				instance.destroy();
			}
		};
	}
</script>

<div
	class="beeswarm-container"
	bind:this={container}
	style:height="{dynamicHeight}px"
>
	{#if loading}
		<div class="loading-spinner"></div>
	{/if}
	{#if width && dynamicHeight}
		{@const axisY = dynamicHeight / 2}

		<svg class="axis-overlay ticks" {width} height={dynamicHeight}>
			<g>
				<line
					x1={marginLeft}
					x2={width - marginRight}
					y1={axisY}
					y2={axisY}
					style="stroke: var(--color-gray-300); stroke-width: 1;"
				/>
				{#each yearLabels as label}
					<g class="tick" transform="translate({label.x}, 0)">
						<!-- <line
							y1={axisY}
							y2={axisY + 7}
							style="stroke: var(--color-gray-300); stroke-width: 1;"
						/> -->
					</g>
				{/each}
			</g>
		</svg>

		<canvas bind:this={canvasEl} {width} height={dynamicHeight}></canvas>
		<svg class="axis-overlay labels" {width} height={dynamicHeight}>
			<g>
				{#each yearLabels as label}
					<g transform="translate({label.x}, 0)">
						<text
							y={axisY + 17}
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
	<div
		class="tooltip-anchor"
		use:tooltip={{
			content: tooltipContent,
			trigger: "manual",
			interactive: isSticky
		}}
		style:--top={tooltipTargetNode ? tooltipTargetNode.y + yOffset : -9999}
		style:--left={tooltipTargetNode?.x ?? -9999}
	></div>
</div>

<style lang="scss">
	.beeswarm-container {
		width: 100%;
		overflow: hidden;
		position: relative;
	}
	.axis-overlay {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;

		.tick {
			z-index: 1;
		}
		&.labels {
			z-index: 20;
		}
	}
	.tooltip-anchor {
		position: absolute;
		top: calc(var(--top) * 1px);
		left: calc(var(--left) * 1px);
		width: 0;
		height: 0;
		pointer-events: none;
	}
	canvas {
		font-family: sans-serif;
		z-index: 10;
		position: relative;
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
		z-index: 10;
	}
	@keyframes spin {
		to {
			transform: translate(-50%, -50%) rotate(360deg);
		}
	}
</style>
