// CanvasContext - Canvas state and operations provider

import { createContext, useState, useRef, useEffect } from 'react';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  MIN_ZOOM, 
  MAX_ZOOM,
  SHAPE_TYPES,
  DEFAULT_SHAPE_WIDTH,
  DEFAULT_SHAPE_HEIGHT,
  DEFAULT_CIRCLE_RADIUS,
  DEFAULT_SHAPE_FILL,
  DEFAULT_TEXT_WIDTH,
  DEFAULT_TEXT_HEIGHT,
  DEFAULT_TEXT_CONTENT,
  DEFAULT_TEXT_SIZE,
  DEFAULT_TEXT_COLOR,
  DEFAULT_TEXT_FONT_FAMILY,
} from '../utils/constants';
import { useCanvas } from '../hooks/useCanvas';
import { useAuth } from '../hooks/useAuth';
import * as canvasService from '../services/canvas';
import { cleanupStaleSessions } from '../services/cursors';

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
  
  // Export selection state
  const [exportSelectionMode, setExportSelectionMode] = useState(false);
  const [selectionBox, setSelectionBox] = useState(null);
  
  // Clean up stale sessions on mount
  useEffect(() => {
    cleanupStaleSessions(2 * 60 * 1000); // Clean up sessions older than 2 minutes
  }, []);
  
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
    // Only update stage position if the stage itself was dragged, not a shape
    const stage = e.target.getStage();
    if (e.target !== stage) {
      return; // A shape was dragged, not the stage - ignore
    }
    
    const newPos = constrainPosition(
      { x: e.target.x(), y: e.target.y() },
      scale
    );
    setPosition(newPos);
  };
  
  // Shape operations with Firestore sync
  
  // Generate unique ID for shapes
  const generateShapeId = () => {
    return `shape_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  };
  
  // Add a new shape (syncs to Firestore)
  const addShape = async (type = SHAPE_TYPES.RECTANGLE, position = null) => {
    if (!currentUser) return null;
    
    try {
      const baseShape = {
        id: generateShapeId(),
        type,
        x: position?.x || 100,
        y: position?.y || 100,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1.0, // Default: fully opaque
        blendMode: 'source-over', // Default: normal blend mode
      };
      
      // Add type-specific properties
      let newShape;
      switch (type) {
        case SHAPE_TYPES.RECTANGLE:
          newShape = {
            ...baseShape,
            width: DEFAULT_SHAPE_WIDTH,
            height: DEFAULT_SHAPE_HEIGHT,
            fill: DEFAULT_SHAPE_FILL,
          };
          break;
        
        case SHAPE_TYPES.CIRCLE:
          newShape = {
            ...baseShape,
            radius: DEFAULT_CIRCLE_RADIUS,
            fill: DEFAULT_SHAPE_FILL,
          };
          break;
        
        case SHAPE_TYPES.TEXT:
          newShape = {
            ...baseShape,
            text: DEFAULT_TEXT_CONTENT,
            fontSize: DEFAULT_TEXT_SIZE,
            fontFamily: DEFAULT_TEXT_FONT_FAMILY,
            fontStyle: 'normal', // Default: no bold or italic
            fill: DEFAULT_TEXT_COLOR,
            width: DEFAULT_TEXT_WIDTH,
            height: DEFAULT_TEXT_HEIGHT,
          };
          break;
        
        default:
          newShape = {
            ...baseShape,
            width: DEFAULT_SHAPE_WIDTH,
            height: DEFAULT_SHAPE_HEIGHT,
            fill: DEFAULT_SHAPE_FILL,
          };
      }
      
      await canvasService.createShape(newShape, currentUser.uid);
      setSelectedId(newShape.id);
      return newShape.id; // Return the new shape ID
    } catch (error) {
      console.error('Error adding shape:', error);
      return null;
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
    if (!currentUser) return false;
    
    try {
      // Check if shape is locked by another user
      const shape = shapes.find(s => s.id === id);
      if (shape?.isLocked && shape.lockedBy !== currentUser.uid) {
        console.warn('Cannot delete: Shape is locked by another user');
        return false;
      }
      
      await canvasService.deleteShape(id);
      if (selectedId === id) {
        setSelectedId(null);
      }
      return true;
    } catch (error) {
      console.error('Error deleting shape:', error);
      return false;
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
  
  // Z-index management (layer ordering)
  const bringShapeToFront = async (id) => {
    if (!currentUser) return;
    
    try {
      await canvasService.bringToFront(id);
    } catch (error) {
      console.error('Error bringing shape to front:', error);
    }
  };
  
  const sendShapeToBack = async (id) => {
    if (!currentUser) return;
    
    try {
      await canvasService.sendToBack(id);
    } catch (error) {
      console.error('Error sending shape to back:', error);
    }
  };
  
  const bringShapeForward = async (id) => {
    if (!currentUser) return;
    
    try {
      await canvasService.bringForward(id);
    } catch (error) {
      console.error('Error bringing shape forward:', error);
    }
  };
  
  const sendShapeBackward = async (id) => {
    if (!currentUser) return;
    
    try {
      await canvasService.sendBackward(id);
    } catch (error) {
      console.error('Error sending shape backward:', error);
    }
  };
  
  // Reorder shapes (for drag-and-drop in layers panel)
  const reorderShapes = async (newShapesOrder) => {
    if (!currentUser) return;
    
    try {
      await canvasService.reorderShapes(newShapesOrder);
    } catch (error) {
      console.error('Error reordering shapes:', error);
    }
  };
  
  // Layer visibility toggle
  const toggleVisibility = async (id) => {
    if (!currentUser) return;
    
    try {
      const shape = shapes.find(s => s.id === id);
      if (!shape) return;
      
      await canvasService.toggleShapeVisibility(id, !shape.visible);
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };
  
  // Layer lock toggle
  const toggleLock = async (id) => {
    if (!currentUser) return;
    
    try {
      const shape = shapes.find(s => s.id === id);
      if (!shape) return;
      
      await canvasService.toggleLayerLock(id, !shape.layerLocked, currentUser.uid);
    } catch (error) {
      console.error('Error toggling layer lock:', error);
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
    // Z-index management
    bringShapeToFront,
    sendShapeToBack,
    bringShapeForward,
    sendShapeBackward,
    reorderShapes,
    // Layer visibility & locking
    toggleVisibility,
    toggleLock,
    // Export selection state
    exportSelectionMode,
    setExportSelectionMode,
    selectionBox,
    setSelectionBox,
  };
  
  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
}

