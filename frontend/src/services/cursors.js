// Cursor Service - Real-time cursor position tracking with Firebase Realtime Database

import { rtdb } from './firebase';
import { ref, set, onValue, remove, onDisconnect, serverTimestamp } from 'firebase/database';

const SESSION_PATH = 'sessions/global-canvas-v1';

/**
 * Update cursor position for a user
 * @param {string} userId - User ID
 * @param {number} x - Canvas X coordinate
 * @param {number} y - Canvas Y coordinate
 * @param {string} displayName - User display name
 * @param {string} color - Cursor color
 * @returns {Promise<void>}
 */
export async function updateCursorPosition(userId, x, y, displayName, color) {
  try {
    const cursorRef = ref(rtdb, `${SESSION_PATH}/${userId}`);
    
    await set(cursorRef, {
      displayName,
      cursorColor: color,
      cursorX: x,
      cursorY: y,
      lastSeen: serverTimestamp(),
    });
    
    // Re-register onDisconnect after each write
    // This ensures the cursor is removed when user disconnects
    onDisconnect(cursorRef).remove();
  } catch (error) {
    console.error('Error updating cursor position:', error);
  }
}

/**
 * Subscribe to cursor updates for all users
 * @param {function} callback - Callback function to handle cursor updates
 * @returns {function} Unsubscribe function
 */
export function subscribeToCursors(callback) {
  const cursorsRef = ref(rtdb, SESSION_PATH);
  
  const unsubscribe = onValue(cursorsRef, (snapshot) => {
    const cursors = snapshot.val() || {};
    callback(cursors);
  }, (error) => {
    console.error('Error subscribing to cursors:', error);
    callback({});
  });
  
  return unsubscribe;
}

/**
 * Remove cursor for a user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function removeCursor(userId) {
  try {
    console.log('🗑️ Removing cursor for user:', userId);
    const cursorRef = ref(rtdb, `${SESSION_PATH}/${userId}`);
    await remove(cursorRef);
    console.log('✅ Cursor removed successfully');
  } catch (error) {
    console.error('❌ Error removing cursor:', error);
  }
}

/**
 * Set up automatic cursor removal on disconnect
 * @param {string} userId - User ID
 * @returns {void}
 */
export function setupCursorCleanup(userId) {
  const cursorRef = ref(rtdb, `${SESSION_PATH}/${userId}`);
  
  // Remove cursor when user disconnects
  onDisconnect(cursorRef).remove();
}

