export function toMonthStart(date) {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}


export function toMonthEnd(date) {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}


export function normalizeDateRange(dateRange) {
	return {
		start: toMonthStart(dateRange.start),
		end: toMonthEnd(dateRange.end)
	};
}

