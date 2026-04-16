import {
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth"
import { getFirebaseAuth } from "./config"
import { 
  getDocument, 
  getCollection, 
  updateDocument, 
  COLLECTIONS,
  where,
  query,
  toFirestoreDate
} from "./firestore"
import type { User } from "@/lib/types"
import { getFirebaseDb } from "./config"
import { collection, getDocs } from "firebase/firestore"

// Map Firestore user data to app User type
export function mapFirestoreUser(data: any): User {
  return {
    id: data.id,
    username: data.username,
    fullName: data.name || data.fullName,
    email: data.email,
    password: data.password,
    role: data.role,
    adminType: data.admin_type || data.adminType,
    allowedTabs: data.allowed_tabs || data.allowedTabs || [],
    isOnline: data.is_online ?? data.isOnline ?? false,
    isActive: data.is_active ?? data.isActive ?? true,
    createdAt: new Date(data.created_at || data.createdAt || Date.now()),
    lastLoginAt: data.last_login ? new Date(data.last_login) : undefined,
    lastActivity: data.last_activity,
    lastScriptAccess: data.last_script_access,
    currentProduct: data.current_product,
    currentScreen: data.current_screen,
  }
}

// Convert app User to Firestore format
export function userToFirestore(user: Partial<User>): Record<string, any> {
  const data: Record<string, any> = {}
  
  if (user.username !== undefined) data.username = user.username
  if (user.fullName !== undefined) data.name = user.fullName
  if (user.email !== undefined) data.email = user.email
  if (user.password !== undefined) data.password = user.password
  if (user.role !== undefined) data.role = user.role
  if (user.adminType !== undefined) data.admin_type = user.adminType
  if (user.allowedTabs !== undefined) data.allowed_tabs = user.allowedTabs
  if (user.isOnline !== undefined) data.is_online = user.isOnline
  if (user.isActive !== undefined) data.is_active = user.isActive
  
  return data
}

// Sign in anonymously (used to authenticate with Firebase while validating against Firestore users)
export async function signInAnonymouslyToFirebase(): Promise<FirebaseUser | null> {
  try {
    const auth = getFirebaseAuth()
    const result = await signInAnonymously(auth)
    return result.user
  } catch (error) {
    console.error("[Firebase Auth] Anonymous sign in error:", error)
    return null
  }
}

// Validate user credentials against Firestore users collection
export async function validateUserCredentials(
  username: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const db = getFirebaseDb()
    const usersRef = collection(db, COLLECTIONS.USERS)
    const snapshot = await getDocs(usersRef)
    
    // Find user by username (case insensitive)
    const userDoc = snapshot.docs.find(doc => {
      const data = doc.data()
      return data.username?.toLowerCase() === username.toLowerCase().trim()
    })
    
    if (!userDoc) {
      return { success: false, error: "Usuario nao encontrado" }
    }
    
    const userData = { id: userDoc.id, ...userDoc.data() }
    
    // Check if user is active
    if (userData.is_active === false) {
      return { success: false, error: "Usuario desativado" }
    }
    
    // Check password for admin/supervisor roles
    const requiresPassword = userData.role === "admin" || userData.role === "supervisor"
    if (requiresPassword && userData.password && userData.password !== password) {
      return { success: false, error: "Senha incorreta" }
    }
    
    const user = mapFirestoreUser(userData)
    
    // Update online status
    await updateDocument(COLLECTIONS.USERS, user.id, {
      is_online: true,
      last_login: toFirestoreDate(new Date()),
      last_activity: toFirestoreDate(new Date()),
    })
    
    return { success: true, user }
  } catch (error: any) {
    console.error("[Firebase Auth] Validation error:", error?.code || error?.message)
    return { success: false, error: "Erro ao conectar. Tente novamente." }
  }
}

// Sign out
export async function signOut(): Promise<void> {
  try {
    const auth = getFirebaseAuth()
    await firebaseSignOut(auth)
  } catch (error) {
    console.error("[Firebase Auth] Sign out error:", error)
  }
}

// Get current Firebase user
export function getCurrentFirebaseUser(): FirebaseUser | null {
  const auth = getFirebaseAuth()
  return auth.currentUser
}

// Subscribe to auth state changes
export function onAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
  const auth = getFirebaseAuth()
  return onAuthStateChanged(auth, callback)
}

// Update user online status
export async function updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
  try {
    await updateDocument(COLLECTIONS.USERS, userId, {
      is_online: isOnline,
      last_activity: toFirestoreDate(new Date()),
    })
  } catch (error) {
    console.error("[Firebase] Error updating online status:", error)
  }
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  const data = await getDocument(COLLECTIONS.USERS, userId)
  if (!data) return null
  return mapFirestoreUser(data)
}

// Get all users
export async function getAllUsers(): Promise<User[]> {
  const users = await getCollection(COLLECTIONS.USERS)
  return users.map(mapFirestoreUser)
}

// Get active users
export async function getActiveUsers(): Promise<User[]> {
  const db = getFirebaseDb()
  const usersRef = collection(db, COLLECTIONS.USERS)
  const snapshot = await getDocs(usersRef)
  
  return snapshot.docs
    .map(doc => mapFirestoreUser({ id: doc.id, ...doc.data() }))
    .filter(user => user.isActive !== false)
}

// Ensure default admin user exists in Firestore
export async function ensureDefaultAdminExists(): Promise<void> {
  try {
    const db = getFirebaseDb()
    const usersRef = collection(db, COLLECTIONS.USERS)
    const snapshot = await getDocs(usersRef)
    
    // Check if admin user exists
    const adminExists = snapshot.docs.some(doc => {
      const data = doc.data()
      return data.username?.toLowerCase() === "admin"
    })
    
    if (!adminExists) {
      // Create default admin user
      const { addDoc } = await import("firebase/firestore")
      await addDoc(usersRef, {
        username: "admin",
        name: "Administrador",
        password: "rcp@$",
        role: "admin",
        admin_type: "master",
        allowed_tabs: ["dashboard", "operators", "quality-center", "settings", "products", "scripts", "presentations", "feedback"],
        is_active: true,
        is_online: false,
        created_at: toFirestoreDate(new Date()),
      })
      console.log("[Firebase] Default admin user created")
    }
  } catch (error) {
    console.error("[Firebase] Error ensuring admin exists:", error)
  }
}
