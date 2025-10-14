// Helper Utilities - Color generation and other utilities

import { CURSOR_COLORS } from './constants';

/**
 * Generate a consistent color for a user based on their userId
 * Uses a hash function to ensure same user always gets same color
 * @param {string} userId - User ID
 * @returns {string} Hex color code
 */
export function generateUserColor(userId) {
  if (!userId) {
    return CURSOR_COLORS[0];
  }
  
  // Simple hash function to convert userId to a number
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % CURSOR_COLORS.length;
  
  return CURSOR_COLORS[index];
}

/**
 * Throttle function - limits how often a function can be called
 * @param {function} func - Function to throttle
 * @param {number} limit - Minimum time between calls (ms)
 * @returns {function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  let lastResult;
  
  return function(...args) {
    if (!inThrottle) {
      lastResult = func.apply(this, args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
    
    return lastResult;
  };
}

/**
 * Get truncated display name for cursor label
 * @param {string} name - Full display name
 * @param {number} maxLength - Maximum length (default 15)
 * @returns {string} Truncated name
 */
export function getTruncatedName(name, maxLength = 15) {
  if (!name) return 'Anonymous';
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength) + '...';
}
