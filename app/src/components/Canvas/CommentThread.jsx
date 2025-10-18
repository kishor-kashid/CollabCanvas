// CommentThread.jsx - Panel showing comment thread

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  createComment, 
  deleteComment, 
  toggleResolveComment 
} from '../../services/comments';
import { formatRelativeTime } from '../../utils/dateFormatting';

/**
 * Comment thread panel component
 */
export default function CommentThread({ 
  thread, 
  shapeId, 
  position,
  onClose 
}) {
  const { currentUser } = useAuth();
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!thread || thread.length === 0) return null;
  
  const mainComment = thread[0];
  const replies = thread.slice(1);
  
  const handleReply = async () => {
    if (!replyText.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await createComment({
        text: replyText,
        shapeId,
        position,
        parentId: mainComment.id,
        threadId: mainComment.threadId || mainComment.id,
      }, currentUser);
      
      setReplyText('');
    } catch {
      alert('Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResolve = async () => {
    try {
      await toggleResolveComment(
        mainComment.id, 
        !mainComment.isResolved, 
        currentUser.uid
      );
    } catch {
      alert('Failed to toggle resolution');
    }
  };
  
  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    
    try {
      await deleteComment(commentId);
      
      // If deleting the main comment, close the panel
      if (commentId === mainComment.id) {
        onClose();
      }
    } catch {
      alert('Failed to delete comment');
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleReply();
    }
  };
  
  return (
    <div className="fixed right-4 top-20 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <h3 className="font-semibold text-gray-900">Comment Thread</h3>
          {mainComment.isResolved && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              Resolved
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition"
          title="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Comments scrollable area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Main comment */}
        <CommentItem 
          comment={mainComment}
          isMain={true}
          onDelete={handleDelete}
          currentUserId={currentUser.uid}
        />
        
        {/* Replies */}
        {replies.map(reply => (
          <CommentItem
            key={reply.id}
            comment={reply}
            isMain={false}
            onDelete={handleDelete}
            currentUserId={currentUser.uid}
          />
        ))}
      </div>
      
      {/* Reply input */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a reply... (Ctrl/Cmd+Enter to send)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
          rows={3}
        />
        <div className="flex justify-between items-center mt-2">
          <button
            onClick={handleResolve}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition flex items-center space-x-1 ${
              mainComment.isResolved
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {mainComment.isResolved ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span>Unresolve</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Resolve</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleReply}
            disabled={!replyText.trim() || isSubmitting}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? 'Posting...' : 'Reply'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual comment item component
 */
function CommentItem({ comment, isMain, onDelete, currentUserId }) {
  const isAuthor = comment.authorId === currentUserId;
  
  return (
    <div className={`${isMain ? '' : 'ml-8'}`}>
      <div className="flex items-start space-x-2">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
          {comment.authorName?.charAt(0).toUpperCase()}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm text-gray-900">{comment.authorName}</span>
              <span className="text-xs text-gray-500">
                {formatRelativeTime(comment.createdAt)}
              </span>
            </div>
            
            {isAuthor && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-gray-400 hover:text-red-600 transition flex-shrink-0"
                title="Delete comment"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
          
          <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap break-words">{comment.text}</p>
        </div>
      </div>
    </div>
  );
}

