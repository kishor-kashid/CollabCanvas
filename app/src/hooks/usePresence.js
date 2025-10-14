// usePresence Hook - Manages user presence (online/offline status)

import { useState, useEffect } from 'react';
import { subscribeToPresence, setUserOnline, setUserOffline } from '../services/presence';
import { useAuth } from './useAuth';
import { useCursors } from './useCursors';

/**
 * Custom hook for user presence management
 * @returns {object} Online users array
 */
export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { currentUser } = useAuth();
  const { userColor } = useCursors();
  
  useEffect(() => {
    if (!currentUser) {
      console.log('❌ usePresence: No currentUser');
      return;
    }
    
    console.log('✅ usePresence: Setting user online', currentUser.uid);
    
    // Set current user as online
    const displayName = currentUser.displayName || 
                       currentUser.email?.split('@')[0] || 
                       'Anonymous';
    
    setUserOnline(currentUser.uid, displayName, userColor);
    
    // Subscribe to presence updates
    const unsubscribe = subscribeToPresence((presenceData) => {
      console.log('👥 Presence data received:', presenceData);
      const users = Object.entries(presenceData).map(([userId, userData]) => ({
        userId,
        ...userData,
      }));
      console.log('👥 Online users:', users);
      setOnlineUsers(users);
    });
    
    return () => {
      console.log('🧹 Cleaning up presence for', currentUser.uid);
      unsubscribe();
      setUserOffline(currentUser.uid);
    };
  }, [currentUser, userColor]);
  
  return {
    onlineUsers,
  };
}

