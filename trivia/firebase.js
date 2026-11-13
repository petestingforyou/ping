
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

/* =========================================
   CONFIGURACIÓN FIREBASE
========================================= */

const firebaseConfig = {
    apiKey: "AIzaSyA1RF-fjgtcODSGHDxcByOrpraNm4ASABA",
    authDomain: "triviaonline-cf8ac.firebaseapp.com",
    projectId: "triviaonline-cf8ac",
    storageBucket: "triviaonline-cf8ac.firebasestorage.app",
    messagingSenderId: "1087950514374",
    appId: "1:1087950514374:web:7cc458397441ec5a0c8fc7"
};

/* =========================================
   INICIALIZAR FIREBASE
========================================= */

const app = initializeApp(firebaseConfig);

/* =========================================
   INICIALIZAR FIRESTORE
========================================= */

const db = getFirestore(app);

/* =========================================
   EXPORTAR CONEXIONES
========================================= */

export { app, db };
