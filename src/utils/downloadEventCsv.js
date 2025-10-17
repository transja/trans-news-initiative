/**
 * Downloads event articles as a CSV file
 * @param {Array} articles - Array of article objects
 * @param {string} eventName - Name of the event for filename
 */
export function downloadEventCsv(articles, eventName) {
	if (!articles || articles.length === 0) {
		console.warn('No articles to download');
		return;
	}

	// Sanitize event name for filename
	const sanitizedEventName = eventName
		.replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
		.replace(/\s+/g, '-') // Replace spaces with hyphens
		.toLowerCase();

	// Get current date in YYYY-MM format
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const dateString = `${year}-${month}`;

	// Create filename
	const filename = `${sanitizedEventName}-as-of-${dateString}.csv`;

	// Define the columns to include in the same order as the table
	const columnKeys = ['title', 'publish_date', 'media_name', 'lean', 'url'];
	
	// Map column keys to display names
	const headerNames = {
		'title': 'title',
		'publish_date': 'publish_date', 
		'media_name': 'publication',
		'lean': 'publication_lean',
		'url': 'url'
	};

	// Create CSV content
	const csvContent = [
		// Header row
		columnKeys.map(key => `"${headerNames[key]}"`).join(','),
		// Data rows
		...articles.map(article => 
			columnKeys.map(key => {
				const value = article[key];
				// Handle different data types and escape quotes
				if (value === null || value === undefined) {
					return '""';
				}
				if (typeof value === 'string') {
					// Escape quotes and wrap in quotes
					return `"${value.replace(/"/g, '""')}"`;
				}
				if (typeof value === 'object') {
					// Stringify objects
					return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
				}
				// For numbers, booleans, etc.
				return `"${value}"`;
			}).join(',')
		)
	].join('\n');

	// Create and trigger download
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	
	if (link.download !== undefined) {
		// Feature detection for browsers that support HTML5 download
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', filename);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	} else {
		// Fallback for older browsers
		window.open(`data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`);
	}
}
