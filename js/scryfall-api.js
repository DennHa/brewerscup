/**
 * Scryfall API Module
 * 
 * Handles all API calls to Scryfall for card name normalization
 * Uses fuzzy matching to find cards regardless of language or printing
 */

const SCRYFALL_API = 'https://api.scryfall.com';

/**
 * Fetch card data from Scryfall API using fuzzy name matching
 * @param {string} cardName - The card name to lookup
 * @returns {Promise<Object>} Card data including normalized Oracle name
 */
export async function getCardFromScryfall(cardName) {
  try {
    const normalizedInput = cardName.trim();
    const response = await fetch(
      `${SCRYFALL_API}/cards/named?fuzzy=${encodeURIComponent(normalizedInput)}`
    );

    if (!response.ok) {
      console.warn(`⚠️ Scryfall: Card not found - "${cardName}" (${response.status})`);
      return {
        success: false,
        originalQuery: cardName,
        error: `Card not found (HTTP ${response.status})`
      };
    }

    const data = await response.json();
    console.log(`✅ Scryfall match: "${cardName}" → "${data.name}"`);
    
    // Extract Pauper legality
    const pauperLegal = data.legalities?.pauper === 'legal';
    const pauperStatus = data.legalities?.pauper || 'unknown';
    
    return {
      success: true,
      name: data.name,
      oracleName: data.name,
      type: data.type_line,
      colors: data.colors || [],
      manaCost: data.mana_cost || '',
      scryfallId: data.id,
      originalQuery: cardName,
      pauperLegal,
      pauperStatus
    };
  } catch (error) {
    console.error(`❌ Scryfall error for "${cardName}":`, error.message);
    return {
      success: false,
      originalQuery: cardName,
      error: error.message || 'Card not found on Scryfall'
    };
  }
}

/**
 * Batch fetch multiple cards from Scryfall
 * @param {Array<string>} cardNames - Array of card names to lookup
 * @returns {Promise<Array>} Array of card data
 */
export async function getCardsFromScryfall(cardNames) {
  const results = [];
  
  // Process cards with a small delay between requests to avoid rate limiting
  for (let i = 0; i < cardNames.length; i++) {
    const cardData = await getCardFromScryfall(cardNames[i]);
    results.push(cardData);
    
    // Add a small delay between requests (100ms)
    if (i < cardNames.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

/**
 * Test the Scryfall API connection
 * @returns {Promise<boolean>} True if API is accessible
 */
export async function testScryfallAPI() {
  try {
    const response = await fetch(`${SCRYFALL_API}/cards/named?fuzzy=Black Lotus`);
    return response.ok;
  } catch (error) {
    console.error('Scryfall API test failed:', error);
    return false;
  }
}

/**
 * Check if a card is legal in Pauper format via Scryfall
 * @param {string} cardName - The card name to check
 * @returns {Promise<Object>} Object with legality status and card info
 */
export async function isPauperLegal(cardName) {
  try {
    const normalizedInput = cardName.trim();
    const response = await fetch(
      `${SCRYFALL_API}/cards/named?fuzzy=${encodeURIComponent(normalizedInput)}`
    );

    if (!response.ok) {
      return {
        success: false,
        originalQuery: cardName,
        error: 'Card not found on Scryfall'
      };
    }

    const data = await response.json();
    const pauperStatus = data.legalities?.pauper || 'unknown';
    const isLegal = pauperStatus === 'legal';

    console.log(`🎴 Pauper Legality: "${data.name}" → ${pauperStatus.toUpperCase()}`);

    return {
      success: true,
      cardName: data.name,
      isLegal,
      status: pauperStatus,
      originalQuery: cardName,
      type: data.type_line
    };
  } catch (error) {
    console.error(`❌ Pauper legality check error for "${cardName}":`, error.message);
    return {
      success: false,
      originalQuery: cardName,
      error: error.message
    };
  }
}
