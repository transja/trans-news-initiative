<script>
	import { scaleBand, scaleLinear } from "d3-scale";
	import { stack, stackOrderNone, stackOffsetExpand } from "d3-shape";
	import { format } from "d3-format";
	import tippy from "tippy.js";
	import "tippy.js/dist/tippy.css";
	import "tippy.js/themes/light.css";
	import { isMobile } from "$utils/breakpoints.js";
	import AxisX from "./axes/AxisX.svelte";
	import AxisY from "./axes/AxisY.svelte";
	import { CHART_MARGIN } from "./axes/chartLayout.js";

	let { data = [], xKey = "year", seriesKeys = [], colors = {} } = $props();

	let width = $state(0);
	let height = $state(0);
	let svgEl = $state(null);
	let stickyInstance = null;
	let hoveredXValue = $state(null);
	let chartContainerEl;
	let activeColumnIndex = $state(-1);

	const margin = CHART_MARGIN;

	const stackedData = $derived(
		stack().keys(seriesKeys).order(stackOrderNone).offset(stackOffsetExpand)(
			data
		)
	);

	const innerWidth = $derived(width - margin.left - margin.right);
	const innerHeight = $derived(height - margin.top - margin.bottom);

	const xScale = $derived(
		scaleBand()
			.domain(data.map((d) => d[xKey]))
			.range([0, Math.max(0, innerWidth)])
			.padding(0.2)
	);

	const yScale = $derived(
		scaleLinear().domain([0, 1]).range([Math.max(0, innerHeight), 0])
	);

	const yFmt = format(".0%");

	const createTooltipContent = (dataObject) => {
		const total = seriesKeys.reduce((sum, key) => sum + (dataObject[key] || 0), 0);

		if (total === 0)
			return `<div style="text-align: left; font-family: var(--sans); padding: 5px; max-width: 300px;">
						<div style="font-size: 0.8em; text-transform: uppercase; color: #555; margin-bottom: 5px; font-weight: bold;">No data available</div>`;

		let html = `<div style="text-align: left; font-family: var(--sans); padding: 5px; max-width: 300px;">
						<div style="font-size: 0.8em; text-transform: uppercase; color: #555; margin-bottom: 5px; font-weight: bold;">${dataObject[xKey]}</div>`;

		seriesKeys.forEach((key) => {
			const value = dataObject[key] || 0;
			const percentage = total > 0 ? value / total : 0;
			const color = colors[key] ?? "#ccc";

			html += `<div style="display: flex; align-items: center; margin-bottom: 3px; font-family: var(--sans)">
						<span style="height: 10px; width: 10px; background-color: ${color}; margin-right: 4px; border-radius: 2px;"></span>
						<span style="font-size: 0.8em; text-transform: uppercase; font-weight: 700; margin-right: 4px;">${key}:</span>
						<span> ${yFmt(percentage)}</span>
					</div>`;
		});

		html += `</div>`;
		return html;
	};

	function handleKeydown(event) {
		if (event.key === "Tab") {
			activeColumnIndex = -1;
			return;
		}

		if (!data.length) return;

		event.preventDefault();

		let newIndex = activeColumnIndex;
		const maxIndex = data.length - 1;

		switch (event.key) {
			case "ArrowRight":
				newIndex = activeColumnIndex >= maxIndex ? 0 : activeColumnIndex + 1;
				break;
			case "ArrowLeft":
				newIndex = activeColumnIndex <= 0 ? maxIndex : activeColumnIndex - 1;
				break;
			case "Escape": {
				const currentEl = chartContainerEl.querySelector(
					`[data-index='${activeColumnIndex}']`
				);
				if (currentEl?._tippy) {
					currentEl._tippy.hide();
				}
				newIndex = -1;
				event.stopPropagation();
				break;
			}
			default:
				return;
		}

		if (newIndex !== activeColumnIndex) {
			activeColumnIndex = newIndex;
		}
	}

	$effect(() => {
		if (!chartContainerEl) return;

		const inactiveCols = chartContainerEl.querySelectorAll(
			`.bar-group:not([data-index='${activeColumnIndex}'])`
		);
		inactiveCols.forEach((el) => el._tippy?.hide());

		if (activeColumnIndex > -1) {
			const activeEl = chartContainerEl.querySelector(
				`[data-index='${activeColumnIndex}']`
			);
			if (activeEl?._tippy) {
				activeEl._tippy.show();
			}
		}
	});

	$effect(() => {
		if (!svgEl) return;
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
	class="chart-container"
	bind:clientWidth={width}
	bind:clientHeight={height}
	bind:this={chartContainerEl}
	tabindex="0"
	role="application"
	aria-label="Stacked column chart"
	onkeydown={handleKeydown}
>
	{#if width && height}
		<svg {width} {height} bind:this={svgEl}>
			<defs>
				<pattern
					id="diagonal-stripe-pattern"
					patternUnits="userSpaceOnUse"
					width="8"
					height="8"
				>
					<rect width="8" height="8" style="fill: var(--color-gray-50)"></rect>
					<path
						d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4"
						style="stroke: var(--color-gray-200)"
						stroke-width="1"
					></path>
				</pattern>
			</defs>
			<defs>
				<filter id="focus-glow" x="-50%" y="-50%" width="200%" height="200%">
					<feMorphology
						operator="dilate"
						radius="2"
						in="SourceAlpha"
						result="dilated"
					/>
					<feGaussianBlur in="dilated" stdDeviation="3" result="blurred" />

					<feFlood flood-color="#3b82f6" flood-opacity="0.7" result="glow-color" />
					<feComposite
						in="glow-color"
						in2="blurred"
						operator="in"
						result="colored-glow"
					/>

					<feMerge>
						<feMergeNode in="colored-glow" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>
			<g transform="translate({margin.left}, {margin.top})">
				<AxisY scale={yScale} ticks={4} tickFormat={yFmt} />
				<AxisX scale={xScale} {innerHeight} />

				<g class="series-group">
					{#each data as d, i}
						{@const xValue = d[xKey]}
						{@const hasData =
							seriesKeys.reduce((sum, key) => sum + (d[key] || 0), 0) > 0}

						<g
							class="bar-group"
							class:is-active={i === activeColumnIndex}
							data-index={i}
							transform="translate({xScale(xValue)}, 0)"
							data-tippy-content={createTooltipContent(d)}
							onmouseover={() => (hoveredXValue = xValue)}
							onmouseout={() => (hoveredXValue = null)}
							opacity={!hoveredXValue || hoveredXValue === xValue ? 1 : 0.4}
							aria-label="Data for {xValue}"
						>
							{#if hasData}
								{#each stackedData as series}
									{@const key = series.key}
									{@const segment = series[i]}
									{@const [y0, y1] = segment}
									{#if !isNaN(y0) && !isNaN(y1)}
										<rect
											x={0}
											y={yScale(y1)}
											width={xScale.bandwidth()}
											height={yScale(y0) - yScale(y1)}
											fill={colors[key] ?? "#ccc"}
										></rect>
									{/if}
								{/each}
							{:else}
								<rect
									class="no-data-rect"
									x={0}
									y={yScale(1)}
									width={xScale.bandwidth()}
									height={innerHeight}
									fill="url(#diagonal-stripe-pattern)"
								></rect>
							{/if}
						</g>
					{/each}
				</g>
			</g>
		</svg>
	{/if}
</div>

<style lang="scss">
	.chart-container {
		width: 100%;
		height: 250px;
		font-family: var(--sans);
		outline: none;
		border-radius: 4px;
	}

	.chart-container:focus {
		outline: 2px solid transparent !important;
		outline-offset: 2px !important;
		border: 1px solid #3b82f6 !important;
		box-shadow: 0 0 0 2px rgba(59, 130, 230, 0.4) !important;
		border-radius: 4px !important;
	}

	.series-group rect {
		cursor: pointer;
	}

	.no-data-rect {
		pointer-events: none;
	}

	.bar-group {
		cursor: pointer;
		transition: opacity 0.2s ease-in-out;

		&.is-active {
			outline: none;
			filter: url(#focus-glow);
		}
	}
</style>
