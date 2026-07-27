// js/firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyBxhghVcFR_F5g0qVVK7vfe93pq6z9NYow",
  authDomain: "registrosretiros.firebaseapp.com",
  projectId: "registrosretiros",
  storageBucket: "registrosretiros.firebasestorage.app",
  messagingSenderId: "468477645708",
  appId: "1:468477645708:web:6c30248ebb4f41d02e3ca9"
};


// Inicializar Firebase
const app = initializeApp(firebaseConfig);


// Conectar con Firestore
export const db = getFirestore(app);