import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyBH6Zrnkn0SVA2t4-56EJd02mJXRPM66EM",
  authDomain: "scriptv2-f0f7f.firebaseapp.com",
  projectId: "scriptv2-f0f7f",
  storageBucket: "scriptv2-f0f7f.firebasestorage.app",
  messagingSenderId: "565324216652",
  appId: "1:565324216652:web:432748016f06b169b437e9",
  measurementId: "G-TBV385KG5S",
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)
const auth = getAuth(app)

// Initialize Analytics only on client-side
let analytics
if (typeof window !== "undefined") {
  analytics = getAnalytics(app)
}

export { app, db, auth, analytics }
