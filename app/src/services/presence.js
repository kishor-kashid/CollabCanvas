// Presence Service - Manages user presence using the cursor service
// This service acts as a wrapper around the cursor service to avoid duplication

import { 
  initializeUserSession, 
  removeUserSession, 
  subscribeToCursors 
} from './cursors';

/**
 * Set user as online in the presence system
 * This now uses the shared cursor service to avoid conflicts
 * @param {string} canvasId - Canvas ID
 * @param {string} userId - User ID
 * @param {string} displayName - User display name
 * @param {string} color - User cursor color
 * @returns {Promise<void>}
 */
export async function setUserOnline(canvasId, userId, displayName, color) {
  try {
    await initializeUserSession(canvasId, userId, displayName, color);
  } catch (error) {
    console.error('Set user online error:', error);
    throw error;
  }
}

/**
 * Set user as offline
 * Called when the user navigates away from the canvas to ensure immediate cleanup.
 * The onDisconnect handler remains as a backup for unexpected disconnections.
 * @param {string} canvasId - Canvas ID
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function setUserOffline(canvasId, userId) {
  try {
    await removeUserSession(canvasId, userId);
  } catch (error) {
    console.error('Set user offline error:', error);
    throw error;
  }
}

/**
 * Subscribe to presence updates
 * Uses the shared cursor subscription to avoid duplication
 * @param {string} canvasId - Canvas ID
 * @param {function} callback - Callback function to handle presence updates
 * @returns {function} Unsubscribe function
 */
export function subscribeToPresence(canvasId, callback) {
  return subscribeToCursors(canvasId, callback);
}

