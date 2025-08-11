// src/firebase-config.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyBkt8CB5Q3vVbxXOEtLksL0Ivjzif84vW4",
  authDomain: "creditx-f3f28.firebaseapp.com",
  projectId: "creditx-f3f28",
  storageBucket: "creditx-f3f28.firebasestorage.app",
  messagingSenderId: "189422511437",
  appId: "1:189422511437:web:574ccf7e42a5b8791a8304"
};

if (process.env.NODE_ENV === "development") {
  // Token de debug App Check pour le dev local
  // eslint-disable-next-line no-undef
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = "creditx-local-debug";
}

const app = initializeApp(firebaseConfig);

// ⚠️ App Check (reCAPTCHA v3)
// Mettre la clé SITE d’App Check dans le .env du FRONT : REACT_APP_RECAPTCHA_V3_SITE_KEY=xxxx
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(process.env.REACT_APP_RECAPTCHA_V3_SITE_KEY),
  isTokenAutoRefreshEnabled: true,
});

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, storage, auth };
