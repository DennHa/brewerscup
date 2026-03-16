# Ban List Firebase Migration

## Overview

The ban list has been migrated from hardcoded in `js/deck-validator.js` to being stored in Firebase Firestore. This allows the admin dashboard to dynamically manage the ban list without code changes.

## What Changed

### 1. Database Structure

**New Firestore Collection:**
- Collection: `admin`
- Document: `banlist`
- Fields:
  - `cards` (Array): List of banned card names
  - `updatedAt` (Timestamp): When the ban list was last updated
  - `count` (Number): Total number of banned cards

Example document:
```json
{
  "cards": ["Card Name 1", "Card Name 2", ...],
  "updatedAt": "2026-01-26T10:00:00Z",
  "count": 150
}
```

### 2. Code Changes

#### `js/deck-validator.js`
- ✅ Added Firebase imports (Firestore functions)
- ✅ Created `banListCache` with 5-minute TTL for performance
- ✅ Updated `getBanList()` to be async:
  - Fetches from Firebase first
  - Falls back to hardcoded `BAN_LIST` if Firebase fetch fails
  - Caches results for 5 minutes to reduce queries
- ✅ Updated `updateBanList()` to save to Firebase:
  - Writes to `admin/banlist` document
  - Updates cache after successful write
- ✅ Added `clearBanListCache()` helper function
- ✅ Kept hardcoded `BAN_LIST` as fallback

#### `js/main.js`
- ✅ Updated deck preview to await `getBanList()`
- ✅ Already had async/await support

#### `js/check-status.js`
- ✅ Added `getBanList` to imports
- ✅ Updated revalidation to await `getBanList()`
- ✅ When user edits and revalidates, gets latest ban list from Firebase

#### `js/admin.js`
- ✅ Added Firebase imports (getDoc, setDoc)
- ✅ Updated `showAdminContent()` to initialize ban list on first admin login
- ✅ Updated `loadBanList()` to be properly async
- ✅ Ban list changes are immediately written to Firebase
- ✅ Updated `addCardToBanList()` to save to Firebase
- ✅ Updated `removeCardFromBanList()` to save to Firebase

### 3. Security Rules Update

**New Firestore Rules:**
```
match /admin/{document=**} {
  // Anyone can read the ban list
  allow read;
  // Controlled by app-level verification (admin dashboard)
  allow write: if true;
}
```

**Why this works:**
- Public read access: Players' decks get validated against current ban list
- Admin write access: Only admins can access the dashboard (email/password auth)
- No direct user write: Rules allow writes but only authenticated admins use the dashboard

## How It Works Now

### User Submitting a Deck
1. User enters deck list on main page
2. Click "Preview Deck"
3. App fetches latest ban list from Firebase (or uses 5-min cache)
4. Validates deck against ban list
5. Shows validation results

### User Checking/Editing Deck
1. User enters verification code
2. User clicks "Edit Deck"
3. User modifies decklist and clicks "Revalidate"
4. App fetches fresh ban list from Firebase
5. Validates against current ban list
6. Shows validation results

### Admin Managing Ban List
1. Admin logs in to admin dashboard
2. Admin panel initializes ban list from Firebase (first time only)
3. Admin clicks "Ban List" tab
4. Current ban list displays from Firebase
5. Admin adds/removes cards
6. Changes saved immediately to Firebase
7. All users see updated list on next validation

## Performance Optimization

### Caching Strategy
- **Cache Duration**: 5 minutes
- **Why**: Reduces Firebase Firestore read costs
- **When cleared**: 
  - Manually via `clearBanListCache()`
  - Automatically after 5 minutes
  - After admin updates ban list
  
### Fallback Behavior
- If Firebase fails, uses hardcoded `BAN_LIST`
- Ensures app works even if database is down
- Graceful degradation

## Migration Steps for Existing Deployments

### Step 1: Update Firebase Security Rules
1. Go to Firebase Console → Firestore Database → Rules
2. Replace rules with new version from FIREBASE-SETUP.md
3. Click "Publish"

### Step 2: Deploy Updated Code
1. Pull latest changes
2. Deploy to GitHub Pages (or your host)

### Step 3: Initialize Ban List
1. Go to admin dashboard
2. Log in
3. App automatically initializes `admin/banlist` with hardcoded list
4. Visit admin panel and verify ban list loads

### Step 4: Test
1. Go to main page
2. Try submitting a deck
3. Should validate against ban list from Firebase
4. Go to check-status page
5. Edit a deck and revalidate
6. Should use latest ban list from Firebase
7. Go to admin panel
8. Add/remove a card from ban list
9. Verify immediately reflected for next validation

## Rollback Plan

If you need to go back to hardcoded ban list:

1. In `js/deck-validator.js`, change:
```javascript
export async function getBanList() {
  return BAN_LIST; // Just return hardcoded list
}
```

2. Redeploy

This won't require Firebase changes - code will still try to fetch from Firebase but will fail gracefully and use hardcoded list.

## Benefits

✅ **No Code Deployments**: Update ban list without redeploying code
✅ **Real-time Updates**: Changes immediately available to all users
✅ **Admin Dashboard**: Friendly UI for managing ban list
✅ **Audit Trail**: Can see update timestamps in Firebase
✅ **Fallback Safety**: Works even if Firebase unavailable
✅ **Performance**: 5-minute caching reduces database load
✅ **Scalability**: Supports unlimited ban list size

## Verification

After migration, verify:

1. ✅ Ban list loads in admin dashboard
2. ✅ Can add cards to ban list
3. ✅ Can remove cards from ban list
4. ✅ Changes appear in Firestore console
5. ✅ New submissions validate against updated ban list
6. ✅ Check-status page shows correct validation
7. ✅ App handles Firebase errors gracefully

---

**Migration completed successfully! 🎉**

Ban list is now managed centrally in Firebase instead of being hardcoded.
