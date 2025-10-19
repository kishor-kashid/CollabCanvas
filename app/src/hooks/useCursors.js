// useCursors Hook - Real-time cursor tracking for all users

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { 
  subscribeToCursors, 
  updateCursorPosition, 
  initializeUserSession 
} from '../services/cursors';
import { generateUserColor } from '../utils/helpers';
import { CURSOR_UPDATE_INTERVAL } from '../utils/constants';

/**
 * Custom hook for real-time cursor tracking
 * @param {string} canvasId - Canvas ID
 * @returns {object} Cursors state and update function
 */
export function useCursors(canvasId) {
  const { currentUser } = useAuth();
  const [cursors, setCursors] = useState({});
  const [userColor] = useState(() => {
    // Generate color once and keep it consistent
    return currentUser ? generateUserColor(currentUser.uid) : '#000000';
  });
  
  const lastUpdateRef = useRef(0);
  const lastPositionRef = useRef({ x: 0, y: 0 });
  const initializedRef = useRef(false);
  
  // Initialize user session and subscribe to cursor updates
  useEffect(() => {
    if (!currentUser || !canvasId) {
      setCursors({});
      initializedRef.current = false;
      return;
    }
    
    // Get display name
    const displayName = currentUser.displayName || 
                       currentUser.email?.split('@')[0] || 
                       'Anonymous';
    
    // Initialize user session (sets up onDisconnect handler)
    initializeUserSession(canvasId, currentUser.uid, displayName, userColor).then(() => {
      initializedRef.current = true;
    });
    
    // Subscribe to cursor updates
    const unsubscribe = subscribeToCursors(canvasId, (allCursors) => {
      // Filter out current user's cursor
      const otherCursors = { ...allCursors };
      delete otherCursors[currentUser.uid];
      
      setCursors(otherCursors);
    });
    
    // Cleanup function
    return () => {
      unsubscribe();
      initializedRef.current = false;
      // Note: Session cleanup is handled automatically by Firebase onDisconnect
    };
  }, [canvasId, currentUser, userColor]);
  
  /**
   * Update cursor position (throttled)
   * @param {number} x - Canvas X coordinate
   * @param {number} y - Canvas Y coordinate
   */
  const updateCursor = useCallback((x, y) => {
    if (!currentUser || !initializedRef.current) return;
    
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    
    // Throttle: Only update if enough time has passed
    if (timeSinceLastUpdate < CURSOR_UPDATE_INTERVAL) {
      return;
    }
    
    // Only update if position changed significantly (>2px)
    const dx = Math.abs(x - lastPositionRef.current.x);
    const dy = Math.abs(y - lastPositionRef.current.y);
    
    if (dx < 2 && dy < 2) {
      return;
    }
    
    // Update last position and time
    lastPositionRef.current = { x, y };
    lastUpdateRef.current = now;
    
    // Update in Realtime Database (only position, not full user data)
    updateCursorPosition(canvasId, currentUser.uid, x, y);
  }, [canvasId, currentUser]);
  
  return {
    cursors,
    updateCursor,
    userColor,
  };
}
