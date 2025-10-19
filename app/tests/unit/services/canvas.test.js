// Unit Tests for Canvas Service
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  subscribeToShapes,
  createShape, 
  updateShape, 
  deleteShape,
  lockShape,
  unlockShape,
  releaseStaleLocks,
  toggleShapeVisibility,
  toggleLayerLock,
  reorderShapes,
} from '../../../src/services/canvas';

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  collection: vi.fn(),
  onSnapshot: vi.fn(),
  updateDoc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
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

const TEST_CANVAS_ID = 'test-canvas-123';

describe('Canvas Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('subscribeToShapes', () => {
    it('should subscribe to shape updates for a specific canvas', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      
      onSnapshot.mockReturnValue(mockUnsubscribe);
      
      const unsubscribe = subscribeToShapes(TEST_CANVAS_ID, mockCallback);
      
      expect(onSnapshot).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });
    
    it('should return no-op function if canvasId is not provided', () => {
      const mockCallback = vi.fn();
      
      const unsubscribe = subscribeToShapes(null, mockCallback);
      
      expect(typeof unsubscribe).toBe('function');
      expect(onSnapshot).not.toHaveBeenCalled();
    });
    
    it('should call callback with shapes from document', () => {
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
      
      subscribeToShapes(TEST_CANVAS_ID, mockCallback);
      
      expect(mockCallback).toHaveBeenCalled();
      const receivedShapes = mockCallback.mock.calls[0][0];
      expect(receivedShapes).toHaveLength(2);
    });
    
    it('should call callback with empty array when no shapes exist', () => {
      const mockCallback = vi.fn();
      
      onSnapshot.mockImplementation((ref, successCallback) => {
        const mockSnapshot = {
          exists: () => true,
          data: () => ({ shapes: [] }),
        };
        successCallback(mockSnapshot);
        return vi.fn();
      });
      
      subscribeToShapes(TEST_CANVAS_ID, mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith([]);
    });
    
    it('should handle subscription errors gracefully', () => {
      const mockCallback = vi.fn();
      
      onSnapshot.mockImplementation((ref, successCallback, errorCallback) => {
        errorCallback(new Error('Subscription failed'));
        return vi.fn();
      });
      
      subscribeToShapes(TEST_CANVAS_ID, mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith([]);
    });
  });
  
  describe('createShape', () => {
    it('should create a new shape with proper metadata', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ shapes: [] }),
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
      
      await createShape(TEST_CANVAS_ID, shapeData, 'user123');
      
      expect(updateDoc).toHaveBeenCalled();
      const callArgs = updateDoc.mock.calls[0][1];
      
      expect(callArgs.shapes).toHaveLength(1);
      const createdShape = callArgs.shapes[0];
      expect(createdShape).toMatchObject({
        ...shapeData,
        createdBy: 'user123',
        lastModifiedBy: 'user123',
        isLocked: false,
        lockedBy: null,
        visible: true,
        layerLocked: false,
      });
      expect(createdShape.createdAt).toBeDefined();
      expect(createdShape.lastModifiedAt).toBeDefined();
    });
    
    it('should assign zIndex if provided', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ shapes: [] }),
      });
      updateDoc.mockResolvedValue();
      
      const shapeData = {
        id: 'shape1',
        type: 'circle',
        x: 50,
        y: 50,
        zIndex: 5,
      };
      
      await createShape(TEST_CANVAS_ID, shapeData, 'user456');
      
      const callArgs = updateDoc.mock.calls[0][1];
      const createdShape = callArgs.shapes[0];
      expect(createdShape.zIndex).toBe(5);
    });
    
    it('should throw error on creation failure', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ shapes: [] }),
      });
      updateDoc.mockRejectedValue(new Error('Firestore error'));
      
      await expect(createShape(TEST_CANVAS_ID, { id: 'shape1', type: 'rectangle' }, 'user123'))
        .rejects.toThrow('Firestore error');
    });
  });
  
  describe('updateShape', () => {
    it('should update existing shape properties', async () => {
      const existingShapes = [
        { id: 'shape1', type: 'rectangle', x: 0, y: 0, fill: '#ff0000' },
        { id: 'shape2', type: 'circle', x: 100, y: 100 },
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
      
      await updateShape(TEST_CANVAS_ID, 'shape1', updates, 'user123');
      
      expect(updateDoc).toHaveBeenCalled();
      const callArgs = updateDoc.mock.calls[0][1];
      
      expect(callArgs.shapes).toHaveLength(2);
      const updatedShape = callArgs.shapes.find(s => s.id === 'shape1');
      expect(updatedShape).toMatchObject({
        id: 'shape1',
        type: 'rectangle',
        ...updates,
        lastModifiedBy: 'user123',
      });
      expect(updatedShape.lastModifiedAt).toBeDefined();
    });
    
    it('should throw error on update failure', async () => {
      getDoc.mockRejectedValue(new Error('Update failed'));
      
      await expect(updateShape(TEST_CANVAS_ID, 'shape1', { x: 100 }, 'user123'))
        .rejects.toThrow('Update failed');
    });
  });
  
  describe('deleteShape', () => {
    it('should delete shape by id', async () => {
      const existingShapes = [
        { id: 'shape1', type: 'rectangle' },
        { id: 'shape2', type: 'circle' },
      ];
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ shapes: existingShapes }),
      });
      updateDoc.mockResolvedValue();
      
      await deleteShape(TEST_CANVAS_ID, 'shape1');
      
      expect(updateDoc).toHaveBeenCalled();
      const callArgs = updateDoc.mock.calls[0][1];
      expect(callArgs.shapes).toHaveLength(1);
      expect(callArgs.shapes[0].id).toBe('shape2');
    });
    
    it('should throw error on deletion failure', async () => {
      getDoc.mockRejectedValue(new Error('Delete failed'));
      
      await expect(deleteShape(TEST_CANVAS_ID, 'shape1'))
        .rejects.toThrow('Delete failed');
    });
  });
  
  describe('lockShape', () => {
    it('should lock an unlocked shape', async () => {
      const existingShapes = [
        { id: 'shape1', type: 'rectangle', isLocked: false, lockedBy: null },
        { id: 'shape2', type: 'circle' },
      ];
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ shapes: existingShapes }),
      });
      updateDoc.mockResolvedValue();
      
      const result = await lockShape(TEST_CANVAS_ID, 'shape1', 'user123');
      
      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
      const callArgs = updateDoc.mock.calls[0][1];
      
      const lockedShape = callArgs.shapes.find(s => s.id === 'shape1');
      expect(lockedShape).toMatchObject({
        id: 'shape1',
        isLocked: true,
        lockedBy: 'user123',
      });
      expect(lockedShape.lockStartTime).toBeDefined();
    });
    
    it('should not lock shape already locked by another user', async () => {
      const existingShapes = [
        { 
          id: 'shape1', 
          type: 'rectangle',
          isLocked: true, 
          lockedBy: 'user456',
          lockStartTime: Date.now(),
        },
      ];
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ shapes: existingShapes }),
      });
      
      const result = await lockShape(TEST_CANVAS_ID, 'shape1', 'user123');
      
      expect(result).toBe(false);
      expect(updateDoc).not.toHaveBeenCalled();
    });
    
    it('should acquire lock if previous lock has timed out', async () => {
      const oldTimestamp = Date.now() - 6000; // 6 seconds ago (timeout is 5 seconds)
      const existingShapes = [
        { 
          id: 'shape1', 
          type: 'rectangle',
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
      
      const result = await lockShape(TEST_CANVAS_ID, 'shape1', 'user123');
      
      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
    });
  });
  
  describe('unlockShape', () => {
    it('should unlock a locked shape', async () => {
      const existingShapes = [
        { 
          id: 'shape1', 
          type: 'rectangle',
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
      
      await unlockShape(TEST_CANVAS_ID, 'shape1', 'user123');
      
      expect(updateDoc).toHaveBeenCalled();
      const callArgs = updateDoc.mock.calls[0][1];
      
      const unlockedShape = callArgs.shapes.find(s => s.id === 'shape1');
      expect(unlockedShape).toMatchObject({
        isLocked: false,
        lockedBy: null,
        lockStartTime: null,
      });
    });
  });
  
  describe('toggleShapeVisibility', () => {
    it('should toggle shape visibility', async () => {
      const existingShapes = [
        { id: 'shape1', type: 'rectangle', visible: true },
        { id: 'shape2', type: 'circle', visible: true },
      ];
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ shapes: existingShapes }),
      });
      updateDoc.mockResolvedValue();
      
      await toggleShapeVisibility(TEST_CANVAS_ID, 'shape1', false);
      
      expect(updateDoc).toHaveBeenCalled();
      const callArgs = updateDoc.mock.calls[0][1];
      const updatedShape = callArgs.shapes.find(s => s.id === 'shape1');
      expect(updatedShape.visible).toBe(false);
    });
  });
  
  describe('toggleLayerLock', () => {
    it('should toggle layer lock status', async () => {
      const existingShapes = [
        { id: 'shape1', type: 'rectangle', layerLocked: false },
        { id: 'shape2', type: 'circle', layerLocked: false },
      ];
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ shapes: existingShapes }),
      });
      updateDoc.mockResolvedValue();
      
      await toggleLayerLock(TEST_CANVAS_ID, 'shape1', true, 'user123');
      
      expect(updateDoc).toHaveBeenCalled();
      const callArgs = updateDoc.mock.calls[0][1];
      const updatedShape = callArgs.shapes.find(s => s.id === 'shape1');
      expect(updatedShape.layerLocked).toBe(true);
      expect(updatedShape.layerLockedBy).toBe('user123');
    });
  });
  
  describe('releaseStaleLocks', () => {
    it('should release stale locks', async () => {
      const oldTimestamp = Date.now() - 6000; // 6 seconds ago
      const existingShapes = [
        { 
          id: 'shape1', 
          isLocked: true, 
          lockedBy: 'user123', 
          lockStartTime: oldTimestamp 
        },
        { 
          id: 'shape2', 
          isLocked: true, 
          lockedBy: 'user456', 
          lockStartTime: Date.now() 
        },
      ];
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ shapes: existingShapes }),
      });
      updateDoc.mockResolvedValue();
      
      await releaseStaleLocks(TEST_CANVAS_ID);
      
      expect(updateDoc).toHaveBeenCalled();
      const callArgs = updateDoc.mock.calls[0][1];
      const shape1 = callArgs.shapes.find(s => s.id === 'shape1');
      const shape2 = callArgs.shapes.find(s => s.id === 'shape2');
      
      // Shape1 lock should be released (stale)
      expect(shape1.isLocked).toBe(false);
      // Shape2 lock should remain (not stale)
      expect(shape2.isLocked).toBe(true);
    });
  });
  
  describe('reorderShapes', () => {
    it('should reorder shapes array', async () => {
      const mockShapes = [
        { id: 'shape2', type: 'circle' },
        { id: 'shape1', type: 'rectangle' },
      ];
      updateDoc.mockResolvedValue();
      
      await reorderShapes(TEST_CANVAS_ID, mockShapes);
      
      expect(updateDoc).toHaveBeenCalled();
      const callArgs = updateDoc.mock.calls[0][1];
      expect(callArgs.shapes).toEqual(mockShapes);
    });
  });
});
