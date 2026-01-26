# MTG Brewers Cup - Deck Verification System

A web-based deck submission and verification system for Magic: The Gathering Pauper format competitive events.

![Version](https://img.shields.io/badge/version-1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-active-brightgreen)

## ✨ Features

### Player Features
- 🃏 **Submit MTG Pauper Decks** - Upload mainboard and sideboard separately
- 🔍 **Automatic Card Normalization** - Scryfall API fuzzy matching
- ✅ **Pauper Legality Check** - Validates all cards via Scryfall legality data
- 🚫 **Ban List Validation** - Against event-specific ban list
- 🎟️ **Memorable Codes** - Verification codes in format: ADJECTIVE-NOUN (e.g., STORM-DRAKE)
- 📋 **Check Deck Status** - Look up and edit submitted decks anytime
- 💾 **Browser Storage** - Saves verification codes locally with auto-copy
- 📄 **Export Decks** - Download as text file

### Admin Features
- 👥 **Player Management** - View all submissions and delete if needed
- 🚫 **Ban List Management** - Add/remove cards in real-time
- 📊 **Deck Statistics** - View deck composition, validation status, Pauper legality
- 💾 **Data Export** - Export decks as formatted text files
- 🔐 **Secure Access** - Admin-only dashboard

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Firebase project with Firestore database
- Text editor for configuration

### Setup (5 minutes)

1. **Clone the repository**
   ```bash
   git clone https://github.com/DennHa/brewerscup.git
   cd brewerscup
   ```

2. **Create Firebase configuration**
   ```bash
   cp js/firebase-config.example.js js/firebase-config.js
   cp js/admin.js.example js/admin.js
   ```

3. **Configure Firebase credentials**
   - Open [Firebase Console](https://console.firebase.google.com)
   - Create a new project or select existing
   - Get your `firebaseConfig` from Project Settings
   - Update `js/firebase-config.js` with your credentials

4. **Update admin credentials** (optional)
   - Edit `js/admin.js` with your admin email/password

5. **Run locally**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Or use any local server (VS Code Live Server, Node.js, etc.)
   ```

6. **Visit your app**
   - Main: http://localhost:8000
   - Check Status: http://localhost:8000/check-status.html
   - Admin: http://localhost:8000/admin.html

## 📖 Documentation

Detailed setup and configuration guides:

- **[SETUP.md](./SETUP.md)** - Complete setup instructions with troubleshooting
- **[FIREBASE-SETUP.md](./FIREBASE-SETUP.md)** - Firebase Firestore configuration

## 📁 Project Structure

```
brewerscup/
├── index.html                    # Main deck submission page
├── check-status.html             # Deck lookup and edit page
├── admin.html                    # Admin dashboard
├── css/
│   └── styles.css               # Complete styling (dark theme, responsive)
├── js/
│   ├── firebase-config.example.js     # Firebase configuration template
│   ├── firebase-config.js             # YOUR Firebase config (local only)
│   ├── admin.js.example               # Admin template
│   ├── admin.js                       # Admin dashboard (local only)
│   ├── main.js                        # Main page logic (692 lines)
│   ├── check-status.js                # Status lookup logic (609 lines)
│   ├── deck-validator.js              # Card parsing & validation (518 lines)
│   └── scryfall-api.js                # Scryfall API integration (145 lines)
├── SETUP.md                      # Setup guide
├── FIREBASE-SETUP.md             # Firebase configuration
├── README.md                     # This file
└── .gitignore                    # Excludes credentials
```

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3 (dark theme), ES6+ JavaScript |
| **Backend** | Firebase Firestore (cloud database) |
| **APIs** | Scryfall (card data & legality) |
| **Storage** | Firebase Firestore + Browser localStorage |
| **Deployment** | GitHub Pages (needs local Firebase config) |

## 🎯 How It Works

### Deck Submission Flow
1. Player pastes deck list in text format (or Moxfield URL)
2. App parses mainboard and sideboard
3. Card names normalized via Scryfall fuzzy matching
4. Validates against:
   - Ban list (Firestore)
   - Pauper legality (Scryfall)
5. Generates memorable verification code (ADJECTIVE-NOUN)
6. Stores in Firestore with validation results

### Deck Status Flow
1. Player enters verification code
2. App fetches deck from Firestore
3. Shows current status, validation results, and Pauper legality
4. Can edit mainboard/sideboard and revalidate
5. Code saved to browser storage automatically

### Admin Dashboard
1. Login with admin credentials
2. View all submitted decks with stats
3. Export deck as text file
4. Manage ban list in real-time
5. Delete player submissions if needed

## 🔒 Security

### What's Protected
- ✅ Admin credentials - NOT in git (.gitignore)
- ✅ Firebase config - Kept in .gitignore on GitHub
- ✅ Deck data - Only in Firestore, secured with rules

### Best Practices
- Replace credentials in `js/firebase-config.js` with your own
- Keep admin credentials secure
- Use strong passwords for admin accounts
- Security rules restrict access appropriately

### Files NOT in Git
```
js/firebase-config.js   # Your Firebase credentials
js/admin.js             # Your admin credentials
.example files are provided as templates
```

## 📊 Data Storage

### Firestore Collections

**`/decks` collection**
```javascript
{
  verificationCode: {
    playerName: "John Doe",
    mainboard: [
      {name: "Island", quantity: 4},
      {name: "Counterspell", quantity: 3}
    ],
    sideboard: [
      {name: "Tormod's Crypt", quantity: 2}
    ],
    mainboardSize: 60,
    sideboardSize: 15,
    banlistValid: true,
    pauperValid: true,
    pauperIllegalCards: [],
    submittedAt: timestamp,
    lastModified: timestamp
  }
}
```

**`/admin/banlist` document**
```javascript
{
  cards: ["Black Lotus", "Ancestral Recall"],
  lastUpdated: timestamp,
  reason: "Brewers Cup Format"
}
```

## 🌐 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (responsive design)

## 📱 Responsive Design

- Desktop: Full layout with side-by-side mainboard/sideboard
- Tablet: Stacked layout, optimized touch targets
- Mobile: Full responsive with touch-friendly inputs

## 🔄 Recent Changes

### v1.0 Features
- ✅ Deck submission with mainboard/sideboard separation
- ✅ Pauper legality validation via Scryfall API
- ✅ Ban list management (Firestore backend)
- ✅ Admin dashboard with player management
- ✅ Deck export as text files
- ✅ Browser storage for code history with auto-copy
- ✅ Mobile responsive design
- ✅ 9 production commits

## ⚙️ Configuration

### Local Development
Currently requires manual configuration:
1. Copy templates: `js/firebase-config.example.js` → `js/firebase-config.js`
2. Add your Firebase credentials
3. Optional: Edit admin credentials in `js/admin.js`

## 🐛 Troubleshooting

### Firebase Module Not Loading
```
Error: Failed to fetch firebase-config.js
```
**Solution**: Create the file from template:
```bash
cp js/firebase-config.example.js js/firebase-config.js
```
Then add your Firebase credentials.

### Cards Not Found
Card names must match Scryfall exactly. Try:
- Using Moxfield/Archidekt for card list (auto-formats names)
- Checking spelling carefully
- Including set abbreviation if ambiguous (e.g., "Island|ELD")

### Permission Denied in Console
- Check Firestore security rules are published
- Verify Firebase credentials are correct
- Test Firestore connection in DevTools

See [SETUP.md](./SETUP.md#troubleshooting) for more troubleshooting.

## 🚀 Deployment

### Local Development
```bash
python -m http.server 8000
# Or use: npx http-server, or VS Code Live Server
```

### GitHub Pages
1. Ensure you're pushing to GitHub with credentials in .gitignore
2. Enable GitHub Pages in repository Settings
3. Site will be live at: `https://your-username.github.io/brewerscup/`

**Note**: For GitHub Pages, Firebase config needs local setup. See [SETUP.md](./SETUP.md) for details.

## 📝 Deck Format

### Text Format (Supported)
```
4x Island
3x Counterspell
2x Preordain
...

Sideboard
2x Tormod's Crypt
```

### Moxfield/Archidekt URL (Supported)
Paste URL directly - app auto-extracts deck list

### Format Examples
- `4 Island` ✅
- `4x Island` ✅
- `Island x4` ✅
- `4 Island, 3 Counterspell` (comma-separated)
- `Island (ELD)` (with set) ✅
- `Card Name // Card Name` (split cards) ✅

## 🤝 Contributing

This is a competition event system. To contribute:

1. Report issues via GitHub Issues
2. Fork the repository
3. Create feature branch: `git checkout -b feature/your-feature`
4. Commit changes: `git commit -m "Add your feature"`
5. Push branch: `git push origin feature/your-feature`
6. Open Pull Request

## 📄 License

MIT License - See LICENSE file for details

## 📧 Support

For issues or questions:
- Check [SETUP.md](./SETUP.md) for setup help
- Review [FIREBASE-SETUP.md](./FIREBASE-SETUP.md) for Firebase config
- Check browser console (F12) for error messages
- Open a GitHub Issue

## 🎮 Development

### Adding New Features

1. **Add Firebase data** → Update Firestore structure in FIREBASE-SETUP.md
2. **Add UI** → Update HTML file
3. **Add Logic** → Create/update JS module
4. **Add Styling** → Update css/styles.css
5. **Test** → Run locally and verify
6. **Commit** → Push to GitHub

### Code Organization

- **main.js** - Submission page logic
- **check-status.js** - Status lookup logic
- **deck-validator.js** - Card parsing and validation
- **scryfall-api.js** - External API integration
- **admin.js** - Admin dashboard logic

## 📊 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2026 | Initial release with Pauper support |
| 0.9 | Jan 2026 | Browser storage and export features |
| 0.8 | Jan 2026 | Mainboard/sideboard separation |
| 0.7 | Jan 2026 | Pauper legality validation |
| 0.1 | Jan 2026 | Initial development |

---

**Questions?** See [SETUP.md](./SETUP.md) or [FIREBASE-SETUP.md](./FIREBASE-SETUP.md)  
**Report Issues**: [GitHub Issues](https://github.com/DennHa/brewerscup/issues)  
**Repository**: [github.com/DennHa/brewerscup](https://github.com/DennHa/brewerscup)
