// AIChatButton - Floating AI chat toggle button

import { useState } from 'react';
import { UI_CONFIG } from '../../utils/aiConstants';

/**
 * Floating chat button component
 * Positioned in bottom-right corner with AI icon
 */
export default function AIChatButton({ onClick, isOpen }) {
  const [isHovered, setIsHovered] = useState(false);

  const { chatButton } = UI_CONFIG;

  return (
    <div className="fixed z-[9999]" style={{
      bottom: `${chatButton.bottomOffset}px`,
      right: `${chatButton.rightOffset}px`,
      pointerEvents: 'auto', // Ensure button receives clicks
    }}>
      {/* Tooltip */}
      {isHovered && !isOpen && (
        <div
          className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap shadow-lg transition-opacity duration-200 pointer-events-none"
          style={{ opacity: isHovered ? 1 : 0, pointerEvents: 'none' }}
        >
          {chatButton.tooltip}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}

      {/* Button */}
      <button
        onClick={(e) => {
          console.log('🤖 Button element clicked', { isOpen });
          onClick(e);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          rounded-full shadow-lg transition-all duration-300 ease-in-out
          flex items-center justify-center
          ${isOpen 
            ? 'bg-blue-600 hover:bg-blue-700 scale-95' 
            : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-110'
          }
          focus:outline-none focus:ring-4 focus:ring-blue-300
          active:scale-95
          cursor-pointer
          border-2 border-white
        `}
        style={{
          width: `${chatButton.size}px`,
          height: `${chatButton.size}px`,
        }}
        aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
      >
        {isOpen ? (
          // Close icon (X)
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          // Robot icon
          <div className="text-3xl animate-pulse">
            {chatButton.icon}
          </div>
        )}
      </button>

      {/* Pulse animation when not open */}
      {!isOpen && (
        <div
          className="absolute inset-0 rounded-full bg-blue-400 opacity-75 animate-ping pointer-events-none"
          style={{
            width: `${chatButton.size}px`,
            height: `${chatButton.size}px`,
            animationDuration: '2s',
            pointerEvents: 'none', // Don't block clicks on button
          }}
        ></div>
      )}
    </div>
  );
}

