/**
 * Admin Dashboard Logic
 * 
 * Simple email-based admin dashboard for viewing player submissions
 */

import { db } from './firebase-config.js';
import { collection, query, orderBy, getDocs, deleteDoc, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { updateBanList, getBanList, clearBanListCache } from './deck-validator.js';

// Simple hardcoded admin credentials
const ADMIN_EMAIL = 'admin@brewerscup.de';
const ADMIN_PASSWORD = 'BrewersCup2026!';

let isLoggedIn = false;
let allDecks = [];
let currentBanList = [];
let playerToDelete = null;

/**
 * Admin login
 */
window.adminLogin = async function() {
  console.log('🔐 adminLogin called');
  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value.trim();
  console.log('📝 Email:', email);
  
  const errorDiv = document.getElementById('login-error');
  errorDiv.classList.add('hidden');
  
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    console.log('✅ Login credentials valid');
    isLoggedIn = true;
    sessionStorage.setItem('adminLoggedIn', 'true');
    showAdminContent();
    await loadAllDecks();
  } else {
    console.warn('❌ Invalid credentials');
    errorDiv.textContent = 'Invalid email or password';
    errorDiv.classList.remove('hidden');
  }
};

/**
 * Admin logout
 */
window.logout = function() {
  isLoggedIn = false;
  sessionStorage.removeItem('adminLoggedIn');
  document.getElementById('login-section').classList.remove('hidden');
  document.getElementById('admin-section').classList.add('hidden');
  document.getElementById('logout-admin-btn').style.display = 'none';
  document.getElementById('admin-email').value = '';
  document.getElementById('admin-password').value = '';
};

/**
 * Show admin content
 */
async function showAdminContent() {
  document.getElementById('login-section').classList.add('hidden');
  document.getElementById('admin-section').classList.remove('hidden');
  document.getElementById('logout-admin-btn').style.display = 'block';
  
  // Initialize ban list in Firebase if it doesn't exist
  try {
    const banListDoc = await getDoc(doc(db, 'admin', 'banlist'));
    if (!banListDoc.exists()) {
      console.log('📝 Initializing ban list in Firebase...');
      // Import the hardcoded ban list from deck-validator
      const { BAN_LIST } = await import('./deck-validator.js');
      await updateBanList(BAN_LIST);
    }
  } catch (error) {
    console.error('⚠️ Error initializing ban list:', error);
  }
}

/**
 * Load all decks from Firestore
 */
async function loadAllDecks() {
  try {
    console.log('📂 Loading all decks from Firestore...');
    const q = query(collection(db, 'decks'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);

    allDecks = [];
    querySnapshot.forEach(doc => {
      allDecks.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`✅ Loaded ${allDecks.length} decks`);
    displayPlayersList();
  } catch (error) {
    console.error('Error loading decks:', error);
    showError('Failed to load decks: ' + error.message);
  }
}

/**
 * Display players list with status indicators
 */
function displayPlayersList() {
  const list = document.getElementById('players-list');
  list.innerHTML = '';

  if (allDecks.length === 0) {
    list.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: var(--spacing-2xl);">No submissions yet</p>';
    document.getElementById('player-count').textContent = '0 players registered';
    return;
  }

  document.getElementById('player-count').textContent = `${allDecks.length} player${allDecks.length !== 1 ? 's' : ''} registered`;

  allDecks.forEach(deck => {
    const isValid = deck.isValid === true;
    const statusEmoji = isValid ? '✓' : '✕';
    const statusClass = isValid ? 'valid' : 'invalid';

    const card = document.createElement('div');
    card.className = 'player-card';

    card.innerHTML = `
      <div class="player-status ${statusClass}">
        ${statusEmoji}
      </div>
      <div class="player-info">
        <div class="player-name">${escapeHtml(deck.playerName)}</div>
        <div class="player-email">${escapeHtml(deck.email || 'No email')}</div>
        <div class="player-code">Code: ${escapeHtml(deck.verificationCode)}</div>
      </div>
      <div class="player-card-actions">
        <button class="player-card-action-btn view-btn" data-deck-id="${deck.id}">👁️ View</button>
        <button class="player-card-action-btn delete" data-deck-id="${deck.id}">🗑️ Delete</button>
      </div>
    `;

    const viewBtn = card.querySelector('.view-btn');
    viewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showDeckModal(deck);
    });

    const deleteBtn = card.querySelector('.delete');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showDeleteConfirmation(deck);
    });

    list.appendChild(card);
  });
}

/**
 * Show delete confirmation modal
 */
function showDeleteConfirmation(deck) {
  console.log('🗑️ Delete confirmation for:', deck.playerName);
  playerToDelete = deck;
  document.getElementById('delete-confirmation-text').textContent = `Are you sure you want to delete ${escapeHtml(deck.playerName)}'s submission?`;
  document.getElementById('delete-confirmation-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

/**
 * Close delete confirmation modal
 */
window.closeDeleteConfirmation = function() {
  console.log('❌ Delete confirmation cancelled');
  playerToDelete = null;
  document.getElementById('delete-confirmation-modal').classList.add('hidden');
  document.body.style.overflow = 'auto';
};

/**
 * Confirm delete player
 */
window.confirmDeletePlayer = async function() {
  if (!playerToDelete) return;
  
  console.log('🔥 Deleting player:', playerToDelete.playerName);
  try {
    await deleteDoc(doc(db, 'decks', playerToDelete.id));
    console.log('✅ Player deleted successfully');
    closeDeleteConfirmation();
    showAdminContent();
    await loadAllDecks();
  } catch (error) {
    console.error('❌ Error deleting player:', error);
    showError('Failed to delete player: ' + error.message);
    closeDeleteConfirmation();
  }
};

/**
 * Show fullscreen deck modal
 */
function showDeckModal(deck) {
  document.getElementById('modal-player-name').textContent = escapeHtml(deck.playerName);
  document.getElementById('modal-verification-code').textContent = `Verification Code: ${escapeHtml(deck.verificationCode)}`;

  const deckSize = deck.deckSize || deck.decklist?.length || 0;
  const bannedCount = deck.bannedCards?.length || 0;

  let statsHTML = `
    <div class="deck-stats-grid">
      <div class="stat-box">
        <span class="stat-box-label">Total Cards</span>
        <span class="stat-box-value">${deckSize}</span>
      </div>
      <div class="stat-box">
        <span class="stat-box-label">Status</span>
        <span class="stat-box-value" style="color: ${deck.isValid ? 'var(--success)' : 'var(--danger)'};">
          ${deck.isValid ? 'VALID' : 'INVALID'}
        </span>
      </div>
      ${bannedCount > 0 ? `
        <div class="stat-box">
          <span class="stat-box-label">Banned Cards</span>
          <span class="stat-box-value" style="color: var(--danger);">${bannedCount}</span>
        </div>
      ` : ''}
    </div>
  `;

  let cardsHTML = '<div class="deck-cards">';
  if (deck.decklist && Array.isArray(deck.decklist)) {
    deck.decklist.forEach(card => {
      const cardName = card.name || card.originalName || '';
      const isBanned = deck.bannedCards?.some(bc => 
        bc.toLowerCase() === cardName.toLowerCase()
      );
      cardsHTML += `
        <div class="deck-card-item${isBanned ? ' style="background: rgba(248, 113, 113, 0.1);"' : ''}>
          <span class="deck-card-qty">${card.quantity}x</span>
          <span class="deck-card-name">${escapeHtml(cardName)}</span>
          ${isBanned ? '<span style="color: var(--danger); font-size: 0.8rem;">🚫</span>' : ''}
        </div>
      `;
    });
  }
  cardsHTML += '</div>';

  let bannedSection = '';
  if (deck.bannedCards && deck.bannedCards.length > 0) {
    bannedSection = `
      <div class="deck-section">
        <h3>🚫 Banned Cards</h3>
        <div class="banned-badges">
          ${deck.bannedCards.map(card => `<span class="badge">${escapeHtml(card)}</span>`).join('')}
        </div>
      </div>
    `;
  }

  const content = `
    <div class="deck-section">
      <h3>📊 Deck Statistics</h3>
      ${statsHTML}
    </div>
    ${bannedSection}
    <div class="deck-section">
      <h3>📋 Deck List</h3>
      ${cardsHTML}
    </div>
  `;

  document.getElementById('modal-deck-content').innerHTML = content;
  document.getElementById('deck-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

/**
 * Close deck modal
 */
window.closeDeckModal = function() {
  document.getElementById('deck-modal').classList.add('hidden');
  document.body.style.overflow = 'auto';
};

/**
 * Escape HTML
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Load and display current ban list
 */
async function loadBanList() {
  console.log('🚫 Loading ban list from Firebase');
  try {
    currentBanList = await getBanList();
    console.log('✅ Ban list loaded:', currentBanList.length, 'cards');
    
    // If empty, it means we got the hardcoded list from fallback
    // Initialize Firebase with it
    if (currentBanList.length > 0 && !document.querySelector('[data-firebase-initialized]')) {
      console.log('📝 Initializing Firebase ban list...');
      await updateBanList(currentBanList);
      document.documentElement.setAttribute('data-firebase-initialized', 'true');
    }
    
    displayBanList();
  } catch (error) {
    console.error('❌ Error loading ban list:', error);
    showError('Failed to load ban list');
  }
}

/**
 * Display ban list
 */
function displayBanList() {
  console.log('🎨 Displaying ban list...');
  const container = document.getElementById('banlist-cards');
  console.log('🔍 Container found:', !!container, container);
  
  if (!container) {
    console.error('❌ banlist-cards container not found!');
    return;
  }
  
  container.innerHTML = '';

  if (currentBanList.length === 0) {
    console.warn('⚠️ Ban list is empty');
    container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: var(--spacing-lg);">No banned cards</p>';
    return;
  }

  console.log('📋 Adding', currentBanList.length, 'cards to display');
  currentBanList.forEach((card, index) => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'banlist-card-item';
    cardDiv.innerHTML = `
      <span class="banlist-card-name">${escapeHtml(card)}</span>
      <button class="banlist-card-remove" data-index="${index}">✕ Remove</button>
    `;

    const removeBtn = cardDiv.querySelector('.banlist-card-remove');
    removeBtn.addEventListener('click', () => {
      console.log('🗑️ Removing card from ban list:', card);
      removeCardFromBanList(index);
    });

    container.appendChild(cardDiv);
    
    // Log first few cards for verification
    if (index < 3) {
      console.log(`  → Card ${index + 1}: ${card}`);
    }
  });
  
  console.log('✅ Ban list display complete. Container children:', container.children.length);
}

/**
 * Add card to ban list
 */
window.addCardToBanList = function() {
  const input = document.getElementById('new-banned-card');
  const cardName = input.value.trim();

  if (!cardName) {
    showBanlistError('Please enter a card name');
    return;
  }

  if (currentBanList.some(c => c.toLowerCase() === cardName.toLowerCase())) {
    showBanlistError('This card is already banned');
    return;
  }

  console.log('➕ Adding card to ban list:', cardName);
  currentBanList.push(cardName);
  updateBanList(currentBanList);
  
  input.value = '';
  displayBanList();
  clearBanlistError();
};

/**
 * Remove card from ban list
 */
function removeCardFromBanList(index) {
  const cardName = currentBanList[index];
  console.log('🗑️ Removing card:', cardName);
  currentBanList.splice(index, 1);
  updateBanList(currentBanList);
  displayBanList();
  clearBanlistError();
}

/**
 * Show ban list error
 */
function showBanlistError(message) {
  const errorDiv = document.getElementById('banlist-error');
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');
}

/**
 * Clear ban list error
 */
function clearBanlistError() {
  const errorDiv = document.getElementById('banlist-error');
  errorDiv.classList.add('hidden');
}

/**
 * Switch between admin tabs
 */
window.switchTab = function(tabName) {
  console.log('📑 Switching to tab:', tabName);
  
  // Hide all tabs
  document.getElementById('players-tab').classList.add('hidden');
  document.getElementById('players-tab').classList.remove('active');
  document.getElementById('banlist-tab').classList.add('hidden');
  document.getElementById('banlist-tab').classList.remove('active');
  
  // Remove active class from all buttons
  document.getElementById('players-tab-btn').classList.remove('active');
  document.getElementById('banlist-tab-btn').classList.remove('active');
  
  // Show selected tab
  if (tabName === 'players') {
    const playersTab = document.getElementById('players-tab');
    playersTab.classList.remove('hidden');
    playersTab.classList.add('active');
    document.getElementById('players-tab-btn').classList.add('active');
  } else if (tabName === 'banlist') {
    const banlistTab = document.getElementById('banlist-tab');
    console.log('🔍 banlist-tab element:', banlistTab);
    console.log('📋 banlist-tab classes before:', banlistTab.className);
    
    banlistTab.classList.remove('hidden');
    banlistTab.classList.add('active');
    document.getElementById('banlist-tab-btn').classList.add('active');
    
    console.log('📋 banlist-tab classes after:', banlistTab.className);
    console.log('✅ Tab content should be visible now');
    
    // Clear cache to get fresh data from Firebase
    clearBanListCache();
    loadBanList();
  }
};

/**
 * Show error message
 */
function showError(message) {
  const errorDiv = document.getElementById('admin-error');
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');
}

/**
 * Check if already logged in
 */
window.addEventListener('DOMContentLoaded', () => {
  console.log('📄 Admin DOMContentLoaded - setting up event listeners');
  
  // Add event listeners for buttons
  const loginBtn = document.getElementById('admin-login-btn');
  console.log('🔘 Login button found:', !!loginBtn);
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      console.log('🖱️ Login button clicked');
      adminLogin();
    });
  }
  
  const logoutBtn = document.getElementById('logout-admin-btn');
  console.log('🔘 Logout button found:', !!logoutBtn);
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      console.log('🖱️ Logout button clicked');
      logout();
    });
  }
  
  const closeBtn = document.getElementById('modal-close-btn');
  console.log('🔘 Close modal button found:', !!closeBtn);
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      console.log('🖱️ Close modal button clicked');
      closeDeckModal();
    });
  }
  
  // Tab switching
  const playersTabBtn = document.getElementById('players-tab-btn');
  console.log('🔘 Players tab button found:', !!playersTabBtn);
  if (playersTabBtn) {
    playersTabBtn.addEventListener('click', () => {
      console.log('🖱️ Players tab button clicked');
      switchTab('players');
    });
  }
  
  const banlistTabBtn = document.getElementById('banlist-tab-btn');
  console.log('🔘 Ban list tab button found:', !!banlistTabBtn);
  if (banlistTabBtn) {
    banlistTabBtn.addEventListener('click', () => {
      console.log('🖱️ Ban list tab button clicked');
      switchTab('banlist');
    });
  }
  
  // Ban list management
  const addCardBtn = document.getElementById('add-card-btn');
  if (addCardBtn) {
    addCardBtn.addEventListener('click', () => addCardToBanList());
  }
  
  const newBannedCardInput = document.getElementById('new-banned-card');
  if (newBannedCardInput) {
    newBannedCardInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addCardToBanList();
    });
  }
  
  // Delete confirmation
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => confirmDeletePlayer());
  }
  
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', () => closeDeleteConfirmation());
  }
  
  if (sessionStorage.getItem('adminLoggedIn') === 'true') {
    console.log('✅ Admin already logged in, loading data');
    isLoggedIn = true;
    showAdminContent();
    loadAllDecks();
  } else {
    console.log('📝 Admin not logged in');
  }
});
