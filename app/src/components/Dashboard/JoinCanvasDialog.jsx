// JoinCanvasDialog - Dialog for joining a canvas by share code

import { useState } from 'react';

export default function JoinCanvasDialog({ isOpen, onClose, onJoin }) {
  const [shareCode, setShareCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const code = shareCode.replace(/\s/g, '').toUpperCase();
    
    if (code.length !== 6) {
      setError('Share code must be 6 characters');
      return;
    }
    
    setIsJoining(true);
    try {
      await onJoin(code);
      setShareCode('');
    } catch (error) {
      console.error('Error joining canvas:', error);
      setError(error.message || 'Failed to join canvas. Please check the code and try again.');
    } finally {
      setIsJoining(false);
    }
  };
  
  const handleClose = () => {
    setShareCode('');
    setError('');
    onClose();
  };
  
  const handleCodeChange = (e) => {
    // Auto-format and uppercase
    let value = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (value.length > 6) value = value.substring(0, 6);
    
    // Add space after 3rd character for readability
    if (value.length > 3) {
      value = value.substring(0, 3) + ' ' + value.substring(3);
    }
    
    setShareCode(value);
    setError('');
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Join Canvas</h2>
        
        <p className="text-sm text-gray-600 mb-4">
          Enter the 6-character share code to join a canvas shared by another user.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="shareCode" className="block text-sm font-medium text-gray-700 mb-2">
              Share Code
            </label>
            <input
              type="text"
              id="shareCode"
              value={shareCode}
              onChange={handleCodeChange}
              placeholder="ABC 123"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-wider uppercase"
              autoFocus
              disabled={isJoining}
              maxLength={7} // 6 characters + 1 space
            />
            {error && (
              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>
          
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isJoining}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isJoining || shareCode.replace(/\s/g, '').length !== 6}
            >
              {isJoining ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Joining...
                </>
              ) : (
                'Join Canvas'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

