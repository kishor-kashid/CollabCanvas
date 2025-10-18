// EditableShape.jsx - Wrapper for rectangles/circles/triangles with color editing on double-click
import { Rect, Circle, Line } from 'react-konva';
import { SHAPE_TYPES } from '../../utils/constants';
import { checkEditPermissions, checkLockAcquisition } from '../../utils/editPermissions';

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
    
    // Check edit permissions
    const permCheck = checkEditPermissions(isLayerLocked, isLocked);
    if (!permCheck.canEdit) {
      alert(permCheck.message);
      return;
    }
    
    // Trigger color edit mode - parent will handle lock acquisition
    if (onColorEditStart) {
      const lockAcquired = await onColorEditStart();
      const lockCheck = checkLockAcquisition(lockAcquired, 'shape');
      if (!lockCheck.success) {
        alert(lockCheck.message);
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

