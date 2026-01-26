# 🧙 MTG Brewers Cup - Deck Verification System

A modern, clean web application for Magic: The Gathering Brewers Cup deck verification. Players can submit decks, validate them against a ban list, and receive unique verification codes. Admins can view all submissions through a protected dashboard.

## Features

✅ **Deck Submission**
- Submit decks via Moxfield or Archidekt URLs
- Paste raw deck lists in common text formats
- Automatic card name normalization using Scryfall API
- Live deck preview before submission

✅ **Validation & Ban List**
- Check all cards against configurable ban list
- Clear feedback on banned cards
- Detailed error reporting if cards aren't found

✅ **Verification System**
- Generate unique 8-character verification codes
- Create printable/savable QR codes
- Easy deck lookup by verification code

✅ **Admin Dashboard**
- View all submitted decks
- Filter by player name and validation status
- View detailed deck information
- Statistics about submissions

✅ **User Experience**
- Mobile-friendly responsive design
- Clean, modern interface
- Fast, reliable performance
- Error handling and clear messaging

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6 Modules)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Hosting**: GitHub Pages (static site)
- **APIs**: Scryfall API for card data, Moxfield/Archidekt APIs for deck imports
- **QR Codes**: QRCode.js library

## Project Structure

```
mtg-brewers-cup/
├── index.html              # Main submission page
├── check-status.html       # Deck lookup page
├── admin.html              # Admin dashboard
├── css/
│   └── styles.css          # Main stylesheet
├── js/
│   ├── firebase-config.js  # Firebase configuration
│   ├── deck-validator.js   # Deck parsing & validation logic
│   ├── scryfall-api.js     # Scryfall API integration
│   ├── main.js             # Main app logic (index.html)
│   ├── check-status.js     # Check status logic
│   └── admin.js            # Admin dashboard logic
├── .gitignore              # Git ignore file
└── README.md               # This file
```

## Setup Instructions

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: "MTG Brewers Cup"
4. Disable Google Analytics (optional)
5. Click "Create project" and wait for setup to complete

### Step 2: Create a Web App in Firebase

1. In Firebase Console, click the web icon (`</>`)
2. Register app with name "MTG Brewers Cup Web"
3. Copy the Firebase configuration object
4. Click "Continue to console"

### Step 3: Configure Firestore Database

1. Go to **Firestore Database** in Firebase Console
2. Click "Create database"
3. Choose **Start in production mode**
4. Select a location (closest to your users recommended)
5. Click "Create"

### Step 4: Create Firestore Collection

1. In Firestore Database, click "Start collection"
2. Collection ID: `decks`
3. Click "Next"
4. Click "Save" (collection will be created with first document)

### Step 5: Set Up Firestore Security Rules

1. Go to **Firestore Database** → **Rules** tab
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read decks
    match /decks/{document=**} {
      allow read;
      allow create: if request.auth != null;
      allow update, delete: if false;
    }
  }
}
```

3. Click "Publish"

### Step 6: Set Up Firebase Authentication

1. Go to **Authentication** in Firebase Console
2. Click "Get started"
3. Enable **Google** as a sign-in provider
4. Enable **Email/Password** authentication
5. Save

### Step 7: Add Firebase Config to App

1. Open [js/firebase-config.js](js/firebase-config.js)
2. Replace the `firebaseConfig` object with your project credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef1234567890"
};
```

### Step 8: Configure Ban List (Optional)

Edit [js/deck-validator.js](js/deck-validator.js) and modify the `BAN_LIST` constant:

```javascript
export const BAN_LIST = [
  'Sol Ring',
  'Mana Crypt',
  'Dockside Extortionist',
  // Add more cards as needed
];
```

### Step 9: Deploy to GitHub Pages

1. Create a new GitHub repository named `mtg-brewers-cup`
2. Clone the repository locally
3. Copy all project files into the repository
4. Commit and push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

5. Go to repository **Settings** → **Pages**
6. Set **Source** to "Deploy from a branch"
7. Select **Branch**: `main` and folder: `/ (root)`
8. Click "Save"
9. Wait a few minutes for deployment
10. Your site will be available at: `https://yourusername.github.io/mtg-brewers-cup/`

## Usage

### For Players

1. **Submit a Deck**:
   - Go to the main page
   - Enter your player name
   - Paste a Moxfield/Archidekt URL OR text deck list
   - Click "Preview Deck" to verify cards
   - Click "Submit Deck" to save and get verification code

2. **Check Deck Status**:
   - Go to "Check Deck" page
   - Enter your verification code
   - View your deck details

### For Admins

1. **Access Admin Dashboard**:
   - Go to "Admin" page
   - Sign in with your Firebase authentication email/password
   - View all submissions with statistics

2. **Manage Submissions**:
   - Filter by player name or validation status
   - Click "View" to see detailed deck information
   - Track which cards are causing rejections

## Common Issues & Troubleshooting

### ❌ "Firebase config is invalid"
**Solution**: Make sure you copied the entire `firebaseConfig` object from Firebase Console. Check that all quotes are correct.

### ❌ "Scryfall API error" or "Card not found"
**Solution**: This means the card name wasn't recognized. Scryfall uses exact Oracle names. Try:
- Use the exact English card name
- Check for typos
- Paste the decklist from Moxfield/Archidekt instead of typing manually

### ❌ "Firestore permission denied"
**Solution**: Check your security rules. Make sure the rules above are correctly applied. Users need `auth != null` to create decks.

### ❌ "QR code not generating"
**Solution**: The QR code library loads from CDN. Check your internet connection. The verification code will still display even if QR code fails.

### ❌ "Verification code not found"
**Solution**: Make sure you're using the exact code (uppercase). Codes are case-sensitive.

### ❌ Admin page won't load
**Solution**: 
- Make sure you've enabled Firebase Authentication
- Try clearing browser cache
- Check that you're signed in

## Customization

### Change Colors
Edit [css/styles.css](css/styles.css) and modify CSS variables at the top:

```css
:root {
  --primary: #6B46C1;        /* Main purple color */
  --success: #10B981;         /* Green for valid */
  --danger: #EF4444;          /* Red for invalid */
  /* ... more variables */
}
```

### Change Ban List
Edit [js/deck-validator.js](js/deck-validator.js):

```javascript
export const BAN_LIST = [
  'Card Name 1',
  'Card Name 2',
  // Add more...
];
```

### Add/Remove Deck Sources
Edit [js/deck-validator.js](js/deck-validator.js) to add support for other deck sites:

```javascript
export async function parseDeckFromURL(deckUrl) {
  if (deckUrl.includes('your-site.com')) {
    return parseYourSiteURL(deckUrl);
  }
  // ... existing code
}
```

### Customize UI Text
Search the HTML files for the text you want to change and modify it directly.

## Security Considerations

✅ **Safe by Default**
- Firebase credentials are safe to expose in client-side code with proper security rules
- Security rules prevent unauthorized writes to Firestore
- Admin dashboard requires Firebase authentication
- QR codes contain only the verification code (unique 8-char string)

⚠️ **Important**
- Never store sensitive data (credit cards, passwords, etc.) in submissions
- Monitor your Firestore usage to avoid unexpected charges
- Consider adding rate limiting if the service becomes popular
- Review security rules regularly

## Features Not Included (Future Enhancements)

- Email notifications on submission
- Batch deck upload
- Deck statistics/analytics
- Multiple tournament support
- Payment processing
- Custom security rules per tournament
- Deck legality checker for specific formats

## API Rate Limits

- **Scryfall**: 20 requests/second (no authentication needed)
- **Moxfield**: Generally permissive, check their terms
- **Archidekt**: Generally permissive, check their terms
- **Firebase**: Based on Firestore pricing tier

## Browser Support

- Chrome/Edge: Latest versions
- Firefox: Latest versions
- Safari: 14+
- Mobile browsers: All modern versions

## License

This project is open source and available under the MIT License.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Firebase documentation: https://firebase.google.com/docs
3. Check Scryfall API docs: https://scryfall.com/docs/api
4. Check GitHub Issues if applicable

## Credits

- **Scryfall API**: Card data and normalization
- **Moxfield & Archidekt**: Deck data sources
- **Firebase**: Database and authentication
- **QRCode.js**: QR code generation

---

**Built with ❤️ for Magic: The Gathering players and organizers**
