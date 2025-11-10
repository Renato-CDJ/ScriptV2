"use client"

// Supabase-based state management replacing localStorage
// Provides real-time database integration with the same API as the old store

import { createBrowserClient } from "@/lib/supabase/client"
import type { User, ScriptStep, Product, ChatMessage, Message, Quiz, QuizAttempt, Training } from "./types"

const supabase = createBrowserClient()

export async function initializeSupabaseData() {
  // Check if admin user exists
  const { data: adminUser } = await supabase.from("users").select("*").eq("username", "admin").single()

  if (!adminUser) {
    console.log("[v0] Admin user not found in database. Please run SQL scripts first.")
  }
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  try {
    // Query user from database
    const { data: user, error } = await supabase.from("users").select("*").eq("username", username).single()

    if (error || !user) {
      console.error("[v0] User not found:", error)
      return null
    }

    // Verify password (in production, use proper password hashing)
    if (user.role === "admin") {
      const validPasswords = ["rcp@$", "#qualidade@$"]
      if (!validPasswords.includes(password)) {
        return null
      }
    }

    // Create login session
    const { data: session } = await supabase
      .from("login_sessions")
      .insert({
        user_id: user.id,
        login_at: new Date().toISOString(),
      })
      .select()
      .single()

    // Update user online status
    await supabase
      .from("users")
      .update({
        is_online: true,
        last_login_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    // Transform database user to app User type
    const appUser: User = {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      isOnline: true,
      createdAt: new Date(user.created_at),
      lastLoginAt: new Date(),
      permissions: user.permissions || {},
    }

    // Store in sessionStorage for client-side access
    if (typeof window !== "undefined") {
      sessionStorage.setItem("current_user", JSON.stringify(appUser))
    }

    return appUser
  } catch (error) {
    console.error("[v0] Authentication error:", error)
    return null
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const userStr = sessionStorage.getItem("current_user")
  return userStr ? JSON.parse(userStr) : null
}

export async function logout() {
  const currentUser = getCurrentUser()

  if (currentUser) {
    // Update logout time in most recent session
    await supabase
      .from("login_sessions")
      .update({
        logout_at: new Date().toISOString(),
      })
      .eq("user_id", currentUser.id)
      .is("logout_at", null)
      .order("login_at", { ascending: false })
      .limit(1)

    // Update user online status
    await supabase.from("users").update({ is_online: false }).eq("id", currentUser.id)
  }

  if (typeof window !== "undefined") {
    sessionStorage.removeItem("current_user")
  }
}

export async function getScriptSteps(): Promise<ScriptStep[]> {
  const { data, error } = await supabase.from("script_steps").select("*").order("order", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching script steps:", error)
    return []
  }

  return data.map(transformScriptStep)
}

export async function getScriptStepById(id: string, productId?: string): Promise<ScriptStep | null> {
  let query = supabase.from("script_steps").select("*").eq("id", id)

  if (productId) {
    query = query.eq("product_id", productId)
  }

  const { data, error } = await query.single()

  if (error || !data) {
    return null
  }

  return transformScriptStep(data)
}

export async function getScriptStepsByProduct(productId: string): Promise<ScriptStep[]> {
  const { data, error } = await supabase
    .from("script_steps")
    .select("*")
    .eq("product_id", productId)
    .order("order", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching product script steps:", error)
    return []
  }

  return data.map(transformScriptStep)
}

export async function updateScriptStep(step: ScriptStep) {
  const { error } = await supabase
    .from("script_steps")
    .update({
      title: step.title,
      content: step.content,
      order: step.order,
      buttons: step.buttons,
      content_segments: step.contentSegments,
      formatting: step.formatting,
      alert: step.alert,
      tabulations: step.tabulations,
      updated_at: new Date().toISOString(),
    })
    .eq("id", step.id)

  if (error) {
    console.error("[v0] Error updating script step:", error)
  }
}

export async function createScriptStep(step: Omit<ScriptStep, "id" | "createdAt" | "updatedAt">): Promise<ScriptStep> {
  const { data, error } = await supabase
    .from("script_steps")
    .insert({
      product_id: step.productId,
      title: step.title,
      content: step.content,
      order: step.order,
      buttons: step.buttons,
      content_segments: step.contentSegments,
      formatting: step.formatting,
      alert: step.alert,
      tabulations: step.tabulations,
    })
    .select()
    .single()

  if (error || !data) {
    console.error("[v0] Error creating script step:", error)
    throw error
  }

  return transformScriptStep(data)
}

export async function deleteScriptStep(id: string) {
  const { error } = await supabase.from("script_steps").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting script step:", error)
  }
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching products:", error)
    return []
  }

  return data.map(transformProduct)
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

  if (error || !data) {
    return null
  }

  return transformProduct(data)
}

export async function createProduct(product: Omit<Product, "id" | "createdAt">): Promise<Product> {
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

  if (error || !data) {
    console.error("[v0] Error creating product:", error)
    throw error
  }

  return transformProduct(data)
}

export async function updateProduct(product: Product) {
  const { error } = await supabase
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

  if (error) {
    console.error("[v0] Error updating product:", error)
  }
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting product:", error)
  }
}

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching users:", error)
    return []
  }

  return data.map(transformUser)
}

export async function updateUser(user: User) {
  const { error } = await supabase
    .from("users")
    .update({
      username: user.username,
      full_name: user.fullName,
      role: user.role,
      is_online: user.isOnline,
      permissions: user.permissions,
    })
    .eq("id", user.id)

  if (error) {
    console.error("[v0] Error updating user:", error)
  }
}

export async function deleteUser(userId: string) {
  const { error } = await supabase.from("users").delete().eq("id", userId)

  if (error) {
    console.error("[v0] Error deleting user:", error)
  }
}

export async function getAllChatMessages(): Promise<ChatMessage[]> {
  const { data, error } = await supabase.from("chat_messages").select("*").order("created_at", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching chat messages:", error)
    return []
  }

  return data.map(transformChatMessage)
}

export async function sendChatMessage(
  senderId: string,
  senderName: string,
  senderRole: "operator" | "admin",
  content: string,
  recipientId?: string,
  attachment?: { type: "image"; url: string; name: string },
  replyTo?: { messageId: string; content: string; senderName: string },
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole,
      recipient_id: recipientId,
      content,
      attachment,
      reply_to: replyTo,
      is_read: false,
    })
    .select()
    .single()

  if (error || !data) {
    console.error("[v0] Error sending chat message:", error)
    throw error
  }

  return transformChatMessage(data)
}

export async function getChatMessagesForUser(userId: string, userRole: "operator" | "admin"): Promise<ChatMessage[]> {
  let query = supabase.from("chat_messages").select("*")

  if (userRole === "operator") {
    query = query.or(
      `sender_id.eq.${userId},and(sender_role.eq.admin,or(recipient_id.is.null,recipient_id.eq.${userId}))`,
    )
  } else {
    query = query.or(`sender_role.eq.operator,sender_id.eq.${userId}`)
  }

  const { data, error } = await query.order("created_at", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching user chat messages:", error)
    return []
  }

  return data.map(transformChatMessage)
}

export async function getUnreadChatCount(userId: string, userRole: "operator" | "admin"): Promise<number> {
  const messages = await getChatMessagesForUser(userId, userRole)
  return messages.filter((m) => !m.isRead && m.senderId !== userId).length
}

export async function markChatMessageAsRead(messageId: string) {
  const { error } = await supabase.from("chat_messages").update({ is_read: true }).eq("id", messageId)

  if (error) {
    console.error("[v0] Error marking message as read:", error)
  }
}

// Helper transformation functions
function transformScriptStep(data: any): ScriptStep {
  return {
    id: data.id,
    productId: data.product_id,
    title: data.title,
    content: data.content,
    order: data.order,
    buttons: data.buttons || [],
    contentSegments: data.content_segments || [],
    formatting: data.formatting,
    alert: data.alert,
    tabulations: data.tabulations || [],
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  }
}

function transformProduct(data: any): Product {
  return {
    id: data.id,
    name: data.name,
    scriptId: data.script_id,
    category: data.category,
    isActive: data.is_active,
    attendanceTypes: data.attendance_types,
    personTypes: data.person_types,
    description: data.description,
    createdAt: new Date(data.created_at),
  }
}

function transformUser(data: any): User {
  return {
    id: data.id,
    username: data.username,
    fullName: data.full_name,
    role: data.role,
    isOnline: data.is_online,
    createdAt: new Date(data.created_at),
    lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
    permissions: data.permissions || {},
  }
}

function transformChatMessage(data: any): ChatMessage {
  return {
    id: data.id,
    senderId: data.sender_id,
    senderName: data.sender_name,
    senderRole: data.sender_role,
    recipientId: data.recipient_id,
    content: data.content,
    attachment: data.attachment,
    replyTo: data.reply_to,
    createdAt: new Date(data.created_at),
    isRead: data.is_read,
  }
}

export async function getMessages(): Promise<Message[]> {
  const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching messages:", error)
    return []
  }

  return data.map((m: any) => ({
    id: m.id,
    content: m.content,
    senderName: m.sender_name,
    senderId: m.sender_id,
    createdAt: new Date(m.created_at),
    type: m.type || "message",
  }))
}

export async function createMessage(content: string, senderName: string, senderId: string): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      content,
      sender_name: senderName,
      sender_id: senderId,
      type: "message",
    })
    .select()
    .single()

  if (error || !data) {
    console.error("[v0] Error creating message:", error)
    throw error
  }

  return {
    id: data.id,
    content: data.content,
    senderName: data.sender_name,
    senderId: data.sender_id,
    createdAt: new Date(data.created_at),
    type: data.type,
  }
}

export async function updateMessage(id: string, content: string) {
  const { error } = await supabase.from("messages").update({ content }).eq("id", id)

  if (error) {
    console.error("[v0] Error updating message:", error)
  }
}

export async function deleteMessage(id: string) {
  const { error } = await supabase.from("messages").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting message:", error)
  }
}

export async function markMessageAsSeen(messageId: string, userId: string) {
  // Track message views in a separate table if needed
  const { error } = await supabase.from("message_views").insert({
    message_id: messageId,
    user_id: userId,
    viewed_at: new Date().toISOString(),
  })

  if (error) {
    console.error("[v0] Error marking message as seen:", error)
  }
}

export async function getQuizzes(): Promise<Quiz[]> {
  const { data, error } = await supabase.from("quiz").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching quizzes:", error)
    return []
  }

  return data.map((q: any) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    correctAnswer: q.correct_answer,
    points: q.points,
    createdAt: new Date(q.created_at),
    createdBy: q.created_by,
  }))
}

export async function createQuiz(quiz: Omit<Quiz, "id" | "createdAt">): Promise<Quiz> {
  const { data, error } = await supabase
    .from("quiz")
    .insert({
      question: quiz.question,
      options: quiz.options,
      correct_answer: quiz.correctAnswer,
      points: quiz.points,
      created_by: quiz.createdBy,
    })
    .select()
    .single()

  if (error || !data) {
    console.error("[v0] Error creating quiz:", error)
    throw error
  }

  return {
    id: data.id,
    question: data.question,
    options: data.options,
    correctAnswer: data.correct_answer,
    points: data.points,
    createdAt: new Date(data.created_at),
    createdBy: data.created_by,
  }
}

export async function updateQuiz(quiz: Quiz) {
  const { error } = await supabase
    .from("quiz")
    .update({
      question: quiz.question,
      options: quiz.options,
      correct_answer: quiz.correctAnswer,
      points: quiz.points,
    })
    .eq("id", quiz.id)

  if (error) {
    console.error("[v0] Error updating quiz:", error)
  }
}

export async function deleteQuiz(id: string) {
  const { error } = await supabase.from("quiz").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting quiz:", error)
  }
}

export async function getQuizAttempts(userId: string): Promise<QuizAttempt[]> {
  const { data, error } = await supabase
    .from("quiz_responses")
    .select("*")
    .eq("user_id", userId)
    .order("answered_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching quiz attempts:", error)
    return []
  }

  return data.map((a: any) => ({
    id: a.id,
    quizId: a.quiz_id,
    userId: a.user_id,
    isCorrect: a.is_correct,
    pointsEarned: a.points_earned,
    answeredAt: new Date(a.answered_at),
  }))
}

export async function createQuizAttempt(attempt: Omit<QuizAttempt, "id" | "answeredAt">): Promise<QuizAttempt> {
  const { data, error } = await supabase
    .from("quiz_responses")
    .insert({
      quiz_id: attempt.quizId,
      user_id: attempt.userId,
      is_correct: attempt.isCorrect,
      points_earned: attempt.pointsEarned,
    })
    .select()
    .single()

  if (error || !data) {
    console.error("[v0] Error creating quiz attempt:", error)
    throw error
  }

  return {
    id: data.id,
    quizId: data.quiz_id,
    userId: data.user_id,
    isCorrect: data.is_correct,
    pointsEarned: data.points_earned,
    answeredAt: new Date(data.answered_at),
  }
}

export async function getMonthlyQuizRanking(month: number, year: number) {
  const { data, error } = await supabase.rpc("get_monthly_quiz_ranking", {
    target_month: month,
    target_year: year,
  })

  if (error) {
    console.error("[v0] Error fetching quiz ranking:", error)
    return []
  }

  return data
}

export function getCurrentMonthName(): string {
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]
  return months[new Date().getMonth()]
}

export async function getTrainings(): Promise<Training[]> {
  const { data, error } = await supabase.from("trainings").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching trainings:", error)
    return []
  }

  return data.map((t: any) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    fileUrl: t.file_url,
    fileName: t.file_name,
    fileType: t.file_type,
    fileSize: t.file_size,
    createdBy: t.created_by,
    createdAt: new Date(t.created_at),
  }))
}

export async function createTraining(training: Omit<Training, "id" | "createdAt">): Promise<Training> {
  const { data, error } = await supabase
    .from("trainings")
    .insert({
      title: training.title,
      description: training.description,
      file_url: training.fileUrl,
      file_name: training.fileName,
      file_type: training.fileType,
      file_size: training.fileSize,
      created_by: training.createdBy,
    })
    .select()
    .single()

  if (error || !data) {
    console.error("[v0] Error creating training:", error)
    throw error
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    fileUrl: data.file_url,
    fileName: data.file_name,
    fileType: data.file_type,
    fileSize: data.file_size,
    createdBy: data.created_by,
    createdAt: new Date(data.created_at),
  }
}

export async function updateTraining(training: Training) {
  const { error } = await supabase
    .from("trainings")
    .update({
      title: training.title,
      description: training.description,
    })
    .eq("id", training.id)

  if (error) {
    console.error("[v0] Error updating training:", error)
  }
}

export async function deleteTraining(id: string) {
  const { error } = await supabase.from("trainings").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting training:", error)
  }
}

export async function markTrainingAsViewed(trainingId: string, userId: string) {
  const { error } = await supabase.from("training_views").insert({
    training_id: trainingId,
    user_id: userId,
  })

  if (error && error.code !== "23505") {
    // Ignore unique constraint violations
    console.error("[v0] Error marking training as viewed:", error)
  }
}

export async function getTrainingViews(trainingId: string): Promise<string[]> {
  const { data, error } = await supabase.from("training_views").select("user_id").eq("training_id", trainingId)

  if (error) {
    console.error("[v0] Error fetching training views:", error)
    return []
  }

  return data.map((v: any) => v.user_id)
}

export async function hasUserViewedTraining(trainingId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("training_views")
    .select("id")
    .eq("training_id", trainingId)
    .eq("user_id", userId)
    .single()

  return !error && !!data
}

export function getTabulations() {
  return [
    { id: "1", name: "Situação", color: "#3b82f6" },
    { id: "2", name: "Protocolo", color: "#10b981" },
    { id: "3", name: "Observações", color: "#f59e0b" },
  ]
}

export function getSituations() {
  return [
    "Atendimento Realizado",
    "Cliente Ausente",
    "Retornar Ligação",
    "Transferido para Supervisor",
    "Problema Resolvido",
  ]
}

export function getChannels() {
  return ["Telefone", "Email", "Chat", "WhatsApp", "Presencial"]
}

export function getAttendanceTypes() {
  return ["Suporte", "Vendas", "SAC", "Cancelamento", "Reclamação"]
}

export function getPersonTypes() {
  return ["Pessoa Física", "Pessoa Jurídica"]
}
