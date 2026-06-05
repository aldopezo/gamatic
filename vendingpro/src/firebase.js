// src/firebase.js
// ─────────────────────────────────────────────────────────────────────────────
// INSTRUCCIONES: Reemplaza los valores de abajo con los de TU proyecto Firebase
// Los encuentras en: Firebase Console → Tu proyecto → Configuración → Aplicaciones web
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAiaZSf-2XTspGxUOm4n8NIgptQbhPQ_Zw",
  authDomain: "gamatic-8b1e1.firebaseapp.com",
  databaseURL: "https://gamatic-8b1e1-default-rtdb.firebaseio.com",
  projectId: "gamatic-8b1e1",
  storageBucket: "gamatic-8b1e1.firebasestorage.app",
  messagingSenderId: "745573846023",
  appId: "1:745573846023:web:613168aa01ea7e886f2ea2"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
