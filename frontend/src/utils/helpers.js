// Helper Functions - Utility functions used across the application

import { CURSOR_COLORS, MAX_DISPLAY_NAME_LENGTH } from './constants';

/**
 * Generate a unique color for a user based on their ID
 * @param {string} userId - User ID
 * @returns {string} Hex color code
 */
export function generateUserColor(userId) {
  // Use a simple hash of the user ID to pick a color
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % CURSOR_COLORS.length;
  return CURSOR_COLORS[index];
}

/**
 * Truncate display name to max length
 * @param {string} name - Display name
 * @returns {string} Truncated name
 */
export function truncateDisplayName(name) {
  if (!name) return 'Anonymous';
  if (name.length <= MAX_DISPLAY_NAME_LENGTH) return name;
  return name.substring(0, MAX_DISPLAY_NAME_LENGTH) + '...';
}

/**
 * Extract display name from email (use part before @)
 * @param {string} email - Email address
 * @returns {string} Display name
 */
export function getDisplayNameFromEmail(email) {
  if (!email) return 'Anonymous';
  const name = email.split('@')[0];
  return truncateDisplayName(name);
}

/**
 * Generate a unique ID for shapes
 * @returns {string} Unique ID
 */
export function generateShapeId() {
  return `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Throttle function calls to limit frequency
 * @param {function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Debounce function calls to delay execution
 * @param {function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Check if a point is within canvas boundaries
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @returns {boolean} True if within bounds
 */
export function isWithinCanvasBounds(x, y, canvasWidth, canvasHeight) {
  return x >= 0 && x <= canvasWidth && y >= 0 && y <= canvasHeight;
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format timestamp to readable time
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted time
 */
export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString();
}

