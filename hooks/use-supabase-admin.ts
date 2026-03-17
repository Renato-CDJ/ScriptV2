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

// Get scripts for a specific product
export async function getScriptsByProductId(productId: string) {
  const { data, error } = await supabase
    .from("scripts")
    .select("*")
    .eq("product_id", productId)
    .eq("is_active", true)
    .order("step_order", { ascending: true })

  if (error) {
    console.error("[Supabase] Error fetching scripts:", error)
    return []
  }

  return data || []
}

// Get the first script step for a product
export async function getFirstScriptStep(productId: string) {
  const { data, error } = await supabase
    .from("scripts")
    .select("*")
    .eq("product_id", productId)
    .eq("is_active", true)
    .order("step_order", { ascending: true })
    .limit(1)
    .single()

  if (error) {
    console.error("[Supabase] Error fetching first step:", error)
    return null
  }

  return data
}

// Get a specific script step by ID
export async function getScriptStepByIdFromSupabase(stepId: string) {
  const { data, error } = await supabase
    .from("scripts")
    .select("*")
    .eq("id", stepId)
    .single()

  if (error) {
    console.error("[Supabase] Error fetching step:", error)
    return null
  }

  return data
}

// Hook for operator to use scripts with realtime updates
export function useProductScripts(productId: string | null) {
  const [scripts, setScripts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchScripts = useCallback(async () => {
    if (!productId) {
      setScripts([])
      return
    }
    
    setLoading(true)
    const data = await getScriptsByProductId(productId)
    
    // Map to ScriptStep format
    const mappedScripts = data.map((s: any) => ({
      id: s.id,
      title: s.title,
      content: s.content,
      productId: s.product_id,
      productName: s.product_name,
      order: s.step_order,
      buttons: s.buttons || [],
      tabulations: s.tabulations || [],
      alert: s.alert,
      isActive: s.is_active,
    }))
    
    setScripts(mappedScripts)
    setLoading(false)
  }, [productId])

  useEffect(() => {
    fetchScripts()

    if (!productId) return

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`scripts-${productId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scripts", filter: `product_id=eq.${productId}` },
        () => fetchScripts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [productId, fetchScripts])

  const getStepById = useCallback((stepId: string) => {
    return scripts.find((s) => s.id === stepId) || null
  }, [scripts])

  const getFirstStep = useCallback(() => {
    return scripts.length > 0 ? scripts[0] : null
  }, [scripts])

  return { scripts, loading, getStepById, getFirstStep, refetch: fetchScripts }
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

export function useContracts() {
  return useSupabaseTable<{
    id: string
    name: string
    description: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>("contracts")
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

// Import scripts from JSON file
export async function importScriptsFromJson(jsonData: any): Promise<{ productCount: number; stepCount: number }> {
  let productCount = 0
  let stepCount = 0
  const errors: string[] = []

  // Handle the JSON structure: { marcas: { PRODUTO: { step_key: {...} } } }
  const marcas = jsonData.marcas || jsonData

  for (const [productName, steps] of Object.entries(marcas)) {
    // Check if product already exists by name
    const { data: existingProduct } = await supabase
      .from("products")
      .select("id")
      .eq("name", productName)
      .single()

    let productId: string

    if (existingProduct) {
      productId = existingProduct.id
      productCount++
      
      // Delete existing scripts for this product to reimport
      await supabase.from("scripts").delete().eq("product_id", productId)
    } else {
      // Create new product with auto-generated UUID
      const { data: newProduct, error: productError } = await supabase
        .from("products")
        .insert({
          name: productName,
          description: `Produto ${productName}`,
          category: "imported",
          is_active: true,
        })
        .select("id")
        .single()

      if (productError) {
        console.error("[Supabase] Product error:", productError)
        errors.push(`Produto ${productName}: ${productError.message}`)
        continue
      }
      
      productId = newProduct.id
      productCount++
    }

    // PHASE 1: Create all steps and build ID mapping (originalId -> newUUID)
    const idMapping: Record<string, string> = {}
    const stepsToInsert: any[] = []
    
    if (typeof steps === "object" && steps !== null) {
      const stepsObj = steps as Record<string, any>
      let order = 0

      for (const [stepKey, stepData] of Object.entries(stepsObj)) {
        order++
        const step = stepData as any
        
        // Get the original ID from the JSON (either from step.id or the key)
        const originalId = step.id || stepKey
        
        // Get content - try multiple possible field names (body is used in this JSON)
        const stepContent = step.body || step.conteudo || step.content || step.texto || ""
        const stepTitle = step.title || step.titulo || stepKey

        stepsToInsert.push({
          originalId,
          title: stepTitle,
          content: stepContent,
          product_id: productId,
          product_name: productName,
          step_order: order,
          buttons: step.botoes || step.buttons || [],
          tabulations: step.tabulacoes || step.tabulations || [],
          alert: step.alerta || step.alert || null,
          is_active: true,
        })
      }
    }

    // Insert all steps and get their new UUIDs
    for (const stepData of stepsToInsert) {
      const { originalId, ...insertData } = stepData
      
      const { data: newStep, error: stepError } = await supabase
        .from("scripts")
        .insert(insertData)
        .select("id")
        .single()

      if (stepError) {
        console.error("[Supabase] Step error:", stepError)
        errors.push(`Tela ${stepData.title}: ${stepError.message}`)
      } else if (newStep) {
        idMapping[originalId] = newStep.id
        stepCount++
      }
    }

    // PHASE 2: Update all buttons to use new UUIDs
    for (const [originalId, newId] of Object.entries(idMapping)) {
      // Get current step data
      const { data: currentStep } = await supabase
        .from("scripts")
        .select("buttons")
        .eq("id", newId)
        .single()

      if (currentStep?.buttons && Array.isArray(currentStep.buttons)) {
        // Map button next values to new UUIDs and rename to nextStepId
        const updatedButtons = currentStep.buttons.map((btn: any, index: number) => {
          const nextId = btn.next ? (idMapping[btn.next] || btn.next) : null
          return {
            id: btn.id || `btn-${index}`,
            label: btn.label || btn.text || `Botão ${index + 1}`,
            nextStepId: nextId,
            next: nextId, // Keep both for compatibility
            order: btn.order ?? index,
            primary: btn.primary ?? (index === 0),
            variant: btn.variant || (index === 0 ? "primary" : "secondary"),
          }
        })

        // Update the step with mapped buttons
        await supabase
          .from("scripts")
          .update({ buttons: updatedButtons })
          .eq("id", newId)
      }
    }
  }

  if (errors.length > 0 && stepCount === 0) {
    throw new Error(`Erros na importação: ${errors[0]}`)
  }

  return { productCount, stepCount }
}

// Bulk import tabulations
export async function importTabulationsFromJson(tabulationsData: any[]): Promise<number> {
  let count = 0
  
  for (const tab of tabulationsData) {
    const { error } = await supabase
      .from("tabulations")
      .upsert({
        id: tab.id || `tab-${Date.now()}-${count}`,
        name: tab.name || tab.nome,
        description: tab.description || tab.descricao || "",
        color: tab.color || tab.cor || "#6b7280",
        is_active: true,
      }, { onConflict: "id" })
    
    if (!error) count++
  }
  
  return count
}

// Bulk import situations
export async function importSituationsFromJson(situationsData: any[]): Promise<number> {
  let count = 0
  
  for (const sit of situationsData) {
    const { error } = await supabase
      .from("situations")
      .upsert({
        id: sit.id || `sit-${Date.now()}-${count}`,
        name: sit.name || sit.nome,
        description: sit.description || sit.descricao || "",
        color: sit.color || sit.cor || "#6b7280",
        is_active: true,
      }, { onConflict: "id" })
    
    if (!error) count++
  }
  
  return count
}

// Delete all scripts for a product
export async function deleteScriptsForProduct(productId: string): Promise<void> {
  // First delete all scripts associated with the product
  await supabase
    .from("scripts")
    .delete()
    .eq("product_id", productId)
  
  // Then delete the product
  await supabase
    .from("products")
    .delete()
    .eq("id", productId)
}

// Delete all scripts for a product by name
export async function deleteScriptsForProductByName(productName: string): Promise<void> {
  // Find product by name
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("name", productName)
    .single()
  
  if (product) {
    await deleteScriptsForProduct(product.id)
  }
}

// Messages hook for operator messages
export function useMessages(userId?: string) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: result } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })

    setData(result || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => fetchData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchData])

  const markAsSeen = async (messageId: string) => {
    if (!userId) return
    const message = data.find((m) => m.id === messageId)
    if (!message) return

    const seenBy = message.seen_by || []
    if (!seenBy.includes(userId)) {
      await supabase
        .from("messages")
        .update({ seen_by: [...seenBy, userId] })
        .eq("id", messageId)
    }
  }

  const create = async (messageData: any) => {
    const { error } = await supabase.from("messages").insert(messageData)
    return { error: error?.message }
  }

  const update = async (id: string, updates: any) => {
    const { error } = await supabase.from("messages").update(updates).eq("id", id)
    return { error: error?.message }
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from("messages").delete().eq("id", id)
    return { error: error?.message }
  }

  return { data, loading, refetch: fetchData, markAsSeen, create, update, remove }
}

// Quizzes hook
export function useQuizzes(userId?: string) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: result } = await supabase
      .from("quizzes")
      .select("*")
      .order("created_at", { ascending: false })

    setData(result || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel("quizzes-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quizzes" },
        () => fetchData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchData])

  const submitAttempt = async (quizId: string, answer: string, isCorrect: boolean) => {
    if (!userId) return { error: "No user" }

    const { error } = await supabase
      .from("quiz_attempts")
      .insert({
        quiz_id: quizId,
        user_id: userId,
        selected_answer: answer,
        is_correct: isCorrect,
      })

    return { error: error?.message }
  }

  const hasAnswered = async (quizId: string): Promise<boolean> => {
    if (!userId) return false

    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("id")
      .eq("quiz_id", quizId)
      .eq("user_id", userId)
      .limit(1)

    return (attempts?.length || 0) > 0
  }

  const create = async (quizData: any) => {
    const { error } = await supabase.from("quizzes").insert(quizData)
    return { error: error?.message }
  }

  const update = async (id: string, updates: any) => {
    const { error } = await supabase.from("quizzes").update(updates).eq("id", id)
    return { error: error?.message }
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from("quizzes").delete().eq("id", id)
    return { error: error?.message }
  }

  const getAttempts = async (quizId: string) => {
    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("quiz_id", quizId)
      .order("created_at", { ascending: false })
    return attempts || []
  }

  return { data, loading, refetch: fetchData, submitAttempt, hasAnswered, create, update, remove, getAttempts }
}

// Feedbacks hook for operators
export function useFeedbacksForOperator(userId?: string) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data: result } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })

    setData(result || [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchData()

    if (!userId) return

    const channel = supabase
      .channel(`feedbacks-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feedbacks", filter: `recipient_id=eq.${userId}` },
        () => fetchData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchData])

  const markAsRead = async (feedbackId: string) => {
    await supabase
      .from("feedbacks")
      .update({ is_read: true })
      .eq("id", feedbackId)
  }

  return { data, loading, refetch: fetchData, markAsRead }
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
