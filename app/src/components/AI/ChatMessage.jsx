// ChatMessage - Individual message bubble component

import ReactMarkdown from 'react-markdown';
import { FUNCTION_STATUS } from '../../utils/aiConstants';

/**
 * Message bubble component for chat interface
 * Displays user messages, AI responses, and function calls
 */
export default function ChatMessage({ message, isUser, timestamp, functionCalls, isError, isStreaming, onRetry }) {
  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fadeIn`}>
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Message bubble */}
        <div
          className={`
            rounded-2xl px-4 py-2.5 shadow-sm
            ${isUser 
              ? 'bg-blue-500 text-white rounded-br-none' 
              : isError
                ? 'bg-red-50 text-red-900 border border-red-200 rounded-bl-none'
                : 'bg-gray-100 text-gray-900 rounded-bl-none'
            }
            ${isStreaming ? 'animate-pulse' : ''}
          `}
        >
          {/* Message content */}
          <div className="text-sm leading-relaxed break-words markdown-content">
            {isUser ? (
              // Render user messages as plain text
              <div className="whitespace-pre-wrap">{message}</div>
            ) : (
              // Render AI messages with markdown formatting
              <ReactMarkdown
                components={{
                  // Style headers
                  h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-base font-bold mb-2 mt-2" {...props} />,
                  // Style paragraphs
                  p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                  // Style lists
                  ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                  li: ({node, ...props}) => <li className="ml-2" {...props} />,
                  // Style code blocks
                  code: ({node, inline, ...props}) => 
                    inline 
                      ? <code className="bg-gray-200 bg-opacity-50 px-1 py-0.5 rounded text-xs font-mono" {...props} />
                      : <code className="block bg-gray-200 bg-opacity-50 p-2 rounded text-xs font-mono overflow-x-auto my-2" {...props} />,
                  // Style strong/bold
                  strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                  // Style emphasis/italic
                  em: ({node, ...props}) => <em className="italic" {...props} />,
                  // Style horizontal rules
                  hr: ({node, ...props}) => <hr className="my-3 border-gray-300 opacity-30" {...props} />,
                  // Style links
                  a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
                }}
              >
                {message}
              </ReactMarkdown>
            )}
          </div>

          {/* Function calls indicator */}
          {functionCalls && functionCalls.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
              {functionCalls.map((call, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-xs bg-white bg-opacity-50 rounded px-2 py-1"
                >
                  <span className="text-gray-600">
                    {call.status === 'executing' && FUNCTION_STATUS.executing}
                    {call.status === 'success' && FUNCTION_STATUS.success}
                    {call.status === 'error' && FUNCTION_STATUS.error}
                  </span>
                  <span className="font-medium">
                    {call.name}
                  </span>
                  {call.result && (
                    <span className="text-gray-500 text-xs truncate">
                      {call.result}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        {timestamp && (
          <div className="text-xs text-gray-400 mt-1 px-2">
            {formatTime(timestamp)}
          </div>
        )}

        {/* Error retry button */}
        {isError && onRetry && (
          <button
            className="text-xs text-red-600 hover:text-red-700 hover:underline mt-1 px-2 flex items-center gap-1 transition-colors"
            onClick={onRetry}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

