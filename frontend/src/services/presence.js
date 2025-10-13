// Presence Service - To be implemented in PR #7
// Functions: setUserOnline, setUserOffline, subscribeToPresence

import { rtdb } from './firebase';
import { ref, set, onValue, onDisconnect, remove } from 'firebase/database';

const CANVAS_ID = 'global-canvas-v1';

/**
 * Set user as online in the presence system
 * @param {string} userId - User ID
 * @param {string} displayName - User display name
 * @param {string} color - User cursor color
 * @returns {Promise<void>}
 */
export async function setUserOnline(userId, displayName, color) {
  try {
    const userPresenceRef = ref(rtdb, `sessions/${CANVAS_ID}/${userId}`);
    
    // Set user online
    await set(userPresenceRef, {
      displayName,
      cursorColor: color,
      cursorX: 0,
      cursorY: 0,
      lastSeen: Date.now(),
    });
    
    // Auto-remove on disconnect
    onDisconnect(userPresenceRef).remove();
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
    const userPresenceRef = ref(rtdb, `sessions/${CANVAS_ID}/${userId}`);
    await remove(userPresenceRef);
  } catch (error) {
    console.error('Set user offline error:', error);
    throw error;
  }
}

/**
 * Subscribe to presence updates
 * @param {function} callback - Callback function to handle presence updates
 * @returns {function} Unsubscribe function
 */
export function subscribeToPresence(callback) {
  const presenceRef = ref(rtdb, `sessions/${CANVAS_ID}`);
  
  const unsubscribe = onValue(presenceRef, (snapshot) => {
    const data = snapshot.val() || {};
    callback(data);
  });
  
  return unsubscribe;
}

/**
 * Update cursor position
 * @param {string} userId - User ID
 * @param {number} x - Cursor X position
 * @param {number} y - Cursor Y position
 * @returns {Promise<void>}
 */
export async function updateCursorPosition(userId, x, y) {
  try {
    const cursorRef = ref(rtdb, `sessions/${CANVAS_ID}/${userId}`);
    await set(cursorRef, {
      cursorX: x,
      cursorY: y,
      lastSeen: Date.now(),
    }, { merge: true });
  } catch (error) {
    console.error('Update cursor error:', error);
  }
}

