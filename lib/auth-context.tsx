"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useMemo, useCallback } from "react"
import type { User } from "./types"
import { getCurrentUser, logout as logoutUser, initializeMockData, cleanupOldSessions } from "./store"

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
    // Initialize mock data on first load
    initializeMockData()

    // Check for existing session
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setIsLoading(false)

    cleanupOldSessions()
  }, [])

  const logout = useCallback(() => {
    logoutUser()
    setUser(null)
  }, [])

  const refreshUser = useCallback(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
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
