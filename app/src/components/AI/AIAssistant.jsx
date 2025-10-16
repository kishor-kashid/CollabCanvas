// AIAssistant - Main AI chat interface window

import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import { UI_CONFIG, EXAMPLE_COMMANDS } from '../../utils/aiConstants';

/**
 * Main AI Assistant chat window
 * Handles message display, input, and chat interactions
 */
export default function AIAssistant({ isOpen, onClose, onSendMessage, onClearHistory, onRetry, messages, isLoading }) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { chatWindow, messages: msgConfig } = UI_CONFIG;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Hide suggestions after first message
  useEffect(() => {
    if (messages.length > 0) {
      setShowSuggestions(false);
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Validate message length
    if (input.length > msgConfig.maxLength) {
      alert(`Message too long! Maximum ${msgConfig.maxLength} characters.`);
      return;
    }
    
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const insertSuggestion = (suggestion) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed z-[9998] bg-white rounded-xl shadow-2xl flex flex-col animate-slideIn"
      style={{
        width: `${chatWindow.width}px`,
        height: `${chatWindow.heightVh}vh`,
        bottom: `${chatWindow.bottomOffset}px`,
        right: `${chatWindow.rightOffset}px`,
        borderRadius: `${chatWindow.borderRadius}px`,
        pointerEvents: 'auto', // Ensure chat window receives clicks
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <div>
            <h3 className="font-semibold text-lg">AI Assistant</h3>
            <p className="text-xs text-blue-100">Powered by GPT-4</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Clear history button */}
          <button
            onClick={() => {
              if (window.confirm('Clear all chat history? This cannot be undone.')) {
                onClearHistory?.();
              }
            }}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            aria-label="Clear history"
            title="Clear history"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
        {/* Welcome message */}
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">👋</div>
            <h4 className="font-semibold text-gray-900 mb-2">Welcome to AI Assistant!</h4>
            <p className="text-sm text-gray-600 mb-4">
              I can help you create and manipulate shapes on the canvas using natural language.
            </p>
          </div>
        )}

        {/* Suggested commands */}
        {showSuggestions && messages.length === 0 && (
          <div className="space-y-4 mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Try these commands:</p>
            {EXAMPLE_COMMANDS.slice(0, 2).map((category, catIndex) => (
              <div key={catIndex}>
                <p className="text-xs font-medium text-gray-700 mb-2">{category.category}</p>
                <div className="space-y-1">
                  {category.examples.slice(0, 2).map((example, exIndex) => (
                    <button
                      key={exIndex}
                      onClick={() => insertSuggestion(example)}
                      className="w-full text-left text-sm bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg, index) => (
          <ChatMessage
            key={index}
            message={msg.content}
            isUser={msg.role === 'user'}
            timestamp={msg.timestamp}
            functionCalls={msg.functionCalls}
            isError={msg.isError}
            isStreaming={msg.isStreaming}
            onRetry={msg.isError && msg.originalMessage ? () => {
              onRetry?.(msg.originalMessage);
              setInput(msg.originalMessage);
              // Auto-submit after a brief delay
              setTimeout(() => {
                if (inputRef.current) {
                  const form = inputRef.current.closest('form');
                  form?.requestSubmit();
                }
              }, 100);
            } : undefined}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI to create, move, or arrange shapes..."
              disabled={isLoading}
              rows={1}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
              style={{ 
                minHeight: '48px',
                maxHeight: '120px',
              }}
            />
            
            {/* Character count */}
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {input.length}/{msgConfig.maxLength}
            </div>
          </div>
          
          {/* Send button */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[48px]"
            aria-label="Send message"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Helper text */}
        <p className="text-xs text-gray-500 mt-2">
          Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Enter</kbd> to send, 
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs ml-1">Shift+Enter</kbd> for new line
        </p>
      </form>
    </div>
  );
}

