// useCanvas Hook - To be implemented in PR #5
// This hook provides canvas operations and real-time sync

import { useState, useEffect } from 'react';
import { subscribeToShapes } from '../services/canvas';

/**
 * Custom hook for canvas operations and real-time synchronization
 * @returns {object} Canvas state and operations
 */
export function useCanvas() {
  const [shapes, setShapes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Subscribe to real-time shape updates
    const unsubscribe = subscribeToShapes((updatedShapes) => {
      setShapes(updatedShapes);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  return {
    shapes,
    loading,
    // Additional operations will be added in PR #5
  };
}

