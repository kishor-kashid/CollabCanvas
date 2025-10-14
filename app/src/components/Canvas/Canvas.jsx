// Canvas Component - Main collaborative canvas with Konva

import { useContext, useEffect } from 'react';
import { Stage, Layer, Rect, Line, Text } from 'react-konva';
import { CanvasContext } from '../../contexts/CanvasContext';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../utils/constants';
import { useCursors } from '../../hooks/useCursors';
import Shape from './Shape';
import CursorMarker from '../Collaboration/CursorMarker';

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
    loading,
    isOnline,
    currentUserId,
  } = useContext(CanvasContext);
  
  // Cursor tracking
  const { cursors, updateCursor } = useCursors();
  
  useEffect(() => {
    // Set up performance optimizations
    if (stageRef.current) {
      const stage = stageRef.current;
      // Enable optimizations for better performance
      stage.listening(true);
    }
  }, [stageRef]);
  
  // Handle keyboard events for delete
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Delete or Backspace key
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        const selectedShape = shapes.find(s => s.id === selectedId);
        // Only delete if not locked
        if (selectedShape && !selectedShape.isLocked) {
          deleteShape(selectedId);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, shapes, deleteShape]);
  
  // Handle clicking on stage background to deselect
  const handleStageClick = (e) => {
    // Check if clicked on empty area (stage itself)
    if (e.target === e.target.getStage()) {
      deselectAll();
    }
  };
  
  // Handle mouse move to track cursor position
  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    if (!stage) return;
    
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
  const handleTextChange = (id) => (newText) => {
    updateShape(id, { text: newText });
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
  
  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-100">
      {/* Canvas Info Overlay */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-4 py-2 text-sm">
        <div className="flex items-center space-x-4">
          <div>
            <span className="font-semibold text-gray-700">Zoom:</span>{' '}
            <span className="text-blue-600 font-mono">{(scale * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Position:</span>{' '}
            <span className="text-blue-600 font-mono">
              ({Math.round(position.x)}, {Math.round(position.y)})
            </span>
          </div>
          <div className="text-gray-500 text-xs">
            Canvas: {CANVAS_WIDTH}x{CANVAS_HEIGHT}px
          </div>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-600">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </div>
      
      {/* Instructions Overlay */}
      <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-4 py-3 text-xs max-w-xs">
        <h4 className="font-semibold text-gray-800 mb-2">Canvas Controls:</h4>
        <ul className="space-y-1 text-gray-600">
          <li>🖱️ <strong>Pan:</strong> Click & drag the canvas</li>
          <li>🔍 <strong>Zoom:</strong> Scroll mousewheel</li>
          <li>⌨️ <strong>Reset:</strong> Use control panel (left)</li>
        </ul>
      </div>
      
      {/* Konva Stage */}
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onMouseMove={handleMouseMove}
        style={{ cursor: 'grab' }}
        onMouseDown={(e) => {
          // Change cursor to grabbing when dragging
          if (e.target === e.target.getStage()) {
            e.target.getStage().container().style.cursor = 'grabbing';
          }
        }}
        onMouseUp={(e) => {
          // Reset cursor after drag
          e.target.getStage().container().style.cursor = 'grab';
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
              fill={shape.fill}
              rotation={shape.rotation || 0}
              scaleX={shape.scaleX || 1}
              scaleY={shape.scaleY || 1}
              isSelected={shape.id === selectedId}
              isLocked={shape.isLocked && shape.lockedBy !== currentUserId}
              lockedBy={shape.lockedBy}
              onSelect={() => handleShapeSelect(shape.id)}
              onDragStart={handleShapeDragStart(shape.id)}
              onDragEnd={handleShapeDragEnd(shape.id)}
              onTransformStart={handleShapeTransformStart(shape.id)}
              onTransformEnd={handleShapeTransformEnd(shape.id)}
              onTextChange={handleTextChange(shape.id)}
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
        </Layer>
      </Stage>
    </div>
  );
}

