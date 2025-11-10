"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useMemo, useCallback } from "react"
import type { User } from "./types"
import { getCurrentUser, logout as logoutUser } from "./supabase-store"
import { createBrowserClient } from "@/lib/supabase/client"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error("[v0] Error checking session:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()

    const supabase = createBrowserClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const logout = useCallback(async () => {
    await logoutUser()
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const currentUser = await getCurrentUser()
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
