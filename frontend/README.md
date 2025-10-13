# CollabCanvas MVP

Real-time collaborative design tool - A multiplayer canvas where users can create and manipulate shapes together in real-time.

## 🚀 Tech Stack

- **Frontend:** React 19 + Vite 5
- **Canvas Rendering:** Konva.js + react-konva
- **Styling:** Tailwind CSS 3
- **Backend:** Firebase
  - Authentication (Email/Password + Google OAuth)
  - Firestore (Persistent canvas state)
  - Realtime Database (High-frequency cursor/presence updates)

## 📋 Prerequisites

- **Node.js:** v20.11.0 or higher
- **npm:** v10 or higher
- **Firebase Account:** [Create one here](https://firebase.google.com/)

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd CollabCanvas/vite-project
npm install
```

### 2. Firebase Setup

#### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the wizard
3. Once created, click on the **web icon (</>)** to register your app

#### Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** provider
3. Enable **Google** provider

#### Create Firestore Database

1. Go to **Firestore Database** > **Create database**
2. Start in **production mode** (we'll add rules later)
3. Choose your preferred location

#### Create Realtime Database

1. Go to **Realtime Database** > **Create database**
2. Start in **locked mode** (we'll add rules later)
3. Choose your preferred location

#### Get Firebase Config

1. Go to **Project Settings** (gear icon) > **General**
2. Scroll to "Your apps" section
3. Copy your Firebase configuration object

### 3. Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Fill in your Firebase configuration values:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎯 MVP Features

- ✅ User authentication (Email/Password + Google)
- ✅ Large canvas workspace (5000x5000px with boundaries)
- ✅ Pan and zoom functionality
- ✅ Rectangle shape creation and manipulation
- ✅ Real-time synchronization (<100ms)
- ✅ Object locking (first user to drag locks the object)
- ✅ Multiplayer cursors with unique colors
- ✅ Presence awareness (who's online)
- ✅ State persistence across sessions

## 🏗️ Project Structure

```
src/
├── components/
│   ├── Auth/           # Login/Signup components
│   ├── Canvas/         # Canvas and shape components
│   ├── Collaboration/  # Cursors and presence
│   └── Layout/         # Navbar, sidebar
├── contexts/           # React contexts (Auth, Canvas)
├── hooks/              # Custom hooks
├── services/           # Firebase services
├── utils/              # Helper functions & constants
├── App.jsx             # Main app component
└── main.jsx            # Entry point
```

## 🧪 Testing

Multi-user testing:
1. Open [http://localhost:5173](http://localhost:5173) in 2+ browser windows
2. Sign in with different accounts
3. Create and move shapes in one window → should appear in others
4. Verify cursor movements and presence updates

## 📝 Development Status

**Current PR:** #1 - Project Setup & Firebase Configuration
- ✅ React + Vite initialized
- ✅ Dependencies installed (React, Konva, Firebase, Tailwind)
- ✅ Tailwind CSS configured
- ✅ .gitignore updated
- ✅ .env.example created
- ✅ README created
- ⏳ Firebase service file pending
- ⏳ Firebase project setup pending

**Next PR:** #2 - Authentication System

## 🐛 Troubleshooting

### Dev server not starting?
- Check Node version: `node --version` (should be v20.11.0+)
- Clear cache: `npm cache clean --force`
- Reinstall: `rm -rf node_modules package-lock.json && npm install`

### Tailwind not working?
- Ensure Tailwind directives are in `src/index.css`
- Check `tailwind.config.js` content paths
- Restart dev server

### Firebase errors?
- Verify all `.env` variables are set correctly
- Check Firebase project settings match your config
- Ensure Authentication, Firestore, and Realtime DB are enabled

## 📚 Resources

- [Project Documentation](../PRD.md)
- [Architecture Diagram](../architecture.md)
- [Task Breakdown](../tasks.md)
- [Firebase Docs](https://firebase.google.com/docs)
- [Konva.js Docs](https://konvajs.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## 📄 License

MIT

---

**Built for Gauntlet AI - Week 1 Project**
