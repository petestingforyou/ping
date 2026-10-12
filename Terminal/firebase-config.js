
// =====================================================
// TERMINAL ROJA
// CONFIGURACIÓN DE FIREBASE
// Sin Firebase Authentication
// =====================================================

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// =====================================================
// CONFIGURACIÓN DEL PROYECTO FIREBASE
// =====================================================

const firebaseConfig = {
  apiKey: "AIzaSyC9rbh9MdCk14lN7yOKL-xi0OyWBE66C4U",
  authDomain: "portalface-4a55f.firebaseapp.com",
  projectId: "portalface-4a55f",
  storageBucket: "portalface-4a55f.firebasestorage.app",
  messagingSenderId: "467642648646",
  appId: "1:467642648646:web:e4c7ef63fd97e8a4636247"
};

// =====================================================
// INICIALIZAR FIREBASE Y FIRESTORE
// =====================================================

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
