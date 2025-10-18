"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "./types"
import { getCurrentUser as getLocalUser, logout as logoutLocal, initializeMockData } from "./store"
import { getCurrentUser as getDbUser, logout as logoutDb } from "./db"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  logout: () => void
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const isSupabaseConfigured = () => {
  return !!(
    process.env.SUPABASE_SUPABASE_NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ANON_KEY
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const useDatabase = isSupabaseConfigured()

  useEffect(() => {
    async function loadUser() {
      if (useDatabase) {
        console.log("[v0] Using Supabase database for authentication")
        const dbUser = await getDbUser()
        setUser(dbUser)
      } else {
        console.log("[v0] Using localStorage for authentication")
        initializeMockData()
        const localUser = getLocalUser()
        setUser(localUser)
      }
      setIsLoading(false)
    }

    loadUser()
  }, [useDatabase])

  const logout = async () => {
    if (useDatabase) {
      await logoutDb()
    } else {
      logoutLocal()
    }
    setUser(null)
  }

  const refreshUser = async () => {
    if (useDatabase) {
      const dbUser = await getDbUser()
      setUser(dbUser)
    } else {
      const localUser = getLocalUser()
      setUser(localUser)
    }
  }

  return <AuthContext.Provider value={{ user, isLoading, logout, refreshUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
