"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useMemo, useCallback } from "react"
import type { User } from "./types"
import { onAuthStateChange, logoutFirebase } from "./firebase-auth"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  logout: () => void
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log("[v0] Setting up Firebase auth listener")
    const unsubscribe = onAuthStateChange((firebaseUser) => {
      console.log("[v0] Auth state changed:", firebaseUser)
      setUser(firebaseUser)
      setIsLoading(false)
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [])

  const logout = useCallback(async () => {
    await logoutFirebase()
    setUser(null)
  }, [])

  const refreshUser = useCallback(() => {
    // Mas mantemos a função para compatibilidade
    console.log("[v0] Refresh user called - Firebase handles this automatically")
  }, [])

  const contextValue = useMemo(() => ({ user, isLoading, logout, refreshUser }), [user, isLoading, logout, refreshUser])

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
