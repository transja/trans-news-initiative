<script>
	import { ChevronLeft, ChevronRight } from "@lucide/svelte";

	let {
		startPercent = $bindable(0),
		endPercent = $bindable(100),
		startDate,
		endDate
	} = $props();

	let isDragging = $state(false);
	let dragType = $state(""); // 'start' or 'end'
	let brushEl;

	function handleMouseDown(event, type) {
		isDragging = true;
		dragType = type;
		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);
		event.preventDefault();
	}

	function handleMouseMove(event) {
		if (!isDragging) return;

		const rect = brushEl.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));

		if (dragType === "start") {
			startPercent = Math.min(percent, endPercent);
		} else if (dragType === "end") {
			endPercent = Math.max(percent, startPercent);
		}
	}

	function handleMouseUp() {
		isDragging = false;
		window.removeEventListener("mousemove", handleMouseMove);
		window.removeEventListener("mouseup", handleMouseUp);
	}

	const formatter = new Intl.DateTimeFormat("en-US", {
		month: "short",
		year: "numeric"
	});
</script>

<div class="brush" bind:this={brushEl}>
	<div class="brush-mute left" style="width: {startPercent}%"></div>
	<div
		class="brush-range"
		style="left: {startPercent}%; width: {endPercent - startPercent}%"
	></div>

	<div
		class="brush-mute right"
		style="left: {endPercent}%; width: {100 - endPercent}%"
	></div>
	<div class="brush-handle start" style="left: {startPercent}%">
		<div class="handle-date">{formatter.format(startDate)}</div>
		<button onmousedown={(e) => handleMouseDown(e, "start")}>
			<ChevronLeft color="white" />
		</button>
	</div>

	<!-- End handle -->
	<div class="brush-handle end" style="left: {endPercent}%">
		<div class="handle-date">{formatter.format(endDate)}</div>
		<button onmousedown={(e) => handleMouseDown(e, "end")}>
			<ChevronRight color="white" />
		</button>
	</div>
</div>

<style lang="scss">
	.brush {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: calc(100% - 20px);

		&-mute {
			position: absolute;
			top: 0;
			height: 100%;
			background: hsla(0, 0%, 100%, 0.6);
			backdrop-filter: brightness(100%);
			pointer-events: none;

			&.left {
				left: 0;
			}
			&.right {
				right: 0;
			}
		}

		&-range {
			position: absolute;
			width: 100%;
			height: 100%;
			top: 0;
			bottom: 0;
			border-radius: 4px;
			cursor: grab;
		}

		&-handle {
			position: absolute;
			width: 20px;
			top: 50%;
			transform: translate(-50%, -50%);
			cursor: grab;

			.handle-date {
				position: absolute;
				bottom: 100%;
				left: 50%;
				transform: translateX(-50%);
				white-space: nowrap;
				font-weight: 600;
				font-size: 0.75rem;
				margin-bottom: 5px;
				pointer-events: none;
			}

			button {
				width: 20px;
				height: 20px;
				background: #000;
				border-radius: 2px;
				cursor: grab;
				border: none;
				padding: 0;
				display: flex;
				align-items: center;
				justify-content: center;

				&:active {
					cursor: grabbing;
				}
			}

			&:active {
				cursor: grabbing;
			}
		}
	}
</style>
