// AuthContext - Authentication state and methods provider

import { createContext, useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import * as authService from '../services/auth';
import { removeUserSession } from '../services/cursors';

export const AuthContext = createContext(null);

/**
 * AuthProvider component that wraps the app and provides authentication context
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔐 Auth state changed:', user ? user.uid : 'null');
      
      // If user logged out, clean up their session
      if (!user && currentUser) {
        console.log('🧹 User logged out, cleaning up session for:', currentUser.uid);
        removeUserSession(currentUser.uid).catch(err => {
          console.error('Failed to cleanup session:', err);
        });
      }
      
      setCurrentUser(user);
      setLoading(false);
    });
    
    return unsubscribe;
  }, [currentUser]);
  
  // Sign up with email and password
  const signup = async (email, password, displayName) => {
    try {
      setError(null);
      await authService.signUp(email, password, displayName);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  // Sign in with email and password
  const login = async (email, password) => {
    try {
      setError(null);
      await authService.signIn(email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  // Sign in with Google
  const loginWithGoogle = async () => {
    try {
      setError(null);
      await authService.signInWithGoogle();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  // Sign out
  const logout = async () => {
    try {
      setError(null);
      
      // Clean up user session before signing out
      if (currentUser) {
        console.log('🧹 Cleaning up session before logout for:', currentUser.uid);
        await removeUserSession(currentUser.uid);
      }
      
      await authService.signOut();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  const value = {
    currentUser,
    loading,
    error,
    signup,
    login,
    loginWithGoogle,
    logout,
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

