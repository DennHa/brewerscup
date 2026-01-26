<!-- Quick Reference Guide for MTG Brewers Cup -->
<!-- This file serves as documentation of the project structure -->

# MTG Brewers Cup - Quick Reference

## 📁 Project Files Overview

### HTML Files (Pages)
- **index.html** - Main deck submission page
- **check-status.html** - Deck lookup page by verification code
- **admin.html** - Admin dashboard (Firebase auth required)

### CSS Files (Styling)
- **css/styles.css** - Complete styling for all pages (responsive design)

### JavaScript Files (Functionality)

#### Configuration
- **js/firebase-config.js** - Firebase initialization
  - ⚠️ UPDATE WITH YOUR FIREBASE CREDENTIALS

#### Core Logic
- **js/scryfall-api.js** - Scryfall API integration
  - Card name normalization
  - Fuzzy matching for card lookup

- **js/deck-validator.js** - Deck parsing and validation
  - Parse Moxfield URLs
  - Parse Archidekt URLs
  - Parse text deck lists
  - Check cards against ban list
  - `BAN_LIST` constant to customize banned cards

#### Page Logic
- **js/main.js** - Main submission page (index.html)
- **js/check-status.js** - Status lookup page (check-status.html)
- **js/admin.js** - Admin dashboard (admin.html)

### Configuration Files
- **.gitignore** - Git ignore rules

### Documentation
- **README.md** - Full setup and usage guide

## 🚀 Quick Start Checklist

- [ ] Create Firebase project
- [ ] Create Firestore database
- [ ] Enable Firebase Authentication
- [ ] Copy Firebase config to `js/firebase-config.js`
- [ ] Customize ban list in `js/deck-validator.js`
- [ ] Push to GitHub
- [ ] Enable GitHub Pages
- [ ] Share your URL!

## 🔧 Customization Quick Links

### Change Ban List
→ File: `js/deck-validator.js`, Line: `export const BAN_LIST = [`

### Change Color Scheme
→ File: `css/styles.css`, Lines: 1-20 (CSS variables)

### Change Verification Code Format
→ File: `js/main.js`, Function: `generateVerificationCode()`

### Add New Deck Source
→ File: `js/deck-validator.js`, Add function: `parseYourSiteURL()`

### Add New Card Validation Rule
→ File: `js/deck-validator.js`, Function: `validateAgainstBanlist()`

## 📱 Key Features by Page

### index.html (Submission)
- Player name/email input
- URL or text deck input
- Real-time preview
- Deck validation
- QR code generation
- Verification code display

### check-status.html (Lookup)
- Enter verification code
- View deck details
- Download deck list
- See submission timestamp

### admin.html (Dashboard)
- Firebase login
- View all submissions
- Statistics dashboard
- Filter by player/status
- View detailed deck info

## 🔐 Security Notes

- Firebase credentials are safe to expose with security rules
- Admin page requires Firebase authentication
- QR codes only contain verification code
- Firestore rules prevent unauthorized access
- No passwords or sensitive data stored

## 🌐 Deployment

This is a static site - compatible with:
- GitHub Pages ✅
- Netlify ✅
- Vercel ✅
- Any static hosting ✅

NO backend server needed!

## 🆘 Common Edits

### Add a Banned Card
```javascript
// In js/deck-validator.js, find:
export const BAN_LIST = [
  'Sol Ring',
  // Add here:
  'New Card Name',
];
```

### Change Primary Color
```css
/* In css/styles.css, find :root { */
--primary: #6B46C1;  /* Change this hex code */
```

### Add Admin User Email
```javascript
// In admin.html, Firebase auth automatically handles this
// Just add users in Firebase Console → Authentication
```

## 📊 Data Structure (Firestore)

```
Collection: decks
  Document: {auto-id}
    - playerName: string
    - email: string (optional)
    - decklist: array of {name, quantity, scryfallId}
    - verificationCode: string (8 chars)
    - deckSize: number
    - isValid: boolean
    - bannedCards: array of {name, quantity}
    - timestamp: timestamp
    - status: "approved" | "banned"
```

## 🎯 Next Steps After Setup

1. Test the main page with a sample deck
2. Add your first banned card
3. Test the check-status page
4. Set up admin login and verify dashboard
5. Share the public URL with players
6. Monitor submissions in admin dashboard

---

For detailed setup instructions, see **README.md**
