// usePresence Hook - Manages user presence (online/offline status)

import { useState, useEffect } from 'react';
import { subscribeToPresence } from '../services/presence';
import { useAuth } from './useAuth';

/**
 * Custom hook for user presence management
 * Note: This hook only subscribes to presence data.
 * The actual user initialization is handled by useCursors hook to avoid conflicts.
 * @param {string} canvasId - Canvas ID
 * @returns {object} Online users array
 */
export function usePresence(canvasId) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { currentUser } = useAuth();
  
  useEffect(() => {
    if (!currentUser || !canvasId) {
      setOnlineUsers([]);
      return;
    }
    
    // Subscribe to presence updates (shares the same data as cursors)
    const unsubscribe = subscribeToPresence(canvasId, (presenceData) => {
      const users = Object.entries(presenceData).map(([userId, userData]) => ({
        userId,
        ...userData,
      }));
      setOnlineUsers(users);
    });
    
    return () => {
      unsubscribe();
    };
  }, [canvasId, currentUser]);
  
  return {
    onlineUsers,
  };
}

