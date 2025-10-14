// Cursor Service - Real-time cursor position tracking with Firebase Realtime Database

import { rtdb } from './firebase';
import { ref, set, update, onValue, remove, onDisconnect, serverTimestamp } from 'firebase/database';

const SESSION_PATH = 'sessions/global-canvas-v1';

/**
 * Initialize user in the session (sets up onDisconnect)
 * @param {string} userId - User ID
 * @param {string} displayName - User display name
 * @param {string} color - Cursor color
 * @returns {Promise<void>}
 */
export async function initializeUserSession(userId, displayName, color) {
  try {
    const userRef = ref(rtdb, `${SESSION_PATH}/${userId}`);
    
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
 * @param {string} userId - User ID
 * @param {number} x - Canvas X coordinate
 * @param {number} y - Canvas Y coordinate
 * @returns {Promise<void>}
 */
export async function updateCursorPosition(userId, x, y) {
  try {
    const cursorRef = ref(rtdb, `${SESSION_PATH}/${userId}`);
    
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
 * Remove user from the session (manual cleanup)
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function removeUserSession(userId) {
  try {
    console.log('🗑️ Removing user session for:', userId);
    const userRef = ref(rtdb, `${SESSION_PATH}/${userId}`);
    
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
 * @param {number} maxAge - Maximum age in milliseconds (default: 5 minutes)
 * @returns {Promise<void>}
 */
export async function cleanupStaleSessions(maxAge = 5 * 60 * 1000) {
  try {
    console.log('🧹 Cleaning up stale sessions...');
    const sessionsRef = ref(rtdb, SESSION_PATH);
    
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
          await remove(ref(rtdb, `${SESSION_PATH}/${userId}`));
          cleanedCount++;
        }
      }
    }
    
    console.log(`✅ Cleaned up ${cleanedCount} stale session(s)`);
  } catch (error) {
    console.error('❌ Error cleaning up stale sessions:', error);
  }
}

