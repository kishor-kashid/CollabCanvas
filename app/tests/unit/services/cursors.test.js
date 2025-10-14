// Unit Tests for Cursor Service
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  initializeUserSession,
  updateCursorPosition,
  subscribeToCursors,
  removeUserSession,
  cleanupStaleSessions,
} from '../../../src/services/cursors';

// Mock Firebase Realtime Database
vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  onValue: vi.fn(),
  remove: vi.fn(),
  onDisconnect: vi.fn(() => ({
    remove: vi.fn().mockResolvedValue(),
    cancel: vi.fn().mockResolvedValue(),
  })),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  get: vi.fn(),
}));

import { ref, set, update, onValue, remove, onDisconnect, get } from 'firebase/database';

describe('Cursor Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('initializeUserSession', () => {
    it('should initialize user session with correct data', async () => {
      set.mockResolvedValue();
      
      await initializeUserSession('user123', 'Test User', '#FF5733');
      
      expect(ref).toHaveBeenCalled();
      expect(set).toHaveBeenCalled();
      const callArgs = set.mock.calls[0][1];
      expect(callArgs).toMatchObject({
        displayName: 'Test User',
        cursorColor: '#FF5733',
        cursorX: 0,
        cursorY: 0,
        lastSeen: 'SERVER_TIMESTAMP',
      });
    });
    
    it('should set up onDisconnect handler', async () => {
      const mockOnDisconnect = {
        remove: vi.fn().mockResolvedValue(),
      };
      onDisconnect.mockReturnValue(mockOnDisconnect);
      set.mockResolvedValue();
      
      await initializeUserSession('user123', 'Test User', '#FF5733');
      
      expect(onDisconnect).toHaveBeenCalled();
      expect(mockOnDisconnect.remove).toHaveBeenCalled();
    });
    
    it('should handle errors gracefully', async () => {
      set.mockRejectedValue(new Error('Network error'));
      
      // Should not throw
      await expect(initializeUserSession('user123', 'Test', '#000')).resolves.not.toThrow();
    });
  });
  
  describe('updateCursorPosition', () => {
    it('should update cursor position with coordinates', async () => {
      update.mockResolvedValue();
      
      await updateCursorPosition('user123', 150, 250);
      
      expect(ref).toHaveBeenCalled();
      expect(update).toHaveBeenCalled();
      const callArgs = update.mock.calls[0][1];
      expect(callArgs).toMatchObject({
        cursorX: 150,
        cursorY: 250,
        lastSeen: 'SERVER_TIMESTAMP',
      });
    });
    
    it('should preserve onDisconnect handler by using update instead of set', async () => {
      update.mockResolvedValue();
      
      await updateCursorPosition('user123', 100, 200);
      
      // Verify update is called (not set)
      expect(update).toHaveBeenCalled();
      expect(set).not.toHaveBeenCalled();
    });
    
    it('should handle errors gracefully', async () => {
      update.mockRejectedValue(new Error('Update failed'));
      
      // Should not throw
      await expect(updateCursorPosition('user123', 50, 75)).resolves.not.toThrow();
    });
    
    it('should handle negative coordinates', async () => {
      update.mockResolvedValue();
      
      await updateCursorPosition('user123', -10, -20);
      
      expect(update).toHaveBeenCalled();
      const callArgs = update.mock.calls[0][1];
      expect(callArgs.cursorX).toBe(-10);
      expect(callArgs.cursorY).toBe(-20);
    });
    
    it('should handle very large coordinates', async () => {
      update.mockResolvedValue();
      
      await updateCursorPosition('user123', 10000, 10000);
      
      expect(update).toHaveBeenCalled();
      const callArgs = update.mock.calls[0][1];
      expect(callArgs.cursorX).toBe(10000);
      expect(callArgs.cursorY).toBe(10000);
    });
  });
  
  describe('subscribeToCursors', () => {
    it('should subscribe to cursor updates', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      
      onValue.mockReturnValue(mockUnsubscribe);
      
      const unsubscribe = subscribeToCursors(mockCallback);
      
      expect(onValue).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });
    
    it('should call callback with cursor data', () => {
      const mockCallback = vi.fn();
      const mockCursors = {
        user1: { displayName: 'User 1', cursorX: 100, cursorY: 200 },
        user2: { displayName: 'User 2', cursorX: 300, cursorY: 400 },
      };
      
      onValue.mockImplementation((ref, successCallback) => {
        const mockSnapshot = {
          val: () => mockCursors,
        };
        successCallback(mockSnapshot);
        return vi.fn();
      });
      
      subscribeToCursors(mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith(mockCursors);
    });
    
    it('should call callback with empty object when no data', () => {
      const mockCallback = vi.fn();
      
      onValue.mockImplementation((ref, successCallback) => {
        const mockSnapshot = {
          val: () => null,
        };
        successCallback(mockSnapshot);
        return vi.fn();
      });
      
      subscribeToCursors(mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith({});
    });
    
    it('should handle subscription errors', () => {
      const mockCallback = vi.fn();
      
      onValue.mockImplementation((ref, successCallback, errorCallback) => {
        errorCallback(new Error('Subscription failed'));
        return vi.fn();
      });
      
      subscribeToCursors(mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith({});
    });
  });
  
  describe('removeUserSession', () => {
    it('should cancel onDisconnect and remove user data', async () => {
      const mockOnDisconnect = {
        cancel: vi.fn().mockResolvedValue(),
      };
      onDisconnect.mockReturnValue(mockOnDisconnect);
      remove.mockResolvedValue();
      
      await removeUserSession('user123');
      
      expect(onDisconnect).toHaveBeenCalled();
      expect(mockOnDisconnect.cancel).toHaveBeenCalled();
      expect(remove).toHaveBeenCalled();
    });
    
    it('should handle errors gracefully', async () => {
      remove.mockRejectedValue(new Error('Remove failed'));
      
      // Should not throw
      await expect(removeUserSession('user123')).resolves.not.toThrow();
    });
  });
  
  describe('cleanupStaleSessions', () => {
    it('should remove sessions older than maxAge', async () => {
      const now = Date.now();
      const staleSessions = {
        user1: {
          displayName: 'User 1',
          lastSeen: now - 6 * 60 * 1000, // 6 minutes old (stale)
        },
        user2: {
          displayName: 'User 2',
          lastSeen: now - 1 * 60 * 1000, // 1 minute old (fresh)
        },
      };
      
      const mockSnapshot = {
        exists: () => true,
        val: () => staleSessions,
      };
      
      get.mockResolvedValue(mockSnapshot);
      remove.mockResolvedValue();
      
      await cleanupStaleSessions(5 * 60 * 1000); // 5 minutes max age
      
      // Should remove user1 but not user2
      expect(remove).toHaveBeenCalledTimes(1);
    });
    
    it('should not remove any sessions if all are fresh', async () => {
      const now = Date.now();
      const freshSessions = {
        user1: {
          displayName: 'User 1',
          lastSeen: now - 1000, // 1 second old
        },
        user2: {
          displayName: 'User 2',
          lastSeen: now - 2000, // 2 seconds old
        },
      };
      
      const mockSnapshot = {
        exists: () => true,
        val: () => freshSessions,
      };
      
      get.mockResolvedValue(mockSnapshot);
      
      await cleanupStaleSessions();
      
      expect(remove).not.toHaveBeenCalled();
    });
    
    it('should handle no sessions gracefully', async () => {
      const mockSnapshot = {
        exists: () => false,
      };
      
      get.mockResolvedValue(mockSnapshot);
      
      await expect(cleanupStaleSessions()).resolves.not.toThrow();
      expect(remove).not.toHaveBeenCalled();
    });
    
    it('should handle errors gracefully', async () => {
      get.mockRejectedValue(new Error('Database error'));
      
      // Should not throw
      await expect(cleanupStaleSessions()).resolves.not.toThrow();
    });
    
    it('should use default maxAge of 5 minutes if not provided', async () => {
      const now = Date.now();
      const sessions = {
        user1: {
          lastSeen: now - 6 * 60 * 1000, // 6 minutes (should be removed)
        },
      };
      
      const mockSnapshot = {
        exists: () => true,
        val: () => sessions,
      };
      
      get.mockResolvedValue(mockSnapshot);
      remove.mockResolvedValue();
      
      await cleanupStaleSessions(); // No maxAge provided
      
      expect(remove).toHaveBeenCalledTimes(1);
    });
  });
});

