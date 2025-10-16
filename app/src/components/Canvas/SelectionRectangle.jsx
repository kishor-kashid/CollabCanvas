// SelectionRectangle Component - Visual feedback for export area selection

import { Rect, Group, Text, Circle } from 'react-konva';

export default function SelectionRectangle({ x, y, width, height, stageScale }) {
  // Apply inverse scaling to maintain constant visual size
  const inverseScale = 1 / stageScale;
  
  // Calculate dimensions in pixels
  const widthPx = Math.abs(width);
  const heightPx = Math.abs(height);
  
  // Normalize coordinates for negative width/height (when dragging left/up)
  const normalizedX = width < 0 ? x + width : x;
  const normalizedY = height < 0 ? y + height : y;
  
  return (
    <Group>
      {/* Main selection rectangle */}
      <Rect
        x={normalizedX}
        y={normalizedY}
        width={widthPx}
        height={heightPx}
        stroke="#3B82F6"
        strokeWidth={2 * inverseScale}
        dash={[10 * inverseScale, 5 * inverseScale]}
        fill="rgba(59, 130, 246, 0.1)"
        listening={false}
      />
      
      {/* Corner markers */}
      {[
        { x: normalizedX, y: normalizedY }, // Top-left
        { x: normalizedX + widthPx, y: normalizedY }, // Top-right
        { x: normalizedX, y: normalizedY + heightPx }, // Bottom-left
        { x: normalizedX + widthPx, y: normalizedY + heightPx }, // Bottom-right
      ].map((corner, index) => (
        <Circle
          key={index}
          x={corner.x}
          y={corner.y}
          radius={6 * inverseScale}
          fill="#3B82F6"
          stroke="#FFFFFF"
          strokeWidth={2 * inverseScale}
          listening={false}
        />
      ))}
      
      {/* Dimension labels */}
      {widthPx > 100 && heightPx > 100 && (
        <Group>
          {/* Width label (top center) */}
          <Rect
            x={normalizedX + widthPx / 2 - 50 * inverseScale}
            y={normalizedY - 25 * inverseScale}
            width={100 * inverseScale}
            height={20 * inverseScale}
            fill="rgba(59, 130, 246, 0.9)"
            cornerRadius={4 * inverseScale}
            listening={false}
          />
          <Text
            x={normalizedX + widthPx / 2 - 50 * inverseScale}
            y={normalizedY - 25 * inverseScale}
            width={100 * inverseScale}
            height={20 * inverseScale}
            text={`${Math.round(widthPx)}px`}
            fontSize={12 * inverseScale}
            fontFamily="monospace"
            fill="#FFFFFF"
            align="center"
            verticalAlign="middle"
            listening={false}
          />
          
          {/* Height label (left center) */}
          <Rect
            x={normalizedX - 60 * inverseScale}
            y={normalizedY + heightPx / 2 - 10 * inverseScale}
            width={50 * inverseScale}
            height={20 * inverseScale}
            fill="rgba(59, 130, 246, 0.9)"
            cornerRadius={4 * inverseScale}
            listening={false}
          />
          <Text
            x={normalizedX - 60 * inverseScale}
            y={normalizedY + heightPx / 2 - 10 * inverseScale}
            width={50 * inverseScale}
            height={20 * inverseScale}
            text={`${Math.round(heightPx)}px`}
            fontSize={12 * inverseScale}
            fontFamily="monospace"
            fill="#FFFFFF"
            align="center"
            verticalAlign="middle"
            listening={false}
          />
        </Group>
      )}
    </Group>
  );
}

