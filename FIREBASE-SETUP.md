# Firebase Setup Guide

This document provides step-by-step instructions to configure Firebase Firestore for the MTG Brewers Cup app.

## Quick Overview

The app uses Firebase Firestore to store:
- **Decks**: User submissions with mainboard/sideboard cards, validation status
- **Ban List**: Managed by admin panel, used for deck validation

## Prerequisites

- Google account (for Firebase Console)
- Modern web browser
- Text editor for updating configuration

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Sign in with your Google account
3. Click **Create a project**
4. Enter project name: **brewerscup** (or your choice)
5. Choose your location
6. Disable "Enable Google Analytics" (optional)
7. Click **Create project**
8. Wait for project creation to complete

## Step 2: Create Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click **Create database**
3. Select region (closest to your location, e.g., `europe-west1`)
4. Choose **Start in production mode**
5. Click **Create**

## Step 3: Configure Security Rules

1. Click the **Rules** tab at the top
2. Replace all content with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read/write for decks
    match /decks/{document=**} {
      allow create: if true;
      allow read: if true;
      allow update, delete: if true;
    }
1. In Firebase Console, click **Settings** ⚙️ (top right)
2. Select **Project Settings**
3. Go to **General** tab
4. Scroll down to **Your apps**
5. Click the **Web app icon** (`</>`)
6. You should see a code block with `firebaseConfig`
7. Copy the entire config object

**Example config** (replace with your actual values):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDEXAMPLE1234567890abcdefghijk",
  authDomain: "brewerscup-12345.firebaseapp.com",
  projectId: "brewerscup-12345",
  storageBucket: "brewerscup-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456ghi"
};
```

## Step 5: Update Your App Configuration

1. In your project folder, locate `js/firebase-config.js`
2. Replace the placeholder values with your config from Step 4
3. Save the file

## Step 6: Initialize Collections

When the app first runs, it will automatically create the `decks` collection. The ban list is managed via the admin panel.

**Firestore Structure:**

```
/decks
  /{verificationCode} - Each submitted deck
    - playerName (string)
    - mainboard (array: {name, quantity})
    - sideboard (array: {name, quantity})
    - mainboardSize (number)
    - sideboardSize (number)
    - banlistValid (boolean)
    - pauperValid (boolean)
    - pauperIllegalCards (array)
    - submittedAt (timestamp)
    - lastModified (timestamp)

/admin
  /banlist - Ban list for validation
    - cards (array of card names)
    - lastUpdated (timestamp)
```

## Testing Your Setup

### Check 1: Firestore Access
1. Go to Firebase Console → **Firestore Database**
2. You should see the empty database
3. Try submitting a test deck from your app
4. Refresh Firestore - you should see it in `/decks`

### Check 2: Ban List
1. Go to your app's admin panel
2. The ban list should load without errors
3. Try adding a card to the ban list

### Check 3: Deck Status Lookup
1. Submit a test deck
2. Get the verification code (e.g., STORM-DRAKE)
3. Go to check-status page
4. Enter the code - your deck should appear

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Failed to fetch firebase-config.js" | Create `js/firebase-config.js` from template, add credentials |
| "Permission denied" in console | Check security rules are published correctly |
| Database not appearing | Ensure Firestore Database (not Realtime DB) was created |
| Cards not found during submission | Card names must match Scryfall exactly; try paste from Moxfield |
| Can't see submitted decks | Check Firestore Console for data; verify security rules |

## Security Considerations

✅ **What's Safe to Share:**
- API Key (only works within security rules)
- Auth Domain
- Project ID
- Storage Bucket

❌ **Never Share:**
- Admin credentials
- Your local `firebase-config.js`
- Database backups with sensitive data

## Need Help?

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Console](https://console.firebase.google.com)

---

**Last Updated**: January 26, 2026  
**Version**: 2.0
3. Share the URL with players
4. Monitor submissions in the admin dashboard

## Need Help?

- Firebase Documentation: https://firebase.google.com/docs
- Firebase Status: https://status.firebase.google.com
- Stack Overflow: Search "[firebase]"

---

**You're all set! 🎉**
