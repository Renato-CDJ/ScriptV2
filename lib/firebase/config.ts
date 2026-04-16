import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getAuth, type Auth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyDsu7TC6Ao3uZWtPM4C_Ov45m5RiA4ptts",
  authDomain: "scriptv2-ac94d.firebaseapp.com",
  projectId: "scriptv2-ac94d",
  storageBucket: "scriptv2-ac94d.firebasestorage.app",
  messagingSenderId: "737031773482",
  appId: "1:737031773482:web:faa0b0340fb08d91f79253",
  measurementId: "G-NWCX42GQ26"
}

// Initialize Firebase (singleton pattern)
let app: FirebaseApp
let db: Firestore
let auth: Auth

function initializeFirebase() {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0]
  }
  
  db = getFirestore(app)
  auth = getAuth(app)
  
  return { app, db, auth }
}

// Lazy initialization
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    initializeFirebase()
  }
  return app
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    initializeFirebase()
  }
  return db
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    initializeFirebase()
  }
  return auth
}

// Export for direct access if needed
export { firebaseConfig }
