
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBEOpWfqUtnh_lGoK6v7_OgDepZbdJuupk",
  authDomain: "hauler-e13ea.firebaseapp.com",
  projectId: "hauler-e13ea",
  storageBucket: "hauler-e13ea.firebasestorage.app",
  messagingSenderId: "409478999417",
  appId: "1:409478999417:web:42ea6ad103b05939be93a8",
  measurementId: "G-EMT6QQHNVK"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
