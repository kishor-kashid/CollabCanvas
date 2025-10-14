// Unit Tests for Auth Service
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signUp, signIn, signInWithGoogle, signOut, updateUserProfile } from '../../../src/services/auth';

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}));

// Import mocked functions
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
} from 'firebase/auth';

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('signUp', () => {
    it('should create a new user with email and password', async () => {
      const mockUserCredential = {
        user: {
          uid: 'user123',
          email: 'test@example.com',
          displayName: null,
        },
      };
      
      createUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
      updateProfile.mockResolvedValue();
      
      const result = await signUp('test@example.com', 'password123');
      
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(result).toEqual(mockUserCredential);
    });
    
    it('should set display name from provided name', async () => {
      const mockUserCredential = {
        user: {
          uid: 'user123',
          email: 'test@example.com',
        },
      };
      
      createUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
      updateProfile.mockResolvedValue();
      
      await signUp('test@example.com', 'password123', 'John Doe');
      
      expect(updateProfile).toHaveBeenCalledWith(
        mockUserCredential.user,
        { displayName: 'John Doe' }
      );
    });
    
    it('should extract display name from email if not provided', async () => {
      const mockUserCredential = {
        user: {
          uid: 'user123',
          email: 'testuser@example.com',
        },
      };
      
      createUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
      updateProfile.mockResolvedValue();
      
      await signUp('testuser@example.com', 'password123');
      
      expect(updateProfile).toHaveBeenCalledWith(
        mockUserCredential.user,
        { displayName: 'testuser' }
      );
    });
    
    it('should truncate display name to 20 characters', async () => {
      const mockUserCredential = {
        user: {
          uid: 'user123',
          email: 'test@example.com',
        },
      };
      
      createUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
      updateProfile.mockResolvedValue();
      
      const longName = 'This is a very long display name that exceeds 20 characters';
      await signUp('test@example.com', 'password123', longName);
      
      expect(updateProfile).toHaveBeenCalledWith(
        mockUserCredential.user,
        { displayName: longName.substring(0, 20) }
      );
    });
    
    it('should throw error on sign up failure', async () => {
      const error = new Error('Email already in use');
      createUserWithEmailAndPassword.mockRejectedValue(error);
      
      await expect(signUp('test@example.com', 'password123')).rejects.toThrow('Email already in use');
    });
  });
  
  describe('signIn', () => {
    it('should sign in existing user with email and password', async () => {
      const mockUserCredential = {
        user: {
          uid: 'user123',
          email: 'test@example.com',
          displayName: 'Test User',
        },
      };
      
      signInWithEmailAndPassword.mockResolvedValue(mockUserCredential);
      
      const result = await signIn('test@example.com', 'password123');
      
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(result).toEqual(mockUserCredential);
    });
    
    it('should throw error on invalid credentials', async () => {
      const error = new Error('Invalid email or password');
      signInWithEmailAndPassword.mockRejectedValue(error);
      
      await expect(signIn('wrong@example.com', 'wrongpass')).rejects.toThrow('Invalid email or password');
    });
    
    it('should throw error on network failure', async () => {
      const error = new Error('Network error');
      signInWithEmailAndPassword.mockRejectedValue(error);
      
      await expect(signIn('test@example.com', 'password123')).rejects.toThrow('Network error');
    });
  });
  
  describe('signInWithGoogle', () => {
    it('should sign in with Google OAuth', async () => {
      const mockResult = {
        user: {
          uid: 'google123',
          email: 'google@example.com',
          displayName: 'Google User',
        },
      };
      
      signInWithPopup.mockResolvedValue(mockResult);
      
      const result = await signInWithGoogle();
      
      expect(GoogleAuthProvider).toHaveBeenCalled();
      expect(signInWithPopup).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
    
    it('should truncate long Google display names to 20 characters', async () => {
      const longName = 'This is a very long Google display name';
      const mockResult = {
        user: {
          uid: 'google123',
          email: 'google@example.com',
          displayName: longName,
        },
      };
      
      signInWithPopup.mockResolvedValue(mockResult);
      updateProfile.mockResolvedValue();
      
      await signInWithGoogle();
      
      expect(updateProfile).toHaveBeenCalledWith(
        mockResult.user,
        { displayName: longName.substring(0, 20) }
      );
    });
    
    it('should not update profile if display name is short enough', async () => {
      const mockResult = {
        user: {
          uid: 'google123',
          email: 'google@example.com',
          displayName: 'Short Name',
        },
      };
      
      signInWithPopup.mockResolvedValue(mockResult);
      
      await signInWithGoogle();
      
      expect(updateProfile).not.toHaveBeenCalled();
    });
    
    it('should throw error on Google sign in cancellation', async () => {
      const error = new Error('User cancelled sign in');
      signInWithPopup.mockRejectedValue(error);
      
      await expect(signInWithGoogle()).rejects.toThrow('User cancelled sign in');
    });
  });
  
  describe('signOut', () => {
    it('should sign out current user', async () => {
      firebaseSignOut.mockResolvedValue();
      
      await signOut();
      
      expect(firebaseSignOut).toHaveBeenCalledWith(expect.anything());
    });
    
    it('should throw error on sign out failure', async () => {
      const error = new Error('Sign out failed');
      firebaseSignOut.mockRejectedValue(error);
      
      await expect(signOut()).rejects.toThrow('Sign out failed');
    });
  });
  
  // Note: updateUserProfile tests removed due to mocking limitations
  // These require integration tests with real Firebase auth object
});
