import { createClient } from "@/lib/supabase/client"
import type {
  ScriptStep,
  Product,
  Tabulation,
  ServiceSituation,
  Channel,
  Note,
  Message,
  Quiz,
  QuizAttempt,
  ChatSettings,
  ChatMessage,
  Presentation,
  PresentationProgress,
  Phraseology,
} from "./types"

const supabase = createClient()

// Products
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from("products").select("*").order("name")

  if (error) {
    console.error("Error fetching products:", error)
    return []
  }

  return data.map((p) => ({
    ...p,
    createdAt: new Date(p.created_at),
    scriptId: p.script_id,
    attendanceTypes: p.attendance_types,
    personTypes: p.person_types,
    isActive: p.is_active,
  }))
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

  if (error || !data) return undefined

  return {
    ...data,
    createdAt: new Date(data.created_at),
    scriptId: data.script_id,
    attendanceTypes: data.attendance_types,
    personTypes: data.person_types,
    isActive: data.is_active,
  }
}

export async function createProduct(product: Omit<Product, "id" | "createdAt">): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: product.name,
      script_id: product.scriptId,
      category: product.category,
      is_active: product.isActive,
      attendance_types: product.attendanceTypes,
      person_types: product.personTypes,
      description: product.description,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating product:", error)
    return null
  }

  return {
    ...data,
    createdAt: new Date(data.created_at),
    scriptId: data.script_id,
    attendanceTypes: data.attendance_types,
    personTypes: data.person_types,
    isActive: data.is_active,
  }
}

export async function updateProduct(product: Product): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .update({
      name: product.name,
      script_id: product.scriptId,
      category: product.category,
      is_active: product.isActive,
      attendance_types: product.attendanceTypes,
      person_types: product.personTypes,
      description: product.description,
    })
    .eq("id", product.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating product:", error)
    return null
  }

  return {
    ...data,
    createdAt: new Date(data.created_at),
    scriptId: data.script_id,
    attendanceTypes: data.attendance_types,
    personTypes: data.person_types,
    isActive: data.is_active,
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  const { error } = await supabase.from("products").delete().eq("id", id)

  return !error
}

// Script Steps
export async function getScriptSteps(productId?: string): Promise<ScriptStep[]> {
  let query = supabase.from("script_steps").select("*").order("order_num")

  if (productId) {
    query = query.eq("product_id", productId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching script steps:", error)
    return []
  }

  return data.map((step) => ({
    ...step,
    order: step.order_num,
    productId: step.product_id,
    createdAt: new Date(step.created_at),
    updatedAt: new Date(step.updated_at),
    contentSegments: step.content_segments,
  }))
}

export async function getScriptStepById(id: string, productId: string): Promise<ScriptStep | undefined> {
  const { data, error } = await supabase
    .from("script_steps")
    .select("*")
    .eq("id", id)
    .eq("product_id", productId)
    .single()

  if (error || !data) return undefined

  return {
    ...data,
    order: data.order_num,
    productId: data.product_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    contentSegments: data.content_segments,
  }
}

export async function createScriptStep(step: ScriptStep): Promise<ScriptStep | null> {
  const { data, error } = await supabase
    .from("script_steps")
    .insert({
      title: step.title,
      content: step.content,
      order_num: step.order,
      product_id: step.productId,
      buttons: step.buttons,
      tabulations: step.tabulations,
      content_segments: step.contentSegments,
      formatting: step.formatting,
      alert: step.alert,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating script step:", error)
    return null
  }

  return {
    ...data,
    order: data.order_num,
    productId: data.product_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    contentSegments: data.content_segments,
  }
}

export async function updateScriptStep(step: ScriptStep): Promise<ScriptStep | null> {
  const { data, error } = await supabase
    .from("script_steps")
    .update({
      title: step.title,
      content: step.content,
      order_num: step.order,
      product_id: step.productId,
      buttons: step.buttons,
      tabulations: step.tabulations,
      content_segments: step.contentSegments,
      formatting: step.formatting,
      alert: step.alert,
      updated_at: new Date().toISOString(),
    })
    .eq("id", step.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating script step:", error)
    return null
  }

  return {
    ...data,
    order: data.order_num,
    productId: data.product_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    contentSegments: data.content_segments,
  }
}

export async function deleteScriptStep(id: string): Promise<boolean> {
  const { error } = await supabase.from("script_steps").delete().eq("id", id)

  return !error
}

// Tabulations
export async function getTabulations(): Promise<Tabulation[]> {
  const { data, error } = await supabase.from("tabulations").select("*").order("name")

  if (error) return []

  return data.map((t) => ({
    ...t,
    createdAt: new Date(t.created_at),
  }))
}

export async function createTabulation(tabulation: Omit<Tabulation, "id" | "createdAt">): Promise<Tabulation | null> {
  const { data, error } = await supabase
    .from("tabulations")
    .insert({
      name: tabulation.name,
      description: tabulation.description,
      color: tabulation.color,
    })
    .select()
    .single()

  if (error) return null

  return {
    ...data,
    createdAt: new Date(data.created_at),
  }
}

export async function updateTabulation(tabulation: Tabulation): Promise<Tabulation | null> {
  const { data, error } = await supabase
    .from("tabulations")
    .update({
      name: tabulation.name,
      description: tabulation.description,
      color: tabulation.color,
    })
    .eq("id", tabulation.id)
    .select()
    .single()

  if (error) return null

  return {
    ...data,
    createdAt: new Date(data.created_at),
  }
}

export async function deleteTabulation(id: string): Promise<boolean> {
  const { error } = await supabase.from("tabulations").delete().eq("id", id)

  return !error
}

// Service Situations
export async function getServiceSituations(): Promise<ServiceSituation[]> {
  const { data, error } = await supabase.from("service_situations").select("*").eq("is_active", true).order("name")

  if (error) return []

  return data.map((s) => ({
    ...s,
    isActive: s.is_active,
    createdAt: new Date(s.created_at),
  }))
}

export async function createServiceSituation(
  situation: Omit<ServiceSituation, "id" | "createdAt">,
): Promise<ServiceSituation | null> {
  const { data, error } = await supabase
    .from("service_situations")
    .insert({
      name: situation.name,
      description: situation.description,
      is_active: situation.isActive,
    })
    .select()
    .single()

  if (error) return null

  return {
    ...data,
    isActive: data.is_active,
    createdAt: new Date(data.created_at),
  }
}

export async function updateServiceSituation(situation: ServiceSituation): Promise<ServiceSituation | null> {
  const { data, error } = await supabase
    .from("service_situations")
    .update({
      name: situation.name,
      description: situation.description,
      is_active: situation.isActive,
    })
    .eq("id", situation.id)
    .select()
    .single()

  if (error) return null

  return {
    ...data,
    isActive: data.is_active,
    createdAt: new Date(data.created_at),
  }
}

export async function deleteServiceSituation(id: string): Promise<boolean> {
  const { error } = await supabase.from("service_situations").delete().eq("id", id)

  return !error
}

// Channels
export async function getChannels(): Promise<Channel[]> {
  const { data, error } = await supabase.from("channels").select("*").eq("is_active", true).order("name")

  if (error) return []

  return data.map((c) => ({
    ...c,
    isActive: c.is_active,
    createdAt: new Date(c.created_at),
  }))
}

export async function createChannel(channel: Omit<Channel, "id" | "createdAt">): Promise<Channel | null> {
  const { data, error } = await supabase
    .from("channels")
    .insert({
      name: channel.name,
      contact: channel.contact,
      is_active: channel.isActive,
    })
    .select()
    .single()

  if (error) return null

  return {
    ...data,
    isActive: data.is_active,
    createdAt: new Date(data.created_at),
  }
}

export async function updateChannel(channel: Channel): Promise<Channel | null> {
  const { data, error } = await supabase
    .from("channels")
    .update({
      name: channel.name,
      contact: channel.contact,
      is_active: channel.isActive,
    })
    .eq("id", channel.id)
    .select()
    .single()

  if (error) return null

  return {
    ...data,
    isActive: data.is_active,
    createdAt: new Date(data.created_at),
  }
}

export async function deleteChannel(id: string): Promise<boolean> {
  const { error } = await supabase.from("channels").delete().eq("id", id)

  return !error
}

// Notes
export async function getNotes(userId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })

  if (error) return []

  return data.map((n) => ({
    ...n,
    userId: n.user_id,
    createdAt: new Date(n.created_at),
    updatedAt: new Date(n.updated_at),
  }))
}

export async function saveNote(userId: string, content: string): Promise<Note | null> {
  const { data, error } = await supabase.from("notes").insert({ user_id: userId, content }).select().single()

  if (error) return null

  return {
    ...data,
    userId: data.user_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  }
}

export async function updateNote(id: string, content: string): Promise<Note | null> {
  const { data, error } = await supabase.from("notes").update({ content }).eq("id", id).select().single()

  if (error) return null

  return {
    ...data,
    userId: data.user_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  }
}

export async function deleteNote(id: string): Promise<boolean> {
  const { error } = await supabase.from("notes").delete().eq("id", id)

  return !error
}

// Messages
export async function getActiveMessages(userId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) return []

  // Filter messages for this user (client-side filtering for recipients array logic if needed,
  // though RLS handles security)
  return data.map((m) => ({
    ...m,
    createdBy: m.created_by,
    createdByName: m.created_by_name,
    isActive: m.is_active,
    seenBy: m.seen_by || [],
    createdAt: new Date(m.created_at),
  }))
}

export async function markMessageAsSeen(messageId: string, userId: string): Promise<void> {
  // First get current seen_by array
  const { data: message } = await supabase.from("messages").select("seen_by").eq("id", messageId).single()

  if (message) {
    const seenBy = message.seen_by || []
    if (!seenBy.includes(userId)) {
      await supabase
        .from("messages")
        .update({ seen_by: [...seenBy, userId] })
        .eq("id", messageId)
    }
  }
}

// Quizzes
export async function getActiveQuizzes(userId: string): Promise<Quiz[]> {
  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) return []

  return data.map((q) => ({
    ...q,
    correctAnswer: q.correct_answer,
    createdBy: q.created_by,
    createdByName: q.created_by_name,
    isActive: q.is_active,
    scheduledDate: q.scheduled_date ? new Date(q.scheduled_date) : undefined,
    createdAt: new Date(q.created_at),
  }))
}

export async function submitQuizAttempt(attempt: Omit<QuizAttempt, "id" | "attemptedAt">): Promise<boolean> {
  const { error } = await supabase.from("quiz_attempts").insert({
    quiz_id: attempt.quizId,
    operator_id: attempt.operatorId,
    operator_name: attempt.operatorName,
    selected_answer: attempt.selectedAnswer,
    is_correct: attempt.isCorrect,
  })

  return !error
}

export async function getQuizAttempts(userId: string): Promise<QuizAttempt[]> {
  const { data, error } = await supabase.from("quiz_attempts").select("*").eq("operator_id", userId)

  if (error) return []

  return data.map((a) => ({
    ...a,
    quizId: a.quiz_id,
    operatorId: a.operator_id,
    operatorName: a.operator_name,
    selectedAnswer: a.selected_answer,
    isCorrect: a.is_correct,
    attemptedAt: new Date(a.attempted_at),
  }))
}

// Chat
export async function getChatSettings(): Promise<ChatSettings> {
  const { data, error } = await supabase.from("chat_settings").select("*").single()

  if (error || !data) {
    return {
      isEnabled: true,
      updatedAt: new Date(),
      updatedBy: "system",
    }
  }

  return {
    isEnabled: data.is_enabled,
    updatedAt: new Date(data.updated_at),
    updatedBy: data.updated_by,
  }
}

export async function getChatMessages(userId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId},recipient_id.is.null`)
    .order("created_at", { ascending: true })

  if (error) return []

  return data.map((m) => ({
    ...m,
    senderId: m.sender_id,
    senderName: m.sender_name,
    senderRole: m.sender_role,
    recipientId: m.recipient_id,
    replyTo: m.reply_to,
    isRead: m.is_read,
    createdAt: new Date(m.created_at),
  }))
}

export async function sendChatMessage(message: Omit<ChatMessage, "id" | "createdAt" | "isRead">): Promise<boolean> {
  const { error } = await supabase.from("chat_messages").insert({
    sender_id: message.senderId,
    sender_name: message.senderName,
    sender_role: message.senderRole,
    recipient_id: message.recipientId,
    content: message.content,
    attachment: message.attachment,
    reply_to: message.replyTo,
  })

  return !error
}

// Presentations
export async function getActivePresentations(userId: string): Promise<Presentation[]> {
  const { data, error } = await supabase
    .from("presentations")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) return []

  return data.map((p) => ({
    ...p,
    createdBy: p.created_by,
    createdByName: p.created_by_name,
    isActive: p.is_active,
    createdAt: new Date(p.created_at),
    updatedAt: new Date(p.updated_at),
  }))
}

export async function getPresentationProgress(userId: string): Promise<PresentationProgress[]> {
  const { data, error } = await supabase.from("presentation_progress").select("*").eq("operator_id", userId)

  if (error) return []

  return data.map((p) => ({
    ...p,
    presentationId: p.presentation_id,
    operatorId: p.operator_id,
    operatorName: p.operator_name,
    viewedAt: new Date(p.viewed_at),
    marked_as_seen: p.marked_as_seen,
    completion_date: p.completion_date ? new Date(p.completion_date) : undefined,
  }))
}

export async function updatePresentationProgress(
  presentationId: string,
  userId: string,
  userName: string,
  markedAsSeen: boolean,
): Promise<boolean> {
  const { error } = await supabase.from("presentation_progress").upsert(
    {
      presentation_id: presentationId,
      operator_id: userId,
      operator_name: userName,
      marked_as_seen: markedAsSeen,
      completion_date: markedAsSeen ? new Date().toISOString() : null,
      viewed_at: new Date().toISOString(),
    },
    { onConflict: "presentation_id,operator_id" },
  )

  return !error
}

// Phraseologies
export async function getPhraseologies(): Promise<Phraseology[]> {
  const { data, error } = await supabase.from("phraseologies").select("*").order("title")

  if (error) return []

  return data.map((p) => ({
    ...p,
    createdAt: new Date(p.created_at),
    updatedAt: new Date(p.updated_at),
  }))
}

export async function createPhraseology(
  phraseology: Omit<Phraseology, "id" | "createdAt" | "updatedAt">,
): Promise<Phraseology | null> {
  const { data, error } = await supabase
    .from("phraseologies")
    .insert({
      title: phraseology.title,
      content: phraseology.content,
      category: phraseology.category,
    })
    .select()
    .single()

  if (error) return null

  return {
    ...data,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  }
}

export async function updatePhraseology(phraseology: Phraseology): Promise<Phraseology | null> {
  const { data, error } = await supabase
    .from("phraseologies")
    .update({
      title: phraseology.title,
      content: phraseology.content,
      category: phraseology.category,
      updated_at: new Date().toISOString(),
    })
    .eq("id", phraseology.id)
    .select()
    .single()

  if (error) return null

  return {
    ...data,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  }
}

export async function deletePhraseology(id: string): Promise<boolean> {
  const { error } = await supabase.from("phraseologies").delete().eq("id", id)

  return !error
}

// Import Script Logic
export async function importScriptFromJson(data: any): Promise<{ productCount: number; stepCount: number }> {
  let productCount = 0
  let stepCount = 0

  if (!data.marcas) return { productCount, stepCount }

  for (const [productName, steps] of Object.entries(data.marcas)) {
    // Create or get product
    const productId = `prod-${productName.toLowerCase().replace(/\s+/g, "-")}`

    // Check if product exists
    const { data: existingProduct } = await supabase.from("products").select("id").eq("script_id", productId).single()

    let dbProductId = existingProduct?.id

    if (!dbProductId) {
      const newProduct = await createProduct({
        name: productName,
        scriptId: productId,
        category: "outros",
        isActive: true,
        attendanceTypes: ["ativo", "receptivo"],
        personTypes: ["fisica", "juridica"],
        description: `Importado de JSON`,
      })
      if (newProduct) {
        dbProductId = newProduct.id
        productCount++
      }
    }

    if (dbProductId && typeof steps === "object") {
      let order = 0
      for (const [stepKey, stepData] of Object.entries(steps as any)) {
        const step = stepData as any

        // Create script step
        await createScriptStep({
          id: "", // Generated by DB
          title: step.titulo || stepKey,
          content: step.texto || "",
          order: order++,
          productId: dbProductId,
          buttons: (step.botoes || []).map((btn: any, idx: number) => ({
            id: `btn-${Date.now()}-${idx}`,
            label: btn.texto,
            nextStepId: btn.proximo_passo,
            variant: "default",
            order: idx,
          })),
          tabulations: [],
          contentSegments: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        stepCount++
      }
    }
  }

  return { productCount, stepCount }
}

// Helper to initialize mock data (deprecated but kept for compatibility if needed)
export function initializeMockData() {
  // No-op as we're using Supabase now
}

export function cleanupOldSessions() {
  // No-op as we're using Supabase now
}

export function authenticateUser() {
  // No-op as we're using Supabase Auth directly
  return null
}

export function getCurrentUser() {
  // No-op as we're using Supabase Auth directly
  return null
}

export function logout() {
  // No-op as we're using Supabase Auth directly
}
