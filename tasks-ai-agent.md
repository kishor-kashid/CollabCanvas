# CollabCanvas AI Canvas Agent - Development Task List

## Project Structure (AI Phase)

```
collabcanvas/app/src/
├── components/
│   └── AI/
│       ├── AIChatButton.jsx       # Floating chat button
│       ├── AIAssistant.jsx        # Main chat interface
│       └── ChatMessage.jsx        # Message bubble component
├── services/
│   ├── aiService.js               # OpenAI integration
│   ├── aiTools.js                 # Tool definitions & execution
│   ├── chatHistory.js             # Firestore chat persistence
│   └── aiHelpers.js               # Utility functions
├── utils/
│   └── aiConstants.js             # AI-specific constants
```

---

## PR #10: Environment Setup & OpenAI Integration

**Branch:** `feature/ai-setup`  
**Goal:** Set up OpenAI integration and create basic service infrastructure

### Tasks:

- [ ] **10.1: Install OpenAI Package**
  - Run: `npm install openai`
  - Update `package.json`
  - Verify installation

- [ ] **10.2: Add Environment Variables**
  - Create `.env.example` if it doesn't exist
  - Add `VITE_OPENAI_API_KEY=your_key_here`
  - Add `VITE_OPENAI_MODEL=gpt-4-turbo-preview`
  - Update local `.env` file
  - Document in README

- [ ] **10.3: Create AI Constants**
  - Files to create: `src/utils/aiConstants.js`
  - Define rate limits, timeouts, model settings
  - Define system prompts and example commands
  - Export all constants

- [ ] **10.4: Create AI Service Shell**
  - Files to create: `src/services/aiService.js`
  - Initialize OpenAI client
  - Create `sendMessage()` function skeleton
  - Create `streamChatCompletion()` function skeleton
  - Export service functions

- [ ] **10.5: Test OpenAI Connection**
  - Create simple test in console
  - Verify API key works
  - Test basic completion
  - Handle API errors gracefully

**PR Checklist:**
- [ ] OpenAI package installed
- [ ] Environment variables configured
- [ ] AI service initialized successfully
- [ ] Basic API call works
- [ ] Error handling in place

---

## PR #11: AI Tool Definitions & Canvas Integration

**Branch:** `feature/ai-tools`  
**Goal:** Define all tool schemas and implement execution logic

### Tasks:

- [ ] **11.1: Create AI Helpers**
  - Files to create: `src/services/aiHelpers.js`
  - `findShapesByDescription(shapes, description)` - Match shapes by color/size/type
  - `parseColor(colorString)` - Convert color names to hex
  - `calculateCenter(viewportWidth, viewportHeight)` - Get canvas center
  - `parsePosition(positionString)` - Extract x, y from natural language

- [ ] **11.2: Define Tool Schemas**
  - Files to create: `src/services/aiTools.js`
  - Define JSON schema for each tool:
    1. `createShape` - type, x, y, width, height, color, text
    2. `moveShape` - shapeId/description, x, y, relative
    3. `resizeShape` - shapeId/description, scale/width/height
    4. `rotateShape` - shapeId/description, degrees
    5. `changeShapeColor` - shapeId/description, color
    6. `arrangeShapes` - shapeIds/selection, layout (horizontal/vertical/grid)
    7. `getCanvasState` - no params, returns all shapes
    8. `getSelectedShapes` - no params, returns selected
    9. `selectShapesByDescription` - description
    10. `createComplexLayout` - layoutType, config

- [ ] **11.3: Implement Tool Execution Functions**
  - Files to update: `src/services/aiTools.js`
  - `executeCreateShape(params, context)` - map to context.addShape()
  - `executeMoveShape(params, context)` - identify shape, call context.updateShape()
  - `executeResizeShape(params, context)` - calculate dimensions, update
  - `executeRotateShape(params, context)` - update rotation
  - `executeChangeShapeColor(params, context)` - update fill color
  - `executeArrangeShapes(params, context)` - calculate positions, batch update
  - `executeGetCanvasState(params, context)` - serialize shapes array
  - `executeGetSelectedShapes(params, context)` - return selected shapes
  - `executeSelectShapesByDescription(params, context)` - fuzzy match
  - `executeCreateComplexLayout(params, context)` - multi-step creation

- [ ] **11.4: Create Tool Router**
  - Files to update: `src/services/aiTools.js`
  - `executeToolCall(toolName, params, context)` - route to correct executor
  - Error handling for invalid tools
  - Return structured results

- [ ] **11.5: Expose Canvas Methods for AI**
  - Files to update: `src/contexts/CanvasContext.jsx`
  - Ensure `addShape`, `updateShape`, `deleteShape` are exposed
  - Add `batchUpdateShapes()` for layout operations
  - Add getter for current selection
  - No changes to existing functionality

**PR Checklist:**
- [ ] All 10 tool schemas defined
- [ ] All execution functions implemented
- [ ] Tool router works correctly
- [ ] Canvas context exposes needed methods
- [ ] Shape identification logic works
- [ ] Complex layout creation works

---

## PR #12: AI Chat UI Components

**Branch:** `feature/ai-chat-ui`  
**Goal:** Build the chat interface components

### Tasks:

- [ ] **12.1: Create AI Chat Button**
  - Files to create: `src/components/AI/AIChatButton.jsx`
  - Rounded circle button (60px diameter)
  - Robot/AI icon (use SVG or emoji 🤖)
  - Position: fixed, bottom-right (24px from edges)
  - Hover effect: scale slightly, show tooltip "Built with AI"
  - onClick: toggle chat window
  - Z-index: ensure above canvas but below modals

- [ ] **12.2: Create Chat Message Component**
  - Files to create: `src/components/AI/ChatMessage.jsx`
  - Props: `message`, `role`, `timestamp`, `functionCalls`
  - User messages: right-aligned, blue background
  - AI messages: left-aligned, gray background
  - Function call badges: small pills showing "Creating shape..."
  - Timestamp: small gray text
  - Error state: red background
  - Markdown support for AI responses (optional)

- [ ] **12.3: Create AI Assistant Window**
  - Files to create: `src/components/AI/AIAssistant.jsx`
  - Container: fixed position, bottom-right (80px from bottom, 24px from right)
  - Width: 420px (~2.25x canvas controls)
  - Height: 25vh (viewport height)
  - Border-radius: 12px
  - Box-shadow for elevation
  - Slide-in animation when opened

- [ ] **12.4: Add Chat Header**
  - Files to update: `src/components/AI/AIAssistant.jsx`
  - Title: "AI Assistant" with icon
  - Close button (X): top-right corner
  - Optional: minimize button
  - Optional: clear history button (trash icon)
  - Background: gradient or solid color

- [ ] **12.5: Add Messages Area**
  - Files to update: `src/components/AI/AIAssistant.jsx`
  - Scrollable container (flex-1)
  - Auto-scroll to bottom on new messages
  - Show welcome message on first open
  - Show suggested commands (optional)
  - Loading skeleton while fetching history
  - Empty state: "Start chatting with AI!"

- [ ] **12.6: Add Input Area**
  - Files to update: `src/components/AI/AIAssistant.jsx`
  - Text input field: multiline (max 3 rows)
  - Placeholder: "Ask AI to create, move, or arrange shapes..."
  - Send button: icon (paper plane) or text "Send"
  - Enter to send, Shift+Enter for new line
  - Disabled during streaming
  - Character limit: 500 chars (optional)

- [ ] **12.7: Style with Tailwind**
  - Files to update: All AI component files
  - Consistent spacing and typography
  - Smooth transitions and animations
  - Responsive design (scale down on small screens)
  - Dark mode support (optional)

**PR Checklist:**
- [ ] Chat button appears in correct position
- [ ] Button has hover effect and tooltip
- [ ] Chat window opens/closes smoothly
- [ ] Messages display correctly (user vs AI)
- [ ] Scrolling works properly
- [ ] Input field works and validates
- [ ] Styling is consistent and polished
- [ ] Animations are smooth

---

## PR #13: OpenAI Streaming & Function Calling

**Branch:** `feature/ai-streaming`  
**Goal:** Integrate OpenAI with streaming and function calling

### Tasks:

- [ ] **13.1: Implement Chat Completion**
  - Files to update: `src/services/aiService.js`
  - `sendMessage(messages, tools)` - send to OpenAI with tools
  - Include system prompt with canvas context
  - Pass current canvas state in context
  - Handle function calls in response
  - Return completion object

- [ ] **13.2: Implement Streaming**
  - Files to update: `src/services/aiService.js`
  - `streamChatCompletion(messages, tools, onChunk, onComplete)`
  - Use OpenAI streaming API
  - Emit chunks word-by-word
  - Handle function call chunks
  - Handle stream errors
  - Support cancellation via AbortController

- [ ] **13.3: Create Function Call Handler**
  - Files to update: `src/services/aiService.js`
  - `handleFunctionCalls(functionCalls, context)` - execute tools
  - Call appropriate tool executors from aiTools.js
  - Collect results from all function calls
  - Return results for follow-up AI response
  - Handle execution errors

- [ ] **13.4: Create System Prompt**
  - Files to update: `src/services/aiService.js`
  - Define AI's role and capabilities
  - Explain available tools and when to use them
  - Include canvas dimensions and constraints
  - Instruct to ask for clarification when ambiguous
  - Instruct to show plan for complex commands

- [ ] **13.5: Integrate Streaming in UI**
  - Files to update: `src/components/AI/AIAssistant.jsx`
  - Call `streamChatCompletion()` on user message
  - Display streaming response word-by-word
  - Show "AI is typing..." indicator
  - Show function call executions in real-time
  - Handle stream completion
  - Handle errors during streaming

- [ ] **13.6: Handle Function Call Flow**
  - Files to update: `src/components/AI/AIAssistant.jsx`
  - When AI returns function calls:
    1. Execute functions via aiTools
    2. Show execution feedback (badges/indicators)
    3. Send results back to AI
    4. Stream final AI response
  - Handle multiple function calls in sequence
  - Show progress for each function

**PR Checklist:**
- [ ] OpenAI streaming works
- [ ] Responses appear word-by-word
- [ ] Function calls execute correctly
- [ ] Function results return to AI
- [ ] Final response displays properly
- [ ] Errors handled gracefully
- [ ] Cancellation works
- [ ] No memory leaks

---

## PR #14: Chat History Persistence

**Branch:** `feature/chat-history`  
**Goal:** Persist chat messages to Firestore per user

### Tasks:

- [ ] **14.1: Create Chat History Service**
  - Files to create: `src/services/chatHistory.js`
  - `saveMessage(userId, message)` - save to Firestore
  - `loadMessages(userId, limit)` - fetch user's messages
  - `clearHistory(userId)` - delete all messages
  - `deleteMessage(userId, messageId)` - delete single message
  - Use collection: `/chatHistory/{userId}/messages`

- [ ] **14.2: Define Firestore Schema**
  - Collection: `chatHistory/{userId}/messages/{messageId}`
  - Document structure:
    ```javascript
    {
      id: string (auto-generated),
      userId: string,
      role: 'user' | 'assistant' | 'system',
      content: string,
      timestamp: Timestamp,
      functionCalls: [
        {
          name: string,
          arguments: object,
          result: string
        }
      ]
    }
    ```

- [ ] **14.3: Update Firestore Security Rules**
  - Files to update: `firestore.rules`
  - Allow users to read/write only their own chat history
  - Rule:
    ```javascript
    match /chatHistory/{userId}/messages/{messageId} {
      allow read, write: if request.auth.uid == userId;
    }
    ```

- [ ] **14.4: Load History on Mount**
  - Files to update: `src/components/AI/AIAssistant.jsx`
  - useEffect: load messages when chat opens
  - Show loading skeleton while fetching
  - Populate messages state
  - Auto-scroll to bottom
  - Limit to last 50 messages (pagination optional)

- [ ] **14.5: Save Messages After Each Exchange**
  - Files to update: `src/components/AI/AIAssistant.jsx`
  - After user sends message: save to Firestore
  - After AI responds: save assistant message
  - Include function calls in saved message
  - Handle save errors gracefully

- [ ] **14.6: Add Clear History Function**
  - Files to update: `src/components/AI/AIAssistant.jsx`
  - Add button/menu option to clear history
  - Confirmation dialog: "Clear all chat history?"
  - Call `clearHistory()` service
  - Clear local state
  - Show success message

**PR Checklist:**
- [ ] Messages save to Firestore
- [ ] Messages load on chat open
- [ ] Only user's own messages visible
- [ ] Clear history works
- [ ] Security rules enforced
- [ ] Loading states show correctly
- [ ] Errors handled

---

## PR #15: Advanced Features & Polish

**Branch:** `feature/ai-advanced`  
**Goal:** Add multi-step planning, rate limiting, and polish

### Tasks:

- [ ] **15.1: Implement Rate Limiting**
  - Files to create: `src/utils/rateLimiter.js`
  - Track commands per user per minute
  - Store in localStorage: `ai_commands_{userId}_{minute}`
  - Check limit before sending message
  - Show remaining quota in UI
  - Display countdown when limited
  - Reset after 60 seconds

- [ ] **15.2: Add Rate Limit UI**
  - Files to update: `src/components/AI/AIAssistant.jsx`
  - Show quota: "8/10 commands remaining this minute"
  - Disable input when limit hit
  - Show countdown: "Reset in 23 seconds"
  - Toast notification when limited

- [ ] **15.3: Implement Multi-Step Planning**
  - Files to update: `src/services/aiService.js`
  - Detect complex commands (via tool call or AI response)
  - Ask AI to generate plan before execution
  - Return plan to UI for confirmation
  - Update system prompt to explain planning

- [ ] **15.4: Add Plan Confirmation UI**
  - Files to update: `src/components/AI/AIAssistant.jsx`
  - Show plan in special message bubble
  - "Proceed" and "Cancel" buttons
  - If proceed: execute plan steps sequentially
  - Show progress: "Step 1/5: Creating username field... ✓"
  - If cancel: acknowledge and wait for new command

- [ ] **15.5: Add Suggested Commands**
  - Files to update: `src/components/AI/AIAssistant.jsx`
  - Show 4-6 example commands when chat first opens
  - Examples: "Create a red circle", "Arrange shapes horizontally"
  - Clicking a suggestion inserts it into input
  - Hide after first user message

- [ ] **15.6: Add Typing Indicators**
  - Files to update: `src/components/AI/AIAssistant.jsx`
  - Show "AI is typing..." when waiting for response
  - Animated dots: "..."
  - Show during function execution: "AI is creating shapes..."
  - Clear when response starts streaming

- [ ] **15.7: Improve Error Messages**
  - Files to update: `src/services/aiService.js`, `src/components/AI/AIAssistant.jsx`
  - API errors: "AI temporarily unavailable. Please try again."
  - Invalid commands: Show examples of valid commands
  - Ambiguous commands: List matching shapes and ask to clarify
  - Network errors: "Connection lost. Retrying..."
  - Provide "Retry" button for failed messages

- [ ] **15.8: Add Animations & Transitions**
  - Files to update: All AI component files
  - Chat window: slide in from bottom-right
  - Messages: fade in sequentially
  - Function call badges: pulse during execution
  - Button hover effects
  - Smooth scroll to new messages
  - Success/error shake animations

- [ ] **15.9: Add Keyboard Shortcuts**
  - Files to update: `src/components/AI/AIAssistant.jsx`
  - Ctrl/Cmd + K: Open/close chat
  - Escape: Close chat
  - Enter: Send message
  - Shift + Enter: New line in input

**PR Checklist:**
- [ ] Rate limiting works (10 commands/min)
- [ ] Quota displayed in UI
- [ ] Countdown timer accurate
- [ ] Multi-step planning works
- [ ] Plan confirmation UI functional
- [ ] Suggested commands appear
- [ ] Typing indicators show
- [ ] Error messages helpful
- [ ] Animations smooth
- [ ] Keyboard shortcuts work

---

## PR #16: Integration & Testing

**Branch:** `feature/ai-integration`  
**Goal:** Integrate AI button into Canvas and comprehensive testing

### Tasks:

- [ ] **16.1: Add AI Chat Button to Canvas**
  - Files to update: `src/components/Canvas/Canvas.jsx`
  - Import `AIChatButton` and `AIAssistant`
  - Add at end of component (outside Stage)
  - Ensure z-index doesn't overlap with canvas controls
  - Only show when user is authenticated
  - Manage open/closed state

- [ ] **16.2: Test All Command Types**
  - Test each of the 10+ command types:
    1. Create red circle at 200, 300 ✓
    2. Make 150x200 blue rectangle ✓
    3. Add text "Welcome" at 100, 50 ✓
    4. Move blue rectangle to center ✓
    5. Make circle twice as big ✓
    6. Rotate selected text 45 degrees ✓
    7. Change rectangle to red ✓
    8. Arrange shapes horizontally ✓
    9. Create 3x3 grid of squares ✓
    10. Create login form ✓
    11. Build navigation bar ✓
    12. Make card layout ✓

- [ ] **16.3: Test Command Variations**
  - Test different phrasings for same command
  - Test with/without specific positions
  - Test with color names vs hex codes
  - Test with selected vs described shapes
  - Test edge cases (canvas boundaries, invalid params)

- [ ] **16.4: Test Shape Identification**
  - Test "the blue rectangle" (single match)
  - Test "the blue rectangle" (multiple matches → clarification)
  - Test "the largest circle"
  - Test "the shape in top-left"
  - Test "the selected shape"

- [ ] **16.5: Test Real-Time Sync**
  - Open two browser windows
  - User A asks AI to create shape
  - Verify User B sees shape immediately
  - Verify AI actions respect object locking
  - Test with multiple concurrent AI operations

- [ ] **16.6: Test Error Handling**
  - Test with invalid API key
  - Test with network disconnected
  - Test with malformed commands
  - Test rate limit (send 11 commands quickly)
  - Verify all errors show user-friendly messages

- [ ] **16.7: Test Chat History**
  - Send messages and close chat
  - Reopen chat: verify history loads
  - Refresh page: verify history persists
  - Clear history: verify it's deleted
  - Test with multiple users: verify isolation

- [ ] **16.8: Performance Testing**
  - Measure response time for simple commands (<2s)
  - Measure response time for complex commands (<5s)
  - Test with 100+ shapes on canvas
  - Verify 60 FPS maintained during AI operations
  - Check for memory leaks during extended chat

- [ ] **16.9: UI/UX Polish**
  - Test on different screen sizes
  - Verify responsive behavior
  - Test keyboard navigation
  - Verify all hover states
  - Check accessibility (alt text, ARIA labels)
  - Test color contrast
  - Verify animations are smooth

- [ ] **16.10: Cross-Browser Testing**
  - Test in Chrome
  - Test in Firefox
  - Test in Safari
  - Test in Edge
  - Fix any compatibility issues

**PR Checklist:**
- [ ] AI button integrated into Canvas
- [ ] All 10+ command types work reliably
- [ ] Command variations handled
- [ ] Shape identification works correctly
- [ ] Real-time sync confirmed
- [ ] All error scenarios handled
- [ ] Chat history persists correctly
- [ ] Performance targets met (<2s simple, <5s complex)
- [ ] UI is polished and responsive
- [ ] Cross-browser compatible

---

## PR #17: Documentation & Deployment

**Branch:** `feature/ai-docs`  
**Goal:** Document AI features and prepare for deployment

### Tasks:

- [ ] **17.1: Update README**
  - Files to update: `app/README.md`, `README.md`
  - Add AI Canvas Agent section
  - Document OpenAI API key requirement
  - List all supported commands with examples
  - Add troubleshooting for AI features
  - Include screenshots of AI chat

- [ ] **17.2: Update Environment Documentation**
  - Files to update: `.env.example`
  - Add `VITE_OPENAI_API_KEY=sk-proj-...`
  - Add `VITE_OPENAI_MODEL=gpt-4-turbo-preview`
  - Document where to get OpenAI API key

- [ ] **17.3: Create AI Command Reference**
  - Files to create: `AI-COMMANDS.md`
  - List all command categories
  - Provide 3-5 examples for each category
  - Show expected results
  - Include tips and best practices

- [ ] **17.4: Update Firestore Rules**
  - Files to update: `firestore.rules`
  - Ensure chatHistory rules are deployed
  - Test rules in Firestore emulator
  - Deploy to production

- [ ] **17.5: Test Deployed App**
  - Deploy to Firebase Hosting
  - Test AI chat in production
  - Verify API key works
  - Test with multiple users
  - Verify real-time sync
  - Check chat history persistence

- [ ] **17.6: Create Demo Script**
  - Document key features to demonstrate:
    1. Open AI chat
    2. Simple creation command
    3. Manipulation command
    4. Layout command
    5. Complex command (login form)
    6. Show real-time sync
    7. Show chat history persistence

- [ ] **17.7: Update PRD**
  - Files to update: `PRD.md`
  - Mark AI features as complete
  - Update status badges
  - Add performance metrics achieved

**PR Checklist:**
- [ ] README updated with AI features
- [ ] Environment variables documented
- [ ] AI command reference created
- [ ] Firestore rules deployed
- [ ] App deployed and tested
- [ ] Demo script prepared
- [ ] All documentation complete

---

## AI Canvas Agent Completion Checklist

### Required Features:

- [ ] AI chat interface (floating button + chat window)
- [ ] 10+ distinct command types across all categories
- [ ] OpenAI GPT-4 integration with function calling
- [ ] Real-time sync (AI actions visible to all users)
- [ ] Chat history persistence per user
- [ ] Response streaming (word-by-word)
- [ ] Multi-step planning for complex commands
- [ ] Shape identification and clarification
- [ ] Rate limiting (10 commands/minute)
- [ ] Error handling and recovery

### Command Categories:

- [ ] Creation (3+ types): ✓ Create by position, ✓ Create with dimensions, ✓ Create text
- [ ] Manipulation (4+ types): ✓ Move, ✓ Resize, ✓ Rotate, ✓ Change color
- [ ] Layout (3+ types): ✓ Arrange, ✓ Grid, ✓ Spacing
- [ ] Complex (2+ types): ✓ Login form, ✓ Navigation bar, ✓ Card layout

### Performance Targets:

- [ ] Simple commands: <2 seconds response time
- [ ] Complex commands: <5 seconds with plan
- [ ] Real-time sync: <100ms for AI actions
- [ ] Canvas performance: 60 FPS maintained
- [ ] No memory leaks or crashes

### Integration:

- [ ] AI actions sync via Firestore
- [ ] AI respects object locking
- [ ] Works with multiple concurrent users
- [ ] No conflicts with manual editing
- [ ] Canvas context properly integrated

### UI/UX:

- [ ] Chat button positioned correctly (bottom-right, 24px spacing)
- [ ] Chat window sized correctly (~420px wide, 25vh height)
- [ ] Messages styled properly (user blue, AI gray)
- [ ] Smooth animations and transitions
- [ ] Keyboard shortcuts work
- [ ] Suggested commands helpful
- [ ] Error messages clear

### Testing:

- [ ] All command types tested individually
- [ ] Command variations tested
- [ ] Multi-user real-time sync tested
- [ ] Error scenarios tested
- [ ] Performance benchmarked
- [ ] Cross-browser tested

---

## Target Score: 9-10 points

With 10+ commands, all categories covered, reliable execution, and excellent UX, this implementation targets the "Excellent" tier of the grading rubric.

