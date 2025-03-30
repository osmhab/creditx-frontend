// src/firebase-config.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBkt8CB5Q3vVbxXOEtLksL0Ivjzif84vW4",
  authDomain: "creditx-f3f28.firebaseapp.com",
  projectId: "creditx-f3f28",
  storageBucket: "creditx-f3f28.firebasestorage.app",
  messagingSenderId: "189422511437",
  appId: "1:189422511437:web:574ccf7e42a5b8791a8304"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, storage, auth };
