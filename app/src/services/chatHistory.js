// Chat History Service - Manage AI chat persistence in Firestore

import {
  collection,
  addDoc,
  query,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Save a chat message to Firestore
 * @param {string} userId - User ID
 * @param {object} message - Message object
 * @returns {Promise<string>} Message ID
 */
export const saveMessage = async (userId, message) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const messagesRef = collection(db, 'chatHistory', userId, 'messages');
    
    const messageData = {
      userId,
      role: message.role,
      content: message.content || '',
      timestamp: serverTimestamp(),
      functionCalls: message.functionCalls || [],
      isError: message.isError || false,
    };

    const docRef = await addDoc(messagesRef, messageData);
    return docRef.id;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};

/**
 * Load chat messages for a user
 * @param {string} userId - User ID
 * @param {number} limit - Max number of messages to load (default 50)
 * @returns {Promise<Array>} Array of messages
 */
export const loadMessages = async (userId, limit = 50) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const messagesRef = collection(db, 'chatHistory', userId, 'messages');
    const q = query(
      messagesRef,
      orderBy('timestamp', 'asc'),
      firestoreLimit(limit)
    );

    const querySnapshot = await getDocs(q);
    const messages = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toMillis() || Date.now(),
      });
    });

    return messages;
  } catch (error) {
    console.error('Error loading messages:', error);
    throw error;
  }
};

/**
 * Clear all chat history for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of deleted messages
 */
export const clearHistory = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const messagesRef = collection(db, 'chatHistory', userId, 'messages');
    const q = query(messagesRef);
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return 0;
    }

    // Use batch delete for efficiency
    const batch = writeBatch(db);
    querySnapshot.forEach((document) => {
      batch.delete(document.ref);
    });

    await batch.commit();
    return querySnapshot.size;
  } catch (error) {
    console.error('Error clearing history:', error);
    throw error;
  }
};

/**
 * Delete a single message
 * @param {string} userId - User ID
 * @param {string} messageId - Message ID to delete
 * @returns {Promise<void>}
 */
export const deleteMessage = async (userId, messageId) => {
  try {
    if (!userId || !messageId) {
      throw new Error('User ID and Message ID are required');
    }

    const messageRef = doc(db, 'chatHistory', userId, 'messages', messageId);
    await deleteDoc(messageRef);
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

/**
 * Get the number of messages in chat history
 * @param {string} userId - User ID
 * @returns {Promise<number>} Message count
 */
export const getMessageCount = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const messagesRef = collection(db, 'chatHistory', userId, 'messages');
    const querySnapshot = await getDocs(messagesRef);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting message count:', error);
    return 0;
  }
};

