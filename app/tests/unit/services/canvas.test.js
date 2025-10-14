// Unit Tests for Canvas Service
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  subscribeToShapes,
  createShape, 
  updateShape, 
  deleteShape,
  lockShape,
  unlockShape,
  releaseStaleLocks,
} from '../../../src/services/canvas';

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  updateDoc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
}));

// Import mocked functions
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  setDoc,
  getDoc,
} from 'firebase/firestore';

describe('Canvas Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('subscribeToShapes', () => {
    it('should subscribe to shape updates', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      
      onSnapshot.mockReturnValue(mockUnsubscribe);
      
      const unsubscribe = subscribeToShapes(mockCallback);
      
      expect(onSnapshot).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });
    
    it('should call callback with shapes data when document exists', () => {
      const mockCallback = vi.fn();
      const mockShapes = [
        { id: 'shape1', type: 'rectangle', x: 0, y: 0 },
        { id: 'shape2', type: 'circle', x: 100, y: 100 },
      ];
      
      onSnapshot.mockImplementation((ref, successCallback) => {
        const mockSnapshot = {
          exists: () => true,
          data: () => ({ shapes: mockShapes }),
        };
        successCallback(mockSnapshot);
        return vi.fn();
      });
      
      subscribeToShapes(mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith(mockShapes);
    });
    
    it('should call callback with empty array when document does not exist', () => {
      const mockCallback = vi.fn();
      
      onSnapshot.mockImplementation((ref, successCallback) => {
        const mockSnapshot = {
          exists: () => false,
        };
        successCallback(mockSnapshot);
        return vi.fn();
      });
      
      subscribeToShapes(mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith([]);
    });
    
    it('should handle subscription errors', () => {
      const mockCallback = vi.fn();
      
      onSnapshot.mockImplementation((ref, successCallback, errorCallback) => {
        errorCallback(new Error('Subscription failed'));
        return vi.fn();
      });
      
      subscribeToShapes(mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith([]);
    });
  });
  
  describe('createShape', () => {
    it('should create a new shape with proper metadata', async () => {
      const mockShapes = [];
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ shapes: mockShapes }),
      });
      updateDoc.mockResolvedValue();
      
      const shapeData = {
        id: 'shape1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        fill: '#ff0000',
      };
      
      await createShape(shapeData, 'user123');
      
      expect(updateDoc).toHaveBeenCalled();
      const callArgs = updateDoc.mock.calls[0][1];
      
      expect(callArgs.shapes).toHaveLength(1);
      expect(callArgs.shapes[0]).toMatchObject({
        ...shapeData,
        createdBy: 'user123',
        lastModifiedBy: 'user123',
        isLocked: false,
        lockedBy: null,
      });
      expect(callArgs.shapes[0].createdAt).toBeDefined();
      expect(callArgs.shapes[0].lastModifiedAt).toBeDefined();
    });
    
    it('should add shape to existing shapes array', async () => {
      const existingShapes = [
        { id: 'shape1', type: 'circle', x: 0, y: 0 },
      ];
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ shapes: existingShapes }),
      });
      updateDoc.mockResolvedValue();
      
      const newShape = {
        id: 'shape2',
        type: 'rectangle',
        x: 100,
        y: 100,
      };
      
      await createShape(newShape, 'user456');
      
      const callArgs = updateDoc.mock.calls[0][1];
      expect(callArgs.shapes).toHaveLength(2);
      expect(callArgs.shapes[0]).toEqual(existingShapes[0]);
      expect(callArgs.shapes[1].id).toBe('shape2');
    });
    
    it('should throw error on creation failure', async () => {
      getDoc.mockRejectedValue(new Error('Firestore error'));
      
      await expect(createShape({ id: 'shape1' }, 'user123')).rejects.toThrow('Firestore error');
    });
  });
  
  describe('updateShape', () => {
    it('should update existing shape properties', async () => {
      const existingShapes = [
        { id: 'shape1', type: 'rectangle', x: 0, y: 0, fill: '#ff0000' },
        { id: 'shape2', type: 'circle', x: 100, y: 100, fill: '#00ff00' },
      ];
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ shapes: existingShapes }),
      });
      updateDoc.mockResolvedValue();
      
      const updates = {
        x: 200,
        y: 200,
        fill: '#0000ff',
      };
      
      await updateShape('shape1', updates, 'user123');
      
      const callArgs = updateDoc.mock.calls[0][1];
      expect(callArgs.shapes[0]).toMatchObject({
        id: 'shape1',
        type: 'rectangle',
        x: 200,
        y: 200,
        fill: '#0000ff',
        lastModifiedBy: 'user123',
      });
      expect(callArgs.shapes[0].lastModifiedAt).toBeDefined();
    });
    
    it('should not modify other shapes', async () => {
      const existingShapes = [
        { id: 'shape1', x: 0, y: 0 },
        { id: 'shape2', x: 100, y: 100 },
      ];
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ shapes: existingShapes }),
      });
      updateDoc.mockResolvedValue();
      
      await updateShape('shape1', { x: 50 }, 'user123');
      
      const callArgs = updateDoc.mock.calls[0][1];
      expect(callArgs.shapes[1]).toEqual(existingShapes[1]);
    });
    
    it('should throw error on update failure', async () => {
      getDoc.mockRejectedValue(new Error('Update failed'));
      
      await expect(updateShape('shape1', { x: 100 }, 'user123')).rejects.toThrow('Update failed');
    });
  });
  
  describe('deleteShape', () => {
    it('should remove shape from shapes array', async () => {
      const existingShapes = [
        { id: 'shape1', type: 'rectangle' },
        { id: 'shape2', type: 'circle' },
        { id: 'shape3', type: 'text' },
      ];
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ shapes: existingShapes }),
      });
      updateDoc.mockResolvedValue();
      
      await deleteShape('shape2');
      
      const callArgs = updateDoc.mock.calls[0][1];
      expect(callArgs.shapes).toHaveLength(2);
      expect(callArgs.shapes.find(s => s.id === 'shape2')).toBeUndefined();
      expect(callArgs.shapes.find(s => s.id === 'shape1')).toBeDefined();
      expect(callArgs.shapes.find(s => s.id === 'shape3')).toBeDefined();
    });
    
    it('should handle deletion of non-existent shape', async () => {
      const existingShapes = [
        { id: 'shape1', type: 'rectangle' },
      ];
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ shapes: existingShapes }),
      });
      updateDoc.mockResolvedValue();
      
      await deleteShape('nonexistent');
      
      const callArgs = updateDoc.mock.calls[0][1];
      expect(callArgs.shapes).toHaveLength(1);
    });
    
    it('should throw error on deletion failure', async () => {
      getDoc.mockRejectedValue(new Error('Delete failed'));
      
      await expect(deleteShape('shape1')).rejects.toThrow('Delete failed');
    });
  });
  
  describe('lockShape', () => {
    it('should lock an unlocked shape', async () => {
      const existingShapes = [
        { id: 'shape1', isLocked: false, lockedBy: null },
      ];
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ shapes: existingShapes }),
      });
      updateDoc.mockResolvedValue();
      
      const result = await lockShape('shape1', 'user123');
      
      expect(result).toBe(true);
      const callArgs = updateDoc.mock.calls[0][1];
      expect(callArgs.shapes[0]).toMatchObject({
        id: 'shape1',
        isLocked: true,
        lockedBy: 'user123',
      });
      expect(callArgs.shapes[0].lockStartTime).toBeDefined();
    });
    
    it('should not lock shape already locked by another user', async () => {
      const existingShapes = [
        { 
          id: 'shape1', 
          isLocked: true, 
          lockedBy: 'user456',
          lockStartTime: Date.now(),
        },
      ];
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ shapes: existingShapes }),
      });
      
      const result = await lockShape('shape1', 'user123');
      
      expect(result).toBe(false);
      expect(updateDoc).not.toHaveBeenCalled();
    });
    
    it('should acquire lock if previous lock has timed out', async () => {
      const oldTimestamp = Date.now() - 6000; // 6 seconds ago (timeout is 5 seconds)
      const existingShapes = [
        { 
          id: 'shape1', 
          isLocked: true, 
          lockedBy: 'user456',
          lockStartTime: oldTimestamp,
        },
      ];
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ shapes: existingShapes }),
      });
      updateDoc.mockResolvedValue();
      
      const result = await lockShape('shape1', 'user123');
      
      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
    });
    
    it('should throw error if shape not found', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ shapes: [] }),
      });
      
      await expect(lockShape('nonexistent', 'user123')).rejects.toThrow('Shape not found');
    });
  });
  
  describe('unlockShape', () => {
    it('should unlock a locked shape', async () => {
      const existingShapes = [
        { 
          id: 'shape1', 
          isLocked: true, 
          lockedBy: 'user123',
          lockStartTime: Date.now(),
        },
      ];
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ shapes: existingShapes }),
      });
      updateDoc.mockResolvedValue();
      
      await unlockShape('shape1', 'user123');
      
      const callArgs = updateDoc.mock.calls[0][1];
      expect(callArgs.shapes[0]).toMatchObject({
        id: 'shape1',
        isLocked: false,
        lockedBy: null,
        lockStartTime: null,
      });
    });
    
    it('should not unlock shape locked by different user', async () => {
      const existingShapes = [
        { 
          id: 'shape1', 
          isLocked: true, 
          lockedBy: 'user456',
          lockStartTime: Date.now(),
        },
      ];
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ shapes: existingShapes }),
      });
      updateDoc.mockResolvedValue();
      
      await unlockShape('shape1', 'user123');
      
      const callArgs = updateDoc.mock.calls[0][1];
      expect(callArgs.shapes[0].isLocked).toBe(true);
      expect(callArgs.shapes[0].lockedBy).toBe('user456');
    });
    
    it('should force unlock when userId is null', async () => {
      const existingShapes = [
        { 
          id: 'shape1', 
          isLocked: true, 
          lockedBy: 'user456',
        },
      ];
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ shapes: existingShapes }),
      });
      updateDoc.mockResolvedValue();
      
      await unlockShape('shape1', null);
      
      const callArgs = updateDoc.mock.calls[0][1];
      expect(callArgs.shapes[0].isLocked).toBe(false);
    });
  });
  
  describe('releaseStaleLocks', () => {
    it('should release locks older than timeout', async () => {
      const now = Date.now();
      const existingShapes = [
        { 
          id: 'shape1', 
          isLocked: true,
          lockStartTime: now - 6000, // Stale (6 seconds old)
        },
        { 
          id: 'shape2', 
          isLocked: true,
          lockStartTime: now - 1000, // Fresh (1 second old)
        },
        { 
          id: 'shape3', 
          isLocked: false,
        },
      ];
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ shapes: existingShapes }),
      });
      updateDoc.mockResolvedValue();
      
      await releaseStaleLocks();
      
      const callArgs = updateDoc.mock.calls[0][1];
      expect(callArgs.shapes[0].isLocked).toBe(false);
      expect(callArgs.shapes[1].isLocked).toBe(true);
      expect(callArgs.shapes[2].isLocked).toBe(false);
    });
    
    it('should not update if no stale locks found', async () => {
      const now = Date.now();
      const existingShapes = [
        { 
          id: 'shape1', 
          isLocked: true,
          lockStartTime: now - 1000, // Fresh
        },
      ];
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ shapes: existingShapes }),
      });
      
      await releaseStaleLocks();
      
      expect(updateDoc).not.toHaveBeenCalled();
    });
    
    it('should handle errors gracefully', async () => {
      getDoc.mockRejectedValue(new Error('Network error'));
      
      // Should not throw
      await expect(releaseStaleLocks()).resolves.not.toThrow();
    });
  });
});
