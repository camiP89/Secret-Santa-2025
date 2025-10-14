// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database"; // <-- ADD THIS IMPORT

// Your web app's Firebase configuration (this should be YOUR actual config)
const firebaseConfig = {
  apiKey: "AIzaSyAvvTujL98eqhMb4SuXu1j4lFPPLrFSNHc",
  authDomain: "secret-santa-251225.firebaseapp.com",
  projectId: "secret-santa-251225",
  storageBucket: "secret-santa-251225.firebasestorage.app",
  messagingSenderId: "393678981817",
  appId: "1:393678981817:web:90b62c2c28e5dc1d34a968",
  measurementId: "G-LMZ4LNGCBY",
  databaseURL: "https://secret-santa-251225-default-rtdb.firebaseio.com" // IMPORTANT: Ensure your databaseURL is correct
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app); // <-- INITIALIZE REALTIME DATABASE HERE

// Export the initialized app and any services you want to use elsewhere
export { app, analytics, database }; // <-- EXPORT THE 'database' INSTANCE




