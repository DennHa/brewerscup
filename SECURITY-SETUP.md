# 🔒 Security Setup Guide

## Firebase Credentials Management

**⚠️ IMPORTANT**: Firebase credentials (API keys, config) should **NEVER** be committed to version control.

### Setup Instructions

1. **Copy the example file:**
   ```bash
   cp js/firebase-config.example.js js/firebase-config.js
   cp js/admin.js.example js/admin.js
   ```

2. **Add your Firebase credentials:**
   - Open `js/firebase-config.js` (now local-only, in .gitignore)
   - Replace the placeholder values with your actual Firebase config
   - Get these from Firebase Console → Project Settings → Your Apps

3. **Add your admin credentials:**
   - Open `js/admin.js` (now local-only, in .gitignore)
   - Set the admin email and password for authentication

4. **Never commit these files:**
   - Both `js/firebase-config.js` and `js/admin.js` are in `.gitignore`
   - If they were accidentally committed before, the key is compromised and must be rotated

### If Your Key Was Exposed

**Step 1: Regenerate the Key (IMMEDIATE)**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: `brewersCup (id: brewerscup-77eaa)`
3. Search for "Credentials" in the search bar
4. Find your Firebase API key
5. Click "Edit" → "Regenerate Key" button to rotate it
6. Copy the new key

**Step 2: Update Local Config**
1. Open `js/firebase-config.js`
2. Replace the old `apiKey` value with the new one
3. Do NOT commit this file

**Step 3: Clean Git History** (Remove exposed key from public history)
```bash
# If you want to remove the file from git history entirely:
git rm --cached js/firebase-config.js
git commit -m "Remove compromised firebase credentials from git history"
git push origin main --force-with-lease

# OR: Create a new commit without the exposed key
git commit -am "Remove exposed firebase config from git tracking"
git push origin main
```

**Step 4: Monitor Usage in Firebase Console**
- Review API activity in [Google Cloud Console](https://console.cloud.google.com)
- Set up billing alerts if not already configured
- Consider restricting the new API key to specific APIs

### Restricting API Keys (Recommended)

1. Go to Google Cloud Console → Credentials
2. Click on your API key
3. Set **Application restrictions** to "HTTP referrers (web sites)"
4. Add your domain (e.g., `decksubmit.example.com`)
5. Set **API restrictions** to only the APIs you need:
   - Cloud Firestore API
   - Firebase App Check API
   - Firebase Real-time Database API
   - Cloud Storage API (for banner uploads)
   
This prevents unauthorized use even if the key is exposed.

### Files to Never Commit
- `js/firebase-config.js` ✅ In `.gitignore` now
- `js/admin.js` ✅ In `.gitignore` now
- `.env` files with secrets
- AWS credentials, API keys, tokens, passwords

### Example Files
- `js/firebase-config.example.js` — Template showing the structure
- `js/admin.js.example` — Template with placeholder auth settings

Use these files as templates. Copy them locally and add your real credentials, **but never commit the originals with real values**.
