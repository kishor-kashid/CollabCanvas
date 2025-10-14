// Cursor Component - Renders a user's cursor on the canvas

import { getTruncatedName } from '../../utils/helpers';

export default function Cursor({ x, y, color, displayName }) {
  // Truncate long names
  const name = getTruncatedName(displayName);
  
  return (
    <div
      style={{
        position: 'absolute',
        top: `${y}px`,
        left: `${x}px`,
        pointerEvents: 'none',
        zIndex: 10000,
        transition: 'top 0.1s ease-out, left 0.1s ease-out',
      }}
    >
      <div style={{ position: 'relative' }}>
        {/* Cursor SVG */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
          }}
        >
          <path
            d="M5.65376 12.3673L5 5L12.3673 5.65376L18.4588 11.7452C19.4448 12.7312 19.4448 14.3326 18.4588 15.3186L15.3186 18.4588C14.3326 19.4448 12.7312 19.4448 11.7452 18.4588L5.65376 12.3673Z"
            fill={color}
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        
        {/* Name label */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '10px',
            backgroundColor: color,
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          {name}
        </div>
      </div>
    </div>
  );
}
