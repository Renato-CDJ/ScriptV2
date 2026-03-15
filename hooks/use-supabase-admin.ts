"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

// Generic hook for CRUD operations with realtime
export function useSupabaseTable<T extends { id: string }>(
  tableName: string,
  orderBy: string = "created_at",
  ascending: boolean = false
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: result, error: err } = await supabase
      .from(tableName)
      .select("*")
      .order(orderBy, { ascending })

    if (err) {
      setError(err.message)
      console.error(`[Supabase] Error fetching ${tableName}:`, err)
    } else {
      setData((result as T[]) || [])
      setError(null)
    }
    setLoading(false)
  }, [tableName, orderBy, ascending])

  useEffect(() => {
    fetchData()

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`${tableName}-changes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        () => {
          fetchData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tableName, fetchData])

  const create = async (item: Omit<T, "id" | "created_at" | "updated_at">) => {
    const { data: result, error: err } = await supabase
      .from(tableName)
      .insert(item)
      .select()
      .single()

    if (err) {
      console.error(`[Supabase] Error creating in ${tableName}:`, err)
      return { data: null, error: err.message }
    }
    return { data: result as T, error: null }
  }

  const update = async (id: string, updates: Partial<T>) => {
    const { data: result, error: err } = await supabase
      .from(tableName)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (err) {
      console.error(`[Supabase] Error updating in ${tableName}:`, err)
      return { data: null, error: err.message }
    }
    return { data: result as T, error: null }
  }

  const remove = async (id: string) => {
    const { error: err } = await supabase
      .from(tableName)
      .delete()
      .eq("id", id)

    if (err) {
      console.error(`[Supabase] Error deleting from ${tableName}:`, err)
      return { error: err.message }
    }
    return { error: null }
  }

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    create,
    update,
    remove,
  }
}

// Specific hooks for each table
export function useScripts() {
  return useSupabaseTable<{
    id: string
    title: string
    content: string
    category: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>("scripts")
}

export function useProducts() {
  return useSupabaseTable<{
    id: string
    name: string
    description: string
    category: string
    price: number
    is_active: boolean
    details: Record<string, any>
    created_at: string
    updated_at: string
  }>("products")
}

export function useTabulations() {
  return useSupabaseTable<{
    id: string
    name: string
    description: string
    color: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>("tabulations")
}

export function useSituations() {
  return useSupabaseTable<{
    id: string
    name: string
    description: string
    color: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>("situations")
}

export function useChannels() {
  return useSupabaseTable<{
    id: string
    name: string
    description: string
    icon: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>("channels")
}

export function useResultCodes() {
  return useSupabaseTable<{
    id: string
    code: string
    name: string
    description: string
    category: string
    color: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>("result_codes")
}

export function useInitialGuide() {
  return useSupabaseTable<{
    id: string
    title: string
    content: string
    step_order: number
    is_active: boolean
    created_at: string
    updated_at: string
  }>("initial_guide", "step_order", true)
}

export function useNotes(userId?: string) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data: result } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    setData(result || [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchData()

    if (!userId) return

    const channel = supabase
      .channel(`notes-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes", filter: `user_id=eq.${userId}` },
        () => fetchData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchData])

  const create = async (note: { title: string; content: string; color?: string }) => {
    const { data: result, error } = await supabase
      .from("notes")
      .insert({ ...note, user_id: userId })
      .select()
      .single()
    return { data: result, error: error?.message }
  }

  const update = async (id: string, updates: any) => {
    const { data: result, error } = await supabase
      .from("notes")
      .update(updates)
      .eq("id", id)
      .select()
      .single()
    return { data: result, error: error?.message }
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from("notes").delete().eq("id", id)
    return { error: error?.message }
  }

  return { data, loading, refetch: fetchData, create, update, remove }
}

export function useAppSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from("app_settings").select("*")
    
    const settingsMap: Record<string, any> = {}
    data?.forEach((item: any) => {
      settingsMap[item.key] = item.value
    })
    setSettings(settingsMap)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSettings()

    const channel = supabase
      .channel("app-settings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings" },
        () => fetchSettings()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchSettings])

  const updateSetting = async (key: string, value: any) => {
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() })
    return { error: error?.message }
  }

  return { settings, loading, refetch: fetchSettings, updateSetting }
}

export function usePhraseology() {
  return useSupabaseTable<{
    id: string
    title: string
    content: string
    category: string
    shortcut: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>("phraseology")
}

export function useChatMessages(userId?: string) {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMessages = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId},is_global.eq.true`)
      .order("created_at", { ascending: true })
      .limit(100)

    setMessages(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchMessages()

    const channel = supabase
      .channel("chat-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        () => fetchMessages()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchMessages])

  const sendMessage = async (message: {
    content: string
    sender_name: string
    recipient_id?: string
    recipient_name?: string
    is_global?: boolean
  }) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ ...message, sender_id: userId })
      .select()
      .single()
    return { data, error: error?.message }
  }

  const markAsRead = async (messageId: string) => {
    await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("id", messageId)
  }

  return { messages, loading, refetch: fetchMessages, sendMessage, markAsRead }
}
