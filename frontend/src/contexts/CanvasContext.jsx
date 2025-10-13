// CanvasContext - Canvas state and operations provider

import { createContext, useState, useRef } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, MIN_ZOOM, MAX_ZOOM } from '../utils/constants';

export const CanvasContext = createContext(null);

/**
 * CanvasProvider component that provides canvas state and operations
 */
export function CanvasProvider({ children }) {
  const [shapes, setShapes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const stageRef = useRef(null);
  
  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Reset view to initial state
  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  
  // Zoom in
  const zoomIn = () => {
    const newScale = Math.min(scale * 1.2, MAX_ZOOM);
    setScale(newScale);
  };
  
  // Zoom out
  const zoomOut = () => {
    const newScale = Math.max(scale / 1.2, MIN_ZOOM);
    setScale(newScale);
  };
  
  // Handle wheel zoom (will be called from Canvas component)
  const handleWheel = (e) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    // Zoom direction
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const scaleBy = 1.05;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    // Clamp scale
    const clampedScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));
    
    // Calculate new position to zoom to cursor
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    
    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };
    
    setScale(clampedScale);
    setPosition(newPos);
  };
  
  // Constrain stage position to canvas boundaries
  const constrainPosition = (pos, currentScale) => {
    const maxX = 0;
    const maxY = 0;
    const minX = -CANVAS_WIDTH * currentScale + window.innerWidth;
    const minY = -CANVAS_HEIGHT * currentScale + window.innerHeight;
    
    return {
      x: Math.max(minX, Math.min(maxX, pos.x)),
      y: Math.max(minY, Math.min(maxY, pos.y)),
    };
  };
  
  // Handle stage drag end (pan)
  const handleDragEnd = (e) => {
    const newPos = constrainPosition(
      { x: e.target.x(), y: e.target.y() },
      scale
    );
    setPosition(newPos);
  };
  
  // Shape operations to be implemented in PR #4-5:
  // - addShape(shapeData)
  // - updateShape(id, updates)
  // - deleteShape(id)
  // - selectShape(id)
  // - lockShape(id, userId)
  // - unlockShape(id)
  
  const value = {
    shapes,
    selectedId,
    stageRef,
    scale,
    position,
    setShapes,
    setSelectedId,
    setScale,
    setPosition,
    resetView,
    zoomIn,
    zoomOut,
    handleWheel,
    handleDragEnd,
    constrainPosition,
  };
  
  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
}

