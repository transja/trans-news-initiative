<script>
	import { onMount } from "svelte";
	import { browser } from "$app/environment";

	const { allData = [], visibleData = [], height = "100vh" } = $props();

	let container;
	let sigmaInstance;
	let graph = $state(null);
	const defaultNodeSize = 3;
	let tooltipEl;

	$inspect(allData.length, visibleData.length);

	onMount(async () => {
		if (!browser || !allData || allData.length === 0) return;

		const { default: Graph } = await import("graphology");
		const { default: Sigma } = await import("sigma");

		const canvas = document.createElement("canvas");
		const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");

		if (!gl) {
			console.error("WebGL not supported");
			container.innerHTML =
				'<div style="padding: 20px; text-align: center; color: #666;">WebGL is not supported in your browser.</div>';
			return;
		}

		graph = new Graph();

		allData.forEach((item) => {
			graph.addNode(item.id, {
				title: item.title,
				x: item.UMAP1,
				y: item.UMAP2,
				size: defaultNodeSize,
				color: getClusterColor(item.cluster),
				cluster: item.cluster,
				hidden: true // Start with all nodes hidden
			});
		});

		sigmaInstance = new Sigma(graph, container, {
			renderEdgeLabels: false,
			renderNodeLabels: false,
			maxCameraRatio: 1
		});

		const camera = sigmaInstance.getCamera();

		// Set initial zoom level immediately
		camera.setState({ ratio: 0.25 });

		// Animate to new zoom level
		camera.animate(
			{ ratio: 0.5 },
			{ duration: 1500 } // in milliseconds
		);

		// -- Tooltip --
		sigmaInstance.on("enterNode", (e) => {
			const title = graph.getNodeAttribute(e.node, "title");
			tooltipEl.innerHTML = title;
			tooltipEl.style.display = "block";
		});
		sigmaInstance.on("leaveNode", () => {
			tooltipEl.style.display = "none";
		});

		const moveListener = (e) => {
			tooltipEl.style.top = `${e.clientY}px`;
			tooltipEl.style.left = `${e.clientX}px`;
		};
		sigmaInstance.getContainer().addEventListener("mousemove", moveListener);

		// -- Cluster labels --
		// 1. Create a map to store cluster data
		const clusters = new Map();
		allData.forEach((item) => {
			if (!item.cluster || item.cluster === "-1") return;
			if (!clusters.has(item.cluster)) {
				clusters.set(item.cluster, {
					positions: [],
					label: item.label,
					// color: getClusterColor(item.cluster)
					color: "#fff"
				});
			}
			clusters
				.get(item.cluster)
				.positions.push({ x: item.UMAP1, y: item.UMAP2 });
		});

		// 2. Calculate the cluster's nodes barycenter to use this as cluster label position
		clusters.forEach((data, clusterId) => {
			const center = data.positions.reduce(
				(acc, pos) => ({ x: acc.x + pos.x, y: acc.y + pos.y }),
				{ x: 0, y: 0 }
			);
			data.x = center.x / data.positions.length;
			data.y = center.y / data.positions.length;
		});

		// 3. Create the HTML layer for labels
		const clustersLayer = document.createElement("div");
		clustersLayer.className = "clusters-layer";

		let clusterLabelsDoms = "";
		clusters.forEach((data, clusterId) => {
			if (!data.label) return;
			const viewportPos = sigmaInstance.graphToViewport({
				x: data.x,
				y: data.y
			});
			clusterLabelsDoms += `<div id='cluster-label-${clusterId}' class="cluster-label" style="top:${viewportPos.y}px;left:${viewportPos.x}px;color:${data.color}">${data.label}</div>`;
		});
		clustersLayer.innerHTML = clusterLabelsDoms;
		container.insertBefore(
			clustersLayer,
			container.querySelector(".sigma-hovers")
		);

		// 4. Update labels position on render to avoid overlap
		const renderListener = () => {
			const visibleClusters = new Set(visibleData.map((d) => d.cluster));
			const shownLabelBBoxes = [];

			// Sort potentially visible clusters by size (descending)
			const sortedVisibleClusters = Array.from(clusters.entries())
				.filter(([clusterId]) => visibleClusters.has(clusterId))
				.sort(([, a], [, b]) => b.positions.length - a.positions.length);

			// Hide all labels initially
			clusters.forEach((_, clusterId) => {
				const labelEl = document.getElementById(`cluster-label-${clusterId}`);
				if (labelEl) labelEl.style.display = "none";
			});

			const checkOverlap = (boxA, boxB) => {
				const padding = 2; // 2px padding around labels
				return (
					boxA.x < boxB.x + boxB.width + padding &&
					boxA.x + boxA.width + padding > boxB.x &&
					boxA.y < boxB.y + boxB.height + padding &&
					boxA.y + boxA.height + padding > boxB.y
				);
			};

			sortedVisibleClusters.forEach(([clusterId, data]) => {
				const labelEl = document.getElementById(`cluster-label-${clusterId}`);
				if (!labelEl) return;

				const viewportPos = sigmaInstance.graphToViewport({
					x: data.x,
					y: data.y
				});
				labelEl.style.top = `${viewportPos.y}px`;
				labelEl.style.left = `${viewportPos.x}px`;
				labelEl.style.display = "block"; // Show temporarily to get dimensions

				const bbox = labelEl.getBoundingClientRect();

				let overlaps = false;
				for (const shownBBox of shownLabelBBoxes) {
					if (checkOverlap(bbox, shownBBox)) {
						overlaps = true;
						break;
					}
				}

				if (overlaps) {
					labelEl.style.display = "none"; // Hide if it overlaps
				} else {
					shownLabelBBoxes.push(bbox); // Otherwise, keep it and record its bbox
				}
			});
		};
		sigmaInstance.on("afterRender", renderListener);

		return () => {
			sigmaInstance
				.getContainer()
				.removeEventListener("mousemove", moveListener);
			sigmaInstance.removeListener("afterRender", renderListener);
			sigmaInstance?.kill();
			clustersLayer.remove();
		};
	});

	$effect(() => {
		if (!graph || !sigmaInstance) return;

		const visibleNodeIds = new Set(visibleData.map((d) => d.id));

		graph.forEachNode((node) => {
			graph.setNodeAttribute(node, "hidden", !visibleNodeIds.has(node));
		});

		// sigmaInstance.getCamera().animatedReset({ duration: 600 });
	});

	function getClusterColor(cluster) {
		const colors = [
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
		];

		const hash = cluster
			.toString()
			.split("")
			.reduce((a, b) => {
				a = (a << 5) - a + b.charCodeAt(0);
				return a & a;
			}, 0);

		return colors[Math.abs(hash) % colors.length];
	}
</script>

<div class="sigma-container" style:--height={height}>
	<div bind:this={container} class="sigma-canvas"></div>
	<div bind:this={tooltipEl} class="tooltip" style="display: none;"></div>
</div>

<style>
	.sigma-container {
		position: relative;
		width: 100%;
		height: var(--height);
		overflow: hidden;
		transition: height 0.3s ease-in-out;
	}

	.sigma-canvas {
		width: 100%;
		height: 100%;
	}

	.tooltip {
		position: fixed;
		background-color: rgba(255, 255, 255, 0.95);
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 8px 12px;
		font-size: 13px;
		color: #333;
		pointer-events: none;
		max-width: 250px;
		white-space: normal;
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
		transform: translate(15px, 15px);
	}

	:global(.clusters-layer) {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
	}

	:global(.cluster-label) {
		position: absolute;
		font-size: 14px;
		color: #000;
		transform: translate(-50%, -50%);
		text-shadow:
			0 0 4px rgba(0, 0, 0, 0.9),
			0 0 4px rgba(0, 0, 0, 0.4);
		text-align: center;
		width: 120px;
	}
</style>
