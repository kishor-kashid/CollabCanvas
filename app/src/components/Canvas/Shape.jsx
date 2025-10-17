// Shape Component - Renders different shape types on the canvas

import { Transformer } from 'react-konva';
import { useRef, useEffect } from 'react';
import { SHAPE_TYPES } from '../../utils/constants';
import EditableText from './EditableText';
import EditableShape from './EditableShape';

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
  fontStyle, // For text formatting (bold/italic)
  fill,
  rotation = 0,
  scaleX = 1,
  scaleY = 1,
  opacity = 1.0, // Opacity (0.0 to 1.0)
  blendMode = 'source-over', // Blend mode
  isSelected, 
  isLocked, 
  isLayerLocked, // Layer-level lock (prevents all editing)
  lockedBy,
  isInEditMode, // For color editing mode with arrow key navigation
  onSelect,
  onDragStart,
  onDragEnd,
  onTransformStart,
  onTransformEnd,
  onTextChange, // For text editing
  onEditLock, // For text editing lock
  onEditUnlock, // For text editing unlock
  onColorEditLock, // For color editing lock (rectangles/circles)
  onColorEditUnlock, // For color editing unlock (rectangles/circles)
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
    
    let newX = x;
    let newY = y;
    
    if (type === SHAPE_TYPES.CIRCLE) {
      // For circles, x and y represent the CENTER of the circle
      // So we constrain based on the radius (scaled)
      const effectiveRadius = radius * Math.max(scaleX, scaleY);
      newX = Math.max(effectiveRadius, Math.min(x, canvasWidth - effectiveRadius));
      newY = Math.max(effectiveRadius, Math.min(y, canvasHeight - effectiveRadius));
    } else {
      // For rectangles, triangles, and text, we need to account for rotation
      // Get the bounding box which includes rotation, scale, and position
      const box = node.getClientRect({ relativeTo: node.getParent() });
      
      // Calculate how much we need to adjust to stay within bounds
      let adjustX = 0;
      let adjustY = 0;
      
      // Check left boundary
      if (box.x < 0) {
        adjustX = -box.x;
      }
      // Check right boundary
      else if (box.x + box.width > canvasWidth) {
        adjustX = canvasWidth - (box.x + box.width);
      }
      
      // Check top boundary
      if (box.y < 0) {
        adjustY = -box.y;
      }
      // Check bottom boundary
      else if (box.y + box.height > canvasHeight) {
        adjustY = canvasHeight - (box.y + box.height);
      }
      
      newX = x + adjustX;
      newY = y + adjustY;
    }
    
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
    // Amber border for layer-locked, purple for edit mode, blue for selected, red for locked, gray for normal
    stroke: isLayerLocked ? '#F59E0B' :
            (isLocked ? '#FF5722' : 
            (isInEditMode ? '#9333EA' : 
            (isSelected ? '#2196F3' : '#666666'))),
    strokeWidth: isSelected ? 3 : (isLocked || isLayerLocked ? 2 : 1),
    shadowColor: isLayerLocked ? '#F59E0B' : (isInEditMode ? '#9333EA' : (isSelected ? '#2196F3' : 'transparent')),
    shadowBlur: isSelected || isLayerLocked ? 10 : 0,
    shadowOpacity: isSelected || isLayerLocked ? 0.5 : 0,
    draggable: !isLocked && !isLayerLocked, // Disable dragging for both locks
    onClick: onSelect,
    onTap: onSelect,
    onDragStart,
    onDragMove: handleDragMove,
    onDragEnd,
    onTransformStart,
    onTransformEnd,
    // Apply opacity (reduce if locked, otherwise use shape opacity)
    opacity: (isLocked || isLayerLocked) ? 0.7 : (opacity || 1.0),
    // Apply blend mode
    globalCompositeOperation: blendMode || 'source-over',
  };
  
  // Render shape based on type
  const renderShape = () => {
    switch (type) {
      case SHAPE_TYPES.RECTANGLE:
      case SHAPE_TYPES.CIRCLE:
      case SHAPE_TYPES.TRIANGLE:
        return (
          <EditableShape
            id={id}
            type={type}
            x={x}
            y={y}
            width={width}
            height={height}
            radius={radius}
            fill={fill}
            rotation={rotation}
            scaleX={scaleX}
            scaleY={scaleY}
            isSelected={isSelected}
            isLocked={isLocked}
            isLayerLocked={isLayerLocked}
            lockedBy={lockedBy}
            onSelect={onSelect}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onTransformStart={onTransformStart}
            onTransformEnd={onTransformEnd}
            onColorEditStart={onColorEditLock}
            onColorEditEnd={onColorEditUnlock}
            commonProps={commonProps}
            shapeRef={shapeRef}
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
            fontStyle={fontStyle}
            fill={fill}
            rotation={rotation}
            scaleX={scaleX}
            scaleY={scaleY}
            isSelected={isSelected}
            isLocked={isLocked}
            isLayerLocked={isLayerLocked}
            lockedBy={lockedBy}
            onSelect={onSelect}
            onDragStart={onDragStart}
            onDragMove={commonProps.onDragMove}
            onDragEnd={onDragEnd}
            onTransformStart={onTransformStart}
            onTransformEnd={onTransformEnd}
            onTextChange={onTextChange}
            onLock={onEditLock}
            onUnlock={onEditUnlock}
            commonProps={commonProps}
          />
        );
      
      default:
        return (
          <EditableShape
            id={id}
            type={SHAPE_TYPES.RECTANGLE}
            x={x}
            y={y}
            width={width}
            height={height}
            fill={fill}
            rotation={rotation}
            scaleX={scaleX}
            scaleY={scaleY}
            isSelected={isSelected}
            isLocked={isLocked}
            lockedBy={lockedBy}
            onSelect={onSelect}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onTransformStart={onTransformStart}
            onTransformEnd={onTransformEnd}
            onColorEditStart={onColorEditLock}
            onColorEditEnd={onColorEditUnlock}
            commonProps={commonProps}
            shapeRef={shapeRef}
          />
        );
    }
  };
  
  return (
    <>
      {renderShape()}
      
      {/* Transformer for selected shapes - Enables rotation and resize */}
      {isSelected && !isLocked && !isLayerLocked && (
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

