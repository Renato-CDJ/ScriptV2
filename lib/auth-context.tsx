"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useMemo, useCallback, useRef } from "react"
import { 
  validateUserCredentials, 
  signInAnonymouslyToFirebase, 
  updateUserOnlineStatus,
  getUserById,
  getAllUsers as getAllUsersFromFirebase,
  mapFirestoreUser,
  ensureDefaultAdminExists,
} from "@/lib/firebase/auth"
import { getFirebaseDb } from "@/lib/firebase/config"
import { COLLECTIONS, toFirestoreDate, updateDocument } from "@/lib/firebase/firestore"
import type { User } from "./types"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SESSION_KEY = "callcenter_session"

// Get users from Firebase
export async function getUsersFromSupabase(): Promise<User[]> {
  return getAllUsersFromFirebase()
}

// Get users sync (for components that need sync access)
export function getUsers(): User[] {
  // This is a fallback - prefer async getUsersFromSupabase
  if (typeof window === "undefined") return []
  const cached = localStorage.getItem("cached_users")
  return cached ? JSON.parse(cached) : []
}

// Update user in Firebase
export async function updateUserInStorage(userId: string, updates: Partial<User>): Promise<void> {
  const firestoreUpdates: Record<string, any> = {}
  
  if (updates.fullName !== undefined) firestoreUpdates.name = updates.fullName
  if (updates.email !== undefined) firestoreUpdates.email = updates.email
  if (updates.password !== undefined) firestoreUpdates.password = updates.password
  if (updates.role !== undefined) firestoreUpdates.role = updates.role
  if (updates.adminType !== undefined) firestoreUpdates.admin_type = updates.adminType
  if (updates.allowedTabs !== undefined) firestoreUpdates.allowed_tabs = updates.allowedTabs
  if (updates.isOnline !== undefined) firestoreUpdates.is_online = updates.isOnline
  if (updates.isActive !== undefined) firestoreUpdates.is_active = updates.isActive

  await updateDocument(COLLECTIONS.USERS, userId, firestoreUpdates)
}

// Initialize users export (compatibility)
export function initializeUsers() {
  // No-op for Firebase - users are already in DB
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const mountedRef = useRef(true)

  // Load session on mount
  useEffect(() => {
    mountedRef.current = true
    
    const loadSession = async () => {
      try {
        const sessionData = localStorage.getItem(SESSION_KEY)
        if (sessionData) {
          const session = JSON.parse(sessionData)
          
          // Verify user still exists in Firebase
          const userData = await getUserById(session.userId)

          if (userData && mountedRef.current) {
            setUser(userData)
            
            // Update online status (don't wait)
            updateUserOnlineStatus(userData.id, true).catch(() => {})
          } else if (!userData) {
            localStorage.removeItem(SESSION_KEY)
          }
        }
      } catch (error) {
        console.error("Error loading session:", error)
        localStorage.removeItem(SESSION_KEY)
      } finally {
        if (mountedRef.current) {
          setIsLoading(false)
        }
      }
    }

    // Sign in anonymously to Firebase for database access
    signInAnonymouslyToFirebase().then(async () => {
      // Ensure default admin user exists
      await ensureDefaultAdminExists()
      loadSession()
    }).catch(() => {
      loadSession()
    })

    return () => {
      mountedRef.current = false
    }
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Ensure we have Firebase anonymous auth
      await signInAnonymouslyToFirebase()
      
      // Validate credentials against Firestore
      const result = await validateUserCredentials(username, password)
      
      if (!result.success || !result.user) {
        return { success: false, error: result.error || "Erro desconhecido" }
      }

      // Save session
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        userId: result.user.id,
        username: result.user.username,
        role: result.user.role,
        loginTime: new Date().toISOString(),
      }))

      setUser(result.user)
      return { success: true }
    } catch (error: any) {
      console.error("[Firebase Auth] Login error:", error)
      return { success: false, error: "Erro ao conectar. Tente novamente." }
    }
  }, [])

  const logout = useCallback(async () => {
    if (user) {
      // Update online status
      await updateUserOnlineStatus(user.id, false)
    }
    
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [user])

  const refreshUser = useCallback(async () => {
    if (!user) return

    const userData = await getUserById(user.id)

    if (userData) {
      setUser(userData)
    }
  }, [user])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Export for compatibility with existing code
export async function getAllUsers(): Promise<User[]> {
  return getAllUsersFromFirebase()
}
