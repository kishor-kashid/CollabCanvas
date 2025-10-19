// AITaskPin.jsx - Visual AI task pin marker on canvas

import { Circle, Group, Text } from 'react-konva';

/**
 * AI Task pin marker displayed on the canvas
 */
export default function AITaskPin({ 
  x, 
  y, 
  status, 
  isSelected,
  onClick,
  stageScale 
}) {
  const pinSize = 64 / Math.max(stageScale, 0.5);
  const iconSize = 35 / Math.max(stageScale, 0.5);
  
  // Different colors and opacity by status
  const fillColor = {
    pending: '#9333EA',    // Purple - not executed yet
    completed: '#10B981',  // Green - successfully executed
    failed: '#EF4444',     // Red - execution failed
  }[status] || '#9333EA';
  
  const opacity = status === 'completed' ? 0.5 : 1.0; // Fade when done
  
  // Icon for each status
  const icon = {
    pending: '🤖',
    completed: '✓',
    failed: '✗',
  }[status] || '🤖';
  
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
        fill={fillColor}
        stroke={isSelected ? '#FCD34D' : '#FFFFFF'}
        strokeWidth={isSelected ? 9.6 / stageScale : 6.4 / stageScale}
        shadowColor="#000000"
        shadowBlur={12.8}
        shadowOpacity={0.3}
        opacity={opacity}
        listening={true}
      />
      
      {/* Status icon */}
      {status === 'pending' && (
        <Text
          text={icon}
          fontSize={iconSize}
          offsetX={iconSize / 2}
          offsetY={iconSize / 2}
          listening={false}
        />
      )}
      
      {status === 'completed' && (
        <Text
          text={icon}
          fontSize={iconSize + 5}
          fill="#FFFFFF"
          fontStyle="bold"
          offsetX={(iconSize - 5) / 2}
          offsetY={(iconSize + 5) / 2}
          listening={false}
        />
      )}
      
      {status === 'failed' && (
        <Text
          text={icon}
          fontSize={iconSize + 5}
          fill="#FFFFFF"
          fontStyle="bold"
          offsetX={(iconSize - 5) / 2}
          offsetY={(iconSize + 5) / 2}
          listening={false}
        />
      )}
    </Group>
  );
}

