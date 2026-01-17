import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAqdKANLhRHcRU-M-L7_Q-t2UoE61WorTo",
    authDomain: "pureair-4f610.firebaseapp.com",
    projectId: "pureair-4f610",
    storageBucket: "pureair-4f610.firebasestorage.app",
    messagingSenderId: "568653790271",
    appId: "1:568653790271:web:2cf88e66ff7df08492cc8a",
    measurementId: "G-V0S4ZH3C9M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;
