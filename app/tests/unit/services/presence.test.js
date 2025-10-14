// Unit Tests for Presence Service
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setUserOnline, setUserOffline, subscribeToPresence } from '../../../src/services/presence';

// Mock the cursor service
vi.mock('../../../src/services/cursors', () => ({
  initializeUserSession: vi.fn(),
  removeUserSession: vi.fn(),
  subscribeToCursors: vi.fn(),
}));

import { 
  initializeUserSession, 
  removeUserSession, 
  subscribeToCursors 
} from '../../../src/services/cursors';

describe('Presence Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('setUserOnline', () => {
    it('should initialize user session with correct parameters', async () => {
      initializeUserSession.mockResolvedValue();
      
      await setUserOnline('user123', 'John Doe', '#FF5733');
      
      expect(initializeUserSession).toHaveBeenCalledWith('user123', 'John Doe', '#FF5733');
    });
    
    it('should call initializeUserSession once', async () => {
      initializeUserSession.mockResolvedValue();
      
      await setUserOnline('user456', 'Jane Smith', '#33C1FF');
      
      expect(initializeUserSession).toHaveBeenCalledTimes(1);
    });
    
    it('should throw error on initialization failure', async () => {
      const error = new Error('Failed to initialize session');
      initializeUserSession.mockRejectedValue(error);
      
      await expect(setUserOnline('user123', 'Test', '#000')).rejects.toThrow('Failed to initialize session');
    });
    
    it('should handle special characters in display name', async () => {
      initializeUserSession.mockResolvedValue();
      
      await setUserOnline('user123', 'José García-López', '#FF5733');
      
      expect(initializeUserSession).toHaveBeenCalledWith('user123', 'José García-López', '#FF5733');
    });
    
    it('should handle empty display name', async () => {
      initializeUserSession.mockResolvedValue();
      
      await setUserOnline('user123', '', '#FF5733');
      
      expect(initializeUserSession).toHaveBeenCalledWith('user123', '', '#FF5733');
    });
  });
  
  describe('setUserOffline', () => {
    it('should remove user session with correct userId', async () => {
      removeUserSession.mockResolvedValue();
      
      await setUserOffline('user123');
      
      expect(removeUserSession).toHaveBeenCalledWith('user123');
    });
    
    it('should call removeUserSession once', async () => {
      removeUserSession.mockResolvedValue();
      
      await setUserOffline('user456');
      
      expect(removeUserSession).toHaveBeenCalledTimes(1);
    });
    
    it('should throw error on removal failure', async () => {
      const error = new Error('Failed to remove session');
      removeUserSession.mockRejectedValue(error);
      
      await expect(setUserOffline('user123')).rejects.toThrow('Failed to remove session');
    });
    
    it('should handle multiple users going offline', async () => {
      removeUserSession.mockResolvedValue();
      
      await setUserOffline('user1');
      await setUserOffline('user2');
      await setUserOffline('user3');
      
      expect(removeUserSession).toHaveBeenCalledTimes(3);
      expect(removeUserSession).toHaveBeenCalledWith('user1');
      expect(removeUserSession).toHaveBeenCalledWith('user2');
      expect(removeUserSession).toHaveBeenCalledWith('user3');
    });
  });
  
  describe('subscribeToPresence', () => {
    it('should subscribe to cursor updates', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      
      subscribeToCursors.mockReturnValue(mockUnsubscribe);
      
      const unsubscribe = subscribeToPresence(mockCallback);
      
      expect(subscribeToCursors).toHaveBeenCalledWith(mockCallback);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
    
    it('should pass callback to subscribeToCursors', () => {
      const mockCallback = vi.fn();
      subscribeToCursors.mockReturnValue(vi.fn());
      
      subscribeToPresence(mockCallback);
      
      expect(subscribeToCursors).toHaveBeenCalledWith(mockCallback);
    });
    
    it('should return unsubscribe function', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      
      subscribeToCursors.mockReturnValue(mockUnsubscribe);
      
      const unsubscribe = subscribeToPresence(mockCallback);
      
      expect(typeof unsubscribe).toBe('function');
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
    
    it('should handle multiple subscriptions', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();
      
      subscribeToCursors.mockReturnValue(vi.fn());
      
      subscribeToPresence(callback1);
      subscribeToPresence(callback2);
      subscribeToPresence(callback3);
      
      expect(subscribeToCursors).toHaveBeenCalledTimes(3);
    });
  });
  
  describe('integration behavior', () => {
    it('should handle full user lifecycle', async () => {
      initializeUserSession.mockResolvedValue();
      removeUserSession.mockResolvedValue();
      subscribeToCursors.mockReturnValue(vi.fn());
      
      // User comes online
      await setUserOnline('user123', 'Test User', '#FF5733');
      expect(initializeUserSession).toHaveBeenCalled();
      
      // Subscribe to presence updates
      const mockCallback = vi.fn();
      subscribeToPresence(mockCallback);
      expect(subscribeToCursors).toHaveBeenCalled();
      
      // User goes offline
      await setUserOffline('user123');
      expect(removeUserSession).toHaveBeenCalled();
    });
    
    it('should handle errors in user lifecycle gracefully', async () => {
      initializeUserSession.mockRejectedValue(new Error('Network error'));
      removeUserSession.mockResolvedValue();
      
      // Failed to come online
      await expect(setUserOnline('user123', 'Test', '#000')).rejects.toThrow();
      
      // Should still be able to go offline (cleanup)
      await expect(setUserOffline('user123')).resolves.not.toThrow();
    });
  });
  
  describe('edge cases', () => {
    it('should handle very long user IDs', async () => {
      initializeUserSession.mockResolvedValue();
      
      const longUserId = 'u'.repeat(1000);
      await setUserOnline(longUserId, 'Test', '#000');
      
      expect(initializeUserSession).toHaveBeenCalledWith(longUserId, 'Test', '#000');
    });
    
    it('should handle very long display names', async () => {
      initializeUserSession.mockResolvedValue();
      
      const longName = 'N'.repeat(1000);
      await setUserOnline('user123', longName, '#000');
      
      expect(initializeUserSession).toHaveBeenCalledWith('user123', longName, '#000');
    });
    
    it('should handle invalid color codes', async () => {
      initializeUserSession.mockResolvedValue();
      
      await setUserOnline('user123', 'Test', 'invalid-color');
      
      expect(initializeUserSession).toHaveBeenCalledWith('user123', 'Test', 'invalid-color');
    });
    
    it('should handle rapid online/offline toggles', async () => {
      initializeUserSession.mockResolvedValue();
      removeUserSession.mockResolvedValue();
      
      // Rapid toggles
      await setUserOnline('user123', 'Test', '#000');
      await setUserOffline('user123');
      await setUserOnline('user123', 'Test', '#000');
      await setUserOffline('user123');
      
      expect(initializeUserSession).toHaveBeenCalledTimes(2);
      expect(removeUserSession).toHaveBeenCalledTimes(2);
    });
  });
});

