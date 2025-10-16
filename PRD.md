# CollabCanvas - Product Requirements Document

**Project**: CollabCanvas - Real-Time Collaborative Design Tool  
**Goal**: Build a solid multiplayer foundation with AI-powered canvas manipulation

**Status**: MVP Complete ✅ | Phase 2: AI Canvas Agent 🚧

---

## Canvas Architecture (MVP)

**Single Global Canvas Approach:**

- MVP features ONE shared global canvas that all authenticated users access
- No project creation or management in MVP
- No canvas selection or dashboard
- All users collaborate on the same shared canvas space
- Future: Will add multi-project support with separate canvases per project

**URL Structure:**

- Simple route (e.g., `/canvas` or just `/`)
- No dynamic canvas IDs needed for MVP

---

## User Stories

### Primary User: Designer/Creator (MVP Priority)

- As a designer, I want to **create an account and log in** so that my work is associated with my identity
- As a designer, I want to **see a large canvas workspace** so that I have room to design
- As a designer, I want to **pan and zoom the canvas smoothly** so that I can navigate my design space
- As a designer, I want to **create basic shapes (rectangles)** so that I can build simple designs
- As a designer, I want to **move objects around the canvas** so that I can arrange my design
- As a designer, I want to **delete objects I've created** so that I can remove mistakes or unwanted elements
- As a designer, I want to **see other users' cursors with their names** so that I know who's working where
- As a designer, I want to **see changes made by other users in real-time** so that we can collaborate seamlessly
- As a designer, I want to **see who else is currently online** so that I know who I'm collaborating with
- As a designer, I want my **work to persist when I leave** so that I don't lose progress

**Note:** Focus on completing all Designer/Creator user stories before addressing Collaborator needs.

### Secondary User: Collaborator (Implement After Primary User)

- As a collaborator, I want to **join an existing canvas session** so that I can work with my team
- As a collaborator, I want to **see all existing objects when I join** so that I have full context
- As a collaborator, I want to **make changes without conflicts** so that multiple people can work simultaneously

---

## Key Features for MVP

### 1. Authentication System

**Must Have:**

- User registration via email/password (Firebase Auth)
- Google social login (Firebase Auth)
- User login/logout
- Persistent user sessions
- User display names visible to collaborators

**Display Name Logic:**

- Use Google display name if signing in via Google
- Use email prefix (before @) if signing in via email/password
- Display truncated version if name is too long (max 20 chars)

**Success Criteria:**

- Users can create accounts and maintain sessions across page refreshes
- Each user has a unique identifier and display name

### 2. Canvas Workspace

**Must Have:**

- Large canvas area (5000x5000px virtual space)
- Smooth pan functionality (click-and-drag)
- Zoom functionality (mousewheel or pinch)
- Visual grid or reference points (optional but helpful)
- Hard boundaries at canvas edges
- 60 FPS performance during all interactions

**Canvas Boundaries:**

- Objects cannot be placed or moved outside boundaries (5000x5000px)
- Drag operations stop at boundary edges
- Visual edge indicators (subtle border or shading) - optional but nice to have

**Success Criteria:**

- Canvas feels responsive and smooth
- No lag during pan/zoom operations
- Can handle at least 500 rectangles without performance degradation
- Objects are constrained within canvas boundaries

### 3. Shape Creation & Manipulation

**Must Have:**

- **Rectangles only for MVP** (circles and text out of scope)
- Ability to create new rectangles (click/drag or button)
- Ability to select shapes (click)
- Ability to move shapes (drag)
- Visual feedback for selected objects
- Fixed styling (gray fill color for all shapes)

**Selection Behavior:**

- Clicking a different shape automatically deselects the previous shape
- Only one shape can be selected at a time (multi-select out of scope)
- Clicking empty canvas deselects current selection

**Success Criteria:**

- Shape creation is intuitive and immediate
- Drag operations are smooth and responsive
- Selected state is clearly visible
- Selection behavior is predictable and consistent

### 4. Real-Time Synchronization

**Must Have:**

- Broadcast shape creation to all users (<100ms)
- Broadcast shape movements to all users (<100ms)
- Broadcast shape deletions to all users (<100ms)
- Handle concurrent edits without breaking
- Object locking: First user to select/drag an object locks it for editing
- Locked objects cannot be moved by other users simultaneously
- Visual indicator showing which user has locked an object
- Auto-release lock when user stops dragging

**Conflict Resolution Strategy:**

- First user to start moving an object acquires the lock
- Other users cannot move the locked object until lock is released
- Lock automatically releases after drag completes or timeout (3-5 seconds)
- Clear visual feedback when attempting to move a locked object

**Success Criteria:**

- Object changes visible to all users within 100ms
- No "ghost objects" or desync issues
- No simultaneous edits to the same object
- Clear visual feedback when an object is locked by another user
- Lock automatically releases after drag completes

### 5. Multiplayer Cursors

**Must Have:**

- Show cursor position for each connected user
- Display user name near cursor
- Update cursor positions in real-time (<50ms)
- Unique color per user

**Cursor Colors:**

- Randomly assigned from predefined color palette on user join
- Ensure sufficient contrast against white/light backgrounds
- Maintain color consistency per user throughout session

**Success Criteria:**

- Cursors move smoothly without jitter
- Names are readable and don't obscure content
- Cursor updates don't impact canvas performance
- Each user has a distinct, visible cursor color

### 6. Shape Deletion

**Must Have:**

- Delete selected shape with Delete/Backspace key
- Broadcast deletion to all users in real-time
- Deleted shapes removed from database immediately
- Cannot delete shapes locked by other users

**Success Criteria:**

- Deletion is instant and syncs across all clients within 100ms
- No "ghost shapes" after deletion
- Deleted shapes permanently removed from persistent storage

### 7. Presence Awareness

**Must Have:**

- List of currently connected users
- Real-time join/leave notifications
- Visual indicator of online status

**Success Criteria:**

- Users can see who's in the session at all times
- Join/leave events update immediately

### 8. State Persistence

**Must Have:**

- Save canvas state to database
- Load canvas state on page load
- Persist through disconnects and reconnects
- Multiple users can rejoin and see same state

**Success Criteria:**

- All users leave and return → work is still there
- Page refresh doesn't lose data
- New users joining see complete current state

### 9. Deployment

**Must Have:**

- Publicly accessible URL
- Stable hosting for 5+ concurrent users
- No setup required for users

**Success Criteria:**

- Anyone can access via URL
- Supports at least 5 simultaneous users
- No crashes under normal load

---

## Data Model

### Firestore Collection: `canvas` (single document for MVP)

**Document ID:** `global-canvas-v1`

```json
{
  "canvasId": "global-canvas-v1",
  "shapes": [
    {
      "id": "shape_uuid_1",
      "type": "rectangle",
      "x": 100,
      "y": 200,
      "width": 150,
      "height": 100,
      "fill": "#cccccc",
      "createdBy": "user_id",
      "createdAt": "timestamp",
      "lastModifiedBy": "user_id",
      "lastModifiedAt": "timestamp",
      "isLocked": false,
      "lockedBy": null
    }
  ],
  "lastUpdated": "timestamp"
}
```

### Firebase Realtime Database: `presence` (for cursors)

```json
{
  "sessions": {
    "global-canvas-v1": {
      "user_id_1": {
        "displayName": "John Doe",
        "cursorColor": "#FF5733",
        "cursorX": 450,
        "cursorY": 300,
        "lastSeen": "timestamp"
      },
      "user_id_2": {
        "displayName": "Jane Smith",
        "cursorColor": "#33C1FF",
        "cursorX": 620,
        "cursorY": 180,
        "lastSeen": "timestamp"
      }
    }
  }
}
```

**Why Two Databases?**

- Firestore: For persistent canvas state (shapes, metadata)
- Realtime Database: For high-frequency updates (cursor positions, presence)
- Realtime Database has lower latency for cursor movements

---

## Proposed Tech Stack

### Option 1: Firebase (Recommended for Speed)

**Frontend:**

- React + Vite
- Konva.js for canvas rendering
- Tailwind CSS for UI

**Backend:**

- Firebase Authentication
- Firestore for state persistence
- Firebase Realtime Database for cursor positions

**Pros:**

- Fastest setup (authentication is plug-and-play)
- Built-in real-time capabilities
- Generous free tier
- Automatic scaling
- Simple deployment with Firebase Hosting

**Cons:**

- Vendor lock-in to Google
- Firestore queries can be expensive at scale
- Less control over backend logic

**Pitfalls to Watch:**

- Firestore charges per read/write - optimize updates
- Need to structure data carefully (avoid deep nesting)
- Realtime Database better for cursor positions (lower latency)

---

### Option 2: Supabase + WebSockets

**Frontend:**

- React + Vite
- Konva.js for canvas rendering
- Tailwind CSS for UI

**Backend:**

- Supabase Auth
- Supabase PostgreSQL for state persistence
- Supabase Realtime for updates

**Pros:**

- Open source alternative to Firebase
- PostgreSQL is more flexible than Firestore
- Built-in real-time subscriptions
- Better for complex queries later

**Cons:**

- Slightly more setup than Firebase
- Realtime can be tricky with high-frequency updates
- Free tier has connection limits

**Pitfalls to Watch:**

- Realtime subscriptions count against connection limits
- Need to handle reconnection logic carefully
- Cursor updates might need separate WebSocket channel

---

### Option 3: Custom Backend (Express + Socket.io)

**Frontend:**

- React + Vite
- Konva.js for canvas rendering
- Tailwind CSS for UI

**Backend:**

- Node.js + Express
- Socket.io for real-time communication
- MongoDB or PostgreSQL for persistence
- Custom authentication or Auth0

**Pros:**

- Complete control over architecture
- Socket.io is purpose-built for real-time
- Can optimize exactly for your use case
- No vendor lock-in

**Cons:**

- Most time-consuming to build
- Need to build authentication from scratch
- More deployment complexity
- Need to manage scaling yourself

**Pitfalls to Watch:**

- Authentication takes significant time
- Need to handle WebSocket reconnection
- Scaling WebSockets requires sticky sessions
- More potential for bugs in custom code

---

## Recommended Stack for MVP

**Frontend:** React + Vite + Konva.js + Tailwind  
**Backend:** Firebase (Authentication + Firestore + Realtime Database)  
**Deployment:** Firebase Hosting or Vercel

**Rationale:** Given the 24-hour constraint, Firebase provides the fastest path to a working MVP. Authentication is solved, real-time is built-in, and deployment is simple. You can always migrate later if needed.

---

## Phase 2: AI Canvas Agent

### Overview

Build an AI-powered assistant that manipulates the canvas through natural language commands using OpenAI GPT-4 function calling. The AI agent enables users to create, modify, and arrange shapes using conversational language.

### User Stories

**As a designer:**
- I want to **create shapes using natural language** so that I can quickly prototype designs
- I want to **modify existing shapes by description** so that I can make changes without manual selection
- I want to **arrange multiple shapes with layout commands** so that I can organize my design efficiently
- I want to **create complex layouts with one command** so that I can rapidly build common UI patterns
- I want my **AI interactions to be visible to collaborators** so that everyone sees the same changes
- I want to **see my previous AI conversations** so that I can reference what I've created

### Key Features

#### 1. AI Chat Interface

**Must Have:**
- Floating chat button in bottom-right corner (24px spacing)
- Robot/AI icon with "Built with AI" tooltip on hover
- Expandable chat window (~400-450px wide, 25% viewport height)
- Chat header with close button (X)
- Scrollable message history
- Text input field with send button
- Only visible when authenticated on canvas page

**UI Specifications:**
- Chat button: Rounded circle with AI icon
- Chat window: 2-2.25x canvas controls width
- Messages: User (right, blue) / AI (left, gray)
- Timestamps for all messages
- Loading indicators during AI processing
- Error messages in red with retry option

**Success Criteria:**
- Chat button appears in correct position
- Chat window opens/closes smoothly
- Messages display with proper styling
- Interface is responsive and accessible

#### 2. Command Categories

**Must Support 8+ Distinct Command Types:**

**Creation Commands (3+ types):**
- Create by type/position: "Create a red circle at position 200, 300"
- Create with dimensions: "Make a 150x200 blue rectangle"
- Create text: "Add text that says 'Welcome' at position 100, 50"

**Manipulation Commands (4+ types):**
- Move shapes: "Move the blue rectangle to the center"
- Resize shapes: "Make the circle twice as big"
- Rotate shapes: "Rotate the selected text 45 degrees"
- Change color: "Change the rectangle to red"

**Layout Commands (3+ types):**
- Arrange shapes: "Arrange selected shapes in a horizontal row"
- Grid layout: "Create a 3x3 grid of squares"
- Even spacing: "Space these elements evenly"

**Complex Commands (2+ types):**
- Login form: "Create a login form with username, password fields and submit button"
- Navigation bar: "Build a navigation bar with Home, About, Services, Contact"
- Card layout: "Make a card layout with title, image placeholder, and description"

**Success Criteria:**
- All command types work reliably
- AI understands variations of commands
- Commands complete within 2 seconds (single-step)
- Complex commands show plan before execution

#### 3. AI Function Calling

**Must Have:**
- OpenAI GPT-4 integration with function calling
- 10 tool definitions for canvas operations:
  1. `createShape` - Create rectangle, circle, or text
  2. `moveShape` - Move by ID or selection
  3. `resizeShape` - Resize by factor or dimensions
  4. `rotateShape` - Rotate by degrees
  5. `changeShapeColor` - Update fill color
  6. `arrangeShapes` - Layout (horizontal, vertical, grid)
  7. `getCanvasState` - Return current shapes
  8. `getSelectedShapes` - Return selection
  9. `selectShapesByDescription` - Find shapes by description
  10. `createComplexLayout` - Multi-shape creation

**Function Execution:**
- Tools map to existing canvas context methods
- Results return to AI for response generation
- All operations sync via Firestore to all users
- Respect existing object locking mechanism

**Success Criteria:**
- All tools execute correctly
- Function results feed back to AI
- Operations sync to all connected users
- No conflicts with manual editing

#### 4. Shape Identification

**Must Support:**
- By color: "the blue rectangle"
- By size: "the largest circle"
- By type: "the text layer"
- By position: "the shape in the top-left"
- By selection: "the selected shape"

**Ambiguity Handling:**
- If multiple matches, ask user to select specific shape
- Provide options when clarification needed
- Default to selected shape when unclear

**Success Criteria:**
- Correctly identifies single matches
- Requests clarification for ambiguous queries
- Handles edge cases (no matches, multiple matches)

#### 5. Multi-Step Planning

**For Complex Commands:**
1. AI analyzes command and plans steps
2. Shows plan to user: "I'll create 3 text fields, 1 button, and arrange them vertically"
3. User confirms with "Proceed" button
4. AI executes steps sequentially
5. Shows progress: "Creating username field... Done"
6. Reports completion: "Login form created successfully"

**Success Criteria:**
- Plans are clear and accurate
- User can confirm or cancel
- Progress is visible during execution
- Final result matches plan

#### 6. Chat History Persistence

**Must Have:**
- Save messages to Firestore per user
- Collection: `/chatHistory/{userId}/messages`
- Load history on chat window open
- Auto-scroll to bottom on new messages
- "Clear History" option in chat menu

**Message Schema:**
```json
{
  "id": "msg_uuid",
  "userId": "user_id",
  "role": "user" | "assistant" | "system",
  "content": "message text",
  "timestamp": "ISO 8601",
  "functionCalls": []
}
```

**Success Criteria:**
- History persists across sessions
- Only user's own messages visible
- Messages load quickly on open
- Clear history works correctly

#### 7. Response Streaming

**Must Have:**
- Stream AI responses word-by-word
- Show typing indicator while streaming
- Cancel streaming on user request
- Handle stream errors gracefully

**Success Criteria:**
- Responses appear smoothly
- No lag or stuttering
- User can interrupt/cancel
- Errors don't break chat

#### 8. Rate Limiting

**Must Have:**
- Limit: 10 AI commands per minute per user
- Show remaining quota in UI
- Display countdown timer when limit hit
- Reset counter after 60 seconds

**Success Criteria:**
- Prevents abuse and excessive costs
- Clear feedback when limited
- Countdown accurate
- Doesn't affect normal usage

#### 9. Error Handling

**Must Handle:**
- API errors: "AI temporarily unavailable. Try again?"
- Invalid commands: "I don't understand. Try 'Create a red circle'"
- Ambiguous commands: "Which blue rectangle? There are 3."
- Network failures: Automatic retry with backoff
- Rate limits: Show quota and reset time

**Success Criteria:**
- All errors handled gracefully
- Helpful error messages
- Recovery options provided
- No crashes or broken states

### Technical Architecture

**Service Layer:**
- `aiService.js` - OpenAI API integration, streaming, function calling
- `aiTools.js` - Tool definitions and execution mapping
- `chatHistory.js` - Firestore persistence for messages
- `aiHelpers.js` - Shape matching, parsing utilities

**Component Layer:**
- `AIChatButton.jsx` - Floating button trigger
- `AIAssistant.jsx` - Main chat interface
- `ChatMessage.jsx` - Message display component

**Context Integration:**
- Extend `CanvasContext` to expose methods for AI tools
- Access shapes, selection, user info from context
- Use existing canvas operations (addShape, updateShape, etc.)

### Data Model

**Firestore Collection: `chatHistory`**

```
/chatHistory/{userId}/messages/{messageId}
{
  id: string,
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

### Environment Variables

```env
# OpenAI Configuration
VITE_OPENAI_API_KEY=sk-proj-...
VITE_OPENAI_MODEL=gpt-4-turbo-preview
```

### Performance Targets

- Single-step commands: <2 seconds response time
- Complex commands: <5 seconds with plan preview
- Streaming: No noticeable lag
- Real-time sync: All AI actions visible within 100ms
- Rate limit: 10 commands/minute

### Grading Rubric Alignment

**Target: 9-10 points (Excellent)**
- ✅ 10+ distinct command types
- ✅ All categories covered (creation, manipulation, layout, complex)
- ✅ Commands are diverse and meaningful
- ✅ Reliable execution
- ✅ Natural language understanding
- ✅ Multi-step complex operations
- ✅ Real-time collaboration support

### Testing Requirements

**Command Testing:**
- Test all 10+ command types individually
- Test command variations and phrasings
- Test with multiple shapes on canvas
- Test ambiguous queries and clarifications
- Test complex multi-step commands

**Integration Testing:**
- AI actions sync to all users in real-time
- AI respects object locking
- Chat history persists correctly
- Rate limiting works as expected
- Error handling covers all cases

**Performance Testing:**
- Response time <2 seconds for simple commands
- No memory leaks during extended chat
- Streaming works smoothly
- Canvas performance unaffected

### Success Metrics

**Functionality:**
- All 10+ command types work reliably
- 95%+ command success rate
- Ambiguous queries handled gracefully
- Complex commands execute correctly

**Performance:**
- <2s response time (simple commands)
- <5s response time (complex commands)
- Zero crashes or broken states
- 60 FPS maintained during AI operations

**User Experience:**
- Intuitive chat interface
- Clear feedback and progress indicators
- Helpful error messages
- Smooth animations and transitions

---

## Out of Scope for MVP

### Features NOT Included:

- Multiple shape types (circles, text, lines, polygons, etc.)
- Color customization for shapes
- Resize functionality
- Rotate functionality
- Multi-select
- Undo/redo
- Layer management
- Export functionality
- Shape styling (borders, shadows, gradients, etc.)
- Copy/paste
- Keyboard shortcuts beyond delete
- Mobile support
- Multiple projects or canvases
- Canvas dashboard or project list
- User profile management
- Canvas sharing/invite system

### Technical Items NOT Included:

- Operational transforms (OT) or CRDTs for conflict resolution
- Infinite canvas (using fixed 5000x5000px space)
- Canvas minimap
- Performance monitoring/analytics
- User permissions/roles
- Canvas history/versioning
- Optimistic updates (can add if time allows)
- Advanced locking mechanisms

---

## Known Limitations & Trade-offs

1. **Single Global Canvas**: All users share one global canvas (multi-project support in Phase 2)
2. **Basic Shapes**: Rectangles only (other shapes in future releases)
3. **Simple Locking**: First-come lock mechanism (not CRDT or OT)
4. **No Styling**: Fixed gray fill color for all rectangles
5. **No History**: No undo/redo or version control
6. **Desktop Only**: Not optimized for mobile/tablet
7. **Fixed Canvas Size**: 5000x5000px limit (not infinite canvas)
8. **No Permissions**: All users have equal edit access

---

## Success Metrics for MVP Checkpoint

1. **Two users can edit simultaneously** in different browsers
2. **Page refresh mid-edit** preserves all state
3. **Multiple shapes created rapidly** sync without visible lag
4. **Locking works correctly** - only one user can move an object at a time
5. **60 FPS maintained** during all interactions
6. **Deployed and accessible** via public URL

---

## MVP Testing Checklist

### Core Functionality:

- [ ] User can register with email/password
- [ ] User can sign in with Google
- [ ] User can log out and log back in
- [ ] Display name appears correctly for all users

### Canvas Operations:

- [ ] Can create rectangles on canvas
- [ ] Can select rectangles by clicking
- [ ] Can move rectangles by dragging
- [ ] Can delete rectangles with Delete/Backspace key
- [ ] Pan and zoom work smoothly
- [ ] Objects stay within canvas boundaries

### Real-Time Collaboration:

- [ ] Two users in different browsers can both create rectangles
- [ ] User A creates shape → User B sees it within 100ms
- [ ] User A moves shape → User B sees movement in real-time
- [ ] User A locks shape by dragging → User B cannot move it
- [ ] User A deletes shape → disappears for User B immediately
- [ ] Lock releases automatically after drag completes

### Multiplayer Features:

- [ ] Can see other user's cursor position
- [ ] Can see other user's name near their cursor
- [ ] Each user has a unique cursor color
- [ ] Cursor movements are smooth (no jitter)
- [ ] Join/leave presence updates immediately
- [ ] User list shows all currently connected users

### Persistence:

- [ ] Both users leave and return → all shapes persist
- [ ] Page refresh doesn't lose any data
- [ ] New user joining sees complete current state
- [ ] Deleted shapes don't reappear after refresh

### Performance:

- [ ] 60 FPS maintained with 100+ shapes on canvas
- [ ] No lag during rapid shape creation
- [ ] Cursor updates don't cause frame drops
- [ ] Pan/zoom remains smooth with many objects

---

## Risk Mitigation

**Biggest Risk:** Real-time sync breaking under load  
**Mitigation:** Test with multiple browsers early and often; use Firebase Realtime Database for high-frequency updates

**Second Risk:** Performance degradation with many objects  
**Mitigation:** Use canvas-based rendering (Konva), not DOM elements; limit to 500 shapes for MVP

**Third Risk:** Locking mechanism causing deadlocks  
**Mitigation:** Implement automatic lock timeout (3-5 seconds); clear visual feedback for lock state

**Fourth Risk:** Cursor updates causing performance issues  
**Mitigation:** Use Firebase Realtime Database (not Firestore) for cursor positions; throttle updates to 20-30 FPS
