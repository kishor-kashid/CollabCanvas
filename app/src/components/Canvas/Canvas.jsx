// Canvas Component - Main collaborative canvas with Konva

import { useContext, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Line, Text } from 'react-konva';
import { CanvasContext } from '../../contexts/CanvasContext';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../utils/constants';
import { useCursors } from '../../hooks/useCursors';
import Shape from './Shape';
import CursorMarker from '../Collaboration/CursorMarker';
import TextFormattingToolbar from './TextFormattingToolbar';
import ColorPicker from './ColorPicker';
import SelectionRectangle from './SelectionRectangle';
import AIChatButton from '../AI/AIChatButton';
import AIAssistant from '../AI/AIAssistant';
import { streamChatCompletion, handleFunctionCalls } from '../../services/aiService';
import { getToolSchemas, executeTool } from '../../services/aiTools';
import { serializeCanvasState } from '../../services/aiHelpers';
import { loadMessages, saveMessage, clearHistory } from '../../services/chatHistory';

export default function Canvas() {
  const {
    stageRef,
    scale,
    position,
    handleWheel,
    handleDragEnd,
    shapes,
    selectedId,
    selectShape,
    deselectAll,
    updateShape,
    deleteShape,
    lockShape,
    unlockShape,
    addShape,
    loading,
    isOnline,
    currentUserId,
    exportSelectionMode,
    setExportSelectionMode,
    selectionBox,
    setSelectionBox,
    bringShapeToFront,
    sendShapeToBack,
    bringShapeForward,
    sendShapeBackward,
  } = useContext(CanvasContext);
  
  // Cursor tracking
  const { cursors, updateCursor } = useCursors();
  
  // Color picker state
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [editModeShapeId, setEditModeShapeId] = useState(null); // Track which shape is in edit mode
  
  // Selection box drawing state
  const [isDrawingSelection, setIsDrawingSelection] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [isExportingSelection, setIsExportingSelection] = useState(false);
  
  // AI Chat state
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isChatHistoryLoading, setIsChatHistoryLoading] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  
  useEffect(() => {
    // Set up performance optimizations
    if (stageRef.current) {
      const stage = stageRef.current;
      // Enable optimizations for better performance
      stage.listening(true);
    }
  }, [stageRef]);
  
  // Load chat history when chat opens
  useEffect(() => {
    const loadChatHistory = async () => {
      if (isAIChatOpen && currentUserId && !hasLoadedHistory) {
        setIsChatHistoryLoading(true);
        try {
          console.log('📖 Loading chat history for user:', currentUserId);
          const messages = await loadMessages(currentUserId, 50);
          console.log('📖 Loaded messages:', messages.length);
          if (messages.length > 0) {
            setAiMessages(messages);
          }
          setHasLoadedHistory(true);
        } catch (error) {
          console.error('Failed to load chat history:', error);
        } finally {
          setIsChatHistoryLoading(false);
        }
      }
    };
    
    loadChatHistory();
  }, [isAIChatOpen, currentUserId, hasLoadedHistory]);
  
  // Handle keyboard events for delete and arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K: Toggle AI chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsAIChatOpen(prev => !prev);
        return;
      }
      
      // Escape key: Close AI chat if open, otherwise close color picker
      if (e.key === 'Escape') {
        if (isAIChatOpen) {
          e.preventDefault();
          setIsAIChatOpen(false);
          return;
        }
        
        if (isColorPickerOpen && editModeShapeId) {
          e.preventDefault();
          handleColorEditUnlock(editModeShapeId)();
          deselectAll(); // Deselect completely
          return;
        }
      }
      
      // Arrow keys - Only work in edit mode (when color picker is open)
      if (editModeShapeId && isColorPickerOpen) {
        const selectedShape = shapes.find(s => s.id === editModeShapeId);
        
        // Only for rectangles and circles, not text
        if (selectedShape && (selectedShape.type === 'rectangle' || selectedShape.type === 'circle')) {
          let deltaX = 0;
          let deltaY = 0;
          
          switch (e.key) {
            case 'ArrowUp':
              e.preventDefault();
              deltaY = -50;
              break;
            case 'ArrowDown':
              e.preventDefault();
              deltaY = 50;
              break;
            case 'ArrowLeft':
              e.preventDefault();
              deltaX = -50;
              break;
            case 'ArrowRight':
              e.preventDefault();
              deltaX = 50;
              break;
            default:
              break;
          }
          
          if (deltaX !== 0 || deltaY !== 0) {
            // Calculate new position
            let newX = selectedShape.x + deltaX;
            let newY = selectedShape.y + deltaY;
            
            // Apply boundary constraints based on shape type
            if (selectedShape.type === 'circle') {
              // For circles, x and y represent the CENTER
              const effectiveRadius = selectedShape.radius * Math.max(selectedShape.scaleX || 1, selectedShape.scaleY || 1);
              newX = Math.max(effectiveRadius, Math.min(newX, CANVAS_WIDTH - effectiveRadius));
              newY = Math.max(effectiveRadius, Math.min(newY, CANVAS_HEIGHT - effectiveRadius));
            } else {
              // For rectangles, x and y represent the TOP-LEFT corner
              // Need to account for rotation using bounding box
              const shapeWidth = (selectedShape.width || 0) * (selectedShape.scaleX || 1);
              const shapeHeight = (selectedShape.height || 0) * (selectedShape.scaleY || 1);
              
              // Simple constraint for non-rotated or slightly rotated shapes
              if (!selectedShape.rotation || Math.abs(selectedShape.rotation) < 5) {
                newX = Math.max(0, Math.min(newX, CANVAS_WIDTH - shapeWidth));
                newY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - shapeHeight));
              } else {
                // For rotated rectangles, use a more conservative boundary
                // Calculate the diagonal to ensure the rotated shape fits
                const diagonal = Math.sqrt(shapeWidth * shapeWidth + shapeHeight * shapeHeight) / 2;
                newX = Math.max(diagonal, Math.min(newX, CANVAS_WIDTH - diagonal));
                newY = Math.max(diagonal, Math.min(newY, CANVAS_HEIGHT - diagonal));
              }
            }
            
            // Update shape position with constrained values
            updateShape(editModeShapeId, {
              x: newX,
              y: newY
            });
          }
        }
      }
      
      // Delete or Backspace key
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        const selectedShape = shapes.find(s => s.id === selectedId);
        // Only delete if not locked
        if (selectedShape && !selectedShape.isLocked) {
          deleteShape(selectedId);
        }
      }
      
      // Z-index keyboard shortcuts
      // Cmd/Ctrl + ] : Bring to Front
      if ((e.ctrlKey || e.metaKey) && e.key === ']' && selectedId) {
        e.preventDefault();
        bringShapeToFront(selectedId);
        return;
      }
      
      // Cmd/Ctrl + [ : Send to Back
      if ((e.ctrlKey || e.metaKey) && e.key === '[' && selectedId) {
        e.preventDefault();
        sendShapeToBack(selectedId);
        return;
      }
      
      // Cmd/Ctrl + Shift + ] : Bring Forward
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '}' && selectedId) {
        e.preventDefault();
        bringShapeForward(selectedId);
        return;
      }
      
      // Cmd/Ctrl + Shift + [ : Send Backward
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '{' && selectedId) {
        e.preventDefault();
        sendShapeBackward(selectedId);
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, shapes, deleteShape, isColorPickerOpen, editModeShapeId, updateShape, deselectAll, isAIChatOpen, bringShapeToFront, sendShapeToBack, bringShapeForward, sendShapeBackward]);
  
  // Handle clicking on stage background to deselect
  const handleStageClick = (e) => {
    // Check if clicked on empty area (stage itself)
    if (e.target === e.target.getStage()) {
      // If in edit mode, exit completely
      if (isColorPickerOpen && editModeShapeId) {
        handleColorEditUnlock(editModeShapeId)();
      }
      deselectAll();
    }
  };
  
  // Handle mouse move to track cursor position
  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    if (!stage) return;
    
    // Handle selection box drawing if in export selection mode
    handleSelectionMouseMove(e);
    
    // Get pointer position in canvas coordinates (relative to stage transformation)
    // This automatically accounts for stage scale and position
    const pointerPosition = stage.getRelativePointerPosition();
    if (!pointerPosition) return;
    
    // Debug: Log cursor position every 100 updates
    if (Math.random() < 0.01) {
      console.log('📍 My cursor position (canvas coords):', {
        x: Math.round(pointerPosition.x),
        y: Math.round(pointerPosition.y),
        scale: scale.toFixed(2),
        stagePos: { x: Math.round(position.x), y: Math.round(position.y) }
      });
    }
    
    // Update cursor position in RTDB (already in canvas coordinates)
    updateCursor(pointerPosition.x, pointerPosition.y);
  };
  
  // Handle shape selection
  const handleShapeSelect = (id) => {
    selectShape(id);
  };
  
  // Handle shape drag start - acquire lock
  const handleShapeDragStart = (id) => async () => {
    const success = await lockShape(id);
    if (!success) {
      console.warn('Could not acquire lock on shape');
    }
  };
  
  // Handle shape drag end - update position and release lock
  const handleShapeDragEnd = (id) => async (e) => {
    const node = e.target;
    await updateShape(id, {
      x: node.x(),
      y: node.y(),
    });
    await unlockShape(id);
  };
  
  // Handle shape transform start - acquire lock
  const handleShapeTransformStart = (id) => async () => {
    const success = await lockShape(id);
    if (!success) {
      console.warn('Could not acquire lock on shape');
    }
  };
  
  // Handle text change for text shapes
  const handleTextChange = (id) => async (newText) => {
    console.log('💾 Updating text for shape:', id, 'New text:', newText);
    await updateShape(id, { text: newText });
    console.log('✅ Text updated successfully');
  };
  
  // Handle text edit start - acquire lock
  const handleTextEditLock = (id) => async () => {
    console.log('📝 Acquiring lock for text editing:', id);
    const success = await lockShape(id);
    if (!success) {
      console.warn('⚠️ Could not acquire lock for text editing');
    }
    return success;
  };
  
  // Handle text edit end - release lock
  const handleTextEditUnlock = (id) => async () => {
    console.log('📝 Releasing lock after text editing:', id);
    await unlockShape(id);
  };
  
  // Handle format changes for text
  const handleFormatChange = (formatUpdates) => {
    if (selectedId) {
      updateShape(selectedId, formatUpdates);
    }
  };
  
  // Handle color edit lock (for rectangles/circles)
  const handleColorEditLock = (id) => async () => {
    console.log('🎨 Acquiring lock for color editing:', id);
    const success = await lockShape(id);
    if (success) {
      setIsColorPickerOpen(true);
      setEditModeShapeId(id); // Enter edit mode
    }
    return success;
  };
  
  // Handle color edit unlock (for rectangles/circles)
  const handleColorEditUnlock = (id) => async () => {
    console.log('🎨 Releasing lock for color editing:', id);
    await unlockShape(id);
    setIsColorPickerOpen(false);
    setEditModeShapeId(null); // Exit edit mode
  };
  
  // Handle color change
  const handleColorChange = (newColor) => {
    if (selectedId) {
      updateShape(selectedId, { fill: newColor });
    }
  };
  
  // Handle selection box mouse down
  const handleSelectionMouseDown = (e) => {
    if (!exportSelectionMode) return;
    
    // Only start drawing if clicking on empty area (stage)
    if (e.target !== e.target.getStage()) return;
    
    const stage = e.target.getStage();
    const pointerPosition = stage.getRelativePointerPosition();
    
    setIsDrawingSelection(true);
    setSelectionStart(pointerPosition);
    setSelectionBox({ x: pointerPosition.x, y: pointerPosition.y, width: 0, height: 0 });
  };
  
  // Handle selection box mouse move
  const handleSelectionMouseMove = (e) => {
    if (!exportSelectionMode || !isDrawingSelection || !selectionStart) return;
    
    const stage = e.target.getStage();
    const pointerPosition = stage.getRelativePointerPosition();
    
    setSelectionBox({
      x: selectionStart.x,
      y: selectionStart.y,
      width: pointerPosition.x - selectionStart.x,
      height: pointerPosition.y - selectionStart.y,
    });
  };
  
  // Handle selection box mouse up - complete selection and export
  const handleSelectionMouseUp = async () => {
    if (!exportSelectionMode || !isDrawingSelection || !selectionBox) return;
    
    setIsDrawingSelection(false);
    
    // Check if selection is large enough (minimum 50x50 pixels)
    const width = Math.abs(selectionBox.width);
    const height = Math.abs(selectionBox.height);
    
    if (width < 50 || height < 50) {
      alert('Selection area is too small. Please draw a larger selection.');
      setSelectionBox(null);
      setSelectionStart(null);
      return;
    }
    
    // Export the selected area
    await exportSelection();
    
    // Reset selection state
    setSelectionBox(null);
    setSelectionStart(null);
    setExportSelectionMode(false);
  };
  
  // Export selected area at full quality
  const exportSelection = async () => {
    if (!stageRef?.current || !selectionBox) return;
    
    try {
      // Set exporting state to show loading cursor
      setIsExportingSelection(true);
      
      const stage = stageRef.current;
      
      // Normalize selection box (handle negative width/height)
      const normalizedX = selectionBox.width < 0 ? selectionBox.x + selectionBox.width : selectionBox.x;
      const normalizedY = selectionBox.height < 0 ? selectionBox.y + selectionBox.height : selectionBox.y;
      const normalizedWidth = Math.abs(selectionBox.width);
      const normalizedHeight = Math.abs(selectionBox.height);
      
      // Store the selection box to restore later
      const savedSelectionBox = { ...selectionBox };
      
      // Temporarily hide selection box
      setSelectionBox(null);
      
      // Wait for React to update (hide the selection rectangle)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Store original view settings
      const originalScale = stage.scaleX();
      const originalPosition = { x: stage.x(), y: stage.y() };
      
      // Temporarily reset to default view
      stage.scale({ x: 1, y: 1 });
      stage.position({ x: 0, y: 0 });
      
      // Generate PNG for selected area at full quality
      const dataURL = stage.toDataURL({
        pixelRatio: 1, // Full quality
        mimeType: 'image/png',
        quality: 1,
        x: normalizedX,
        y: normalizedY,
        width: normalizedWidth,
        height: normalizedHeight
      });
      
      // Restore original view
      stage.scale({ x: originalScale, y: originalScale });
      stage.position(originalPosition);
      
      // Trigger download
      const link = document.createElement('a');
      link.download = `collabcanvas-selection-${Date.now()}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Selection exported successfully');
    } catch (error) {
      console.error('❌ Export failed:', error);
      alert('Failed to export selection. Please try again.');
    } finally {
      // Reset exporting state
      setIsExportingSelection(false);
    }
  };
  
  // Handle shape transform end - update rotation, scale, and dimensions, release lock
  const handleShapeTransformEnd = (id) => async (e) => {
    const node = e.target;
    
    // Get the shape to check its type
    const shape = shapes.find(s => s.id === id);
    if (!shape) return;
    
    const updates = {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
    };
    
    // For circles, update radius based on scale
    if (shape.type === 'circle' && shape.radius) {
      const newRadius = shape.radius * node.scaleX();
      updates.radius = newRadius;
      updates.scaleX = 1;
      updates.scaleY = 1;
      
      // Reset the node's scale to 1
      node.scaleX(1);
      node.scaleY(1);
    }
    // For rectangles and text, update width/height based on scale
    else if (shape.width !== undefined && shape.height !== undefined) {
      const newWidth = Math.max(5, shape.width * node.scaleX());
      const newHeight = Math.max(5, shape.height * node.scaleY());
      updates.width = newWidth;
      updates.height = newHeight;
      
      // For text shapes, also scale the font size
      if (shape.type === 'text' && shape.fontSize) {
        const avgScale = (node.scaleX() + node.scaleY()) / 2;
        const newFontSize = Math.max(8, Math.round(shape.fontSize * avgScale));
        updates.fontSize = newFontSize;
      }
      
      updates.scaleX = 1;
      updates.scaleY = 1;
      
      // Reset the node's scale to 1
      node.scaleX(1);
      node.scaleY(1);
    }
    
    await updateShape(id, updates);
    await unlockShape(id);
  };
  
  // Generate grid lines for visual reference
  const generateGrid = () => {
    const lines = [];
    const gridSize = 100; // Grid cell size in pixels
    const lineColor = '#e0e0e0';
    const majorLineColor = '#bdbdbd';
    
    // Vertical lines
    for (let i = 0; i <= CANVAS_WIDTH; i += gridSize) {
      const isMajor = i % 500 === 0; // Every 500px is a major line
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i, 0, i, CANVAS_HEIGHT]}
          stroke={isMajor ? majorLineColor : lineColor}
          strokeWidth={isMajor ? 1 : 0.5}
          listening={false}
        />
      );
    }
    
    // Horizontal lines
    for (let i = 0; i <= CANVAS_HEIGHT; i += gridSize) {
      const isMajor = i % 500 === 0;
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i, CANVAS_WIDTH, i]}
          stroke={isMajor ? majorLineColor : lineColor}
          strokeWidth={isMajor ? 1 : 0.5}
          listening={false}
        />
      );
    }
    
    return lines;
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 font-semibold">Loading canvas...</p>
          <p className="text-sm text-gray-500 mt-2">Syncing shapes from Firestore</p>
        </div>
      </div>
    );
  }
  
  // Get selected shape for formatting toolbar
  const selectedShape = shapes.find(s => s.id === selectedId);
  
  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-100">
      {/* Text Formatting Toolbar */}
      {selectedShape && selectedShape.type === 'text' && stageRef.current && (
        <TextFormattingToolbar
          selectedShape={selectedShape}
          onFormatChange={handleFormatChange}
          position={{
            x: (selectedShape.x * scale) + position.x,
            y: (selectedShape.y * scale) + position.y
          }}
        />
      )}
      
      {/* Color Picker for Rectangles and Circles */}
      {isColorPickerOpen && selectedShape && 
       (selectedShape.type === 'rectangle' || selectedShape.type === 'circle') && (
        <ColorPicker
          selectedShape={selectedShape}
          currentColor={selectedShape.fill}
          onColorChange={handleColorChange}
          onClose={() => handleColorEditUnlock(selectedId)()}
        />
      )}
      
      {/* Export Loading Overlay */}
      {isExportingSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4">
            <svg className="animate-spin h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <p className="text-lg font-semibold text-gray-800">Exporting Selection...</p>
            <p className="text-sm text-gray-600">Please wait while we generate your image</p>
          </div>
        </div>
      )}
      
      {/* Konva Stage */}
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable={!exportSelectionMode}
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onMouseMove={handleMouseMove}
        style={{ 
          cursor: isExportingSelection 
            ? 'wait' 
            : exportSelectionMode 
              ? 'crosshair' 
              : 'grab' 
        }}
        onMouseDown={(e) => {
          if (exportSelectionMode) {
            handleSelectionMouseDown(e);
          } else {
          // Change cursor to grabbing when dragging
          if (e.target === e.target.getStage()) {
            e.target.getStage().container().style.cursor = 'grabbing';
            }
          }
        }}
        onMouseUp={(e) => {
          if (exportSelectionMode) {
            handleSelectionMouseUp();
          } else {
          // Reset cursor after drag
          e.target.getStage().container().style.cursor = 'grab';
          }
        }}
      >
        <Layer>
          {/* Canvas Background */}
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill="#ffffff"
            listening={false}
          />
          
          {/* Grid */}
          {generateGrid()}
          
          {/* Canvas Border */}
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            stroke="#2196F3"
            strokeWidth={4}
            listening={false}
          />
          
          {/* Origin Marker */}
          <Rect
            x={0}
            y={0}
            width={50}
            height={50}
            fill="#4CAF50"
            opacity={0.5}
            listening={false}
          />
          <Text
            x={10}
            y={15}
            text="(0,0)"
            fontSize={14}
            fontFamily="monospace"
            fill="#1B5E20"
            listening={false}
          />
          
          {/* Center Marker */}
          <Rect
            x={CANVAS_WIDTH / 2 - 25}
            y={CANVAS_HEIGHT / 2 - 25}
            width={50}
            height={50}
            fill="#FF9800"
            opacity={0.5}
            listening={false}
          />
          <Text
            x={CANVAS_WIDTH / 2 - 30}
            y={CANVAS_HEIGHT / 2 - 5}
            text="CENTER"
            fontSize={12}
            fontFamily="monospace"
            fill="#E65100"
            listening={false}
          />
          
          {/* Render Shapes */}
          {shapes.map((shape) => (
            <Shape
              key={shape.id}
              id={shape.id}
              type={shape.type}
              x={shape.x}
              y={shape.y}
              width={shape.width}
              height={shape.height}
              radius={shape.radius}
              text={shape.text}
              fontSize={shape.fontSize}
              fontFamily={shape.fontFamily}
              fontStyle={shape.fontStyle}
              fill={shape.fill}
              rotation={shape.rotation || 0}
              scaleX={shape.scaleX || 1}
              scaleY={shape.scaleY || 1}
              isSelected={shape.id === selectedId}
              isLocked={shape.isLocked && shape.lockedBy !== currentUserId}
              lockedBy={shape.lockedBy}
              isInEditMode={shape.id === editModeShapeId && isColorPickerOpen}
              onSelect={() => handleShapeSelect(shape.id)}
              onDragStart={handleShapeDragStart(shape.id)}
              onDragEnd={handleShapeDragEnd(shape.id)}
              onTransformStart={handleShapeTransformStart(shape.id)}
              onTransformEnd={handleShapeTransformEnd(shape.id)}
              onTextChange={handleTextChange(shape.id)}
              onEditLock={handleTextEditLock(shape.id)}
              onEditUnlock={handleTextEditUnlock(shape.id)}
              onColorEditLock={handleColorEditLock(shape.id)}
              onColorEditUnlock={handleColorEditUnlock(shape.id)}
              canvasWidth={CANVAS_WIDTH}
              canvasHeight={CANVAS_HEIGHT}
            />
          ))}
      
          {/* Render other users' cursors inside the stage */}
      {Object.entries(cursors).map(([userId, cursor]) => {
        if (!cursor || cursor.cursorX === undefined || cursor.cursorY === undefined) {
          return null;
        }
        
            // Debug: Log received cursor positions occasionally
            if (Math.random() < 0.005) {
              console.log('👁️ Rendering cursor for', cursor.displayName, '(canvas coords):', {
                x: Math.round(cursor.cursorX),
                y: Math.round(cursor.cursorY),
                myScale: scale.toFixed(2),
                myStagePos: { x: Math.round(position.x), y: Math.round(position.y) }
              });
            }
        
        return (
              <CursorMarker
            key={userId}
                x={cursor.cursorX}
                y={cursor.cursorY}
            color={cursor.cursorColor}
            displayName={cursor.displayName}
                stageScale={scale}
          />
        );
      })}
          
          {/* Render selection rectangle when in export selection mode */}
          {exportSelectionMode && selectionBox && (
            <SelectionRectangle
              x={selectionBox.x}
              y={selectionBox.y}
              width={selectionBox.width}
              height={selectionBox.height}
              stageScale={scale}
            />
          )}
        </Layer>
      </Stage>
      
      {/* AI Chat Components */}
      <AIChatButton 
        onClick={() => setIsAIChatOpen(!isAIChatOpen)}
        isOpen={isAIChatOpen}
      />
      
      <AIAssistant 
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        onClearHistory={async () => {
          try {
            console.log('🗑️ Clearing chat history for user:', currentUserId);
            await clearHistory(currentUserId);
            setAiMessages([]);
            setHasLoadedHistory(false); // Allow reloading
            console.log('✅ Chat history cleared');
          } catch (error) {
            console.error('❌ Failed to clear chat history:', error);
            alert('Failed to clear chat history. Please try again.');
          }
        }}
        onRetry={(originalMessage) => {
          // Remove error messages for this retry
          setAiMessages(prev => prev.filter(msg => !(msg.isError && msg.originalMessage === originalMessage)));
        }}
        onSendMessage={async (message) => {
          // Add user message
          const userMessage = {
            role: 'user',
            content: message,
            timestamp: Date.now(),
          };
          setAiMessages(prev => [...prev, userMessage]);
          setIsAILoading(true);
          
          // Save user message to Firestore
          try {
            await saveMessage(currentUserId, userMessage);
          } catch (error) {
            console.error('Failed to save user message:', error);
          }
          
          try {
            // Prepare conversation history
            const conversationHistory = aiMessages.map(msg => ({
              role: msg.role,
              content: msg.content,
            }));
            
            // Add current canvas state to context
            const canvasState = serializeCanvasState(shapes, selectedId);
            const systemContext = `Current canvas state: ${JSON.stringify(canvasState)}`;
            
            conversationHistory.push({
              role: 'system',
              content: systemContext,
            });
            
            conversationHistory.push({
              role: 'user',
              content: message,
            });
            
            // Prepare for streaming response
            let aiResponseContent = '';
            const aiMessageIndex = aiMessages.length + 1;
            
            // Stream the response
            await streamChatCompletion(
              conversationHistory,
              getToolSchemas(),
              // onChunk callback
              (chunk) => {
                if (chunk.type === 'content') {
                  aiResponseContent += chunk.content;
                  
                  // Update streaming message
                  setAiMessages(prev => {
                    const newMessages = [...prev];
                    const existingIndex = newMessages.findIndex((m, i) => i === aiMessageIndex && m.role === 'assistant');
                    
                    if (existingIndex >= 0) {
                      newMessages[existingIndex] = {
                        ...newMessages[existingIndex],
                        content: aiResponseContent,
                        isStreaming: true,
                      };
                    } else {
                      newMessages.push({
                        role: 'assistant',
                        content: aiResponseContent,
                        timestamp: Date.now(),
                        isStreaming: true,
                      });
                    }
                    
                    return newMessages;
                  });
                }
              },
              // onComplete callback
              async (result) => {
                console.log('🤖 Stream complete:', result);
                
                // Handle function calls if any
                if (result.toolCalls && result.toolCalls.length > 0) {
                  console.log('🔧 Executing tool calls:', result.toolCalls);
                  
                  // Show function execution in progress
                  const functionMessages = result.toolCalls.map(tc => ({
                    name: tc.function.name,
                    status: 'executing',
                  }));
                  
                  setAiMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'assistant') {
                      lastMessage.functionCalls = functionMessages;
                      lastMessage.isStreaming = false;
                    }
                    return [...newMessages];
                  });
                  
                  // Execute the tools
                  const canvasContext = {
                    shapes,
                    selectedId,
                    currentUserId,
                    addShape,
                    updateShape,
                    deleteShape,
                    selectShape,
                    // Add viewport info for smart positioning
                    viewport: {
                      position,  // Stage offset
                      scale,     // Zoom level
                      width: window.innerWidth,
                      height: window.innerHeight,
                    },
                  };
                  
                  const toolResults = await handleFunctionCalls(
                    result.toolCalls,
                    async (toolName, params) => {
                      return await executeTool(toolName, params, canvasContext);
                    }
                  );
                  
                  // Update function call status
                  setAiMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'assistant' && lastMessage.functionCalls) {
                      lastMessage.functionCalls = lastMessage.functionCalls.map((fc, i) => ({
                        ...fc,
                        status: 'success',
                        result: toolResults[i]?.content || 'Done',
                      }));
                    }
                    return [...newMessages];
                  });
                  
                  // Send tool results back to AI for final response
                  const followUpMessages = [
                    ...conversationHistory,
                    {
                      role: 'assistant',
                      content: result.content || '',
                      tool_calls: result.toolCalls,
                    },
                    ...toolResults,
                  ];
                  
                  // Get final AI response
                  let finalResponse = '';
                  await streamChatCompletion(
                    followUpMessages,
                    getToolSchemas(),
                    (chunk) => {
                      if (chunk.type === 'content') {
                        finalResponse += chunk.content;
                      }
                    },
                    async (finalResult) => {
                      const assistantMessage = {
                        role: 'assistant',
                        content: finalResponse,
                        timestamp: Date.now(),
                      };
                      setAiMessages(prev => [...prev, assistantMessage]);
                      
                      // Save assistant message to Firestore
                      try {
                        await saveMessage(currentUserId, assistantMessage);
                      } catch (error) {
                        console.error('Failed to save assistant message:', error);
                      }
                      
                      setIsAILoading(false);
                    },
                    (error) => {
                      console.error('Final response error:', error);
                      setAiMessages(prev => [...prev, {
                        role: 'assistant',
                        content: 'Completed the actions successfully!',
                        timestamp: Date.now(),
                      }]);
                      setIsAILoading(false);
                    }
                  );
                } else {
                  // No function calls, just finish streaming
                  let finalMessage = null;
                  setAiMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'assistant') {
                      lastMessage.isStreaming = false;
                      finalMessage = lastMessage;
                    }
                    return [...newMessages];
                  });
                  
                  // Save assistant message to Firestore
                  if (finalMessage) {
                    try {
                      await saveMessage(currentUserId, finalMessage);
                    } catch (error) {
                      console.error('Failed to save assistant message:', error);
                    }
                  }
                  
                  setIsAILoading(false);
                }
              },
              // onError callback
              (error) => {
                console.error('🚨 AI Error:', error);
                
                // Provide user-friendly error messages
                let errorMessage = 'Sorry, I encountered an error. Please try again.';
                if (error?.includes('API key')) {
                  errorMessage = '🔑 AI is not configured. Please add your OpenAI API key to continue.';
                } else if (error?.includes('network') || error?.includes('fetch')) {
                  errorMessage = '📡 Connection lost. Please check your internet and try again.';
                } else if (error?.includes('rate limit')) {
                  errorMessage = '⏱️ Too many requests. Please wait a moment and try again.';
                } else if (error?.includes('timeout')) {
                  errorMessage = '⏱️ Request timed out. The AI is taking too long to respond. Please try again.';
                } else if (error) {
                  errorMessage = `❌ ${error}`;
                }
                
                setAiMessages(prev => [...prev, {
                  role: 'assistant',
                  content: errorMessage,
                  timestamp: Date.now(),
                  isError: true,
                  originalMessage: message, // Store for retry
                }]);
                setIsAILoading(false);
              }
            );
          } catch (error) {
            console.error('🚨 Message send error:', error);
            
            // Provide user-friendly error messages
            let errorMessage = '❌ Failed to send message. Please try again.';
            if (error?.message?.includes('API key')) {
              errorMessage = '🔑 AI is not configured. Please add your OpenAI API key to continue.';
            } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
              errorMessage = '📡 Connection lost. Please check your internet and try again.';
            }
            
            setAiMessages(prev => [...prev, {
              role: 'assistant',
              content: errorMessage,
              timestamp: Date.now(),
              isError: true,
              originalMessage: message, // Store for retry
            }]);
            setIsAILoading(false);
          }
        }}
        messages={aiMessages}
        isLoading={isAILoading}
      />
    </div>
  );
}

