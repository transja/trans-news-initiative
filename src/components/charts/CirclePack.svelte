<script>
	import { onMount } from "svelte";
	import { hierarchy, pack, packEnclose } from "d3-hierarchy";
	import { scaleLinear } from "d3-scale";
	import { quadtree } from "d3-quadtree";
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
		],
		eventsToInclude = []
	} = $props();

	const LEAF_ALPHA = 0.8;
	const BAKE_SCALE = 2;
	const MAX_BAKE_DIM = 8192;

	function quantizeColor(color) {
		const match = String(color).match(/[\d.]+/g);
		if (!match || match.length < 3) return color;
		const r = Math.round(+match[0] / 8) * 8;
		const g = Math.round(+match[1] / 8) * 8;
		const b = Math.round(+match[2] / 8) * 8;
		return `rgb(${r},${g},${b})`;
	}

	function extent(values, accessor) {
		let min = Infinity;
		let max = -Infinity;
		for (let i = 0; i < values.length; i++) {
			const v = accessor ? accessor(values[i]) : values[i];
			if (v < min) min = v;
			if (v > max) max = v;
		}
		return [min, max];
	}

	let container;
	let canvasEl = $state(null);
	let svgEl = $state(null);
	let width = $state(0);
	let heightVal = $state(0);
	/** Debounced layout used for expensive pack() — avoids repacking on every resize tick */
	let packWidth = $state(0);
	let packHeight = $state(0);
	let transform = $state(zoomIdentity);
	let showZoomHint = $state(false);
	let hintTimeout;
	let zoomBehavior;
	let stickyInstance = null;
	let activeCircleIndex = $state(-1);
	let hoveredCircleIndex = $state(-1);
	let tippyInstance = null;
	let labelsWrappedForPacked = null;

	/** @type {OffscreenCanvas | HTMLCanvasElement | null} */
	let leafBake = null;
	/** @type {{ x: number, y: number, r: number, color: string }[]} */
	let parentNodes = [];
	/** @type {ReturnType<typeof quadtree> | null} */
	let leafTree = null;
	let maxLeafR = 0;
	let bakeOriginX = 0;
	let bakeOriginY = 0;
	let leafBakeScale = BAKE_SCALE;
	let needsRedraw = false;
	let rafId = 0;
	let resizePackTimeout;

	onMount(() => {
		setTimeout(() => {
			showZoomHint = true;
			hintTimeout = setTimeout(() => {
				showZoomHint = false;
			}, 2000);
		}, 500);

		return () => {
			cancelAnimationFrame(rafId);
			clearTimeout(resizePackTimeout);
			tippyInstance?.destroy();
			tippyInstance = null;
			stickyInstance = null;
		};
	});

	const eventIncludeKey = $derived(
		Array.isArray(eventsToInclude) ? eventsToInclude.join("\0") : ""
	);
	const eventIncludeSet = $derived(new Set(eventsToInclude));

	const packed = $derived.by(() => {
		if (!data.length || !packWidth || !packHeight) return null;
		void eventIncludeKey;

		const root = hierarchy(processData(data))
			.sum((d) => d.value)
			.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

		// depth 0 = space between event bubbles; depth 1+ = tiny gap inside events
		return pack()
			.size([packWidth - 2, packHeight - 2])
			.padding((node) => (node.depth === 0 ? 3 : 1))(root);
	});

	const leaves = $derived(packed ? packed.leaves() : []);
	const parents = $derived(
		packed ? packed.descendants().filter((d) => d.depth === 1) : []
	);
	const hasContent = $derived(!!packed && packed.descendants().length > 1);

	const colorScale = $derived.by(() => {
		if (!packed) return null;
		const [xMin, xMax] = extent(packed.descendants(), (d) => d.x);
		if (!Number.isFinite(xMin) || !Number.isFinite(xMax)) return null;
		return scaleLinear().domain([xMin, xMax]).range(colors);
	});

	function processData(sourceData) {
		const clusters = new Map();
		const include = eventIncludeSet;
		sourceData.forEach((d) => {
			if (!d.event) return;
			if (!include.has(d.event)) return;
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
				const nextW = entry.contentRect.width;
				const nextH = entry.contentRect.height;
				width = nextW;
				heightVal = nextH;

				clearTimeout(resizePackTimeout);
				resizePackTimeout = setTimeout(() => {
					if (
						Math.abs(packWidth - nextW) > 1 ||
						Math.abs(packHeight - nextH) > 1
					) {
						packWidth = nextW;
						packHeight = nextH;
					}
				}, 150);

				// First layout: pack immediately so we don't flash empty
				if (!packWidth || !packHeight) {
					packWidth = nextW;
					packHeight = nextH;
				}
			}
		});

		resizeObserver.observe(container);

		return () => {
			resizeObserver.disconnect();
			clearTimeout(resizePackTimeout);
		};
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
		// Use px, not em: Safari iOS compounds em-based tspan dy with zoom
		// transforms and dominant-baseline, creating huge gaps between lines.
		const fontSize = parseFloat(textEl.getAttribute("font-size")) || 16;
		const lineHeightPx = fontSize * 1.1;
		// Without dominant-baseline="central" (unsafe on iOS), shift alphabetic
		// baseline so the block optically matches the old centered look.
		const baselineNudge = fontSize * 0.35;

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
				tspan.setAttribute("dy", String(lineHeightPx));
				tspan.textContent = word;
				textEl.appendChild(tspan);
			}
		}

		const tspans = textEl.querySelectorAll("tspan");
		if (tspans.length > 0) {
			const initialDy =
				-((tspans.length - 1) * lineHeightPx) / 2 + baselineNudge;
			tspans[0].setAttribute("dy", String(initialDy));
		}
	}

	/** Keep tspan spacing in sync when font-size changes with zoom. */
	function syncLabelLineHeights() {
		if (!svgEl) return;
		const labels = svgEl.querySelectorAll(".cluster-label-text");
		labels.forEach((textEl) => {
			const tspans = textEl.querySelectorAll("tspan");
			if (!tspans.length) return;
			const fontSize = parseFloat(textEl.getAttribute("font-size")) || 16;
			const lineHeightPx = fontSize * 1.1;
			const baselineNudge = fontSize * 0.35;
			tspans[0].setAttribute(
				"dy",
				String(-((tspans.length - 1) * lineHeightPx) / 2 + baselineNudge)
			);
			for (let i = 1; i < tspans.length; i++) {
				tspans[i].setAttribute("dy", String(lineHeightPx));
			}
		});
	}

	function updateLabels({ forceWrap = false } = {}) {
		if (!svgEl) return;
		const labels = svgEl.querySelectorAll(".cluster-label-text");
		if (forceWrap || labelsWrappedForPacked !== packed) {
			labels.forEach(wrapText);
			labelsWrappedForPacked = packed;
		}
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
	const debouncedLabelOverlapOnly = debounce(() => {
		if (!svgEl) return;
		handleLabelOverlap();
	}, 120);

	function scheduleRedraw() {
		needsRedraw = true;
		if (rafId) return;
		rafId = requestAnimationFrame(() => {
			rafId = 0;
			if (needsRedraw) {
				needsRedraw = false;
				drawFrame();
			}
		});
	}

	function rebuildGeometry() {
		if (!packed || !colorScale || !hasContent || !leaves.length) {
			leafBake = null;
			leafTree = null;
			parentNodes = [];
			scheduleRedraw();
			return;
		}

		parentNodes = parents.map((node) => ({
			x: node.x,
			y: node.y,
			r: node.r,
			color: colorScale(node.x)
		}));

		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		maxLeafR = 0;

		const treeData = new Array(leaves.length);
		for (let i = 0; i < leaves.length; i++) {
			const node = leaves[i];
			minX = Math.min(minX, node.x - node.r);
			minY = Math.min(minY, node.y - node.r);
			maxX = Math.max(maxX, node.x + node.r);
			maxY = Math.max(maxY, node.y + node.r);
			if (node.r > maxLeafR) maxLeafR = node.r;
			treeData[i] = { x: node.x, y: node.y, r: node.r, index: i };
		}

		leafTree = quadtree()
			.x((d) => d.x)
			.y((d) => d.y)
			.addAll(treeData);

		bakeOriginX = minX;
		bakeOriginY = minY;
		let bakeW = Math.max(1, Math.ceil((maxX - minX) * BAKE_SCALE));
		let bakeH = Math.max(1, Math.ceil((maxY - minY) * BAKE_SCALE));
		const scaleX = bakeW > MAX_BAKE_DIM ? MAX_BAKE_DIM / bakeW : 1;
		const scaleY = bakeH > MAX_BAKE_DIM ? MAX_BAKE_DIM / bakeH : 1;
		const bakeScale = BAKE_SCALE * Math.min(scaleX, scaleY);
		bakeW = Math.max(1, Math.ceil((maxX - minX) * bakeScale));
		bakeH = Math.max(1, Math.ceil((maxY - minY) * bakeScale));

		try {
			const bake =
				typeof OffscreenCanvas !== "undefined"
					? new OffscreenCanvas(bakeW, bakeH)
					: Object.assign(document.createElement("canvas"), {
							width: bakeW,
							height: bakeH
						});
			const bctx = bake.getContext("2d");
			if (!bctx) {
				leafBake = null;
			} else {
				bctx.clearRect(0, 0, bakeW, bakeH);
				bctx.setTransform(
					bakeScale,
					0,
					0,
					bakeScale,
					-minX * bakeScale,
					-minY * bakeScale
				);

				const byColor = new Map();
				for (let i = 0; i < leaves.length; i++) {
					const node = leaves[i];
					const color = quantizeColor(colorScale(node.x));
					let path = byColor.get(color);
					if (!path) {
						path = new Path2D();
						byColor.set(color, path);
					}
					path.moveTo(node.x + node.r, node.y);
					path.arc(node.x, node.y, node.r, 0, Math.PI * 2);
				}

				bctx.globalAlpha = LEAF_ALPHA;
				for (const [color, path] of byColor) {
					bctx.fillStyle = color;
					bctx.fill(path);
				}

				leafBake = bake;
				leafBakeScale = bakeScale;
			}
		} catch (err) {
			console.warn("CirclePack: leaf bake failed, using live draw", err);
			leafBake = null;
		}

		scheduleRedraw();
		queueMicrotask(() => updateLabels({ forceWrap: true }));
	}

	function drawFrame() {
		if (!canvasEl || !width || !heightVal) return;

		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const targetW = Math.floor(width * dpr);
		const targetH = Math.floor(heightVal * dpr);
		if (canvasEl.width !== targetW || canvasEl.height !== targetH) {
			canvasEl.width = targetW;
			canvasEl.height = targetH;
			canvasEl.style.width = `${width}px`;
			canvasEl.style.height = `${heightVal}px`;
		}

		const ctx = canvasEl.getContext("2d");
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
		ctx.setTransform(
			transform.k * dpr,
			0,
			0,
			transform.k * dpr,
			transform.x * dpr,
			transform.y * dpr
		);

		// Parent event rings (non-scaling stroke ≈ strokeWidth / k)
		const strokeWidth = 2 / transform.k;
		for (const node of parentNodes) {
			ctx.beginPath();
			ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
			ctx.fillStyle = "#fff";
			ctx.fill();
			ctx.lineWidth = strokeWidth;
			ctx.strokeStyle = node.color;
			ctx.stroke();
		}

		if (leafBake && transform.k <= leafBakeScale) {
			ctx.drawImage(
				leafBake,
				bakeOriginX,
				bakeOriginY,
				leafBake.width / leafBakeScale,
				leafBake.height / leafBakeScale
			);
		} else if (colorScale && leaves.length && leafTree) {
			// Crisp redraw of only in-view leaves when zoomed past bake resolution
			const pad = maxLeafR;
			const [x0, y0] = transform.invert([-pad, -pad]);
			const [x1, y1] = transform.invert([width + pad, heightVal + pad]);
			const minX = Math.min(x0, x1);
			const maxX = Math.max(x0, x1);
			const minY = Math.min(y0, y1);
			const maxY = Math.max(y0, y1);

			const byColor = new Map();
			leafTree.visit((node, x0b, y0b, x1b, y1b) => {
				if (!node.length) {
					do {
						const d = node.data;
						const leaf = leaves[d.index];
						if (
							leaf &&
							leaf.x + leaf.r >= minX &&
							leaf.x - leaf.r <= maxX &&
							leaf.y + leaf.r >= minY &&
							leaf.y - leaf.r <= maxY
						) {
							const color = quantizeColor(colorScale(leaf.x));
							let path = byColor.get(color);
							if (!path) {
								path = new Path2D();
								byColor.set(color, path);
							}
							path.moveTo(leaf.x + leaf.r, leaf.y);
							path.arc(leaf.x, leaf.y, leaf.r, 0, Math.PI * 2);
						}
					} while ((node = node.next));
					return;
				}
				return x0b > maxX || x1b < minX || y0b > maxY || y1b < minY;
			});

			ctx.globalAlpha = LEAF_ALPHA;
			for (const [color, path] of byColor) {
				ctx.fillStyle = color;
				ctx.fill(path);
			}
			ctx.globalAlpha = 1;
		} else if (leafBake) {
			ctx.drawImage(
				leafBake,
				bakeOriginX,
				bakeOriginY,
				leafBake.width / leafBakeScale,
				leafBake.height / leafBakeScale
			);
		}

		const highlightIndex =
			activeCircleIndex > -1 ? activeCircleIndex : hoveredCircleIndex;
		if (highlightIndex > -1 && leaves[highlightIndex]) {
			const node = leaves[highlightIndex];
			const color = colorScale ? colorScale(node.x) : "#999";
			ctx.beginPath();
			ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
			ctx.fillStyle = color;
			ctx.globalAlpha = 1;
			ctx.fill();
			ctx.globalAlpha = 1;
			ctx.lineWidth = strokeWidth;
			ctx.strokeStyle = "#000";
			ctx.stroke();
		}
	}

	function findLeafAt(dataX, dataY) {
		if (!leafTree) return null;
		let found = null;
		let foundR = Infinity;
		const searchR = maxLeafR;

		leafTree.visit((node, x0, y0, x1, y1) => {
			if (!node.length) {
				do {
					const d = node.data;
					const dx = dataX - d.x;
					const dy = dataY - d.y;
					if (dx * dx + dy * dy <= d.r * d.r && d.r <= foundR) {
						found = d;
						foundR = d.r;
					}
				} while ((node = node.next));
				return;
			}
			return (
				x0 > dataX + searchR ||
				x1 < dataX - searchR ||
				y0 > dataY + searchR ||
				y1 < dataY - searchR
			);
		});

		return found;
	}

	function getCanvasPoint(event) {
		if (!canvasEl) return null;
		const rect = canvasEl.getBoundingClientRect();
		return [event.clientX - rect.left, event.clientY - rect.top];
	}

	function getTooltipRect(index) {
		if (!canvasEl || index < 0 || !leaves[index]) {
			return {
				width: 0,
				height: 0,
				top: 0,
				left: 0,
				right: 0,
				bottom: 0
			};
		}
		const node = leaves[index];
		const [sx, sy] = transform.apply([node.x, node.y]);
		const rect = canvasEl.getBoundingClientRect();
		const top = rect.top + sy;
		const left = rect.left + sx;
		return {
			width: 0,
			height: 0,
			top,
			left,
			right: left,
			bottom: top
		};
	}

	function ensureTippy() {
		if (tippyInstance || !canvasEl) return tippyInstance;
		tippyInstance = tippy(canvasEl, {
			allowHTML: true,
			interactive: $isMobile,
			appendTo: () => document.body,
			theme: "light",
			trigger: "manual",
			animation: false,
			getReferenceClientRect: () =>
				getTooltipRect(
					activeCircleIndex > -1 ? activeCircleIndex : hoveredCircleIndex
				),
			onShow(instance) {
				if (stickyInstance && stickyInstance !== instance) {
					return false;
				}
			},
			onHide(instance) {
				if (stickyInstance === instance) {
					stickyInstance = null;
				}
			}
		});
		return tippyInstance;
	}

	function showTooltipForIndex(index, { sticky = false } = {}) {
		if (index < 0 || !leaves[index]) {
			hideTooltip(true);
			return;
		}
		const instance = ensureTippy();
		if (!instance) return;

		instance.setContent(
			(() => {
				try {
					return createTooltipContent(leaves[index].data);
				} catch (err) {
					console.warn("CirclePack: tooltip content failed", err);
					return leaves[index].data?.name || "Article";
				}
			})()
		);
		instance.setProps({
			getReferenceClientRect: () => getTooltipRect(index),
			interactive: sticky || $isMobile
		});

		if (sticky) {
			if (stickyInstance && stickyInstance !== instance) {
				stickyInstance.hide();
			}
			stickyInstance = instance;
		}

		instance.show();
	}

	function hideTooltip(force = false) {
		if (!force && stickyInstance) return;
		if (force) stickyInstance = null;
		tippyInstance?.hide();
	}

	function syncTooltipPosition() {
		if (!tippyInstance?.state.isVisible) return;
		const idx =
			activeCircleIndex > -1 ? activeCircleIndex : hoveredCircleIndex;
		if (idx < 0) return;
		tippyInstance.setProps({
			getReferenceClientRect: () => getTooltipRect(idx)
		});
		tippyInstance.popperInstance?.update();
	}

	function setHovered(index) {
		if (hoveredCircleIndex === index) return;
		hoveredCircleIndex = index;
		if (canvasEl) {
			canvasEl.style.cursor = index > -1 ? "pointer" : "grab";
		}
		scheduleRedraw();
	}

	$effect(() => {
		void leaves;
		void parents;
		void colors;
		void eventIncludeKey;
		void colorScale;
		void hasContent;
		rebuildGeometry();
	});

	$effect(() => {
		void transform;
		void activeCircleIndex;
		void hoveredCircleIndex;
		scheduleRedraw();
	});

	$effect(() => {
		if (!canvasEl || !width || !heightVal || !packed || !hasContent) return;

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
				// Overlap only — wrapping is expensive and only needs to run after layout changes
				syncLabelLineHeights();
				debouncedLabelOverlapOnly();
				syncTooltipPosition();
			});

		const selection = select(canvasEl).call(zoomBehavior);

		const onPointerMove = (event) => {
			if (stickyInstance) return;
			const point = getCanvasPoint(event);
			if (!point) return;
			const [dx, dy] = transform.invert(point);
			const hit = findLeafAt(dx, dy);
			const index = hit ? hit.index : -1;
			setHovered(index);
			if (index > -1) {
				showTooltipForIndex(index);
			} else {
				hideTooltip();
			}
		};

		const onPointerLeave = () => {
			if (stickyInstance) return;
			setHovered(-1);
			hideTooltip();
		};

		const onClick = (event) => {
			const point = getCanvasPoint(event);
			if (!point) return;
			const [dx, dy] = transform.invert(point);
			const hit = findLeafAt(dx, dy);

			if (!hit) {
				hideTooltip(true);
				activeCircleIndex = -1;
				return;
			}

			if (stickyInstance && activeCircleIndex === hit.index) {
				hideTooltip(true);
				activeCircleIndex = -1;
				return;
			}

			activeCircleIndex = hit.index;
			hoveredCircleIndex = hit.index;
			showTooltipForIndex(hit.index, { sticky: true });
		};

		const onKeyDown = (event) => handleKeydown(event);

		canvasEl.addEventListener("pointermove", onPointerMove);
		canvasEl.addEventListener("pointerleave", onPointerLeave);
		canvasEl.addEventListener("click", onClick);
		canvasEl.addEventListener("keydown", onKeyDown);

		if (packed.r && parents.length) {
			// Fit the event circles themselves (not the padded root hull)
			const content = packEnclose(
				parents.map((p) => ({ x: p.x, y: p.y, r: p.r }))
			);
			const k =
				(Math.min(width, heightVal) / (2 * content.r)) * 0.98;
			const initialTransform = zoomIdentity
				.translate(width / 2, heightVal / 2)
				.scale(k)
				.translate(-content.x, -content.y);
			selection.call(zoomBehavior.transform, initialTransform);
		}

		return () => {
			canvasEl.removeEventListener("pointermove", onPointerMove);
			canvasEl.removeEventListener("pointerleave", onPointerLeave);
			canvasEl.removeEventListener("click", onClick);
			canvasEl.removeEventListener("keydown", onKeyDown);
			select(canvasEl).on(".zoom", null);
			tippyInstance?.destroy();
			tippyInstance = null;
			stickyInstance = null;
		};
	});

	$effect(() => {
		if (svgEl && parents.length) {
			updateLabels({ forceWrap: true });
		}
	});

	$effect(() => {
		if (activeCircleIndex > -1) {
			showTooltipForIndex(activeCircleIndex, { sticky: true });
		}
	});

	function zoomIn() {
		if (!canvasEl || !zoomBehavior) return;
		select(canvasEl).transition().call(zoomBehavior.scaleBy, 1.2);
	}

	function zoomOut() {
		if (!canvasEl || !zoomBehavior) return;
		select(canvasEl).transition().call(zoomBehavior.scaleBy, 1 / 1.2);
	}

	function handleKeydown(event) {
		if (!leaves.length) return;

		const navKeys = [
			"ArrowRight",
			"ArrowDown",
			"ArrowLeft",
			"ArrowUp",
			"Home",
			"End",
			"Escape"
		];
		if (!navKeys.includes(event.key)) return;

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
				hideTooltip(true);
				newIndex = -1;
				canvasEl?.blur();
				break;
			default:
				return;
		}

		if (newIndex !== activeCircleIndex) {
			activeCircleIndex = newIndex;
			if (newIndex > -1) {
				hoveredCircleIndex = newIndex;
				showTooltipForIndex(newIndex, { sticky: true });
			}
		}
	}
</script>

{#snippet noEvents()}
	<div class="circlepack-empty">
		<b>0 events</b> match your current selections
	</div>
{/snippet}

<div class="circlepack-container" bind:this={container} style:--height={height}>
	{#if showZoomHint}
		<div class="zoom-hint" transition:fade={{ duration: 200 }}>
			<p>Use <kbd>⌘</kbd> + scroll to zoom in and out.</p>
			<p>Interact with the circles for article info.</p>
		</div>
	{/if}

	<div class="chart-label">
		Articles grouped by event <Info instance="chart_circlePack" />
	</div>

	{#if packed && width && heightVal}
		{#if hasContent}
			<div
				class="viz-layers"
				style:width="{width}px"
				style:height="{heightVal}px"
			>
				<canvas
					bind:this={canvasEl}
					class="circlepack-canvas"
					tabindex="0"
					aria-label="Interactive map of news articles"
				></canvas>
				<svg
					bind:this={svgEl}
					{width}
					height={heightVal}
					class="label-overlay"
					aria-hidden="true"
				>
					<g {transform}>
						{#each parents as node}
							<text
								class="cluster-label-text"
								x={node.x}
								y={node.y}
								text-anchor="middle"
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
				</svg>
			</div>
		{:else}
			{@render noEvents()}
		{/if}
	{:else}
		{@render noEvents()}
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

	.viz-layers {
		position: relative;
	}

	.circlepack-canvas {
		position: absolute;
		inset: 0;
		display: block;
		cursor: grab;
	}

	.circlepack-canvas:active {
		cursor: grabbing;
	}

	.circlepack-canvas:focus {
		outline: 0;
	}

	.label-overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
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

		@media (max-width: 600px) {
			font-size: 1rem;
		}

		p {
			margin: 0;
			padding: 0 1rem;
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
		z-index: 11;
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
		font-size: var(--14px);
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
