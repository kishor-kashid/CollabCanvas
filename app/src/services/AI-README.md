# AI Canvas Agent Services

## Overview

This directory contains the AI Canvas Agent services that enable natural language canvas manipulation using OpenAI GPT-4 function calling.

## Files Structure

```
services/
├── aiService.js          # OpenAI API integration (✅ Complete)
├── aiTools.js            # Tool definitions & execution (🚧 Next)
├── chatHistory.js        # Firestore persistence (⏳ Planned)
└── AI-README.md          # This file
```

## aiService.js

Core OpenAI integration service with streaming and function calling support.

### Key Functions

#### `initializeOpenAI()`
Initializes the OpenAI client with API key from environment variables.
- Throws error if API key is missing or invalid
- Returns OpenAI client instance

#### `sendMessage(messages, tools, options)`
Sends a message to OpenAI with optional function calling.
- **Parameters:**
  - `messages`: Array of conversation history
  - `tools`: Array of tool schemas for function calling
  - `options`: Additional options (temperature, maxTokens)
- **Returns:** Promise<Object> - OpenAI response

#### `streamChatCompletion(messages, tools, onChunk, onComplete, onError, signal)`
Streams chat completions word-by-word with real-time updates.
- **Parameters:**
  - `messages`: Conversation history
  - `tools`: Available tools
  - `onChunk`: Callback for each chunk (content or tool call)
  - `onComplete`: Callback when streaming finishes
  - `onError`: Error callback
  - `signal`: AbortSignal for cancellation
- **Features:**
  - Word-by-word streaming
  - Tool call detection during streaming
  - Cancellation support
  - Error handling

#### `handleFunctionCalls(toolCalls, executeToolFn)`
Processes and executes function calls from OpenAI.
- **Parameters:**
  - `toolCalls`: Array of tool calls from OpenAI response
  - `executeToolFn`: Function to execute tools
- **Returns:** Promise<Array> - Results for each tool call

#### `isAPIConfigured()`
Checks if OpenAI API key is configured.
- **Returns:** boolean

#### `testConnection()`
Tests the OpenAI API connection.
- **Returns:** Promise<boolean> - True if successful

### Usage Example

```javascript
import { streamChatCompletion, handleFunctionCalls } from './aiService';
import { getToolSchemas, executeTool } from './aiTools';

// Stream a chat completion
await streamChatCompletion(
  messages,
  getToolSchemas(),
  (chunk) => {
    if (chunk.type === 'content') {
      console.log('AI says:', chunk.content);
    } else if (chunk.type === 'tool_call') {
      console.log('Calling tool:', chunk.toolCall.function.name);
    }
  },
  (result) => {
    if (result.toolCalls) {
      // Execute function calls
      const results = await handleFunctionCalls(
        result.toolCalls,
        executeTool
      );
      
      // Send results back to AI for final response
      // ... continue conversation
    }
  },
  (error) => {
    console.error('Error:', error);
  }
);
```

## Configuration

### Environment Variables

Add to your `.env` file:

```env
VITE_OPENAI_API_KEY=sk-proj-your_key_here
VITE_OPENAI_MODEL=gpt-4-turbo-preview
```

### Constants

All AI-related constants are defined in `utils/aiConstants.js`:

- **OPENAI_CONFIG**: API key, model, temperature, max tokens
- **RATE_LIMIT**: Command limits and quota reset time
- **TIMING**: Response timing targets
- **UI_CONFIG**: Chat UI specifications
- **SYSTEM_PROMPTS**: AI behavior instructions
- **EXAMPLE_COMMANDS**: Suggested commands for users
- **ERROR_MESSAGES**: Standardized error messages
- **COLOR_MAP**: Natural language color parsing
- **LAYOUT_TEMPLATES**: Complex layout definitions

## Error Handling

The service handles several error types:

1. **Missing API Key**: Clear message directing user to setup
2. **Network Errors**: Retry suggestions with timeout
3. **API Errors**: Graceful degradation with fallback messages
4. **Streaming Errors**: Partial response handling
5. **Cancellation**: Clean abort without errors

## Security Notes

⚠️ **Important**: The current implementation uses `dangerouslyAllowBrowser: true` which exposes the API key in the browser. This is acceptable for development and personal projects.

**For production:**
- Implement a backend proxy to hide the API key
- Use Firebase Cloud Functions or similar serverless functions
- Never commit API keys to version control

## Testing

Test the OpenAI connection:

```javascript
import { testConnection } from './services/aiService';

const isWorking = await testConnection();
console.log('OpenAI is', isWorking ? 'working' : 'not working');
```

## Next Steps

1. **PR #11**: Create `aiTools.js` with tool schemas and execution logic
2. **PR #12**: Build UI components (AIChatButton, AIAssistant, ChatMessage)
3. **PR #13**: Integrate streaming and function calling in UI
4. **PR #14**: Add chat history persistence with Firestore
5. **PR #15**: Advanced features (rate limiting, planning, polish)

## Performance Targets

- ✅ Simple commands: <2 seconds
- ✅ Complex commands: <5 seconds with plan
- ✅ Streaming: <20ms between chunks
- ✅ Function execution: Immediate via existing canvas methods

## API Reference

### OpenAI Chat Completions API

The service uses OpenAI's Chat Completions API with:
- **Model**: gpt-4-turbo-preview (or gpt-4)
- **Temperature**: 0.7 (balanced creativity)
- **Max Tokens**: 1000 (sufficient for most responses)
- **Streaming**: Enabled for real-time updates
- **Function Calling**: Enabled with tool schemas

### Function Calling Flow

1. User sends message
2. AI analyzes message with available tools
3. AI decides to call one or more functions
4. Functions execute on canvas context
5. Results return to AI
6. AI generates final response
7. Response streams to user

## Troubleshooting

### "OpenAI API key is not configured"
- Add `VITE_OPENAI_API_KEY` to your `.env` file
- Restart dev server after adding environment variables

### "AI is temporarily unavailable"
- Check internet connection
- Verify API key is valid at https://platform.openai.com/api-keys
- Check OpenAI status at https://status.openai.com

### Streaming not working
- Check browser console for errors
- Verify OpenAI API key has proper permissions
- Ensure no network proxy is blocking WebSocket connections

### Rate limits hit
- OpenAI has rate limits per API key tier
- Upgrade your OpenAI plan if needed
- Implement request queuing for high-traffic scenarios

## Resources

- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Function Calling Guide](https://platform.openai.com/docs/guides/function-calling)
- [GPT-4 Turbo Overview](https://platform.openai.com/docs/models/gpt-4-turbo-and-gpt-4)
- [Streaming Documentation](https://platform.openai.com/docs/api-reference/streaming)

## Status

**PR #10: Environment Setup & OpenAI Integration** ✅ Complete

- ✅ OpenAI package installed (v6.3.0)
- ✅ Environment variables documented
- ✅ AI constants defined
- ✅ AI service created with full functionality
- ✅ Error handling implemented
- ✅ Streaming support added
- ✅ Function calling infrastructure ready
- ✅ Documentation complete

Ready for PR #11: AI Tool Definitions & Canvas Integration

