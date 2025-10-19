// TopToolbar.jsx - Horizontal toolbar at the top of canvas
import { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CanvasContext } from '../../contexts/CanvasContext';
import { SHAPE_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../utils/constants';
import ColorPicker from './ColorPicker';
import { useComments } from '../../hooks/useComments';
import { useAITasks } from '../../hooks/useAITasks';
import { useAuth } from '../../hooks/useAuth';
import { deleteAITasksByStatus } from '../../services/aiTasks';

export default function TopToolbar() {
  const navigate = useNavigate();
  const {
    canvasId,
    scale,
    position,
    zoomIn,
    zoomOut,
    resetView,
    fitToScreen,
    addShape,
    setScale,
    currentColor,
    setCurrentColor,
    undo,
    redo,
    canUndo,
    canRedo,
    duplicateShape,
    selectedId,
    commentMode,
    setCommentMode,
    aiTaskMode,
    setAiTaskMode,
  } = useContext(CanvasContext);

  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [zoomInput, setZoomInput] = useState(Math.round(scale * 100));
  const colorButtonRef = useRef(null);
  
  // Get unresolved comment count
  const { unresolvedCount } = useComments(canvasId);
  
  // Get AI tasks count
  const { currentUser } = useAuth();
  const { pendingCount, completedCount } = useAITasks(canvasId, currentUser?.uid);
  
  // Update zoom input when scale changes
  useEffect(() => {
    setZoomInput(Math.round(scale * 100));
  }, [scale]);
  
  // Handle zoom input change
  const handleZoomInputChange = (e) => {
    const value = e.target.value.replace('%', '');
    setZoomInput(value);
  };
  
  // Handle zoom input submit
  const handleZoomInputSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      let value = parseInt(zoomInput);
      if (isNaN(value)) {
        value = 100;
      }
      // Clamp between 10% and 300%
      value = Math.max(10, Math.min(300, value));
      setScale(value / 100);
      setZoomInput(value);
    }
  };
  
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
  
  // Handle shape creation at viewport center
  const handleAddShape = (shapeType) => {
    const { x, y } = getViewportCenterInCanvas();
    
    // Adjust offset based on shape type to center the shape properly at the calculated position
    const offset = shapeType === SHAPE_TYPES.CIRCLE ? 150 : 150;
    
    // Ensure the shape stays within canvas bounds even after applying offset
    const finalX = Math.max(0, Math.min(CANVAS_WIDTH - offset * 2, x - offset));
    const finalY = Math.max(0, Math.min(CANVAS_HEIGHT - offset * 2, y - offset));
    
    addShape(shapeType, { x: finalX, y: finalY });
  };
  
  // Toggle color picker
  const handleColorPickerToggle = () => {
    setIsColorPickerOpen(!isColorPickerOpen);
  };
  
  return (
    <>
      {/* Back to Dashboard Button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="fixed top-24 left-4 z-30 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
        title="Back to Dashboard"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="text-sm font-medium text-gray-700">Dashboard</span>
      </button>
      
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-30 bg-white border border-gray-200 rounded-lg shadow-lg">
        <div className="flex items-start px-4 py-3 gap-6">
          {/* Left Section - Create Tools */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide text-center">Create</span>
            <div className="flex items-center gap-2">
            
            {/* Shape Buttons */}
            <button
              onClick={() => handleAddShape(SHAPE_TYPES.RECTANGLE)}
              className="flex flex-col items-center justify-center px-3 py-2 hover:bg-blue-50 rounded-lg transition-all duration-150 active:scale-95 active:bg-blue-100 group"
              title="Add Rectangle"
            >
              <svg className="w-6 h-6 text-gray-700 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" strokeWidth="2" rx="2" />
              </svg>
              <span className="text-xs text-gray-600 group-hover:text-blue-600 mt-0.5">Rectangle</span>
            </button>
            
            <button
              onClick={() => handleAddShape(SHAPE_TYPES.CIRCLE)}
              className="flex flex-col items-center justify-center px-3 py-2 hover:bg-purple-50 rounded-lg transition-all duration-150 active:scale-95 active:bg-purple-100 group"
              title="Add Circle"
            >
              <svg className="w-6 h-6 text-gray-700 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" strokeWidth="2" />
              </svg>
              <span className="text-xs text-gray-600 group-hover:text-purple-600 mt-0.5">Circle</span>
            </button>
            
            <button
              onClick={() => handleAddShape(SHAPE_TYPES.TRIANGLE)}
              className="flex flex-col items-center justify-center px-3 py-2 hover:bg-green-50 rounded-lg transition-all duration-150 active:scale-95 active:bg-green-100 group"
              title="Add Triangle"
            >
              <svg className="w-6 h-6 text-gray-700 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4 L20 20 L4 20 Z" />
              </svg>
              <span className="text-xs text-gray-600 group-hover:text-green-600 mt-0.5">Triangle</span>
            </button>
            
            <button
              onClick={() => handleAddShape(SHAPE_TYPES.TEXT)}
              className="flex flex-col items-center justify-center px-3 py-2 hover:bg-indigo-50 rounded-lg transition-all duration-150 active:scale-95 active:bg-indigo-100 group"
              title="Add Text"
            >
              <svg className="w-6 h-6 text-gray-700 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs text-gray-600 group-hover:text-indigo-600 mt-0.5">Text</span>
            </button>
            
            {/* Color Picker Button */}
            <div className="relative ml-2">
              <button
                ref={colorButtonRef}
                onClick={handleColorPickerToggle}
                className="flex flex-col items-center justify-center px-3 py-2 hover:bg-pink-50 rounded-lg transition-all duration-150 active:scale-95 group"
                title="Choose Color for New Shapes"
              >
                <div className="relative">
                  <svg className="w-6 h-6 text-gray-700 group-hover:text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  <div 
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: currentColor }}
                  />
                </div>
                <span className="text-xs text-gray-600 group-hover:text-pink-600 mt-0.5">Color</span>
              </button>
            </div>
            
            {/* Duplicate Button */}
            <div className="ml-2">
              <button
                onClick={() => duplicateShape(selectedId)}
                disabled={!selectedId}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-150 active:scale-95 group ${
                  selectedId
                    ? 'hover:bg-amber-50'
                    : 'cursor-not-allowed'
                }`}
                title="Duplicate Selected Shape (Ctrl/Cmd+D)"
              >
                <svg className={`w-6 h-6 ${selectedId ? 'text-gray-700 group-hover:text-amber-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className={`text-xs mt-0.5 ${selectedId ? 'text-gray-600 group-hover:text-amber-600' : 'text-gray-400'}`}>Duplicate</span>
              </button>
            </div>
            
            {/* Comment Mode Toggle */}
            <div className="ml-2 relative">
              <button
                onClick={() => setCommentMode(!commentMode)}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-150 active:scale-95 group ${
                  commentMode
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'hover:bg-yellow-50 text-gray-700'
                }`}
                title="Comment Mode (C) - Click shapes or canvas to add comments"
              >
                <svg className={`w-6 h-6 ${commentMode ? 'text-yellow-700' : 'text-gray-700 group-hover:text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <span className={`text-xs mt-0.5 ${commentMode ? 'text-yellow-700' : 'text-gray-600 group-hover:text-yellow-600'}`}>Comment</span>
                
                {/* Unresolved count badge */}
                {unresolvedCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unresolvedCount}
                  </span>
                )}
              </button>
            </div>
            
            {/* AI Task Mode Toggle */}
            <div className="ml-2 relative">
              <button
                onClick={() => {
                  setAiTaskMode(!aiTaskMode);
                  // Turn off comment mode when enabling AI task mode
                  if (!aiTaskMode && commentMode) {
                    setCommentMode(false);
                  }
                }}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-150 active:scale-95 group ${
                  aiTaskMode
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    : 'hover:bg-purple-50 text-gray-700'
                }`}
                title="AI Task Mode (Esc to exit) - Click shapes or canvas to add AI commands"
              >
                <svg className={`w-6 h-6 ${aiTaskMode ? 'text-purple-700' : 'text-gray-700 group-hover:text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className={`text-xs mt-0.5 ${aiTaskMode ? 'text-purple-700' : 'text-gray-600 group-hover:text-purple-600'}`}>AI Tasks</span>
                
                {/* Pending count badge */}
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
              
              {/* Clear completed tasks button - shows when there are completed tasks */}
              {completedCount > 0 && aiTaskMode && (
                <button
                  onClick={async () => {
                    if (window.confirm(`Delete ${completedCount} completed task(s)?`)) {
                      try {
                        await deleteAITasksByStatus(canvasId, currentUser?.uid, 'completed');
                      } catch (error) {
                        console.error('Failed to delete completed tasks:', error);
                        alert('Failed to delete completed tasks. Please try again.');
                      }
                    }
                  }}
                  className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs px-2 py-1 rounded shadow-sm whitespace-nowrap z-10"
                  title="Delete completed tasks"
                >
                  🧹 Clear {completedCount} completed
                </button>
              )}
            </div>
            </div>
          </div>
          
          {/* Divider */}
          <div className="w-px self-stretch bg-gray-300" />
          
          {/* Undo/Redo Section */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide text-center">History</span>
            <div className="flex items-center gap-2">
            
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-150 active:scale-95 group ${
                canUndo
                  ? 'hover:bg-orange-50 text-gray-700'
                  : 'cursor-not-allowed text-gray-400'
              }`}
              title="Undo (Ctrl/Cmd+Z)"
            >
              <svg className={`w-6 h-6 ${canUndo ? 'group-hover:text-orange-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span className={`text-xs mt-0.5 ${canUndo ? 'group-hover:text-orange-600' : ''}`}>Undo</span>
            </button>
            
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-150 active:scale-95 group ${
                canRedo
                  ? 'hover:bg-teal-50 text-gray-700'
                  : 'cursor-not-allowed text-gray-400'
              }`}
              title="Redo (Ctrl/Cmd+Shift+Z)"
            >
              <svg className={`w-6 h-6 ${canRedo ? 'group-hover:text-teal-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
              </svg>
              <span className={`text-xs mt-0.5 ${canRedo ? 'group-hover:text-teal-600' : ''}`}>Redo</span>
            </button>
            
            </div>
          </div>
          
          {/* Divider */}
          <div className="w-px self-stretch bg-gray-300" />
          
          {/* Center Section - View Controls */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide text-center">View</span>
            <div className="flex items-center gap-2">
            
            <button
              onClick={zoomOut}
              className="p-2 hover:bg-blue-50 rounded-lg transition-all duration-150 active:scale-95 active:bg-blue-100 group"
              title="Zoom Out (Scroll Down)"
            >
              <svg className="w-5 h-5 text-gray-700 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            
            <div className="relative">
              <input
                type="text"
                value={`${zoomInput}%`}
                onChange={handleZoomInputChange}
                onKeyDown={handleZoomInputSubmit}
                onBlur={handleZoomInputSubmit}
                className="w-20 px-2 py-1.5 text-center text-sm font-mono font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                title="Click to edit zoom level"
              />
            </div>
            
            <button
              onClick={zoomIn}
              className="p-2 hover:bg-blue-50 rounded-lg transition-all duration-150 active:scale-95 active:bg-blue-100 group"
              title="Zoom In (Scroll Up)"
            >
              <svg className="w-5 h-5 text-gray-700 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            <button
              onClick={resetView}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-150 active:scale-95"
              title="Reset View to Default (100%, Top-Left)"
            >
              Reset
            </button>
            
            <button
              onClick={fitToScreen}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-150 active:scale-95"
              title="Fit Entire Canvas to Screen"
            >
              Fit Screen
            </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Color Picker Positioned Below Button */}
      {isColorPickerOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsColorPickerOpen(false)}
          />
          {/* Color Picker */}
          <ColorPicker
            selectedShape={{ fill: currentColor }}
            currentColor={currentColor}
            onColorChange={(newColor) => {
              setCurrentColor(newColor);
              localStorage.setItem('collabcanvas-current-color', newColor);
            }}
            onClose={() => setIsColorPickerOpen(false)}
            anchorElement={colorButtonRef}
          />
        </>
      )}
    </>
  );
}

