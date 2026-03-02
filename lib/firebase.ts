import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyC5uxT0E3gkjhxGgMGfwZV2t8NH626nlqg",
  authDomain: "scriptv2-92ba3.firebaseapp.com",
  databaseURL: "https://scriptv2-92ba3-default-rtdb.firebaseio.com",
  projectId: "scriptv2-92ba3",
  storageBucket: "scriptv2-92ba3.firebasestorage.app",
  messagingSenderId: "256429010558",
  appId: "1:256429010558:web:61dc70c135c68849f8722f",
  measurementId: "G-9FWPYCLSR6",
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const db = getFirestore(app)
const auth = getAuth(app)

export { app, db, auth }
