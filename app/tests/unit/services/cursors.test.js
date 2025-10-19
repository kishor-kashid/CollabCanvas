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
    set: vi.fn().mockResolvedValue(),
  })),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  get: vi.fn(),
}));

import { ref, set, update, onValue, remove, onDisconnect, get } from 'firebase/database';

const TEST_CANVAS_ID = 'test-canvas-123';

describe('Cursor Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('initializeUserSession', () => {
    it('should initialize user session with correct data', async () => {
      set.mockResolvedValue();
      
      await initializeUserSession(TEST_CANVAS_ID, 'user123', 'Test User', '#FF5733');
      
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
      
      await initializeUserSession(TEST_CANVAS_ID, 'user123', 'Test User', '#FF5733');
      
      expect(onDisconnect).toHaveBeenCalled();
      expect(mockOnDisconnect.remove).toHaveBeenCalled();
    });
    
    it('should handle errors gracefully', async () => {
      set.mockRejectedValue(new Error('Network error'));
      
      // Should not throw (errors are caught internally)
      await expect(initializeUserSession(TEST_CANVAS_ID, 'user123', 'Test', '#000'))
        .resolves.not.toThrow();
    });
    
    it('should handle missing canvasId gracefully', async () => {
      set.mockResolvedValue();
      
      // Function catches errors internally and resolves without throwing
      await expect(initializeUserSession(null, 'user123', 'Test', '#000'))
        .resolves.not.toThrow();
      
      // Should not attempt to call set when canvasId is missing
      expect(set).not.toHaveBeenCalled();
    });
  });
  
  describe('updateCursorPosition', () => {
    it('should update cursor position with coordinates', async () => {
      update.mockResolvedValue();
      
      await updateCursorPosition(TEST_CANVAS_ID, 'user123', 150, 250);
      
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
      
      await updateCursorPosition(TEST_CANVAS_ID, 'user123', 100, 200);
      
      // Verify update is called (not set)
      expect(update).toHaveBeenCalled();
      expect(set).not.toHaveBeenCalled();
    });
    
    it('should handle errors gracefully', async () => {
      update.mockRejectedValue(new Error('Update failed'));
      
      // Should not throw (errors are caught internally)
      await expect(updateCursorPosition(TEST_CANVAS_ID, 'user123', 100, 200))
        .resolves.not.toThrow();
    });
    
    it('should silently ignore if no canvasId', async () => {
      await updateCursorPosition(null, 'user123', 100, 200);
      
      expect(update).not.toHaveBeenCalled();
    });
    
    it('should handle rapid cursor updates', async () => {
      update.mockResolvedValue();
      
      await updateCursorPosition(TEST_CANVAS_ID, 'user123', 0, 0);
      await updateCursorPosition(TEST_CANVAS_ID, 'user123', 50, 50);
      await updateCursorPosition(TEST_CANVAS_ID, 'user123', 100, 100);
      
      expect(update).toHaveBeenCalledTimes(3);
    });
  });
  
  describe('subscribeToCursors', () => {
    it('should subscribe to cursor updates', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      
      onValue.mockReturnValue(mockUnsubscribe);
      
      const unsubscribe = subscribeToCursors(TEST_CANVAS_ID, mockCallback);
      
      expect(onValue).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });
    
    it('should return no-op function if canvasId is missing', () => {
      const mockCallback = vi.fn();
      
      const unsubscribe = subscribeToCursors(null, mockCallback);
      
      expect(typeof unsubscribe).toBe('function');
      expect(onValue).not.toHaveBeenCalled();
    });
    
    it('should call callback with cursor data', () => {
      const mockCallback = vi.fn();
      const mockCursors = {
        user1: { displayName: 'User 1', cursorX: 100, cursorY: 200 },
        user2: { displayName: 'User 2', cursorX: 300, cursorY: 400 },
      };
      
      onValue.mockImplementation((ref, callback) => {
        const mockSnapshot = {
          val: () => mockCursors,
        };
        callback(mockSnapshot);
        return vi.fn();
      });
      
      subscribeToCursors(TEST_CANVAS_ID, mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith(mockCursors);
    });
    
    it('should call callback with empty object if no cursors', () => {
      const mockCallback = vi.fn();
      
      onValue.mockImplementation((ref, callback) => {
        const mockSnapshot = {
          val: () => null,
        };
        callback(mockSnapshot);
        return vi.fn();
      });
      
      subscribeToCursors(TEST_CANVAS_ID, mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith({});
    });
    
    it('should handle subscription errors', () => {
      const mockCallback = vi.fn();
      
      onValue.mockImplementation((ref, successCallback, errorCallback) => {
        errorCallback(new Error('Subscription failed'));
        return vi.fn();
      });
      
      subscribeToCursors(TEST_CANVAS_ID, mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith({});
    });
  });
  
  describe('removeUserSession', () => {
    it('should remove user session', async () => {
      remove.mockResolvedValue();
      
      await removeUserSession(TEST_CANVAS_ID, 'user123');
      
      expect(ref).toHaveBeenCalled();
      expect(remove).toHaveBeenCalled();
    });
    
    it('should handle removal errors gracefully', async () => {
      remove.mockRejectedValue(new Error('Remove failed'));
      
      // Should not throw (errors are caught internally)
      await expect(removeUserSession(TEST_CANVAS_ID, 'user123'))
        .resolves.not.toThrow();
    });
    
    it('should silently return if no canvasId', async () => {
      await removeUserSession(null, 'user123');
      
      expect(remove).not.toHaveBeenCalled();
    });
  });
  
  describe('cleanupStaleSessions', () => {
    it('should attempt to cleanup stale sessions', async () => {
      const mockSnapshot = {
        exists: () => false,
      };
      
      get.mockResolvedValue(mockSnapshot);
      
      await cleanupStaleSessions(TEST_CANVAS_ID);
      
      expect(get).toHaveBeenCalled();
    });
    
    it('should handle cleanup errors gracefully', async () => {
      get.mockRejectedValue(new Error('Cleanup failed'));
      
      // Should not throw (errors are caught internally)
      await expect(cleanupStaleSessions(TEST_CANVAS_ID))
        .resolves.not.toThrow();
    });
    
    it('should silently return if no canvasId', async () => {
      await cleanupStaleSessions(null);
      
      expect(get).not.toHaveBeenCalled();
    });
  });
});
