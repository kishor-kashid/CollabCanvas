// useComments.js - Hook for managing comments

import { useState, useEffect } from 'react';
import { subscribeToComments } from '../services/comments';

/**
 * Custom hook for managing comments
 * @param {string} canvasId - Canvas ID
 * @returns {Object} Comments data and utilities
 */
export function useComments(canvasId) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!canvasId) {
      setComments([]);
      setLoading(false);
      return;
    }
    
    const unsubscribe = subscribeToComments(canvasId, (newComments) => {
      setComments(newComments);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [canvasId]);
  
  // Group comments by thread
  const commentThreads = comments.reduce((acc, comment) => {
    const threadId = comment.threadId || comment.id;
    if (!acc[threadId]) {
      acc[threadId] = [];
    }
    acc[threadId].push(comment);
    return acc;
  }, {});
  
  // Get comments for a specific shape
  const getShapeComments = (shapeId) => {
    return comments.filter(c => c.shapeId === shapeId && !c.parentId);
  };
  
  // Get canvas-level comments (not attached to shapes)
  const getCanvasComments = () => {
    return comments.filter(c => !c.shapeId && !c.parentId);
  };
  
  // Get unresolved comment count
  const unresolvedCount = comments.filter(c => !c.isResolved && !c.parentId).length;
  
  return {
    comments,
    commentThreads,
    getShapeComments,
    getCanvasComments,
    unresolvedCount,
    loading,
  };
}

