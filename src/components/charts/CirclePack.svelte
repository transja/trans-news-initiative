<script>
	import { onMount } from "svelte";
	import { hierarchy, pack } from "d3-hierarchy";
	import { scaleLinear } from "d3-scale";
	import { min } from "d3-array";
	import { schemeTableau10 } from "d3-scale-chromatic";
	import { zoom, zoomIdentity } from "d3-zoom";
	import { select } from "d3-selection";
	import tippy from "tippy.js";
	import "tippy.js/dist/tippy.css";
	import "tippy.js/themes/light.css";
	import { fade } from "svelte/transition";
	import { Plus, Minus } from "@lucide/svelte";
	import { tooltip, createTooltipContent } from "../../actions/tooltip.js";
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

	let container;
	let svgEl = $state(null);
	let width = $state(0);
	let heightVal = $state(0);
	let transform = $state(zoomIdentity);
	let showZoomHint = $state(false);
	let hintTimeout;
	let zoomBehavior;

	let stickyNode = $state(null);

	$effect(() => {
		const handleOutsideClick = () => {
			stickyNode = null;
		};
		document.addEventListener("click", handleOutsideClick);
		return () => {
			document.removeEventListener("click", handleOutsideClick);
		};
	});

	function handleNodeClick(event, node) {
		event.stopPropagation();
		stickyNode = node;
	}

	const packed = $derived.by(() => {
		if (!data.length || !width || !heightVal) return null;
		const root = hierarchy(processData(data)).sum((d) => d.value);
		return pack()
			.size([width - 2, heightVal - 2])
			.padding(3)(root);
	});

	function processData(sourceData) {
		const clusters = new Map();
		sourceData.forEach((d) => {
			// if (!d.cluster || d.cluster === "-1") return;
			if (!clusters.has(d.label)) {
				clusters.set(d.label, []);
			}
			clusters.get(d.label).push({
				...d,
				name: d.title,
				value: 1,
				publication: d.media_name,
				publication_date: d.publish_date
			});
		});

		return {
			name: "root",
			children: Array.from(clusters.entries()).map(([name, children]) => ({
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
		const padding = 5; // 5px padding around labels
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
		// Ensure all labels are visible before checking for overlaps
		labels.forEach((l) => (l.style.display = "block"));

		// Sort labels by the radius of their corresponding circle, descending
		// So we prioritize showing labels for larger circles.
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
		const maxWidth = radius * 2 - 10; // padding
		const words = text.trim().split(/\s+/);
		textEl.textContent = "";

		const x = textEl.getAttribute("x");
		const lineHeight = 1.1; // ems

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

		const minRadius = min(packed.leaves(), (d) => d.r);
		if (minRadius) {
			const minTargetRadius = 5; // 20px diameter
			let k = Math.max(1, minTargetRadius / minRadius);
			k = Math.min(k, 8); // clamp to max zoom from scaleExtent

			const initialTransform = zoomIdentity
				.translate(width / 2, heightVal / 2)
				.scale(k)
				.translate(-packed.x, -packed.y);

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
</script>

<div class="circlepack-container" bind:this={container} style:--height={height}>
	{#if showZoomHint}
		<div class="zoom-hint" transition:fade={{ duration: 200 }}>
			Use <kbd>⌘</kbd> + scroll to zoom in and out
		</div>
	{/if}
	{#if width && heightVal}
		<svg bind:this={svgEl} {width} height={heightVal}>
			{#if packed}
				{@const descendants = packed.descendants()}
				{@const xValues = descendants.map((d) => d.x)}
				{@const xMin = Math.min(...xValues)}
				{@const xMax = Math.max(...xValues)}
				{@const linearColor = scaleLinear().domain([xMin, xMax]).range(colors)}

				<g {transform}>
					<g transform="translate({width / 2}, {heightVal / 2})">
						{#each descendants.filter((d) => d.depth > 0) as node}
							<g
								transform="translate({node.x - width / 2},{node.y -
									heightVal / 2})"
								class:is-leaf={!node.children}
								class:is-parent={node.depth === 1}
							>
								<circle
									r={node.r}
									fill={node.children ? "#fff" : linearColor(node.x)}
									fill-opacity={node.children ? 1 : 0.8}
									stroke={node.children ? linearColor(node.x) : "none"}
									stroke-width={node.children ? 2 : 0}
									class:article-circle={!node.children}
									onclick={(e) => handleNodeClick(e, node)}
									use:tooltip={{
										content: createTooltipContent(node.data),
										isSticky: stickyNode === node
									}}
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
								font-size={18 / transform.k}
								stroke-width={3 / transform.k}
								pointer-events="none"
								data-radius={node.r}
								data-text={node.data.name}
							>
								{node.data.name}
							</text>
						{/each}
					</g>
				</g>
			{/if}
		</svg>
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

		position: relative;
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
	.is-leaf circle:hover {
		fill-opacity: 1;
	}

	.article-circle:hover {
		fill-opacity: 1;
		stroke-width: 2;
		stroke: #000;
		cursor: crosshair;
	}
	.cluster-label-text {
		text-align: center;
		font-weight: 700;
		fill: var(--color-gray-1000);
		stroke: #fff;
		stroke-width: 5;
		paint-order: stroke;
		stroke-linecap: butt;
		stroke-linejoin: miter;
	}

	.zoom-hint {
		position: absolute;
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
		align-items: center;
		justify-content: center;
	}

	kbd {
		display: inline-block;
		font-family: monospace;
		/* font-size: 0.85em; */
		font-weight: 700;
		/* line-height: 1; */
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
</style>
