import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if credentials are placeholders
const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY_HERE';

let app;
let auth: any = null;
const googleProvider = new GoogleAuthProvider();

// Apply prompt settings to provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log("Firebase Client SDK initialized successfully.");
  } catch (error) {
    console.error("Error initializing Firebase Client SDK:", error);
  }
} else {
  console.warn("=========================================================");
  console.warn("Firebase Client SDK: NOT CONFIGURED!");
  console.warn("Please update the placeholders in your .env file with your");
  console.warn("actual Firebase Web Configuration details.");
  console.warn("=========================================================");
}

export { auth, googleProvider, isConfigured };
