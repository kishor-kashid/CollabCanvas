// AI Service - OpenAI Integration for Canvas Agent

import OpenAI from 'openai';
import {
  OPENAI_CONFIG,
  SYSTEM_PROMPTS,
  ERROR_MESSAGES,
  TIMING,
} from '../utils/aiConstants';

// Initialize OpenAI client
let openaiClient = null;

/**
 * Initialize the OpenAI client
 * @throws {Error} If API key is missing
 */
export function initializeOpenAI() {
  if (!OPENAI_CONFIG.apiKey || OPENAI_CONFIG.apiKey === 'your_openai_api_key_here') {
    throw new Error(ERROR_MESSAGES.apiKeyMissing);
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: OPENAI_CONFIG.apiKey,
      dangerouslyAllowBrowser: true, // Note: In production, use a backend proxy
    });
    console.log('✅ OpenAI client initialized');
  }

  return openaiClient;
}

/**
 * Get the OpenAI client instance
 * @returns {OpenAI} OpenAI client
 */
export function getOpenAIClient() {
  if (!openaiClient) {
    return initializeOpenAI();
  }
  return openaiClient;
}

/**
 * Send a message to OpenAI with function calling
 * @param {Array} messages - Conversation history
 * @param {Array} tools - Available tools for function calling
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} OpenAI response
 */
export async function sendMessage(messages, tools = [], options = {}) {
  try {
    const client = getOpenAIClient();

    const requestPayload = {
      model: OPENAI_CONFIG.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.main },
        ...messages,
      ],
      temperature: options.temperature || OPENAI_CONFIG.temperature,
      max_tokens: options.maxTokens || OPENAI_CONFIG.maxTokens,
    };

    // Add tools if provided
    if (tools && tools.length > 0) {
      requestPayload.tools = tools;
      requestPayload.tool_choice = 'auto'; // Let AI decide when to use tools
    }

    console.log('🤖 Sending message to OpenAI...', {
      messageCount: messages.length,
      toolCount: tools.length,
    });

    const response = await client.chat.completions.create(requestPayload);

    console.log('✅ Received response from OpenAI', {
      finishReason: response.choices[0].finish_reason,
      hasToolCalls: !!response.choices[0].message.tool_calls,
    });

    return response;
  } catch (error) {
    console.error('❌ OpenAI API Error:', error);
    
    if (error.code === 'invalid_api_key') {
      throw new Error(ERROR_MESSAGES.apiKeyMissing);
    }
    
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error(ERROR_MESSAGES.networkError);
    }
    
    throw new Error(ERROR_MESSAGES.apiError);
  }
}

/**
 * Stream chat completion from OpenAI
 * @param {Array} messages - Conversation history
 * @param {Array} tools - Available tools for function calling
 * @param {Function} onChunk - Callback for each chunk
 * @param {Function} onComplete - Callback when streaming completes
 * @param {Function} onError - Callback for errors
 * @param {AbortSignal} signal - Optional abort signal for cancellation
 * @returns {Promise<void>}
 */
export async function streamChatCompletion(
  messages,
  tools = [],
  onChunk,
  onComplete,
  onError,
  signal = null
) {
  try {
    const client = getOpenAIClient();

    const requestPayload = {
      model: OPENAI_CONFIG.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.main },
        ...messages,
      ],
      temperature: OPENAI_CONFIG.temperature,
      max_tokens: OPENAI_CONFIG.maxTokens,
      stream: true,
    };

    // Add tools if provided
    if (tools && tools.length > 0) {
      requestPayload.tools = tools;
      requestPayload.tool_choice = 'auto';
    }

    console.log('🤖 Starting streaming response...', {
      messageCount: messages.length,
      toolCount: tools.length,
    });

    const stream = await client.chat.completions.create(requestPayload, {
      signal, // Pass abort signal for cancellation
    });

    let fullContent = '';
    let toolCalls = [];
    let currentToolCall = null;

    for await (const chunk of stream) {
      // Check if streaming was cancelled
      if (signal?.aborted) {
        console.log('⚠️ Streaming cancelled by user');
        break;
      }

      const delta = chunk.choices[0]?.delta;
      const finishReason = chunk.choices[0]?.finish_reason;

      // Handle content (text response)
      if (delta?.content) {
        fullContent += delta.content;
        onChunk({
          type: 'content',
          content: delta.content,
          fullContent,
        });
      }

      // Handle tool calls
      if (delta?.tool_calls) {
        for (const toolCallDelta of delta.tool_calls) {
          const index = toolCallDelta.index;
          
          if (!toolCalls[index]) {
            toolCalls[index] = {
              id: toolCallDelta.id || '',
              type: 'function',
              function: {
                name: toolCallDelta.function?.name || '',
                arguments: '',
              },
            };
          }

          if (toolCallDelta.function?.name) {
            toolCalls[index].function.name = toolCallDelta.function.name;
          }

          if (toolCallDelta.function?.arguments) {
            toolCalls[index].function.arguments += toolCallDelta.function.arguments;
          }

          if (toolCallDelta.id) {
            toolCalls[index].id = toolCallDelta.id;
          }

          // Notify about tool call
          onChunk({
            type: 'tool_call',
            toolCall: toolCalls[index],
            isComplete: false,
          });
        }
      }

      // Handle completion
      if (finishReason) {
        console.log('✅ Streaming completed', {
          finishReason,
          contentLength: fullContent.length,
          toolCallCount: toolCalls.length,
        });

        onComplete({
          content: fullContent,
          toolCalls: toolCalls.length > 0 ? toolCalls : null,
          finishReason,
        });
        break;
      }
    }
  } catch (error) {
    console.error('❌ Streaming Error:', error);
    
    if (error.name === 'AbortError') {
      console.log('⚠️ Streaming aborted');
      return; // Don't treat cancellation as an error
    }
    
    let errorMessage = ERROR_MESSAGES.streamingError;
    
    if (error.code === 'invalid_api_key') {
      errorMessage = ERROR_MESSAGES.apiKeyMissing;
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorMessage = ERROR_MESSAGES.networkError;
    }
    
    if (onError) {
      onError(errorMessage);
    }
  }
}

/**
 * Handle function calls from OpenAI response
 * @param {Array} toolCalls - Tool calls from OpenAI
 * @param {Function} executeToolFn - Function to execute tools
 * @returns {Promise<Array>} Tool call results
 */
export async function handleFunctionCalls(toolCalls, executeToolFn) {
  if (!toolCalls || toolCalls.length === 0) {
    return [];
  }

  console.log('🔧 Executing function calls...', {
    count: toolCalls.length,
  });

  const results = [];

  for (const toolCall of toolCalls) {
    try {
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      console.log(`🔧 Executing: ${functionName}`, functionArgs);

      // Execute the tool via the provided executor function
      const result = await executeToolFn(functionName, functionArgs);

      results.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        name: functionName,
        content: JSON.stringify(result),
      });

      console.log(`✅ ${functionName} completed`, result);
    } catch (error) {
      console.error(`❌ Error executing ${toolCall.function.name}:`, error);
      
      results.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        name: toolCall.function.name,
        content: JSON.stringify({
          success: false,
          error: error.message || 'Execution failed',
        }),
      });
    }
  }

  return results;
}

/**
 * Check if API is configured and ready
 * @returns {boolean} True if API is ready
 */
export function isAPIConfigured() {
  return !!(OPENAI_CONFIG.apiKey && OPENAI_CONFIG.apiKey !== 'your_openai_api_key_here');
}

/**
 * Validate API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} True if format is valid
 */
export function validateAPIKey(apiKey) {
  return apiKey && (apiKey.startsWith('sk-') || apiKey.startsWith('sk-proj-'));
}

/**
 * Test the OpenAI connection
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testConnection() {
  try {
    console.log('🧪 Testing OpenAI connection...');
    
    const response = await sendMessage([
      { role: 'user', content: 'Hello, are you working?' },
    ]);

    const success = !!response.choices[0]?.message?.content;
    
    if (success) {
      console.log('✅ OpenAI connection test successful');
    } else {
      console.warn('⚠️ OpenAI connection test returned unexpected response');
    }
    
    return success;
  } catch (error) {
    console.error('❌ OpenAI connection test failed:', error);
    return false;
  }
}

// Export all functions
export default {
  initializeOpenAI,
  getOpenAIClient,
  sendMessage,
  streamChatCompletion,
  handleFunctionCalls,
  isAPIConfigured,
  validateAPIKey,
  testConnection,
};

