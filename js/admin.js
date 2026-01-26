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
}
