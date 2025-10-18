// CommentPin.jsx - Visual pin marker on canvas

import { Circle, Group, Text } from 'react-konva';

/**
 * Comment pin marker displayed on the canvas
 */
export default function CommentPin({ 
  x, 
  y, 
  commentCount, 
  isResolved, 
  isSelected,
  onClick,
  stageScale 
}) {
  const pinSize = 64 / Math.max(stageScale, 0.5); // 0.8x of 80 = 64
  const fontSize = 38.4 / Math.max(stageScale, 0.5); // 0.8x of 48 = 38.4
  
  return (
    <Group
      x={x}
      y={y}
      onClick={onClick}
      onTap={onClick}
    >
      {/* Pin circle */}
      <Circle
        radius={pinSize}
        fill={isResolved ? '#10B981' : '#3B82F6'} // Green if resolved, blue otherwise
        stroke={isSelected ? '#FCD34D' : '#FFFFFF'}
        strokeWidth={isSelected ? 9.6 / stageScale : 6.4 / stageScale} // 0.8x stroke
        shadowColor="#000000"
        shadowBlur={12.8} // 0.8x shadow: 16 → 12.8
        shadowOpacity={0.3}
        opacity={isResolved ? 0.6 : 1}
        listening={true}
      />
      
      {/* Comment count */}
      <Text
        text={commentCount.toString()}
        fontSize={fontSize}
        fill="#FFFFFF"
        fontStyle="bold"
        align="center"
        verticalAlign="middle"
        offsetX={fontSize / 3}
        offsetY={fontSize / 2}
        listening={false}
      />
    </Group>
  );
}

