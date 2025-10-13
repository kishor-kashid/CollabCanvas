// Canvas Component - Main collaborative canvas with Konva

import { useContext, useEffect } from 'react';
import { Stage, Layer, Rect, Line, Text } from 'react-konva';
import { CanvasContext } from '../../contexts/CanvasContext';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../utils/constants';

export default function Canvas() {
  const {
    stageRef,
    scale,
    position,
    handleWheel,
    handleDragEnd,
  } = useContext(CanvasContext);
  
  useEffect(() => {
    // Set up performance optimizations
    if (stageRef.current) {
      const stage = stageRef.current;
      // Enable optimizations for better performance
      stage.listening(true);
    }
  }, [stageRef]);
  
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
          
          {/* Shapes will be rendered here in PR #4 */}
        </Layer>
      </Stage>
    </div>
  );
}

