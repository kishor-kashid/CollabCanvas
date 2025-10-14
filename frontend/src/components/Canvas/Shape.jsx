// Shape Component - Renders different shape types on the canvas

import { Rect, Circle, Transformer } from 'react-konva';
import { useRef, useEffect } from 'react';
import { SHAPE_TYPES } from '../../utils/constants';
import EditableText from './EditableText';

export default function Shape({ 
  id,
  type,
  x, 
  y, 
  width, 
  height,
  radius, // For circles
  text, // For text shapes
  fontSize, // For text shapes
  fontFamily, // For text shapes
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
  onTextChange, // For text editing
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
    
    // Get dimensions based on shape type
    let shapeWidth, shapeHeight;
    if (type === SHAPE_TYPES.CIRCLE) {
      shapeWidth = radius * 2 * scaleX;
      shapeHeight = radius * 2 * scaleY;
    } else {
      shapeWidth = (width || node.width()) * scaleX;
      shapeHeight = (height || node.height()) * scaleY;
    }
    
    // Constrain within canvas boundaries
    const newX = Math.max(0, Math.min(x, canvasWidth - shapeWidth));
    const newY = Math.max(0, Math.min(y, canvasHeight - shapeHeight));
    
    node.x(newX);
    node.y(newY);
  };
  
  // Common shape props
  const commonProps = {
    ref: shapeRef,
    id,
    x,
    y,
    rotation,
    scaleX,
    scaleY,
    stroke: isSelected ? '#2196F3' : (isLocked ? '#FF5722' : '#666666'),
    strokeWidth: isSelected ? 3 : (isLocked ? 2 : 1),
    shadowColor: isSelected ? '#2196F3' : 'transparent',
    shadowBlur: isSelected ? 10 : 0,
    shadowOpacity: isSelected ? 0.5 : 0,
    draggable: !isLocked,
    onClick: onSelect,
    onTap: onSelect,
    onDragStart,
    onDragMove: handleDragMove,
    onDragEnd,
    onTransformStart,
    onTransformEnd,
    opacity: isLocked ? 0.7 : 1,
  };
  
  // Render shape based on type
  const renderShape = () => {
    switch (type) {
      case SHAPE_TYPES.RECTANGLE:
        return (
          <Rect
            {...commonProps}
            width={width}
            height={height}
            fill={fill}
          />
        );
      
      case SHAPE_TYPES.CIRCLE:
        return (
          <Circle
            {...commonProps}
            radius={radius}
            fill={fill}
          />
        );
      
      case SHAPE_TYPES.TEXT:
        return (
          <EditableText
            ref={shapeRef}
            id={id}
            x={x}
            y={y}
            width={width}
            height={height}
            text={text}
            fontSize={fontSize}
            fontFamily={fontFamily}
            fill={fill}
            rotation={rotation}
            scaleX={scaleX}
            scaleY={scaleY}
            isSelected={isSelected}
            isLocked={isLocked}
            onSelect={onSelect}
            onDragStart={onDragStart}
            onDragMove={commonProps.onDragMove}
            onDragEnd={onDragEnd}
            onTransformStart={onTransformStart}
            onTransformEnd={onTransformEnd}
            onTextChange={onTextChange}
            commonProps={commonProps}
          />
        );
      
      default:
        return (
          <Rect
            {...commonProps}
            width={width}
            height={height}
            fill={fill}
          />
        );
    }
  };
  
  return (
    <>
      {renderShape()}
      
      {/* Transformer for selected shapes - Enables rotation and resize */}
      {isSelected && !isLocked && (
        <Transformer
          ref={trRef}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
            'middle-left',
            'middle-right',
            'top-center',
            'bottom-center',
          ]} // Enable all resize handles
          rotateEnabled={true} // Allow rotation
          borderStroke="#2196F3"
          borderStrokeWidth={2}
          borderDash={[4, 4]}
          keepRatio={type === SHAPE_TYPES.CIRCLE} // Keep aspect ratio for circles
        />
      )}
    </>
  );
}

