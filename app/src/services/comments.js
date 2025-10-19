// comments.js - Comment operations with Firestore

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
import { CANVAS_ID } from '../utils/constants';

const COMMENTS_COLLECTION = 'comments';

/**
 * Create a new comment
 * @param {Object} commentData - Comment data
 * @param {Object} user - Current user object
 * @returns {string} Comment ID
 */
export async function createComment(commentData, user) {
  try {
    const newComment = {
      ...commentData,
      authorId: user.uid,
      authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
      authorEmail: user.email,
      canvasId: CANVAS_ID,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isResolved: false,
      resolvedBy: null,
      resolvedAt: null,
    };
    
    const docRef = await addDoc(collection(db, COMMENTS_COLLECTION), newComment);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating comment:', error);
    throw error;
  }
}

/**
 * Update a comment (for editing text)
 * @param {string} commentId - Comment ID
 * @param {Object} updates - Updates to apply
 */
export async function updateComment(commentId, updates) {
  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    await updateDoc(commentRef, {
      ...updates,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('❌ Error updating comment:', error);
    throw error;
  }
}

/**
 * Resolve/unresolve a comment
 * @param {string} commentId - Comment ID
 * @param {boolean} isResolved - Resolved state
 * @param {string} userId - User ID performing the action
 */
export async function toggleResolveComment(commentId, isResolved, userId) {
  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    await updateDoc(commentRef, {
      isResolved,
      resolvedBy: isResolved ? userId : null,
      resolvedAt: isResolved ? Date.now() : null,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('❌ Error toggling comment resolution:', error);
    throw error;
  }
}

/**
 * Delete a comment
 * @param {string} commentId - Comment ID
 */
export async function deleteComment(commentId) {
  try {
    await deleteDoc(doc(db, COMMENTS_COLLECTION, commentId));
  } catch (error) {
    console.error('❌ Error deleting comment:', error);
    throw error;
  }
}

/**
 * Delete all comments associated with a shape
 * @param {string} shapeId - Shape ID
 * @returns {Promise<number>} Number of comments deleted
 */
export async function deleteCommentsByShapeId(shapeId) {
  try {
    const q = query(
      collection(db, COMMENTS_COLLECTION),
      where('canvasId', '==', CANVAS_ID),
      where('shapeId', '==', shapeId)
    );
    
    const snapshot = await getDocs(q);
    
    // Delete all comments and their replies
    const deletePromises = snapshot.docs.map(docSnapshot => 
      deleteDoc(docSnapshot.ref)
    );
    
    await Promise.all(deletePromises);
    
    console.log(`🗑️ Deleted ${snapshot.docs.length} comment(s) for shape ${shapeId}`);
    return snapshot.docs.length;
  } catch (error) {
    console.error('❌ Error deleting comments by shapeId:', error);
    throw error;
  }
}

/**
 * Subscribe to comments for current canvas
 * @param {Function} callback - Callback function to receive comments
 * @returns {Function} Unsubscribe function
 */
export function subscribeToComments(callback) {
  const q = query(
    collection(db, COMMENTS_COLLECTION),
    where('canvasId', '==', CANVAS_ID),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(comments);
  });
}

