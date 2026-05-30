import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "its-my-cutlist",
  appId: "1:245613960327:web:36f575a2f485675f8cec22",
  storageBucket: "its-my-cutlist.firebasestorage.app",
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyForStaticPrerendering",
  authDomain: "its-my-cutlist.firebaseapp.com",
  messagingSenderId: "245613960327",
};

// Initialize Firebase for Next.js SSR / Client Compatibility
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
