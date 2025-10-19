// Unit Tests for AuthContext
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '../../../src/contexts/AuthContext';
import { useAuth } from '../../../src/hooks/useAuth';

// Mock Firebase auth
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
}));

// Mock auth service
vi.mock('../../../src/services/auth', () => ({
  signUp: vi.fn(),
  signIn: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
}));

// Mock cursors service
vi.mock('../../../src/services/cursors', () => ({
  removeUserSession: vi.fn(),
}));

import { onAuthStateChanged } from 'firebase/auth';
import * as authService from '../../../src/services/auth';
import { removeUserSession } from '../../../src/services/cursors';

// Test component that uses the auth context
function TestComponent() {
  const { currentUser, loading, error, signup, login, loginWithGoogle, logout } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <div data-testid="user-status">
        {currentUser ? `Logged in as ${currentUser.email}` : 'Not logged in'}
      </div>
      {error && <div data-testid="error">{error}</div>}
      <button onClick={() => signup('test@example.com', 'password123', 'Test User')}>
        Sign Up
      </button>
      <button onClick={() => login('test@example.com', 'password123')}>
        Log In
      </button>
      <button onClick={loginWithGoogle}>
        Log In with Google
      </button>
      <button onClick={logout}>
        Log Out
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('AuthProvider', () => {
    it('should render children when not loading', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null); // No user
        return vi.fn(); // Unsubscribe function
      });
      
      render(
        <AuthProvider>
          <div>Test Content</div>
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Test Content')).toBeInTheDocument();
      });
    });
    
    it('should show loading state initially', () => {
      onAuthStateChanged.mockImplementation(() => vi.fn());
      
      render(
        <AuthProvider>
          <div>Test Content</div>
        </AuthProvider>
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
    
    it('should provide current user when authenticated', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
      };
      
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return vi.fn();
      });
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as test@example.com');
      });
    });
    
    it('should provide null user when not authenticated', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return vi.fn();
      });
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
      });
    });
  });
  
  describe('signup', () => {
    it('should call signUp service with correct parameters', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return vi.fn();
      });
      
      authService.signUp.mockResolvedValue();
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Sign Up')).toBeInTheDocument();
      });
      
      const signUpButton = screen.getByText('Sign Up');
      signUpButton.click();
      
      await waitFor(() => {
        expect(authService.signUp).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');
      });
    });
  });
  
  describe('login', () => {
    it('should call signIn service with correct parameters', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return vi.fn();
      });
      
      authService.signIn.mockResolvedValue();
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Log In')).toBeInTheDocument();
      });
      
      const loginButton = screen.getByText('Log In');
      loginButton.click();
      
      await waitFor(() => {
        expect(authService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });
  });
  
  describe('loginWithGoogle', () => {
    it('should call signInWithGoogle service', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return vi.fn();
      });
      
      authService.signInWithGoogle.mockResolvedValue();
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Log In with Google')).toBeInTheDocument();
      });
      
      const googleButton = screen.getByText('Log In with Google');
      googleButton.click();
      
      await waitFor(() => {
        expect(authService.signInWithGoogle).toHaveBeenCalled();
      });
    });
  });
  
  describe('logout', () => {
    it('should call signOut when logging out', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'test@example.com',
      };
      
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return vi.fn();
      });
      
      authService.signOut.mockResolvedValue();
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Log Out')).toBeInTheDocument();
      });
      
      const logoutButton = screen.getByText('Log Out');
      logoutButton.click();
      
      await waitFor(() => {
        expect(authService.signOut).toHaveBeenCalled();
      });
    });
  });
  
  describe('auth state changes', () => {
    it('should update state when auth state changes to logged out', async () => {
      let authCallback;
      const mockUser = {
        uid: 'user123',
        email: 'test@example.com',
      };
      
      onAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback;
        callback(mockUser); // Start logged in
        return vi.fn();
      });
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as test@example.com');
      });
      
      // Simulate logout by calling the callback with null
      authCallback(null);
      
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
      });
    });
  });
});

