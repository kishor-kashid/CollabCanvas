// CreateCanvasDialog - Dialog for creating a new canvas

import { useState } from 'react';

export default function CreateCanvasDialog({ isOpen, onClose, onCreate }) {
  const [canvasName, setCanvasName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canvasName.trim()) {
      alert('Please enter a canvas name');
      return;
    }
    
    setIsCreating(true);
    try {
      await onCreate(canvasName.trim());
      setCanvasName('');
    } catch (error) {
      console.error('Error creating canvas:', error);
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleClose = () => {
    setCanvasName('');
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Canvas</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="canvasName" className="block text-sm font-medium text-gray-700 mb-2">
              Canvas Name
            </label>
            <input
              type="text"
              id="canvasName"
              value={canvasName}
              onChange={(e) => setCanvasName(e.target.value)}
              placeholder="My Awesome Canvas"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              maxLength={50}
              disabled={isCreating}
            />
            <p className="text-xs text-gray-500 mt-1">{canvasName.length}/50 characters</p>
          </div>
          
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isCreating || !canvasName.trim()}
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                'Create Canvas'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

