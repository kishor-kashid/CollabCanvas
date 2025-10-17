// CanvasControls Component - Floating control panel for canvas operations

import { useContext, useState, useEffect, useRef } from 'react';
import { CanvasContext } from '../../contexts/CanvasContext';
import { SHAPE_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../utils/constants';
import LayersPanel from './LayersPanel';

export default function CanvasControls() {
  const { 
    scale,
    position,
    zoomIn, 
    zoomOut, 
    resetView, 
    addShape, 
    stageRef,
    setExportSelectionMode,
    selectedId,
    bringShapeToFront,
    sendShapeToBack,
    bringShapeForward,
    sendShapeBackward,
  } = useContext(CanvasContext);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showFullLayersPanel, setShowFullLayersPanel] = useState(false);
  const layerPanelRef = useRef(null);
  const layerButtonRef = useRef(null);
  const exportButtonRef = useRef(null);
  const fullLayersPanelButtonRef = useRef(null);
  const fullLayersPanelRef = useRef(null);
  const [layerPanelTop, setLayerPanelTop] = useState(0);
  const [exportPanelTop, setExportPanelTop] = useState(0);
  const [fullLayersPanelTop, setFullLayersPanelTop] = useState(0);
  
  // Calculate layer panel position when it opens
  useEffect(() => {
    if (showLayerPanel && layerButtonRef.current) {
      const buttonRect = layerButtonRef.current.getBoundingClientRect();
      const controlsRect = layerPanelRef.current.getBoundingClientRect();
      
      // Calculate center of the button section relative to the controls panel
      const buttonCenter = buttonRect.top + buttonRect.height / 2;
      const topOffset = buttonCenter - controlsRect.top;
      setLayerPanelTop(topOffset);
    }
  }, [showLayerPanel]);
  
  // Calculate export panel position when it opens
  useEffect(() => {
    if (showExportPanel && exportButtonRef.current) {
      const buttonRect = exportButtonRef.current.getBoundingClientRect();
      const controlsRect = layerPanelRef.current.getBoundingClientRect();
      
      // Calculate center of the button section relative to the controls panel
      const buttonCenter = buttonRect.top + buttonRect.height / 2;
      const topOffset = buttonCenter - controlsRect.top;
      setExportPanelTop(topOffset);
    }
  }, [showExportPanel]);
  
  // Calculate full layers panel position when it opens
  useEffect(() => {
    if (showFullLayersPanel && fullLayersPanelButtonRef.current) {
      const buttonRect = fullLayersPanelButtonRef.current.getBoundingClientRect();
      const controlsRect = layerPanelRef.current.getBoundingClientRect();
      
      // Calculate center of the button section relative to the controls panel
      const buttonCenter = buttonRect.top + buttonRect.height / 2;
      const topOffset = buttonCenter - controlsRect.top;
      setFullLayersPanelTop(topOffset);
    }
  }, [showFullLayersPanel]);
  
  // Close panels when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (layerPanelRef.current && !layerPanelRef.current.contains(event.target)) {
        setShowLayerPanel(false);
        setShowExportPanel(false);
      }
      // Close full layers panel if clicking outside both the controls and the panel
      if (fullLayersPanelRef.current && !fullLayersPanelRef.current.contains(event.target) &&
          layerPanelRef.current && !layerPanelRef.current.contains(event.target)) {
        setShowFullLayersPanel(false);
      }
    };
    
    if (showLayerPanel || showExportPanel || showFullLayersPanel) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLayerPanel, showExportPanel, showFullLayersPanel]);
  
  // Calculate viewport center in canvas coordinates, clamped to canvas bounds
  const getViewportCenterInCanvas = () => {
    // Viewport center in screen coordinates
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    
    // Convert screen coordinates to canvas coordinates
    // Formula: canvasCoord = (screenCoord - stagePosition) / scale
    const canvasX = (viewportCenterX - position.x) / scale;
    const canvasY = (viewportCenterY - position.y) / scale;
    
    // Clamp to canvas boundaries
    const clampedX = Math.max(0, Math.min(CANVAS_WIDTH, canvasX));
    const clampedY = Math.max(0, Math.min(CANVAS_HEIGHT, canvasY));
    
    return { x: clampedX, y: clampedY };
  };
  
  // Add shape at viewport center (or nearest canvas edge if viewport is outside)
  const handleAddShape = (shapeType) => {
    const { x, y } = getViewportCenterInCanvas();
    
    // Adjust offset based on shape type to center the shape properly at the calculated position
    const offset = shapeType === SHAPE_TYPES.CIRCLE ? 150 : 150;
    
    // Ensure the shape stays within canvas bounds even after applying offset
    const finalX = Math.max(0, Math.min(CANVAS_WIDTH - offset * 2, x - offset));
    const finalY = Math.max(0, Math.min(CANVAS_HEIGHT - offset * 2, y - offset));
    
    addShape(shapeType, { x: finalX, y: finalY });
  };
  
  // Download full canvas as PNG at 0.5 pixel ratio
  const handleDownloadFullCanvas = async () => {
    if (!stageRef?.current || isExporting) return;
    
    setIsExporting(true);
    setShowExportPanel(false);
    
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
    setShowExportPanel(false);
    setExportSelectionMode(true);
  };
  
  return (
    <div ref={layerPanelRef} className="fixed left-4 top-20 z-20">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
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
          <p className="text-xs text-gray-500 text-center mt-2">Creates at viewport center</p>
        </div>
        
        {/* Layer Order Button */}
        <div ref={layerButtonRef} className="pt-2 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Layer Order:</h4>
          <button
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            disabled={!selectedId}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-2 text-white rounded-lg transition duration-200 font-medium text-sm ${
              selectedId ? 'bg-purple-500 hover:bg-purple-600' : 'bg-gray-300 cursor-not-allowed'
            }`}
            title="Manage Layers (Z-Index)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <span>Layers</span>
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">Select a shape first</p>
        </div>
        
        {/* Full Layers Panel Button */}
        <div ref={fullLayersPanelButtonRef} className="pt-2 border-t border-gray-200">
          <button
            onClick={() => setShowFullLayersPanel(!showFullLayersPanel)}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition duration-200 font-medium text-sm ${
              showFullLayersPanel
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
            }`}
            title="Show/Hide Full Layers Panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>Layers Panel</span>
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">Visibility & lock</p>
        </div>
        
        {/* Export Section */}
        <div ref={exportButtonRef} className="pt-2 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Export:</h4>
            <button
            onClick={() => setShowExportPanel(!showExportPanel)}
              disabled={isExporting}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-2 ${
                isExporting ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600'
              } text-white rounded-lg transition duration-200 font-medium text-sm`}
            title="Export Canvas"
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
            <div className="flex justify-between">
              <span>To Front:</span>
              <span className="font-mono bg-gray-100 px-1 rounded">⌘]</span>
            </div>
            <div className="flex justify-between">
              <span>To Back:</span>
              <span className="font-mono bg-gray-100 px-1 rounded">⌘[</span>
            </div>
          </div>
        </div>
        </div>
      </div>
      
      {/* Layer Panel - Floating dropdown */}
      {showLayerPanel && selectedId && (
        <div 
          className="absolute bg-white rounded-lg shadow-2xl border-2 border-purple-300 z-30 animate-slideIn"
          style={{ 
            left: 'calc(100% + 12px)', 
            width: '220px',
            top: `${layerPanelTop}px`,
            transform: 'translateY(-50%)' // Center vertically
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-2 rounded-t-lg flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">Layer Controls</h3>
            <button
              onClick={() => setShowLayerPanel(false)}
              className="text-white hover:text-gray-200 transition-colors"
              title="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Layer Buttons */}
          <div className="p-3 space-y-2">
            <button
              onClick={() => bringShapeToFront(selectedId)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition duration-200 font-medium text-sm"
              title="Bring to Front (Cmd+])"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              <span>Bring to Front</span>
            </button>
            
            <button
              onClick={() => bringShapeForward(selectedId)}
              className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 bg-blue-400 hover:bg-blue-500 text-white rounded-lg transition duration-200 font-medium text-xs"
              title="Bring Forward"
            >
              <span>↑ Forward</span>
            </button>
            
            <button
              onClick={() => sendShapeBackward(selectedId)}
              className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 bg-indigo-400 hover:bg-indigo-500 text-white rounded-lg transition duration-200 font-medium text-xs"
              title="Send Backward"
            >
              <span>↓ Backward</span>
            </button>
            
            <button
              onClick={() => sendShapeToBack(selectedId)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition duration-200 font-medium text-sm"
              title="Send to Back (Cmd+[)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span>Send to Back</span>
            </button>
            
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600 text-center">
                Use <span className="font-mono bg-gray-100 px-1 rounded">⌘]</span> / <span className="font-mono bg-gray-100 px-1 rounded">⌘[</span> for quick access
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Export Panel - Floating dropdown */}
      {showExportPanel && (
        <div 
          className="absolute bg-white rounded-lg shadow-2xl border-2 border-emerald-300 z-30 animate-slideIn"
          style={{ 
            left: 'calc(100% + 12px)', 
            width: '240px',
            top: `${exportPanelTop}px`,
            transform: 'translateY(-50%)' // Center vertically
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2 rounded-t-lg flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">Export Options</h3>
            <button
              onClick={() => setShowExportPanel(false)}
              className="text-white hover:text-gray-200 transition-colors"
              title="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Export Buttons */}
          <div className="p-3 space-y-2">
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
          </div>
        </div>
      )}
      
      {/* Full Layers Panel - Floating dropdown */}
      {showFullLayersPanel && (
        <div
          ref={fullLayersPanelRef}
          className="absolute z-40"
          style={{
            left: 'calc(100% + 12px)',
            top: `${fullLayersPanelTop}px`,
            transform: 'translateY(-50%)',
          }}
        >
          <LayersPanel 
            isOpen={showFullLayersPanel} 
            onClose={() => setShowFullLayersPanel(false)} 
          />
        </div>
      )}
    </div>
  );
}

