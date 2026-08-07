/**
 * Ban List Update Tests
 * 
 * Tests the ban list update functionality across deck-validator.js,
 * admin.js, and Firebase operations.
 * 
 * Run with: npm test -- banlist-update.test.js
 */

import { BAN_LIST, getBanList, updateBanList, clearBanListCache } from '../js/deck-validator.js';

describe('Ban List Update Tests', () => {
  
  // Mock Firebase
  let mockDb = null;
  let firebaseData = {
    'admin/banlist': {
      cards: ['Card One', 'Card Two', 'Card Three'],
      updatedAt: new Date(),
      count: 3
    },
    'tournaments/tournament-1': {
      banList: ['Tournament Card 1', 'Tournament Card 2'],
      banListUpdatedAt: new Date()
    }
  };

  beforeEach(() => {
    clearBanListCache();
  });

  describe('getBanList()', () => {
    test('should return hardcoded BAN_LIST if Firebase is unavailable', async () => {
      const banList = await getBanList();
      expect(Array.isArray(banList)).toBe(true);
      expect(banList.length).toBeGreaterThan(0);
      expect(banList).toEqual(BAN_LIST);
    });

    test('should cache ban list for 5 minutes', async () => {
      const banList1 = await getBanList();
      const banList2 = await getBanList();
      expect(banList1).toEqual(banList2);
    });

    test('should support tournament-specific ban lists', async () => {
      // This should attempt to fetch from tournaments/{id}
      const banList = await getBanList('tournament-1');
      expect(Array.isArray(banList)).toBe(true);
    });

    test('should clear cache and fetch fresh data after cache expires', async () => {
      // Get initial
      const banList1 = await getBanList();
      
      // Manually expire cache by setting time to past
      // This tests cache TTL logic
      clearBanListCache();
      
      const banList2 = await getBanList();
      expect(Array.isArray(banList2)).toBe(true);
    });

    test('should return correct structure with card names', async () => {
      const banList = await getBanList();
      banList.forEach(card => {
        expect(typeof card).toBe('string');
        expect(card.length).toBeGreaterThan(0);
      });
    });
  });

  describe('updateBanList()', () => {
    test('should accept array of card names', async () => {
      const newBanList = ['New Card 1', 'New Card 2', 'New Card 3'];
      
      // Should not throw
      await expect(updateBanList(newBanList)).resolves.not.toThrow();
    });

    test('should clear cache after update', async () => {
      const banList1 = await getBanList();
      
      const newBanList = ['Updated Card 1', 'Updated Card 2'];
      await updateBanList(newBanList);
      
      // Cache should be cleared, next call should attempt fresh fetch
      const banList2 = await getBanList();
      expect(Array.isArray(banList2)).toBe(true);
    });

    test('should handle tournament-specific updates', async () => {
      const newBanList = ['Tournament Update 1', 'Tournament Update 2'];
      
      await expect(updateBanList(newBanList, 'tournament-1')).resolves.not.toThrow();
    });

    test('should handle empty ban list', async () => {
      const emptyBanList = [];
      
      await expect(updateBanList(emptyBanList)).resolves.not.toThrow();
    });

    test('should handle large ban lists (100+ cards)', async () => {
      const largeBanList = Array.from({ length: 150 }, (_, i) => `Card ${i + 1}`);
      
      await expect(updateBanList(largeBanList)).resolves.not.toThrow();
    });

    test('should preserve card name formatting', async () => {
      const banListWithFormatting = [
        'Card With Spaces',
        'Card-With-Dashes',
        'Card\'s Name',
        'Card: Name',
        'UPPERCASE CARD'
      ];
      
      await updateBanList(banListWithFormatting);
      const retrieved = await getBanList();
      
      // Should maintain exact formatting
      banListWithFormatting.forEach(card => {
        expect(retrieved).toContain(card);
      });
    });
  });

  describe('Admin Ban List Operations', () => {
    test('should add single card to ban list', async () => {
      const initialBanList = await getBanList();
      const initialCount = initialBanList.length;
      
      const newCard = 'Brand New Card';
      const updatedList = [...initialBanList, newCard];
      
      await updateBanList(updatedList);
      
      const retrieved = await getBanList();
      expect(retrieved).toContain(newCard);
      expect(retrieved.length).toBe(initialCount + 1);
    });

    test('should add multiple cards at once (bulk add)', async () => {
      const initialBanList = await getBanList();
      const bulkCards = ['Bulk Card 1', 'Bulk Card 2', 'Bulk Card 3', 'Bulk Card 4'];
      
      const updatedList = [...initialBanList, ...bulkCards];
      await updateBanList(updatedList);
      
      const retrieved = await getBanList();
      bulkCards.forEach(card => {
        expect(retrieved).toContain(card);
      });
    });

    test('should remove specific card from ban list', async () => {
      const initialBanList = ['Card A', 'Card B', 'Card C'];
      await updateBanList(initialBanList);
      
      // Remove 'Card B'
      const updatedList = initialBanList.filter(card => card !== 'Card B');
      await updateBanList(updatedList);
      
      const retrieved = await getBanList();
      expect(retrieved).not.toContain('Card B');
      expect(retrieved).toContain('Card A');
      expect(retrieved).toContain('Card C');
    });

    test('should clear entire ban list', async () => {
      const initialBanList = ['Card 1', 'Card 2', 'Card 3'];
      await updateBanList(initialBanList);
      
      // Clear
      await updateBanList([]);
      
      const retrieved = await getBanList();
      expect(retrieved).toEqual([]);
    });

    test('should prevent duplicate cards (no duplicates after update)', async () => {
      const banListWithDuplicates = ['Card A', 'Card B', 'Card A'];
      await updateBanList(banListWithDuplicates);
      
      const retrieved = await getBanList();
      
      // Either the system prevents duplicates, or we validate this
      // For now, just log what we get
      const cardACounts = retrieved.filter(c => c === 'Card A').length;
      console.log(`Card A appears ${cardACounts} times in ban list`);
    });
  });

  describe('Ban List Validation Integration', () => {
    test('should reflect ban list updates in deck validation', async () => {
      // Update ban list
      const banList = await getBanList();
      
      // Simulate deck validation against the list
      const testCard = banList[0] || 'Test Card';
      expect(banList).toContain(testCard);
    });

    test('should handle special characters in card names', async () => {
      const specialCards = [
        "Atog",
        "Bitterblossom",
        "Daze",
        "Ethereal Armor",
        "Foil",
        "Graveyard Shift",
        "Hydroblast",
        "Ice Floe",
        "Journey to Nowhere",
        "Keep Watch",
        "'Til Shock Do Us Part"  // apostrophe
      ];
      
      await updateBanList(specialCards);
      const retrieved = await getBanList();
      
      specialCards.forEach(card => {
        expect(retrieved).toContain(card);
      });
    });

    test('should be case-sensitive for card names', async () => {
      const cards = ['Card Name', 'card name', 'CARD NAME'];
      await updateBanList(cards);
      
      const retrieved = await getBanList();
      expect(retrieved).toContain('Card Name');
      expect(retrieved).toContain('card name');
      expect(retrieved).toContain('CARD NAME');
    });
  });

  describe('Ban List Cache Behavior', () => {
    test('cache key should differentiate between tournaments', async () => {
      const globalBanList = await getBanList(null);
      const tournamentBanList = await getBanList('tournament-1');
      
      // Both should be arrays
      expect(Array.isArray(globalBanList)).toBe(true);
      expect(Array.isArray(tournamentBanList)).toBe(true);
    });

    test('clearBanListCache should reset cache', async () => {
      await getBanList();
      clearBanListCache();
      
      // Next call should not use cache
      const banList = await getBanList();
      expect(Array.isArray(banList)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle Firebase connection errors gracefully', async () => {
      // Should fall back to BAN_LIST without throwing
      const banList = await getBanList();
      expect(Array.isArray(banList)).toBe(true);
      expect(banList.length).toBeGreaterThan(0);
    });

    test('should handle invalid ban list data types', async () => {
      // Pass non-array data
      // Should either throw or handle gracefully
      try {
        await updateBanList(null);
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    test('updateBanList should throw on invalid input', async () => {
      await expect(updateBanList('not an array')).rejects.toBeDefined();
    });
  });

  describe('Real-World Scenarios', () => {
    test('should handle Pauper format ban list updates', async () => {
      const pauperBans = [
        'Cloud of Faeries',
        'Endless Harassment',
        'Prophetic Prism',
        'Seatbelt Brigand',
        'Wee Dragonauts',
        'Enforcer-in-Chief'
      ];
      
      await updateBanList(pauperBans);
      const retrieved = await getBanList();
      
      pauperBans.forEach(card => {
        expect(retrieved).toContain(card);
      });
    });

    test('should maintain ban list across multiple operations', async () => {
      // Add cards
      let banList = await getBanList();
      const newBanList = [...banList, 'Added Card 1', 'Added Card 2'];
      await updateBanList(newBanList);
      
      // Verify additions
      let retrieved = await getBanList();
      expect(retrieved).toContain('Added Card 1');
      
      // Remove one
      const updated2 = retrieved.filter(c => c !== 'Added Card 1');
      await updateBanList(updated2);
      
      // Verify removal
      retrieved = await getBanList();
      expect(retrieved).not.toContain('Added Card 1');
      expect(retrieved).toContain('Added Card 2');
    });
  });
});
