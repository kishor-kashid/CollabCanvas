// ShareCodeDialog - Dialog for displaying and copying share code

import { useState } from 'react';
import { useCanvasManagement } from '../../contexts/CanvasManagementContext';
import { formatShareCode } from '../../utils/shareCodeGenerator';

export default function ShareCodeDialog({ canvas, onClose }) {
  const { regenerateShareCode } = useCanvasManagement();
  const [shareCode, setShareCode] = useState(canvas.shareCode);
  const [isCopied, setIsCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };
  
  const handleRegenerate = async () => {
    if (!window.confirm('Regenerating will invalidate the current share code. Continue?')) {
      return;
    }
    
    setIsRegenerating(true);
    try {
      const newCode = await regenerateShareCode(canvas.canvasId);
      setShareCode(newCode);
    } catch (error) {
      console.error('Error regenerating share code:', error);
      alert('Failed to regenerate share code. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Share Canvas</h2>
        <p className="text-sm text-gray-600 mb-6">{canvas.name}</p>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-2 text-center">Share Code</p>
          <div className="bg-white rounded-lg p-4 border-2 border-blue-200 mb-3">
            <p className="text-3xl font-mono font-bold text-center text-blue-600 tracking-wider">
              {formatShareCode(shareCode)}
            </p>
          </div>
          
          <button
            onClick={handleCopy}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            {isCopied ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Code
              </>
            )}
          </button>
        </div>
        
        <div className="border-t border-gray-200 pt-4 mb-4">
          <p className="text-sm text-gray-600 mb-3">
            Share this code with collaborators to give them access to your canvas. The code can be used multiple times.
          </p>
          
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRegenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                Regenerating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate Code
              </>
            )}
          </button>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

