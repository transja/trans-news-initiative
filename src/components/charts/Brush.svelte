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

	function handleDragStart(event, type) {
		isDragging = true;
		dragType = type;
		window.addEventListener("mousemove", handleDragMove);
		window.addEventListener("mouseup", handleDragEnd);
		window.addEventListener("touchmove", handleDragMove, { passive: false });
		window.addEventListener("touchend", handleDragEnd);
		event.preventDefault();
	}

	function handleDragMove(event) {
		if (!isDragging) return;

		if (event.type === "touchmove") {
			event.preventDefault();
		}

		const rect = brushEl.getBoundingClientRect();
		const clientX = event.touches ? event.touches[0].clientX : event.clientX;
		const x = clientX - rect.left;
		const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));

		if (dragType === "start") {
			startPercent = Math.min(percent, endPercent);
		} else if (dragType === "end") {
			endPercent = Math.max(percent, startPercent);
		}
	}

	function handleDragEnd() {
		isDragging = false;
		window.removeEventListener("mousemove", handleDragMove);
		window.removeEventListener("mouseup", handleDragEnd);
		window.removeEventListener("touchmove", handleDragMove);
		window.removeEventListener("touchend", handleDragEnd);
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
		<button
			onmousedown={(e) => handleDragStart(e, "start")}
			ontouchstart={(e) => handleDragStart(e, "start")}
		>
			<ChevronLeft color="white" />
		</button>
	</div>

	<!-- End handle -->
	<div class="brush-handle end" style="left: {endPercent}%">
		<div class="handle-date">{formatter.format(endDate)}</div>
		<button
			onmousedown={(e) => handleDragStart(e, "end")}
			ontouchstart={(e) => handleDragStart(e, "end")}
		>
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
			background: hsla(0, 0%, 100%, 0.8);
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
