import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getAnalytics, isSupported } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyB1Ys-2gMkMa4QNN3s8lkSDtrSpKQcT2LA",
  authDomain: "banco-de-dados-roteiro.firebaseapp.com",
  projectId: "banco-de-dados-roteiro",
  storageBucket: "banco-de-dados-roteiro.firebasestorage.app",
  messagingSenderId: "845018804492",
  appId: "1:845018804492:web:0a502e1be5f015abadd929",
  measurementId: "G-YJWTK2GSTH",
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const db = getFirestore(app)
const auth = getAuth(app)

// Initialize Analytics (client-side only)
if (typeof window !== "undefined") {
  isSupported().then((yes) => yes && getAnalytics(app))
}

export { app, db, auth }
