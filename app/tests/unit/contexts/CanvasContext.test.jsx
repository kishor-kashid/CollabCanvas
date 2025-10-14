// Unit Tests for CanvasContext
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CanvasProvider, CanvasContext } from '../../../src/contexts/CanvasContext';
import { useContext } from 'react';

// Mock the hooks
vi.mock('../../../src/hooks/useCanvas', () => ({
  useCanvas: vi.fn(),
}));

vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock canvas service
vi.mock('../../../src/services/canvas', () => ({
  createShape: vi.fn(),
  updateShape: vi.fn(),
  deleteShape: vi.fn(),
  lockShape: vi.fn(),
  unlockShape: vi.fn(),
}));

// Mock cursors service
vi.mock('../../../src/services/cursors', () => ({
  cleanupStaleSessions: vi.fn(),
}));

import { useCanvas } from '../../../src/hooks/useCanvas';
import { useAuth } from '../../../src/hooks/useAuth';
import * as canvasService from '../../../src/services/canvas';
import { cleanupStaleSessions } from '../../../src/services/cursors';

// Test component that uses canvas context
function TestComponent() {
  const context = useContext(CanvasContext);
  
  if (!context) {
    return <div>No context</div>;
  }
  
  const { shapes, loading, error, addShape, deleteShape, updateShape, selectShape, selectedId } = context;
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <div data-testid="shapes-count">{shapes.length} shapes</div>
      {error && <div data-testid="error">{error}</div>}
      {selectedId && <div data-testid="selected-id">{selectedId}</div>}
      <button onClick={() => addShape('rectangle')}>Add Rectangle</button>
      <button onClick={() => addShape('circle')}>Add Circle</button>
      <button onClick={() => addShape('text')}>Add Text</button>
      <button onClick={() => selectShape('shape1')}>Select Shape 1</button>
      <button onClick={() => deleteShape('shape1')}>Delete Shape 1</button>
      <button onClick={() => updateShape('shape1', { x: 200 })}>Update Shape 1</button>
    </div>
  );
}

describe('CanvasContext', () => {
  const mockUser = {
    uid: 'user123',
    email: 'test@example.com',
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    useCanvas.mockReturnValue({
      shapes: [],
      loading: false,
      error: null,
      isOnline: true,
    });
    
    useAuth.mockReturnValue({
      currentUser: mockUser,
    });
    
    cleanupStaleSessions.mockResolvedValue();
  });
  
  describe('CanvasProvider', () => {
    it('should provide canvas context to children', () => {
      render(
        <CanvasProvider>
          <TestComponent />
        </CanvasProvider>
      );
      
      expect(screen.getByText('0 shapes')).toBeInTheDocument();
    });
    
    it('should show loading state when loading', () => {
      useCanvas.mockReturnValue({
        shapes: [],
        loading: true,
        error: null,
        isOnline: true,
      });
      
      render(
        <CanvasProvider>
          <TestComponent />
        </CanvasProvider>
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
    
    it('should display error when present', () => {
      useCanvas.mockReturnValue({
        shapes: [],
        loading: false,
        error: 'Failed to load shapes',
        isOnline: true,
      });
      
      render(
        <CanvasProvider>
          <TestComponent />
        </CanvasProvider>
      );
      
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to load shapes');
    });
    
    it('should sync shapes from Firestore', () => {
      const mockShapes = [
        { id: 'shape1', type: 'rectangle', x: 0, y: 0 },
        { id: 'shape2', type: 'circle', x: 100, y: 100 },
      ];
      
      useCanvas.mockReturnValue({
        shapes: mockShapes,
        loading: false,
        error: null,
        isOnline: true,
      });
      
      render(
        <CanvasProvider>
          <TestComponent />
        </CanvasProvider>
      );
      
      expect(screen.getByText('2 shapes')).toBeInTheDocument();
    });
    
    it('should cleanup stale sessions on mount', () => {
      render(
        <CanvasProvider>
          <TestComponent />
        </CanvasProvider>
      );
      
      expect(cleanupStaleSessions).toHaveBeenCalledWith(2 * 60 * 1000);
    });
  });
  
  describe('addShape', () => {
    it('should add rectangle shape', async () => {
      canvasService.createShape.mockResolvedValue();
      
      render(
        <CanvasProvider>
          <TestComponent />
        </CanvasProvider>
      );
      
      const addButton = screen.getByText('Add Rectangle');
      addButton.click();
      
      await waitFor(() => {
        expect(canvasService.createShape).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'rectangle',
            width: 100,
            height: 100,
            fill: '#cccccc',
          }),
          mockUser.uid
        );
      });
    });
    
    it('should add circle shape', async () => {
      canvasService.createShape.mockResolvedValue();
      
      render(
        <CanvasProvider>
          <TestComponent />
        </CanvasProvider>
      );
      
      const addButton = screen.getByText('Add Circle');
      addButton.click();
      
      await waitFor(() => {
        expect(canvasService.createShape).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'circle',
            radius: 50,
            fill: '#cccccc',
          }),
          mockUser.uid
        );
      });
    });
    
    it('should add text shape', async () => {
      canvasService.createShape.mockResolvedValue();
      
      render(
        <CanvasProvider>
          <TestComponent />
        </CanvasProvider>
      );
      
      const addButton = screen.getByText('Add Text');
      addButton.click();
      
      await waitFor(() => {
        expect(canvasService.createShape).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'text',
            text: 'Double-click to edit',
            fontSize: 18,
            fontFamily: 'Arial',
            fill: '#000000',
          }),
          mockUser.uid
        );
      });
    });
    
    it('should not add shape if user not logged in', async () => {
      useAuth.mockReturnValue({
        currentUser: null,
      });
      
      render(
        <CanvasProvider>
          <TestComponent />
        </CanvasProvider>
      );
      
      const addButton = screen.getByText('Add Rectangle');
      addButton.click();
      
      await waitFor(() => {
        expect(canvasService.createShape).not.toHaveBeenCalled();
      });
    });
    
    it('should generate unique shape IDs', async () => {
      canvasService.createShape.mockResolvedValue();
      
      render(
        <CanvasProvider>
          <TestComponent />
        </CanvasProvider>
      );
      
      const addButton = screen.getByText('Add Rectangle');
      addButton.click();
      addButton.click();
      
      await waitFor(() => {
        expect(canvasService.createShape).toHaveBeenCalledTimes(2);
        
        const firstCallId = canvasService.createShape.mock.calls[0][0].id;
        const secondCallId = canvasService.createShape.mock.calls[1][0].id;
        
        expect(firstCallId).not.toBe(secondCallId);
      });
    });
  });
  
  describe('updateShape', () => {
    it('should update shape properties', async () => {
      canvasService.updateShape.mockResolvedValue();
      
      render(
        <CanvasProvider>
          <TestComponent />
        </CanvasProvider>
      );
      
      const updateButton = screen.getByText('Update Shape 1');
      updateButton.click();
      
      await waitFor(() => {
        expect(canvasService.updateShape).toHaveBeenCalledWith(
          'shape1',
          { x: 200 },
          mockUser.uid
        );
      });
    });
    
    it('should not update shape if user not logged in', async () => {
      useAuth.mockReturnValue({
        currentUser: null,
      });
      
      render(
        <CanvasProvider>
          <TestComponent />
        </CanvasProvider>
      );
      
      const updateButton = screen.getByText('Update Shape 1');
      updateButton.click();
      
      await waitFor(() => {
        expect(canvasService.updateShape).not.toHaveBeenCalled();
      });
    });
  });
  
  describe('deleteShape', () => {
    it('should delete shape', async () => {
      const mockShapes = [
        { id: 'shape1', type: 'rectangle', x: 0, y: 0 },
      ];
      
      useCanvas.mockReturnValue({
        shapes: mockShapes,
        loading: false,
        error: null,
        isOnline: true,
      });
      
      canvasService.deleteShape.mockResolvedValue();
      
      render(
        <CanvasProvider>
          <TestComponent />
        </CanvasProvider>
      );
      
      const deleteButton = screen.getByText('Delete Shape 1');
      deleteButton.click();
      
      await waitFor(() => {
        expect(canvasService.deleteShape).toHaveBeenCalledWith('shape1');
      });
    });
    
    it('should not delete shape locked by another user', async () => {
      const mockShapes = [
        { 
          id: 'shape1', 
          type: 'rectangle', 
          x: 0, 
          y: 0,
          isLocked: true,
          lockedBy: 'otherUser',
        },
      ];
      
      useCanvas.mockReturnValue({
        shapes: mockShapes,
        loading: false,
        error: null,
        isOnline: true,
      });
      
      render(
        <CanvasProvider>
          <TestComponent />
        </CanvasProvider>
      );
      
      const deleteButton = screen.getByText('Delete Shape 1');
      deleteButton.click();
      
      await waitFor(() => {
        expect(canvasService.deleteShape).not.toHaveBeenCalled();
      });
    });
    
    it('should deselect shape after deletion if it was selected', async () => {
      const mockShapes = [
        { id: 'shape1', type: 'rectangle', x: 0, y: 0 },
      ];
      
      useCanvas.mockReturnValue({
        shapes: mockShapes,
        loading: false,
        error: null,
        isOnline: true,
      });
      
      canvasService.deleteShape.mockResolvedValue();
      
      render(
        <CanvasProvider>
          <TestComponent />
        </CanvasProvider>
      );
      
      // Select the shape first
      const selectButton = screen.getByText('Select Shape 1');
      selectButton.click();
      
      await waitFor(() => {
        expect(screen.getByTestId('selected-id')).toHaveTextContent('shape1');
      });
      
      // Then delete it
      const deleteButton = screen.getByText('Delete Shape 1');
      deleteButton.click();
      
      await waitFor(() => {
        expect(canvasService.deleteShape).toHaveBeenCalled();
        expect(screen.queryByTestId('selected-id')).not.toBeInTheDocument();
      });
    });
  });
  
  describe('selectShape', () => {
    it('should select shape', async () => {
      render(
        <CanvasProvider>
          <TestComponent />
        </CanvasProvider>
      );
      
      const selectButton = screen.getByText('Select Shape 1');
      selectButton.click();
      
      await waitFor(() => {
        expect(screen.getByTestId('selected-id')).toHaveTextContent('shape1');
      });
    });
  });
  
  describe('lockShape and unlockShape', () => {
    it('should lock shape', async () => {
      canvasService.lockShape.mockResolvedValue(true);
      
      const TestLockComponent = () => {
        const { lockShape } = useContext(CanvasContext);
        return <button onClick={() => lockShape('shape1')}>Lock</button>;
      };
      
      render(
        <CanvasProvider>
          <TestLockComponent />
        </CanvasProvider>
      );
      
      const lockButton = screen.getByText('Lock');
      lockButton.click();
      
      await waitFor(() => {
        expect(canvasService.lockShape).toHaveBeenCalledWith('shape1', mockUser.uid);
      });
    });
    
    it('should unlock shape', async () => {
      canvasService.unlockShape.mockResolvedValue();
      
      const TestUnlockComponent = () => {
        const { unlockShape } = useContext(CanvasContext);
        return <button onClick={() => unlockShape('shape1')}>Unlock</button>;
      };
      
      render(
        <CanvasProvider>
          <TestUnlockComponent />
        </CanvasProvider>
      );
      
      const unlockButton = screen.getByText('Unlock');
      unlockButton.click();
      
      await waitFor(() => {
        expect(canvasService.unlockShape).toHaveBeenCalledWith('shape1', mockUser.uid);
      });
    });
  });
  
  describe('zoom operations', () => {
    it('should provide zoom in functionality', async () => {
      const TestZoomComponent = () => {
        const { scale, zoomIn } = useContext(CanvasContext);
        return (
          <div>
            <div data-testid="scale">{scale}</div>
            <button onClick={zoomIn}>Zoom In</button>
          </div>
        );
      };
      
      render(
        <CanvasProvider>
          <TestZoomComponent />
        </CanvasProvider>
      );
      
      expect(screen.getByTestId('scale')).toHaveTextContent('1');
      
      const zoomInButton = screen.getByText('Zoom In');
      zoomInButton.click();
      
      await waitFor(() => {
        expect(screen.getByTestId('scale')).toHaveTextContent('1.2');
      });
    });
    
    it('should provide zoom out functionality', async () => {
      const TestZoomComponent = () => {
        const { scale, zoomOut } = useContext(CanvasContext);
        return (
          <div>
            <div data-testid="scale">{scale}</div>
            <button onClick={zoomOut}>Zoom Out</button>
          </div>
        );
      };
      
      render(
        <CanvasProvider>
          <TestZoomComponent />
        </CanvasProvider>
      );
      
      const zoomOutButton = screen.getByText('Zoom Out');
      zoomOutButton.click();
      
      // Scale should decrease from 1
      await waitFor(() => {
        const scale = parseFloat(screen.getByTestId('scale').textContent);
        expect(scale).toBeLessThan(1);
      });
    });
    
    it('should provide reset view functionality', async () => {
      const TestResetComponent = () => {
        const { scale, position, zoomIn, resetView } = useContext(CanvasContext);
        return (
          <div>
            <div data-testid="scale">{scale}</div>
            <div data-testid="position">{position.x},{position.y}</div>
            <button onClick={zoomIn}>Zoom In</button>
            <button onClick={resetView}>Reset</button>
          </div>
        );
      };
      
      render(
        <CanvasProvider>
          <TestResetComponent />
        </CanvasProvider>
      );
      
      // Zoom in first
      screen.getByText('Zoom In').click();
      await waitFor(() => {
        expect(screen.getByTestId('scale')).toHaveTextContent('1.2');
      });
      
      // Reset
      screen.getByText('Reset').click();
      await waitFor(() => {
        expect(screen.getByTestId('scale')).toHaveTextContent('1');
        expect(screen.getByTestId('position')).toHaveTextContent('0,0');
      });
    });
  });
});

