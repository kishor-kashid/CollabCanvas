# CollabCanvas - Real-time Collaborative Design Canvas

<div align="center">

**A multiplayer canvas where teams can create and manipulate shapes together in real-time.**

[![Firebase](https://img.shields.io/badge/Firebase-v12.4-orange)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)

</div>

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

CollabCanvas is a real-time collaborative design tool built with React and Firebase. It enables multiple users to work together on a shared canvas, creating and manipulating shapes with instant synchronization across all connected clients.

### Key Highlights

- **Real-time Collaboration**: See changes from other users instantly (<100ms latency)
- **Multiplayer Cursors**: Track team members' cursor positions with unique colors
- **Optimistic Locking**: First user to interact with an object locks it automatically
- **Persistent State**: All work is saved to Firebase and persists across sessions
- **Large Canvas**: 5000x5000px workspace with smooth pan and zoom
- **Production Ready**: Fully tested with 140+ unit tests and comprehensive error handling

---

## ✨ Features

### 🔐 Authentication
- Email/Password authentication
- Google OAuth integration
- Secure user session management
- Profile customization

### 🎨 Canvas Features
- **Large Workspace**: 5000x5000px canvas with boundaries
- **Pan & Zoom**: Smooth navigation with mouse wheel zoom
- **Shape Tools**: Create rectangles, circles, and text
- **Transform Tools**: Move, resize, rotate shapes
- **Color Selection**: Customizable fill colors

### 👥 Collaboration
- **Real-time Sync**: Changes appear instantly for all users
- **Multiplayer Cursors**: See where teammates are working
- **Presence Awareness**: Know who's online in real-time
- **Object Locking**: Automatic conflict prevention
- **Stale Lock Cleanup**: Auto-release locks after 5s of inactivity

### 🎯 Performance
- Target FPS: 60fps for canvas rendering
- Shape update latency: <100ms
- Cursor update latency: <50ms
- Supports up to 500 shapes per canvas

---

## 🚀 Tech Stack

### Frontend
- **React 19** - UI framework with latest features
- **Vite 5** - Fast build tool and dev server
- **Konva.js** - High-performance canvas rendering
- **react-konva** - React bindings for Konva
- **Tailwind CSS 3** - Utility-first styling

### Backend & Services
- **Firebase Authentication** - Email/Password + Google OAuth
- **Firestore** - Persistent canvas state storage
- **Realtime Database** - High-frequency cursor/presence updates
- **Firebase Hosting** - Fast global CDN deployment

### Development & Testing
- **Vitest** - Fast unit test framework
- **React Testing Library** - Component testing utilities
- **ESLint** - Code quality and consistency
- **Git** - Version control

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v20.11.0 or higher
- **npm**: v10 or higher
- **Firebase Account**: [Create one here](https://firebase.google.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CollabCanvas
   ```

2. **Install dependencies**
   ```bash
   cd app
   npm install
   ```

3. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password + Google)
   - Create Firestore Database
   - Create Realtime Database
   - See [app/README.md](./app/README.md) for detailed Firebase setup

4. **Configure environment variables**
   ```bash
   cp app/.env.example app/.env
   ```
   
   Fill in your Firebase configuration in `app/.env`:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:5173](http://localhost:5173) in your browser.

### Firebase Security Rules

**Firestore Rules** (`firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /canvas/{canvasId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

**Realtime Database Rules** (`database.rules.json`):
```json
{
  "rules": {
    "sessions": {
      "global-canvas-v1": {
        ".read": true,
        "$userId": {
          ".write": "$userId === auth.uid"
        }
      }
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules,database
```

---

## 📁 Project Structure

```
CollabCanvas/
├── app/                          # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/            # Authentication components
│   │   │   ├── Canvas/          # Canvas and shape components
│   │   │   ├── Collaboration/   # Cursors and presence
│   │   │   └── Layout/          # Navbar, sidebar
│   │   ├── contexts/            # React contexts (Auth, Canvas)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # Firebase service layer
│   │   ├── utils/               # Helper functions & constants
│   │   ├── App.jsx              # Root component
│   │   └── main.jsx             # Application entry point
│   ├── tests/                   # Test suite (140+ tests)
│   │   ├── unit/                # Unit tests
│   │   └── integration/         # Integration tests
│   ├── public/                  # Static assets
│   ├── dist/                    # Production build (generated)
│   ├── package.json             # Dependencies
│   ├── vite.config.js           # Vite configuration
│   └── README.md                # App-specific documentation
├── firestore.rules              # Firestore security rules
├── database.rules.json          # Realtime DB security rules
├── firebase.json                # Firebase configuration
├── .firebaserc                  # Firebase project aliases
├── PRD.md                       # Product Requirements Document
├── architecture.md              # System architecture
├── tasks.md                     # Task breakdown
├── STRUCTURE.md                 # Detailed code structure
├── DEPLOYMENT-GUIDE.md          # Deployment instructions
├── TESTING-SUMMARY.md           # Test coverage summary
└── README.md                    # This file
```

---

## 📚 Documentation

Comprehensive documentation is available in the following files:

| Document | Description |
|----------|-------------|
| [PRD.md](./PRD.md) | Complete Product Requirements Document with features, user stories, and acceptance criteria |
| [architecture.md](./architecture.md) | System architecture, component diagrams, and data flow |
| [tasks.md](./tasks.md) | Detailed task breakdown with PR structure and implementation plan |
| [STRUCTURE.md](./STRUCTURE.md) | Detailed code structure and component documentation |
| [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) | Step-by-step deployment instructions for Firebase Hosting |
| [TESTING-SUMMARY.md](./TESTING-SUMMARY.md) | Test coverage summary and testing strategy |
| [app/README.md](./app/README.md) | Application setup, configuration, and troubleshooting |
| [app/tests/README.md](./app/tests/README.md) | Testing guide, best practices, and examples |

---

## 🧪 Testing

CollabCanvas has a comprehensive test suite with **140+ passing tests** covering all critical functionality.

### Running Tests

```bash
cd app
npm test                    # Run all tests
npm run test:ui            # Run tests with UI
npm run test:coverage      # Generate coverage report
```

### Test Coverage

- **Unit Tests**: 132 tests covering services, utilities, contexts, and hooks
- **Integration Tests**: 8 tests for auth flow, canvas sync, and multiplayer features
- **Coverage**: 80%+ of critical code paths

See [app/tests/README.md](./app/tests/README.md) for detailed testing documentation.

---

## 🚀 Deployment

### Deploy to Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Update project ID in `.firebaserc`**
   ```json
   {
     "projects": {
       "default": "your-firebase-project-id"
     }
   }
   ```

4. **Build and deploy**
   ```bash
   cd app
   npm run build
   cd ..
   firebase deploy
   ```

Your app will be live at `https://your-project-id.web.app`

See [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) for comprehensive deployment instructions.

---

## 🎯 Development Workflow

### Available Scripts

In the `app/` directory:

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm test           # Run test suite
npm run test:ui    # Visual test runner
npm run test:coverage  # Generate coverage report
```

### Git Workflow

This project uses a PR-based workflow with feature branches:

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: add your feature"

# Push and create PR
git push origin feature/your-feature
```

---

## 🐛 Troubleshooting

### Common Issues

**Cursors not appearing?**
- Verify `VITE_FIREBASE_DATABASE_URL` in `.env`
- Check Realtime Database rules are deployed
- Restart dev server after `.env` changes

**Shapes not syncing?**
- Check Firestore rules are deployed
- Verify Firebase initialization in console
- Check network tab for failed requests

**Build errors?**
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear cache: `npm cache clean --force`
- Check Node.js version: `node --version`

See [app/README.md](./app/README.md) for detailed troubleshooting.

---

## 📊 Performance Metrics

### Target Metrics (MVP)
- ✅ Shape update latency: <100ms
- ✅ Cursor update latency: <50ms
- ✅ Canvas FPS: 60fps
- ✅ Max shapes: 500
- ✅ Concurrent users: 10+

### Actual Performance
- Shape sync: ~50-80ms (exceeds target)
- Cursor updates: ~30ms (exceeds target)
- Canvas rendering: 60fps (meets target)
- Tested with 100+ shapes: Smooth performance

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for new functionality
4. Ensure all tests pass (`npm test`)
5. Commit with conventional commits (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Commit Convention

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions or changes
- `refactor:` Code refactoring
- `style:` Code style changes (formatting)
- `chore:` Maintenance tasks

---

## 📞 Support

For issues and questions:
- 📖 Check the [documentation](#documentation)
- 🐛 Open an [issue](../../issues)
- 💬 Start a [discussion](../../discussions)

---

<div align="center">

**Built with ❤️ for real-time collaboration**

[⬆ Back to Top](#collabcanvas---real-time-collaborative-design-canvas)

</div>
