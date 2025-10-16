// ChatMessage - Individual message bubble component

import { FUNCTION_STATUS } from '../../utils/aiConstants';

/**
 * Message bubble component for chat interface
 * Displays user messages, AI responses, and function calls
 */
export default function ChatMessage({ message, isUser, timestamp, functionCalls, isError, isStreaming }) {
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
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message}
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
        {isError && (
          <button
            className="text-xs text-red-600 hover:text-red-700 mt-1 px-2 underline"
            onClick={() => {
              // TODO: Implement retry logic
              console.log('Retry message');
            }}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

