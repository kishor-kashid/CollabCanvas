# CollabCanvas - System Architecture

**Last Updated:** January 2025  
**Status:** Production Ready ✅

---

## System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Browser"
        subgraph "React Application"
            UI[UI Components]
            
            subgraph "Component Layer"
                Auth[Auth Components<br/>Login/Signup]
                Dashboard[Dashboard Components<br/>Canvas Management/Share Codes]
                Canvas[Canvas Components<br/>Canvas/Shapes/Text<br/>40000x20000px bounded]
                Collab[Collaboration Components<br/>Cursor/Presence/Comments]
                AI[AI Components<br/>Chat Button/Assistant/Messages]
                Layout[Layout Components<br/>Navbar/Sidebars]
            end
            
            subgraph "State Management"
                AuthCtx[Auth Context<br/>User State]
                CanvasCtx[Canvas Context<br/>Shapes State<br/>Undo/Redo/Selection]
                CanvasM

anagementCtx[Canvas Management Context<br/>Multi-Canvas State]
            end
            
            subgraph "Custom Hooks"
                useAuth[useAuth<br/>Auth Operations]
                useCanvas[useCanvas<br/>Canvas Operations]
                useCursors[useCursors<br/>Cursor Tracking]
                usePresence[usePresence<br/>Presence Management]
                useComments[useComments<br/>Comment System]
                useAITasks[useAITasks<br/>AI Task Tracking]
                useRecentColors[useRecentColors<br/>Color History]
            end
            
            subgraph "Services Layer"
                AuthSvc[Auth Service<br/>signup/login/Google/logout]
                CanvasMgmtSvc[Canvas Management Service<br/>CRUD/Share Codes]
                CanvasSvc[Canvas Service<br/>CRUD + Locking operations]
                CursorSvc[Cursor Service<br/>Position updates]
                PresenceSvc[Presence Service<br/>Online status]
                CommentsSvc[Comments Service<br/>Comment threads/replies]
                AISvc[AI Service<br/>OpenAI integration/streaming]
                AIToolsSvc[AI Tools Service<br/>15+ canvas manipulation tools]
                AITasksSvc[AI Tasks Service<br/>Task persistence]
                ChatHistorySvc[Chat History Service<br/>Message persistence]
                FirebaseInit[Firebase Initialization<br/>Config & Init]
            end
            
            subgraph "Rendering Engine"
                Konva[Konva.js<br/>Canvas Rendering<br/>Shapes/Text/Transformers<br/>60 FPS]
            end
            
            subgraph "Utilities"
                Helpers[Helper Functions<br/>generateUserColor<br/>throttle/debounce]
                Constants[Constants<br/>Canvas dimensions<br/>Colors/Limits]
                CanvasHelpers[Canvas Helpers<br/>Grid/Export/Positioning]
                AIConstants[AI Constants<br/>OpenAI config<br/>System prompts]
                EditPermissions[Edit Permissions<br/>Lock checking]
                DateFormatting[Date Formatting<br/>Relative times]
                PerformanceMonitor[Performance Monitor<br/>FPS tracking]
                ShareCodeGen[Share Code Generator<br/>6-char codes]
            end
        end
    end
    
    subgraph "Firebase Backend"
        subgraph "Firebase Authentication"
            FBAuth[Firebase Auth<br/>User Management<br/>Email/Password + Google]
        end
        
        subgraph "Cloud Firestore"
            FSCanvases[(Canvases Collection<br/>canvases/{canvasId}<br/>Canvas metadata + Share codes)]
            FSShapes[(Shapes Collection<br/>canvases/{canvasId}/shapes/{shapeId}<br/>Shapes data + Locking<br/>Persistent Storage)]
            FSComments[(Comments Collection<br/>canvases/{canvasId}/comments/{commentId}<br/>Comment threads + replies)]
            FSUserCanvases[(User Canvases Collection<br/>userCanvases/{userId}<br/>Owned and shared canvases)]
            FSAITasks[(AI Tasks Collection<br/>canvases/{canvasId}/aiTasks/{taskId}<br/>AI task tracking)]
            FSChatHistory[(Chat History Collection<br/>chatHistory/{userId}/messages/{messageId}<br/>User AI conversations)]
            FSShareCodes[(Share Codes Collection<br/>shareCodes/{code}<br/>Canvas access codes)]
        end
        
        subgraph "Realtime Database"
            RTDBSession[(Session Path<br/>/sessions/{canvasId}/{userId}<br/>Cursor + Presence combined<br/>High-frequency updates)]
        end
        
        subgraph "Firebase Hosting"
            Hosting[Static File Hosting<br/>Deployed React App]
        end
    end
    
    subgraph "External Services"
        subgraph "OpenAI API"
            GPT4[GPT-4 Turbo<br/>Function Calling<br/>Streaming Completions]
        end
    end
    
    subgraph "Testing Infrastructure"
        subgraph "Test Suite"
            UnitTests[Unit Tests<br/>Vitest + Testing Library<br/>Services/Utils/Hooks]
            IntegrationTests[Integration Tests<br/>Multi-user scenarios<br/>Real-time sync]
        end
        
        subgraph "Firebase Emulators"
            AuthEmu[Auth Emulator]
            FirestoreEmu[Firestore Emulator]
            RTDBEmu[RTDB Emulator]
        end
    end
    
    %% Component to Context connections
    Auth --> AuthCtx
    Dashboard --> CanvasManagementCtx
    Canvas --> CanvasCtx
    Collab --> CanvasCtx
    AI --> CanvasCtx
    Layout --> AuthCtx
    
    %% Context to Hooks connections
    AuthCtx --> useAuth
    CanvasManagementCtx --> useAuth
    CanvasCtx --> useCanvas
    CanvasCtx --> useCursors
    CanvasCtx --> usePresence
    CanvasCtx --> useComments
    CanvasCtx --> useAITasks
    CanvasCtx --> useRecentColors
    
    %% Hooks to Services connections
    useAuth --> AuthSvc
    useCanvas --> CanvasSvc
    useCanvas --> CanvasMgmtSvc
    useCursors --> CursorSvc
    usePresence --> PresenceSvc
    useComments --> CommentsSvc
    useAITasks --> AITasksSvc
    
    %% AI Component connections
    AI --> AISvc
    AISvc --> AIToolsSvc
    AISvc --> ChatHistorySvc
    AIToolsSvc --> CanvasCtx
    
    %% Services to Firebase Init
    AuthSvc --> FirebaseInit
    CanvasMgmtSvc --> FirebaseInit
    CanvasSvc --> FirebaseInit
    CursorSvc --> FirebaseInit
    PresenceSvc --> FirebaseInit
    CommentsSvc --> FirebaseInit
    AITasksSvc --> FirebaseInit
    ChatHistorySvc --> FirebaseInit
    
    %% Firebase connections
    FirebaseInit --> FBAuth
    FirebaseInit --> FSCanvases
    FirebaseInit --> FSShapes
    FirebaseInit --> FSComments
    FirebaseInit --> FSUserCanvases
    FirebaseInit --> FSAITasks
    FirebaseInit --> FSChatHistory
    FirebaseInit --> FSShareCodes
    FirebaseInit --> RTDBSession
    
    %% OpenAI connections
    AISvc -->|API calls<br/>Function calling| GPT4
    GPT4 -->|Streaming responses<br/>Tool calls| AISvc
    
    %% Rendering
    Canvas --> Konva
    
    %% Utilities
    Helpers -.-> Collab
    Helpers -.-> Canvas
    Constants -.-> Canvas
    CanvasHelpers -.-> Canvas
    AIConstants -.-> AI
    EditPermissions -.-> Canvas
    DateFormatting -.-> Collab
    DateFormatting -.-> AI
    PerformanceMonitor -.-> Canvas
    ShareCodeGen -.-> Dashboard
    
    %% Real-time sync paths
    CanvasSvc -->|Create/Update/Delete<br/>Lock/Unlock<br/>under 100ms| FSShapes
    FSShapes -->|Real-time listener<br/>onSnapshot| CanvasSvc
    
    CanvasMgmtSvc -->|Canvas CRUD<br/>Share codes| FSCanvases
    CanvasMgmtSvc -->|User canvas list| FSUserCanvases
    CanvasMgmtSvc -->|Share code lookup| FSShareCodes
    
    CommentsSvc -->|Create/Update/Delete<br/>Resolve/Unresolve| FSComments
    FSComments -->|Real-time listener<br/>onSnapshot| CommentsSvc
    
    AITasksSvc -->|Task CRUD<br/>Status updates| FSAITasks
    FSAITasks -->|Real-time listener<br/>onSnapshot| AITasksSvc
    
    ChatHistorySvc -->|Save/Load/Delete<br/>Messages| FSChatHistory
    
    CursorSvc -->|Position updates<br/>under 50ms at 20-30 FPS| RTDBSession
    RTDBSession -->|Real-time listener<br/>on value change| CursorSvc
    
    PresenceSvc -->|Online status<br/>onDisconnect| RTDBSession
    RTDBSession -->|Real-time listener<br/>on value change| PresenceSvc
    
    %% Auth flow
    AuthSvc -->|signup/login| FBAuth
    FBAuth -->|User token<br/>Session state| AuthSvc
    
    %% Deployment
    UI -.->|Build & Deploy<br/>npm run build| Hosting
    
    %% Testing connections
    UnitTests -.->|Test| AuthSvc
    UnitTests -.->|Test| CanvasSvc
    UnitTests -.->|Test| Helpers
    UnitTests -.->|Test| AIToolsSvc
    
    IntegrationTests -.->|Test via| AuthEmu
    IntegrationTests -.->|Test via| FirestoreEmu
    IntegrationTests -.->|Test via| RTDBEmu
    
    %% User interactions
    User([Users<br/>Multiple Browsers]) -->|Interact| UI
    User -->|Access deployed app| Hosting
    
    %% Styling
    classDef client fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef firebase fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef ai fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef testing fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef rendering fill:#fff9c4,stroke:#f9a825,stroke-width:2px
    classDef user fill:#fce4ec,stroke:#c2185b,stroke-width:3px
    
    class Auth,Dashboard,Canvas,Collab,AI,Layout,AuthCtx,CanvasCtx,CanvasManagementCtx,useAuth,useCanvas,useCursors,usePresence,useComments,useAITasks,useRecentColors,AuthSvc,CanvasMgmtSvc,CanvasSvc,CursorSvc,PresenceSvc,CommentsSvc,AITasksSvc,ChatHistorySvc,FirebaseInit,Helpers,Constants,CanvasHelpers,ShareCodeGen client
    class FBAuth,FSCanvases,FSShapes,FSComments,FSUserCanvases,FSShareCodes,RTDBSession,Hosting firebase
    class AISvc,AIToolsSvc,AIConstants,GPT4,FSAITasks,FSChatHistory ai
    class UnitTests,IntegrationTests,AuthEmu,FirestoreEmu,RTDBEmu testing
    class Konva,PerformanceMonitor rendering
    class User user
```

---

## Architecture Overview

CollabCanvas is a full-stack real-time collaborative design application built with React and Firebase, enhanced with AI-powered canvas manipulation via OpenAI GPT-4.

### Core Architecture Principles

1. **Real-time First**: All collaborative features use real-time synchronization
2. **Separation of Concerns**: Clean separation between UI, business logic, and data
3. **Optimistic Updates**: UI updates immediately, syncs in background
4. **State Management**: Context API for global state, hooks for local state
5. **Service Layer**: All Firebase and OpenAI interactions abstracted into services
6. **Performance**: 60 FPS maintained through Konva.js canvas rendering

---

## Data Flow

### Shape Creation Flow
```
User Action (Canvas.jsx)
  ↓
CanvasContext.addShape()
  ↓
services/canvas.js → createShape()
  ↓
Firestore Write (canvases/{canvasId}/shapes/{shapeId})
  ↓
Firestore onSnapshot Listener
  ↓
useCanvas Hook Updates
  ↓
CanvasContext State Updates
  ↓
All Connected Clients Re-render
```

### AI Command Flow
```
User Message (AIAssistant.jsx)
  ↓
services/aiService.js → sendMessage()
  ↓
OpenAI GPT-4 API (Function Calling)
  ↓
AI Returns Tool Calls
  ↓
services/aiTools.js → executeToolCall()
  ↓
CanvasContext Methods (addShape, updateShape, etc.)
  ↓
Firestore Write
  ↓
Real-time Sync to All Users
```

### Cursor Movement Flow
```
Mouse Move (Canvas.jsx)
  ↓
Throttle (20-30 FPS)
  ↓
useCursors.updatePosition()
  ↓
services/cursors.js → updateCursorPosition()
  ↓
Realtime Database Write (/sessions/{canvasId}/{userId})
  ↓
Realtime Database onValue Listener
  ↓
useCursors Hook Updates
  ↓
CursorMarker Components Re-render
```

---

## Database Schema

### Firestore Collections

**canvases/{canvasId}**
```json
{
  "id": "canvas_uuid",
  "title": "My Canvas",
  "ownerId": "user_id",
  "shareCode": "ABC123",
  "createdAt": 1704067200000,
  "updatedAt": 1704153600000,
  "collaborators": ["user_id_1", "user_id_2"]
}
```

**canvases/{canvasId}/shapes/{shapeId}**
```json
{
  "id": "shape_uuid",
  "type": "rectangle" | "circle" | "text",
  "x": 100,
  "y": 200,
  "width": 150,
  "height": 100,
  "rotation": 0,
  "fill": "#cccccc",
  "opacity": 1,
  "blendMode": "normal",
  "text": "Hello World",
  "fontSize": 16,
  "fontFamily": "Arial",
  "fontStyle": "normal",
  "textDecoration": "",
  "align": "left",
  "visible": true,
  "isLocked": false,
  "lockedBy": null,
  "lockTimestamp": null,
  "layerLocked": false,
  "createdBy": "user_id",
  "createdAt": 1704067200000,
  "lastModifiedBy": "user_id",
  "lastModifiedAt": 1704153600000,
  "zIndex": 0
}
```

**canvases/{canvasId}/comments/{commentId}**
```json
{
  "id": "comment_uuid",
  "canvasId": "canvas_uuid",
  "authorId": "user_id",
  "authorName": "John Doe",
  "content": "Great design!",
  "x": 500,
  "y": 300,
  "resolved": false,
  "replies": [],
  "createdAt": 1704067200000,
  "updatedAt": 1704153600000
}
```

**canvases/{canvasId}/aiTasks/{taskId}**
```json
{
  "id": "task_uuid",
  "canvasId": "canvas_uuid",
  "userId": "user_id",
  "command": "Create 3 blue rectangles",
  "status": "pending" | "in-progress" | "completed" | "failed",
  "result": null,
  "createdAt": 1704067200000,
  "executedAt": null,
  "priority": 0
}
```

**userCanvases/{userId}**
```json
{
  "userId": "user_id",
  "ownedCanvases": [
    {
      "canvasId": "canvas_uuid_1",
      "title": "Project A",
      "createdAt": 1704067200000
    }
  ],
  "sharedCanvases": [
    {
      "canvasId": "canvas_uuid_2",
      "title": "Shared Project",
      "sharedAt": 1704067200000
    }
  ]
}
```

**shareCodes/{code}**
```json
{
  "code": "ABC123",
  "canvasId": "canvas_uuid",
  "createdAt": 1704067200000,
  "usageCount": 5
}
```

**chatHistory/{userId}/messages/{messageId}**
```json
{
  "id": "message_uuid",
  "userId": "user_id",
  "role": "user" | "assistant" | "system",
  "content": "Create a blue rectangle",
  "timestamp": 1704067200000,
  "functionCalls": [
    {
      "name": "createShape",
      "arguments": {...},
      "result": "Shape created successfully"
    }
  ],
  "isError": false
}
```

### Realtime Database Structure

**sessions/{canvasId}/{userId}**
```json
{
  "displayName": "John Doe",
  "cursorColor": "#FF5733",
  "cursorX": 450,
  "cursorY": 300,
  "lastSeen": 1704067200000
}
```

---

## Security Rules

### Firestore Rules
- Users can only read/write their own user canvas lists
- Users can read/write canvases they own or are collaborators on
- Share codes are readable by authenticated users
- Comments tied to canvas permissions
- AI tasks tied to canvas permissions
- Chat history is user-private

### Realtime Database Rules
- Users can write their own session data
- Users can read all sessions for a canvas they have access to
- Auto-cleanup via onDisconnect handlers

---

## Performance Optimizations

### Frontend
- **Canvas Rendering**: Konva.js for hardware-accelerated rendering
- **Throttling**: Cursor updates throttled to 20-30 FPS
- **Debouncing**: Search and input fields debounced
- **Lazy Loading**: Components loaded on demand
- **Memoization**: Expensive calculations cached
- **Virtual Scrolling**: For large lists (layers panel)
- **Offline Persistence**: IndexedDB for offline support

### Backend
- **Firestore Indexing**: Compound indexes for queries
- **RTDB for High-Frequency**: Cursors use Realtime Database
- **Batch Operations**: Bulk deletes use batched writes
- **Auto-Cleanup**: Stale locks and sessions cleaned automatically

### AI Integration
- **Streaming**: Responses streamed word-by-word
- **Rate Limiting**: 10 commands/minute per user
- **Caching**: Recent colors and command history cached locally
- **Async Execution**: Tool calls don't block UI

---

## Scalability Considerations

### Current Limits
- Canvas size: 40000x20000px
- Shapes per canvas: Tested up to 500+
- Concurrent users per canvas: Tested up to 10
- AI commands: 10 per minute per user
- Recent colors: Last 10 colors stored

### Scaling Strategy
- **Horizontal Scaling**: Firebase auto-scales
- **CDN**: Static assets served from Firebase Hosting CDN
- **Caching**: Client-side caching for frequently accessed data
- **Lazy Loading**: Load shapes on viewport demand (future)
- **Pagination**: Large shape lists paginated (future)

---

## Error Handling

### Frontend
- Try-catch blocks around all async operations
- User-friendly error messages
- Toast notifications for errors
- Fallback UI for broken states
- Console.error preserved for production monitoring

### Backend
- Firebase error codes mapped to user messages
- Retry logic for transient failures
- Graceful degradation when services unavailable

### AI Integration
- OpenAI API errors caught and displayed
- Retry mechanism with exponential backoff
- Fallback to non-AI features if API down

---

## Deployment Architecture

```
GitHub Repository
  ↓
Build Process (npm run build)
  ↓
Firebase Hosting CDN
  ↓
Global Edge Locations
  ↓
Users Worldwide
```

### CI/CD Pipeline
1. Code pushed to repository
2. Vite builds optimized production bundle
3. Firebase CLI deploys to hosting
4. Security rules deployed
5. Indexes deployed
6. App live at custom domain

---

## Technology Decisions

### Why React?
- Component-based architecture
- Large ecosystem
- Excellent performance with hooks
- Strong community support

### Why Firebase?
- Real-time capabilities out of the box
- Authentication handled
- Auto-scaling
- Generous free tier
- Simple deployment

### Why Konva.js?
- Canvas-based rendering (60 FPS)
- Built for React (react-konva)
- Handles complex shapes efficiently
- Transform controls built-in

### Why OpenAI GPT-4?
- Function calling API perfect for tool execution
- Natural language understanding
- Streaming for responsive UX
- Reliable and well-documented

### Why Tailwind CSS?
- Utility-first approach
- Rapid prototyping
- Consistent design system
- Small bundle size with purging

---

## Future Architecture Enhancements

### Considered for Future
1. **WebSocket for Cursors**: Even lower latency than RTDB
2. **WebRTC for Large Files**: P2P image sharing
3. **Service Workers**: Advanced offline support
4. **GraphQL Layer**: More flexible data fetching
5. **Microservices**: Separate AI service if scaling needed
6. **CDN for Media**: Cloudflare R2 or S3 for images
7. **Real-time Analytics**: Usage tracking and insights
8. **A/B Testing Framework**: Feature testing

---

## Architecture Complete! ✅

This architecture has proven to:
- ✅ Support 10+ concurrent users seamlessly
- ✅ Maintain 60 FPS with 500+ shapes
- ✅ Sync changes in <100ms
- ✅ Handle AI commands reliably
- ✅ Scale automatically with Firebase
- ✅ Provide excellent developer experience
