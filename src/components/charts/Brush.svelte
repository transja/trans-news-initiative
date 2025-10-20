<script>
	import { ChevronLeft, ChevronRight } from "@lucide/svelte";
	import { toMonthStart, toMonthEnd } from "$utils/normalizeDateRange.js";

	let {
		filters = $bindable(),
		dateExtent
	} = $props();

	let isDragging = $state(false);
	let dragType = $state("");
	let brushEl;

	const startPercent = $derived.by(() => {
		if (!dateExtent || !filters.dateRange) return 0;
		const range = dateExtent[1].getTime() - dateExtent[0].getTime();
		if (range === 0) return 0;
		return ((filters.dateRange.start.getTime() - dateExtent[0].getTime()) / range) * 100;
	});

	const endPercent = $derived.by(() => {
		if (!dateExtent || !filters.dateRange) return 100;
		const range = dateExtent[1].getTime() - dateExtent[0].getTime();
		if (range === 0) return 100;
		return ((filters.dateRange.end.getTime() - dateExtent[0].getTime()) / range) * 100;
	});

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
		if (!isDragging || !dateExtent) return;

		if (event.type === "touchmove") {
			event.preventDefault();
		}
		
		const rect = brushEl.getBoundingClientRect();
		const clientX = event.touches ? event.touches[0].clientX : event.clientX;
		const x = clientX - rect.left;
		const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
		const range = dateExtent[1].getTime() - dateExtent[0].getTime();

		const newDate = new Date(dateExtent[0].getTime() + (percent / 100) * range);

		if (dragType === "start") {
			const newStart = toMonthStart(newDate);
			const endMonthStart = toMonthStart(filters.dateRange.end);
			if (newStart.getTime() <= endMonthStart.getTime()) {
				filters.dateRange = {
					start: newStart,
					end: filters.dateRange.end
				};
			}
		} else if (dragType === "end") {
			const newEnd = toMonthEnd(newDate);
			const startMonthStart = toMonthStart(filters.dateRange.start);

			if (newEnd.getTime() >= startMonthStart.getTime()) {
				filters.dateRange = {
					start: filters.dateRange.start,
					end: newEnd
				};
			}
		}
	}

	function handleDragEnd() {
		isDragging = false;
		window.removeEventListener("mousemove", handleDragMove);
		window.removeEventListener("mouseup", handleDragEnd);
		window.removeEventListener("touchmove", handleDragMove);
		window.removeEventListener("touchend", handleDragEnd);
	}

	function handleKeyDown(event, type) {
		if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
			return;
		}
		
		event.preventDefault();
		const currentDate = (type === 'start') ? filters.dateRange.start : filters.dateRange.end;
		let newDate = new Date(currentDate);

		switch (event.key) {
			case 'ArrowLeft':
				newDate.setDate(1); // Set day to 1 to avoid overflow
				newDate.setMonth(newDate.getMonth() - 1);
				break;
			case 'ArrowRight':
				newDate.setDate(1); // Set day to 1 to avoid overflow
				newDate.setMonth(newDate.getMonth() + 1);
				break;
			case 'Home':
				newDate = new Date(dateExtent[0]);
				break;
			case 'End':
				newDate = new Date(dateExtent[1]);
				break;
		}

		if (newDate < dateExtent[0]) {
			newDate = new Date(dateExtent[0]);
		}
		if (newDate > dateExtent[1]) {
			newDate = new Date(dateExtent[1]);
		}

		if (type === 'start') {
			const newStart = toMonthStart(newDate);
			const endMonthStart = toMonthStart(filters.dateRange.end);
			
			if (newStart.getTime() <= endMonthStart.getTime()) {
				filters.dateRange = { start: newStart, end: filters.dateRange.end };
			}
		} else if (type === 'end') {
			const newEnd = toMonthEnd(newDate);
			const startMonthStart = toMonthStart(filters.dateRange.start);
			
			const newEndMonthStart = toMonthStart(newDate); 
			if (newEndMonthStart.getTime() >= startMonthStart.getTime()) {
				filters.dateRange = { start: filters.dateRange.start, end: newEnd };
			}
		}
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
		<div class="handle-date">{formatter.format(filters.dateRange.start)}</div>
		<button
			onmousedown={(e) => handleDragStart(e, "start")}
			ontouchstart={(e) => handleDragStart(e, "start")}
			onkeydown={(e) => handleKeyDown(e, "start")}
			role="slider"
			aria-label="Start date"
			aria-valuemin={dateExtent[0].getTime()}
			aria-valuemax={dateExtent[1].getTime()}
			aria-valuenow={filters.dateRange.start.getTime()}
			aria-valuetext={formatter.format(filters.dateRange.start)}
		>
			<ChevronLeft color="white" />
		</button>
	</div>

	<!-- End handle -->
	<div class="brush-handle end" style="left: {endPercent}%">
		<div class="handle-date">{formatter.format(filters.dateRange.end)}</div>
		<button
			onmousedown={(e) => handleDragStart(e, "end")}
			ontouchstart={(e) => handleDragStart(e, "end")}
			onkeydown={(e) => handleKeyDown(e, "end")}
			role="slider"
			aria-label="End date"
			aria-valuemin={dateExtent[0].getTime()}
			aria-valuemax={dateExtent[1].getTime()}
			aria-valuenow={filters.dateRange.end.getTime()}
			aria-valuetext={formatter.format(filters.dateRange.end)}
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
		font-family: var(--sans);

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
