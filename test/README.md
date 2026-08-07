# Ban List Update Tests

This directory contains comprehensive tests for the ban list update functionality in the MTG Brewers Cup application.

## Test Files

### 1. `banlist-update.test.js` (Jest Test Suite)
A complete Jest test suite for automated testing of ban list functionality.

**To run:**
```bash
# Install Jest if not already installed
npm install --save-dev jest

# Run the test file
npm test -- test/banlist-update.test.js
```

**What it tests:**
- `getBanList()` - Fetching ban lists from Firebase or fallback
- `updateBanList()` - Updating ban lists in Firebase
- Cache behavior and TTL
- Tournament-specific ban lists
- Admin operations (add, remove, bulk add)
- Error handling and edge cases
- Real-world Pauper format scenarios

### 2. `banlist-test.html` (Browser-Based Test Suite)
An interactive HTML test suite that runs directly in the browser without needing Jest or Node.js.

**To run:**
1. Start your local dev server:
   ```bash
   python -m http.server 8000
   ```

2. Navigate to:
   ```
   http://localhost:8000/test/banlist-test.html
   ```

3. Click "Run All Tests" button to execute the full test suite

**What it tests:**
- `getBanList()` returns an array
- Ban list structure validation (all strings, non-empty)
- Cache behavior (cached calls are faster)
- `updateBanList()` function exists
- Firebase read operations
- Firebase write operations
- Adding single cards
- Adding bulk cards
- Removing cards
- Cache clearing after updates

### Special Tests

#### Ban List Sync Diagnostic
Click "Test Sync Issue" to run a diagnostic test that:
1. Fetches the current ban list
2. Adds a test card
3. Clears the cache
4. Re-fetches to verify the card was saved

This test helps identify if there's a synchronization issue where updates aren't being persisted or retrieved.

## Common Issues & Diagnostics

### Issue: "Ban list not updating"

**Diagnostic Steps:**

1. **Check Firebase Configuration**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for errors like "Cannot read property 'db'"
   - Verify `firebase-config.js` has valid credentials

2. **Run the Sync Diagnostic Test**
   - Open `banlist-test.html`
   - Click "Test Sync Issue"
   - Check the console output for exactly where it fails

3. **Check Cache TTL**
   - Ban list is cached for 5 minutes
   - Changes made in one browser tab won't show in another for up to 5 minutes
   - Use `clearBanListCache()` to force refresh

4. **Verify Firebase Permissions**
   - Check Firebase Console → Firestore → Security Rules
   - Ensure rules allow read/write to `admin/banlist` collection
   - Test rule: `allow read, write: if true;` (permissive, for testing only)

### Issue: "Test suite won't load"

1. **Firebase SDK Not Loading**
   ```
   Error: Cannot find module 'firebase-firestore'
   ```
   - Ensure you're running the dev server: `python -m http.server 8000`
   - The browser must load from `http://` not `file://`

2. **Module Imports Failing**
   - Check that `js/firebase-config.js` exists and has valid exports
   - Verify Firebase credentials are set correctly

### Issue: Tests pass but ban list still doesn't update in admin

1. **Check if cache is the problem:**
   - Hard refresh the admin page: `Cmd+Shift+R` (macOS) or `Ctrl+Shift+R` (Windows/Linux)
   - Wait 5+ minutes between updates
   - Or click button, check console for cache logs

2. **Verify Firebase is actually updated:**
   - Open Firebase Console
   - Navigate to Firestore → `admin/banlist` document
   - Manually check if cards are present

3. **Check admin.js functions:**
   - Ensure `updateBanList()` is being called correctly
   - Look for errors in `addBulkToBanList()`, `addToBanList()`, `removeFromBanList()`

## Test Output Example

### Browser Test Results
```
✅ getBanList() returns array
   Retrieved 150 cards from ban list

✅ Ban list structure (all strings, non-empty)
   All 150 cards are valid strings

✅ Ban list cache (cached call faster)
   First call: 245.32ms, Cached call: 0.45ms

✅ Firebase read operations
   Read 150 cards from Firebase

❌ Can add single card to ban list
   Card "Test Card 1234567890" not found in updated list
```

## Debug Logging

The ban list system includes extensive logging. Check the browser console for:

```
🚫 Fetching global ban list from Firebase
✅ Global ban list loaded from Firebase: 150 cards
🚫 Updating ban list to Firebase (global): 151 cards
✅ Global ban list updated successfully in Firebase
🔄 Clearing ban list cache
```

- 🚫 = Ban list operation starting
- ✅ = Success
- ⚠️  = Warning (fallback behavior)
- ❌ = Error

## Troubleshooting Checklist

- [ ] Firebase credentials are valid in `js/firebase-config.js`
- [ ] `admin/banlist` document exists in Firestore
- [ ] Firestore security rules allow write access
- [ ] Browser console has no errors (F12 → Console)
- [ ] Ran dev server with `python -m http.server 8000`
- [ ] Cleared cache and refreshed page (Cmd+Shift+R)
- [ ] Waited for async operations to complete
- [ ] Verified changes in Firebase Console directly

## Development Notes

### Ban List Functions

**In `js/deck-validator.js`:**
- `getBanList(tournamentId)` - Fetches ban list with 5-minute cache
- `updateBanList(newBanList, tournamentId)` - Updates in Firebase and clears cache
- `clearBanListCache()` - Forces cache refresh

**In `js/admin.js`:**
- `loadBanList()` - Loads and displays ban list in admin panel
- `addToBanList()` - Adds single card
- `addBulkToBanList()` - Adds multiple cards
- `removeFromBanList(cardIndex)` - Removes specific card
- `removeAllFromBanList()` - Clears entire list

### Firestore Document Structure

```javascript
{
  "admin": {
    "banlist": {
      "cards": ["Card Name 1", "Card Name 2", ...],
      "updatedAt": Timestamp,
      "count": Number
    }
  },
  "tournaments": {
    "tournament-id": {
      "banList": ["Card Name 1", ...],
      "banListUpdatedAt": Timestamp
    }
  }
}
```

## Contributing

When adding new ban list functionality:

1. Add corresponding tests to `banlist-update.test.js` (Jest)
2. Add corresponding tests to `banlist-test.html` (Browser)
3. Ensure all existing tests still pass
4. Test with actual Firebase data, not just mocks
5. Document any new edge cases in this README
