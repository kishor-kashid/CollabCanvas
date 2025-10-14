// useCanvas Hook - Real-time canvas operations with Firestore

import { useState, useEffect } from 'react';
import { subscribeToShapes, releaseStaleLocks } from '../services/canvas';
import { db } from '../services/firebase';
import { enableIndexedDbPersistence } from 'firebase/firestore';

// Enable Firestore offline persistence (only call once)
let persistenceEnabled = false;
if (!persistenceEnabled) {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Persistence not supported in this browser');
    }
  });
  persistenceEnabled = true;
}

/**
 * Custom hook for canvas operations and real-time synchronization
 * @returns {object} Canvas state and operations
 */
export function useCanvas() {
  const [shapes, setShapes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    // Subscribe to real-time shape updates
    const unsubscribe = subscribeToShapes((updatedShapes) => {
      setShapes(updatedShapes);
      setLoading(false);
      setError(null);
    });
    
    // Auto-release stale locks every 10 seconds
    const lockCleanupInterval = setInterval(() => {
      releaseStaleLocks().catch(console.error);
    }, 10000);
    
    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      unsubscribe();
      clearInterval(lockCleanupInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return {
    shapes,
    loading,
    error,
    isOnline,
  };
}

