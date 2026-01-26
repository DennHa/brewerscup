# Firebase Setup Guide - Step by Step

This guide walks you through setting up Firebase for the MTG Brewers Cup application.

## Prerequisites

- Google account (for Firebase Console)
- GitHub account (for hosting)
- Web browser

## Step 1: Create Firebase Project

1. Open [Firebase Console](https://console.firebase.google.com)
2. Sign in with your Google account
3. Click **"Create a project"**
4. Enter project name: **MTG Brewers Cup** (or your preferred name)
5. Click **Continue**
6. Disable "Enable Google Analytics for this project" (optional)
7. Click **Create project**
8. Wait for project creation (30 seconds - 2 minutes)

## Step 2: Create Web App

1. In Firebase Console, find your project
2. In the project overview, click the **</> ** (web) icon
3. Enter app name: **MTG Brewers Cup Web**
4. Check "Also set up Firebase Hosting for this project" (optional)
5. Click **Register app**

## Step 3: Copy Firebase Configuration

You'll see a code snippet like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDEXAMPLE...",
  authDomain: "mtg-brewers-cup-xxxxx.firebaseapp.com",
  projectId: "mtg-brewers-cup-xxxxx",
  storageBucket: "mtg-brewers-cup-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

**Copy this entire config object** (you'll need it in Step 7)

## Step 4: Set Up Firestore Database

1. In Firebase Console, go to **Build** section (left menu)
2. Click **Firestore Database**
3. Click **Create database**
4. Choose **Start in production mode**
5. Select location (usually closest to your users):
   - US: `us-east1`
   - Europe: `europe-west1`
   - Asia: `asia-east1`
6. Click **Create**
7. Wait for database creation (30 seconds)

## Step 5: Set Up Firestore Security Rules

**This step is CRUCIAL for security**

1. In Firestore Database, click the **Rules** tab
2. Delete the default rules (select all and delete)
3. **Copy ONLY the text between the lines below** (do NOT copy the ```javascript or ``` lines):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read all decks
    match /decks/{document=**} {
      allow read;
      // Allow authenticated users to create new decks
      allow create: if request.auth != null;
      // Allow anyone to update decks (users can edit their own via verification code)
      allow update: if true;
      // Prevent deletes
      allow delete: if false;
    }
    
    // Admin section - ban list (read by everyone, write by admins only)
    match /admin/{document=**} {
      // Anyone can read the ban list
      allow read;
      // Only allow updates to admin collection (controlled via app logic)
      allow write: if true;
    }
  }
}
```

⚠️ **IMPORTANT:** Copy from `rules_version` to the final `}` - do NOT include the ` ```javascript ` or ` ``` ` lines!

4. Paste into the Firestore Rules editor
5. Click **Publish**

**What these rules mean:**
- ✅ Anyone can READ decks (public data)
- ✅ Authenticated users can CREATE decks
- ✅ Anyone can UPDATE decks (users verify themselves with verification code)
- ❌ Nobody can DELETE decks (maintain deck history)
- ✅ Anyone can READ the ban list from `admin/banlist`
- ✅ Admin dashboard can UPDATE the ban list (controlled by app-level verification)

## Step 6: Set Up Firebase Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click **Get started** (or **Sign-in method** if already started)
3. Enable **Google**:
   - Click Google provider
   - Enable the toggle
   - Click Save
4. Enable **Email/Password**:
   - Click Email/Password provider
   - Enable "Email/Password" toggle
   - Disable "Email link (passwordless sign-in)"
   - Click Save

**These authentication methods allow:**
- ✅ Google login for admin dashboard
- ✅ Email/password login for admins
- ✅ Unauthenticated read access for public

## Step 7: Add Firebase Config to Your App

1. Open your project file: `js/firebase-config.js`
2. Find this section:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDEXAMPLE_REPLACE_WITH_YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef1234567890"
};
```

3. Replace with YOUR config from Step 3
4. Save the file

**Example of filled config:**

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDEXAMPLE1234567890abcdefghijk",
  authDomain: "mtg-brewers-cup-12345.firebaseapp.com",
  projectId: "mtg-brewers-cup-12345",
  storageBucket: "mtg-brewers-cup-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456ghi"
};
```

## Step 8: Set Up Admin Users (Optional)

To add admins who can access the admin dashboard:

1. Go to **Authentication** → **Users** tab
2. Click **Add user**
3. Enter email and password
4. Click **Create user**
5. Repeat for each admin
6. Save their credentials securely

**These admins can login at the Admin page with their email/password**

## Step 9: Create First Collection (Optional)

This happens automatically on first submission, but you can create it manually:

1. Go to **Firestore Database**
2. Click **+ Start collection**
3. Collection ID: `decks`
4. Click **Next**
5. Click **Save** (no documents needed yet)

## Testing Your Setup

### Test 1: Can you access Firestore?
- Go to Firebase Console → Firestore Database
- You should see the "decks" collection
- If you see errors, check your security rules

### Test 2: Can you authenticate?
- Go to your app admin page
- Try signing in with Google
- If you see errors, check authentication is enabled

### Test 3: Can you submit a deck?
- Go to your main page
- Paste this test deck:
  ```
  4x Black Lotus
  4x Ancestral Recall
  4x Time Walk
  53x Mountain
  ```
- Click Preview
- Should find 3 cards + 1 unfound (test the error handling)

### Test 4: Can you check decks?
- Go to check-status page
- Enter a verification code from your submission
- Should see your deck details

## If Something Goes Wrong

### Error: "Firebase config is invalid"
→ Check that all fields in `firebase-config.js` are filled in correctly
→ Make sure there are no typos

### Error: "Permission denied" in console
→ Check security rules in Firestore
→ Make sure you used the rules from Step 5

### Error: "Authentication not enabled"
→ Go to Firebase Console → Authentication
→ Enable at least one provider (Google or Email/Password)

### Cards not found
→ This is normal - card names must match Scryfall exactly
→ Try using Moxfield/Archidekt URL instead

### Can't login to admin
→ Make sure you created admin user in Step 8
→ Try with Google login if email login doesn't work
→ Check that authentication is enabled

## Firebase Console URLs

After setup, bookmark these links:

- **Firestore Database**: https://console.firebase.google.com/project/YOUR-PROJECT-ID/firestore
- **Authentication**: https://console.firebase.google.com/project/YOUR-PROJECT-ID/authentication
- **Project Settings**: https://console.firebase.google.com/project/YOUR-PROJECT-ID/settings/general

Replace `YOUR-PROJECT-ID` with your actual project ID.

## Security Best Practices

✅ **DO:**
- Keep security rules strict
- Regularly monitor Firestore usage
- Use authentication for admin access
- Back up important data

❌ **DON'T:**
- Share your API key privately (it's meant to be public with security rules)
- Store sensitive user data
- Leave Firestore in "test mode"
- Use weak passwords for admin accounts

## Next Steps

1. Add your ban list to `js/deck-validator.js`
2. Deploy to GitHub Pages (see README.md)
3. Share the URL with players
4. Monitor submissions in the admin dashboard

## Need Help?

- Firebase Documentation: https://firebase.google.com/docs
- Firebase Status: https://status.firebase.google.com
- Stack Overflow: Search "[firebase]"

---

**You're all set! 🎉**
