// EditableShape.jsx - Wrapper for rectangles/circles/triangles with color editing on double-click
import { Rect, Circle, Line } from 'react-konva';
import { SHAPE_TYPES } from '../../utils/constants';

export default function EditableShape({ 
  id,
  type,
  x, 
  y, 
  width, 
  height,
  radius,
  fill,
  rotation,
  scaleX,
  scaleY,
  isSelected,
  isLocked,
  isLayerLocked, // Layer-level lock (prevents all editing)
  lockedBy,
  onSelect,
  onDragStart,
  onDragEnd,
  onTransformStart,
  onTransformEnd,
  onColorEditStart, // Signal color edit mode and acquire lock
  onColorEditEnd,   // Signal color edit done and release lock
  commonProps,
  shapeRef
}) {
  const handleDoubleClick = async (e) => {
    e.cancelBubble = true;
    
    // Check if layer is locked
    if (isLayerLocked) {
      console.log('⚠️ Cannot edit: Layer is locked. Unlock it in the Layers panel.');
      alert('This layer is locked. Unlock it in the Layers panel to edit.');
      return;
    }
    
    // Check if locked by another user
    if (isLocked) {
      console.log('⚠️ Cannot edit: Shape is being edited by another user');
      alert('This shape is currently being edited by another user. Please wait until they finish.');
      return;
    }
    
    // Trigger color edit mode - parent will handle lock acquisition
    if (onColorEditStart) {
      const lockAcquired = await onColorEditStart();
      if (!lockAcquired) {
        console.log('⚠️ Failed to acquire lock for color editing');
        alert('Unable to edit this shape right now. Please try again.');
      }
    }
  };

  // Triangle points calculation (points upward by default)
  const getTrianglePoints = () => {
    if (type !== SHAPE_TYPES.TRIANGLE) return [];
    return [
      width / 2, 0,         // Top point (center top)
      width, height,        // Bottom right
      0, height             // Bottom left
    ];
  };

  const shapeProps = {
    ref: shapeRef,
    id,
    x,
    y,
    fill,
    rotation,
    scaleX,
    scaleY,
    ...commonProps,
    onDblClick: handleDoubleClick,
    onDblTap: handleDoubleClick,
  };

  if (type === SHAPE_TYPES.RECTANGLE) {
    return <Rect {...shapeProps} width={width} height={height} />;
  } else if (type === SHAPE_TYPES.CIRCLE) {
    return <Circle {...shapeProps} radius={radius} />;
  } else if (type === SHAPE_TYPES.TRIANGLE) {
    return <Line {...shapeProps} points={getTrianglePoints()} closed={true} />;
  }
  
  return null;
}

