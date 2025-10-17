// LeftSidebar.jsx - Vertical sidebar on the left
import { useContext, useState, useRef, useEffect } from 'react';
import { CanvasContext } from '../../contexts/CanvasContext';
import LayersPanel from './LayersPanel';
import OpacityBlendControls from './OpacityBlendControls';

export default function LeftSidebar() {
  const {
    shapes,
    selectedId,
    updateShape,
    bringShapeToFront,
    sendShapeToBack,
    stageRef,
    gridVisible,
    setGridVisible,
    setExportSelectionMode,
  } = useContext(CanvasContext);

  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [showOpacityBlend, setShowOpacityBlend] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const layersPanelRef = useRef(null);
  const opacityBlendPanelRef = useRef(null);
  const exportPanelRef = useRef(null);
  const sidebarRef = useRef(null);
  
  // Close panels when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (layersPanelRef.current && !layersPanelRef.current.contains(event.target) &&
          sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setShowLayersPanel(false);
      }
      if (opacityBlendPanelRef.current && !opacityBlendPanelRef.current.contains(event.target) &&
          sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setShowOpacityBlend(false);
      }
      if (exportPanelRef.current && !exportPanelRef.current.contains(event.target) &&
          sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setShowExportPanel(false);
      }
    };
    
    if (showLayersPanel || showOpacityBlend || showExportPanel) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLayersPanel, showOpacityBlend, showExportPanel]);
  
  // Handle opacity change
  const handleOpacityChange = (opacity) => {
    if (selectedId) {
      updateShape(selectedId, { opacity });
    }
  };

  // Handle blend mode change
  const handleBlendModeChange = (blendMode) => {
    if (selectedId) {
      updateShape(selectedId, { blendMode });
    }
  };
  
  // Download full canvas as PNG at 0.5 pixel ratio
  const handleDownloadFullCanvas = async () => {
    if (!stageRef?.current || isExporting) return;
    
    setIsExporting(true);
    setShowExportPanel(false);
    
    setTimeout(() => {
      try {
        const stage = stageRef.current;
        const originalScale = stage.scaleX();
        const originalPosition = { x: stage.x(), y: stage.y() };
        
        stage.scale({ x: 1, y: 1 });
        stage.position({ x: 0, y: 0 });
        
        const dataURL = stage.toDataURL({
          pixelRatio: 0.5,
          mimeType: 'image/png',
          quality: 1,
        });
        
        stage.scale({ x: originalScale, y: originalScale });
        stage.position(originalPosition);
        
        const link = document.createElement('a');
        link.download = `collabcanvas-full-${Date.now()}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Full canvas exported successfully');
      } catch (error) {
        console.error('❌ Export failed:', error);
        alert('Failed to export canvas. Try using selection export instead.');
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };
  
  // Start selection mode for exporting
  const handleStartSelectionMode = () => {
    setShowExportPanel(false);
    setExportSelectionMode(true);
  };
  
  return (
    <div ref={sidebarRef} className="fixed left-4 top-1/2 transform -translate-y-1/2 z-20">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden w-60">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2">
          <h3 className="text-white font-semibold text-sm">Tools</h3>
        </div>
        
        <div className="p-3 space-y-2">
          {/* Layer Management Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Layers</h4>
            
            <button
              onClick={() => setShowLayersPanel(!showLayersPanel)}
              className="w-full flex items-center justify-between px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition duration-200 text-sm font-medium"
              title="Show/Hide Full Layers Panel"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Layers Panel</span>
              </div>
              <svg 
                className={`w-4 h-4 transition-transform ${showLayersPanel ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* Quick Layer Controls */}
            <div className="flex gap-2">
              <button
                onClick={() => selectedId && bringShapeToFront(selectedId)}
                disabled={!selectedId}
                className={`flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 rounded text-xs font-medium transition ${
                  selectedId ? 'bg-blue-100 hover:bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                title="Bring to Front (⌘])"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                <span>Front</span>
              </button>
              
              <button
                onClick={() => selectedId && sendShapeToBack(selectedId)}
                disabled={!selectedId}
                className={`flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 rounded text-xs font-medium transition ${
                  selectedId ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                title="Send to Back (⌘[)"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span>Back</span>
              </button>
            </div>
          </div>
          
          {/* Appearance Section */}
          <div className="pt-2 border-t border-gray-200 space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Appearance</h4>
            
            <button
              onClick={() => setShowOpacityBlend(!showOpacityBlend)}
              disabled={!selectedId}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition duration-200 text-sm font-medium ${
                selectedId
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              title="Opacity & Blend Modes"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                <span>Opacity & Blend</span>
              </div>
            </button>
            
            {/* Grid Toggle */}
            <button
              onClick={() => setGridVisible(!gridVisible)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition duration-200 text-sm font-medium ${
                gridVisible
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
              title="Toggle Grid Visibility"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5h16M4 12h16M4 19h16M9 5v14M15 5v14" />
                </svg>
                <span>Grid</span>
              </div>
              <span className="text-xs font-mono">{gridVisible ? 'ON' : 'OFF'}</span>
            </button>
          </div>
          
          {/* Actions Section */}
          <div className="pt-2 border-t border-gray-200 space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Actions</h4>
            
            <button
              onClick={() => setShowExportPanel(!showExportPanel)}
              disabled={isExporting}
              className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition duration-200 text-sm font-medium ${
                isExporting ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600'
              } text-white`}
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
                  <span>Export PNG</span>
                </>
              )}
            </button>
          </div>
          
          {/* Help Section */}
          <div className="pt-2 border-t border-gray-200 space-y-2">
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition duration-200 text-sm font-medium"
              title="Keyboard Shortcuts"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Shortcuts</span>
              </div>
              <svg 
                className={`w-4 h-4 transition-transform ${showShortcuts ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Shortcuts Collapsible */}
            {showShortcuts && (
              <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pan:</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded">Drag</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Zoom:</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded">Scroll</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delete:</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded">Del</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">To Front:</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded">⌘]</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">To Back:</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded">⌘[</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">AI Chat:</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded">⌘K</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Floating Panels */}
      {showLayersPanel && (
        <div
          ref={layersPanelRef}
          className="absolute z-40"
          style={{
            left: 'calc(100% + 12px)',
            top: 0,
          }}
        >
          <LayersPanel 
            isOpen={showLayersPanel} 
            onClose={() => setShowLayersPanel(false)} 
          />
        </div>
      )}
      
      {showOpacityBlend && selectedId && (
        <div
          ref={opacityBlendPanelRef}
          className="absolute z-40"
          style={{
            left: 'calc(100% + 12px)',
            top: 0,
          }}
        >
          <OpacityBlendControls
            selectedShape={shapes.find(s => s.id === selectedId)}
            onOpacityChange={handleOpacityChange}
            onBlendModeChange={handleBlendModeChange}
            onClose={() => setShowOpacityBlend(false)}
          />
        </div>
      )}
      
      {showExportPanel && (
        <div 
          ref={exportPanelRef}
          className="absolute bg-white rounded-lg shadow-2xl border-2 border-emerald-300 z-40"
          style={{ 
            left: 'calc(100% + 12px)', 
            top: 0,
            width: '240px',
          }}
        >
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
          
          <div className="p-3 space-y-2">
            <button
              onClick={handleStartSelectionMode}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition duration-200 font-medium text-sm"
              title="Draw a selection box to export"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span>Export Selection</span>
            </button>
            <p className="text-xs text-gray-500 text-center">Draw area • Full quality</p>
            
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
            <p className="text-xs text-gray-500 text-center">Full canvas • 0.5x quality</p>
          </div>
        </div>
      )}
    </div>
  );
}

