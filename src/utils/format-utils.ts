/** @format */

export const formatDate = (dateString: string): string => {
	const date = new Date(dateString);
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	// Define time intervals in seconds
	const intervals = {
		year: 31536000,
		month: 2592000,
		week: 604800,
		day: 86400,
		hour: 3600,
		minute: 60,
	};

	// Calculate time differences
	if (diffInSeconds < 60) {
		return "just now";
	} else if (diffInSeconds < intervals.hour) {
		const minutes = Math.floor(diffInSeconds / intervals.minute);
		return `${minutes}m ago`;
	} else if (diffInSeconds < intervals.day) {
		const hours = Math.floor(diffInSeconds / intervals.hour);
		return `${hours}h ago`;
	} else if (diffInSeconds < intervals.week) {
		const days = Math.floor(diffInSeconds / intervals.day);
		return `${days}d ago`;
	} else if (diffInSeconds < intervals.month) {
		const weeks = Math.floor(diffInSeconds / intervals.week);
		return `${weeks}wk ago`;
	} else if (diffInSeconds < intervals.year) {
		const months = Math.floor(diffInSeconds / intervals.month);
		return `${months}mo ago`;
	} else {
		const years = Math.floor(diffInSeconds / intervals.year);
		return `${years}yr ago`;
	}
};

// Alternative version that falls back to absolute date for older dates
export const formatDateWithFallback = (dateString: string): string => {
	const date = new Date(dateString);
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	const intervals = {
		year: 31536000,
		month: 2592000,
		week: 604800,
		day: 86400,
		hour: 3600,
		minute: 60,
	};

	if (diffInSeconds < 60) {
		return "just now";
	} else if (diffInSeconds < intervals.hour) {
		const minutes = Math.floor(diffInSeconds / intervals.minute);
		return `${minutes}m ago`;
	} else if (diffInSeconds < intervals.day) {
		const hours = Math.floor(diffInSeconds / intervals.hour);
		return `${hours}h ago`;
	} else if (diffInSeconds < intervals.week) {
		const days = Math.floor(diffInSeconds / intervals.day);
		return `${days}d ago`;
	} else if (diffInSeconds < intervals.month) {
		const weeks = Math.floor(diffInSeconds / intervals.week);
		return `${weeks}wk ago`;
	} else if (diffInSeconds < intervals.year) {
		const months = Math.floor(diffInSeconds / intervals.month);
		return `${months}mo ago`;
	} else {
		// For dates older than 1 year, return absolute date
		return date.toLocaleDateString() + " " + date.toLocaleTimeString();
	}
};

export const formatCount = (count: number) => {
	if (count < 1000) return count.toString();
	if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
	return `${(count / 1000000).toFixed(1)}M`;
};
