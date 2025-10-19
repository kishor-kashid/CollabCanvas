// Canvas Component - Main collaborative canvas with Konva

import { useContext, useEffect, useState, useMemo } from 'react';
import { Stage, Layer, Rect, Line, Text } from 'react-konva';
import { CanvasContext } from '../../contexts/CanvasContext';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../utils/constants';
import { useCursors } from '../../hooks/useCursors';
import Shape from './Shape';
import CursorMarker from '../Collaboration/CursorMarker';
import TextFormattingToolbar from './TextFormattingToolbar';
import ColorPicker from './ColorPicker';
import SelectionRectangle from './SelectionRectangle';
import TopToolbar from './TopToolbar';
import LeftSidebar from './LeftSidebar';
import AIChatButton from '../AI/AIChatButton';
import AIAssistant from '../AI/AIAssistant';
import { streamChatCompletion, handleFunctionCalls } from '../../services/aiService';
import { getToolSchemas, executeTool } from '../../services/aiTools';
import { serializeCanvasState } from '../../services/aiHelpers';
import { loadMessages, saveMessage, clearHistory } from '../../services/chatHistory';
import { 
  generateGridLines, 
  calculateConstrainedPosition,
  exportStageToPNG,
  downloadDataURL,
  getAIErrorMessage
} from '../../utils/canvasHelpers';
import { useComments } from '../../hooks/useComments';
import CommentPin from './CommentPin';
import CommentThread from './CommentThread';
import NewCommentDialog from './NewCommentDialog';
import { useAITasks } from '../../hooks/useAITasks';
import AITaskPin from './AITaskPin';
import AITaskDialog from './AITaskDialog';
import { createAITask, updateAITask, updateAITaskStatus, deleteAITask, deleteAITasksByStatus, getPendingAITasks } from '../../services/aiTasks';

export default function Canvas() {
  const {
    canvasId,
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
    updateShapesOptimistic,
    updateShapesBatch,
    deleteShape,
    deleteShapesOptimistic,
    deleteShapesBatch,
    lockShape,
    unlockShape,
    addShape,
    addShapesOptimistic,
    addShapesBatch,
    loading,
    // isOnline, // Available but not currently used
    currentUserId,
    currentColor,
    exportSelectionMode,
    setExportSelectionMode,
    selectionBox,
    setSelectionBox,
    bringShapeToFront,
    sendShapeToBack,
    bringShapeForward,
    sendShapeBackward,
    gridVisible,
    undo,
    redo,
    startActionBatch,
    recordAction,
    startAIBatch,
    endAIBatch,
    copyShape,
    pasteShape,
    duplicateShape,
    commentMode,
    setCommentMode,
    aiTaskMode,
    setAiTaskMode,
  } = useContext(CanvasContext);
  
  // Cursor tracking
  const { cursors, updateCursor } = useCursors(canvasId);
  
  // Comments
  const { comments, commentThreads, unresolvedCount } = useComments(canvasId);
  const [selectedCommentThread, setSelectedCommentThread] = useState(null);
  const [newCommentDialog, setNewCommentDialog] = useState(null); // { position, shapeId }
  
  // AI Tasks
  const { aiTasks, pendingTasks, pendingCount, completedCount } = useAITasks(canvasId, currentUserId);
  const [selectedAITask, setSelectedAITask] = useState(null);
  const [aiTaskDialog, setAiTaskDialog] = useState(null); // { position, shapeId, existingTask }
  
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
        try {
          const messages = await loadMessages(currentUserId, 50);
          if (messages.length > 0) {
            setAiMessages(messages);
          }
          setHasLoadedHistory(true);
        } catch (error) {
          console.error('Failed to load chat history:', error);
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
      
      // Escape key: Exit AI task mode, exit comment mode, close AI chat, or close color picker
      if (e.key === 'Escape') {
        // Priority 1: Exit AI task mode if active
        if (aiTaskMode) {
          e.preventDefault();
          setAiTaskMode(false);
          return;
        }
        
        // Priority 2: Exit comment mode if active
        if (commentMode) {
          e.preventDefault();
          setCommentMode(false);
          return;
        }
        
        // Priority 3: Close AI chat if open
        if (isAIChatOpen) {
          e.preventDefault();
          setIsAIChatOpen(false);
          return;
        }
        
        // Priority 4: Close color picker if in edit mode
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
            const newPosition = calculateConstrainedPosition(selectedShape, deltaX, deltaY);
            updateShape(editModeShapeId, newPosition);
          }
        }
      }
      
      // Copy: Cmd/Ctrl + C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedId && !isAIChatOpen) {
        e.preventDefault();
        copyShape(selectedId);
        return;
      }
      
      // Paste: Cmd/Ctrl + V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !isAIChatOpen) {
        e.preventDefault();
        pasteShape();
        return;
      }
      
      // Duplicate: Cmd/Ctrl + D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedId && !isAIChatOpen) {
        e.preventDefault();
        duplicateShape(selectedId);
        return;
      }
      
      // Undo: Cmd/Ctrl + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      
      // Redo: Cmd/Ctrl + Shift + Z
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
        return;
      }
      
      // Delete key only (not Backspace)
      if (e.key === 'Delete' && selectedId) {
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
  }, [selectedId, shapes, deleteShape, isColorPickerOpen, editModeShapeId, updateShape, deselectAll, isAIChatOpen, commentMode, setCommentMode, aiTaskMode, setAiTaskMode, bringShapeToFront, sendShapeToBack, bringShapeForward, sendShapeBackward, undo, redo, copyShape, pasteShape, duplicateShape]);
  
  // Handle clicking on stage background to deselect or add comment
  const handleStageClick = (e) => {
    // Check if clicked on empty area (stage itself)
    if (e.target === e.target.getStage()) {
      // If in AI task mode, show AI task dialog
      if (aiTaskMode) {
        const stage = e.target.getStage();
        const position = stage.getRelativePointerPosition();
        setAiTaskDialog({ position, shapeId: null, existingTask: null });
        return;
      }
      
      // If in comment mode, show new comment dialog
      if (commentMode) {
        const stage = e.target.getStage();
        const position = stage.getRelativePointerPosition();
        setNewCommentDialog({ position, shapeId: null });
        return;
      }
      
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
    
    // Update cursor position in RTDB (already in canvas coordinates)
    updateCursor(pointerPosition.x, pointerPosition.y);
  };
  
  // Handle shape selection
  const handleShapeSelect = (id) => {
    // If in AI task mode, add AI task to shape
    if (aiTaskMode) {
      const shape = shapes.find(s => s.id === id);
      if (shape) {
        setAiTaskDialog({ 
          position: { x: shape.x, y: shape.y }, 
          shapeId: id,
          existingTask: null
        });
      }
      return;
    }
    
    // If in comment mode, add comment to shape
    if (commentMode) {
      const shape = shapes.find(s => s.id === id);
      if (shape) {
        setNewCommentDialog({ 
          position: { x: shape.x, y: shape.y }, 
          shapeId: id 
        });
      }
      return;
    }
    
    // Check if shape is layer-locked
    const shape = shapes.find(s => s.id === id);
    if (shape?.layerLocked) {
      return;
    }
    selectShape(id);
  };
  
  // Handle shape drag start - acquire lock
  const handleShapeDragStart = (id) => async () => {
    await lockShape(id);
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
    await lockShape(id);
  };
  
  // Handle text change for text shapes
  const handleTextChange = (id) => async (newText) => {
    await updateShape(id, { text: newText });
  };
  
  // Handle text edit start - acquire lock
  const handleTextEditLock = (id) => async () => {
    const success = await lockShape(id);
    return success;
  };
  
  // Handle text edit end - release lock
  const handleTextEditUnlock = (id) => async () => {
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
    const success = await lockShape(id);
    if (success) {
      setIsColorPickerOpen(true);
      setEditModeShapeId(id); // Enter edit mode
    }
    return success;
  };
  
  // Handle color edit unlock (for rectangles/circles)
  const handleColorEditUnlock = (id) => async () => {
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
      setIsExportingSelection(true);
      
      const stage = stageRef.current;
      const dataURL = await exportStageToPNG(stage, selectionBox, setSelectionBox);
      
      downloadDataURL(dataURL, `collabcanvas-selection-${Date.now()}.png`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export selection. Please try again.');
    } finally {
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
  
  
  // Get selected shape for formatting toolbar (memoized for performance)
  const selectedShape = useMemo(() => 
    shapes.find(s => s.id === selectedId), 
    [shapes, selectedId]
  );
  
  // Memoize grid lines to avoid regenerating on every render
  const gridLines = useMemo(() => generateGridLines(), []);
  
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
  
  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-100">
      {/* Top Toolbar */}
      <TopToolbar />
      
      {/* Left Sidebar */}
      <LeftSidebar />
      
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
       (selectedShape.type === 'rectangle' || selectedShape.type === 'circle' || selectedShape.type === 'triangle') && (
        <ColorPicker
          selectedShape={selectedShape}
          currentColor={selectedShape.fill}
          onColorChange={handleColorChange}
          onClose={() => handleColorEditUnlock(selectedId)()}
          position={{
            top: 155, // Position below the color button (toolbar height + button height + gap)
            left: (window.innerWidth / 2) - 90, // Offset left from center to align with color button position
            transform: 'translateX(-50%)', // Center the picker below button
          }}
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
          {gridVisible && gridLines.map(line => (
            <Line
              key={line.key}
              points={line.points}
              stroke={line.stroke}
              strokeWidth={line.strokeWidth}
              listening={false}
            />
          ))}
          
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
          
          {/* Render Shapes - Filter out hidden shapes */}
          {shapes
            .filter(shape => shape.visible !== false) // Only render visible shapes
            .map((shape) => (
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
              opacity={shape.opacity || 1.0}
              blendMode={shape.blendMode || 'source-over'}
              isSelected={shape.id === selectedId}
              isLocked={shape.isLocked && shape.lockedBy !== currentUserId}
              lockedBy={shape.lockedBy}
              isLayerLocked={shape.layerLocked || false}
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
          
          {/* Render comment pins */}
          {comments
            .filter(c => !c.parentId) // Only main comments (not replies)
            .map(comment => {
              const thread = commentThreads[comment.threadId || comment.id];
              let position = comment.position;
              
              // If comment is attached to a shape, use shape's position
              if (comment.shapeId) {
                const shape = shapes.find(s => s.id === comment.shapeId);
                if (shape) {
                  position = { x: shape.x, y: shape.y };
                }
              }
              
              if (!position) return null;
              
              return (
                <CommentPin
                  key={comment.id}
                  x={position.x}
                  y={position.y}
                  commentCount={thread?.length || 1}
                  isResolved={comment.isResolved}
                  isSelected={selectedCommentThread && selectedCommentThread[0]?.id === comment.id}
                  onClick={() => setSelectedCommentThread(thread)}
                  stageScale={scale}
                />
              );
            })
          }
          
          {/* Render AI task pins */}
          {aiTasks.map(task => {
              let position = task.position;
              
              // If task is attached to a shape, use shape's position
              if (task.shapeId) {
                const shape = shapes.find(s => s.id === task.shapeId);
                if (shape) {
                  position = { x: shape.x, y: shape.y };
                }
              }
              
              if (!position) return null;
              
              return (
                <AITaskPin
                  key={task.id}
                  x={position.x}
                  y={position.y}
                  status={task.status}
                  isSelected={selectedAITask && selectedAITask.id === task.id}
                  onClick={() => {
                    setSelectedAITask(task);
                    // Allow editing pending tasks, just show details for completed/failed
                    if (task.status === 'pending') {
                      setAiTaskDialog({
                        position: task.position,
                        shapeId: task.shapeId,
                        existingTask: task
                      });
                    }
                  }}
                  stageScale={scale}
                />
              );
            })
          }
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
            await clearHistory(currentUserId);
            setAiMessages([]);
            setHasLoadedHistory(false); // Allow reloading
          } catch (error) {
            console.error('Failed to clear chat history:', error);
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
          
          // Check if user wants to execute AI tasks
          const isTaskExecutionRequest = /execute|implement|run|do|apply/i.test(message) && 
                                         /tasks?|commands?|assigned/i.test(message);
          
          if (isTaskExecutionRequest && pendingTasks.length > 0) {
            // Show AI is processing tasks
            setAiMessages(prev => [...prev, {
              role: 'assistant',
              content: `Found ${pendingTasks.length} pending task(s):\n\n${pendingTasks.map((t, i) => 
                `${i + 1}. ${t.command}`
              ).join('\n')}\n\n⏳ Executing now...`,
              timestamp: Date.now(),
              isStreaming: true,
            }]);
            
            startAIBatch(); // All tasks = 1 undo action
            
            // Execute each task
            let completedCount = 0;
            let failedCount = 0;
            
            for (let i = 0; i < pendingTasks.length; i++) {
              const task = pendingTasks[i];
              
              try {
                // Build enhanced command with context
                let enhancedCommand = task.command;
                
                // Add position context
                if (task.position) {
                  enhancedCommand += ` at position (${Math.round(task.position.x)}, ${Math.round(task.position.y)})`;
                }
                
                // Add shape context
                if (task.shapeId) {
                  const shape = shapes.find(s => s.id === task.shapeId);
                  if (shape) {
                    enhancedCommand += ` on the ${shape.fill || ''} ${shape.type}`;
                  }
                }
                
                // Execute via AI
                const conversationHistory = [{
                  role: 'user',
                  content: enhancedCommand,
                }];
                
                await new Promise((resolve) => {
                  streamChatCompletion(
                    conversationHistory,
                    getToolSchemas(),
                    () => {}, // Don't show intermediate chunks
                    async (result) => {
                      if (result.toolCalls) {
                        const canvasContext = {
                          shapes,
                          selectedId,
                          currentUserId,
                          currentColor,
                          addShape,
                          addShapesOptimistic,
                          addShapesBatch,
                          updateShape,
                          updateShapesOptimistic,
                          updateShapesBatch,
                          deleteShape,
                          deleteShapesOptimistic,
                          deleteShapesBatch,
                          selectShape,
                          viewport: { position, scale, width: window.innerWidth, height: window.innerHeight },
                        };
                        
                        await handleFunctionCalls(
                          result.toolCalls,
                          async (toolName, params) => executeTool(toolName, params, canvasContext)
                        );
                      }
                      
                      // Mark task as completed
                      await updateAITaskStatus(task.id, 'completed', result.content || 'Done');
                      completedCount++;
                      resolve();
                    },
                    async (error) => {
                      // Mark task as failed
                      await updateAITaskStatus(task.id, 'failed', error);
                      failedCount++;
                      resolve();
                    }
                  );
                });
                
                // Small delay between tasks
                await new Promise(resolve => setTimeout(resolve, 100));
                
              } catch (error) {
                console.error(`Failed to execute task ${task.id}:`, error);
                await updateAITaskStatus(task.id, 'failed', error.message);
                failedCount++;
              }
            }
            
            endAIBatch(); // Commit all as single undo
            
            // Final summary
            setAiMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                role: 'assistant',
                content: `✅ Completed executing ${pendingTasks.length} task(s):\n\n${pendingTasks.map((t, i) => 
                  `${i + 1}. ${t.command}`
                ).join('\n')}\n\n**Results:** ${completedCount} completed${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
                timestamp: Date.now(),
              };
              return newMessages;
            });
            
            // Save final message
            try {
              await saveMessage(currentUserId, {
                role: 'assistant',
                content: `Executed ${completedCount} AI tasks successfully.`,
                timestamp: Date.now(),
              });
            } catch (error) {
              console.error('Failed to save assistant message:', error);
            }
            
            setIsAILoading(false);
            return; // Don't process as normal message
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
                // Handle function calls if any
                if (result.toolCalls && result.toolCalls.length > 0) {
                  
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
                    currentColor,
                    addShape,
                    addShapesOptimistic,
                    addShapesBatch,
                    updateShape,
                    updateShapesOptimistic,
                    updateShapesBatch,
                    deleteShape,
                    deleteShapesOptimistic,
                    deleteShapesBatch,
                    selectShape,
                    // Add viewport info for smart positioning
                    viewport: {
                      position,  // Stage offset
                      scale,     // Zoom level
                      width: window.innerWidth,
                      height: window.innerHeight,
                    },
                  };
                  
                  // Start collecting AI actions as a single batch
                  startAIBatch();
                  
                  const toolResults = await handleFunctionCalls(
                    result.toolCalls,
                    async (toolName, params) => {
                      return await executeTool(toolName, params, canvasContext);
                    }
                  );
                  
                  // End AI batch and record as single undo action
                  endAIBatch();
                  
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
                    async () => {
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
                console.error('AI Error:', error);
                
                const errorMessage = getAIErrorMessage(error);
                
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
            console.error('Message send error:', error);
            
            const errorMessage = getAIErrorMessage(error);
            
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
      
      {/* Comment Thread Panel */}
      {selectedCommentThread && (
        <CommentThread
          canvasId={canvasId}
          thread={selectedCommentThread}
          shapeId={selectedCommentThread[0]?.shapeId}
          position={selectedCommentThread[0]?.position}
          onClose={() => setSelectedCommentThread(null)}
        />
      )}
      
      {/* New Comment Dialog */}
      {newCommentDialog && (
        <NewCommentDialog
          canvasId={canvasId}
          position={newCommentDialog.position}
          shapeId={newCommentDialog.shapeId}
          onClose={() => setNewCommentDialog(null)}
          onSuccess={() => {}}
        />
      )}
      
      {/* AI Task Dialog */}
      {aiTaskDialog && (
        <AITaskDialog
          isOpen={true}
          position={aiTaskDialog.position}
          shapeId={aiTaskDialog.shapeId}
          shapes={shapes}
          existingTask={aiTaskDialog.existingTask}
          onClose={() => {
            setAiTaskDialog(null);
            setSelectedAITask(null);
          }}
          onSubmit={async (command, position, shapeId) => {
            try {
              if (aiTaskDialog.existingTask) {
                // Update existing task
                await updateAITask(aiTaskDialog.existingTask.id, { command });
              } else {
                // Create new task
                await createAITask(
                  canvasId,
                  { command, position, shapeId },
                  { uid: currentUserId, displayName: 'User', email: '' }
                );
              }
            } catch (error) {
              console.error('Error saving AI task:', error);
              alert('Failed to save AI task. Please try again.');
            }
          }}
          onDelete={async (taskId) => {
            try {
              await deleteAITask(taskId);
              setAiTaskDialog(null);
              setSelectedAITask(null);
            } catch (error) {
              console.error('Error deleting AI task:', error);
              alert('Failed to delete AI task. Please try again.');
            }
          }}
        />
      )}
    </div>
  );
}

