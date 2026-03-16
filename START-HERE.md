<!-- START HERE - Welcome to MTG Brewers Cup! -->

# 🧙 Welcome to MTG Brewers Cup - Deck Verification System

> A complete, production-ready Magic: The Gathering deck verification application

## 📚 Documentation Guide

Start here based on what you need:

### 🚀 **I want to get it running NOW**
→ Read [SETUP-SUMMARY.md](SETUP-SUMMARY.md) (5 min overview)
→ Then follow [FIREBASE-SETUP.md](FIREBASE-SETUP.md) (15 min setup)

### 🔍 **I want to understand the full system**
→ Read [README.md](README.md) (comprehensive guide with all details)

### 📝 **I want to customize or modify the app**
→ Read [QUICK-REFERENCE.md](QUICK-REFERENCE.md) (quick customization guide)

### 🎯 **I want to understand the code**
→ Check the JavaScript files - all heavily commented:
- `js/main.js` - Main page logic
- `js/deck-validator.js` - Deck parsing and validation
- `js/scryfall-api.js` - Scryfall API calls
- `js/admin.js` - Admin dashboard
- `js/firebase-config.js` - Firebase setup

---

## ⚡ Quick Start (30 minutes)

### What you need:
- ☑️ Google account (for Firebase)
- ☑️ GitHub account (for hosting)
- ☑️ 30 minutes of time

### What you'll get:
- ✅ Live deck submission system
- ✅ Public deck verification
- ✅ Admin dashboard
- ✅ Hosted at `https://yourusername.github.io/mtg-brewers-cup/`

### The 3-step process:

```
Step 1: Set up Firebase (15 min)
   ↓
Step 2: Customize settings (5 min)
   ↓
Step 3: Deploy to GitHub Pages (10 min)
   ↓
🎉 Live!
```

**→ Start with [FIREBASE-SETUP.md](FIREBASE-SETUP.md)**

---

## 📁 What You're Getting

### 🌐 Web Pages
- **index.html** - Main submission page
- **check-status.html** - Deck lookup
- **admin.html** - Admin dashboard

### ⚙️ JavaScript (all modular & well-documented)
- Scryfall API integration
- Moxfield/Archidekt URL parsing
- Deck validation against ban list
- Firebase Firestore integration
- Admin authentication

### 🎨 CSS
- Modern, responsive design
- Works on desktop, tablet, mobile
- Smooth animations

### 📚 Complete Documentation
- Setup guides (Firebase, GitHub Pages)
- Troubleshooting guide
- Customization quick links
- Code comments throughout

---

## ✨ Key Features

### For Players
✅ Submit decks via URL or text paste
✅ Auto-normalize card names (Scryfall)
✅ Check against ban list
✅ Get unique verification code
✅ Printable QR code
✅ Lookup submitted decks

### For Admins
✅ View all submissions
✅ Filter by player/status
✅ See statistics
✅ Track banned cards
✅ Secure authentication

### Technical
✅ Zero backend (pure static site)
✅ Firebase for database
✅ Fully responsive design
✅ Fast & reliable
✅ Free to host

---

## 🎓 Technology Stack

| What | Why | How |
|------|-----|-----|
| **Static HTML/CSS/JS** | GitHub Pages compatible | Files in root directory |
| **Firebase Firestore** | Scalable database | Cloud storage with auth |
| **Firebase Auth** | Secure admin access | Google/Email login |
| **Scryfall API** | Card normalization | Free public API |
| **Moxfield/Archidekt** | Deck imports | Public deck URLs |
| **QRCode.js** | QR generation | CDN library |

**Zero costs using free tiers!**

---

## 📖 File Organization

```
Your Project Root/
├── 📄 index.html                 # Main submission page
├── 📄 check-status.html          # Status lookup page  
├── 📄 admin.html                 # Admin dashboard
│
├── 🎨 css/styles.css             # All styling (responsive)
│
├── ⚙️ js/                        # JavaScript modules
│   ├── firebase-config.js        # ⚠️ UPDATE WITH YOUR CONFIG
│   ├── main.js                   # Submission page logic
│   ├── check-status.js           # Status lookup logic
│   ├── admin.js                  # Admin dashboard logic
│   ├── deck-validator.js         # Parsing & validation
│   └── scryfall-api.js           # Scryfall API calls
│
├── 📚 Documentation/
│   ├── SETUP-SUMMARY.md          # 📍 Start here
│   ├── FIREBASE-SETUP.md         # Detailed Firebase guide
│   ├── QUICK-REFERENCE.md        # Customization quick links
│   ├── README.md                 # Complete documentation
│   └── START-HERE.md             # This file
│
└── .gitignore                    # Git configuration
```

---

## 🛠️ Three Things You Need to Do

### 1️⃣ Firebase Setup
- Create a Firebase project
- Set up Firestore database
- Enable authentication
- Copy config to `js/firebase-config.js`

**→ Follow [FIREBASE-SETUP.md](FIREBASE-SETUP.md)**

### 2️⃣ Customize Ban List
- Open `js/deck-validator.js`
- Edit the `BAN_LIST` array with your banned cards

**Takes 2 minutes**

### 3️⃣ Deploy to GitHub
- Create a GitHub repository
- Push files to `main` branch
- Enable GitHub Pages

**→ Instructions in [README.md](README.md)**

---

## ❓ Common Questions

**Q: Do I need a backend server?**
A: No! This is a static site. GitHub Pages hosts it for free.

**Q: Is my API key safe to share?**
A: Yes! Firebase credentials are public. Security is handled by Firestore rules.

**Q: Can players edit/delete submissions?**
A: No! Firestore rules prevent updates and deletes. Decks are immutable.

**Q: How much will it cost?**
A: Nothing! Firebase free tier covers normal usage.

**Q: Can I customize the colors/design?**
A: Absolutely! See [QUICK-REFERENCE.md](QUICK-REFERENCE.md)

---

## 🎯 Next Steps

### Right Now:
1. Read [SETUP-SUMMARY.md](SETUP-SUMMARY.md) (5 min overview)

### In 15 minutes:
2. Follow [FIREBASE-SETUP.md](FIREBASE-SETUP.md) to set up Firebase

### In 20 minutes:
3. Push to GitHub and deploy using GitHub Pages

### Immediately:
4. Share your URL with players and admins!

---

## 💡 Pro Tips

✅ **Do this first:**
- Set up Firebase with security rules BEFORE deploying
- Test with a sample deck on localhost
- Add admins to Firebase Authentication

⚠️ **Don't do this:**
- Don't forget to enable authentication providers
- Don't skip the Firestore security rules step
- Don't share admin passwords

🎯 **Best practices:**
- Keep banned card list updated
- Monitor admin dashboard for submissions
- Back up your Firebase data periodically

---

## 🔗 Important Links

- 🎮 **Your Submission Page**: `https://your-site.github.io/mtg-brewers-cup/`
- 📋 **Check Status Page**: `https://your-site.github.io/mtg-brewers-cup/check-status.html`
- 👨‍💼 **Admin Dashboard**: `https://your-site.github.io/mtg-brewers-cup/admin.html`

---

## 📞 Need Help?

| What | Where |
|------|-------|
| **Firebase questions** | https://firebase.google.com/docs |
| **Scryfall API** | https://scryfall.com/docs/api |
| **GitHub Pages** | https://pages.github.com |
| **Code questions** | Check comments in the `.js` files |

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Can submit deck via URL (Moxfield/Archidekt)
- [ ] Can submit deck via text paste
- [ ] Banned cards are detected
- [ ] Verification code is generated
- [ ] QR code displays
- [ ] Can lookup deck by code on check-status page
- [ ] Admin can login on admin page
- [ ] Admin sees submission in dashboard

All ✅? **You're ready to launch!**

---

## 🎉 Ready?

**→ Next: Open [FIREBASE-SETUP.md](FIREBASE-SETUP.md) and start with Step 1**

---

*Built with ❤️ for Magic: The Gathering*

Questions? Check the docs above or read the code comments!
