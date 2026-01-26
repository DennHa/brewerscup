// Main Application Logic for Deck Submission
// 
// Handles the main index.html page for deck submission

import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import {
  parseDecklistText,
  parseDeckFromURL,
  normalizeDeckNames,
  validateAgainstBanlist,
  calculateDeckSize,
  getBanList
} from './deck-validator.js';

// State management
let currentInputType = 'text';
let currentDeck = null;
let currentValidation = null;

/**
 * Show progress overlay
 */
function showProgressOverlay(total) {
  document.getElementById('progress-overlay').classList.remove('hidden');
  document.getElementById('progress-total').textContent = total;
  document.getElementById('progress-count').textContent = '0';
  updateProgressBar(0, total);
}

/**
 * Hide progress overlay
 */
function hideProgressOverlay() {
  document.getElementById('progress-overlay').classList.add('hidden');
}

/**
 * Update progress bar and text
 */
function updateProgressBar(current, total, currentCard = '') {
  const percentage = (current / total) * 100;
  document.getElementById('progress-bar').style.width = percentage + '%';
  document.getElementById('progress-count').textContent = current;
  if (currentCard) {
    document.getElementById('progress-current-card').textContent = `🔍 Checking: "${currentCard}"`;
  }
}

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOMContentLoaded - setting up event listeners');
  
  // Preview button
  const previewBtn = document.getElementById('preview-btn');
  if (previewBtn) {
    previewBtn.addEventListener('click', () => {
      console.log('🖱️ Preview button clicked');
      previewDeck();
    });
  }
  
  // Submit button
  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      console.log('🖱️ Submit button clicked');
      submitDeck();
    });
  }
  
  // Close preview button
  const closePreviewBtn = document.getElementById('close-preview-btn');
  if (closePreviewBtn) {
    closePreviewBtn.addEventListener('click', () => {
      console.log('🖱️ Close preview button clicked');
      closePrevew();
    });
  }
  
  // Copy code button
  const copyCodeBtn = document.getElementById('copy-code-btn');
  if (copyCodeBtn) {
    copyCodeBtn.addEventListener('click', () => {
      console.log('🖱️ Copy code button clicked');
      copyCodToClipboard();
    });
  }
  
  // Reset form button
  const resetFormBtn = document.getElementById('reset-form-btn');
  if (resetFormBtn) {
    resetFormBtn.addEventListener('click', () => {
      console.log('🖱️ Reset form button clicked');
      resetForm();
    });
  }
});

/**
 * Preview the deck without saving
 */
window.previewDeck = async function() {
  try {
    showLoading(true);
    hideError();
    console.log('🎯 Starting deck preview...');

    const { deck, errors } = await getDeckInput();
    if (!deck) {
      console.log('❌ No deck input provided');
      hideProgressOverlay();
      showLoading(false);
      return;
    }
    
    console.log(`📊 Parsed ${deck.length} unique cards from input`);

    // Show progress overlay
    showProgressOverlay(deck.length);

    // Normalize card names with progress tracking
    console.log('🔍 Normalizing card names with Scryfall...');
    const normalizedDeck = await normalizeDeckNames(deck, (current, total, cardName) => {
      updateProgressBar(current, total, cardName);
    });
    
    hideProgressOverlay();
    console.log('✅ Card normalization complete', normalizedDeck);

    // Check for unfound cards
    const unfoundCards = normalizedDeck.filter(card => card.error);
    if (unfoundCards.length > 0) {
      showError('Some cards could not be found on Scryfall:');
      console.log('⚠️ Unfound cards:', unfoundCards);
      const unfoundDiv = document.getElementById('preview-unfound');
      unfoundDiv.innerHTML = '<h4>❌ Cards Not Found:</h4>' + 
        unfoundCards.map(card => 
          `<div class="unfound-item">${card.originalName} - ${card.error}</div>`
        ).join('');
      unfoundDiv.classList.remove('hidden');
      showLoading(false);
      return;
    }

    // Validate against ban list
    const banList = await getBanList();
    const validation = validateAgainstBanlist(normalizedDeck, banList);
    const deckSize = calculateDeckSize(normalizedDeck);
    
    console.log(`✅ Deck valid: ${validation.valid}, Size: ${deckSize} cards`);
    if (!validation.valid) {
      console.log('🚫 Banned cards found:', validation.bannedCards);
    }

    // Store for later use
    currentDeck = normalizedDeck;
    currentValidation = validation;

    // Display preview
    displayPreview(normalizedDeck, validation, deckSize);
    showLoading(false);
    
  } catch (error) {
    console.error('Error previewing deck:', error);
    showError('Error processing deck: ' + error.message);
    showLoading(false);
  }
};

/**
 * Submit the deck to Firebase
 */
window.submitDeck = async function() {
  try {
    console.log('🚀 ========== DECK SUBMISSION STARTED ==========');
    console.log('Timestamp:', new Date().toISOString());

    const playerName = document.getElementById('playerName').value.trim();
    const playerEmail = document.getElementById('playerEmail').value.trim();
    console.log(`👤 Player Name: "${playerName}"`);
    console.log(`📧 Player Email: "${playerEmail}"`);

    if (!playerName) {
      console.error('❌ Player name is missing!');
      showError('Player name is required');
      return;
    }

    // If we haven't previewed, do it now
    if (!currentDeck) {
      console.log('⏳ No deck previewed yet, running preview...');
      await previewDeck();
      if (!currentDeck) {
        console.error('❌ Preview failed, aborting submission');
        return; // Preview failed
      }
    }

    console.log(`📋 Deck has ${currentDeck.length} cards`);
    console.log(`✅ Deck valid: ${currentValidation.valid}`);

    showLoading(true);
    hideError();

    // Generate verification code
    const verificationCode = generateVerificationCode();
    console.log(`🔐 Generated verification code: ${verificationCode}`);

    // Prepare deck data for Firestore
    const deckData = {
      playerName,
      email: playerEmail || null,
      decklist: currentDeck.map(card => ({
        name: card.normalizedName || card.originalName,
        originalName: card.originalName,
        quantity: card.quantity,
        scryfallId: card.scryfallId
      })),
      deckSize: calculateDeckSize(currentDeck),
      verificationCode,
      isValid: currentValidation.valid,
      bannedCards: currentValidation.bannedCards,
      status: currentValidation.valid ? 'approved' : 'banned',
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    };

    // Save to Firestore
    console.log('💾 Attempting to save to Firestore...');
    console.log('Collection: "decks"');
    console.log('Data to save:', deckData);

    const docRef = await addDoc(collection(db, 'decks'), deckData);
    console.log('✅ DECK SAVED SUCCESSFULLY!');
    console.log('Document ID:', docRef.id);
    console.log('🎉 ========== SUBMISSION COMPLETE ==========');

    showLoading(false);

    // Show success page
    showSuccessPage(verificationCode, deckData);

  } catch (error) {
    console.error('❌ ========== SUBMISSION FAILED ==========');
    console.error('Error submitting deck:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error object:', error);
    showError('Error submitting deck: ' + error.message);
    showLoading(false);
  }
};

/**
 * Get deck input from text area
 * @returns {Promise<Object>} Deck and any errors
 */
async function getDeckInput() {
  const deckText = document.getElementById('deckText').value.trim();
  if (!deckText) {
    showError('Please paste a deck list');
    return { deck: null };
  }

  const deck = parseDecklistText(deckText);
  if (deck.length === 0) {
    showError('Could not parse any cards from the deck list');
    return { deck: null };
  }
  return { deck };
}

/**
 * Display the deck preview
 */
function displayPreview(deck, validation, deckSize) {
  const previewSection = document.getElementById('preview-section');
  
  // Show stats
  const statsHtml = `
    <div class="stat-item">
      <span class="stat-label">Total Cards:</span>
      <span class="stat-value">${deckSize}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Unique Cards:</span>
      <span class="stat-value">${deck.length}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Status:</span>
      <span class="stat-value ${validation.valid ? 'valid' : 'invalid'}">
        ${validation.valid ? '✓ Valid' : '✗ Invalid (Banned Cards)'}
      </span>
    </div>
  `;
  document.getElementById('preview-stats').innerHTML = statsHtml;

  // Show deck list
  const deckListHtml = deck.map(card => `
    <div class="deck-card">
      <span class="card-quantity">${card.quantity}x</span>
      <span class="card-name">${card.normalizedName || card.originalName}</span>
    </div>
  `).join('');
  document.getElementById('preview-deck').innerHTML = '<h4>Decklist:</h4>' + deckListHtml;

  // Show warnings if banned cards
  if (!validation.valid) {
    const warningsHtml = `
      <div class="warning-header">⚠️ Banned Cards Found:</div>
      ${validation.bannedCards.map(card => `
        <div class="warning-item">
          ${card.quantity}x ${card.name}
        </div>
      `).join('')}
    `;
    document.getElementById('preview-warnings').innerHTML = warningsHtml;
    document.getElementById('preview-warnings').classList.remove('hidden');
  } else {
    document.getElementById('preview-warnings').classList.add('hidden');
  }

  previewSection.classList.remove('hidden');
}

/**
 * Show success page
 */
function showSuccessPage(verificationCode, deckData) {
  // Hide form and show success
  document.querySelector('.form-container').classList.add('hidden');
  document.getElementById('preview-section').classList.add('hidden');
  
  const successSection = document.getElementById('success-section');
  
  // Display verification code
  document.getElementById('codeDisplay').textContent = verificationCode;

  // Display deck info
  const deckInfo = `
    <h4>Deck Submitted</h4>
    <div class="info-row">
      <span>Player:</span>
      <span>${deckData.playerName}</span>
    </div>
    <div class="info-row">
      <span>Deck Size:</span>
      <span>${deckData.deckSize} cards</span>
    </div>
    <div class="info-row">
      <span>Status:</span>
      <span class="${deckData.isValid ? 'valid' : 'invalid'}">
        ${deckData.isValid ? '✓ Valid' : '✗ Invalid (Banned Cards)'}
      </span>
    </div>
    ${!deckData.isValid ? `
      <div class="info-row banned">
        <span>Banned Cards:</span>
        <span>${deckData.bannedCards.map(c => `${c.quantity}x ${c.name}`).join(', ')}</span>
      </div>
    ` : ''}
  `;
  document.getElementById('success-deck-info').innerHTML = deckInfo;

  successSection.classList.remove('hidden');
  
  // Scroll to top to see success message
  window.scrollTo(0, 0);
}

/**
 * Generate a unique verification code
 */
function generateVerificationCode() {
  // Pauper-themed words for memorable codes
  const adjectives = [
    'SWIFT', 'BOLD', 'DARK', 'STORM', 'WILD', 'KEEN', 'WISE', 'STRONG',
    'BLUE', 'RED', 'GREEN', 'BLACK', 'WHITE', 'TEMPO', 'COMBO', 'CONTROL',
    'QUICK', 'SHARP', 'BRIGHT', 'FIERCE', 'NOBLE', 'CUNNING'
  ];
  
  const nouns = [
    'BOLT', 'DRAKE', 'GOBLIN', 'SPIDER', 'KNIGHT', 'WIZARD', 'SAGE',
    'TOWER', 'FLAME', 'STORM', 'WAVE', 'WOLF', 'RAVEN', 'DRAGON',
    'PHOENIX', 'GRIFFIN', 'BEAST', 'SPIRIT', 'SHADOW', 'LIGHT', 'MAGE'
  ];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adjective}-${noun}`;
}

/**
 * Copy verification code to clipboard
 */
window.copyCodToClipboard = function() {
  const code = document.getElementById('codeDisplay').textContent;
  navigator.clipboard.writeText(code).then(() => {
    alert('Verification code copied to clipboard!');
  }).catch(err => {
    console.error('Error copying to clipboard:', err);
  });
};

/**
 * Download deck list as text
 */
window.downloadDeckList = function() {
  if (!currentDeck) return;

  const deckText = currentDeck
    .map(card => `${card.quantity}x ${card.normalizedName || card.originalName}`)
    .join('\n');

  const blob = new Blob([deckText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'mtg-deck.txt';
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Reset form to initial state
 */
window.resetForm = function() {
  document.getElementById('playerName').value = '';
  document.getElementById('playerEmail').value = '';
  document.getElementById('deckText').value = '';
  
  currentDeck = null;
  currentValidation = null;
  
  document.querySelector('.form-container').classList.remove('hidden');
  document.getElementById('success-section').classList.add('hidden');
  document.getElementById('preview-section').classList.add('hidden');
  hideError();
};

/**
 * Close preview
 */
window.closePrevew = function() {
  document.getElementById('preview-section').classList.add('hidden');
};

/**
 * Show loading spinner
 */
function showLoading(show) {
  document.getElementById('loading').classList.toggle('hidden', !show);
  const previewBtn = document.getElementById('preview-btn');
  const submitBtn = document.getElementById('submit-btn');
  if (previewBtn) previewBtn.disabled = show;
  if (submitBtn) submitBtn.disabled = show;
}

/**
 * Show error message
 */
function showError(message) {
  const errorDiv = document.getElementById('error-message');
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');
  window.scrollTo(0, 0);
}

/**
 * Hide error message
 */
function hideError() {
  document.getElementById('error-message').classList.add('hidden');
}
