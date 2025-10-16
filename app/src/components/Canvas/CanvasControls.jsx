// CanvasControls Component - Floating control panel for canvas operations

import { useContext, useState } from 'react';
import { CanvasContext } from '../../contexts/CanvasContext';
import { SHAPE_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../utils/constants';

export default function CanvasControls() {
  const { 
    scale, 
    zoomIn, 
    zoomOut, 
    resetView, 
    addShape, 
    stageRef,
    setExportSelectionMode 
  } = useContext(CanvasContext);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  // Calculate center of canvas (not viewport) and add shape
  const handleAddShape = (shapeType) => {
    // Always create shapes at the center of the canvas (5000x5000px canvas = center at 2500, 2500)
    const canvasCenterX = CANVAS_WIDTH / 2;
    const canvasCenterY = CANVAS_HEIGHT / 2;
    
    // Adjust offset based on shape type to center the shape properly
    const offset = shapeType === SHAPE_TYPES.CIRCLE ? 150 : 150;
    addShape(shapeType, { x: canvasCenterX - offset, y: canvasCenterY - offset });
  };
  
  // Download full canvas as PNG at 0.5 pixel ratio
  const handleDownloadFullCanvas = async () => {
    if (!stageRef?.current || isExporting) return;
    
    setIsExporting(true);
    setShowExportOptions(false);
    
    // Use setTimeout to let UI update before heavy operation
    setTimeout(() => {
      try {
        const stage = stageRef.current;
        
        // Store original view settings
        const originalScale = stage.scaleX();
        const originalPosition = { x: stage.x(), y: stage.y() };
        
        // Temporarily reset to default view to capture full canvas
        stage.scale({ x: 1, y: 1 });
        stage.position({ x: 0, y: 0 });
        
        // Generate PNG with full canvas dimensions at 0.5 pixel ratio (reduced quality for large canvas)
        const dataURL = stage.toDataURL({
          pixelRatio: 0.5, // 0.5 for smaller file size and compatibility with large canvas
          mimeType: 'image/png',
          quality: 1,
          x: 0,
          y: 0,
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT
        });
        
        // Restore original view
        stage.scale({ x: originalScale, y: originalScale });
        stage.position(originalPosition);
        
        // Trigger download
        const link = document.createElement('a');
        link.download = `collabcanvas-full-${Date.now()}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Full canvas exported successfully at 0.5x quality');
      } catch (error) {
        console.error('❌ Export failed:', error);
        alert('Failed to export canvas. The canvas might be too large. Try using the selection export instead.');
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };
  
  // Start selection mode for exporting a specific area
  const handleStartSelectionMode = () => {
    setShowExportOptions(false);
    setExportSelectionMode(true);
  };
  
  return (
    <div className="fixed left-4 top-20 z-20 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
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
        
        {/* Add Shape Buttons */}
        <div className="pt-2 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Add Shapes:</h4>
          <div className="space-y-2">
            <button
              onClick={() => handleAddShape(SHAPE_TYPES.RECTANGLE)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition duration-200 font-medium text-sm"
              title="Add Rectangle"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" strokeWidth="2" rx="2" />
              </svg>
              <span>Rectangle</span>
            </button>
            
            <button
              onClick={() => handleAddShape(SHAPE_TYPES.CIRCLE)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition duration-200 font-medium text-sm"
              title="Add Circle"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" strokeWidth="2" />
              </svg>
              <span>Circle</span>
            </button>
            
            <button
              onClick={() => handleAddShape(SHAPE_TYPES.TEXT)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition duration-200 font-medium text-sm"
              title="Add Text"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Text</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">Creates at canvas center</p>
        </div>
        
        {/* Export Section */}
        <div className="pt-2 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Export:</h4>
          
          {!showExportOptions ? (
            <button
              onClick={() => setShowExportOptions(true)}
              disabled={isExporting}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-2 ${
                isExporting ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600'
              } text-white rounded-lg transition duration-200 font-medium text-sm`}
              title="Choose export options"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download PNG</span>
                </>
              )}
            </button>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleStartSelectionMode}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition duration-200 font-medium text-sm"
                title="Draw a selection box to export a specific area at full quality"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span>Export Selection</span>
              </button>
              <p className="text-xs text-gray-500 text-center -mt-1">Draw area • Full quality</p>
              
              <button
                onClick={handleDownloadFullCanvas}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition duration-200 font-medium text-sm"
                title="Export entire canvas at 50% pixel ratio"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Export Full (50%)</span>
              </button>
              <p className="text-xs text-gray-500 text-center -mt-1">Full canvas • 0.5x quality</p>
              
              <button
                onClick={() => setShowExportOptions(false)}
                className="w-full px-4 py-1.5 text-xs text-gray-600 hover:text-gray-800 transition duration-200"
              >
                Cancel
              </button>
            </div>
          )}
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

