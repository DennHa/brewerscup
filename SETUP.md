# MTG Brewers Cup - Setup Guide

## Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Firebase project with Firestore database

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/DennHa/brewerscup.git
cd brewerscup
```

### 2. Configure Firebase

Firebase credentials are **not** committed to git for security reasons. You need to create your own:

```bash
# Copy the example configuration
cp js/firebase-config.example.js js/firebase-config.js
cp js/admin.js.example js/admin.js
```

### 3. Set Up Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing one
3. Click **Settings** (⚙️ icon) → **Project Settings**
4. Scroll to **Your apps** section
5. Click the **Web icon** (`</>`)
6. Copy the entire `firebaseConfig` object

### 4. Update `js/firebase-config.js`

Replace the placeholder values with your Firebase credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef1234567890"
};
```

### 5. Set Up Admin Credentials

Edit `js/admin.js` and update the credentials:

```javascript
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'your-secure-password';
```

### 6. Configure Firestore

1. In Firebase Console, go to **Firestore Database**
2. Click **Create Database**
3. Select **Start in production mode**
4. Choose your region
5. Apply the security rules from [FIREBASE-SETUP.md](./FIREBASE-SETUP.md)

### 7. Run Locally

You can serve the files locally using Python:

```bash
# Python 3
python -m http.server 8000

# Then visit: http://localhost:8000
```

Or use any local web server (Live Server in VS Code, Node.js http-server, etc.)

## Deployment to GitHub Pages

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click **Save**

Your site will be live at: `https://your-username.github.io/brewerscup/`

### 2. Firebase CORS Configuration

If your app is on GitHub Pages and Firebase is in a different domain, you may need to update Firebase security rules to allow cross-origin requests.

## File Structure

```
brewerscup/
├── index.html                 # Main deck submission page
├── check-status.html          # Deck lookup/edit page
├── admin.html                 # Admin dashboard
├── css/
│   └── styles.css            # All styling
├── js/
│   ├── firebase-config.js     # Firebase setup (create from example)
│   ├── firebase-config.example.js  # Firebase configuration template
│   ├── admin.js               # Admin dashboard logic (create from example)
│   ├── admin.js.example       # Admin template
│   ├── main.js                # Main app logic
│   ├── check-status.js        # Check status page logic
│   ├── scryfall-api.js        # Scryfall API integration
│   └── deck-validator.js      # Deck parsing and validation
├── SETUP.md                   # This file
├── FIREBASE-SETUP.md          # Firebase security rules
└── README.md                  # Project overview
```

## Features

### Player Features
- ✅ Submit MTG Pauper decks with mainboard and sideboard
- ✅ Automatic card name normalization via Scryfall API
- ✅ Ban list validation
- ✅ Pauper legality checking
- ✅ Get memorable verification code (e.g., STORM-DRAKE)
- ✅ Check deck status with verification code
- ✅ Edit submitted decks
- ✅ Auto-save codes to browser storage
- ✅ Export deck as text file

### Admin Features
- ✅ View all submitted decks
- ✅ Delete player submissions
- ✅ Edit ban list
- ✅ View deck details with mainboard/sideboard
- ✅ Export deck as text

## Troubleshooting

### Firebase Module Not Loading
**Problem**: `Uncaught TypeError: Failed to fetch /js/firebase-config.js`

**Solution**: Make sure you've created `js/firebase-config.js` from the example:
```bash
cp js/firebase-config.example.js js/firebase-config.js
```

### MIME Type Error on GitHub Pages
**Problem**: `Loading of the module from "...firebase-config.js" was blocked because of an unapproved MIME type ("text/html")`

**Solution**: This means the file doesn't exist. See above - create the file from the example.

### Scryfall API Rate Limit
**Problem**: Cards not found, validation hangs

**Solution**: The app includes delays between Scryfall requests to avoid rate limiting. If issues persist, ensure you're not making too many requests simultaneously.

### Firebase Permission Denied
**Problem**: `Missing or insufficient permissions`

**Solution**: Check your Firestore security rules in `FIREBASE-SETUP.md` and ensure they match your Firebase configuration.

## Security Notes

⚠️ **Important:**
- `js/firebase-config.js` and `js/admin.js` are in `.gitignore` - NEVER commit them to git
- Firebase credentials in the config file are public (only API key, not sensitive)
- Admin credentials should be changed regularly
- Use Firebase Authentication for production instead of hardcoded credentials

## Support

For issues or questions:
1. Check [FIREBASE-SETUP.md](./FIREBASE-SETUP.md) for database configuration
2. Review browser console (F12) for error messages
3. Verify Firebase project settings match your credentials
4. Ensure Firestore security rules are properly applied

---

**Last Updated**: January 26, 2026  
**Version**: 1.0
