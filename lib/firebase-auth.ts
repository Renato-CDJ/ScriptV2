import { auth, db, firebaseConfig } from "./firebase"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getAuth,
  type User as FirebaseUser,
} from "firebase/auth"
import { initializeApp, getApp } from "firebase/app"
import { doc, getDoc, setDoc, updateDoc, Timestamp, collection, query, where, getDocs } from "firebase/firestore"
import type { User } from "./types"

export async function authenticateWithFirebase(usernameOrEmail: string, password: string): Promise<User | null> {
  try {
    console.log("[v0] Attempting Firebase authentication for:", usernameOrEmail)

    let email = usernameOrEmail
    let user: User | null = null

    // Se não for um email, tentar buscar o email pelo username
    if (!usernameOrEmail.includes("@")) {
      console.log("[v0] Username detected, searching for corresponding email")
      try {
        const usernamesRef = collection(db, "usernames")
        const q = query(usernamesRef, where("username", "==", usernameOrEmail))
        const snapshot = await getDocs(q)

        if (!snapshot.empty) {
          email = snapshot.docs[0].data().email
          console.log("[v0] Found email for username:", usernameOrEmail)
        } else {
          console.log("[v0] Username not found in Firestore, trying default domain fallback")
          email = `${usernameOrEmail}@scriptv2.local`
        }
      } catch (error) {
        console.log("[v0] Error looking up username, will try as email:", error)
        // If there's a permission error, treat it as email and let Firebase Auth handle it
        email = `${usernameOrEmail}@scriptv2.local`
      }
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log("[v0] Firebase auth successful for:", email)

      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid))

      if (userDoc.exists()) {
        const userData = userDoc.data()

        await updateDoc(doc(db, "users", userCredential.user.uid), {
          lastLoginAt: Timestamp.fromDate(new Date()),
        })

        user = {
          id: userDoc.id,
          username: userData.username || usernameOrEmail,
          email: userData.email,
          fullName: userData.name || userData.fullName || "Unknown User",
          role: userData.role,
          isActive: userData.isActive !== false,
          createdAt: userData.createdAt?.toDate?.() || new Date(),
          lastLoginAt: new Date(),
        }

        console.log("[v0] User authenticated successfully:", user.username)
        return user
      } else {
        console.log("[v0] User document not found in Firestore, but Firebase Auth succeeded")
        // If user exists in Firebase Auth but not in Firestore, return a basic user object
        return {
          id: userCredential.user.uid,
          username: usernameOrEmail,
          email: userCredential.user.email || email,
          fullName: userCredential.user.displayName || "Unknown User",
          role: "operator",
          isActive: true,
          createdAt: new Date(),
        }
      }
    } catch (authError: any) {
      console.error("[v0] Firebase Auth error:", authError.code)

      if (authError.code === "auth/user-not-found") {
        console.log("[v0] User email not found in Firebase Auth")
        return null
      }

      if (authError.code === "auth/wrong-password") {
        console.log("[v0] Wrong password provided")
        return null
      }

      if (authError.code === "auth/invalid-email") {
        console.log("[v0] Invalid email format")
        return null
      }

      // For other errors, log and return null
      console.error("[v0] Unexpected auth error:", authError.message)
      return null
    }
  } catch (error: any) {
    console.error("[v0] Firebase authentication error:", error)
    return null
  }
}

export async function createFirebaseUser(userData: {
  username: string
  email: string
  password: string
  name: string
  role: "admin" | "operator"
}): Promise<User> {
  try {
    console.log("[v0] Creating user in Firebase Auth:", userData.email)

    let secondaryApp
    try {
      secondaryApp = getApp("SecondaryApp")
    } catch (e) {
      secondaryApp = initializeApp(firebaseConfig, "SecondaryApp")
    }

    const secondaryAuth = getAuth(secondaryApp)
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, userData.email, userData.password)

    // Criar documento do usuário no Firestore
    const user: Omit<User, "id"> = {
      username: userData.username,
      email: userData.email,
      fullName: userData.name,
      role: userData.role,
      isActive: true,
      createdAt: new Date(),
    }

    await setDoc(doc(db, "users", userCredential.user.uid), {
      ...user,
      name: userData.name,
      createdAt: Timestamp.fromDate(new Date()),
    })

    try {
      await setDoc(doc(db, "usernames", userData.username), {
        username: userData.username,
        email: userData.email,
        userId: userCredential.user.uid,
      })
      console.log("[v0] Username mapping created:", userData.username)
    } catch (error) {
      console.warn("[v0] Could not create username mapping:", error)
      // Don't fail if username mapping fails
    }

    console.log("[v0] User created successfully in Firestore")

    await signOut(secondaryAuth)

    return {
      ...user,
      id: userCredential.user.uid,
    }
  } catch (error: any) {
    console.error("[v0] Error creating user:", error)

    // Mensagens de erro mais amigáveis
    if (error.code === "auth/email-already-in-use") {
      throw new Error(
        `O usuário '${userData.username}' já existe no sistema de autenticação. Como não é possível excluir usuários permanentemente sem acesso administrativo ao backend, por favor escolha um nome de usuário diferente.`,
      )
    }
    if (error.code === "auth/weak-password") {
      throw new Error("A senha deve ter pelo menos 6 caracteres")
    }
    if (error.code === "auth/invalid-email") {
      throw new Error("Email inválido")
    }

    throw error
  }
}

export async function logoutFirebase(): Promise<void> {
  try {
    await signOut(auth)
    console.log("[v0] User logged out")
  } catch (error) {
    console.error("[v0] Error logging out:", error)
    throw error
  }
}

export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      try {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))

        if (userDoc.exists()) {
          const userData = userDoc.data()
          const user: User = {
            id: userDoc.id,
            username: userData.username,
            email: userData.email,
            fullName: userData.name || userData.fullName || "Unknown User",
            role: userData.role,
            isActive: userData.isActive !== false,
            createdAt: userData.createdAt?.toDate?.() || new Date(),
            lastLoginAt: userData.lastLoginAt?.toDate?.() || undefined,
          }
          callback(user)
        } else {
          // If user exists in Firebase Auth but not in Firestore
          const user: User = {
            id: firebaseUser.uid,
            username: firebaseUser.displayName || "unknown",
            email: firebaseUser.email || "",
            fullName: firebaseUser.displayName || "Unknown User",
            role: "operator",
            isActive: true,
            createdAt: new Date(),
          }
          callback(user)
        }
      } catch (error) {
        console.error("[v0] Error loading user data:", error)
        callback(null)
      }
    } else {
      callback(null)
    }
  })
}
