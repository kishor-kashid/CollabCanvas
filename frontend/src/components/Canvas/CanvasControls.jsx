// CanvasControls Component - Floating control panel for canvas operations

import { useContext } from 'react';
import { CanvasContext } from '../../contexts/CanvasContext';

export default function CanvasControls() {
  const { scale, zoomIn, zoomOut, resetView, addShape, stageRef, position } = useContext(CanvasContext);
  
  // Calculate center of current viewport
  const handleAddShape = () => {
    if (stageRef.current) {
      const stage = stageRef.current;
      const centerX = (-position.x + window.innerWidth / 2) / scale;
      const centerY = (-position.y + window.innerHeight / 2) / scale;
      
      addShape('rectangle', { x: centerX - 50, y: centerY - 50 }); // Center the 100x100 shape
    } else {
      addShape('rectangle', { x: 100, y: 100 }); // Fallback position
    }
  };
  
  return (
    <div className="fixed left-4 top-24 z-20 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2">
        <h3 className="text-white font-semibold text-sm">Canvas Controls</h3>
      </div>
      
      {/* Controls */}
      <div className="p-3 space-y-2">
        {/* Zoom Info */}
        <div className="text-center py-2 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Current Zoom</div>
          <div className="text-2xl font-bold text-blue-600 font-mono">
            {(scale * 100).toFixed(0)}%
          </div>
        </div>
        
        {/* Zoom Buttons */}
        <div className="space-y-2">
          <button
            onClick={zoomIn}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition duration-200 font-medium text-sm"
            title="Zoom In (Scroll Up)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Zoom In</span>
          </button>
          
          <button
            onClick={zoomOut}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition duration-200 font-medium text-sm"
            title="Zoom Out (Scroll Down)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
            <span>Zoom Out</span>
          </button>
          
          <button
            onClick={resetView}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition duration-200 font-medium text-sm"
            title="Reset View to Default"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reset View</span>
          </button>
        </div>
        
        {/* Add Shape Button */}
        <div className="pt-2 border-t border-gray-200">
          <button
            onClick={handleAddShape}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition duration-200 font-medium text-sm"
            title="Add Rectangle Shape"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Shape</span>
          </button>
          <p className="text-xs text-gray-500 text-center mt-1">Creates at viewport center</p>
        </div>
        
        {/* Keyboard Shortcuts */}
        <div className="pt-2 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Shortcuts:</h4>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Pan:</span>
              <span className="font-mono bg-gray-100 px-1 rounded">Drag</span>
            </div>
            <div className="flex justify-between">
              <span>Zoom:</span>
              <span className="font-mono bg-gray-100 px-1 rounded">Scroll</span>
            </div>
            <div className="flex justify-between">
              <span>Delete:</span>
              <span className="font-mono bg-gray-100 px-1 rounded">Del</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

