"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useMemo, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "./types"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SESSION_KEY = "callcenter_session"

// Map Supabase user data to app User type
export function mapSupabaseUser(data: any): User {
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

// Get users from Supabase
export async function getUsersFromSupabase(): Promise<User[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[Supabase] Error fetching users:", error)
    return []
  }

  return (data || []).map(mapSupabaseUser)
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
  const supabase = createClient()
  
  const supabaseUpdates: Record<string, any> = {}
  
  if (updates.fullName !== undefined) supabaseUpdates.name = updates.fullName
  if (updates.email !== undefined) supabaseUpdates.email = updates.email
  if (updates.password !== undefined) supabaseUpdates.password = updates.password
  if (updates.role !== undefined) supabaseUpdates.role = updates.role
  if (updates.adminType !== undefined) supabaseUpdates.admin_type = updates.adminType
  if (updates.allowedTabs !== undefined) supabaseUpdates.allowed_tabs = updates.allowedTabs
  if (updates.isOnline !== undefined) supabaseUpdates.is_online = updates.isOnline
  if (updates.isActive !== undefined) supabaseUpdates.is_active = updates.isActive
  
  supabaseUpdates.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from("users")
    .update(supabaseUpdates)
    .eq("id", userId)

  if (error) {
    console.error("[Supabase] Error updating user:", error)
    throw error
  }
}

// Initialize users export (compatibility)
export function initializeUsers() {
  // No-op for Supabase - users are already in DB
}

// Dominio padrao para emails
const EMAIL_DOMAIN = "@gruporoveri.com"

// Verificar se e um email de admin
function isAdminEmail(email: string): boolean {
  const adminPatterns = ["admin", "monitoria", "supervisor", "qualidade"]
  const lowerEmail = email.toLowerCase()
  return adminPatterns.some((pattern) => lowerEmail.includes(pattern))
}

// Normalizar email adicionando dominio se necessario
function normalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase()
  if (!trimmed.includes("@")) {
    return `${trimmed}${EMAIL_DOMAIN}`
  }
  return trimmed
}

// Extrair username do email
function extractUsernameFromEmail(email: string): string {
  const [localPart] = email.split("@")
  return localPart.replace(/[^a-zA-Z0-9]/g, "_")
}

// Criar operador automaticamente se nao existir
async function createOperatorIfNotExists(email: string): Promise<{ success: boolean; user?: User; error?: string }> {
  const supabase = createClient()
  
  try {
    const username = extractUsernameFromEmail(email)
    
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        username,
        email: email.toLowerCase(),
        name: username,
        role: "operator",
        is_active: true,
        is_online: true,
        last_login: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        allowed_tabs: [],
      })
      .select()
      .single()

    if (insertError) {
      console.error("[Supabase] Error creating operator:", insertError)
      return { success: false, error: "Erro ao criar operador" }
    }

    return { success: true, user: mapSupabaseUser(newUser) }
  } catch (error: any) {
    console.error("[Supabase] Error creating operator:", error)
    return { success: false, error: "Erro ao criar operador" }
  }
}

// Validate user credentials against Supabase users table
async function validateUserCredentials(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const supabase = createClient()
    const normalizedEmail = normalizeEmail(email)
    
    // Buscar usuario por email (case insensitive)
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .ilike("email", normalizedEmail)
      .limit(1)

    if (error) {
      console.error("[Supabase] Query error:", error)
      return { success: false, error: "Erro ao buscar usuario" }
    }

    // Se nao encontrou usuario
    if (!users || users.length === 0) {
      // Se for admin, nao permitir auto-registro
      if (isAdminEmail(normalizedEmail)) {
        return { success: false, error: "Usuario administrador nao encontrado" }
      }
      
      // Para operadores, criar automaticamente
      return createOperatorIfNotExists(normalizedEmail)
    }

    const userData = users[0]

    // Verificar se usuario esta ativo
    if (userData.is_active === false) {
      return { success: false, error: "Usuario desativado" }
    }

    // Verificar senha para admins/supervisores
    const requiresPassword = userData.role === "admin" || userData.role === "supervisor"
    if (requiresPassword && userData.password && userData.password !== password) {
      return { success: false, error: "Senha incorreta" }
    }

    const user = mapSupabaseUser(userData)

    // Atualizar status online
    await supabase
      .from("users")
      .update({
        is_online: true,
        last_login: new Date().toISOString(),
        last_activity: new Date().toISOString(),
      })
      .eq("id", user.id)

    return { success: true, user }
  } catch (error: any) {
    console.error("[Supabase] Validation error:", error)
    return { success: false, error: "Erro ao validar credenciais" }
  }
}

// Update user online status
async function updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
  try {
    const supabase = createClient()
    await supabase
      .from("users")
      .update({
        is_online: isOnline,
        last_activity: new Date().toISOString(),
      })
      .eq("id", userId)
  } catch (error) {
    console.error("[Supabase] Error updating online status:", error)
  }
}

// Get user by ID
async function getUserById(userId: string): Promise<User | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single()

  if (error || !data) return null
  return mapSupabaseUser(data)
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

          // Verify user still exists in Supabase
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

    loadSession()

    return () => {
      mountedRef.current = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validar credenciais no Supabase
      const result = await validateUserCredentials(email, password)

      if (!result.success || !result.user) {
        return { success: false, error: result.error || "Erro desconhecido" }
      }

      // Salvar sessao
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        userId: result.user.id,
        email: result.user.email,
        username: result.user.username,
        role: result.user.role,
        loginTime: new Date().toISOString(),
      }))

      setUser(result.user)
      return { success: true }
    } catch (error: any) {
      console.error("[Supabase Auth] Login error:", error)
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
  return getUsersFromSupabase()
}
