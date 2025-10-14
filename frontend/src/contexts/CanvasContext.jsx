// CanvasContext - Canvas state and operations provider

import { createContext, useState, useRef, useEffect } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, MIN_ZOOM, MAX_ZOOM } from '../utils/constants';
import { useCanvas } from '../hooks/useCanvas';
import { useAuth } from '../hooks/useAuth';
import * as canvasService from '../services/canvas';

export const CanvasContext = createContext(null);

/**
 * CanvasProvider component that provides canvas state and operations
 */
export function CanvasProvider({ children }) {
  // Get shapes from Firestore hook
  const { shapes: firestoreShapes, loading, error, isOnline } = useCanvas();
  const { currentUser } = useAuth();
  
  const [shapes, setShapes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const stageRef = useRef(null);
  
  // Sync Firestore shapes to local state
  useEffect(() => {
    setShapes(firestoreShapes);
  }, [firestoreShapes]);
  
  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Reset view to initial state
  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  
  // Zoom in
  const zoomIn = () => {
    const newScale = Math.min(scale * 1.2, MAX_ZOOM);
    setScale(newScale);
  };
  
  // Zoom out
  const zoomOut = () => {
    const newScale = Math.max(scale / 1.2, MIN_ZOOM);
    setScale(newScale);
  };
  
  // Handle wheel zoom (will be called from Canvas component)
  const handleWheel = (e) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    // Zoom direction
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const scaleBy = 1.05;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    // Clamp scale
    const clampedScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));
    
    // Calculate new position to zoom to cursor
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    
    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };
    
    setScale(clampedScale);
    setPosition(newPos);
  };
  
  // Constrain stage position to canvas boundaries
  const constrainPosition = (pos, currentScale) => {
    const maxX = 0;
    const maxY = 0;
    const minX = -CANVAS_WIDTH * currentScale + window.innerWidth;
    const minY = -CANVAS_HEIGHT * currentScale + window.innerHeight;
    
    return {
      x: Math.max(minX, Math.min(maxX, pos.x)),
      y: Math.max(minY, Math.min(maxY, pos.y)),
    };
  };
  
  // Handle stage drag end (pan)
  const handleDragEnd = (e) => {
    const newPos = constrainPosition(
      { x: e.target.x(), y: e.target.y() },
      scale
    );
    setPosition(newPos);
  };
  
  // Shape operations with Firestore sync
  
  // Generate unique ID for shapes
  const generateShapeId = () => {
    return `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };
  
  // Add a new shape (syncs to Firestore)
  const addShape = async (type = 'rectangle', position = null) => {
    if (!currentUser) return;
    
    try {
      const newShape = {
        id: generateShapeId(),
        type,
        x: position?.x || 100,
        y: position?.y || 100,
        width: 100,
        height: 100,
        fill: '#cccccc', // Fixed gray fill for MVP
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      };
      
      await canvasService.createShape(newShape, currentUser.uid);
      setSelectedId(newShape.id);
    } catch (error) {
      console.error('Error adding shape:', error);
    }
  };
  
  // Update shape properties (syncs to Firestore)
  const updateShape = async (id, updates) => {
    if (!currentUser) return;
    
    try {
      await canvasService.updateShape(id, updates, currentUser.uid);
    } catch (error) {
      console.error('Error updating shape:', error);
    }
  };
  
  // Delete shape (syncs to Firestore)
  const deleteShape = async (id) => {
    if (!currentUser) return;
    
    try {
      // Check if shape is locked by another user
      const shape = shapes.find(s => s.id === id);
      if (shape?.isLocked && shape.lockedBy !== currentUser.uid) {
        console.warn('Cannot delete: Shape is locked by another user');
        return;
      }
      
      await canvasService.deleteShape(id);
      if (selectedId === id) {
        setSelectedId(null);
      }
    } catch (error) {
      console.error('Error deleting shape:', error);
    }
  };
  
  // Select shape
  const selectShape = (id) => {
    setSelectedId(id);
  };
  
  // Deselect all shapes
  const deselectAll = () => {
    setSelectedId(null);
  };
  
  // Lock shape when starting to drag
  const lockShape = async (id) => {
    if (!currentUser) return false;
    
    try {
      const success = await canvasService.lockShape(id, currentUser.uid);
      return success;
    } catch (error) {
      console.error('Error locking shape:', error);
      return false;
    }
  };
  
  // Unlock shape when done dragging
  const unlockShape = async (id) => {
    if (!currentUser) return;
    
    try {
      await canvasService.unlockShape(id, currentUser.uid);
    } catch (error) {
      console.error('Error unlocking shape:', error);
    }
  };
  
  const value = {
    shapes,
    selectedId,
    stageRef,
    scale,
    position,
    loading,
    error,
    isOnline,
    setShapes,
    setSelectedId,
    setScale,
    setPosition,
    resetView,
    zoomIn,
    zoomOut,
    handleWheel,
    handleDragEnd,
    constrainPosition,
    // Shape operations
    addShape,
    updateShape,
    deleteShape,
    selectShape,
    deselectAll,
    lockShape,
    unlockShape,
    generateShapeId,
    currentUserId: currentUser?.uid,
  };
  
  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
}

