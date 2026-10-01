import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

const firebaseConfig = {
    apiKey: "AIzaSyCbrxhA75BhC5vaeCPeesj_jRvk_MKzRuY",
    authDomain: "passbar-d62a4.firebaseapp.com",
    projectId: "passbar-d62a4",
    storageBucket: "passbar-d62a4.firebasestorage.app",
    messagingSenderId: "603802271431",
    appId: "1:603802271431:web:5cacc896fde000a63188e2",
    measurementId: "G-LMFGSRC85Z"
};

const app = initializeApp(firebaseConfig);

export { app };