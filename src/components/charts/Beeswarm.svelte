<script>
	import { onMount } from "svelte";
	import { forceSimulation, forceX, forceY, forceCollide } from "d3-force";
	import { scaleTime, scaleLinear } from "d3-scale";
	import { extent } from "d3-array";
	import { select } from "d3-selection";
	import { axisBottom } from "d3-axis";
	import { timeYear, timeMonth } from "d3-time";
	import { tooltip, createTooltipContent } from "../../actions/tooltip.js";

	// Config
	const NODE_RADIUS = 4.5;
	const COLLIDE_RADIUS = NODE_RADIUS;
	const COLLIDE_STRENGTH = 1;
	const FORCE_X_STRENGTH = 0.5;
	const FORCE_Y_STRENGTH = 0.05; // Weaker Y-force to encourage horizontal spread
	const ANIMATED = true; // Set to false to render statically
	const STATIC_SIMULATION_TICKS = 300; // Used when ANIMATED is false

	const { data = [], height = "1000px", xDomain = null } = $props();

	let container;
	let canvasEl = $state(null);
	let width = $state(0);
	let heightVal = $state(0);
	let loading = $state(false);
	let hoveredNode = $state(null);
	let simulationData = [];

	const marginTop = 50;
	const marginRight = 50;
	const marginBottom = 50;
	const marginLeft = 50;

	$effect(() => {
		if (!container) return;
		const resizeObserver = new ResizeObserver((entries) => {
			for (let entry of entries) {
				width = entry.contentRect.width;
				heightVal = entry.contentRect.height;
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
		if (!width || !heightVal) return [];

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

		const labels = xScale.ticks(useMonths ? timeMonth : timeYear).map((date) => ({
			date,
			label: useMonths
				? date.toLocaleDateString(undefined, {
						month: "short",
						year: "2-digit"
					})
				: date.getFullYear()
		}));

		const yPosition = heightVal / 2;

		return labels.map((d) => ({
			x: xScale(d.date),
			y: yPosition,
			label: d.label
		}));
	});

	$effect(() => {
		if (!processedData.length || !width || !heightVal || !canvasEl) return;

		if (!ANIMATED) {
			loading = true;
		}

		const context = canvasEl.getContext("2d");
		simulationData = processedData.map((d) => ({ ...d }));

		const colorScale = scaleLinear()
			.domain([
				xScale.domain()[0],
				new Date(
					(xScale.domain()[0].getTime() + xScale.domain()[1].getTime()) / 2
				),
				xScale.domain()[1]
			])
			.range(["#a8d8f0", "#c8b4e2", "#f3c2d7"]);

		const verticalCenter = heightVal / 2;

		// Set initial positions for a more stable simulation
		simulationData.forEach((d) => {
			d.x = xScale(d.publish_date);
			d.y = verticalCenter;
		});

		const simulation = forceSimulation(simulationData)
			.force(
				"x",
				forceX((d) => xScale(d.publish_date)).strength(FORCE_X_STRENGTH)
			)
			.force("y", forceY(verticalCenter).strength(FORCE_Y_STRENGTH))
			.force(
				"collide",
				forceCollide(COLLIDE_RADIUS).strength(COLLIDE_STRENGTH)
			);

		function draw() {
			context.clearRect(0, 0, width, heightVal);

			// Draw nodes
			simulationData.forEach((node) => {
				context.beginPath();
				context.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);
				context.fillStyle = colorScale(node.publish_date);
				context.fill();
				context.strokeStyle = "#fff";
				context.lineWidth = 1;
				context.stroke();
			});
		}

		if (ANIMATED) {
			simulation.on("tick", draw);
		} else {
			// Use setTimeout to allow the UI to update with the spinner before blocking the main thread
			setTimeout(() => {
				simulation.tick(STATIC_SIMULATION_TICKS);
				draw();
				loading = false;
			}, 0);
		}

		const canvas = select(canvasEl);

		const mousemove = (event) => {
			const [mx, my] = [event.offsetX, event.offsetY];
			let foundNode = null;
			for (const node of simulationData) {
				const dx = mx - node.x;
				const dy = my - node.y;
				if (dx * dx + dy * dy < NODE_RADIUS * NODE_RADIUS) {
					foundNode = node;
					break;
				}
			}
			hoveredNode = foundNode;
		};

		const mouseleave = () => {
			hoveredNode = null;
		};

		canvas.on("mousemove", mousemove);
		canvas.on("mouseleave", mouseleave);

		return () => {
			simulation.stop();
			canvas.on("mousemove", null);
			canvas.on("mouseleave", null);
		};
	});

	const tooltipContent = $derived.by(() => {
		if (!hoveredNode) return null;
		return createTooltipContent(hoveredNode);
	});
</script>

<div class="beeswarm-container" bind:this={container} style:--height={height}>
	{#if loading && !ANIMATED}
		<div class="loading-spinner"></div>
	{/if}
	{#if width && heightVal}
		<canvas bind:this={canvasEl} {width} height={heightVal}></canvas>
		<svg class="axis-overlay" {width} height={heightVal}>
			<g>
				{#each yearLabels as label}
					<g transform="translate({label.x}, {label.y})">
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
	<div
		class="tooltip-anchor"
		use:tooltip={{ content: tooltipContent, trigger: "manual" }}
		style:--top={hoveredNode?.y ?? -9999}
		style:--left={hoveredNode?.x ?? -9999}
	></div>
</div>

<style>
	.beeswarm-container {
		width: 100%;
		height: var(--height);
		overflow: hidden;
		position: relative;
	}
	.axis-overlay {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
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
