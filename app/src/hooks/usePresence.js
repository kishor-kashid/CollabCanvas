// usePresence Hook - Manages user presence (online/offline status)

import { useState, useEffect } from 'react';
import { subscribeToPresence } from '../services/presence';
import { useAuth } from './useAuth';

/**
 * Custom hook for user presence management
 * Note: This hook only subscribes to presence data.
 * The actual user initialization is handled by useCursors hook to avoid conflicts.
 * @returns {object} Online users array
 */
export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { currentUser } = useAuth();
  
  useEffect(() => {
    if (!currentUser) {
      console.log('❌ usePresence: No currentUser');
      setOnlineUsers([]);
      return;
    }
    
    console.log('✅ usePresence: Subscribing to presence updates');
    
    // Subscribe to presence updates (shares the same data as cursors)
    const unsubscribe = subscribeToPresence((presenceData) => {
      const users = Object.entries(presenceData).map(([userId, userData]) => ({
        userId,
        ...userData,
      }));
      console.log('👥 Online users:', users.length, 'total');
      setOnlineUsers(users);
    });
    
    return () => {
      console.log('🧹 Unsubscribing from presence updates');
      unsubscribe();
    };
  }, [currentUser]);
  
  return {
    onlineUsers,
  };
}

