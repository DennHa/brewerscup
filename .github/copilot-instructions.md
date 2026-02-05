# MTG Brewers Cup - Copilot Instructions

## Project Overview

**MTG Brewers Cup** is a Magic: The Gathering deck submission and verification system for Pauper format competitive events. It's a **vanilla JavaScript + Firebase** web application with three main pages:
- **index.html**: Player deck submission interface
- **check-status.html**: Deck lookup by verification code  
- **admin.html**: Admin dashboard for managing submissions and ban list

Key mission: Validate submitted Pauper decks against **Scryfall legality data** + **custom ban list**, generate memorable verification codes (ADJECTIVE-NOUN format), and provide both players and admins real-time deck tracking.

---

## Architecture & Data Flow

### Core Services (Modular JS)

**Three import-based modules handle all non-UI logic:**

1. **`js/scryfall-api.js`** — Card name normalization via Scryfall's fuzzy API
   - Uses `getCardFromScryfall()` → returns normalized `name`, `type`, `colors`, `pauperLegal` status
   - Called by deck-validator for every card in a submitted deck
   - Returns `{success, name, pauperLegal, pauperStatus, error}` structure

2. **`js/deck-validator.js`** — Deck parsing & multi-stage validation
   - Parses three input formats: plaintext lists, Moxfield URLs, Archidekt URLs
   - `parseDecklistText()` → returns `{mainboard: [], sideboard: []}`
   - `normalizeDeckNames()` → fetches Scryfall data for all cards (async batching)
   - `validateAgainstBanlist()` + `validatePauperLegality()` → return validation objects with error lists
   - Exports `BAN_LIST` constant (array of card name strings) — **update here to change banned cards**

3. **`js/firebase-config.js`** — Firebase initialization (ES module pattern)
   - NOT committed to git; copy from `firebase-config.example.js` and insert real credentials
   - Must export `db` (Firestore instance) for use in main.js, check-status.js, admin.js

### Firestore Structure

```
/decks/{verificationCode}
  ├─ playerName: string
  ├─ playerEmail: string (optional)
  ├─ mainboard: [{name, quantity}, ...]
  ├─ sideboard: [{name, quantity}, ...]
  ├─ mainboardSize: number
  ├─ sideboardSize: number
  ├─ banlistValid: boolean
  ├─ pauperValid: boolean
  ├─ pauperIllegalCards: [string, ...]
  ├─ submittedAt: timestamp
  └─ lastModified: timestamp

/admin/banlist
  └─ cards: [card name strings, ...]
```

---

## Critical Developer Workflows

### Local Development Server
```bash
# Python 3 (macOS/Linux built-in)
python -m http.server 8000
# Visit http://localhost:8000
```

### Firebase Configuration (Required First Step)
1. Copy examples: `cp js/firebase-config.example.js js/firebase-config.js && cp js/admin.js.example js/admin.js`
2. Create Firebase project via [console.firebase.google.com](https://console.firebase.google.com)
3. Get web config from Firebase Console → Settings → Project Settings → Your apps → Copy firebaseConfig object
4. Paste credentials into `js/firebase-config.js`
5. Set admin email/password in `js/admin.js` and create matching Firebase Auth user

### Testing Deck Submission Flow
1. Navigate to index.html and submit a test deck (copy a Pauper list from format resources)
2. Check Firestore `/decks/{generatedCode}` document in Firebase Console to verify storage
3. Use check-status.html with the generated code to verify read-back works
4. Admin panel shows all submissions; verify Firebase Auth login required

### Updating the Ban List
- Edit `js/deck-validator.js` line ~12, the `export const BAN_LIST = [...]` array
- Each line is a card name (exact Oracle name from Scryfall)
- Changes apply immediately to new submissions; old decks retain their validation status

---

## Project-Specific Patterns & Conventions

### Naming: Verification Codes (ADJECTIVE-NOUN)
- Generated via `generateVerificationCode()` in **main.js**
- Uses word lists: `ADJECTIVES` and `NOUNS` arrays defined inline in function
- Example: `VIOLENT-DRAKE`, `SILENT-ECHO` — must be memorable, URL-safe
- Stored as Firestore document ID; used for lookups on check-status.html

### Card Normalization Pattern
**All user input card names flow through Scryfall:**
1. User types "Dark Ritual" (or typo: "Dark Ritual")  
2. `parseDecklistText()` creates `{name: "Dark Ritual", quantity: 4}`
3. `normalizeDeckNames()` calls `getCardFromScryfall()` → returns `{name: "Dark Ritual", pauperLegal: true}`
4. Validates against ban list and Pauper legality in separate passes
5. Final deck stored with **normalized** card names

### Progress Overlay Pattern (main.js)
- Shows real-time normalization progress during submission ("Processing 0 of 60 cards")
- Uses `showProgressOverlay(total)` → updates via `updateProgressBar(current, total)` → `hideProgressOverlay()`
- Critical UX for large decks; prevents user confusion during async Scryfall API calls

### HTML Element State Management
State persists in module-level variables, not DOM:
```javascript
let currentDeck = null;        // Full deck object after validation
let currentMainboard = [];     // Parsed cards
let currentValidation = null;  // Validation result {banlistIllegal, pauperIllegal, etc.}
```

### Import Statement Structure
All files use **ES6 module imports** (not CDN scripts):
```javascript
import { db } from './firebase-config.js';
import { collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
```
- Local imports use relative paths (`.js` extension required)
- Firebase SDK imports use absolute CDN URLs with pinned version `10.7.0`
- Never change Firebase SDK version without testing Auth + Firestore reads/writes

### Security Pattern
- `index.html` + `check-status.html` allow **public deck submission & read** (no auth)
- `admin.html` requires Firebase Email/Password authentication
- Firestore rules in FIREBASE-SETUP.md use permissive rules (public read/write) — suitable for event context where ban list is trusted

---

## Integration Points & External Dependencies

### Scryfall API
- **Endpoint**: `https://api.scryfall.com/cards/named?fuzzy={cardName}`
- **Rate limiting**: Not enforced in code (respect 10 req/sec soft limit)
- **Fallback behavior**: If card not found, returns `{success: false, error}` — deck submission shows warning, user can edit
- **No authentication required**

### Firebase (v10.7.0)
- **Auth**: Email/Password scheme for admin login
- **Firestore**: NoSQL document database for decks & ban list
- **Requires active project** with Firestore enabled + Security Rules applied
- Credentials in `firebase-config.js` are public (intentionally; web apps expose credentials)

### External Libraries
- **None.** No npm, no build step. Pure vanilla JS + Firebase Web SDK.
- CSS is hand-written in `css/styles.css` (responsive grid-based layout)
- This keeps deployment friction minimal (just host static files)

---

## Key Files for Specific Tasks

| Task | Primary File | Secondary Files |
|------|---|---|
| Fix card normalization issues | `js/scryfall-api.js` | `js/deck-validator.js` |
| Change validation rules | `js/deck-validator.js` (BAN_LIST or validation functions) | - |
| Update admin dashboard UX | `admin.html` + `js/admin.js` | `css/styles.css` |
| Debug submission flow | `js/main.js` (handleSubmit → database write) | `js/deck-validator.js`, Firestore |
| Modify verification code format | `js/main.js` (generateVerificationCode) | - |
| Add new page | Create `newpage.html` + `js/newpage.js` (import `db` from firebase-config.js) | - |

---

## Common Gotchas & Debugging Tips

1. **Firebase credentials missing** → App silently fails. Check browser console for "Cannot read property 'db'" errors.
2. **Scryfall API timeout** → Progress overlay hangs. Check Network tab in DevTools; Scryfall is down or rate-limited.
3. **Deck stored but check-status.html shows "not found"** → Verification code was mistyped; query is case-sensitive and exact-match only.
4. **Admin login loop** → Auth user doesn't exist in Firebase; create matching email/password in Auth section of Firebase Console.
5. **Ban list changes not applying** → Old code cached in browser. Hard refresh (Cmd+Shift+R) or clear localStorage.

---

## Documentation Map

- **[START-HERE.md](../START-HERE.md)** — Best entry point; links to all guides
- **[QUICK-REFERENCE.md](../QUICK-REFERENCE.md)** — File structure overview
- **[FIREBASE-SETUP.md](../FIREBASE-SETUP.md)** — Step-by-step Firebase configuration
- **[README.md](../README.md)** — Full feature list & user guide
- **Code comments** — All JS files are heavily commented; read them for implementation details
