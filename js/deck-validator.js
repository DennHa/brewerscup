/**
 * Deck Validator Module
 * 
 * Handles deck parsing, normalization, and validation against ban list
 */

import { getCardFromScryfall } from './scryfall-api.js';
import { db } from './firebase-config.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// Ban list - update this with your cards
export const BAN_LIST = [
  // Main banned cards
  'Alms of the Vein',
  'Ancestral Mask',
  'Annoyed Altisaur',
  'Armadillo Cloak',
  'Avenging Hunter',
  'Azure Fleet Admiral',
  'Balustrade Spy',
  'Basilisk Gate',
  'Battle Screech',
  'Blight Mamba',
  'Blighted Agent',
  'Blood Fountain',
  'Bloodthrone Vampire',
  'Boarding Party',
  'Brave the Wilds',
  'Campfire',
  'Carrion Feeder',
  'Choking Sands',
  'Circle of Protection: Black',
  'Circle of Protection: Blue',
  'Circle of Protection: Green',
  'Circle of Protection: Red',
  'Circle of Protection: White',
  'Cleansing Wildfire',
  'Crimson Fleet Commodore',
  'Crypt Rats',
  'Cryptic Serpent',
  'Drannith Healer',
  'Drannith Stinger',
  'Dread Return',
  'Eagles of the North',
  'Ephemerate',
  'Ethereal Armor',
  'Eviscerator\'s Insight',
  'Exhume',
  'Experimental Synthesizer',
  'Fiery Temper',
  'Fireblast',
  'First Day of Class',
  'Freed from the Real',
  'Galvanic Alchemist',
  'Gearseeker Serpent',
  'Generous Ent',
  'Glint Hawk',
  'Glistener Elf',
  'Gnaw to the Bone',
  'Goblin Bushwhacker',
  'Goblin Tomb Raider',
  'Goliath Paladin',
  'Grab the Prize',
  'Guardian of the Guildpact',
  'Guardians\' Pledge',
  'Gurmag Angler',
  'Guttersnipe',
  'Icequake',
  'Ichor Wellspring',
  'Ichorclaw Myr',
  'Infectious Inquiry',
  'Kenku Artificer',
  'Kessig Flamebreather',
  'Kiln Fiend',
  'Kor Skyfisher',
  'Krark-Clan Shaman',
  'Lava Dart',
  'Lead the Stampede',
  'Lórien Revealed',
  'Lotleth Giant',
  'Lotus Petal',
  'Molten Rain',
  'Moment\'s Peace',
  'Moon-Circuit Hacker',
  'Mortician Beetle',
  'Murmuring Mystic',
  'Muscle Sliver',
  'Mwonvuli Acid-Moss',
  'Myr Enforcer',
  'Ninja of the Deep Hours',
  'Oliphaunt',
  'Palace Sentinels',
  'Pillage',
  'Predatory Sliver',
  'Priest of Titania',
  'Prismatic Strands',
  'Prologue to Phyresis',
  'Quirion Ranger',
  'Rally at the Hornburg',
  'Rally the Peasants',
  'Rancid Earth',
  'Rancor',
  'Reckoner\'s Bargain',
  'Refurbished Familiar',
  'Rune of Protection: Black',
  'Rune of Protection: Blue',
  'Rune of Protection: Green',
  'Rune of Protection: Red',
  'Rune of Protection: White',
  'Sleep of the Dead',
  'Sneaky Snacker',
  'Spellstutter Sprite',
  'Stinkweed Imp',
  'Stone Rain',
  'Sunscape Familiar',
  'Thermokarst',
  'Thorn of the Black Rose',
  'Thornscape Familiar',
  'Timberwatch Elf',
  'Tireless Tribe',
  'Tolarian Terror',
  'Trailblazer\'s Torch',
  'Troll of Khazad-dûm',
  'Urza\'s Tower',
  'Utopia Sprawl',
  'Weather the Storm',
  'Wellwisher',
  'Wild Growth',
  'Winding Way',
  'Writhing Chrysalis',
  // Sideboard banned cards
  'Aarakocra Sneak',
  'Adriana\'s Valor',
  'Aerialephant',
  'All That Glitters',
  'Arcum\'s Astrolabe',
  'Assemble the Rank and Vile',
  'Atog',
  'Basking Broodscale',
  'Bonder\'s Ornament',
  'Brago\'s Favor',
  'Carnival Carnivore',
  'Chatterstorm',
  'Chicken Troupe',
  'Cloud of Faeries',
  'Cloudpost',
  'Coming Attraction',
  'Command Performance',
  'Cranial Plating',
  'Cranial Ram',
  'Daze',
  'Deadbeat Attendant',
  'Deadly Dispute',
  'Disciple of the Vault',
  'Draconian Gate-Bot',
  'Empty the Warrens',
  'Fall from Favor',
  'Finishing Move',
  'Frantic Search',
  'Galvanic Relay',
  'Gitaxian Probe',
  'Glitterflitter',
  'Grapeshot',
  'Gush',
  'High Tide',
  'Hired Heist',
  'Hymn to Tourach',
  'Immediate Action',
  'Incendiary Dissent',
  'Invigorate',
  'Kuldotha Rebirth',
  'Line Cutter',
  'Minotaur de Force',
  'Monastery Swiftspear',
  'Muzzio\'s Preparations',
  'Mystic Sanctuary',
  'Natural Unity',
  'Peregrine Drake',
  'Petting Zookeeper',
  'Pradesh Gypsies',
  'Prize Wall',
  'Rad Rascal',
  'Ride Guide',
  'Robo-Piñata',
  'Seasoned Buttoneer',
  'Secrets of Paradise',
  'Sentinel Dispatch',
  'Sinkhole',
  'Sojourner\'s Companion',
  'Soul Swindler',
  'Step Right Up',
  'Stiltstrider',
  'Stirring Bard',
  'Stone-Throwing Devils',
  'Temporal Fissure',
  'Ticketomaton',
  'Treasure Cruise',
  'Underdark Explorer',
  'Vicious Battlerager'
];

/**
 * Parse deck from text format
 * Supports formats like: "4x Card Name" or "4 Card Name"
 * @param {string} deckText - Raw deck list text
 * @returns {Array} Array of {quantity, name}
 */
export function parseDecklistText(deckText) {
  console.log('🔍 Parsing deck text...');
  const lines = deckText.split('\n').filter(line => line.trim());
  const deck = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//')) continue;

    // Match patterns like "4x Card Name" or "4 Card Name"
    const match = trimmed.match(/^(\d+)x?\s+(.+)$/) || trimmed.match(/^(\d+)\s+(.+)$/);
    
    if (match) {
      const quantity = parseInt(match[1], 10);
      const cardName = match[2].trim();
      
      // Skip category labels
      const labels = ['LANDS', 'CREATURES', 'INSTANTS', 'SORCERIES', 'ARTIFACTS', 'ENCHANTMENTS', 'PLANESWALKERS', 'SIDEBOARD'];
      if (!labels.includes(cardName.toUpperCase())) {
        deck.push({
          quantity,
          name: cardName
        });
      }
    }
  }

  return deck;
}

/**
 * Extract deck data from Archidekt URL
 * @param {string} url - Archidekt URL
 * @returns {Promise<Object>} Deck data
 */
export async function parseArchidektURL(url) {
  try {
    // Extract deck ID from Archidekt URL
    const match = url.match(/archidekt\.com\/decks\/(\d+)/);
    if (!match) {
      throw new Error('Invalid Archidekt URL format');
    }

    const deckId = match[1];
    const apiUrl = `https://archidekt.com/api/decks/${deckId}/`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch deck from Archidekt');
    }

    const data = await response.json();
    const deck = [];

    // Parse cards from Archidekt format
    if (data.cards) {
      for (const card of data.cards) {
        if (card.card && card.card.name) {
          deck.push({
            quantity: card.quantity,
            name: card.card.name
          });
        }
      }
    }

    return {
      success: true,
      deck,
      source: 'archidekt'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch Archidekt deck'
    };
  }
}

/**
 * Parse deck from URL (Archidekt only)
 * @param {string} deckUrl - URL to the deck
 * @returns {Promise<Object>} Parsed deck data
 */
export async function parseDeckFromURL(deckUrl) {
  if (deckUrl.includes('archidekt.com')) {
    return parseArchidektURL(deckUrl);
  } else {
    return {
      success: false,
      error: 'Only Archidekt URLs are supported. You can also paste a deck list directly.'
    };
  }
}

/**
 * Normalize all card names in a deck using Scryfall API
 * Processes cards in parallel batches for speed
 * @param {Array} deck - Deck array with card objects
 * @param {Function} onProgress - Callback function(current, total, cardName)
 * @returns {Promise<Array>} Deck with normalized names
 */
export async function normalizeDeckNames(deck, onProgress = null) {
  console.log(`📍 Normalizing ${deck.length} cards with Scryfall API...`);
  const normalizedDeck = [];
  let successCount = 0;
  let failureCount = 0;

  // Process cards in parallel batches (5 at a time to avoid rate limits)
  const batchSize = 5;
  for (let i = 0; i < deck.length; i += batchSize) {
    const batch = deck.slice(i, i + batchSize);
    
    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(async (card) => {
        const cardData = await getCardFromScryfall(card.name);
        
        // Update progress
        const progressIndex = i + batch.indexOf(card) + 1;
        if (onProgress) {
          onProgress(progressIndex, deck.length, card.name);
        }
        
        if (cardData.success) {
          successCount++;
        } else {
          failureCount++;
        }
        
        return {
          quantity: card.quantity,
          originalName: card.name,
          normalizedName: cardData.success ? cardData.oracleName : null,
          scryfallId: cardData.scryfallId || null,
          error: cardData.error || null
        };
      })
    );
    
    normalizedDeck.push(...batchResults);
  }

  console.log(`✅ Scryfall normalization complete: ${successCount} found, ${failureCount} not found`);
  return normalizedDeck;
}

// Cache for ban list to avoid repeated Firebase calls
let banListCache = null;
let banListCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get current ban list from Firebase or fallback to hardcoded list
 * @returns {Promise<Array>} Array of banned card names
 */
export async function getBanList() {
  // Return cached version if still valid
  if (banListCache && Date.now() - banListCacheTime < CACHE_DURATION) {
    console.log('🚫 Using cached ban list');
    return banListCache;
  }

  try {
    console.log('🚫 Fetching ban list from Firebase');
    const banListDoc = await getDoc(doc(db, 'admin', 'banlist'));
    
    if (banListDoc.exists()) {
      const data = banListDoc.data();
      banListCache = data.cards || BAN_LIST;
      banListCacheTime = Date.now();
      console.log('✅ Ban list loaded from Firebase:', banListCache.length, 'cards');
      return banListCache;
    } else {
      console.warn('⚠️ Ban list not found in Firebase, using hardcoded list');
      banListCache = BAN_LIST;
      banListCacheTime = Date.now();
      return banListCache;
    }
  } catch (error) {
    console.error('❌ Error fetching ban list from Firebase:', error);
    console.warn('⚠️ Falling back to hardcoded ban list');
    banListCache = BAN_LIST;
    return banListCache;
  }
}

/**
 * Update the ban list in Firebase
 * @param {Array} newBanList - New list of banned cards
 * @returns {Promise<void>}
 */
export async function updateBanList(newBanList) {
  console.log('🚫 Updating ban list to Firebase:', newBanList.length, 'cards');
  
  try {
    await setDoc(doc(db, 'admin', 'banlist'), {
      cards: newBanList,
      updatedAt: new Date(),
      count: newBanList.length
    });
    
    // Update cache
    banListCache = newBanList;
    banListCacheTime = Date.now();
    
    console.log('✅ Ban list updated successfully in Firebase');
  } catch (error) {
    console.error('❌ Error updating ban list in Firebase:', error);
    throw error;
  }
}

/**
 * Clear ban list cache (useful after updates)
 */
export function clearBanListCache() {
  console.log('🔄 Clearing ban list cache');
  banListCache = null;
  banListCacheTime = 0;
}

/**
 * Check if any cards in the deck are on the ban list
 * @param {Array} deck - Normalized deck array
 * @param {Array} banlist - Array of banned card names
 * @returns {Object} Validation result with banned cards info
 */
export function validateAgainstBanlist(deck, banlist = BAN_LIST) {
  const bannedInDeck = [];
  const banlistLower = banlist.map(card => card.toLowerCase());

  for (const card of deck) {
    const cardNameToCheck = (card.normalizedName || card.originalName).toLowerCase();
    if (banlistLower.includes(cardNameToCheck)) {
      bannedInDeck.push({
        name: card.normalizedName || card.originalName,
        quantity: card.quantity,
        originalName: card.originalName
      });
    }
  }

  return {
    valid: bannedInDeck.length === 0,
    bannedCards: bannedInDeck,
    totalBannedQuantity: bannedInDeck.reduce((sum, card) => sum + card.quantity, 0)
  };
}

/**
 * Calculate total deck size
 * @param {Array} deck - Deck array
 * @returns {number} Total number of cards
 */
export function calculateDeckSize(deck) {
  return deck.reduce((total, card) => total + card.quantity, 0);
}
