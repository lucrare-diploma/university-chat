import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyAmJ8gw9ZA3D4ITNijnQlGRMXjvYUvlDBo",
    authDomain: "university-chat-77fd4.firebaseapp.com",
    projectId: "university-chat-77fd4",
    storageBucket: "university-chat-77fd4.firebasestorage.app",
    messagingSenderId: "182911019739",
    appId: "1:182911019739:web:d277d0986d0528bc263afe",
    measurementId: "G-50CPV23VTE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, rtdb, googleProvider };