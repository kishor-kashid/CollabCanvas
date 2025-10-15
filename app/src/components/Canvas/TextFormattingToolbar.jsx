// Text Formatting Toolbar - Shows when text is selected
import { useEffect, useRef } from 'react';

export default function TextFormattingToolbar({ 
  selectedShape, 
  onFormatChange, 
  position 
}) {
  const toolbarRef = useRef(null);

  if (!selectedShape || selectedShape.type !== 'text') return null;

  const fontStyle = selectedShape.fontStyle || 'normal';
  const isBold = fontStyle.includes('bold');
  const isItalic = fontStyle.includes('italic');
  const currentFontSize = selectedShape.fontSize || 54;

  const toggleBold = () => {
    let newStyle;
    
    if (isBold) {
      newStyle = fontStyle.replace('bold', '').trim();
    } else {
      newStyle = fontStyle === 'normal' ? 'bold' : `${fontStyle} bold`;
    }
    
    onFormatChange({ fontStyle: newStyle || 'normal' });
  };

  const toggleItalic = () => {
    let newStyle;
    
    if (isItalic) {
      newStyle = fontStyle.replace('italic', '').trim();
    } else {
      newStyle = fontStyle === 'normal' ? 'italic' : `${fontStyle} italic`;
    }
    
    onFormatChange({ fontStyle: newStyle || 'normal' });
  };

  const changeFontSize = (delta) => {
    const newSize = Math.max(12, Math.min(200, currentFontSize + delta));
    onFormatChange({ fontSize: newSize });
  };

  return (
    <div 
      ref={toolbarRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex items-center gap-2"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 60}px`,
      }}
    >
      {/* Bold Button */}
      <button
        onClick={toggleBold}
        className={`px-3 py-2 rounded ${isBold ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'} font-bold transition`}
        title="Bold (Ctrl+B)"
      >
        B
      </button>

      {/* Italic Button */}
      <button
        onClick={toggleItalic}
        className={`px-3 py-2 rounded ${isItalic ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'} italic transition`}
        title="Italic (Ctrl+I)"
      >
        I
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300"></div>

      {/* Font Size Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => changeFontSize(-6)}
          className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm font-semibold"
          title="Decrease font size"
        >
          −
        </button>
        <span className="px-2 text-sm font-mono w-12 text-center font-semibold">
          {currentFontSize}
        </span>
        <button
          onClick={() => changeFontSize(6)}
          className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm font-semibold"
          title="Increase font size"
        >
          +
        </button>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-500 ml-2 border-l pl-2">
        Text formatting
      </div>
    </div>
  );
}

