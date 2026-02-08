/**
 * Check Status Page Logic
 * 
 * Handles the check-status.html page for looking up and editing submitted decks
 */

import { db } from './firebase-config.js';
import { collection, query, where, getDocs, updateDoc, doc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { normalizeDeckNames, validateAgainstBanlist, validatePauperLegality, getBanList } from './deck-validator.js';

let currentDeckId = null;
let currentDeckData = null;

/**
 * Check a deck by verification code
 */
window.checkDeck = async function() {
  console.log('🔍 checkDeck called');
  try {
    const verificationCode = document.getElementById('verificationCode').value.trim().toUpperCase();
    console.log('📝 Verification code entered:', verificationCode);

    if (!verificationCode) {
      console.warn('⚠️ No verification code entered');
      showCheckError('Please enter a verification code');
      return;
    }

    console.log('🔄 Showing loading state...');
    showCheckLoading(true);
    hideCheckError();

    // Query Firestore for the deck
    console.log('🔍 Querying Firestore for deck:', verificationCode);
    const q = query(
      collection(db, 'decks'),
      where('verificationCode', '==', verificationCode)
    );

    const querySnapshot = await getDocs(q);
    console.log('📊 Query result:', querySnapshot.size, 'documents found');

    if (querySnapshot.empty) {
      console.warn('❌ Deck not found');
      showCheckError('Verification code not found. Please check and try again.');
      showCheckLoading(false);
      return;
    }

    // Get the first result (should only be one)
    const deckDoc = querySnapshot.docs[0];
    currentDeckId = deckDoc.id;
    currentDeckData = deckDoc.data();
    console.log('✅ Deck found:', currentDeckData);

    displayDeckResult(currentDeckData);
    showCheckLoading(false);

  } catch (error) {
    console.error('❌ Error checking deck:', error);
    showCheckError('Error checking deck: ' + error.message);
    showCheckLoading(false);
  }
};

/**
 * Display the deck result
 */
function displayDeckResult(deckData) {
  const resultDiv = document.getElementById('check-result');
  const detailsDiv = document.getElementById('check-details');

  // Format timestamp
  const timestamp = deckData.createdAt 
    ? new Date(deckData.createdAt).toLocaleString()
    : 'Unknown';

  const detailsHtml = `
    <div class="detail-item">
      <span class="detail-label">Player Name</span>
      <span class="detail-value">${escapeHtml(deckData.playerName)}</span>
    </div>
    ${deckData.email ? `
      <div class="detail-item">
        <span class="detail-label">Email</span>
        <span class="detail-value">${escapeHtml(deckData.email)}</span>
      </div>
    ` : ''}
    ${deckData.tournamentName || deckData.tournamentId ? `
      <div class="detail-item">
        <span class="detail-label">Tournament</span>
        <span class="detail-value">${escapeHtml(deckData.tournamentName || deckData.tournamentId)}</span>
      </div>
    ` : ''}
    <div class="detail-item">
      <span class="detail-label">Submission Date</span>
      <span class="detail-value">${timestamp}</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">Deck Size</span>
      <span class="detail-value">${deckData.deckSize} cards</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">Status</span>
      <span class="detail-value ${deckData.isValid ? 'valid' : 'invalid'}">
        ${deckData.isValid ? '✓ Valid (Pauper Legal)' : '✗ Invalid'}
      </span>
    </div>
    ${!deckData.banListValid && deckData.bannedCards && deckData.bannedCards.length > 0 ? `
      <div class="detail-item full-width">
        <span class="detail-label">Banned Cards</span>
        <div style="display: flex; gap: var(--spacing-sm); flex-wrap: wrap; margin-top: var(--spacing-sm);">
          ${deckData.bannedCards.map(c => `<span class="badge" style="background: rgba(248, 113, 113, 0.2); color: var(--danger); padding: var(--spacing-sm) var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--danger);">${c.quantity}x ${escapeHtml(c.name)}</span>`).join('')}
        </div>
      </div>
    ` : ''}
    ${deckData.pauperCheckEnabled && !deckData.pauperValid && deckData.pauperIllegalCards && deckData.pauperIllegalCards.length > 0 ? `
      <div class="detail-item full-width">
        <span class="detail-label">Not Pauper Legal (Scryfall)</span>
        <div style="display: flex; gap: var(--spacing-sm); flex-wrap: wrap; margin-top: var(--spacing-sm);">
          ${deckData.pauperIllegalCards.map(c => `<span class="badge" style="background: rgba(251, 191, 36, 0.2); color: var(--warning); padding: var(--spacing-sm) var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--warning);">${c.quantity}x ${escapeHtml(c.name)} (${c.status})</span>`).join('')}
        </div>
      </div>
    ` : ''}
    ${deckData.pauperCheckEnabled === false ? `
      <div class="detail-item full-width">
        <div style="background: rgba(157, 78, 221, 0.1); border-left: 4px solid var(--primary); padding: var(--spacing-md); border-radius: var(--radius-md);">
          <div style="font-weight: 600; color: var(--primary); margin-bottom: 0.25rem;">ℹ️ Pauper Check Disabled</div>
          <div style="color: var(--text-muted); font-size: 0.85rem;">Pauper legality checking was disabled for this tournament.</div>
        </div>
      </div>
    ` : ''}
  `;

  detailsDiv.innerHTML = detailsHtml;

  // Display mainboard
  let deckListHtml = '<h4 style="margin-bottom: var(--spacing-md);">Mainboard</h4>';
  
  if (deckData.decklist && deckData.decklist.length > 0) {
    deckListHtml += deckData.decklist
      .sort((a, b) => b.quantity - a.quantity)
      .map(card => `
        <div class="deck-card-item">
          <span class="deck-card-qty">${card.quantity}x</span>
          <span class="deck-card-name">${escapeHtml(card.name || card.originalName)}</span>
        </div>
      `)
      .join('');
  }
  
  // Display sideboard if present
  if (deckData.sideboard && deckData.sideboard.length > 0) {
    deckListHtml += '<h4 style="margin-top: var(--spacing-lg); margin-bottom: var(--spacing-md); padding-top: var(--spacing-lg); border-top: 1px solid var(--border);">Sideboard</h4>';
    deckListHtml += deckData.sideboard
      .sort((a, b) => b.quantity - a.quantity)
      .map(card => `
        <div class="deck-card-item sideboard-card-item">
          <span class="deck-card-qty">${card.quantity}x</span>
          <span class="deck-card-name">${escapeHtml(card.name || card.originalName)}</span>
        </div>
      `)
      .join('');
  }

  document.getElementById('check-deck-list').innerHTML = deckListHtml;

  resultDiv.classList.remove('hidden');
}

/**
 * Toggle between view and edit mode
 */
window.toggleEditMode = function() {
  console.log('🔄 Opening edit modal');
  const modal = document.getElementById('edit-deck-modal');
  const textarea = document.getElementById('edit-deck-textarea');
  
  // Populate textarea with current decklist
  const deckText = currentDeckData.decklist
    .map(card => `${card.quantity}x ${card.name || card.originalName}`)
    .join('\n');
  textarea.value = deckText;
  
  // Hide revalidation results
  document.getElementById('modal-revalidation-results').classList.add('hidden');
  document.getElementById('save-deck-btn').style.display = 'none';
  document.getElementById('revalidate-btn').style.display = 'block';
  
  // Clear errors
  document.getElementById('edit-error').classList.add('hidden');
  
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
};

/**
 * Cancel edit mode
 */
window.cancelEdit = function() {
  console.log('❌ Closing edit modal');
  document.getElementById('edit-deck-modal').classList.add('hidden');
  document.body.style.overflow = 'auto';
};

/**
 * Revalidate the deck
 */
window.revalidateDeck = async function() {
  try {
    const deckText = document.getElementById('edit-deck-textarea').value.trim();
    const editError = document.getElementById('edit-error');
    editError.classList.add('hidden');

    if (!deckText) {
      editError.textContent = 'Please enter at least one card';
      editError.classList.remove('hidden');
      return;
    }

    // Parse the deck
    const lines = deckText.split('\n').filter(l => l.trim());
    const decklist = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip section markers and empty lines
      if (trimmedLine.toUpperCase() === 'SIDEBOARD' || 
          !trimmedLine || 
          trimmedLine.startsWith('//')) {
        continue;
      }
      
      const match = trimmedLine.match(/^(\d+)x?\s+(.+)$/i);
      if (!match) {
        editError.textContent = `Invalid format on line: "${line}". Use format: "2x Island"`;
        editError.classList.remove('hidden');
        return;
      }

      const quantity = parseInt(match[1]);
      const cardName = match[2].trim();

      if (quantity < 1) {
        editError.textContent = `Invalid quantity on line: "${line}". Quantity must be at least 1`;
        editError.classList.remove('hidden');
        return;
      }

      decklist.push({
        quantity,
        originalName: cardName,
        name: cardName
      });
    }

    // Show loading
    editError.textContent = 'Validating deck...';
    editError.classList.remove('hidden');
    editError.style.color = 'var(--text-muted)';

    // Normalize deck names
    const normalizedDecklist = await normalizeDeckNames(decklist);
    
    // Validate deck
    const banList = await getBanList();
    const validation = validateAgainstBanlist(normalizedDecklist, banList);
    
    // Check Pauper legality
    const pauperValidation = await validatePauperLegality(normalizedDecklist);
    
    // Combine validations
    const combinedValidation = {
      banListValid: validation.valid,
      pauperValid: pauperValidation.valid,
      overallValid: validation.valid && pauperValidation.valid,
      bannedCards: validation.bannedCards,
      illegalCards: pauperValidation.illegalCards
    };

    // Display revalidation results
    displayRevalidationResults(normalizedDecklist, combinedValidation);

    editError.classList.add('hidden');

  } catch (error) {
    console.error('Error revalidating deck:', error);
    const editError = document.getElementById('edit-error');
    editError.textContent = 'Error validating deck: ' + error.message;
    editError.classList.remove('hidden');
    editError.style.color = 'var(--danger)';
  }
};

/**
 * Display revalidation results
 */
function displayRevalidationResults(decklist, validation) {
  console.log('📊 Displaying revalidation results');
  const resultsDiv = document.getElementById('modal-revalidation-results');
  const detailsDiv = document.getElementById('modal-revalidation-details');
  const deckListDiv = document.getElementById('modal-revalidation-deck-list');

  const deckSize = decklist.reduce((sum, card) => sum + card.quantity, 0);

  const detailsHtml = `
    <div class="detail-item">
      <span class="detail-label">Deck Size</span>
      <span class="detail-value">${deckSize} cards</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">Status</span>
      <span class="detail-value ${validation.overallValid ? 'valid' : 'invalid'}">
        ${validation.overallValid ? '✓ Valid (Pauper Legal)' : '✗ Invalid'}
      </span>
    </div>
    ${validation.bannedCards && validation.bannedCards.length > 0 ? `
      <div class="detail-item full-width">
        <span class="detail-label">Banned Cards Found</span>
        <div style="display: flex; gap: var(--spacing-sm); flex-wrap: wrap; margin-top: var(--spacing-sm);">
          ${validation.bannedCards.map(c => `<span class="badge" style="background: rgba(248, 113, 113, 0.2); color: var(--danger); padding: var(--spacing-sm) var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--danger);">${c.quantity}x ${escapeHtml(c.name || c.originalName)}</span>`).join('')}
        </div>
      </div>
    ` : ''}
    ${validation.illegalCards && validation.illegalCards.length > 0 ? `
      <div class="detail-item full-width">
        <span class="detail-label">Not Pauper Legal (Scryfall)</span>
        <div style="display: flex; gap: var(--spacing-sm); flex-wrap: wrap; margin-top: var(--spacing-sm);">
          ${validation.illegalCards.map(c => `<span class="badge" style="background: rgba(251, 191, 36, 0.2); color: var(--warning); padding: var(--spacing-sm) var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--warning);">${c.quantity}x ${escapeHtml(c.name)} (${c.status})</span>`).join('')}
        </div>
      </div>
    ` : ''}
  `;

  detailsDiv.innerHTML = detailsHtml;

  // Display updated deck list
  const deckListHtml = decklist
    .sort((a, b) => b.quantity - a.quantity)
    .map(card => {
      const isBanned = validation.bannedCards?.some(bc => 
        (bc.name || bc.originalName).toLowerCase() === (card.name || card.originalName).toLowerCase()
      );
      return `
        <div class="deck-card-item${isBanned ? ' style="background: rgba(248, 113, 113, 0.1);"' : ''}>
          <span class="deck-card-qty">${card.quantity}x</span>
          <span class="deck-card-name">${escapeHtml(card.name || card.originalName)}</span>
          ${isBanned ? '<span style="color: var(--danger); font-size: 0.8rem;">🚫</span>' : ''}
        </div>
      `;
    })
    .join('');

  deckListDiv.innerHTML = `<h3>Updated Decklist</h3>` + deckListHtml;
  resultsDiv.classList.remove('hidden');

  // Show save button, hide revalidate button
  document.getElementById('save-deck-btn').style.display = 'block';
  document.getElementById('revalidate-btn').style.display = 'none';
}

/**
 * Save updated deck to Firestore
 */
window.saveUpdatedDeck = async function() {
  try {
    if (!currentDeckId) return;

    const deckText = document.getElementById('edit-deck-textarea').value.trim();
    const lines = deckText.split('\n').filter(l => l.trim());
    const decklist = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip section markers
      if (trimmedLine.toUpperCase() === 'SIDEBOARD' || trimmedLine.startsWith('//')) {
        continue;
      }
      
      const match = trimmedLine.match(/^(\d+)x?\s+(.+)$/i);
      if (!match) continue;

      const quantity = parseInt(match[1]);
      const cardName = match[2].trim();
      if (quantity < 1) continue;

      decklist.push({ quantity, originalName: cardName, name: cardName });
    }

    // Normalize and validate
    const normalizedDecklist = await normalizeDeckNames(decklist);
    const validation = validateAgainstBanlist(normalizedDecklist);
    const pauperValidation = await validatePauperLegality(normalizedDecklist);
    const deckSize = decklist.reduce((sum, card) => sum + card.quantity, 0);

    // Update Firestore
    const deckRef = doc(db, 'decks', currentDeckId);
    await updateDoc(deckRef, {
      decklist: normalizedDecklist,
      deckSize,
      isValid: validation.valid && pauperValidation.valid,
      bannedCards: validation.bannedCards || [],
      pauperIllegalCards: pauperValidation.illegalCards || [],
      banListValid: validation.valid,
      pauperValid: pauperValidation.valid
    });

    // Update current data
    currentDeckData.decklist = normalizedDecklist;
    currentDeckData.deckSize = deckSize;
    currentDeckData.isValid = validation.valid && pauperValidation.valid;
    currentDeckData.bannedCards = validation.bannedCards || [];
    currentDeckData.pauperIllegalCards = pauperValidation.illegalCards || [];

    // Show success
    const editError = document.getElementById('edit-error');
    editError.textContent = '✓ Deck updated successfully!';
    editError.style.color = 'var(--success)';
    editError.classList.remove('hidden');

    // Reset view after 2 seconds
    setTimeout(() => {
      cancelEdit();
      displayDeckResult(currentDeckData);
    }, 2000);

  } catch (error) {
    console.error('Error saving deck:', error);
    const editError = document.getElementById('edit-error');
    editError.textContent = 'Error saving deck: ' + error.message;
    editError.style.color = 'var(--danger)';
    editError.classList.remove('hidden');
  }
};

/**
 * Download deck list as text file
 */
window.downloadDeckList = function() {
  const verificationCode = document.getElementById('verificationCode').value.trim().toUpperCase();
  const deckCards = document.querySelectorAll('.deck-card-item');

  if (deckCards.length === 0) {
    alert('No deck to download');
    return;
  }

  let deckText = '';
  deckCards.forEach(card => {
    const quantity = card.querySelector('.deck-card-qty').textContent.trim();
    const name = card.querySelector('.deck-card-name').textContent.trim();
    deckText += `${quantity} ${name}\n`;
  });

  const blob = new Blob([deckText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mtg-deck-${verificationCode}.txt`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Reset check form
 */
window.resetCheckForm = function() {
  document.getElementById('verificationCode').value = '';
  document.getElementById('check-result').classList.add('hidden');
  document.getElementById('edit-deck-modal').classList.add('hidden');
  document.body.style.overflow = 'auto';
  hideCheckError();
  currentDeckId = null;
  currentDeckData = null;
};

/**
 * Show check loading
 */
function showCheckLoading(show) {
  document.getElementById('check-loading').classList.toggle('hidden', !show);
}

/**
 * Show check error
 */
function showCheckError(message) {
  const errorDiv = document.getElementById('check-error');
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');
}

/**
 * Hide check error
 */
function hideCheckError() {
  document.getElementById('check-error').classList.add('hidden');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Allow Enter key to check deck
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOMContentLoaded - setting up event listeners');
  
  const verificationCodeInput = document.getElementById('verificationCode');
  if (verificationCodeInput) {
    verificationCodeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        console.log('⌨️ Enter key pressed');
        window.checkDeck();
      }
    });
  } else {
    console.error('❌ Verification code input not found!');
  }
  
  // Add click listeners for buttons
  const lookupBtn = document.getElementById('lookup-btn');
  console.log('🔘 Lookup button found:', !!lookupBtn);
  if (lookupBtn) {
    lookupBtn.addEventListener('click', () => {
      console.log('🖱️ Lookup button clicked');
      window.checkDeck();
    });
  } else {
    console.error('❌ Lookup button not found!');
  }
  
  document.getElementById('edit-deck-btn')?.addEventListener('click', () => {
    console.log('🖱️ Edit deck button clicked');
    toggleEditMode();
  });
  
  document.getElementById('edit-modal-close-btn')?.addEventListener('click', () => {
    console.log('🖱️ Edit modal close button clicked');
    cancelEdit();
  });
  
  document.getElementById('revalidate-btn')?.addEventListener('click', () => {
    console.log('🖱️ Revalidate button clicked');
    revalidateDeck();
  });
  
  document.getElementById('save-deck-btn')?.addEventListener('click', () => {
    console.log('🖱️ Save deck button clicked');
    saveUpdatedDeck();
  });
  
  document.getElementById('cancel-edit-btn')?.addEventListener('click', () => {
    console.log('🖱️ Cancel edit button clicked');
    cancelEdit();
  });
  
  document.getElementById('download-btn')?.addEventListener('click', () => {
    console.log('🖱️ Download button clicked');
    downloadDeckList();
  });
  
  document.getElementById('check-another-btn')?.addEventListener('click', () => {
    console.log('🖱️ Check another button clicked');
    resetCheckForm();
  });
});
