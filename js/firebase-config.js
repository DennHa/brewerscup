/**
 * Firebase Configuration Module
 * 
 * This module initializes Firebase with the Web SDK (v9+ modular syntax)
 * Update the config object with your Firebase project credentials
 * 
 * How to get your Firebase config:
 * 1. Go to Firebase Console (https://console.firebase.google.com)
 * 2. Click your project
 * 3. Click Settings (gear icon) → Project Settings
 * 4. Scroll to "Your apps" section
 * 5. Click the Web icon (</>)
 * 6. Copy the config object
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

// FIREBASE CONFIGURATION - CONFIGURED ✅
// Your Brewers Cup Firebase project
const firebaseConfig = {
  apiKey: "AIzaSyCyGi3CcUWBPSyaSbAyCaTyNZNzpLWUqrU",
  authDomain: "brewerscup-77eaa.firebaseapp.com",
  projectId: "brewerscup-77eaa",
  storageBucket: "brewerscup-77eaa.firebasestorage.app",
  messagingSenderId: "744456728157",
  appId: "1:744456728157:web:0b2ddb1db643fb4c6ee7b4",
  measurementId: "G-K62BSTCLCV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Export the app for other modules
export default app;
