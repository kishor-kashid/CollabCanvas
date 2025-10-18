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
  DEFAULT_TRIANGLE_WIDTH,
  DEFAULT_TRIANGLE_HEIGHT,
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
  
  // Grid visibility state
  const [gridVisible, setGridVisible] = useState(true);
  
  // Current color for new shapes (with localStorage persistence)
  const [currentColor, setCurrentColor] = useState(() => {
    // Load from localStorage or use default black
    return localStorage.getItem('collabcanvas-current-color') || '#000000';
  });
  
  // User-specific Undo/Redo state
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const isUndoingRef = useRef(false); // Flag to prevent recording during undo/redo
  const aiOperationBatchRef = useRef(null); // Collect AI actions into a batch
  
  // Clipboard for copy/paste
  const [clipboard, setClipboard] = useState(null);
  
  // Comment mode
  const [commentMode, setCommentMode] = useState(false);
  
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
  
  // Fit entire canvas to screen
  const fitToScreen = () => {
    const padding = 50;
    const availableWidth = window.innerWidth - padding * 2;
    const availableHeight = window.innerHeight - padding * 2;
    
    const scaleX = availableWidth / CANVAS_WIDTH;
    const scaleY = availableHeight / CANVAS_HEIGHT;
    const newScale = Math.min(scaleX, scaleY, MAX_ZOOM);
    
    setScale(newScale);
    setPosition({ 
      x: padding, 
      y: padding 
    });
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
            fill: currentColor,
          };
          break;
        
        case SHAPE_TYPES.CIRCLE:
          newShape = {
            ...baseShape,
            radius: DEFAULT_CIRCLE_RADIUS,
            fill: currentColor,
          };
          break;
        
        case SHAPE_TYPES.TRIANGLE:
          newShape = {
            ...baseShape,
            width: DEFAULT_TRIANGLE_WIDTH,
            height: DEFAULT_TRIANGLE_HEIGHT,
            fill: currentColor,
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
      
      // Record action for undo
      recordAction({
        type: 'create',
        shapes: [newShape],
        timestamp: Date.now(),
      });
      
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
      // Capture old properties before update
      const shape = shapes.find(s => s.id === id);
      if (shape) {
        const oldProps = {};
        Object.keys(updates).forEach(key => {
          oldProps[key] = shape[key];
        });
        
        await canvasService.updateShape(id, updates, currentUser.uid);
        
        // Record action for undo
        recordAction({
          type: 'update',
          updates: [{
            id,
            oldProps,
            newProps: updates,
          }],
          timestamp: Date.now(),
        });
      } else {
        await canvasService.updateShape(id, updates, currentUser.uid);
      }
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
      
      // Capture shape data before deletion for undo
      if (shape) {
        await canvasService.deleteShape(id);
        
        // Record action for undo
        recordAction({
          type: 'delete',
          shapes: [shape],
          timestamp: Date.now(),
        });
        
        if (selectedId === id) {
          setSelectedId(null);
        }
        return true;
      } else {
        await canvasService.deleteShape(id);
        if (selectedId === id) {
          setSelectedId(null);
        }
        return true;
      }
    } catch (error) {
      console.error('Error deleting shape:', error);
      return false;
    }
  };
  
  // Add shapes optimistically (local state only, for instant UI)
  const addShapesOptimistic = (shapesData) => {
    if (!currentUser) return;
    
    // Add shapes to local state immediately without waiting for Firestore
    setShapes(prevShapes => [...prevShapes, ...shapesData]);
  };
  
  // Add multiple shapes in batch (syncs to Firestore)
  const addShapesBatch = async (shapesData) => {
    if (!currentUser) return [];
    
    try {
      const shapeIds = await canvasService.createShapesBatch(shapesData, currentUser.uid);
      
      // Record action for undo (as a batch of creates)
      if (shapesData.length > 0) {
        recordAction({
          type: 'create',
          shapes: shapesData,
          timestamp: Date.now(),
        });
      }
      
      return shapeIds;
    } catch (error) {
      console.error('Error adding shapes batch:', error);
      return [];
    }
  };
  
  // Delete shapes optimistically (local state only, for instant UI)
  const deleteShapesOptimistic = (shapeIds) => {
    if (!currentUser) return;
    
    // Remove shapes from local state immediately
    setShapes(prevShapes => prevShapes.filter(s => !shapeIds.includes(s.id)));
    
    // Clear selection if deleted
    if (shapeIds.includes(selectedId)) {
      setSelectedId(null);
    }
  };
  
  // Delete multiple shapes in batch (syncs to Firestore)
  const deleteShapesBatch = async (shapeIds) => {
    if (!currentUser) return 0;
    
    try {
      // Capture shapes before deletion for undo
      const shapesToDelete = shapes.filter(s => shapeIds.includes(s.id));
      
      const deletedCount = await canvasService.deleteShapesBatch(shapeIds);
      
      // Record action for undo
      if (shapesToDelete.length > 0) {
        recordAction({
          type: 'delete',
          shapes: shapesToDelete,
          timestamp: Date.now(),
        });
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Error deleting shapes batch:', error);
      return 0;
    }
  };
  
  // Update shapes optimistically (local state only, for instant UI)
  const updateShapesOptimistic = (updates) => {
    if (!currentUser) return;
    
    const updatesMap = new Map(updates.map(u => [u.id, u.updates]));
    
    setShapes(prevShapes => 
      prevShapes.map(shape => 
        updatesMap.has(shape.id)
          ? { ...shape, ...updatesMap.get(shape.id) }
          : shape
      )
    );
  };
  
  // Update multiple shapes in batch (syncs to Firestore)
  const updateShapesBatch = async (updates) => {
    if (!currentUser) return 0;
    
    try {
      // Capture old properties before update
      const updateRecords = updates.map(({ id, updates: newProps }) => {
        const shape = shapes.find(s => s.id === id);
        if (shape) {
          const oldProps = {};
          Object.keys(newProps).forEach(key => {
            oldProps[key] = shape[key];
          });
          return { id, oldProps, newProps };
        }
        return null;
      }).filter(Boolean);
      
      const updatedCount = await canvasService.updateShapesBatch(updates, currentUser.uid);
      
      // Record action for undo
      if (updateRecords.length > 0) {
        recordAction({
          type: 'update',
          updates: updateRecords,
          timestamp: Date.now(),
        });
      }
      
      return updatedCount;
    } catch (error) {
      console.error('Error updating shapes batch:', error);
      return 0;
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
  
  // ============= UNDO/REDO SYSTEM =============
  
  /**
   * Record an action to the undo stack
   * @param {Object} action - Action object with type and data
   */
  const recordAction = (action) => {
    if (isUndoingRef.current) return; // Don't record during undo/redo
    
    // If we're in AI batch mode, collect actions instead of recording immediately
    if (aiOperationBatchRef.current) {
      aiOperationBatchRef.current.push(action);
      console.log('📝 Action collected for AI batch:', action.type);
      return;
    }
    
    setUndoStack(prev => [...prev, action]);
    setRedoStack([]); // Clear redo stack on new action
    
    console.log('📝 Action recorded:', action.type, action);
  };
  
  /**
   * Start collecting AI actions into a batch
   */
  const startAIBatch = () => {
    aiOperationBatchRef.current = [];
    console.log('🤖 Started AI batch collection');
  };
  
  /**
   * End AI batch and record all collected actions as a single batch
   */
  const endAIBatch = () => {
    if (!aiOperationBatchRef.current || aiOperationBatchRef.current.length === 0) {
      aiOperationBatchRef.current = null;
      return;
    }
    
    const collectedActions = aiOperationBatchRef.current;
    aiOperationBatchRef.current = null;
    
    // Record as a single batch action
    setUndoStack(prev => [...prev, {
      type: 'batch',
      actions: collectedActions,
      timestamp: Date.now(),
    }]);
    setRedoStack([]); // Clear redo stack
    
    console.log(`🤖 AI batch recorded with ${collectedActions.length} actions`);
  };
  
  /**
   * Start a batch of actions (for AI operations)
   */
  const startActionBatch = () => {
    if (isUndoingRef.current) return null;
    
    return {
      actions: [],
      addAction: function(action) {
        this.actions.push(action);
      },
      commit: function() {
        if (this.actions.length > 0) {
          recordAction({
            type: 'batch',
            actions: this.actions,
            timestamp: Date.now(),
          });
        }
      }
    };
  };
  
  /**
   * Undo the last action
   */
  const undo = async () => {
    if (undoStack.length === 0 || !currentUser) {
      console.log('⚠️ Nothing to undo');
      return;
    }
    
    const action = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    
    isUndoingRef.current = true;
    
    try {
      console.log('↩️ Undoing action:', action.type);
      
      if (action.type === 'batch') {
        // Undo batch in reverse order
        for (let i = action.actions.length - 1; i >= 0; i--) {
          await undoSingleAction(action.actions[i]);
        }
      } else {
        await undoSingleAction(action);
      }
      
      // Add to redo stack
      setRedoStack(prev => [...prev, action]);
      
      console.log('✅ Undo successful');
    } catch (error) {
      console.error('❌ Error during undo:', error);
      // Restore action to undo stack on error
      setUndoStack(prev => [...prev, action]);
    } finally {
      isUndoingRef.current = false;
    }
  };
  
  /**
   * Redo the last undone action
   */
  const redo = async () => {
    if (redoStack.length === 0 || !currentUser) {
      console.log('⚠️ Nothing to redo');
      return;
    }
    
    const action = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    
    isUndoingRef.current = true;
    
    try {
      console.log('↪️ Redoing action:', action.type);
      
      if (action.type === 'batch') {
        // Redo batch in forward order
        for (const singleAction of action.actions) {
          await redoSingleAction(singleAction);
        }
      } else {
        await redoSingleAction(action);
      }
      
      // Add back to undo stack
      setUndoStack(prev => [...prev, action]);
      
      console.log('✅ Redo successful');
    } catch (error) {
      console.error('❌ Error during redo:', error);
      // Restore action to redo stack on error
      setRedoStack(prev => [...prev, action]);
    } finally {
      isUndoingRef.current = false;
    }
  };
  
  /**
   * Undo a single action
   */
  const undoSingleAction = async (action) => {
    switch (action.type) {
      case 'create':
        // Delete the created shape(s)
        for (const shapeData of action.shapes) {
          await canvasService.deleteShape(shapeData.id);
        }
        break;
      
      case 'delete':
        // Recreate the deleted shape(s)
        for (const shapeData of action.shapes) {
          await canvasService.createShape(shapeData, currentUser.uid);
        }
        break;
      
      case 'update':
        // Restore old properties
        for (const update of action.updates) {
          await canvasService.updateShape(update.id, update.oldProps, currentUser.uid);
        }
        break;
      
      default:
        console.warn('Unknown action type:', action.type);
    }
  };
  
  /**
   * Redo a single action
   */
  const redoSingleAction = async (action) => {
    switch (action.type) {
      case 'create':
        // Recreate the shape(s)
        for (const shapeData of action.shapes) {
          await canvasService.createShape(shapeData, currentUser.uid);
        }
        break;
      
      case 'delete':
        // Delete the shape(s) again
        for (const shapeData of action.shapes) {
          await canvasService.deleteShape(shapeData.id);
        }
        break;
      
      case 'update':
        // Reapply new properties
        for (const update of action.updates) {
          await canvasService.updateShape(update.id, update.newProps, currentUser.uid);
        }
        break;
      
      default:
        console.warn('Unknown action type:', action.type);
    }
  };
  
  // ============= END UNDO/REDO SYSTEM =============
  
  // ============= COPY/PASTE SYSTEM =============
  
  /**
   * Copy selected shape to clipboard
   * @param {string} id - Shape ID to copy
   * @returns {boolean} Success status
   */
  const copyShape = (id) => {
    if (!id) {
      console.warn('No shape selected to copy');
      return false;
    }
    
    const shape = shapes.find(s => s.id === id);
    if (!shape) {
      console.warn('Shape not found');
      return false;
    }
    
    // Store complete shape data (excluding metadata)
    const shapeToCopy = {
      type: shape.type,
      x: shape.x,
      y: shape.y,
      rotation: shape.rotation || 0,
      scaleX: shape.scaleX || 1,
      scaleY: shape.scaleY || 1,
      opacity: shape.opacity || 1.0,
      blendMode: shape.blendMode || 'source-over',
      visible: shape.visible !== false,
      layerLocked: false, // Don't copy lock state
      // Type-specific properties
      ...(shape.fill && { fill: shape.fill }),
      ...(shape.width && { width: shape.width }),
      ...(shape.height && { height: shape.height }),
      ...(shape.radius && { radius: shape.radius }),
      ...(shape.text && { text: shape.text }),
      ...(shape.fontSize && { fontSize: shape.fontSize }),
      ...(shape.fontFamily && { fontFamily: shape.fontFamily }),
      ...(shape.fontStyle && { fontStyle: shape.fontStyle }),
    };
    
    setClipboard(shapeToCopy);
    console.log('✂️ Shape copied to clipboard:', shape.type);
    return true;
  };
  
  /**
   * Paste shape from clipboard
   * @returns {string|null} New shape ID or null
   */
  const pasteShape = async () => {
    if (!clipboard) {
      alert('Nothing to paste! Copy a shape first (Ctrl/Cmd+C)');
      console.warn('Nothing to paste');
      return null;
    }
    
    if (!currentUser) {
      console.warn('No user logged in');
      return null;
    }
    
    try {
      // Create new shape with offset from original position
      const PASTE_OFFSET = 80; // Pixels to offset
      
      const newShape = {
        id: generateShapeId(),
        ...clipboard,
        x: clipboard.x + PASTE_OFFSET,
        y: clipboard.y + PASTE_OFFSET,
      };
      
      await canvasService.createShape(newShape, currentUser.uid);
      setSelectedId(newShape.id); // Auto-select pasted shape
      
      // Record action for undo
      recordAction({
        type: 'create',
        shapes: [newShape],
        timestamp: Date.now(),
      });
      
      // Update clipboard position for next paste (cascade effect)
      setClipboard({
        ...clipboard,
        x: newShape.x,
        y: newShape.y,
      });
      
      console.log('📋 Shape pasted:', newShape.type);
      return newShape.id;
    } catch (error) {
      console.error('Error pasting shape:', error);
      return null;
    }
  };
  
  /**
   * Duplicate a shape directly (without using clipboard)
   * @param {string} shapeId - Shape ID to duplicate
   * @returns {string|null} New shape ID or null
   */
  const duplicateShape = async (shapeId) => {
    if (!shapeId || !currentUser) {
      console.warn('No shape ID provided to duplicate or no user');
      return null;
    }
    
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) {
      console.warn('Shape not found for duplication');
      return null;
    }
    
    try {
      // Create duplicate with offset from original position
      const DUPLICATE_OFFSET = 80; // Pixels to offset
      
      const newShape = {
        id: generateShapeId(),
        type: shape.type,
        x: shape.x + DUPLICATE_OFFSET,
        y: shape.y + DUPLICATE_OFFSET,
        rotation: shape.rotation || 0,
        scaleX: shape.scaleX || 1,
        scaleY: shape.scaleY || 1,
        opacity: shape.opacity || 1.0,
        blendMode: shape.blendMode || 'source-over',
        visible: shape.visible !== false,
        layerLocked: false, // Don't copy lock state
        // Type-specific properties
        ...(shape.fill && { fill: shape.fill }),
        ...(shape.width && { width: shape.width }),
        ...(shape.height && { height: shape.height }),
        ...(shape.radius && { radius: shape.radius }),
        ...(shape.text && { text: shape.text }),
        ...(shape.fontSize && { fontSize: shape.fontSize }),
        ...(shape.fontFamily && { fontFamily: shape.fontFamily }),
        ...(shape.fontStyle && { fontStyle: shape.fontStyle }),
      };
      
      await canvasService.createShape(newShape, currentUser.uid);
      setSelectedId(newShape.id); // Auto-select duplicated shape
      
      // Record action for undo
      recordAction({
        type: 'create',
        shapes: [newShape],
        timestamp: Date.now(),
      });
      
      console.log('🔄 Shape duplicated:', shape.type);
      return newShape.id;
    } catch (error) {
      console.error('Error duplicating shape:', error);
      return null;
    }
  };
  
  // ============= END COPY/PASTE SYSTEM =============
  
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
    fitToScreen,
    handleWheel,
    handleDragEnd,
    constrainPosition,
    // Shape operations
    addShape,
    addShapesOptimistic,
    addShapesBatch,
    updateShape,
    updateShapesOptimistic,
    updateShapesBatch,
    deleteShape,
    deleteShapesOptimistic,
    deleteShapesBatch,
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
    // Grid visibility
    gridVisible,
    setGridVisible,
    // Current color for new shapes
    currentColor,
    setCurrentColor,
    // Undo/Redo
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undoStack,
    redoStack,
    recordAction,
    startActionBatch,
    startAIBatch,
    endAIBatch,
    // Copy/Paste
    clipboard,
    copyShape,
    pasteShape,
    duplicateShape,
    hasCopiedShape: clipboard !== null,
    // Comment mode
    commentMode,
    setCommentMode,
  };
  
  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
}

