# Ban List Whitespace & Punctuation Fix

## Issue
Cards with special characters like commas or apostrophes were not being detected as banned due to whitespace normalization issues.

**Example:**
- User submits: `Leonardo, Big Brother`
- Stored with extra space: `Leonardo,  Big Brother`
- Ban list has: `Leonardo, Big Brother`
- Comparison: `leonardo,  big brother` ❌ did NOT match `leonardo, big brother`

## Root Cause
The validation function only did `.trim().toLowerCase()` which didn't collapse multiple spaces within the string.

**Before:**
```javascript
const cardName = cardLower = banlist.map(card => card.trim().toLowerCase());
// "Leonardo,  Big Brother" → "leonardo,  big brother"
// "Leonardo, Big Brother" → "leonardo, big brother"
// ❌ These don't match!
```

## Solution
Added `.replace(/\s+/g, ' ')` to collapse multiple spaces into one:

**After:**
```javascript
const normalizeCardName = (name) => {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' '); // Collapse multiple spaces into one
};

// "Leonardo,  Big Brother" → "leonardo, big brother"
// "Leonardo, Big Brother" → "leonardo, big brother"  
// ✅ Perfect match!
```

## Files Updated
- `js/deck-validator.js` - `validateAgainstBanlist()` function (line ~492)

## What This Fixes
✅ Cards with commas (e.g., `Leonardo, Big Brother`)
✅ Cards with apostrophes (e.g., `Ashnod's Altar` - already worked)
✅ Extra whitespace in card names from any source
✅ Inconsistent spacing in revalidation checks

## Testing
To add a card to the ban list that uses this format:

1. Edit `js/deck-validator.js` line 12 (BAN_LIST array)
2. Add the exact Oracle name from Scryfall:
   ```javascript
   export const BAN_LIST = [
     'Leonardo, Big Brother',  // ← New card
     'Ashnod\'s Altar',
     // ... rest of list
   ];
   ```
3. Submit new decks - they will now properly detect these cards as banned

## Whitespace Handling
The system now normalizes:
- `"Leonardo,  Big Brother"` → `"leonardo, big brother"` ✓
- `"Ashnod's  Altar"` → `"ashnod's altar"` ✓
- `"  Card  Name  "` → `"card name"` ✓
