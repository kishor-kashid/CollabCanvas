// AITaskDialog.jsx - Dialog for creating/editing AI task commands

import { useState, useEffect } from 'react';

/**
 * Dialog for entering AI task commands
 */
export default function AITaskDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onDelete, // For deleting existing tasks
  position,
  shapeId,
  shapes,
  existingTask // For editing existing tasks
}) {
  const [command, setCommand] = useState('');
  
  // Get shape info if clicked on a shape
  const clickedShape = shapeId && shapes ? shapes.find(s => s.id === shapeId) : null;
  
  // Load existing task command for editing
  useEffect(() => {
    if (existingTask) {
      setCommand(existingTask.command || '');
    } else {
      setCommand('');
    }
  }, [existingTask, isOpen]);
  
  const handleSubmit = () => {
    if (command.trim()) {
      onSubmit(command.trim(), position, shapeId);
      setCommand('');
      onClose();
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  // Suggestions based on whether it's shape-specific or canvas-level
  const suggestions = clickedShape ? [
    "Change color to blue",
    "Make this larger",
    "Rotate 45 degrees",
    "Delete this"
  ] : [
    "Create a red circle here",
    "Add a rectangle",
    "Place text saying 'Hello'",
    "Create a triangle"
  ];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-lg p-6 w-[500px] shadow-2xl">
        {/* Header */}
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          {existingTask ? 'Edit AI Task Command' : 'Add AI Task Command'}
        </h3>
        
        {/* Context info */}
        <div className="text-sm text-gray-600 mb-4 bg-purple-50 p-3 rounded-lg">
          {clickedShape ? (
            <div className="flex items-center gap-2">
              <span>📍 Attached to</span>
              <span className="font-medium">{clickedShape.type}</span>
              {clickedShape.fill && (
                <span className="flex items-center gap-1">
                  (
                  <span 
                    className="inline-block w-3 h-3 rounded-full border border-gray-300" 
                    style={{ backgroundColor: clickedShape.fill }}
                  />
                  )
                </span>
              )}
            </div>
          ) : (
            <div>📍 Canvas position: ({Math.round(position?.x || 0)}, {Math.round(position?.y || 0)})</div>
          )}
        </div>
        
        {/* Input field */}
        <textarea
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            clickedShape 
              ? "E.g., 'change this to red' or 'make this twice as big'"
              : "E.g., 'create a blue rectangle here' or 'add a circle at this position'"
          }
          className="w-full p-3 border border-gray-300 rounded-lg mb-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
          autoFocus
        />
        
        {/* Example suggestions */}
        {!existingTask && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Quick suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => setCommand(suggestion)}
                  className="text-xs bg-gray-100 hover:bg-purple-100 text-gray-700 px-2 py-1 rounded border border-gray-300 hover:border-purple-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Help text */}
        <div className="text-xs text-gray-500 mb-4 bg-blue-50 p-2 rounded">
          💡 <strong>Tip:</strong> Use natural language. The AI will execute this later when you say 
          <span className="font-mono bg-white px-1 rounded ml-1">"execute all assigned tasks"</span> in chat.
        </div>
        
        {/* Buttons */}
        <div className="flex gap-2 justify-between items-center">
          {/* Delete button (only for existing tasks) */}
          {existingTask && onDelete && (
            <button
              onClick={() => {
                if (window.confirm('Delete this AI task?')) {
                  onDelete(existingTask.id);
                  onClose();
                }
              }}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          )}
          
          {/* Right side buttons */}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!command.trim()}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {existingTask ? 'Update Task' : 'Add Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

