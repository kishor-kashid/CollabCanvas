// Cursor Service - Real-time cursor position tracking with Firebase Realtime Database

import { rtdb } from './firebase';
import { ref, set, update, onValue, remove, onDisconnect, serverTimestamp } from 'firebase/database';
import { getSessionPath } from '../utils/constants';

/**
 * Initialize user in the session (sets up onDisconnect)
 * @param {string} canvasId - Canvas ID
 * @param {string} userId - User ID
 * @param {string} displayName - User display name
 * @param {string} color - Cursor color
 * @returns {Promise<void>}
 */
export async function initializeUserSession(canvasId, userId, displayName, color) {
  try {
    if (!canvasId) {
      throw new Error('Canvas ID is required');
    }
    
    const sessionPath = getSessionPath(canvasId);
    const userRef = ref(rtdb, `${sessionPath}/${userId}`);
    
    // Set initial user data
    await set(userRef, {
      displayName,
      cursorColor: color,
      cursorX: 0,
      cursorY: 0,
      lastSeen: serverTimestamp(),
    });
    
    // Register onDisconnect to remove user when they disconnect
    await onDisconnect(userRef).remove();
  } catch (error) {
    console.error('Error initializing user session:', error);
  }
}

/**
 * Update cursor position for a user
 * @param {string} canvasId - Canvas ID
 * @param {string} userId - User ID
 * @param {number} x - Canvas X coordinate
 * @param {number} y - Canvas Y coordinate
 * @returns {Promise<void>}
 */
export async function updateCursorPosition(canvasId, userId, x, y) {
  try {
    if (!canvasId) {
      return; // Silently ignore if no canvas
    }
    
    const sessionPath = getSessionPath(canvasId);
    const cursorRef = ref(rtdb, `${sessionPath}/${userId}`);
    
    // Use update instead of set to avoid overwriting the entire object
    // This preserves the onDisconnect handler
    await update(cursorRef, {
      cursorX: x,
      cursorY: y,
      lastSeen: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating cursor position:', error);
  }
}

/**
 * Subscribe to cursor updates for all users on a canvas
 * @param {string} canvasId - Canvas ID
 * @param {function} callback - Callback function to handle cursor updates
 * @returns {function} Unsubscribe function
 */
export function subscribeToCursors(canvasId, callback) {
  if (!canvasId) {
    console.error('Canvas ID is required for cursor subscription');
    return () => {}; // Return no-op unsubscribe
  }
  
  const sessionPath = getSessionPath(canvasId);
  const cursorsRef = ref(rtdb, sessionPath);
  
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
 * Remove user from the session (manual cleanup)
 * Called when the user navigates away from the canvas to ensure immediate cleanup.
 * The onDisconnect handler remains as a backup for unexpected disconnections.
 * @param {string} canvasId - Canvas ID
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function removeUserSession(canvasId, userId) {
  try {
    if (!canvasId) {
      return;
    }
    
    const sessionPath = getSessionPath(canvasId);
    const userRef = ref(rtdb, `${sessionPath}/${userId}`);
    
    // Remove the user data immediately
    // Note: We don't cancel onDisconnect here - it serves as a backup cleanup
    await remove(userRef);
  } catch (error) {
    // PERMISSION_DENIED is expected when user logs out (auth becomes null)
    // The onDisconnect handler will clean up automatically in this case
    if (error.code === 'PERMISSION_DENIED' || error.message?.includes('PERMISSION_DENIED')) {
      // This is expected on logout - onDisconnect will handle cleanup
      return;
    }
    console.error('❌ Error removing user session:', error);
  }
}

/**
 * Clean up stale sessions (sessions that haven't been updated recently)
 * @param {string} canvasId - Canvas ID
 * @param {number} maxAge - Maximum age in milliseconds (default: 5 minutes)
 * @returns {Promise<void>}
 */
export async function cleanupStaleSessions(canvasId, maxAge = 5 * 60 * 1000) {
  try {
    if (!canvasId) {
      return;
    }
    
    const sessionPath = getSessionPath(canvasId);
    const sessionsRef = ref(rtdb, sessionPath);
    
    // Get all sessions
    const { get } = await import('firebase/database');
    const snapshot = await get(sessionsRef);
    
    if (!snapshot.exists()) {
      return;
    }
    
    const sessions = snapshot.val();
    const now = Date.now();
    let cleanedCount = 0;
    
    // Check each session's lastSeen timestamp
    for (const [userId, userData] of Object.entries(sessions)) {
      if (userData.lastSeen) {
        const age = now - userData.lastSeen;
        
        // If session is older than maxAge, remove it
        if (age > maxAge) {
          await remove(ref(rtdb, `${sessionPath}/${userId}`));
          cleanedCount++;
        }
      }
    }
  } catch (error) {
    console.error('❌ Error cleaning up stale sessions:', error);
  }
}

