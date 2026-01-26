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
  validatePauperLegality,
  calculateDeckSize,
  getBanList
} from './deck-validator.js';

// State management
let currentInputType = 'text';
let currentDeck = null;
let currentMainboard = null;
let currentSideboard = null;
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
  
  // View saved codes button
  const viewSavedCodesBtn = document.getElementById('view-saved-codes-btn');
  if (viewSavedCodesBtn) {
    viewSavedCodesBtn.addEventListener('click', () => {
      console.log('🖱️ View saved codes button clicked');
      showSavedCodes();
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

    const { deck, mainboard, sideboard, errors } = await getDeckInput();
    if (!deck) {
      console.log('❌ No deck input provided');
      hideProgressOverlay();
      showLoading(false);
      return;
    }
    
    console.log(`📊 Parsed ${mainboard.length} mainboard, ${sideboard.length} sideboard cards`);

    // Show progress overlay
    showProgressOverlay(deck.length);

    // Normalize card names with progress tracking
    console.log('🔍 Normalizing card names with Scryfall...');
    const normalizedMainboard = await normalizeDeckNames(mainboard, (current, total, cardName) => {
      updateProgressBar(current, total, cardName);
    });
    
    // Also normalize sideboard cards
    const normalizedSideboard = sideboard.length > 0 
      ? await normalizeDeckNames(sideboard, (current, total, cardName) => {
          updateProgressBar(mainboard.length + current, mainboard.length + sideboard.length, cardName);
        })
      : [];
    
    hideProgressOverlay();
    console.log('✅ Card normalization complete');

    // Combine for validation (validate mainboard)
    const normalizedDeck = normalizedMainboard;
    
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
    
    // Check Pauper legality
    console.log('🎴 Checking Pauper legality...');
    const pauperValidation = await validatePauperLegality(normalizedDeck);
    
    const deckSize = calculateDeckSize(normalizedDeck);
    
    console.log(`✅ Deck valid: ${validation.valid}, Size: ${deckSize} cards`);
    if (!validation.valid) {
      console.log('🚫 Banned cards found:', validation.bannedCards);
    }
    if (!pauperValidation.valid) {
      console.log('⚠️ Pauper illegal cards found:', pauperValidation.illegalCards);
    }

    // Combine validations
    const combinedValidation = {
      banListValid: validation.valid,
      pauperValid: pauperValidation.valid,
      overallValid: validation.valid && pauperValidation.valid,
      bannedCards: validation.bannedCards,
      illegalCards: pauperValidation.illegalCards
    };

    // Store for later use
    currentDeck = normalizedDeck;
    currentMainboard = normalizedMainboard;
    currentSideboard = normalizedSideboard;
    currentValidation = combinedValidation;

    // Display preview
    displayPreview(normalizedDeck, combinedValidation, deckSize, normalizedSideboard.length, normalizedSideboard);
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
      mainboard: currentMainboard.map(card => ({
        name: card.normalizedName || card.originalName,
        originalName: card.originalName,
        quantity: card.quantity,
        scryfallId: card.scryfallId
      })),
      sideboard: currentSideboard.map(card => ({
        name: card.normalizedName || card.originalName,
        originalName: card.originalName,
        quantity: card.quantity,
        scryfallId: card.scryfallId
      })),
      mainboardSize: calculateDeckSize(currentMainboard),
      sideboardSize: calculateDeckSize(currentSideboard),
      deckSize: calculateDeckSize(currentDeck) + calculateDeckSize(currentSideboard),
      verificationCode,
      isValid: currentValidation.overallValid,
      bannedCards: currentValidation.bannedCards,
      pauperIllegalCards: currentValidation.illegalCards,
      banListValid: currentValidation.banListValid,
      pauperValid: currentValidation.pauperValid,
      status: currentValidation.overallValid ? 'approved' : 'issues',
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

  const { mainboard, sideboard } = parseDecklistText(deckText);
  
  // For Pauper, we typically only validate mainboard, but include sideboard in submission
  const allCards = [...mainboard];
  
  if (allCards.length === 0) {
    showError('Could not parse any cards from the deck list');
    return { deck: null };
  }
  
  return { deck: allCards, mainboard, sideboard };
}

/**
 * Display the deck preview
 */
function displayPreview(deck, validation, deckSize, sideboardCount = 0, sideboard = []) {
  const previewSection = document.getElementById('preview-section');
  
  // Show stats
  const statsHtml = `
    <div class="stat-item">
      <span class="stat-label">Mainboard:</span>
      <span class="stat-value">${deckSize} cards</span>
    </div>
    ${sideboardCount > 0 ? `
    <div class="stat-item">
      <span class="stat-label">Sideboard:</span>
      <span class="stat-value">${sideboardCount} cards</span>
    </div>
    ` : ''}
    <div class="stat-item">
      <span class="stat-label">Unique Cards:</span>
      <span class="stat-value">${deck.length + sideboard.length}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Status:</span>
      <span class="stat-value ${validation.overallValid ? 'valid' : 'invalid'}">
        ${validation.overallValid ? '✓ Valid (Pauper Legal)' : '✗ Invalid'}
      </span>
    </div>
  `;
  document.getElementById('preview-stats').innerHTML = statsHtml;

  // Show mainboard
  const mainboardHtml = deck.map(card => `
    <div class="deck-card">
      <span class="card-quantity">${card.quantity}x</span>
      <span class="card-name">${card.normalizedName || card.originalName}</span>
    </div>
  `).join('');
  
  // Show sideboard if present
  const sideboardHtml = sideboard.length > 0 ? `
    <h4 style="margin-top: var(--spacing-lg); padding-top: var(--spacing-lg); border-top: 1px solid var(--border);">Sideboard</h4>
    ${sideboard.map(card => `
      <div class="deck-card sideboard-card">
        <span class="card-quantity">${card.quantity}x</span>
        <span class="card-name">${card.normalizedName || card.originalName}</span>
      </div>
    `).join('')}
  ` : '';
  
  document.getElementById('preview-deck').innerHTML = '<h4>Mainboard</h4>' + mainboardHtml + sideboardHtml;

  // Show warnings
  let warningsHtml = '';
  
  // Ban list warnings
  if (!validation.banListValid && validation.bannedCards.length > 0) {
    warningsHtml += `
      <div class="warning-header">🚫 Banned Cards (Brewers Cup Banlist):</div>
      ${validation.bannedCards.map(card => `
        <div class="warning-item">
          ${card.quantity}x ${card.name}
        </div>
      `).join('')}
    `;
  }
  
  // Pauper legality warnings
  if (!validation.pauperValid && validation.illegalCards.length > 0) {
    warningsHtml += `
      <div class="warning-header">⚠️ Not Pauper Legal (Scryfall):</div>
      ${validation.illegalCards.map(card => `
        <div class="warning-item">
          ${card.quantity}x ${card.name} <span class="legality-status">(${card.status})</span>
        </div>
      `).join('')}
    `;
  }
  
  if (warningsHtml) {
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
  
  // Auto-copy to clipboard
  navigator.clipboard.writeText(verificationCode).then(() => {
    console.log('✅ Verification code copied to clipboard');
    // Show temporary feedback
    const codeDisplay = document.getElementById('codeDisplay');
    const originalText = codeDisplay.textContent;
    codeDisplay.textContent = '✓ Copied!';
    setTimeout(() => {
      codeDisplay.textContent = originalText;
    }, 2000);
  }).catch(err => {
    console.warn('Could not copy to clipboard:', err);
  });
  
  // Store in localStorage for easy access
  try {
    localStorage.setItem('lastVerificationCode', verificationCode);
    
    // Store with unique key for multiple submissions
    const submissionData = {
      code: verificationCode,
      playerName: deckData.playerName,
      timestamp: new Date().toISOString()
    };
    
    // Store most recent
    localStorage.setItem('lastDeckSubmission', JSON.stringify(submissionData));
    
    // Also store with timestamp key for history
    const key = `lastDeckSubmission_${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(submissionData));
    
    console.log('✅ Verification code saved to browser storage');
  } catch (err) {
    console.warn('Could not save to localStorage:', err);
  }

  // Display deck info
  const deckInfo = `
    <h4>Deck Submitted</h4>
    <div class="info-row">
      <span>Player:</span>
      <span>${deckData.playerName}</span>
    </div>
    <div class="info-row">
      <span>Mainboard:</span>
      <span>${deckData.mainboardSize} cards</span>
    </div>
    ${deckData.sideboardSize > 0 ? `
    <div class="info-row">
      <span>Sideboard:</span>
      <span>${deckData.sideboardSize} cards</span>
    </div>
    ` : ''}
    <div class="info-row">
      <span>Status:</span>
      <span class="${deckData.isValid ? 'valid' : 'invalid'}">
        ${deckData.isValid ? '✓ Valid' : '✗ Invalid'}
      </span>
    </div>
    ${!deckData.isValid && deckData.bannedCards && deckData.bannedCards.length > 0 ? `
      <div class="info-row banned">
        <span>Banned Cards:</span>
        <span>${deckData.bannedCards.map(c => `${c.quantity}x ${c.name}`).join(', ')}</span>
      </div>
    ` : ''}
    ${!deckData.pauperValid && deckData.pauperIllegalCards && deckData.pauperIllegalCards.length > 0 ? `
      <div class="info-row banned">
        <span>Non-Pauper:</span>
        <span>${deckData.pauperIllegalCards.map(c => `${c.quantity}x ${c.name}`).join(', ')}</span>
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
 * Show saved verification codes from browser storage
 */
window.showSavedCodes = function() {
  const modal = document.getElementById('saved-codes-modal');
  const savedCodesList = document.getElementById('saved-codes-list');
  
  try {
    // Try to get all saved submissions from localStorage
    let submissions = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('lastDeckSubmission_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          submissions.push(data);
        } catch (e) {
          console.warn('Could not parse stored submission:', e);
        }
      }
    }
    
    // Also check for the most recent one
    const recent = localStorage.getItem('lastDeckSubmission');
    if (recent && recent.includes('{')) {
      try {
        const data = JSON.parse(recent);
        if (!submissions.find(s => s.code === data.code)) {
          submissions.push(data);
        }
      } catch (e) {
        console.warn('Could not parse recent submission:', e);
      }
    }
    
    if (submissions.length > 0) {
      // Sort by timestamp, most recent first
      submissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      const codesHTML = submissions.map(sub => `
        <div style="background: var(--bg-card); padding: var(--spacing-md); border-radius: var(--radius-md); margin-bottom: var(--spacing-md); border: 1px solid var(--border);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <p style="font-weight: 700; color: var(--primary);">${escapeHtml(sub.playerName)}</p>
              <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: var(--spacing-sm);">${new Date(sub.timestamp).toLocaleString()}</p>
            </div>
            <div style="text-align: right;">
              <p style="font-family: monospace; font-size: 1.2rem; letter-spacing: 2px; color: var(--primary); margin-bottom: var(--spacing-sm);">${sub.code}</p>
              <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('${sub.code}'); this.textContent='✓ Copied!'; setTimeout(() => this.textContent='Copy', 2000);" style="font-size: 0.85rem; padding: var(--spacing-sm) var(--spacing-md);">📋 Copy</button>
            </div>
          </div>
        </div>
      `).join('');
      
      savedCodesList.innerHTML = codesHTML;
    } else {
      savedCodesList.innerHTML = `
        <p style="color: var(--text-muted); text-align: center; padding: var(--spacing-lg);">
          No saved codes found. Submit a deck to save verification codes to your browser.
        </p>
      `;
    }
  } catch (err) {
    console.error('Error loading saved codes:', err);
    savedCodesList.innerHTML = `
      <p style="color: var(--danger); text-align: center; padding: var(--spacing-lg);">
        Error loading saved codes. Please try again.
      </p>
    `;
  }
  
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
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
