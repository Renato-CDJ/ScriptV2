import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getDatabase } from "firebase/database"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyBwarqykZQ4VHB0l8L_pdCCSdBc2udbiRE",
  authDomain: "novobanco-4faec.firebaseapp.com",
  databaseURL: "https://novobanco-4faec-default-rtdb.firebaseio.com",
  projectId: "novobanco-4faec",
  storageBucket: "novobanco-4faec.firebasestorage.app",
  messagingSenderId: "630155665336",
  appId: "1:630155665336:web:cb9d816a5721d477ba794d",
  measurementId: "G-78JL5WNPC4",
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const db = getFirestore(app)
const realtimeDb = getDatabase(app)
const auth = getAuth(app)

export { app, db, realtimeDb, auth }
