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
 * @param {string} userId - User ID
 * @param {string} displayName - User display name
 * @param {string} color - User cursor color
 * @returns {Promise<void>}
 */
export async function setUserOnline(userId, displayName, color) {
  try {
    console.log('🟢 Setting user online:', userId, displayName);
    await initializeUserSession(userId, displayName, color);
  } catch (error) {
    console.error('Set user online error:', error);
    throw error;
  }
}

/**
 * Set user as offline
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function setUserOffline(userId) {
  try {
    console.log('🔴 Setting user offline:', userId);
    await removeUserSession(userId);
  } catch (error) {
    console.error('Set user offline error:', error);
    throw error;
  }
}

/**
 * Subscribe to presence updates
 * Uses the shared cursor subscription to avoid duplication
 * @param {function} callback - Callback function to handle presence updates
 * @returns {function} Unsubscribe function
 */
export function subscribeToPresence(callback) {
  return subscribeToCursors(callback);
}

