// aiTasks.js - AI Task operations with Firestore

import { db } from './firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDocs,
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';

const AI_TASKS_COLLECTION = 'ai_tasks';

/**
 * Create a new AI task
 * @param {string} canvasId - Canvas ID
 * @param {Object} taskData - Task data
 * @param {Object} user - Current user object
 * @returns {string} Task ID
 */
export async function createAITask(canvasId, taskData, user) {
  try {
    if (!canvasId) {
      throw new Error('Canvas ID is required');
    }
    
    const newTask = {
      ...taskData,
      authorId: user.uid,
      authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
      authorEmail: user.email,
      canvasId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'pending', // 'pending', 'completed', 'failed'
      executedAt: null,
      result: null,
      priority: taskData.priority || 0,
    };
    
    const docRef = await addDoc(collection(db, AI_TASKS_COLLECTION), newTask);
    console.log('✅ Created AI task:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating AI task:', error);
    throw error;
  }
}

/**
 * Update an AI task
 * @param {string} taskId - Task ID
 * @param {Object} updates - Updates to apply
 */
export async function updateAITask(taskId, updates) {
  try {
    const taskRef = doc(db, AI_TASKS_COLLECTION, taskId);
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('❌ Error updating AI task:', error);
    throw error;
  }
}

/**
 * Update AI task status
 * @param {string} taskId - Task ID
 * @param {string} status - Status ('pending', 'completed', 'failed')
 * @param {string} result - Result message
 */
export async function updateAITaskStatus(taskId, status, result = null) {
  try {
    const taskRef = doc(db, AI_TASKS_COLLECTION, taskId);
    await updateDoc(taskRef, {
      status,
      result,
      executedAt: status !== 'pending' ? Date.now() : null,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('❌ Error updating AI task status:', error);
    throw error;
  }
}

/**
 * Delete an AI task
 * @param {string} taskId - Task ID
 */
export async function deleteAITask(taskId) {
  try {
    await deleteDoc(doc(db, AI_TASKS_COLLECTION, taskId));
    console.log('🗑️ Deleted AI task:', taskId);
  } catch (error) {
    console.error('❌ Error deleting AI task:', error);
    throw error;
  }
}

/**
 * Delete all AI tasks by status
 * @param {string} canvasId - Canvas ID
 * @param {string} userId - User ID
 * @param {string} status - Status to delete
 * @returns {Promise<number>} Number of tasks deleted
 */
export async function deleteAITasksByStatus(canvasId, userId, status = 'completed') {
  try {
    if (!canvasId) {
      throw new Error('Canvas ID is required');
    }
    
    const q = query(
      collection(db, AI_TASKS_COLLECTION),
      where('canvasId', '==', canvasId),
      where('authorId', '==', userId),
      where('status', '==', status)
    );
    
    const snapshot = await getDocs(q);
    
    const deletePromises = snapshot.docs.map(docSnapshot => 
      deleteDoc(docSnapshot.ref)
    );
    
    await Promise.all(deletePromises);
    
    console.log(`🗑️ Deleted ${snapshot.docs.length} ${status} AI task(s)`);
    return snapshot.docs.length;
  } catch (error) {
    console.error('❌ Error deleting AI tasks by status:', error);
    throw error;
  }
}

/**
 * Get pending AI tasks for a user on a canvas
 * @param {string} canvasId - Canvas ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of pending tasks
 */
export async function getPendingAITasks(canvasId, userId) {
  try {
    if (!canvasId) {
      throw new Error('Canvas ID is required');
    }
    
    const q = query(
      collection(db, AI_TASKS_COLLECTION),
      where('canvasId', '==', canvasId),
      where('authorId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('priority', 'desc'),
      orderBy('createdAt', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Error fetching pending AI tasks:', error);
    throw error;
  }
}

/**
 * Subscribe to AI tasks for a user on a canvas
 * @param {string} canvasId - Canvas ID
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function to receive tasks
 * @returns {Function} Unsubscribe function
 */
export function subscribeToAITasks(canvasId, userId, callback) {
  if (!userId) {
    console.warn('⚠️ Cannot subscribe to AI tasks: no userId provided');
    return () => {};
  }
  
  if (!canvasId) {
    console.error('Canvas ID is required for AI tasks subscription');
    return () => {}; // Return no-op unsubscribe
  }
  
  const q = query(
    collection(db, AI_TASKS_COLLECTION),
    where('canvasId', '==', canvasId),
    where('authorId', '==', userId),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(tasks);
  });
}

