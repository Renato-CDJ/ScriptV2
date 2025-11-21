import { auth, db } from "./firebase"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore"
import type { User } from "./types"

export async function authenticateWithFirebase(usernameOrEmail: string, password: string): Promise<User | null> {
  try {
    console.log("[v0] Attempting Firebase authentication for:", usernameOrEmail)

    let email = usernameOrEmail

    // Se não for um email, buscar o email pelo username
    if (!usernameOrEmail.includes("@")) {
      const userDoc = await getUserByUsername(usernameOrEmail)
      if (!userDoc) {
        console.log("[v0] User not found in Firestore")
        return null
      }
      email = userDoc.email
    }

    // Autenticar com Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log("[v0] Firebase auth successful")

    // Buscar dados do usuário no Firestore
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid))

    if (!userDoc.exists()) {
      console.log("[v0] User document not found in Firestore")
      return null
    }

    const userData = userDoc.data()

    // Atualizar lastLoginAt
    await updateDoc(doc(db, "users", userCredential.user.uid), {
      lastLoginAt: Timestamp.fromDate(new Date()),
    })

    const user: User = {
      id: userDoc.id,
      username: userData.username,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      isActive: userData.isActive,
      createdAt: userData.createdAt?.toDate?.() || new Date(),
      lastLoginAt: new Date(),
    }

    console.log("[v0] User data loaded:", user)
    return user
  } catch (error: any) {
    console.error("[v0] Firebase authentication error:", error)

    // Tratar erros específicos do Firebase
    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
      return null
    }

    throw error
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

    // Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password)

    // Criar documento do usuário no Firestore
    const user: Omit<User, "id"> = {
      username: userData.username,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      isActive: true,
      createdAt: new Date(),
    }

    await setDoc(doc(db, "users", userCredential.user.uid), {
      ...user,
      createdAt: Timestamp.fromDate(new Date()),
    })

    console.log("[v0] User created successfully in Firestore")

    return {
      ...user,
      id: userCredential.user.uid,
    }
  } catch (error: any) {
    console.error("[v0] Error creating user:", error)

    // Mensagens de erro mais amigáveis
    if (error.code === "auth/email-already-in-use") {
      throw new Error("Este email já está em uso")
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
      // Buscar dados do usuário no Firestore
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))

      if (userDoc.exists()) {
        const userData = userDoc.data()
        const user: User = {
          id: userDoc.id,
          username: userData.username,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          isActive: userData.isActive,
          createdAt: userData.createdAt?.toDate?.() || new Date(),
          lastLoginAt: userData.lastLoginAt?.toDate?.() || undefined,
        }
        callback(user)
      } else {
        callback(null)
      }
    } else {
      callback(null)
    }
  })
}

async function getUserByUsername(username: string): Promise<{ email: string } | null> {
  try {
    const { getUserByUsername: getUser } = await import("./firebase-service")
    const user = await getUser(username)
    return user ? { email: user.email } : null
  } catch (error) {
    console.error("[v0] Error getting user by username:", error)
    return null
  }
}
