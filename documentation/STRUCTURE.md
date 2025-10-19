# CollabCanvas - Project Structure

**Last Updated:** January 2025  
**Status:** Production Ready ✅

---

## Complete Folder Structure

```
CollabCanvas/
├── app/
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── AI/
│   │   │   │   ├── AIChatButton.jsx           ✅ AI chat trigger
│   │   │   │   ├── AIAssistant.jsx            ✅ Main chat interface
│   │   │   │   └── ChatMessage.jsx            ✅ Message display
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx                  ✅ Login form
│   │   │   │   └── Signup.jsx                 ✅ Registration form
│   │   │   ├── Canvas/
│   │   │   │   ├── AITaskDialog.jsx           ✅ AI task management
│   │   │   │   ├── AITaskPin.jsx              ✅ AI task markers
│   │   │   │   ├── Canvas.jsx                 ✅ Main canvas component
│   │   │   │   ├── ColorPicker.jsx            ✅ Color selection
│   │   │   │   ├── CommentPin.jsx             ✅ Comment markers
│   │   │   │   ├── CommentThread.jsx          ✅ Comment threads
│   │   │   │   ├── EditableShape.jsx          ✅ Shape editing wrapper
│   │   │   │   ├── EditableText.jsx           ✅ Text editing
│   │   │   │   ├── LayersPanel.jsx            ✅ Layer management
│   │   │   │   ├── LeftSidebar.jsx            ✅ Layers & export panel
│   │   │   │   ├── NewCommentDialog.jsx       ✅ Create comments
│   │   │   │   ├── OpacityBlendControls.jsx   ✅ Opacity & blend modes
│   │   │   │   ├── SelectionRectangle.jsx     ✅ Multi-selection
│   │   │   │   ├── Shape.jsx                  ✅ Shape rendering
│   │   │   │   ├── TextFormattingToolbar.jsx  ✅ Text formatting
│   │   │   │   └── TopToolbar.jsx             ✅ Main toolbar
│   │   │   ├── Collaboration/
│   │   │   │   ├── CursorMarker.jsx           ✅ User cursors
│   │   │   │   ├── PresenceList.jsx           ✅ Online users list
│   │   │   │   └── UserPresence.jsx           ✅ Presence management
│   │   │   ├── Dashboard/
│   │   │   │   ├── CanvasCard.jsx             ✅ Canvas preview cards
│   │   │   │   ├── CreateCanvasDialog.jsx     ✅ Create new canvas
│   │   │   │   ├── Dashboard.jsx              ✅ Canvas management
│   │   │   │   ├── JoinCanvasDialog.jsx       ✅ Join via share code
│   │   │   │   └── ShareCodeDialog.jsx        ✅ Share canvas
│   │   │   └── Layout/
│   │   │       ├── Navbar.jsx                 ✅ Navigation bar
│   │   │       └── Sidebar.jsx                ✅ Left sidebar
│   │   ├── services/
│   │   │   ├── aiHelpers.js                   ✅ AI utility functions
│   │   │   ├── aiService.js                   ✅ OpenAI integration
│   │   │   ├── aiTasks.js                     ✅ AI task persistence
│   │   │   ├── aiTools.js                     ✅ AI function tools
│   │   │   ├── auth.js                        ✅ Firebase authentication
│   │   │   ├── canvas.js                      ✅ Shape operations
│   │   │   ├── canvasManagement.js            ✅ Multi-canvas management
│   │   │   ├── chatHistory.js                 ✅ Chat persistence
│   │   │   ├── comments.js                    ✅ Comment system
│   │   │   ├── cursors.js                     ✅ Real-time cursors
│   │   │   ├── firebase.js                    ✅ Firebase initialization
│   │   │   └── presence.js                    ✅ User presence
│   │   ├── hooks/
│   │   │   ├── useAITasks.js                  ✅ AI task management
│   │   │   ├── useAuth.js                     ✅ Authentication state
│   │   │   ├── useCanvas.js                   ✅ Canvas operations
│   │   │   ├── useComments.js                 ✅ Comment system
│   │   │   ├── useCursors.js                  ✅ Cursor tracking
│   │   │   ├── usePresence.js                 ✅ Presence tracking
│   │   │   └── useRecentColors.js             ✅ Color history
│   │   ├── utils/
│   │   │   ├── aiConstants.js                 ✅ AI configuration
│   │   │   ├── canvasHelpers.js               ✅ Canvas utilities
│   │   │   ├── constants.js                   ✅ App constants
│   │   │   ├── dateFormatting.js              ✅ Date utilities
│   │   │   ├── editPermissions.js             ✅ Permission helpers
│   │   │   ├── helpers.js                     ✅ General utilities
│   │   │   ├── performanceMonitor.js          ✅ Performance tracking
│   │   │   └── shareCodeGenerator.js          ✅ Share code generation
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx                ✅ Auth state management
│   │   │   ├── CanvasContext.jsx              ✅ Canvas state management
│   │   │   └── CanvasManagementContext.jsx    ✅ Multi-canvas management
│   │   ├── App.jsx                            ✅ Main app component
│   │   ├── main.jsx                           ✅ Entry point
│   │   └── index.css                          ✅ Global styles
│   ├── tests/
│   │   ├── setup.js                           ✅ Test configuration
│   │   ├── unit/
│   │   │   ├── utils/
│   │   │   │   └── helpers.test.js            ✅ Utility tests
│   │   │   ├── services/
│   │   │   │   ├── auth.test.js               ✅ Auth tests
│   │   │   │   ├── canvas.test.js             ✅ Canvas tests
│   │   │   │   ├── cursors.test.js            ✅ Cursor tests
│   │   │   │   └── presence.test.js           ✅ Presence tests
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.test.jsx           ✅ Hook tests
│   │   │   └── contexts/
│   │   │       ├── AuthContext.test.jsx       ✅ Context tests
│   │   │       └── CanvasContext.test.jsx     ✅ Context tests
│   │   └── integration/
│   │       ├── auth-flow.test.js              ✅ Auth flow tests
│   │       ├── canvas-sync.test.js            ✅ Sync tests
│   │       └── multiplayer.test.js            ✅ Multiplayer tests
│   ├── .env                                    ✅ Environment config
│   ├── .gitignore                              ✅ Git ignore rules
│   ├── package.json                            ✅ Dependencies
│   ├── vite.config.js                          ✅ Vite configuration
│   ├── tailwind.config.js                      ✅ Tailwind config
│   ├── postcss.config.js                       ✅ PostCSS config
│   ├── eslint.config.js                        ✅ ESLint config
│   └── README.md                               ✅ App documentation
├── documentation/
│   ├── AI-IMPLEMENTATION-SUMMARY.md            ✅ AI features guide
│   ├── architecture.md                         ✅ System architecture
│   ├── DEPLOYMENT-GUIDE.md                     ✅ Deployment steps
│   ├── PRD.md                                  ✅ Product requirements
│   ├── STRUCTURE.md                            ✅ This file
│   ├── tasks-ai-agent.md                       ✅ AI implementation tasks
│   ├── tasks.md                                ✅ MVP tasks
│   └── TESTING-SUMMARY.md                      ✅ Test documentation
├── database.rules.json                         ✅ RTDB security rules
├── firebase.json                               ✅ Firebase hosting config
├── firestore.indexes.json                      ✅ Firestore indexes
├── firestore.rules                             ✅ Firestore security rules
└── README.md                                   ✅ Project documentation
```

---

## Feature Implementation Status

### ✅ Core Features (100% Complete)

**Authentication System:**
- Email/password registration and login
- Google OAuth sign-in
- Display name management
- Persistent sessions
- User profile management

**Multi-Canvas Dashboard:**
- Create multiple canvases
- Canvas management (view all owned and shared canvases)
- Share canvases via unique share codes
- Join canvases using share codes
- Delete owned canvases
- Remove collaborators

**Canvas Workspace:**
- 40000x20000px large canvas area
- Smooth pan functionality (click-and-drag)
- Zoom functionality (ctrl+mousewheel)
- Visual grid reference
- Hard boundary constraints
- 60 FPS performance maintained

**Shape Creation & Manipulation:**
- Rectangles, circles, and text shapes
- Click-and-drag to create shapes
- Select and move shapes
- Resize shapes with handles
- Rotate shapes
- Color customization with color picker
- Recent colors memory (last 10 colors)
- Opacity control (0-100%)
- Blend mode support (12 modes: normal, multiply, screen, overlay, etc.)
- Text formatting toolbar (bold, italic, underline, font family, font size, alignment)
- Double-click to edit text
- Multi-selection with drag-select rectangle
- Bulk operations on selected shapes

**Layer Management:**
- Visual layers panel with shape preview
- Drag-and-drop layer reordering
- Layer locking (lock entire layer from editing)
- Individual shape visibility toggle
- Selected shapes highlighted in layers panel
- Layer count and organization

**Real-Time Collaboration:**
- Real-time shape synchronization (<100ms)
- Automatic conflict resolution
- Object locking (first user to edit gets lock)
- Lock auto-release on edit complete
- Visual lock indicators
- Optimistic UI updates

**Multiplayer Features:**
- Real-time cursor positions for all users
- User names displayed near cursors
- Unique color per user
- Smooth cursor movement (<50ms updates)
- Online/offline status tracking
- User presence list

**Advanced Canvas Operations:**
- Undo/redo system (action history)
- Copy/paste shapes (single and multi-selection)
- Duplicate shapes (Ctrl+D)
- Delete shapes (Delete/Backspace)
- Select all (Ctrl+A)
- Deselect all (Escape)
- Full canvas export to PNG (25% quality, named by canvas title)
- Selected shapes export to PNG (50% quality)
- Export with transparent background

**Comments System:**
- Add comments to any location on canvas
- Comment threads with replies
- Resolve/unresolve comments
- Edit and delete comments
- Comment markers on canvas
- Real-time comment synchronization
- Relative timestamps
- Comment author tracking

**AI Canvas Agent (Phase 2):**
- Natural language canvas manipulation
- OpenAI GPT-4 integration with function calling
- Floating AI chat button
- Persistent chat history per user
- 15+ distinct command types:
  - Shape creation (rectangles, circles, text)
  - Shape manipulation (move, resize, rotate, recolor)
  - Layout operations (arrange, grid, align)
  - Complex layouts (forms, navigation bars, cards)
  - Batch operations (create multiple shapes)
- AI task persistence (pending, in-progress, completed, failed)
- Visual AI task markers on canvas
- Task execution tracking
- Error handling and retry logic
- Rate limiting (10 commands/minute)
- Streaming responses

**State Persistence:**
- All canvas data saved to Firestore
- Automatic save on every change
- Load complete state on join
- Multi-user state synchronization
- Offline persistence with IndexedDB
- Connection state monitoring

---

## Component Architecture

### **Services Layer (Business Logic)**

**Authentication (`services/auth.js`)**
- `signUp(email, password, displayName)` - User registration
- `signIn(email, password)` - Email/password login
- `signInWithGoogle()` - Google OAuth
- `signOut()` - User logout
- `updateUserProfile(displayName)` - Profile updates

**Canvas Management (`services/canvasManagement.js`)**
- `createCanvas(canvasData, userId)` - Create new canvas
- `getCanvasList(userId)` - Get all user canvases
- `deleteCanvas(canvasId, userId)` - Delete canvas
- `joinCanvasByShareCode(shareCode, userId)` - Join via share code
- `regenerateShareCode(canvasId)` - Generate new share code
- `removeCollaborator(canvasId, collaboratorId)` - Remove user

**Shape Operations (`services/canvas.js`)**
- `subscribeToShapes(canvasId, callback)` - Real-time listener
- `createShape(canvasId, shapeData, userId)` - Add shape
- `updateShape(canvasId, shapeId, updates)` - Modify shape
- `deleteShape(canvasId, shapeId)` - Remove shape
- `deleteShapesBatch(canvasId, shapeIds)` - Bulk delete
- `reorderShapes(canvasId, shapesArray)` - Layer reordering
- `lockShape(canvasId, shapeId, userId)` - Acquire edit lock
- `unlockShape(canvasId, shapeId)` - Release lock
- `releaseStaleLocks(canvasId)` - Auto-cleanup
- `toggleShapeVisibility(canvasId, shapeId)` - Show/hide
- `toggleLayerLock(canvasId, shapeId)` - Lock layer

**Cursor & Presence (`services/cursors.js`, `services/presence.js`)**
- `initializeUserSession(canvasId, userId, displayName, color)` - Setup
- `updateCursorPosition(canvasId, userId, x, y)` - Update cursor
- `removeUserSession(canvasId, userId)` - Cleanup
- `subscribeToCursors(canvasId, callback)` - Real-time listener
- `cleanupStaleSessions(canvasId)` - Auto-cleanup

**Comments (`services/comments.js`)**
- `createComment(canvasId, commentData)` - Add comment
- `updateComment(canvasId, commentId, content)` - Edit comment
- `deleteComment(canvasId, commentId)` - Remove comment
- `toggleResolveComment(canvasId, commentId, resolved)` - Resolve
- `subscribeToComments(canvasId, callback)` - Real-time listener
- `deleteCommentsByShapeId(canvasId, shapeId)` - Cascade delete

**AI System (`services/aiService.js`, `services/aiTools.js`)**
- `sendMessage(message, canvasState, userId)` - Send to AI
- `streamChatCompletion(messages, tools)` - Stream responses
- `executeToolCall(toolName, args, context)` - Execute AI tools
- 15 AI tools for canvas manipulation
- Shape identification by description
- Layout generation
- Batch operations

**AI Task Management (`services/aiTasks.js`)**
- `createAITask(canvasId, taskData)` - Create task
- `updateAITaskStatus(taskId, status, result)` - Update task
- `deleteAITask(taskId)` - Remove task
- `subscribeToAITasks(canvasId, userId, callback)` - Real-time listener
- `deleteAITasksByStatus(canvasId, status)` - Bulk delete

**Chat History (`services/chatHistory.js`)**
- `saveMessage(userId, message)` - Persist message
- `loadMessages(userId)` - Load history
- `clearHistory(userId)` - Clear all messages
- `deleteMessage(userId, messageId)` - Remove message

---

### **Hooks (React State Management)**

**`hooks/useAuth.js`**
- Returns: `currentUser`, `loading`
- Provides access to authentication state

**`hooks/useCanvas.js`**
- Returns: `shapes`, `loading`, `error`, `isOnline`
- Subscribes to real-time shape updates
- Monitors online/offline status
- Auto-releases stale locks

**`hooks/useCursors.js`**
- Returns: `cursors`, `currentUserId`
- Tracks all user cursor positions
- Throttles cursor updates to 20-30 FPS

**`hooks/usePresence.js`**
- Returns: `onlineUsers`
- Tracks online user status
- Shows who's currently active

**`hooks/useComments.js`**
- Returns: `comments`, `loading`, `error`
- Subscribes to real-time comment updates
- Manages comment state

**`hooks/useAITasks.js`**
- Returns: `tasks`, `loading`
- Subscribes to AI task updates
- Tracks task execution status

**`hooks/useRecentColors.js`**
- Returns: `recentColors`, `addRecentColor`
- Manages color history (last 10 colors)
- Persists to localStorage

---

### **Contexts (Global State)**

**`contexts/AuthContext.jsx`**
- Manages: `currentUser`, `loading`
- Listens to Firebase auth state changes
- Provides auth state globally

**`contexts/CanvasContext.jsx`**
- Manages: `shapes`, `selectedId`, `selectedIds`, `history`, `clipboard`
- Provides: All canvas operations (add, update, delete, undo, redo, copy, paste)
- Integrates with AI tools
- Manages selection state
- Handles multi-selection operations

**`contexts/CanvasManagementContext.jsx`**
- Manages: `canvasList`, `currentCanvasId`
- Provides: Canvas CRUD operations
- Handles canvas navigation
- Manages share codes

---

### **Utilities**

**`utils/constants.js`**
- Canvas dimensions: 40000x20000px
- Zoom limits: 0.1x to 3x
- Lock timeout: 5000ms
- Default shape properties
- Performance targets
- Cursor color palette
- Firebase collection names

**`utils/helpers.js`**
- `generateUserColor(userId)` - Consistent user colors
- `getTruncatedName(name, maxLength)` - Name truncation
- `getDisplayNameFromEmail(email)` - Extract display name
- `generateShapeId()` - Unique identifiers
- `throttle(func, limit)` - Rate limiting
- `debounce(func, wait)` - Delay execution
- `clamp(value, min, max)` - Value clamping

**`utils/canvasHelpers.js`**
- `generateGridLines(width, height)` - Grid generation
- `calculateConstrainedPosition(x, y, w, h)` - Boundary checks
- `exportStageToPNG(stage, quality, fileName)` - PNG export
- `getAIErrorMessage(error)` - User-friendly error messages
- `normalizeSelectionBox(start, end)` - Selection box calculation

**`utils/aiConstants.js`**
- OpenAI model configuration
- System prompts for AI agent
- Command examples
- Layout templates
- Color name mappings
- UI configuration

**`utils/editPermissions.js`**
- `checkEditPermissions(isLayerLocked, isLocked)` - Permission checking
- `checkLockAcquisition(lockAcquired, itemType)` - Lock validation
- Centralized permission logic

**`utils/dateFormatting.js`**
- `formatRelativeTime(timestamp)` - "2m ago", "3h ago"
- `formatDate(timestamp, locale)` - Localized dates
- `formatDateTime(timestamp, locale)` - Full date/time

**`utils/performanceMonitor.js`**
- `trackRender(componentName)` - Render tracking
- `logShapeStats(shapes)` - Canvas statistics
- `measureTime(label, fn)` - Performance measurement

**`utils/shareCodeGenerator.js`**
- `generateShareCode(canvasId)` - 6-character codes
- `isValidShareCode(code)` - Validation
- Collision-resistant generation

---

## Key Features Implemented

### Recent Code Quality Improvements (January 2025)

**Refactoring:**
- Removed 70+ debugging console.log statements
- Extracted `canvasHelpers.js` for canvas-specific utilities
- Created `editPermissions.js` for centralized permission checking
- Created `dateFormatting.js` for consistent date formatting
- Eliminated duplicate code across components
- Improved code maintainability and readability

**Performance:**
- All console.error statements preserved for production monitoring
- Optimized render performance
- Reduced code duplication
- Better separation of concerns

---

## Technology Stack

**Frontend:**
- React 18 with Hooks
- Vite (build tool)
- Konva.js (canvas rendering)
- Tailwind CSS (styling)

**Backend:**
- Firebase Authentication
- Cloud Firestore (persistent data)
- Firebase Realtime Database (high-frequency updates)
- Firebase Hosting (deployment)

**AI Integration:**
- OpenAI GPT-4 Turbo
- Function calling API
- Streaming completions

**Testing:**
- Vitest (unit tests)
- React Testing Library (component tests)
- Firebase Emulators (integration tests)

---

## Performance Metrics

**Achieved Targets:**
- ✅ 60 FPS maintained during all interactions
- ✅ Shape sync: <100ms
- ✅ Cursor updates: <50ms at 20-30 FPS
- ✅ AI commands: <2s (simple), <5s (complex)
- ✅ Handles 500+ shapes without degradation
- ✅ Smooth pan/zoom with many objects
- ✅ Offline persistence enabled

---

## Next Steps / Future Enhancements

### Potential Improvements:
1. **Mobile Support** - Responsive design for tablets and phones
2. **Advanced Shapes** - Polygons, lines, arrows, custom paths
3. **Image Upload** - Support for image shapes
4. **Templates** - Pre-built canvas templates
5. **Version History** - Canvas snapshots and rollback
6. **Advanced Permissions** - View-only, edit-only roles
7. **Canvas Minimap** - Overview navigation
8. **Keyboard Shortcuts Panel** - In-app shortcut reference
9. **Shape Groups** - Group and ungroup shapes
10. **Advanced Export** - SVG, PDF export options

---

## Development Status

**Current Phase:** Production Ready ✅

**Completed:**
- ✅ MVP (All core features)
- ✅ Phase 2 (AI Canvas Agent)
- ✅ Multi-canvas management
- ✅ Advanced canvas features
- ✅ Testing infrastructure
- ✅ Code quality improvements

**In Progress:**
- 📝 Documentation updates
- 📝 Performance optimization

**Ready for:**
- 🚀 Production deployment
- 👥 User testing
- 📊 Usage analytics

---

## Getting Started

### Installation
```bash
cd app
npm install
```

### Environment Setup
Create `app/.env` with Firebase and OpenAI credentials:
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=your_rtdb_url
VITE_OPENAI_API_KEY=your_openai_key
```

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Testing
```bash
npm test                # Run all tests
npm run test:ui         # Visual test runner
npm run test:coverage   # Coverage report
```

---

## Project Complete! 🎉

All planned features have been successfully implemented and tested. The application is production-ready with comprehensive documentation, testing, and code quality improvements.
