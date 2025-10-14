// CursorMarker Component - Renders a user's cursor inside the Konva canvas
// This component uses Konva elements instead of DOM elements for proper coordinate transformation

import { Group, Path, Text, Rect } from 'react-konva';
import { getTruncatedName } from '../../utils/helpers';

export default function CursorMarker({ x, y, color, displayName, stageScale = 1 }) {
  // Truncate long names
  const name = getTruncatedName(displayName);
  
  // SVG path data for cursor (scaled down to fit canvas coordinates)
  // Original viewBox was 0 0 24 24, we're scaling it down to about 20px
  const cursorPath = 'M5.65376 12.3673L5 5L12.3673 5.65376L18.4588 11.7452C19.4448 12.7312 19.4448 14.3326 18.4588 15.3186L15.3186 18.4588C14.3326 19.4448 12.7312 19.4448 11.7452 18.4588L5.65376 12.3673Z';
  
  // Calculate inverse scale to keep cursor at constant screen size
  // When stage zooms in (scale > 1), cursor should scale down by the same amount
  const inverseScale = 1 / stageScale;
  const cursorSize = 0.8 * inverseScale;
  
  return (
    <Group x={x} y={y} listening={false}>
      {/* Cursor pointer - scales inversely with stage zoom */}
      <Path
        data={cursorPath}
        fill={color}
        stroke="white"
        strokeWidth={1.5 * inverseScale}
        scaleX={cursorSize}
        scaleY={cursorSize}
        shadowColor="black"
        shadowBlur={3 * inverseScale}
        shadowOpacity={0.3}
        shadowOffsetX={0}
        shadowOffsetY={2 * inverseScale}
      />
      
      {/* Name label background - scales inversely with stage zoom */}
      <Rect
        x={10 * inverseScale}
        y={20 * inverseScale}
        width={(name.length * 7 + 16) * inverseScale}
        height={20 * inverseScale}
        fill={color}
        cornerRadius={4 * inverseScale}
        shadowColor="black"
        shadowBlur={2 * inverseScale}
        shadowOpacity={0.2}
        shadowOffsetX={0}
        shadowOffsetY={1 * inverseScale}
      />
      
      {/* Name label text - scales inversely with stage zoom */}
      <Text
        x={18 * inverseScale}
        y={24 * inverseScale}
        text={name}
        fontSize={12 * inverseScale}
        fontFamily="Arial, sans-serif"
        fontStyle="bold"
        fill="white"
      />
    </Group>
  );
}

