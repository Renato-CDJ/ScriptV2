import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getAuth, type Auth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyC5uxT0E3gkjhxGgMGfwZV2t8NH626nlqg",
  authDomain: "scriptv2-92ba3.firebaseapp.com",
  databaseURL: "https://scriptv2-92ba3-default-rtdb.firebaseio.com",
  projectId: "scriptv2-92ba3",
  storageBucket: "scriptv2-92ba3.firebasestorage.app",
  messagingSenderId: "256429010558",
  appId: "1:256429010558:web:61dc70c135c68849f8722f",
  measurementId: "G-9FWPYCLSR6"
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
