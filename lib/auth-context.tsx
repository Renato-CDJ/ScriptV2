"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useMemo, useCallback } from "react"
import type { User } from "./types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from 'next/navigation'

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
  const supabase = createClient()
  const router = useRouter()

  const fetchUser = useCallback(async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (authUser) {
        // Fetch additional user data from our users table
        const { data: userData, error } = await supabase.from("users").select("*").eq("id", authUser.id).single()

        if (userData && !error) {
          setUser({
            ...userData,
            createdAt: new Date(userData.created_at),
            lastLoginAt: userData.last_login_at ? new Date(userData.last_login_at) : undefined,
          })
        } else {
          // If user exists in Auth but not in our table (shouldn't happen with proper setup)
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUser()
      } else {
        setUser(null)
        setIsLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUser, supabase])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push("/")
  }, [supabase, router])

  const refreshUser = useCallback(async () => {
    await fetchUser()
  }, [fetchUser])

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
