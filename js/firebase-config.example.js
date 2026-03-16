/**
 * Firebase Configuration Module - EXAMPLE
 * 
 * This module initializes Firebase with the Web SDK (v9+ modular syntax)
 * 
 * ⚠️ SETUP INSTRUCTIONS:
 * 1. Copy this file: cp js/firebase-config.example.js js/firebase-config.js
 * 2. Go to Firebase Console (https://console.firebase.google.com)
 * 3. Click your project
 * 4. Click Settings (gear icon) → Project Settings
 * 5. Scroll to "Your apps" section
 * 6. Click the Web icon (</>)
 * 7. Copy your firebaseConfig object
 * 8. Replace the firebaseConfig object below with your actual credentials
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

// FIREBASE CONFIGURATION - TODO: Update with your Firebase project credentials
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef1234567890"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
export const auth = getAuth(app);

console.log('✅ Firebase initialized with project:', firebaseConfig.projectId);
