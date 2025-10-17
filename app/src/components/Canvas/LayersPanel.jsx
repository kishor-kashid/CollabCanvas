// LayersPanel.jsx - Layers management panel with drag-to-reorder, visibility, and locking
import { useState, useContext, useEffect } from 'react';
import { CanvasContext } from '../../contexts/CanvasContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * Individual sortable layer item
 */
function LayerItem({ shape, isSelected, onSelect, onToggleVisibility, onToggleLock }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shape.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : (shape.visible !== false ? 1 : 0.4),
  };

  // Get shape icon based on type
  const getShapeIcon = (type) => {
    switch (type) {
      case 'rectangle':
        return '⬜';
      case 'circle':
        return '⭕';
      case 'text':
        return '📝';
      default:
        return '🔲';
    }
  };

  // Get shape display name
  const getShapeName = (shape) => {
    if (shape.type === 'text') {
      return shape.text?.substring(0, 20) || 'Text';
    }
    return `${shape.type.charAt(0).toUpperCase() + shape.type.slice(1)} ${shape.id.split('_')[1]?.substring(0, 4) || ''}`;
  };

  const isVisible = shape.visible !== false;
  const isLocked = shape.layerLocked || false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center justify-between px-3 py-2 mb-1 rounded-lg
        transition-all duration-150
        ${isSelected 
          ? 'bg-blue-100 border-2 border-blue-500' 
          : 'bg-white border-2 border-gray-200 hover:border-gray-300'
        }
        ${isDragging ? 'shadow-lg scale-105' : ''}
        ${!isVisible ? 'bg-gray-50' : ''}
        ${isLocked ? 'bg-amber-50 border-amber-300' : ''}
      `}
    >
      {/* Visibility Toggle Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility(shape.id);
        }}
        className="p-1 hover:bg-gray-200 rounded transition mr-2"
        title={isVisible ? 'Hide layer' : 'Show layer'}
      >
        {isVisible ? (
          // Eye Open Icon
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        ) : (
          // Eye Closed Icon
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        )}
      </button>

      {/* Lock Toggle Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleLock(shape.id);
        }}
        className={`p-1 hover:bg-gray-200 rounded transition mr-2 ${
          isLocked ? 'text-amber-600' : 'text-gray-400'
        }`}
        title={isLocked ? 'Unlock layer' : 'Lock layer'}
      >
        {isLocked ? (
          // Lock Closed Icon
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        ) : (
          // Lock Open Icon
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
          </svg>
        )}
      </button>

      {/* Shape Info with Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        onClick={() => onSelect(shape.id)}
        className={`cursor-move flex items-center gap-2 flex-1 min-w-0 ${
          isLocked ? 'opacity-60' : ''
        }`}
      >
        <span className="text-lg">{getShapeIcon(shape.type)}</span>
        <span className={`text-sm truncate ${isSelected ? 'font-semibold text-blue-900' : 'text-gray-700'} ${!isVisible ? 'line-through text-gray-400' : ''}`}>
          {getShapeName(shape)}
          {isLocked && <span className="ml-1 text-xs">🔒</span>}
        </span>
      </div>

      {/* Drag Handle Icon */}
      <svg className={`w-4 h-4 ml-2 ${isLocked ? 'text-gray-300' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm4-16h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
      </svg>
    </div>
  );
}

/**
 * Main Layers Panel Component
 */
export default function LayersPanel({ isOpen, onClose }) {
  const { shapes, selectedId, selectShape, deselectAll, reorderShapes, toggleVisibility, toggleLock } = useContext(CanvasContext);
  
  // Local state for optimistic UI updates during drag
  const [localShapes, setLocalShapes] = useState(shapes);
  const [isDragging, setIsDragging] = useState(false);
  
  // Sync local shapes with context shapes when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalShapes(shapes);
    }
  }, [shapes, isDragging]);
  
  // For drag-and-drop functionality
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Use local shapes for display to prevent snap-back during drag
  const displayShapes = [...(isDragging ? localShapes : shapes)].reverse();

  const handleDragStart = () => {
    setIsDragging(true);
    setLocalShapes(shapes); // Capture current state
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    // Check if over is valid and different from active
    if (!over || active.id === over.id) {
      setIsDragging(false);
      return;
    }

    // Find original indices in the reversed display array
    const oldIndex = displayShapes.findIndex(s => s.id === active.id);
    const newIndex = displayShapes.findIndex(s => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      console.error('Could not find shape indices');
      setIsDragging(false);
      return;
    }

    // Reorder in the display array
    const reorderedDisplay = arrayMove(displayShapes, oldIndex, newIndex);

    // Reverse back to get the actual shapes array for Firestore
    const newShapesOrder = [...reorderedDisplay].reverse();

    // Optimistically update local state immediately
    setLocalShapes(newShapesOrder);

    // Update in Firestore
    try {
      await reorderShapes(newShapesOrder);
      console.log('✅ Layers reordered successfully');
    } catch (error) {
      console.error('❌ Error reordering layers:', error);
      // Revert to original on error
      setLocalShapes(shapes);
    } finally {
      setIsDragging(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 bg-white rounded-lg shadow-2xl border-2 border-indigo-300 max-h-[80vh] flex flex-col animate-slideIn">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-purple-600">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          Layers
        </h3>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 text-2xl leading-none transition"
          title="Close"
        >
          ×
        </button>
      </div>

      {/* Info Bar */}
      <div className="px-4 py-2 bg-purple-50 border-b border-purple-100">
        <p className="text-xs text-purple-700">
          <strong>{shapes.length}</strong> layers • Drag to reorder • Top = Front
        </p>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-3">
        {shapes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm">No layers yet</p>
            <p className="text-xs mt-1">Add shapes to see them here</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={displayShapes.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {displayShapes.map((shape) => (
                  <LayerItem
                    key={shape.id}
                    shape={shape}
                    isSelected={selectedId === shape.id}
                    onSelect={selectShape}
                    onToggleVisibility={toggleVisibility}
                    onToggleLock={toggleLock}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 space-y-2">
        <button
          onClick={deselectAll}
          disabled={!selectedId}
          className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition ${
            selectedId
              ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Deselect All
        </button>
      </div>
    </div>
  );
}

