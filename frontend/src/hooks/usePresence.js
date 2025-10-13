// usePresence Hook - To be implemented in PR #7
// This hook manages user presence (online/offline status)

import { useState, useEffect } from 'react';
import { subscribeToPresence } from '../services/presence';

/**
 * Custom hook for user presence management
 * @returns {object} Online users array
 */
export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  useEffect(() => {
    // Subscribe to presence updates
    const unsubscribe = subscribeToPresence((presenceData) => {
      const users = Object.entries(presenceData).map(([userId, userData]) => ({
        userId,
        ...userData,
      }));
      setOnlineUsers(users);
    });
    
    return () => unsubscribe();
  }, []);
  
  return {
    onlineUsers,
  };
}

