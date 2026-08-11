import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBRL9L_KEhYKEMoReaI_svzPJX8ggoWREs",
    authDomain: "caducad.firebaseapp.com",
    projectId: "caducad",
    storageBucket: "caducad.firebasestorage.app",
    messagingSenderId: "277782622238",
    appId: "1:277782622238:web:b0fd8e2ee647bda430be0f",
    measurementId: "G-9LVYW7WCK8"
};


// Inicializar Firebase
const app = initializeApp(firebaseConfig);


// Inicializar Firestore
const db = getFirestore(app);


// Exportar la conexión
export { db };