// CanvasManagementContext - Manages multiple canvases, switching, and sharing

import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  createCanvas,
  getCanvas,
  updateCanvas,
  deleteCanvas,
  getUserCanvases,
  getSharedCanvases,
  joinCanvasByShareCode,
  regenerateShareCode,
  removeCollaborator,
  updateLastAccessed,
} from '../services/canvasManagement';

export const CanvasManagementContext = createContext(null);

/**
 * CanvasManagementProvider - Provides canvas management state and operations
 */
export function CanvasManagementProvider({ children }) {
  const { currentUser } = useAuth();
  
  // Current active canvas
  const [currentCanvasId, setCurrentCanvasId] = useState(null);
  const [currentCanvas, setCurrentCanvas] = useState(null);
  
  // User's canvases
  const [userCanvases, setUserCanvases] = useState([]);
  const [sharedCanvases, setSharedCanvases] = useState([]);
  
  // Loading states
  const [isLoadingCanvases, setIsLoadingCanvases] = useState(true);
  const [isLoadingCanvas, setIsLoadingCanvas] = useState(false);
  
  // Load user's canvases when user logs in
  useEffect(() => {
    if (currentUser) {
      loadUserCanvases();
    } else {
      // Clear canvases when user logs out
      setUserCanvases([]);
      setSharedCanvases([]);
      setCurrentCanvasId(null);
      setCurrentCanvas(null);
      setIsLoadingCanvases(false);
    }
  }, [currentUser]);
  
  // Load current canvas details when canvasId changes
  useEffect(() => {
    if (currentCanvasId) {
      loadCurrentCanvas(currentCanvasId);
    } else {
      setCurrentCanvas(null);
    }
  }, [currentCanvasId]);
  
  /**
   * Load all canvases for current user
   */
  const loadUserCanvases = async () => {
    if (!currentUser) return;
    
    setIsLoadingCanvases(true);
    try {
      const [owned, shared] = await Promise.all([
        getUserCanvases(currentUser.uid),
        getSharedCanvases(currentUser.uid),
      ]);
      
      setUserCanvases(owned);
      setSharedCanvases(shared);
    } catch (error) {
      console.error('Error loading user canvases:', error);
    } finally {
      setIsLoadingCanvases(false);
    }
  };
  
  /**
   * Load specific canvas details
   */
  const loadCurrentCanvas = async (canvasId) => {
    if (!canvasId) return;
    
    setIsLoadingCanvas(true);
    try {
      const canvas = await getCanvas(canvasId);
      setCurrentCanvas(canvas);
      
      // Update last accessed
      if (currentUser) {
        await updateLastAccessed(canvasId, currentUser.uid);
      }
    } catch (error) {
      console.error('Error loading canvas:', error);
      setCurrentCanvas(null);
    } finally {
      setIsLoadingCanvas(false);
    }
  };
  
  /**
   * Create a new canvas
   */
  const handleCreateCanvas = async (canvasName, settings = {}) => {
    if (!currentUser) {
      throw new Error('Must be logged in to create canvas');
    }
    
    try {
      const newCanvas = await createCanvas(
        currentUser.uid,
        canvasName,
        currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        settings
      );
      
      // Reload user canvases to include new one
      await loadUserCanvases();
      
      return newCanvas;
    } catch (error) {
      console.error('Error creating canvas:', error);
      throw error;
    }
  };
  
  /**
   * Switch to a different canvas
   */
  const handleSwitchCanvas = async (canvasId) => {
    if (!canvasId) {
      setCurrentCanvasId(null);
      return;
    }
    
    try {
      setCurrentCanvasId(canvasId);
      // loadCurrentCanvas will be called via useEffect
    } catch (error) {
      console.error('Error switching canvas:', error);
      throw error;
    }
  };
  
  /**
   * Update canvas metadata (name, settings, etc.)
   */
  const handleUpdateCanvas = async (canvasId, updates) => {
    try {
      await updateCanvas(canvasId, updates);
      
      // Reload canvas if it's the current one
      if (canvasId === currentCanvasId) {
        await loadCurrentCanvas(canvasId);
      }
      
      // Reload user canvases to reflect changes
      await loadUserCanvases();
    } catch (error) {
      console.error('Error updating canvas:', error);
      throw error;
    }
  };
  
  /**
   * Delete a canvas (owner only)
   */
  const handleDeleteCanvas = async (canvasId) => {
    if (!currentUser) {
      throw new Error('Must be logged in to delete canvas');
    }
    
    try {
      await deleteCanvas(canvasId, currentUser.uid);
      
      // If deleted canvas was active, clear it
      if (canvasId === currentCanvasId) {
        setCurrentCanvasId(null);
      }
      
      // Reload user canvases
      await loadUserCanvases();
    } catch (error) {
      console.error('Error deleting canvas:', error);
      throw error;
    }
  };
  
  /**
   * Join canvas by share code
   */
  const handleJoinCanvas = async (shareCode) => {
    if (!currentUser) {
      throw new Error('Must be logged in to join canvas');
    }
    
    try {
      const canvas = await joinCanvasByShareCode(
        shareCode,
        currentUser.uid,
        currentUser.displayName || currentUser.email?.split('@')[0] || 'User'
      );
      
      // Reload user canvases to include new shared canvas
      await loadUserCanvases();
      
      return canvas;
    } catch (error) {
      console.error('Error joining canvas:', error);
      throw error;
    }
  };
  
  /**
   * Regenerate share code for canvas (owner only)
   */
  const handleRegenerateShareCode = async (canvasId) => {
    if (!currentUser) {
      throw new Error('Must be logged in');
    }
    
    try {
      const newCode = await regenerateShareCode(canvasId, currentUser.uid);
      
      // Reload current canvas to get new code
      if (canvasId === currentCanvasId) {
        await loadCurrentCanvas(canvasId);
      }
      
      return newCode;
    } catch (error) {
      console.error('Error regenerating share code:', error);
      throw error;
    }
  };
  
  /**
   * Remove collaborator from canvas (owner only)
   */
  const handleRemoveCollaborator = async (canvasId, collaboratorId) => {
    if (!currentUser) {
      throw new Error('Must be logged in');
    }
    
    try {
      await removeCollaborator(canvasId, collaboratorId, currentUser.uid);
      
      // Reload current canvas if it's active
      if (canvasId === currentCanvasId) {
        await loadCurrentCanvas(canvasId);
      }
    } catch (error) {
      console.error('Error removing collaborator:', error);
      throw error;
    }
  };
  
  /**
   * Check if current user is owner of canvas
   */
  const isOwner = (canvasId) => {
    if (!currentUser || !canvasId) return false;
    
    const canvas = userCanvases.find(c => c.canvasId === canvasId);
    return !!canvas; // If in userCanvases, they're the owner
  };
  
  /**
   * Check if current user is collaborator on canvas
   */
  const isCollaborator = (canvasId) => {
    if (!currentUser || !canvasId) return false;
    
    const canvas = sharedCanvases.find(c => c.canvasId === canvasId);
    return !!canvas;
  };
  
  /**
   * Get canvas details from cache (owned or shared)
   */
  const getCanvasFromCache = (canvasId) => {
    const ownedCanvas = userCanvases.find(c => c.canvasId === canvasId);
    if (ownedCanvas) return { ...ownedCanvas, isOwned: true };
    
    const sharedCanvas = sharedCanvases.find(c => c.canvasId === canvasId);
    if (sharedCanvas) return { ...sharedCanvas, isOwned: false };
    
    return null;
  };
  
  const value = {
    // Current canvas state
    currentCanvasId,
    currentCanvas,
    isLoadingCanvas,
    
    // User's canvases
    userCanvases,
    sharedCanvases,
    isLoadingCanvases,
    
    // Operations
    createCanvas: handleCreateCanvas,
    switchCanvas: handleSwitchCanvas,
    updateCanvas: handleUpdateCanvas,
    deleteCanvas: handleDeleteCanvas,
    joinCanvas: handleJoinCanvas,
    regenerateShareCode: handleRegenerateShareCode,
    removeCollaborator: handleRemoveCollaborator,
    reloadCanvases: loadUserCanvases,
    
    // Utilities
    isOwner,
    isCollaborator,
    getCanvasFromCache,
  };
  
  return (
    <CanvasManagementContext.Provider value={value}>
      {children}
    </CanvasManagementContext.Provider>
  );
}

/**
 * Custom hook to use canvas management context
 */
export function useCanvasManagement() {
  const context = useContext(CanvasManagementContext);
  
  if (!context) {
    throw new Error('useCanvasManagement must be used within CanvasManagementProvider');
  }
  
  return context;
}

export default CanvasManagementContext;

