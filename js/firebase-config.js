import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCyGi3CcUWBPSyaSbAyCaTyNZNzpLWUqrU",
  authDomain: "brewerscup-77eaa.firebaseapp.com",
  projectId: "brewerscup-77eaa",
  storageBucket: "brewerscup-77eaa.firebasestorage.app",
  messagingSenderId: "744456728157",
  appId: "1:744456728157:web:0b2ddb1db643fb4c6ee7b4"
};

console.log('Firebase config module loading...');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('Firebase initialized successfully');

// Initialize Firestore
const db = getFirestore(app);
console.log('Firestore initialized successfully');

// Export for use in other modules
export { app, db };
