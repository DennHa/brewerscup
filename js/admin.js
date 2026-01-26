import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { db } from './firebase-config.js';

console.log('Admin.js loading...');

const auth = getAuth();
let currentUser = null;

console.log('Firebase Auth initialized:', auth);

// Check if already logged in
auth.onAuthStateChanged((user) => {
  console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
  if (user) {
    currentUser = user;
    console.log('User email:', user.email);
    showAdminDashboard();
  } else {
    showLoginForm();
  }
});

// Login button handler
document.addEventListener('DOMContentLoaded', () => {
  console.log('Admin page DOMContentLoaded');
  const loginBtn = document.getElementById('admin-login-btn');
  const logoutBtn = document.getElementById('logout-admin-btn');
  
  console.log('Login button element:', loginBtn);
  console.log('Logout button element:', logoutBtn);
  
  if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
    console.log('Login button listener attached');
  }
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
    console.log('Logout button listener attached');
  }
});

async function handleLogin() {
  console.log('handleLogin called');
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;
  const errorDiv = document.getElementById('login-error');
  
  console.log('Login attempt with email:', email);

  if (!email || !password) {
    console.log('Email or password empty');
    if (errorDiv) {
      errorDiv.textContent = 'Please enter email and password';
      errorDiv.classList.remove('hidden');
    }
    return;
  }

  try {
    console.log('Attempting Firebase sign-in...');
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log('Admin login successful:', result.user.email);
    // Auth state change will be caught by onAuthStateChanged listener
  } catch (error) {
    console.error('Login failed:', error.code, error.message);
    if (errorDiv) {
      errorDiv.textContent = 'Login failed: ' + error.message;
      errorDiv.classList.remove('hidden');
    }
  }
}

async function handleLogout() {
  try {
    await signOut(auth);
    console.log('Admin logged out');
  } catch (error) {
    console.error('Logout failed:', error.message);
  }
}

function showLoginForm() {
  const loginSection = document.getElementById('login-section');
  const adminSection = document.getElementById('admin-section');
  const logoutBtn = document.getElementById('logout-admin-btn');
  
  if (loginSection) loginSection.classList.remove('hidden');
  if (adminSection) adminSection.classList.add('hidden');
  if (logoutBtn) logoutBtn.style.display = 'none';
}

function showAdminDashboard() {
  const loginSection = document.getElementById('login-section');
  const adminSection = document.getElementById('admin-section');
  const logoutBtn = document.getElementById('logout-admin-btn');
  
  if (loginSection) loginSection.classList.add('hidden');
  if (adminSection) adminSection.classList.remove('hidden');
  if (logoutBtn) logoutBtn.style.display = 'block';
  
  console.log('Admin dashboard shown for user: ' + currentUser.email);
  
  // Set up tab switching
  setupTabs();
  
  // Load players list
  loadPlayers();
}

// Setup tab switching
function setupTabs() {
  const playersTabBtn = document.getElementById('players-tab-btn');
  const banlistTabBtn = document.getElementById('banlist-tab-btn');
  const playersTab = document.getElementById('players-tab');
  const banlistTab = document.getElementById('banlist-tab');
  
  if (playersTabBtn) {
    playersTabBtn.addEventListener('click', () => {
      console.log('Players tab clicked');
      if (playersTab) playersTab.classList.remove('hidden');
      if (banlistTab) banlistTab.classList.add('hidden');
      playersTabBtn.classList.add('active');
      if (banlistTabBtn) banlistTabBtn.classList.remove('active');
    });
  }
  
  if (banlistTabBtn) {
    banlistTabBtn.addEventListener('click', () => {
      console.log('Ban list tab clicked');
      if (playersTab) playersTab.classList.add('hidden');
      if (banlistTab) banlistTab.classList.remove('hidden');
      if (playersTabBtn) playersTabBtn.classList.remove('active');
      banlistTabBtn.classList.add('active');
      loadBanList(); // Load ban list when tab is opened
    });
  }
}

// Load players from Firestore
async function loadPlayers() {
  console.log('Loading players from Firestore...');
  try {
    const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
    const decksCollection = collection(db, 'decks');
    const snapshot = await getDocs(decksCollection);
    
    const players = [];
    snapshot.forEach((doc) => {
      players.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('Players loaded:', players.length);
    
    // Display players
    const playersList = document.getElementById('players-list');
    const playerCount = document.getElementById('player-count');
    
    if (players.length > 0) {
      playerCount.textContent = `Total: ${players.length} deck(s)`;
      playersList.innerHTML = players.map((player, idx) => `
        <div style="background: var(--bg-card); padding: var(--spacing-md); border-radius: var(--radius-md); margin-bottom: var(--spacing-md); border: 1px solid var(--border);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <p style="font-weight: 700; color: var(--primary);">${player.playerName || 'Unknown'}</p>
              <p style="font-size: 0.9rem; color: var(--text-muted);">Code: ${player.code}</p>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;">${new Date(player.timestamp).toLocaleString()}</p>
            </div>
            <div style="text-align: right;">
              <button class="btn btn-secondary" style="font-size: 0.85rem; margin-bottom: 0.5rem;" onclick="viewDeck(${JSON.stringify(player).replace(/"/g, '&quot;')})">View Deck</button>
              <button class="btn btn-danger" style="font-size: 0.85rem; background: var(--danger); color: white;">Delete</button>
            </div>
          </div>
        </div>
      `).join('');
      
      // Set up modal close button
      const modalCloseBtn = document.getElementById('modal-close-btn');
      if (modalCloseBtn) {
        modalCloseBtn.onclick = () => {
          const modal = document.getElementById('deck-modal');
          if (modal) modal.classList.add('hidden');
        };
      }
    } else {
      playerCount.textContent = 'No submissions yet';
      playersList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: var(--spacing-lg);">No player submissions found.</p>';
    }
  } catch (err) {
    console.error('Error loading players:', err);
    const playersList = document.getElementById('players-list');
    if (playersList) {
      playersList.innerHTML = `<p style="color: var(--danger);">Error loading players: ${err.message}</p>`;
    }
  }
}

// Load and display ban list
async function loadBanList() {
  console.log('Loading ban list from Firestore...');
  try {
    const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
    const banlistCollection = collection(db, 'banlist');
    const snapshot = await getDocs(banlistCollection);
    
    const bannedCards = [];
    snapshot.forEach((doc) => {
      bannedCards.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('Ban list loaded:', bannedCards.length, bannedCards);
    
    const banlistCards = document.getElementById('banlist-cards');
    if (banlistCards) {
      if (bannedCards.length > 0) {
        banlistCards.innerHTML = bannedCards.map(card => `
          <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-card); padding: var(--spacing-md); border-radius: var(--radius-md); margin-bottom: var(--spacing-sm); border: 1px solid var(--border);">
            <span style="font-weight: 600; color: var(--primary);">${card.cardName || card.name}</span>
            <button class="btn btn-danger" style="font-size: 0.75rem; padding: 0.25rem 0.5rem; background: var(--danger); color: white;" onclick="removeFromBanList('${card.id}')">Remove</button>
          </div>
        `).join('');
      } else {
        banlistCards.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: var(--spacing-lg);">No banned cards yet.</p>';
      }
    } else {
      console.error('banlist-cards element not found');
    }
    
    // Set up add card button
    const addCardBtn = document.getElementById('add-card-btn');
    console.log('Add card button element:', addCardBtn);
    if (addCardBtn) {
      addCardBtn.onclick = addToBanList;
    }
  } catch (err) {
    console.error('Error loading ban list:', err);
    const banlistError = document.getElementById('banlist-error');
    if (banlistError) {
      banlistError.textContent = 'Error loading ban list: ' + err.message;
      banlistError.classList.remove('hidden');
    }
  }
}

// Add card to ban list
async function addToBanList() {
  console.log('addToBanList called');
  const cardNameInput = document.getElementById('new-banned-card');
  const cardName = cardNameInput.value.trim();
  const banlistError = document.getElementById('banlist-error');
  
  console.log('Card name:', cardName);
  
  if (!cardName) {
    console.log('No card name entered');
    if (banlistError) {
      banlistError.textContent = 'Please enter a card name';
      banlistError.classList.remove('hidden');
    }
    return;
  }
  
  try {
    const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
    const banlistCollection = collection(db, 'banlist');
    const docRef = await addDoc(banlistCollection, {
      cardName: cardName,
      addedBy: currentUser.email,
      timestamp: new Date().toISOString()
    });
    
    console.log('Card added to ban list:', cardName, 'Doc ID:', docRef.id);
    if (banlistError) banlistError.classList.add('hidden');
    cardNameInput.value = '';
    await loadBanList(); // Reload the list
  } catch (err) {
    console.error('Error adding card:', err);
    if (banlistError) {
      banlistError.textContent = 'Error adding card: ' + err.message;
      banlistError.classList.remove('hidden');
    }
  }
}

// Remove card from ban list
async function removeFromBanList(cardId) {
  console.log('Removing card from ban list:', cardId);
  try {
    const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
    await deleteDoc(doc(db, 'banlist', cardId));
    console.log('Card removed from ban list successfully');
    await loadBanList(); // Reload the list
  } catch (err) {
    console.error('Error removing card:', err);
  }
}

// View deck modal
function viewDeck(playerData) {
  console.log('View deck called with data:', playerData);
  const modal = document.getElementById('deck-modal');
  const modalPlayerName = document.getElementById('modal-player-name');
  const modalVerificationCode = document.getElementById('modal-verification-code');
  const modalDeckContent = document.getElementById('modal-deck-content');
  
  if (modalPlayerName) modalPlayerName.textContent = playerData.playerName || 'Unknown';
  if (modalVerificationCode) modalVerificationCode.textContent = 'Code: ' + playerData.code;
  
  if (modalDeckContent) {
    const deckHTML = `
      <div style="margin-bottom: var(--spacing-lg);">
        <h3>Mainboard</h3>
        <div style="background: var(--bg-input); padding: var(--spacing-md); border-radius: var(--radius-md); max-height: 300px; overflow-y: auto;">
          <pre style="margin: 0; white-space: pre-wrap; word-break: break-word;">${playerData.mainboard || 'No mainboard data'}</pre>
        </div>
      </div>
      ${playerData.sideboard ? `
        <div>
          <h3>Sideboard</h3>
          <div style="background: var(--bg-input); padding: var(--spacing-md); border-radius: var(--radius-md); max-height: 300px; overflow-y: auto;">
            <pre style="margin: 0; white-space: pre-wrap; word-break: break-word;">${playerData.sideboard}</pre>
          </div>
        </div>
      ` : ''}
    `;
    modalDeckContent.innerHTML = deckHTML;
  }
  
  if (modal) {
    modal.classList.remove('hidden');
  }
}
