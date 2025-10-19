// AuthContext - Authentication state and methods provider

import { createContext, useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import * as authService from '../services/auth';

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
      setCurrentUser(user);
      setLoading(false);
      // Note: Session cleanup is handled automatically by Firebase onDisconnect
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
      // Note: Session cleanup is handled automatically by Firebase onDisconnect
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

