// useAITasks.js - Hook for managing AI tasks

import { useState, useEffect } from 'react';
import { subscribeToAITasks } from '../services/aiTasks';

/**
 * Custom hook for managing AI tasks
 * @param {string} userId - Current user ID
 * @returns {Object} AI tasks data and utilities
 */
export function useAITasks(userId) {
  const [aiTasks, setAITasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!userId) {
      setAITasks([]);
      setLoading(false);
      return;
    }
    
    const unsubscribe = subscribeToAITasks(userId, (newTasks) => {
      setAITasks(newTasks);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [userId]);
  
  // Get pending tasks
  const pendingTasks = aiTasks.filter(t => t.status === 'pending');
  
  // Get completed tasks
  const completedTasks = aiTasks.filter(t => t.status === 'completed');
  
  // Get failed tasks
  const failedTasks = aiTasks.filter(t => t.status === 'failed');
  
  // Get tasks for a specific shape
  const getShapeTasks = (shapeId) => {
    return aiTasks.filter(t => t.shapeId === shapeId);
  };
  
  // Get canvas-level tasks (not attached to shapes)
  const getCanvasTasks = () => {
    return aiTasks.filter(t => !t.shapeId);
  };
  
  return {
    aiTasks,
    pendingTasks,
    completedTasks,
    failedTasks,
    getShapeTasks,
    getCanvasTasks,
    pendingCount: pendingTasks.length,
    completedCount: completedTasks.length,
    failedCount: failedTasks.length,
    loading,
  };
}

