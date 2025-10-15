// ColorPicker.jsx - Color picker that appears when editing shape colors
import { useState, useRef, useEffect } from 'react';

const PRESET_COLORS = [
  '#FF5733', '#33C1FF', '#8B5CF6', '#10B981', 
  '#F59E0B', '#EC4899', '#6366F1', '#14B8A6',
  '#EF4444', '#3B82F6', '#8B5CF6', '#10B981',
  '#F97316', '#06B6D4', '#A855F7', '#84CC16',
  '#000000', '#6B7280', '#D1D5DB', '#FFFFFF'
];

export default function ColorPicker({ 
  selectedShape, 
  currentColor,
  onColorChange,
  onClose,
  position 
}) {
  const [customColor, setCustomColor] = useState(currentColor || '#cccccc');
  const pickerRef = useRef(null);

  // Handle clicks outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePresetClick = (color) => {
    setCustomColor(color);
    onColorChange(color);
  };

  const handleCustomColorChange = (e) => {
    const color = e.target.value;
    setCustomColor(color);
    onColorChange(color);
  };

  if (!selectedShape) return null;

  return (
    <div 
      ref={pickerRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 200}px`, // Adjust to appear above shape
        minWidth: '280px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700">
          Shape Color
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          title="Close (Esc)"
        >
          ×
        </button>
      </div>

      {/* Preset Colors Grid */}
      <div className="grid grid-cols-8 gap-2 mb-3">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => handlePresetClick(color)}
            className={`w-8 h-8 rounded border-2 transition ${
              customColor === color 
                ? 'border-blue-500 scale-110' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Custom Color Picker */}
      <div className="border-t pt-3">
        <label className="text-xs text-gray-600 mb-1 block">
          Custom Color
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={customColor}
            onChange={handleCustomColorChange}
            className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={customColor}
            onChange={(e) => {
              setCustomColor(e.target.value);
              if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                onColorChange(e.target.value);
              }
            }}
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded font-mono"
            placeholder="#RRGGBB"
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="text-xs text-gray-500 mt-3 border-t pt-2">
        Click outside or press <kbd className="px-1 bg-gray-100 rounded">Esc</kbd> to finish
      </div>
    </div>
  );
}

