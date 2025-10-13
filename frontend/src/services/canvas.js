// Canvas Service - To be implemented in PR #5
// Functions: subscribeToShapes, createShape, updateShape, deleteShape, lockShape, unlockShape

import { db } from './firebase';
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from 'firebase/firestore';

const CANVAS_ID = 'global-canvas-v1';
const CANVAS_COLLECTION = 'canvas';

/**
 * Subscribe to real-time shape updates from Firestore
 * @param {function} callback - Callback function to handle shape updates
 * @returns {function} Unsubscribe function
 */
export function subscribeToShapes(callback) {
  const canvasRef = doc(db, CANVAS_COLLECTION, CANVAS_ID);
  
  const unsubscribe = onSnapshot(canvasRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      callback(data.shapes || []);
    } else {
      callback([]);
    }
  });
  
  return unsubscribe;
}

/**
 * Create a new shape on the canvas
 * @param {object} shapeData - Shape properties (type, x, y, width, height, etc.)
 * @param {string} userId - ID of user creating the shape
 * @returns {Promise<void>}
 */
export async function createShape(shapeData, userId) {
  // To be implemented in PR #5
  console.log('Create shape:', shapeData, userId);
}

/**
 * Update an existing shape
 * @param {string} shapeId - Shape ID to update
 * @param {object} updates - Properties to update
 * @param {string} userId - ID of user making the update
 * @returns {Promise<void>}
 */
export async function updateShape(shapeId, updates, userId) {
  // To be implemented in PR #5
  console.log('Update shape:', shapeId, updates, userId);
}

/**
 * Delete a shape from the canvas
 * @param {string} shapeId - Shape ID to delete
 * @returns {Promise<void>}
 */
export async function deleteShape(shapeId) {
  // To be implemented in PR #5
  console.log('Delete shape:', shapeId);
}

/**
 * Lock a shape for editing
 * @param {string} shapeId - Shape ID to lock
 * @param {string} userId - ID of user locking the shape
 * @returns {Promise<void>}
 */
export async function lockShape(shapeId, userId) {
  // To be implemented in PR #5
  console.log('Lock shape:', shapeId, userId);
}

/**
 * Unlock a shape
 * @param {string} shapeId - Shape ID to unlock
 * @returns {Promise<void>}
 */
export async function unlockShape(shapeId) {
  // To be implemented in PR #5
  console.log('Unlock shape:', shapeId);
}

