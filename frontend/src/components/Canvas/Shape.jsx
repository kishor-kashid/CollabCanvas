// Shape Component - Renders individual rectangles on the canvas

import { Rect, Transformer } from 'react-konva';
import { useRef, useEffect } from 'react';

export default function Shape({ 
  id, 
  x, 
  y, 
  width, 
  height, 
  fill,
  rotation = 0,
  scaleX = 1,
  scaleY = 1,
  isSelected, 
  isLocked, 
  lockedBy,
  onSelect,
  onDragStart,
  onDragEnd,
  onTransformStart,
  onTransformEnd,
  canvasWidth,
  canvasHeight
}) {
  const shapeRef = useRef(null);
  const trRef = useRef(null);
  
  // Attach transformer when shape is selected
  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);
  
  // Handle drag boundary constraints
  const handleDragMove = (e) => {
    const node = e.target;
    const x = node.x();
    const y = node.y();
    const width = node.width();
    const height = node.height();
    
    // Constrain within canvas boundaries
    const newX = Math.max(0, Math.min(x, canvasWidth - width));
    const newY = Math.max(0, Math.min(y, canvasHeight - height));
    
    node.x(newX);
    node.y(newY);
  };
  
  return (
    <>
      <Rect
        ref={shapeRef}
        id={id}
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        rotation={rotation}
        scaleX={scaleX}
        scaleY={scaleY}
        stroke={isSelected ? '#2196F3' : (isLocked ? '#FF5722' : '#666666')}
        strokeWidth={isSelected ? 3 : (isLocked ? 2 : 1)}
        shadowColor={isSelected ? '#2196F3' : 'transparent'}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={isSelected ? 0.5 : 0}
        draggable={!isLocked}
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={onDragStart}
        onDragMove={handleDragMove}
        onDragEnd={onDragEnd}
        onTransformStart={onTransformStart}
        onTransformEnd={onTransformEnd}
        opacity={isLocked ? 0.7 : 1}
      />
      
      {/* Transformer for selected shapes - Allows rotation, resize disabled for MVP */}
      {isSelected && !isLocked && (
        <Transformer
          ref={trRef}
          enabledAnchors={[]} // Disable resize for MVP - only rectangles, no resize
          rotateEnabled={true} // Allow rotation
          borderStroke="#2196F3"
          borderStrokeWidth={2}
          borderDash={[4, 4]}
        />
      )}
    </>
  );
}

