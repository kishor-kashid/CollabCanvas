// Canvas Management Service - Multi-canvas CRUD and sharing operations

import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { generateUniqueShareCode } from '../utils/shareCodeGenerator';

const CANVASES_COLLECTION = 'canvases';
const USER_CANVASES_COLLECTION = 'userCanvases';
const SHARE_CODES_COLLECTION = 'shareCodes';
const CANVAS_DATA_COLLECTION = 'canvas';

/**
 * Create a new canvas
 * @param {string} userId - Owner's user ID
 * @param {string} canvasName - Canvas name
 * @param {Object} settings - Canvas settings (optional)
 * @returns {Promise<Object>} Created canvas object with ID
 */
export async function createCanvas(userId, canvasName, userName, settings = {}) {
  try {
    const canvasId = `canvas_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    // Check if share code is unique
    const checkCodeUnique = async (code) => {
      const codeDoc = await getDoc(doc(db, SHARE_CODES_COLLECTION, code));
      return !codeDoc.exists();
    };
    
    // Generate unique share code
    const shareCode = await generateUniqueShareCode(checkCodeUnique);
    
    const now = Date.now();
    const canvasData = {
      id: canvasId,
      name: canvasName || 'Untitled Canvas',
      ownerId: userId,
      ownerName: userName || 'Unknown',
      createdAt: now,
      updatedAt: now,
      shareCode,
      thumbnail: null,
      settings: {
        width: settings.width || 40000,
        height: settings.height || 20000,
        backgroundColor: settings.backgroundColor || '#ffffff',
        ...settings,
      },
      collaborators: [],
      lastAccessedBy: {
        [userId]: now,
      },
    };
    
    // Batch write: canvas metadata + share code + user canvas index + canvas data
    const batch = writeBatch(db);
    
    // 1. Create canvas metadata
    batch.set(doc(db, CANVASES_COLLECTION, canvasId), canvasData);
    
    // 2. Create share code mapping
    batch.set(doc(db, SHARE_CODES_COLLECTION, shareCode), {
      shareCode,
      canvasId,
      createdAt: now,
      expiresAt: null,
      usageCount: 0,
    });
    
    // 3. Initialize empty canvas data
    batch.set(doc(db, CANVAS_DATA_COLLECTION, canvasId), {
      canvasId,
      shapes: [],
      lastUpdated: serverTimestamp(),
    });
    
    // 4. Add to user's canvas index
    const userCanvasesRef = doc(db, USER_CANVASES_COLLECTION, userId);
    const userCanvasesDoc = await getDoc(userCanvasesRef);
    
    if (userCanvasesDoc.exists()) {
      batch.update(userCanvasesRef, {
        ownedCanvases: arrayUnion({
          canvasId,
          name: canvasData.name,
          lastAccessed: now,
          thumbnail: null,
        }),
      });
    } else {
      batch.set(userCanvasesRef, {
        userId,
        ownedCanvases: [{
          canvasId,
          name: canvasData.name,
          lastAccessed: now,
          thumbnail: null,
        }],
        sharedCanvases: [],
      });
    }
    
    await batch.commit();
    
    return canvasData;
  } catch (error) {
    console.error('❌ Error creating canvas:', error);
    throw error;
  }
}

/**
 * Get canvas by ID
 * @param {string} canvasId - Canvas ID
 * @returns {Promise<Object>} Canvas object
 */
export async function getCanvas(canvasId) {
  try {
    const canvasDoc = await getDoc(doc(db, CANVASES_COLLECTION, canvasId));
    
    if (!canvasDoc.exists()) {
      throw new Error('Canvas not found');
    }
    
    return {
      id: canvasDoc.id,
      ...canvasDoc.data(),
    };
  } catch (error) {
    console.error('❌ Error getting canvas:', error);
    throw error;
  }
}

/**
 * Update canvas metadata
 * @param {string} canvasId - Canvas ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export async function updateCanvas(canvasId, updates) {
  try {
    const canvasRef = doc(db, CANVASES_COLLECTION, canvasId);
    await updateDoc(canvasRef, {
      ...updates,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('❌ Error updating canvas:', error);
    throw error;
  }
}

/**
 * Delete canvas (owner only)
 * @param {string} canvasId - Canvas ID
 * @param {string} userId - User ID (must be owner)
 * @returns {Promise<void>}
 */
export async function deleteCanvas(canvasId, userId) {
  try {
    // Get canvas to verify ownership
    const canvas = await getCanvas(canvasId);
    
    if (canvas.ownerId !== userId) {
      throw new Error('Only the owner can delete this canvas');
    }
    
    // Batch delete: canvas metadata, share code, canvas data, user indexes
    const batch = writeBatch(db);
    
    // 1. Delete canvas metadata
    batch.delete(doc(db, CANVASES_COLLECTION, canvasId));
    
    // 2. Delete share code
    if (canvas.shareCode) {
      batch.delete(doc(db, SHARE_CODES_COLLECTION, canvas.shareCode));
    }
    
    // 3. Delete canvas data
    batch.delete(doc(db, CANVAS_DATA_COLLECTION, canvasId));
    
    // 4. Remove from owner's canvas index
    const ownerCanvasesRef = doc(db, USER_CANVASES_COLLECTION, canvas.ownerId);
    const ownerDoc = await getDoc(ownerCanvasesRef);
    if (ownerDoc.exists()) {
      const ownedCanvases = ownerDoc.data().ownedCanvases || [];
      const updatedCanvases = ownedCanvases.filter(c => c.canvasId !== canvasId);
      batch.update(ownerCanvasesRef, { ownedCanvases: updatedCanvases });
    }
    
    // 5. Remove from all collaborators' shared canvas indexes
    for (const collaboratorId of canvas.collaborators || []) {
      const collabRef = doc(db, USER_CANVASES_COLLECTION, collaboratorId);
      const collabDoc = await getDoc(collabRef);
      if (collabDoc.exists()) {
        const sharedCanvases = collabDoc.data().sharedCanvases || [];
        const updatedShared = sharedCanvases.filter(c => c.canvasId !== canvasId);
        batch.update(collabRef, { sharedCanvases: updatedShared });
      }
    }
    
    await batch.commit();
  } catch (error) {
    console.error('❌ Error deleting canvas:', error);
    throw error;
  }
}

/**
 * Get all canvases owned by user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of owned canvases
 */
export async function getUserCanvases(userId) {
  try {
    const userCanvasesDoc = await getDoc(doc(db, USER_CANVASES_COLLECTION, userId));
    
    if (!userCanvasesDoc.exists()) {
      return [];
    }
    
    return userCanvasesDoc.data().ownedCanvases || [];
  } catch (error) {
    console.error('❌ Error getting user canvases:', error);
    throw error;
  }
}

/**
 * Get all canvases shared with user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of shared canvases
 */
export async function getSharedCanvases(userId) {
  try {
    const userCanvasesDoc = await getDoc(doc(db, USER_CANVASES_COLLECTION, userId));
    
    if (!userCanvasesDoc.exists()) {
      return [];
    }
    
    return userCanvasesDoc.data().sharedCanvases || [];
  } catch (error) {
    console.error('❌ Error getting shared canvases:', error);
    throw error;
  }
}

/**
 * Validate share code and get canvas
 * @param {string} shareCode - 6-character share code
 * @returns {Promise<Object>} Canvas object
 */
export async function validateShareCode(shareCode) {
  try {
    const codeDoc = await getDoc(doc(db, SHARE_CODES_COLLECTION, shareCode.toUpperCase()));
    
    if (!codeDoc.exists()) {
      throw new Error('Invalid share code');
    }
    
    const { canvasId } = codeDoc.data();
    return await getCanvas(canvasId);
  } catch (error) {
    console.error('❌ Error validating share code:', error);
    throw error;
  }
}

/**
 * Join canvas by share code
 * @param {string} shareCode - 6-character share code
 * @param {string} userId - User ID
 * @param {string} userName - User display name
 * @returns {Promise<Object>} Joined canvas object
 */
export async function joinCanvasByShareCode(shareCode, userId, userName) {
  try {
    const canvas = await validateShareCode(shareCode);
    
    // Check if user is already owner or collaborator
    if (canvas.ownerId === userId) {
      throw new Error('You already own this canvas');
    }
    
    if (canvas.collaborators.includes(userId)) {
      throw new Error('You are already a collaborator on this canvas');
    }
    
    const now = Date.now();
    
    // Batch update: add collaborator + update user index + increment usage count
    const batch = writeBatch(db);
    
    // 1. Add user to canvas collaborators
    const canvasRef = doc(db, CANVASES_COLLECTION, canvas.id);
    batch.update(canvasRef, {
      collaborators: arrayUnion(userId),
      [`lastAccessedBy.${userId}`]: now,
    });
    
    // 2. Add canvas to user's shared canvases
    const userCanvasesRef = doc(db, USER_CANVASES_COLLECTION, userId);
    const userCanvasesDoc = await getDoc(userCanvasesRef);
    
    const sharedCanvasEntry = {
      canvasId: canvas.id,
      name: canvas.name,
      ownerId: canvas.ownerId,
      ownerName: canvas.ownerName,
      joinedAt: now,
      lastAccessed: now,
    };
    
    if (userCanvasesDoc.exists()) {
      batch.update(userCanvasesRef, {
        sharedCanvases: arrayUnion(sharedCanvasEntry),
      });
    } else {
      batch.set(userCanvasesRef, {
        userId,
        ownedCanvases: [],
        sharedCanvases: [sharedCanvasEntry],
      });
    }
    
    // 3. Increment share code usage count
    const shareCodeRef = doc(db, SHARE_CODES_COLLECTION, shareCode.toUpperCase());
    batch.update(shareCodeRef, {
      usageCount: (await getDoc(shareCodeRef)).data().usageCount + 1,
    });
    
    await batch.commit();
    
    return canvas;
  } catch (error) {
    console.error('❌ Error joining canvas:', error);
    throw error;
  }
}

/**
 * Generate new share code for canvas (revoke old one)
 * @param {string} canvasId - Canvas ID
 * @param {string} userId - User ID (must be owner)
 * @returns {Promise<string>} New share code
 */
export async function regenerateShareCode(canvasId, userId) {
  try {
    const canvas = await getCanvas(canvasId);
    
    if (canvas.ownerId !== userId) {
      throw new Error('Only the owner can regenerate share code');
    }
    
    // Check if code is unique
    const checkCodeUnique = async (code) => {
      const codeDoc = await getDoc(doc(db, SHARE_CODES_COLLECTION, code));
      return !codeDoc.exists();
    };
    
    // Generate new unique code
    const newShareCode = await generateUniqueShareCode(checkCodeUnique);
    
    const batch = writeBatch(db);
    
    // 1. Delete old share code
    if (canvas.shareCode) {
      batch.delete(doc(db, SHARE_CODES_COLLECTION, canvas.shareCode));
    }
    
    // 2. Create new share code
    batch.set(doc(db, SHARE_CODES_COLLECTION, newShareCode), {
      shareCode: newShareCode,
      canvasId,
      createdAt: Date.now(),
      expiresAt: null,
      usageCount: 0,
    });
    
    // 3. Update canvas with new code
    batch.update(doc(db, CANVASES_COLLECTION, canvasId), {
      shareCode: newShareCode,
      updatedAt: Date.now(),
    });
    
    await batch.commit();
    
    return newShareCode;
  } catch (error) {
    console.error('❌ Error regenerating share code:', error);
    throw error;
  }
}

/**
 * Remove collaborator from canvas
 * @param {string} canvasId - Canvas ID
 * @param {string} collaboratorId - Collaborator user ID to remove
 * @param {string} ownerId - Owner user ID
 * @returns {Promise<void>}
 */
export async function removeCollaborator(canvasId, collaboratorId, ownerId) {
  try {
    const canvas = await getCanvas(canvasId);
    
    if (canvas.ownerId !== ownerId) {
      throw new Error('Only the owner can remove collaborators');
    }
    
    const batch = writeBatch(db);
    
    // 1. Remove from canvas collaborators
    batch.update(doc(db, CANVASES_COLLECTION, canvasId), {
      collaborators: arrayRemove(collaboratorId),
    });
    
    // 2. Remove from user's shared canvases
    const userCanvasesRef = doc(db, USER_CANVASES_COLLECTION, collaboratorId);
    const userDoc = await getDoc(userCanvasesRef);
    if (userDoc.exists()) {
      const sharedCanvases = userDoc.data().sharedCanvases || [];
      const updatedShared = sharedCanvases.filter(c => c.canvasId !== canvasId);
      batch.update(userCanvasesRef, { sharedCanvases: updatedShared });
    }
    
    await batch.commit();
  } catch (error) {
    console.error('❌ Error removing collaborator:', error);
    throw error;
  }
}

/**
 * Update last accessed timestamp
 * @param {string} canvasId - Canvas ID
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function updateLastAccessed(canvasId, userId) {
  try {
    const now = Date.now();
    
    // Update canvas metadata
    await updateDoc(doc(db, CANVASES_COLLECTION, canvasId), {
      [`lastAccessedBy.${userId}`]: now,
    });
    
    // Update user canvas index
    const userCanvasesRef = doc(db, USER_CANVASES_COLLECTION, userId);
    const userDoc = await getDoc(userCanvasesRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      
      // Update in owned canvases
      const ownedCanvases = (data.ownedCanvases || []).map(c =>
        c.canvasId === canvasId ? { ...c, lastAccessed: now } : c
      );
      
      // Update in shared canvases
      const sharedCanvases = (data.sharedCanvases || []).map(c =>
        c.canvasId === canvasId ? { ...c, lastAccessed: now } : c
      );
      
      await updateDoc(userCanvasesRef, {
        ownedCanvases,
        sharedCanvases,
      });
    }
  } catch (error) {
    console.error('❌ Error updating last accessed:', error);
    // Don't throw - this is not critical
  }
}

export default {
  createCanvas,
  getCanvas,
  updateCanvas,
  deleteCanvas,
  getUserCanvases,
  getSharedCanvases,
  validateShareCode,
  joinCanvasByShareCode,
  regenerateShareCode,
  removeCollaborator,
  updateLastAccessed,
};

