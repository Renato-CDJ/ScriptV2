"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useMemo, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "./types"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SESSION_KEY = "callcenter_session"

const supabase = createClient()

// Get users from Supabase
export async function getUsersFromSupabase(): Promise<User[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true })

  if (error || !data) return []

  return data.map((u) => ({
    id: u.id,
    username: u.username,
    fullName: u.name,
    email: u.email,
    password: u.password,
    role: u.role,
    adminType: u.admin_type,
    allowedTabs: u.allowed_tabs || [],
    isOnline: u.is_online,
    isActive: u.is_active,
    createdAt: new Date(u.created_at),
  }))
}

// Get users sync (for components that need sync access)
export function getUsers(): User[] {
  // This is a fallback - prefer async getUsersFromSupabase
  if (typeof window === "undefined") return []
  const cached = localStorage.getItem("cached_users")
  return cached ? JSON.parse(cached) : []
}

// Update user in Supabase
export async function updateUserInStorage(userId: string, updates: Partial<User>): Promise<void> {
  const supabaseUpdates: Record<string, any> = {}
  
  if (updates.fullName !== undefined) supabaseUpdates.name = updates.fullName
  if (updates.email !== undefined) supabaseUpdates.email = updates.email
  if (updates.password !== undefined) supabaseUpdates.password = updates.password
  if (updates.role !== undefined) supabaseUpdates.role = updates.role
  if (updates.adminType !== undefined) supabaseUpdates.admin_type = updates.adminType
  if (updates.allowedTabs !== undefined) supabaseUpdates.allowed_tabs = updates.allowedTabs
  if (updates.isOnline !== undefined) supabaseUpdates.is_online = updates.isOnline
  if (updates.isActive !== undefined) supabaseUpdates.is_active = updates.isActive

  await supabase.from("users").update(supabaseUpdates).eq("id", userId)
}

// Initialize users export (compatibility)
export function initializeUsers() {
  // No-op for Supabase - users are already in DB
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionData = localStorage.getItem(SESSION_KEY)
        if (sessionData) {
          const session = JSON.parse(sessionData)
          
          // Verify user still exists in Supabase
          const { data } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.userId)
            .eq("is_active", true)
            .single()

          if (data) {
            const loadedUser: User = {
              id: data.id,
              username: data.username,
              fullName: data.name,
              email: data.email,
              password: data.password,
              role: data.role,
              adminType: data.admin_type,
              allowedTabs: data.allowed_tabs || [],
              isOnline: true,
              isActive: data.is_active,
              createdAt: new Date(data.created_at),
            }
            setUser(loadedUser)
            
            // Update online status
            await supabase
              .from("users")
              .update({ is_online: true, last_seen: new Date().toISOString() })
              .eq("id", data.id)
          } else {
            localStorage.removeItem(SESSION_KEY)
          }
        }
      } catch (error) {
        console.error("Error loading session:", error)
        localStorage.removeItem(SESSION_KEY)
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()

    // Cache users for sync access
    getUsersFromSupabase().then((users) => {
      localStorage.setItem("cached_users", JSON.stringify(users))
    })
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Find user in Supabase
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .ilike("username", username)
        .single()

      if (error || !data) {
        return { success: false, error: "Usuario nao encontrado" }
      }

      // Check password for admin/supervisor roles
      const requiresPassword = data.role === "admin" || data.role === "supervisor"
      if (requiresPassword && data.password && data.password !== password) {
        return { success: false, error: "Senha incorreta" }
      }

      const loggedInUser: User = {
        id: data.id,
        username: data.username,
        fullName: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        adminType: data.admin_type,
        allowedTabs: data.allowed_tabs || [],
        isOnline: true,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
      }

      // Save session
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        userId: data.id,
        username: data.username,
        role: data.role,
        loginTime: new Date().toISOString(),
      }))

      // Update online status
      await supabase
        .from("users")
        .update({ is_online: true, last_seen: new Date().toISOString() })
        .eq("id", data.id)

      setUser(loggedInUser)
      return { success: true }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Erro ao fazer login" }
    }
  }, [])

  const logout = useCallback(async () => {
    if (user) {
      // Update online status
      await supabase
        .from("users")
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq("id", user.id)
    }
    
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [user])

  const refreshUser = useCallback(async () => {
    if (!user) return

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    if (data) {
      setUser({
        id: data.id,
        username: data.username,
        fullName: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        adminType: data.admin_type,
        allowedTabs: data.allowed_tabs || [],
        isOnline: data.is_online,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
      })
    }
  }, [user])

  const value = useMemo(
    () => ({
      user,
      isLoading,
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
  return getUsersFromSupabase()
}
