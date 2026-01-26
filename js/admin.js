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
  
  console.log('Setup tabs - players btn:', playersTabBtn);
  console.log('Setup tabs - banlist btn:', banlistTabBtn);
  console.log('Setup tabs - players tab:', playersTab);
  console.log('Setup tabs - banlist tab:', banlistTab);
  
  // Ensure players tab starts as active
  if (playersTabBtn) playersTabBtn.classList.add('active');
  if (banlistTabBtn) banlistTabBtn.classList.remove('active');
  if (playersTab) {
    playersTab.classList.remove('hidden');
    playersTab.classList.add('active');
  }
  if (banlistTab) {
    banlistTab.classList.add('hidden');
    banlistTab.classList.remove('active');
  }
  
  if (playersTabBtn) {
    playersTabBtn.addEventListener('click', () => {
      console.log('Players tab clicked');
      if (playersTab) {
        playersTab.classList.remove('hidden');
        playersTab.classList.add('active');
      }
      if (banlistTab) {
        banlistTab.classList.add('hidden');
        banlistTab.classList.remove('active');
      }
      playersTabBtn.classList.add('active');
      if (banlistTabBtn) banlistTabBtn.classList.remove('active');
    });
  }
  
  if (banlistTabBtn) {
    banlistTabBtn.addEventListener('click', () => {
      console.log('Ban list tab clicked');
      if (playersTab) {
        playersTab.classList.add('hidden');
        playersTab.classList.remove('active');
      }
      if (banlistTab) {
        banlistTab.classList.remove('hidden');
        banlistTab.classList.add('active');
      }
      if (playersTabBtn) playersTabBtn.classList.remove('active');
      banlistTabBtn.classList.add('active');
      
      loadBanList();
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
    
    console.log('Players loaded:', players.length, players);
    console.log('🔍 DEBUG: Full player data array:', JSON.stringify(players, null, 2));
    
    // Display players
    const playersList = document.getElementById('players-list');
    const playerCount = document.getElementById('player-count');
    
    console.log('Players list element:', playersList);
    console.log('Player count element:', playerCount);
    
    if (players.length > 0) {
      playerCount.textContent = `Total: ${players.length} deck(s)`;
      const htmlContent = players.map((player, idx) => {
        // Format timestamp - handle both Firestore timestamp objects and Date strings
        let timeStr = 'Unknown';
        if (player.timestamp) {
          if (player.timestamp.seconds) {
            // Firestore timestamp object
            const date = new Date(player.timestamp.seconds * 1000);
            timeStr = date.toLocaleString();
          } else if (typeof player.timestamp === 'string') {
            // ISO string
            const date = new Date(player.timestamp);
            timeStr = date.toLocaleString();
          } else if (player.timestamp instanceof Date) {
            timeStr = player.timestamp.toLocaleString();
          }
        }
        
        console.log(`🎴 CARD ${idx}: Player="${player.playerName}", Code="${player.verificationCode}", Status="${player.status}", Valid="${player.isValid}", TimeStr="${timeStr}"`);
        
        // Determine status icons
        const statusIcon = player.status === 'approved' ? '✅' : player.status === 'pending' ? '⏳' : '❌';
        const validityIcon = player.isValid ? '✓' : '✗';
        const banListIcon = player.banListValid ? '✓' : '✗';
        
        return `
          <div style="background: var(--bg-card); padding: var(--spacing-md); border-radius: var(--radius-md); margin-bottom: var(--spacing-md); border: 1px solid var(--border);">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                  <p style="font-weight: 700; color: var(--primary);">${player.playerName || 'Unknown'}</p>
                  <span style="font-size: 1rem;" title="Status: ${player.status}">${statusIcon}</span>
                  <span style="font-size: 0.8rem; color: ${player.isValid ? 'var(--success)' : 'var(--danger)'};" title="Deck Valid: ${player.isValid}">Legal ${validityIcon}</span>
                  <span style="font-size: 0.8rem; color: ${player.banListValid ? 'var(--success)' : 'var(--danger)'};" title="Ban List Valid: ${player.banListValid}">Banlist ${banListIcon}</span>
                </div>
                <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.25rem;">📋 Code: <strong>${player.verificationCode || 'N/A'}</strong></p>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;">📅 ${timeStr}</p>
              </div>
              <div style="text-align: right;">
                <button class="btn btn-secondary view-deck-btn" style="font-size: 0.85rem; margin-bottom: 0.5rem;" data-player-id="${idx}">View Deck</button>
                <button class="btn btn-danger delete-deck-btn" style="font-size: 0.85rem; background: var(--danger); color: white;" data-player-id="${idx}">Delete</button>
              </div>
            </div>
          </div>
        `;
      }).join('');
      
      console.log('📝 GENERATED HTML:', htmlContent);
      console.log('📝 HTML LENGTH:', htmlContent.length);
      console.log('🎯 About to set innerHTML on element:', playersList);
      console.log('🎯 playersList is null?', playersList === null);
      console.log('🎯 playersList classList:', playersList?.classList);
      
      playersList.innerHTML = htmlContent;
      
      console.log('✅ HTML set to playersList. Current innerHTML length:', playersList.innerHTML.length);
      console.log('✅ Current playersList content:', playersList.innerHTML.substring(0, 200), '...');
      
      // Double check - query the DOM directly for the cards
      const cardsInDOM = document.querySelectorAll('.players-list div[style*="background"]');
      console.log('🔍 Cards found in DOM after setting innerHTML:', cardsInDOM.length);
      cardsInDOM.forEach((card, i) => {
        console.log(`  Card ${i} text content:`, card.textContent.substring(0, 100));
      });
      
      console.log('Setting up button event listeners...');
      
      // Set up view deck buttons
      const viewDeckBtns = playersList.querySelectorAll('.view-deck-btn');
      console.log('View deck buttons found:', viewDeckBtns.length);
      viewDeckBtns.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
          console.log('View deck button clicked for player:', idx);
          viewDeck(players[idx]);
        });
      });
      
      // Set up delete buttons
      const deleteBtns = playersList.querySelectorAll('.delete-deck-btn');
      console.log('Delete buttons found:', deleteBtns.length);
      deleteBtns.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
          console.log('Delete button clicked for player:', idx);
          deleteDeck(players[idx]);
        });
      });
      
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
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
    
    // Get the banlist document from admin collection
    console.log('Getting document: admin/banlist');
    const banlistDoc = doc(db, 'admin', 'banlist');
    const docSnapshot = await getDoc(banlistDoc);
    
    console.log('Document exists:', docSnapshot.exists());
    
    const banlistData = docSnapshot.data();
    const cards = banlistData?.cards || [];
    
    console.log('Cards array length:', cards.length);
    
    const banlistCards = document.getElementById('banlist-cards');
    console.log('banlistCards element found:', !!banlistCards);
    
    if (banlistCards) {
      if (cards.length > 0) {
        console.log('Building HTML for', cards.length, 'cards...');
        
        // Render first 50 cards to avoid rendering too many at once
        const displayLimit = 50;
        const displayCards = cards.slice(0, displayLimit);
        
        const html = displayCards.map((cardName, idx) => `
          <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-card); padding: var(--spacing-md); border-radius: var(--radius-md); margin-bottom: var(--spacing-sm); border: 1px solid var(--border);">
            <span style="font-weight: 600; color: var(--primary);">${cardName}</span>
            <button class="btn btn-danger" style="font-size: 0.75rem; padding: 0.25rem 0.5rem; background: var(--danger); color: white;" onclick="removeFromBanList(${idx})">Remove</button>
          </div>
        `).join('');
        
        const message = cards.length > displayLimit ? `<p style="color: var(--text-muted); margin-bottom: var(--spacing-md);">Showing ${displayLimit} of ${cards.length} banned cards</p>` : '';
        
        const fullHtml = message + html;
        console.log('HTML length:', fullHtml.length);
        console.log('First 200 chars:', fullHtml.substring(0, 200));
        
        console.log('Setting innerHTML...');
        banlistCards.innerHTML = fullHtml;
        console.log('innerHTML set successfully');
        console.log('Element now contains:', banlistCards.children.length, 'child elements');
      } else {
        console.log('No banned cards found');
        banlistCards.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: var(--spacing-lg);">No banned cards yet.</p>';
      }
    } else {
      console.error('banlist-cards element not found!');
      // Try to find it
      const allDivs = document.querySelectorAll('[id*="banlist"]');
      console.log('Found elements with "banlist" in id:', allDivs);
    }
    
    // Set up add card button
    const addCardBtn = document.getElementById('add-card-btn');
    console.log('addCardBtn element found:', !!addCardBtn);
    if (addCardBtn) {
      console.log('Setting up add card button click handler');
      addCardBtn.onclick = addToBanList;
    }
  } catch (err) {
    console.error('Error loading ban list:', err);
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
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
    const { doc, updateDoc, arrayUnion } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
    const banlistDocRef = doc(db, 'admin', 'banlist');
    
    // Add card to the cards array
    await updateDoc(banlistDocRef, {
      cards: arrayUnion(cardName)
    });
    
    console.log('Card added to ban list:', cardName);
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
async function removeFromBanList(cardIndex) {
  console.log('Removing card at index:', cardIndex);
  try {
    const { doc, getDoc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
    const banlistDocRef = doc(db, 'admin', 'banlist');
    
    // Get current array
    const docSnapshot = await getDoc(banlistDocRef);
    const cards = docSnapshot.data()?.cards || [];
    
    // Remove card at index
    cards.splice(cardIndex, 1);
    
    // Update document with new array
    await updateDoc(banlistDocRef, {
      cards: cards
    });
    
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
    // Format mainboard list
    let mainboardText = '';
    if (playerData.mainboard && Array.isArray(playerData.mainboard)) {
      mainboardText = playerData.mainboard.map(card => `${card.quantity}x ${card.name}`).join('\n');
    } else if (playerData.decklist && Array.isArray(playerData.decklist)) {
      mainboardText = playerData.decklist.map(card => `${card.quantity}x ${card.name}`).join('\n');
    }
    
    // Format sideboard list
    let sideboardText = '';
    if (playerData.sideboard && Array.isArray(playerData.sideboard) && playerData.sideboard.length > 0) {
      sideboardText = playerData.sideboard.map(card => `${card.quantity}x ${card.name}`).join('\n');
    }
    
    const deckHTML = `
      <div style="margin-bottom: var(--spacing-lg);">
        <h3>Mainboard (${playerData.mainboardSize || 0} cards)</h3>
        <div style="background: var(--bg-input); padding: var(--spacing-md); border-radius: var(--radius-md); max-height: 300px; overflow-y: auto;">
          <pre style="margin: 0; white-space: pre-wrap; word-break: break-word; font-size: 0.9rem;">${mainboardText || 'No mainboard data'}</pre>
        </div>
      </div>
      ${sideboardText ? `
        <div>
          <h3>Sideboard (${playerData.sideboardSize || 0} cards)</h3>
          <div style="background: var(--bg-input); padding: var(--spacing-md); border-radius: var(--radius-md); max-height: 300px; overflow-y: auto;">
            <pre style="margin: 0; white-space: pre-wrap; word-break: break-word; font-size: 0.9rem;">${sideboardText}</pre>
          </div>
        </div>
      ` : ''}
    `;
    modalDeckContent.innerHTML = deckHTML;
  }
  
  if (modal) {
    modal.classList.remove('hidden');
    console.log('Deck modal opened');
  }
}

// Delete deck
async function deleteDeck(playerData) {
  console.log('Delete deck called for:', playerData.playerName);
  if (!confirm(`Delete deck from ${playerData.playerName}?`)) {
    return;
  }
  
  try {
    const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
    await deleteDoc(doc(db, 'decks', playerData.id));
    console.log('Deck deleted successfully');
    await loadPlayers(); // Reload the list
  } catch (err) {
    console.error('Error deleting deck:', err);
    alert('Error deleting deck: ' + err.message);
  }
}
