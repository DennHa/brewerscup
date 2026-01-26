import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { db } from './firebase-config.js';

const auth = getAuth();
let currentUser = null;

// Check if already logged in
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    showAdminDashboard();
  } else {
    showLoginForm();
  }
});

// Login form submission
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('admin-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
});

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log('Admin login successful');
  } catch (error) {
    console.error('Login failed:', error.message);
    alert('Login failed: ' + error.message);
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
  const container = document.getElementById('admin-container');
  if (container) {
    container.innerHTML = `
      <div class="admin-login">
        <h2>Admin Login</h2>
        <form id="admin-login-form">
          <input type="email" id="admin-email" placeholder="Email" required>
          <input type="password" id="admin-password" placeholder="Password" required>
          <button type="submit">Login</button>
        </form>
      </div>
    `;
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }
  }
}

function showAdminDashboard() {
  const container = document.getElementById('admin-container');
  if (container) {
    container.innerHTML = `
      <div class="admin-dashboard">
        <h2>Admin Dashboard</h2>
        <p>Logged in as: ${currentUser.email}</p>
        <button id="logout-btn">Logout</button>
        <!-- Add your admin features here -->
      </div>
    `;
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }
  }
}
