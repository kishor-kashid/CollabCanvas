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

const TEST_CANVAS_ID = 'test-canvas-123';

describe('Presence Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('setUserOnline', () => {
    it('should initialize user session with correct parameters', async () => {
      initializeUserSession.mockResolvedValue();
      
      await setUserOnline(TEST_CANVAS_ID, 'user123', 'John Doe', '#FF5733');
      
      expect(initializeUserSession).toHaveBeenCalledWith(
        TEST_CANVAS_ID,
        'user123',
        'John Doe',
        '#FF5733'
      );
    });
    
    it('should call initializeUserSession once', async () => {
      initializeUserSession.mockResolvedValue();
      
      await setUserOnline(TEST_CANVAS_ID, 'user456', 'Jane Smith', '#33C1FF');
      
      expect(initializeUserSession).toHaveBeenCalledTimes(1);
    });
    
    it('should throw error on initialization failure', async () => {
      const error = new Error('Failed to initialize session');
      initializeUserSession.mockRejectedValue(error);
      
      await expect(setUserOnline(TEST_CANVAS_ID, 'user123', 'Test', '#000'))
        .rejects.toThrow('Failed to initialize session');
    });
    
    it('should handle special characters in display name', async () => {
      initializeUserSession.mockResolvedValue();
      
      await setUserOnline(TEST_CANVAS_ID, 'user123', 'José García-López', '#FF5733');
      
      expect(initializeUserSession).toHaveBeenCalledWith(
        TEST_CANVAS_ID,
        'user123',
        'José García-López',
        '#FF5733'
      );
    });
    
    it('should handle empty display name', async () => {
      initializeUserSession.mockResolvedValue();
      
      await setUserOnline(TEST_CANVAS_ID, 'user123', '', '#FF5733');
      
      expect(initializeUserSession).toHaveBeenCalledWith(
        TEST_CANVAS_ID,
        'user123',
        '',
        '#FF5733'
      );
    });
  });
  
  describe('setUserOffline', () => {
    it('should remove user session with correct parameters', async () => {
      removeUserSession.mockResolvedValue();
      
      await setUserOffline(TEST_CANVAS_ID, 'user123');
      
      expect(removeUserSession).toHaveBeenCalledWith(TEST_CANVAS_ID, 'user123');
    });
    
    it('should call removeUserSession once', async () => {
      removeUserSession.mockResolvedValue();
      
      await setUserOffline(TEST_CANVAS_ID, 'user456');
      
      expect(removeUserSession).toHaveBeenCalledTimes(1);
    });
    
    it('should throw error on removal failure', async () => {
      const error = new Error('Failed to remove session');
      removeUserSession.mockRejectedValue(error);
      
      await expect(setUserOffline(TEST_CANVAS_ID, 'user123'))
        .rejects.toThrow('Failed to remove session');
    });
    
    it('should handle multiple users going offline', async () => {
      removeUserSession.mockResolvedValue();
      
      await setUserOffline(TEST_CANVAS_ID, 'user1');
      await setUserOffline(TEST_CANVAS_ID, 'user2');
      await setUserOffline(TEST_CANVAS_ID, 'user3');
      
      expect(removeUserSession).toHaveBeenCalledTimes(3);
      expect(removeUserSession).toHaveBeenCalledWith(TEST_CANVAS_ID, 'user1');
      expect(removeUserSession).toHaveBeenCalledWith(TEST_CANVAS_ID, 'user2');
      expect(removeUserSession).toHaveBeenCalledWith(TEST_CANVAS_ID, 'user3');
    });
  });
  
  describe('subscribeToPresence', () => {
    it('should subscribe using subscribeToCursors', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      
      subscribeToCursors.mockReturnValue(mockUnsubscribe);
      
      const unsubscribe = subscribeToPresence(TEST_CANVAS_ID, mockCallback);
      
      expect(subscribeToCursors).toHaveBeenCalledWith(TEST_CANVAS_ID, mockCallback);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
    
    it('should return unsubscribe function', () => {
      const mockUnsubscribe = vi.fn();
      subscribeToCursors.mockReturnValue(mockUnsubscribe);
      
      const unsubscribe = subscribeToPresence(TEST_CANVAS_ID, vi.fn());
      
      expect(typeof unsubscribe).toBe('function');
    });
    
    it('should forward callback correctly', () => {
      const mockCallback = vi.fn();
      const mockData = {
        user1: { displayName: 'User 1', cursorX: 100, cursorY: 200 },
      };
      
      subscribeToCursors.mockImplementation((canvasId, callback) => {
        callback(mockData);
        return vi.fn();
      });
      
      subscribeToPresence(TEST_CANVAS_ID, mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith(mockData);
    });
    
    it('should work with multiple subscribers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      subscribeToCursors.mockReturnValue(vi.fn());
      
      subscribeToPresence(TEST_CANVAS_ID, callback1);
      subscribeToPresence(TEST_CANVAS_ID, callback2);
      
      expect(subscribeToCursors).toHaveBeenCalledTimes(2);
    });
  });
});
