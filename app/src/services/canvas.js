// Canvas Service - Real-time shape synchronization with Firestore

import { db } from './firebase';
import {
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { CANVAS_ID, CANVAS_COLLECTION, LOCK_TIMEOUT_MS } from '../utils/constants';

/**
 * Initialize canvas document if it doesn't exist
 */
async function initializeCanvas() {
  const canvasRef = doc(db, CANVAS_COLLECTION, CANVAS_ID);
  const canvasDoc = await getDoc(canvasRef);
  
  if (!canvasDoc.exists()) {
    await setDoc(canvasRef, {
      canvasId: CANVAS_ID,
      shapes: [],
      lastUpdated: serverTimestamp(),
    });
  }
}

/**
 * Subscribe to real-time shape updates from Firestore
 * @param {function} callback - Callback function to handle shape updates
 * @returns {function} Unsubscribe function
 */
export function subscribeToShapes(callback) {
  const canvasRef = doc(db, CANVAS_COLLECTION, CANVAS_ID);
  
  // Initialize canvas if needed
  initializeCanvas().catch(console.error);
  
  const unsubscribe = onSnapshot(canvasRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      callback(data.shapes || []);
    } else {
      callback([]);
    }
  }, (error) => {
    console.error('Error subscribing to shapes:', error);
    callback([]);
  });
  
  return unsubscribe;
}

/**
 * Get current shapes from Firestore
 * @returns {Promise<Array>} Array of shapes
 */
async function getCurrentShapes() {
  const canvasRef = doc(db, CANVAS_COLLECTION, CANVAS_ID);
  const canvasDoc = await getDoc(canvasRef);
  
  if (canvasDoc.exists()) {
    const data = canvasDoc.data();
    return data.shapes || [];
  }
  return [];
}

/**
 * Create a new shape on the canvas
 * @param {object} shapeData - Shape properties (id, type, x, y, width, height, fill)
 * @param {string} userId - ID of user creating the shape
 * @returns {Promise<void>}
 */
export async function createShape(shapeData, userId) {
  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, CANVAS_ID);
    const shapes = await getCurrentShapes();
    
    const newShape = {
      ...shapeData,
      createdBy: userId,
      createdAt: Date.now(),
      lastModifiedBy: userId,
      lastModifiedAt: Date.now(),
      isLocked: false,
      lockedBy: null,
      visible: true, // Default: visible
      layerLocked: false, // Default: unlocked
    };
    
    await updateDoc(canvasRef, {
      shapes: [...shapes, newShape],
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating shape:', error);
    throw error;
  }
}

/**
 * Update an existing shape
 * @param {string} shapeId - Shape ID to update
 * @param {object} updates - Properties to update
 * @param {string} userId - ID of user making the update
 * @returns {Promise<void>}
 */
export async function updateShape(shapeId, updates, userId) {
  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, CANVAS_ID);
    const shapes = await getCurrentShapes();
    
    const updatedShapes = shapes.map(shape => {
      if (shape.id === shapeId) {
        return {
          ...shape,
          ...updates,
          lastModifiedBy: userId,
          lastModifiedAt: Date.now(),
        };
      }
      return shape;
    });
    
    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating shape:', error);
    throw error;
  }
}

/**
 * Delete a shape from the canvas
 * @param {string} shapeId - Shape ID to delete
 * @returns {Promise<void>}
 */
export async function deleteShape(shapeId) {
  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, CANVAS_ID);
    const shapes = await getCurrentShapes();
    
    const filteredShapes = shapes.filter(shape => shape.id !== shapeId);
    
    await updateDoc(canvasRef, {
      shapes: filteredShapes,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error deleting shape:', error);
    throw error;
  }
}

/**
 * Lock a shape for editing
 * @param {string} shapeId - Shape ID to lock
 * @param {string} userId - ID of user locking the shape
 * @returns {Promise<boolean>} True if lock acquired, false if already locked
 */
export async function lockShape(shapeId, userId) {
  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, CANVAS_ID);
    const shapes = await getCurrentShapes();
    
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) {
      throw new Error('Shape not found');
    }
    
    // Check if already locked by another user
    if (shape.isLocked && shape.lockedBy !== userId) {
      // Check if lock has timed out
      const lockAge = Date.now() - (shape.lockStartTime || 0);
      if (lockAge < LOCK_TIMEOUT_MS) {
        return false; // Lock still active
      }
    }
    
    const updatedShapes = shapes.map(s => {
      if (s.id === shapeId) {
        return {
          ...s,
          isLocked: true,
          lockedBy: userId,
          lockStartTime: Date.now(),
        };
      }
      return s;
    });
    
    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
    });
    
    return true;
  } catch (error) {
    console.error('Error locking shape:', error);
    throw error;
  }
}

/**
 * Unlock a shape
 * @param {string} shapeId - Shape ID to unlock
 * @param {string} userId - ID of user unlocking (must own the lock)
 * @returns {Promise<void>}
 */
export async function unlockShape(shapeId, userId) {
  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, CANVAS_ID);
    const shapes = await getCurrentShapes();
    
    const updatedShapes = shapes.map(s => {
      if (s.id === shapeId && (s.lockedBy === userId || !userId)) {
        return {
          ...s,
          isLocked: false,
          lockedBy: null,
          lockStartTime: null,
        };
      }
      return s;
    });
    
    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error unlocking shape:', error);
    throw error;
  }
}

/**
 * Auto-release stale locks (called periodically)
 * @returns {Promise<void>}
 */
export async function releaseStaleLocks() {
  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, CANVAS_ID);
    const shapes = await getCurrentShapes();
    
    const now = Date.now();
    let hasChanges = false;
    
    const updatedShapes = shapes.map(shape => {
      if (shape.isLocked && shape.lockStartTime) {
        const lockAge = now - shape.lockStartTime;
        if (lockAge > LOCK_TIMEOUT_MS) {
          hasChanges = true;
          return {
            ...shape,
            isLocked: false,
            lockedBy: null,
            lockStartTime: null,
          };
        }
      }
      return shape;
    });
    
    if (hasChanges) {
      await updateDoc(canvasRef, {
        shapes: updatedShapes,
        lastUpdated: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error releasing stale locks:', error);
  }
}

// ============================================================================
// Z-INDEX MANAGEMENT (Layer Ordering)
// ============================================================================

/**
 * Reorder shapes array (for z-index management)
 * Lower array index = back/bottom layer
 * Higher array index = front/top layer
 * @param {Array} newShapesOrder - New array of shapes in desired order
 * @returns {Promise<void>}
 */
export async function reorderShapes(newShapesOrder) {
  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, CANVAS_ID);
    
    await updateDoc(canvasRef, {
      shapes: newShapesOrder,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error reordering shapes:', error);
    throw error;
  }
}

/**
 * Bring shape to front (highest z-index)
 * Moves the shape to the end of the array so it renders last (on top)
 * @param {string} shapeId - Shape ID to bring to front
 * @returns {Promise<void>}
 */
export async function bringToFront(shapeId) {
  try {
    const shapes = await getCurrentShapes();
    const shapeIndex = shapes.findIndex(s => s.id === shapeId);
    
    if (shapeIndex === -1) {
      throw new Error('Shape not found');
    }
    
    // Already at front
    if (shapeIndex === shapes.length - 1) {
      return;
    }
    
    // Remove shape from current position and add to end (front)
    const shape = shapes[shapeIndex];
    const newShapes = shapes.filter((_, i) => i !== shapeIndex);
    newShapes.push(shape);
    
    await reorderShapes(newShapes);
  } catch (error) {
    console.error('Error bringing to front:', error);
    throw error;
  }
}

/**
 * Send shape to back (lowest z-index)
 * Moves the shape to the start of the array so it renders first (behind all others)
 * @param {string} shapeId - Shape ID to send to back
 * @returns {Promise<void>}
 */
export async function sendToBack(shapeId) {
  try {
    const shapes = await getCurrentShapes();
    const shapeIndex = shapes.findIndex(s => s.id === shapeId);
    
    if (shapeIndex === -1) {
      throw new Error('Shape not found');
    }
    
    // Already at back
    if (shapeIndex === 0) {
      return;
    }
    
    // Remove shape from current position and add to start (back)
    const shape = shapes[shapeIndex];
    const newShapes = shapes.filter((_, i) => i !== shapeIndex);
    newShapes.unshift(shape);
    
    await reorderShapes(newShapes);
  } catch (error) {
    console.error('Error sending to back:', error);
    throw error;
  }
}

/**
 * Bring shape forward one level
 * Swaps with the shape above it in the z-order
 * @param {string} shapeId - Shape ID to bring forward
 * @returns {Promise<void>}
 */
export async function bringForward(shapeId) {
  try {
    const shapes = await getCurrentShapes();
    const shapeIndex = shapes.findIndex(s => s.id === shapeId);
    
    if (shapeIndex === -1) {
      return;
    }
    
    // Already at front
    if (shapeIndex === shapes.length - 1) {
      return;
    }
    
    // Swap with next shape (one level up)
    const newShapes = [...shapes];
    [newShapes[shapeIndex], newShapes[shapeIndex + 1]] = 
      [newShapes[shapeIndex + 1], newShapes[shapeIndex]];
    
    await reorderShapes(newShapes);
  } catch (error) {
    console.error('Error bringing forward:', error);
    throw error;
  }
}

/**
 * Send shape backward one level
 * Swaps with the shape below it in the z-order
 * @param {string} shapeId - Shape ID to send backward
 * @returns {Promise<void>}
 */
export async function sendBackward(shapeId) {
  try {
    const shapes = await getCurrentShapes();
    const shapeIndex = shapes.findIndex(s => s.id === shapeId);
    
    if (shapeIndex === -1) {
      return;
    }
    
    // Already at back
    if (shapeIndex === 0) {
      return;
    }
    
    // Swap with previous shape (one level down)
    const newShapes = [...shapes];
    [newShapes[shapeIndex], newShapes[shapeIndex - 1]] = 
      [newShapes[shapeIndex - 1], newShapes[shapeIndex]];
    
    await reorderShapes(newShapes);
  } catch (error) {
    console.error('Error sending backward:', error);
    throw error;
  }
}

// ============================================================================
// LAYER VISIBILITY & LOCKING
// ============================================================================

/**
 * Toggle visibility of a shape
 * @param {string} shapeId - Shape ID to toggle
 * @param {boolean} visible - New visibility state
 * @returns {Promise<void>}
 */
export async function toggleShapeVisibility(shapeId, visible) {
  try {
    const shapes = await getCurrentShapes();
    const updatedShapes = shapes.map(shape =>
      shape.id === shapeId
        ? { ...shape, visible, lastModifiedAt: Date.now() }
        : shape
    );
    
    const canvasRef = doc(db, CANVAS_COLLECTION, CANVAS_ID);
    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
    });
    
    console.log(`✅ Shape ${shapeId} visibility: ${visible}`);
  } catch (error) {
    console.error('❌ Error toggling visibility:', error);
    throw error;
  }
}

/**
 * Toggle layer lock state of a shape (prevents all editing)
 * @param {string} shapeId - Shape ID to toggle
 * @param {boolean} locked - New lock state
 * @param {string} userId - User making the change
 * @returns {Promise<void>}
 */
export async function toggleLayerLock(shapeId, locked, userId) {
  try {
    const shapes = await getCurrentShapes();
    const updatedShapes = shapes.map(shape =>
      shape.id === shapeId
        ? { 
            ...shape, 
            layerLocked: locked,
            layerLockedBy: locked ? userId : null,
            lastModifiedAt: Date.now() 
          }
        : shape
    );
    
    const canvasRef = doc(db, CANVAS_COLLECTION, CANVAS_ID);
    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
    });
    
    console.log(`✅ Shape ${shapeId} layer lock: ${locked}`);
  } catch (error) {
    console.error('❌ Error toggling layer lock:', error);
    throw error;
  }
}

