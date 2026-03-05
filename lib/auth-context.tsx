"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useMemo, useCallback } from "react"
import type { User } from "./types"
import { createClient } from "./supabase/client"
import { setUserOnlineStatus } from "./supabase-store"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SESSION_KEY = "callcenter_session"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session in localStorage
    const savedSession = localStorage.getItem(SESSION_KEY)
    if (savedSession) {
      try {
        const userData = JSON.parse(savedSession)
        setUser(userData)
        // Mark user as online
        setUserOnlineStatus(userData.id, true)
      } catch (e) {
        localStorage.removeItem(SESSION_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const supabase = createClient()
      
      // Query users table by username (case insensitive)
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .ilike("username", username)
        .eq("is_active", true)
        .single()
      
      if (error || !data) {
        return { success: false, error: "Usuario nao encontrado" }
      }
      
      // Check password only for admin/supervisor roles
      const requiresPassword = data.role === "admin" || data.role === "supervisor"
      if (requiresPassword && password && data.password !== password) {
        return { success: false, error: "Senha incorreta" }
      }
      
      const userData: User = {
        id: data.id,
        username: data.username,
        fullName: data.name,
        role: data.role,
        isOnline: true,
        createdAt: new Date(data.created_at),
        password: data.password,
      }
      
      // Save session
      localStorage.setItem(SESSION_KEY, JSON.stringify(userData))
      setUser(userData)
      
      // Mark user as online
      await setUserOnlineStatus(userData.id, true)
      
      return { success: true }
    } catch (e) {
      console.error("Login error:", e)
      return { success: false, error: "Erro ao fazer login" }
    }
  }, [])

  const logout = useCallback(async () => {
    if (user) {
      await setUserOnlineStatus(user.id, false)
    }
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [user])

  const refreshUser = useCallback(async () => {
    const savedSession = localStorage.getItem(SESSION_KEY)
    if (savedSession) {
      try {
        const userData = JSON.parse(savedSession)
        
        // Fetch fresh data from Supabase
        const supabase = createClient()
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", userData.id)
          .single()
        
        if (data) {
          const freshUser: User = {
            id: data.id,
            username: data.username,
            fullName: data.name,
            role: data.role,
            isOnline: data.is_online,
            createdAt: new Date(data.created_at),
            password: data.password,
          }
          localStorage.setItem(SESSION_KEY, JSON.stringify(freshUser))
          setUser(freshUser)
        }
      } catch (e) {
        console.error("Error refreshing user:", e)
      }
    }
  }, [])

  const contextValue = useMemo(() => ({ user, isLoading, login, logout, refreshUser }), [user, isLoading, login, logout, refreshUser])

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
