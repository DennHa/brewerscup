import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { db } from './firebase-config.js';

console.log('Admin.js loading...');

const auth = getAuth();
let currentUser = null;
let tournaments = [];
let tournamentMap = new Map();
let allPlayers = [];
let selectedTournamentId = 'all';

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

// Hamburger Menu Toggle
document.addEventListener('DOMContentLoaded', () => {
  // Setup hamburger menu
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-menu .nav-link');

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
    });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (menuToggle) menuToggle.classList.remove('active');
      if (navMenu) navMenu.classList.remove('active');
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar') && navMenu && navMenu.classList.contains('active')) {
      menuToggle.classList.remove('active');
      navMenu.classList.remove('active');
    }
  });

  // Admin page specific setup
  console.log('Admin page DOMContentLoaded');
  const loginBtn = document.getElementById('admin-login-btn');
  const logoutBtn = document.getElementById('logout-admin-btn');
  const logoutBtnMobile = document.getElementById('logout-admin-btn-mobile');
  const createTournamentBtn = document.getElementById('create-tournament-btn');
  const tournamentFilter = document.getElementById('tournament-filter');
  const exportPlayersBtn = document.getElementById('export-players-btn');
  
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
  if (logoutBtnMobile) {
    logoutBtnMobile.addEventListener('click', handleLogout);
  }
  if (createTournamentBtn) {
    createTournamentBtn.addEventListener('click', createTournament);
  }
  if (tournamentFilter) {
    tournamentFilter.addEventListener('change', (e) => {
      selectedTournamentId = e.target.value;
      renderPlayers();
    });
  }
  if (exportPlayersBtn) {
    exportPlayersBtn.addEventListener('click', exportPlayersToText);
  }

  // Tournament delete modal buttons
  const cancelTournamentDeleteBtn = document.getElementById('cancel-tournament-delete-btn');
  const confirmTournamentDeleteBtn = document.getElementById('confirm-tournament-delete-btn');
  if (cancelTournamentDeleteBtn) {
    cancelTournamentDeleteBtn.addEventListener('click', hideTournamentDeleteModal);
  }
  if (confirmTournamentDeleteBtn) {
    confirmTournamentDeleteBtn.addEventListener('click', confirmDeleteTournament);
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
  const logoutBtnMobile = document.getElementById('logout-admin-btn-mobile');
  
  if (loginSection) loginSection.classList.add('hidden');
  if (adminSection) adminSection.classList.remove('hidden');
  if (logoutBtn) logoutBtn.style.display = 'block';
  if (logoutBtnMobile) logoutBtnMobile.style.display = 'block';
  
  console.log('Admin dashboard shown for user: ' + currentUser.email);
  
  // Set up tab switching
  setupTabs();

  // Load tournaments, then players list
  loadTournaments().then(() => {
    loadPlayers();
  });
}

// Setup tab switching
function setupTabs() {
  const playersTabBtn = document.getElementById('players-tab-btn');
  const banlistTabBtn = document.getElementById('banlist-tab-btn');
  const tournamentsTabBtn = document.getElementById('tournaments-tab-btn');
  const playersTab = document.getElementById('players-tab');
  const banlistTab = document.getElementById('banlist-tab');
  const tournamentsTab = document.getElementById('tournaments-tab');
  
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
  if (tournamentsTab) {
    tournamentsTab.classList.add('hidden');
    tournamentsTab.classList.remove('active');
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
      if (tournamentsTab) {
        tournamentsTab.classList.add('hidden');
        tournamentsTab.classList.remove('active');
      }
      if (playersTabBtn) playersTabBtn.classList.remove('active');
      banlistTabBtn.classList.add('active');
      if (tournamentsTabBtn) tournamentsTabBtn.classList.remove('active');
      
      loadBanList();
    });
  }

  if (tournamentsTabBtn) {
    tournamentsTabBtn.addEventListener('click', () => {
      console.log('Tournaments tab clicked');
      if (playersTab) {
        playersTab.classList.add('hidden');
        playersTab.classList.remove('active');
      }
      if (banlistTab) {
        banlistTab.classList.add('hidden');
        banlistTab.classList.remove('active');
      }
      if (tournamentsTab) {
        tournamentsTab.classList.remove('hidden');
        tournamentsTab.classList.add('active');
      }
      if (playersTabBtn) playersTabBtn.classList.remove('active');
      if (banlistTabBtn) banlistTabBtn.classList.remove('active');
      tournamentsTabBtn.classList.add('active');

      renderTournamentsList();
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
    
    allPlayers = players;
    renderPlayers();
  } catch (err) {
    console.error('Error loading players:', err);
    const playersList = document.getElementById('players-list');
    if (playersList) {
      playersList.innerHTML = `<p style="color: var(--danger);">Error loading players: ${err.message}</p>`;
    }
  }
}

function getTournamentLabel(player) {
  const tournamentId = player.tournamentId || 'default';
  return tournamentMap.get(tournamentId) || (tournamentId === 'default' ? 'Default' : tournamentId);
}

function renderPlayers() {
  const playersList = document.getElementById('players-list');
  const playerCount = document.getElementById('player-count');

  if (!playersList || !playerCount) return;

  const filteredPlayers = selectedTournamentId === 'all'
    ? allPlayers
    : allPlayers.filter(player => (player.tournamentId || 'default') === selectedTournamentId);

  // Sort by submission time (oldest first)
  filteredPlayers.sort((a, b) => {
    const timeA = a.timestamp?.seconds || 0;
    const timeB = b.timestamp?.seconds || 0;
    return timeA - timeB;
  });

  // Sort by submission time (oldest first)
  filteredPlayers.sort((a, b) => {
    const timeA = a.timestamp?.seconds || 0;
    const timeB = b.timestamp?.seconds || 0;
    return timeA - timeB;
  });

  if (filteredPlayers.length === 0) {
    playerCount.textContent = selectedTournamentId === 'all'
      ? 'No submissions yet'
      : 'No submissions for this tournament';
    playersList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: var(--spacing-lg);">No player submissions found.</p>';
    return;
  }

  playerCount.textContent = `Total: ${filteredPlayers.length} deck(s)`;

  const htmlContent = filteredPlayers.map((player, idx) => {
    // Format timestamp - handle both Firestore timestamp objects and Date strings
    let timeStr = 'Unknown';
    if (player.timestamp) {
      if (player.timestamp.seconds) {
        const date = new Date(player.timestamp.seconds * 1000);
        timeStr = date.toLocaleString();
      } else if (typeof player.timestamp === 'string') {
        const date = new Date(player.timestamp);
        timeStr = date.toLocaleString();
      } else if (player.timestamp instanceof Date) {
        timeStr = player.timestamp.toLocaleString();
      }
    }

    const statusIcon = player.status === 'approved' ? '✅' : player.status === 'pending' ? '⏳' : '❌';
    const validityIcon = player.isValid ? '✓' : '✗';
    const banListIcon = player.banListValid ? '✓' : '✗';
    const tournamentLabel = getTournamentLabel(player);

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
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.25rem;">🏷️ Tournament: <strong>${tournamentLabel}</strong></p>
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

  playersList.innerHTML = htmlContent;

  const viewDeckBtns = playersList.querySelectorAll('.view-deck-btn');
  viewDeckBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      viewDeck(filteredPlayers[idx]);
    });
  });

  const deleteBtns = playersList.querySelectorAll('.delete-deck-btn');
  deleteBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      deleteDeck(filteredPlayers[idx]);
    });
  });

  const modalCloseBtn = document.getElementById('modal-close-btn');
  if (modalCloseBtn) {
    modalCloseBtn.onclick = () => {
      const modal = document.getElementById('deck-modal');
      if (modal) modal.classList.add('hidden');
    };
  }
}

async function loadTournaments() {
  try {
    const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
    const tournamentsCollection = collection(db, 'tournaments');
    const snapshot = await getDocs(tournamentsCollection);

    tournaments = [];
    tournamentMap = new Map();

    tournaments.push({ id: 'default', name: 'Default' });
    tournamentMap.set('default', 'Default');

    snapshot.forEach((doc) => {
      const data = doc.data();
      tournaments.push({ id: doc.id, ...data });
      tournamentMap.set(doc.id, data.name || doc.id);
    });

    renderTournamentFilter();
    renderTournamentsList();
  } catch (error) {
    console.error('Error loading tournaments:', error);
  }
}

function renderTournamentFilter() {
  const tournamentFilter = document.getElementById('tournament-filter');
  if (!tournamentFilter) return;

  const options = [
    { id: 'all', name: 'All tournaments' },
    ...tournaments
  ];

  tournamentFilter.innerHTML = options.map(option => (
    `<option value="${option.id}">${option.name}</option>`
  )).join('');

  tournamentFilter.value = selectedTournamentId;
}

function getBaseUrl() {
  const path = window.location.pathname.replace(/\/admin\.html.*$/, '/');
  return `${window.location.origin}${path}`;
}

function renderTournamentsList() {
  const listEl = document.getElementById('tournaments-list');
  if (!listEl) return;

  const filtered = tournaments.filter(t => t.id !== 'default');
  if (filtered.length === 0) {
    listEl.innerHTML = '<p style="color: var(--text-muted);">No tournaments created yet.</p>';
    return;
  }

  const baseUrl = getBaseUrl();
  listEl.innerHTML = filtered.map((tournament, idx) => {
    // Use query parameter format for compatibility with local dev servers
    const link = `${baseUrl}index.html?t=${encodeURIComponent(tournament.id)}`;
    return `
      <div style="padding: var(--spacing-sm) 0; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
        <div style="flex: 1;">
          <div style="font-weight: 600;">${tournament.name || tournament.id}</div>
          <div style="font-size: 0.85rem; color: var(--text-muted);">
            <a href="${link}" target="_blank" style="color: var(--primary);">${link}</a>
          </div>
        </div>
        <button class="btn btn-danger delete-tournament-btn" data-tournament-idx="${idx}" style="font-size: 0.85rem; background: var(--danger); color: white; padding: 0.4rem 0.8rem;">🗑️ Delete</button>
      </div>
    `;
  }).join('');

  // Attach delete button listeners
  const deleteBtns = listEl.querySelectorAll('.delete-tournament-btn');
  deleteBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.tournamentIdx);
      showTournamentDeleteModal(filtered[idx]);
    });
  });
}

function exportPlayersToText() {
  const filteredPlayers = selectedTournamentId === 'all'
    ? allPlayers
    : allPlayers.filter(player => (player.tournamentId || 'default') === selectedTournamentId);

  // Sort by submission time (oldest first)
  filteredPlayers.sort((a, b) => {
    const timeA = a.timestamp?.seconds || 0;
    const timeB = b.timestamp?.seconds || 0;
    return timeA - timeB;
  });

  if (filteredPlayers.length === 0) {
    alert('No players to export');
    return;
  }

  let text = '';
  const tournamentName = selectedTournamentId === 'all' 
    ? 'All Tournaments'
    : tournamentMap.get(selectedTournamentId) || selectedTournamentId;

  text += `Brewers Cup - ${tournamentName}\n`;
  text += `Exported: ${new Date().toLocaleString()}\n`;
  text += `Total Players: ${filteredPlayers.length}\n`;
  text += `${'='.repeat(80)}\n\n`;

  filteredPlayers.forEach((player, idx) => {
    text += `${idx + 1}. ${player.playerName || 'Unknown'}\n`;
    text += `   Code: ${player.verificationCode || 'N/A'}\n`;
    text += `   Email: ${player.email || 'Not provided'}\n`;
    text += `   Tournament: ${getTournamentLabel(player)}\n`;
    text += `   Valid: ${player.isValid ? 'Yes' : 'No'} | Ban List: ${player.banListValid ? 'Yes' : 'No'} | Pauper Legal: ${player.pauperValid ? 'Yes' : 'No'}\n`;
    
    if (player.timestamp) {
      let timeStr = 'Unknown';
      if (player.timestamp.seconds) {
        const date = new Date(player.timestamp.seconds * 1000);
        timeStr = date.toLocaleString();
      }
      text += `   Submitted: ${timeStr}\n`;
    }

    // Mainboard
    if (player.mainboard && player.mainboard.length > 0) {
      text += `\n   MAINBOARD (${player.mainboardSize || 0} cards):\n`;
      player.mainboard.forEach(card => {
        text += `   ${card.quantity}x ${card.name}\n`;
      });
    }

    // Sideboard
    if (player.sideboard && player.sideboard.length > 0) {
      text += `\n   SIDEBOARD (${player.sideboardSize || 0} cards):\n`;
      player.sideboard.forEach(card => {
        text += `   ${card.quantity}x ${card.name}\n`;
      });
    }

    // Banned/Illegal cards warnings
    if (player.bannedCards && player.bannedCards.length > 0) {
      text += `\n   ⚠️ BANNED CARDS: ${player.bannedCards.map(c => c.name).join(', ')}\n`;
    }
    if (player.pauperIllegalCards && player.pauperIllegalCards.length > 0) {
      text += `   ⚠️ PAUPER ILLEGAL: ${player.pauperIllegalCards.join(', ')}\n`;
    }

    text += `\n${'-'.repeat(80)}\n\n`;
  });

  // Create download
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const filename = `brewers-cup-${selectedTournamentId}-${new Date().toISOString().split('T')[0]}.txt`;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

let tournamentToDelete = null;

function showTournamentDeleteModal(tournament) {
  tournamentToDelete = tournament;
  const modal = document.getElementById('tournament-delete-modal');
  const textEl = document.getElementById('tournament-delete-text');
  const confirmInput = document.getElementById('tournament-delete-confirm');
  const confirmBtn = document.getElementById('confirm-tournament-delete-btn');

  if (textEl) {
    textEl.textContent = `Are you sure you want to delete "${tournament.name || tournament.id}"?`;
  }
  if (confirmInput) {
    confirmInput.value = '';
    confirmInput.oninput = () => {
      if (confirmBtn) {
        confirmBtn.disabled = confirmInput.value.toLowerCase() !== 'delete';
      }
    };
  }
  if (confirmBtn) {
    confirmBtn.disabled = true;
  }

  if (modal) modal.classList.remove('hidden');
}

function hideTournamentDeleteModal() {
  const modal = document.getElementById('tournament-delete-modal');
  if (modal) modal.classList.add('hidden');
  tournamentToDelete = null;
}

async function confirmDeleteTournament() {
  if (!tournamentToDelete) return;

  const confirmInput = document.getElementById('tournament-delete-confirm');
  if (confirmInput?.value.toLowerCase() !== 'delete') {
    alert('Please type "delete" to confirm.');
    return;
  }

  try {
    const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
    const tournamentRef = doc(db, 'tournaments', tournamentToDelete.id);
    await deleteDoc(tournamentRef);

    hideTournamentDeleteModal();
    await loadTournaments();
    renderPlayers();
  } catch (error) {
    console.error('Error deleting tournament:', error);
    alert(`Failed to delete tournament: ${error.message}`);
  }
}

function slugifyTournamentName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function createTournament() {
  const nameInput = document.getElementById('new-tournament-name');
  const statusEl = document.getElementById('tournament-create-status');
  if (!nameInput) return;

  const name = nameInput.value.trim();
  if (!name) {
    if (statusEl) {
      statusEl.textContent = 'Please enter a tournament name.';
      statusEl.classList.add('alert-error');
      statusEl.classList.remove('hidden');
    }
    return;
  }

  const slug = slugifyTournamentName(name);
  if (!slug) {
    if (statusEl) {
      statusEl.textContent = 'Tournament name is not valid for a URL.';
      statusEl.classList.add('alert-error');
      statusEl.classList.remove('hidden');
    }
    return;
  }

  try {
    const { doc, getDoc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
    const tournamentRef = doc(db, 'tournaments', slug);
    const existing = await getDoc(tournamentRef);
    if (existing.exists()) {
      if (statusEl) {
        statusEl.textContent = 'A tournament with this name already exists.';
        statusEl.classList.add('alert-error');
        statusEl.classList.remove('hidden');
      }
      return;
    }

    await setDoc(tournamentRef, {
      name,
      slug,
      createdAt: serverTimestamp()
    });

    if (statusEl) {
      statusEl.textContent = 'Tournament created successfully.';
      statusEl.classList.remove('hidden');
      statusEl.classList.remove('alert-error');
    }

    nameInput.value = '';
    await loadTournaments();
    renderPlayers();
  } catch (error) {
    console.error('Error creating tournament:', error);
    if (statusEl) {
      statusEl.textContent = `Failed to create tournament: ${error.message}`;
      statusEl.classList.add('alert-error');
      statusEl.classList.remove('hidden');
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
