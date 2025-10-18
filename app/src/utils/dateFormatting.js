// dateFormatting.js - Helper functions for formatting dates and timestamps

/**
 * Format a timestamp into a human-readable relative time string
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted relative time (e.g., "2m ago", "3h ago", "5d ago")
 */
export function formatRelativeTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

/**
 * Format a date for display
 * @param {number|Date} date - Date or timestamp to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  return dateObj.toLocaleDateString(undefined, options);
}

/**
 * Format a date and time for display
 * @param {number|Date} date - Date or timestamp to format
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(date) {
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  return dateObj.toLocaleString();
}

