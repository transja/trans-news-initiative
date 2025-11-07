<script>
	import { onMount } from "svelte";
	import { hierarchy, pack } from "d3-hierarchy";
	import { scaleLinear } from "d3-scale";
	import { min } from "d3-array";
	import { zoom, zoomIdentity } from "d3-zoom";
	import { select } from "d3-selection";
	import tippy from "tippy.js";
	import "tippy.js/dist/tippy.css";
	import "tippy.js/themes/light.css";
	import { fade } from "svelte/transition";
	import { Plus, Minus } from "@lucide/svelte";
	import { createTooltipContent } from "../../utils/createTooltipContent.js";
	import { isMobile } from "$utils/breakpoints.js";
	import Info from "$components/Info.svelte";

	const {
		data = [],
		height = "100vh",
		colors = [
			"#ff6b6b",
			"#4ecdc4",
			"#45b7d1",
			"#96ceb4",
			"#feca57",
			"#ff9ff3",
			"#54a0ff",
			"#5f27cd",
			"#00d2d3",
			"#ff9f43",
			"#10ac84",
			"#ee5a24",
			"#0abde3",
			"#ff3838",
			"#ff6348"
		]
	} = $props();

	const EVENT_COUNT_THRESHOLD = 5;

	let container;
	let svgEl = $state(null);
	let width = $state(0);
	let heightVal = $state(0);
	let transform = $state(zoomIdentity);
	let showZoomHint = $state(false);
	let hintTimeout;
	let zoomBehavior;
	let stickyInstance = null;
	let activeCircleIndex = $state(-1);

	onMount(() => {
		setTimeout(() => {
			showZoomHint = true;
			hintTimeout = setTimeout(() => {
				showZoomHint = false;
			}, 2000);
		}, 500);
	});

	const packed = $derived.by(() => {
		if (!data.length || !width || !heightVal) return null;

		const root = hierarchy(processData(data)).sum((d) => d.value);
		return pack()
			.size([width - 2, heightVal - 2])
			.padding(3)(root);
	});

	const leaves = $derived(packed ? packed.leaves() : []);

	function processData(sourceData) {
		const clusters = new Map();
		sourceData.forEach((d) => {
			if (!d.event) return;
			if (!clusters.has(d.event)) {
				clusters.set(d.event, []);
			}
			clusters.get(d.event).push({
				name: d.title,
				value: 1,
				url: d.url,
				publication: d.media_name,
				publication_date: d.publish_date,
				themes: d.themes,
				lean: d.lean,
				event: d.event
			});
		});

		return {
			name: "root",
			children: Array.from(clusters.entries())
				.filter((d) => d[1].length >= EVENT_COUNT_THRESHOLD)
				.map(([name, children]) => ({
					name,
					children
				}))
		};
	}

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

	function checkOverlap(boxA, boxB) {
		const padding = 5;
		return (
			boxA.x < boxB.x + boxB.width + padding &&
			boxA.x + boxA.width + padding > boxB.x &&
			boxA.y < boxB.y + boxB.height + padding &&
			boxA.y + boxA.height + padding > boxB.y
		);
	}

	function handleLabelOverlap() {
		if (!svgEl) return;

		const labels = Array.from(svgEl.querySelectorAll(".cluster-label-text"));
		labels.forEach((l) => (l.style.display = "block"));

		const sortedLabels = labels.sort(
			(a, b) => b.dataset.radius - a.dataset.radius
		);

		for (let i = 0; i < sortedLabels.length; i++) {
			const labelA = sortedLabels[i];
			if (labelA.style.display === "none") continue;

			const boxA = labelA.getBoundingClientRect();

			for (let j = i + 1; j < sortedLabels.length; j++) {
				const labelB = sortedLabels[j];
				if (labelB.style.display === "none") continue;

				const boxB = labelB.getBoundingClientRect();

				if (checkOverlap(boxA, boxB)) {
					labelB.style.display = "none";
				}
			}
		}
	}

	function wrapText(textEl) {
		const text = textEl.dataset.text;
		if (!text) return;
		const radius = parseFloat(textEl.dataset.radius);
		const maxWidth = radius * 2 - 10;
		const words = text.trim().split(/\s+/);
		textEl.textContent = "";

		const x = textEl.getAttribute("x");
		const lineHeight = 1.1;

		let tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
		tspan.setAttribute("x", x);
		textEl.appendChild(tspan);

		let line = [];
		for (const word of words) {
			line.push(word);
			tspan.textContent = line.join(" ");
			if (tspan.getComputedTextLength() > maxWidth && line.length > 1) {
				line.pop();
				tspan.textContent = line.join(" ");
				line = [word];
				tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
				tspan.setAttribute("x", x);
				tspan.setAttribute("dy", `${lineHeight}em`);
				tspan.textContent = word;
				textEl.appendChild(tspan);
			}
		}

		const tspans = textEl.querySelectorAll("tspan");
		const initialDy = -((tspans.length - 1) * lineHeight) / 2;
		if (tspans.length > 0) {
			tspans[0].setAttribute("dy", `${initialDy}em`);
		}
	}

	function updateLabels() {
		if (!svgEl) return;
		const labels = svgEl.querySelectorAll(".cluster-label-text");
		labels.forEach(wrapText);
		debouncedHandleLabelOverlap();
	}

	function debounce(func, wait) {
		let timeout;
		return function executedFunction(...args) {
			const later = () => {
				clearTimeout(timeout);
				func(...args);
			};
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
		};
	}

	const debouncedHandleLabelOverlap = debounce(handleLabelOverlap, 100);

	$effect(() => {
		if (!svgEl || !width || !heightVal || !packed) return;

		zoomBehavior = zoom()
			.scaleExtent([1, 8])
			.translateExtent([
				[-width / 2, -heightVal / 2],
				[width * 1.5, heightVal * 1.5]
			])
			.wheelDelta((event) => {
				if (event.ctrlKey || event.metaKey) {
					if (showZoomHint) {
						showZoomHint = false;
						clearTimeout(hintTimeout);
					}
					return (
						-event.deltaY *
						(event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002)
					);
				} else {
					showZoomHint = true;
					clearTimeout(hintTimeout);
					hintTimeout = setTimeout(() => {
						showZoomHint = false;
					}, 1500);
					return 0;
				}
			})
			.on("zoom", (event) => {
				transform = event.transform;
				updateLabels();
			});

		const selection = select(svgEl).call(zoomBehavior);

		if (packed.r) {
			const k = (Math.min(width, heightVal) / packed.r) * 0.95;

			const initialTransform = zoomIdentity
				.translate(width / 2, heightVal / 2) // 1. Move origin to SVG center
				.scale(k) // 2. Apply our new scale
				.translate(-packed.x, -packed.y); // 3. Move pack's center to the new origin

			selection.call(zoomBehavior.transform, initialTransform);
		}
	});

	$effect(() => {
		if (svgEl) {
			updateLabels();
		}
	});

	$effect(() => {
		if (data) {
			updateLabels();
		}
	});

	$effect(() => {
		if (!packed || !svgEl) return;
		let instances = [];
		const timer = setTimeout(() => {
			instances = tippy(
				svgEl.querySelectorAll(".is-leaf[data-tippy-content]"),
				{
					allowHTML: true,
					interactive: $isMobile,
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
				}
			);
		}, 100);
		return () => {
			clearTimeout(timer);
			instances.forEach((instance) => instance.destroy());
			stickyInstance = null;
		};
	});

	$effect(() => {
		if (!svgEl) return;

		const inactiveCircles = svgEl.querySelectorAll(
			`.is-leaf:not([data-index='${activeCircleIndex}'])`
		);
		inactiveCircles.forEach((el) => el._tippy?.hide());

		if (activeCircleIndex > -1) {
			const activeEl = svgEl.querySelector(
				`[data-index='${activeCircleIndex}']`
			);
			if (activeEl?._tippy) {
				activeEl._tippy.show();
			}
		}
	});

	function zoomIn() {
		if (!svgEl || !zoomBehavior) return;
		const selection = select(svgEl);
		selection.transition().call(zoomBehavior.scaleBy, 1.2);
	}

	function zoomOut() {
		if (!svgEl || !zoomBehavior) return;
		const selection = select(svgEl);
		selection.transition().call(zoomBehavior.scaleBy, 1 / 1.2);
	}

	function handleKeydown(event) {
		if (!leaves.length) return;

		event.preventDefault();

		let newIndex = activeCircleIndex;

		switch (event.key) {
			case "ArrowRight":
			case "ArrowDown":
				newIndex =
					activeCircleIndex >= leaves.length - 1 ? 0 : activeCircleIndex + 1;
				break;
			case "ArrowLeft":
			case "ArrowUp":
				newIndex =
					activeCircleIndex <= 0 ? leaves.length - 1 : activeCircleIndex - 1;
				break;
			case "Home":
				newIndex = 0;
				break;
			case "End":
				newIndex = leaves.length - 1;
				break;
			case "Escape":
				const currentEl = svgEl.querySelector(
					`[data-index='${activeCircleIndex}']`
				);
				if (currentEl?._tippy) {
					currentEl._tippy.hide();
				}
				newIndex = -1;
				if (svgEl) svgEl.blur();
				break;
			default:
				return;
		}

		if (newIndex !== activeCircleIndex) {
			activeCircleIndex = newIndex;
		}
	}
</script>

<div class="circlepack-container" bind:this={container} style:--height={height}>
	{#if showZoomHint}
		<div class="zoom-hint" transition:fade={{ duration: 200 }}>
			<p>Use <kbd>⌘</kbd> + scroll to zoom in and out.</p>
			<p>Interact with the circles for article info.</p>
		</div>
	{/if}
	{#if width && heightVal}
		<div class="chart-label">
			Articles grouped by event <Info instance="chart_circlePack" />
		</div>

		{#if packed}
			{@const descendants = packed.descendants()}
			{@const xValues = descendants.map((d) => d.x)}
			{@const xMin = Math.min(...xValues)}
			{@const xMax = Math.max(...xValues)}
			{@const linearColor = scaleLinear().domain([xMin, xMax]).range(colors)}
			{#if descendants.length > 1}
				<svg
					bind:this={svgEl}
					{width}
					height={heightVal}
					tabindex="0"
					role="application"
					aria-label="Interactive map of news articles"
					onkeydown={handleKeydown}
				>
					<g {transform}>
						<g transform="translate({width / 2}, {heightVal / 2})">
							{#each descendants.filter((d) => d.depth === 1) as node}
								<g
									transform="translate({node.x - width / 2},{node.y -
										heightVal / 2})"
									class="is-parent"
								>
									<circle
										r={node.r}
										fill="#fff"
										stroke={linearColor(node.x)}
										stroke-width={2}
										class="event-circle"
										vector-effect="non-scaling-stroke"
									/>
								</g>
							{/each}

							{#each leaves as node, i}
								<g
									transform="translate({node.x - width / 2},{node.y -
										heightVal / 2})"
									class="is-leaf"
									class:is-active={i === activeCircleIndex}
									data-index={i}
									data-tippy-content={createTooltipContent(node.data)}
								>
									<circle
										r={node.r}
										fill={linearColor(node.x)}
										fill-opacity={0.8}
										class="article-circle"
										vector-effect="non-scaling-stroke"
									/>
								</g>
							{/each}

							{#each descendants.filter((d) => d.depth === 1) as node}
								<text
									class="cluster-label-text"
									x={node.x - width / 2}
									y={node.y - heightVal / 2}
									text-anchor="middle"
									dominant-baseline="central"
									font-size={16 / transform.k}
									stroke-width={5 / transform.k}
									pointer-events="none"
									data-radius={node.r}
									data-text={node.data.name}
								>
									{node.data.name}
								</text>
							{/each}
						</g>
					</g>
				</svg>
			{:else}
				<div class="circlepack-empty">
					<b>0 events</b> match your current selections
				</div>
			{/if}
		{/if}
	{/if}

	<div class="zoom-controls">
		<button onclick={zoomIn}><Plus size={20} /></button>
		<button onclick={zoomOut}><Minus size={20} /></button>
	</div>
</div>

<style lang="scss">
	.circlepack-container {
		width: 100%;
		height: 100%;
		font-family: var(--sans);
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	svg {
		font-family: sans-serif;
		cursor: grab;
	}
	svg *:focus {
		outline: 0;
	}
	svg:active {
		cursor: grabbing;
	}
	.is-leaf {
		cursor: pointer;
	}
	.is-leaf circle:hover {
		fill-opacity: 1;
	}
	.is-leaf.is-active circle,
	.is-leaf:focus-visible circle {
		stroke: #000;
		stroke-width: 2;
		stroke-opacity: 1;
		fill-opacity: 1;
	}

	.event-circle {
		pointer-events: none;
	}
	.article-circle:hover {
		fill-opacity: 1;
		stroke-width: 2;
		stroke: #000;
	}
	.cluster-label-text {
		font-family: var(--sans);
		text-align: center;
		font-weight: 700;
		fill: var(--color-gray-1000);
		stroke: #fff;
		paint-order: stroke;
		stroke-linecap: butt;
		stroke-linejoin: miter;
	}

	.zoom-hint {
		position: absolute;
		font-family: var(--sans);
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background-color: rgba(0, 0, 0, 0.5);
		color: white;
		padding: 12px 24px;
		border-radius: 8px;
		font-size: 2rem;
		font-weight: 500;
		z-index: 10;
		pointer-events: none;
		white-space: nowrap;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;

		p {
			margin: 0;
		}
	}

	kbd {
		display: inline-block;
		font-family: monospace;
		font-weight: 700;
		padding: 2px 8px;
		margin-top: 5px;
		white-space: nowrap;
	}

	.zoom-controls {
		position: absolute;
		top: 1.5rem;
		right: 1.5rem;
		display: flex;
		gap: 5px;
		flex-direction: column;
		button {
			background: var(--color-gray-1000);
			color: #fff;
			width: 30px;
			height: 30px;
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
		}
	}

	.circlepack-empty {
		font-size: 2rem;
		margin-bottom: 1.5rem;
		font-weight: 400;
	}

	.chart-label {
		font-size: 1rem;
		font-weight: 600;
		background: var(--color-gray-1000);
		color: #fff;
		position: absolute;
		top: 1.5rem;
		left: 1.5rem;
		z-index: 10;
		padding: 0.125rem 0.5rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>
