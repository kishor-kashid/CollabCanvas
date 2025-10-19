// useRecentColors.js - Hook for managing recently used colors
import { useState, useEffect, useCallback } from 'react';

const MAX_RECENT_COLORS = 5;

/**
 * Custom hook for managing user's recently used colors
 * @param {string} userId - Current user ID
 * @returns {Object} { recentColors, addRecentColor, refreshRecentColors }
 */
export function useRecentColors(userId) {
  const [recentColors, setRecentColors] = useState([]);
  
  // Load colors from localStorage
  const loadColors = useCallback(() => {
    if (!userId) return;
    
    try {
      const storageKey = `recentColors_${userId}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentColors(Array.isArray(parsed) ? parsed : []);
      } else {
        setRecentColors([]);
      }
    } catch (error) {
      console.error('Failed to load recent colors:', error);
      setRecentColors([]);
    }
  }, [userId]);
  
  // Load recent colors from localStorage on mount
  useEffect(() => {
    loadColors();
  }, [loadColors]);
  
  // Add a color to recent colors
  const addRecentColor = useCallback((color) => {
    if (!userId || !color) return;
    
    setRecentColors(prev => {
      // Normalize color to uppercase
      const normalizedColor = color.toUpperCase();
      
      // Remove duplicates
      const filtered = prev.filter(c => c.toUpperCase() !== normalizedColor);
      
      // Add to front
      const updated = [normalizedColor, ...filtered];
      
      // Trim to max
      const trimmed = updated.slice(0, MAX_RECENT_COLORS);
      
      // Save to localStorage
      try {
        const storageKey = `recentColors_${userId}`;
        localStorage.setItem(storageKey, JSON.stringify(trimmed));
      } catch (error) {
        console.error('Failed to save recent colors:', error);
      }
      
      return trimmed;
    });
  }, [userId]);
  
  return { recentColors, addRecentColor, refreshRecentColors: loadColors };
}

