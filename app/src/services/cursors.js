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
    
    console.log('✅ User session initialized with onDisconnect handler');
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
 * ⚠️ DEPRECATED: Do not use this function directly!
 * Session cleanup is handled automatically by Firebase onDisconnect.
 * Calling this manually may cause permission errors.
 * @param {string} canvasId - Canvas ID
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function removeUserSession(canvasId, userId) {
  console.warn('⚠️ removeUserSession called - this should be handled by onDisconnect automatically');
  try {
    if (!canvasId) {
      return;
    }
    
    console.log('🗑️ Removing user session for:', userId);
    const sessionPath = getSessionPath(canvasId);
    const userRef = ref(rtdb, `${sessionPath}/${userId}`);
    
    // Cancel any pending onDisconnect operations
    await onDisconnect(userRef).cancel();
    
    // Remove the user data
    await remove(userRef);
    console.log('✅ User session removed successfully');
  } catch (error) {
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
    
    console.log('🧹 Cleaning up stale sessions...');
    const sessionPath = getSessionPath(canvasId);
    const sessionsRef = ref(rtdb, sessionPath);
    
    // Get all sessions
    const { get } = await import('firebase/database');
    const snapshot = await get(sessionsRef);
    
    if (!snapshot.exists()) {
      console.log('✅ No sessions to clean up');
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
          console.log(`🗑️ Removing stale session for user ${userId} (age: ${Math.round(age / 1000)}s)`);
          await remove(ref(rtdb, `${sessionPath}/${userId}`));
          cleanedCount++;
        }
      }
    }
    
    console.log(`✅ Cleaned up ${cleanedCount} stale session(s)`);
  } catch (error) {
    console.error('❌ Error cleaning up stale sessions:', error);
  }
}

