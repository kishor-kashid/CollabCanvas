// CanvasCard - Individual canvas card in dashboard

import { formatRelativeTime } from '../../utils/dateFormatting';
import { useMemo } from 'react';

export default function CanvasCard({ canvas, isOwner, onOpen, onDelete, onShare }) {
  const lastAccessed = canvas.lastAccessed || canvas.joinedAt || canvas.createdAt || Date.now();
  
  // Generate consistent color gradient based on canvas ID
  const gradientColors = useMemo(() => {
    const colors = [
      ['from-blue-50', 'to-indigo-100'],
      ['from-purple-50', 'to-pink-100'],
      ['from-green-50', 'to-emerald-100'],
      ['from-orange-50', 'to-amber-100'],
      ['from-rose-50', 'to-red-100'],
      ['from-cyan-50', 'to-teal-100'],
      ['from-violet-50', 'to-purple-100'],
      ['from-lime-50', 'to-green-100'],
      ['from-fuchsia-50', 'to-pink-100'],
      ['from-sky-50', 'to-blue-100'],
    ];
    
    // Use canvas ID to determine gradient (consistent across renders)
    const hash = canvas.canvasId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, [canvas.canvasId]);
  
  // Get first letter of canvas name
  const initial = canvas.name.charAt(0).toUpperCase();
  
  return (
    <div className="bg-white rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:shadow-lg transition-all group">
      {/* Canvas Preview/Thumbnail (placeholder) */}
      <div 
        onClick={onOpen}
        className={`relative h-36 bg-gradient-to-br ${gradientColors[0]} ${gradientColors[1]} rounded-t-lg cursor-pointer overflow-hidden`}
      >
        {canvas.thumbnail ? (
          <img 
            src={canvas.thumbnail} 
            alt={canvas.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            {/* Large Canvas Name Initial */}
            <div className="w-20 h-20 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center mb-2">
              <span className="text-4xl font-bold text-gray-700">
                {initial}
              </span>
            </div>
            
            {/* Small decorative icon */}
            <svg className="w-8 h-8 text-gray-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="px-4 py-2 bg-white rounded-lg shadow-lg text-sm font-medium text-gray-900">
            Open Canvas
          </span>
        </div>
      </div>
      
      {/* Canvas Info */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-1 truncate">
          {canvas.name}
        </h3>
        
        {!isOwner && canvas.ownerName && (
          <p className="text-xs text-gray-500 mb-2">
            by {canvas.ownerName}
          </p>
        )}
        
        <p className="text-xs text-gray-500 mb-3">
          {lastAccessed ? `Last accessed ${formatRelativeTime(lastAccessed)}` : 'Never accessed'}
        </p>
        
        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onOpen}
            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Open
          </button>
          
          {isOwner && (
            <>
              <button
                onClick={onShare}
                title="Share Canvas"
                className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
              
              <button
                onClick={onDelete}
                title="Delete Canvas"
                className="px-3 py-2 bg-gray-100 text-red-600 text-sm font-medium rounded-md hover:bg-red-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

