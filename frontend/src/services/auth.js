// Auth Service - To be implemented in PR #2
// Functions: signUp, signIn, signInWithGoogle, signOut, updateUserProfile

import { auth } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';

/**
 * Sign up a new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} displayName - User display name (optional, will use email prefix if not provided)
 * @returns {Promise<object>} User credential
 */
export async function signUp(email, password, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Set display name (use provided name or extract from email)
    const name = displayName || email.split('@')[0];
    await updateProfile(userCredential.user, {
      displayName: name.substring(0, 20), // Truncate to 20 chars max
    });
    
    return userCredential;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}

/**
 * Sign in existing user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} User credential
 */
export async function signIn(email, password) {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

/**
 * Sign in with Google OAuth
 * @returns {Promise<object>} User credential
 */
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Truncate display name if too long
    if (result.user.displayName && result.user.displayName.length > 20) {
      await updateProfile(result.user, {
        displayName: result.user.displayName.substring(0, 20),
      });
    }
    
    return result;
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
}

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
export async function signOut() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Update user profile information
 * @param {string} displayName - New display name
 * @returns {Promise<void>}
 */
export async function updateUserProfile(displayName) {
  try {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: displayName.substring(0, 20),
      });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
}

