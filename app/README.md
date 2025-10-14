# CollabCanvas MVP

Real-time collaborative design tool - A multiplayer canvas where users can create and manipulate shapes together in real-time.

## 🌐 Live Demo

**🚀 Deployed at:** [Coming Soon - Follow deployment steps below]

<!-- After deployment, update with your actual URL:
**🚀 Live Demo:** https://your-project-id.web.app
-->

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

### 3. Configure Firebase Security Rules

#### Firestore Rules
1. Go to **Firestore Database** > **Rules** tab
2. Replace with these rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /canvases/{canvasId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

#### Realtime Database Rules
1. Go to **Realtime Database** > **Rules** tab
2. Replace with these rules:

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

**Important:** The `.read: true` must be at the `global-canvas-v1` level (not at `$userId` level) so users can see all cursors.

3. Click **Publish** to save

### 4. Environment Variables

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

**IMPORTANT:** The `VITE_FIREBASE_DATABASE_URL` is required for cursor tracking. Get it from Firebase Console > Realtime Database (top of page).

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

**Note:** After adding or changing `.env` variables, you MUST restart the dev server for changes to take effect.

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🐛 Troubleshooting

### Cursors Not Appearing

1. **Check Firebase Console Logs:**
   - Open browser DevTools (F12) > Console
   - Look for "✅ Firebase initialized successfully" message
   - Look for "✅ useCursors: Setting up cursor tracking" message
   - Look for "📍 Received cursors:" messages when moving mouse

2. **Verify Database URL:**
   - Make sure `VITE_FIREBASE_DATABASE_URL` is in your `.env` file
   - It should look like: `https://your-project-id-default-rtdb.firebaseio.com`
   - **Restart your dev server** after changing `.env`

3. **Check Realtime Database Rules:**
   - Go to Firebase Console > Realtime Database > Rules
   - Make sure rules are published (see setup instructions above)
   - Rules should allow reading all cursors but only writing your own

4. **Verify in Firebase Console:**
   - Go to Realtime Database > Data tab
   - When users are active, you should see: `sessions` > `global-canvas-v1` > `{userId}` > cursor data
   - If you don't see any data, cursor updates aren't reaching Firebase

5. **Test with Two Users:**
   - Open app in two different browsers (or use incognito mode)
   - Sign in with different accounts
   - Move mouse in one window
   - Check console logs in both windows

### Common Console Messages:

- ✅ **Good:** "✅ Firebase initialized successfully"
- ✅ **Good:** "📍 Received cursors: {...}"
- ✅ **Good:** "🖱️ Updating cursor: {...}"
- ❌ **Error:** "Missing required Firebase environment variables" → Check `.env`
- ❌ **Error:** "PERMISSION_DENIED" → Check Firebase RTDB rules
- ⚠️ **Warning:** "⚠️ Invalid cursor data" → Data structure issue

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

## 🚀 Deployment to Firebase Hosting

### Quick Deploy

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Update Project ID**:
   - Open `../.firebaserc` (in CollabCanvas root)
   - Replace `your-firebase-project-id` with your actual Firebase project ID

4. **Build Production Bundle**:
   ```bash
   npm run build
   ```

5. **Deploy** (from CollabCanvas root directory):
   ```bash
   cd ..
   firebase deploy
   ```

6. **Access Your App**:
   - Your app will be live at: `https://your-project-id.web.app`

### Detailed Deployment Guide

See `../DEPLOYMENT-GUIDE.md` for comprehensive deployment instructions, troubleshooting, and configuration details.

---

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
