// OpacityBlendControls.jsx - Opacity and blend mode controls for shapes
import { useState, useEffect } from 'react';

const BLEND_MODES = [
  { value: 'source-over', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'color-burn', label: 'Color Burn' },
  { value: 'hard-light', label: 'Hard Light' },
  { value: 'soft-light', label: 'Soft Light' },
  { value: 'difference', label: 'Difference' },
  { value: 'exclusion', label: 'Exclusion' },
  { value: 'hue', label: 'Hue' },
  { value: 'saturation', label: 'Saturation' },
  { value: 'color', label: 'Color' },
  { value: 'luminosity', label: 'Luminosity' },
];

export default function OpacityBlendControls({ 
  selectedShape, 
  onOpacityChange,
  onBlendModeChange,
  onClose 
}) {
  const [opacity, setOpacity] = useState(selectedShape?.opacity || 1.0);
  const [blendMode, setBlendMode] = useState(selectedShape?.blendMode || 'source-over');

  // Update local state when selectedShape changes (e.g., another user changes it)
  useEffect(() => {
    if (selectedShape) {
      setOpacity(selectedShape.opacity || 1.0);
      setBlendMode(selectedShape.blendMode || 'source-over');
    }
  }, [selectedShape?.opacity, selectedShape?.blendMode]);

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

  const handleOpacityChange = (e) => {
    const newOpacity = parseFloat(e.target.value);
    setOpacity(newOpacity);
    onOpacityChange(newOpacity);
  };

  const handleBlendModeChange = (e) => {
    const newBlendMode = e.target.value;
    setBlendMode(newBlendMode);
    onBlendModeChange(newBlendMode);
  };

  if (!selectedShape) return null;

  return (
    <div className="w-80 bg-white rounded-lg shadow-2xl border-2 border-pink-300 p-4 animate-slideIn"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          Opacity & Blend
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          title="Close (Esc)"
        >
          ×
        </button>
      </div>

      {/* Opacity Slider */}
      <div className="mb-4">
        <label className="text-xs text-gray-600 mb-1 block font-medium">
          Opacity: {Math.round(opacity * 100)}%
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={opacity}
            onChange={handleOpacityChange}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
          />
          <input
            type="number"
            min="0"
            max="100"
            value={Math.round(opacity * 100)}
            onChange={(e) => {
              const newOpacity = Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) / 100;
              setOpacity(newOpacity);
              onOpacityChange(newOpacity);
            }}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center"
          />
        </div>
      </div>

      {/* Blend Mode Dropdown */}
      <div className="mb-3">
        <label className="text-xs text-gray-600 mb-1 block font-medium">
          Blend Mode
        </label>
        <select
          value={blendMode}
          onChange={handleBlendModeChange}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
        >
          {BLEND_MODES.map((mode) => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
      </div>

      {/* Preview Info */}
      <div className="text-xs text-gray-500 border-t pt-3 mt-3 space-y-1">
        <p className="flex items-start gap-1">
          <span>💡</span>
          <span>Blend modes affect how this shape mixes with shapes below it.</span>
        </p>
        <p className="flex items-start gap-1">
          <span>✨</span>
          <span>Try overlapping shapes to see the effect!</span>
        </p>
      </div>
    </div>
  );
}

