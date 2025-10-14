// Unit Tests for useAuth Hook
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth } from '../../../src/hooks/useAuth';
import { AuthContext } from '../../../src/contexts/AuthContext';

describe('useAuth Hook', () => {
  it('should return auth context values', () => {
    const mockContextValue = {
      currentUser: { uid: 'user123', email: 'test@example.com' },
      loading: false,
      error: null,
      signup: vi.fn(),
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    };
    
    const wrapper = ({ children }) => (
      <AuthContext.Provider value={mockContextValue}>
        {children}
      </AuthContext.Provider>
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current).toEqual(mockContextValue);
  });
  
  it('should throw error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();
    
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
    
    console.error = originalError;
  });
  
  it('should provide access to currentUser', () => {
    const mockUser = {
      uid: 'user123',
      email: 'test@example.com',
      displayName: 'Test User',
    };
    
    const mockContextValue = {
      currentUser: mockUser,
      loading: false,
      error: null,
      signup: vi.fn(),
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    };
    
    const wrapper = ({ children }) => (
      <AuthContext.Provider value={mockContextValue}>
        {children}
      </AuthContext.Provider>
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.currentUser).toEqual(mockUser);
  });
  
  it('should provide access to loading state', () => {
    const mockContextValue = {
      currentUser: null,
      loading: true,
      error: null,
      signup: vi.fn(),
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    };
    
    const wrapper = ({ children }) => (
      <AuthContext.Provider value={mockContextValue}>
        {children}
      </AuthContext.Provider>
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.loading).toBe(true);
  });
  
  it('should provide access to error state', () => {
    const mockError = 'Authentication failed';
    
    const mockContextValue = {
      currentUser: null,
      loading: false,
      error: mockError,
      signup: vi.fn(),
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    };
    
    const wrapper = ({ children }) => (
      <AuthContext.Provider value={mockContextValue}>
        {children}
      </AuthContext.Provider>
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.error).toBe(mockError);
  });
  
  it('should provide access to auth methods', () => {
    const mockSignup = vi.fn();
    const mockLogin = vi.fn();
    const mockLoginWithGoogle = vi.fn();
    const mockLogout = vi.fn();
    
    const mockContextValue = {
      currentUser: null,
      loading: false,
      error: null,
      signup: mockSignup,
      login: mockLogin,
      loginWithGoogle: mockLoginWithGoogle,
      logout: mockLogout,
    };
    
    const wrapper = ({ children }) => (
      <AuthContext.Provider value={mockContextValue}>
        {children}
      </AuthContext.Provider>
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.signup).toBe(mockSignup);
    expect(result.current.login).toBe(mockLogin);
    expect(result.current.loginWithGoogle).toBe(mockLoginWithGoogle);
    expect(result.current.logout).toBe(mockLogout);
  });
});

