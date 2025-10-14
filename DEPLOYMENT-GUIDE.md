# Firebase Hosting Deployment Guide

This guide will help you deploy CollabCanvas to Firebase Hosting.

## Prerequisites

- Node.js installed
- Firebase project already created (you should have one from initial setup)
- Firebase CLI installed globally

## Step-by-Step Deployment

### 1. Install Firebase CLI (if not already installed)

```bash
npm install -g firebase-tools
```

Verify installation:
```bash
firebase --version
```

### 2. Login to Firebase

```bash
firebase login
```

This will open a browser window for authentication.

### 3. Link to Your Firebase Project

Open `.firebaserc` and replace `your-firebase-project-id` with your actual Firebase project ID.

You can find your project ID in:
- Firebase Console URL: `https://console.firebase.google.com/project/YOUR-PROJECT-ID`
- Or run: `firebase projects:list` to see all your projects

Example `.firebaserc`:
```json
{
  "projects": {
    "default": "collabcanvas-abc123"
  }
}
```

### 4. Build the Production Bundle

Navigate to the frontend directory and build:

```bash
cd frontend
npm run build
```

This creates an optimized production build in `frontend/dist/`.

### 5. Deploy to Firebase Hosting

From the project root (CollabCanvas folder):

```bash
firebase deploy --only hosting
```

### 6. Deploy Security Rules (Important!)

Deploy Firestore and Realtime Database rules:

```bash
firebase deploy --only firestore:rules,database
```

Or deploy everything at once:

```bash
firebase deploy
```

### 7. Access Your Deployed App

After deployment completes, you'll see URLs like:
- `https://your-project-id.web.app`
- `https://your-project-id.firebaseapp.com`

## Configuration Files Explained

### `firebase.json`
- Configures Firebase Hosting settings
- Points to `frontend/dist` as the public directory
- Sets up SPA routing (all routes → index.html)
- Configures caching headers for static assets

### `.firebaserc`
- Links your local project to your Firebase project
- **YOU MUST UPDATE THIS with your actual project ID**

### `firestore.rules`
- Security rules for Firestore Database
- Allows authenticated users to read/write canvas shapes

### `database.rules.json`
- Security rules for Realtime Database
- Allows all users to read cursors
- Allows users to only write their own cursor data

## Testing Deployment

After deployment:

1. ✅ Open the deployed URL
2. ✅ Sign up / Log in
3. ✅ Create shapes
4. ✅ Open in another browser/incognito
5. ✅ Verify real-time sync works
6. ✅ Check cursors appear
7. ✅ Check presence list shows online users

## Updating the Deployment

Whenever you make changes:

```bash
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

## Troubleshooting

### "Project not found" error
- Update `.firebaserc` with correct project ID
- Run `firebase use --add` to interactively select project

### "Permission denied" errors after deployment
- Make sure you deployed the security rules: `firebase deploy --only firestore:rules,database`
- Verify rules in Firebase Console

### Environment variables not working
- Build process uses `.env` file at build time
- Make sure `.env` exists in `frontend/` directory
- Rebuild after changing environment variables

### 404 errors on refresh
- Already handled in `firebase.json` with rewrites configuration
- If still happening, check that `"destination": "/index.html"` is in rewrites

## Custom Domain (Optional)

To add a custom domain:

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow the DNS configuration steps

## Monitoring

View hosting metrics:
- Firebase Console → Hosting → Dashboard
- See bandwidth usage, requests, storage

## Cost

Firebase Hosting free tier includes:
- 10 GB storage
- 360 MB/day bandwidth

Your app should easily fit within these limits.

## Next Steps

After successful deployment:
1. ✅ Update README.md with live demo link
2. ✅ Test with multiple users
3. ✅ Share the URL!

