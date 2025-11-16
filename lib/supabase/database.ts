import { createClient } from "./client"
import type {
  User,
  ScriptStep,
  Tabulation,
  ServiceSituation,
  Channel,
  Product,
  Message,
  Quiz,
  QuizAttempt,
  ChatMessage,
  ChatSettings,
  Presentation,
  PresentationProgress,
  AttendanceType,
  PersonType,
  Note,
} from "../types"

// ============ USERS ============

export async function getAllUsers(): Promise<User[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching users:", error)
    return []
  }

  return data.map((user) => ({
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    role: user.role as "operator" | "admin",
    isOnline: user.is_online || false,
    createdAt: new Date(user.created_at),
    lastLoginAt: user.last_login_at ? new Date(user.last_login_at) : undefined,
    permissions: user.permissions || {},
    loginSessions: [],
  }))
}

export async function getUserById(id: string): Promise<User | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

  if (error || !data) return null

  return {
    id: data.id,
    username: data.username,
    fullName: data.full_name,
    role: data.role as "operator" | "admin",
    isOnline: data.is_online || false,
    createdAt: new Date(data.created_at),
    lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
    permissions: data.permissions || {},
    loginSessions: [],
  }
}

export async function createUser(
  username: string,
  fullName: string,
  role: "operator" | "admin",
  permissions: any = {},
): Promise<User | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("users")
    .insert({
      username,
      full_name: fullName,
      role,
      permissions,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating user:", error)
    return null
  }

  return {
    id: data.id,
    username: data.username,
    fullName: data.full_name,
    role: data.role as "operator" | "admin",
    isOnline: data.is_online || false,
    createdAt: new Date(data.created_at),
    permissions: data.permissions || {},
    loginSessions: [],
  }
}

export async function updateUser(user: User): Promise<void> {
  const supabase = createClient()

  let lastLoginAtISO: string | undefined
  if (user.lastLoginAt) {
    if (user.lastLoginAt instanceof Date) {
      lastLoginAtISO = user.lastLoginAt.toISOString()
    } else if (typeof user.lastLoginAt === 'string') {
      lastLoginAtISO = user.lastLoginAt
    }
  }

  const { error } = await supabase
    .from("users")
    .update({
      username: user.username,
      full_name: user.fullName,
      role: user.role,
      is_online: user.isOnline,
      last_login_at: lastLoginAtISO,
      permissions: user.permissions || {},
    })
    .eq("id", user.id)

  if (error) {
    console.error("[v0] Error updating user:", error)
  }
}

export async function deleteUser(userId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from("users").delete().eq("id", userId)

  if (error) {
    console.error("[v0] Error deleting user:", error)
  }
}

// ============ PRODUCTS ============

export async function getProducts(): Promise<Product[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching products:", error)
    return []
  }

  return data.map((product) => ({
    id: product.id,
    name: product.name,
    scriptId: product.script_id,
    category: product.category as "habitacional" | "comercial" | "outros",
    isActive: product.is_active,
    createdAt: new Date(product.created_at),
    attendanceTypes: product.attendance_types || [],
    personTypes: product.person_types || [],
    description: product.description,
  }))
}

export async function createProduct(product: Omit<Product, "id" | "createdAt">): Promise<Product | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: product.name,
      script_id: product.scriptId,
      category: product.category,
      is_active: product.isActive,
      attendance_types: product.attendanceTypes || [],
      person_types: product.personTypes || [],
      description: product.description,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating product:", error)
    return null
  }

  return {
    id: data.id,
    name: data.name,
    scriptId: data.script_id,
    category: data.category as "habitacional" | "comercial" | "outros",
    isActive: data.is_active,
    createdAt: new Date(data.created_at),
    attendanceTypes: data.attendance_types || [],
    personTypes: data.person_types || [],
    description: data.description,
  }
}

export async function updateProduct(product: Product): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("products")
    .update({
      name: product.name,
      script_id: product.scriptId,
      category: product.category,
      is_active: product.isActive,
      attendance_types: product.attendanceTypes || [],
      person_types: product.personTypes || [],
      description: product.description,
    })
    .eq("id", product.id)

  if (error) {
    console.error("[v0] Error updating product:", error)
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("products").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting product:", error)
  }
}

// ============ SCRIPT STEPS ============

export async function getScriptSteps(): Promise<ScriptStep[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("script_steps").select("*").order("order", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching script steps:", error)
    return []
  }

  return data.map((step) => ({
    id: step.id,
    productId: step.product_id,
    title: step.title,
    content: step.content,
    order: step.order,
    buttons: step.buttons || [],
    tabulations: step.tabulations || [],
    contentSegments: step.content_segments || [],
    formatting: step.formatting || {},
    alert: step.alert,
    createdAt: new Date(step.created_at),
    updatedAt: new Date(step.updated_at),
  }))
}

export async function getScriptStepsByProduct(productId: string): Promise<ScriptStep[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("script_steps")
    .select("*")
    .eq("product_id", productId)
    .order("order", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching script steps:", error)
    return []
  }

  return data.map((step) => ({
    id: step.id,
    productId: step.product_id,
    title: step.title,
    content: step.content,
    order: step.order,
    buttons: step.buttons || [],
    tabulations: step.tabulations || [],
    contentSegments: step.content_segments || [],
    formatting: step.formatting || {},
    alert: step.alert,
    createdAt: new Date(step.created_at),
    updatedAt: new Date(step.updated_at),
  }))
}

export async function createScriptStep(
  step: Omit<ScriptStep, "id" | "createdAt" | "updatedAt">,
): Promise<ScriptStep | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("script_steps")
    .insert({
      title: step.title,
      content: step.content,
      order: step.order,
      buttons: step.buttons || [],
      product_id: step.productId,
      tabulations: step.tabulations || [],
      content_segments: step.contentSegments || [],
      formatting: step.formatting || {},
      alert: step.alert,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating script step:", error)
    return null
  }

  return {
    id: data.id,
    productId: data.product_id,
    title: data.title,
    content: data.content,
    order: data.order,
    buttons: data.buttons || [],
    tabulations: data.tabulations || [],
    contentSegments: data.content_segments || [],
    formatting: data.formatting || {},
    alert: data.alert,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  }
}

export async function updateScriptStep(step: ScriptStep): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("script_steps")
    .update({
      title: step.title,
      content: step.content,
      order: step.order,
      buttons: step.buttons || [],
      product_id: step.productId,
      tabulations: step.tabulations || [],
      content_segments: step.contentSegments || [],
      formatting: step.formatting || {},
      alert: step.alert,
      updated_at: new Date().toISOString(),
    })
    .eq("id", step.id)

  if (error) {
    console.error("[v0] Error updating script step:", error)
  }
}

export async function deleteScriptStep(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("script_steps").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting script step:", error)
  }
}

// ============ TABULATIONS ============

export async function getTabulations(): Promise<Tabulation[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("tabulations").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching tabulations:", error)
    return []
  }

  return data.map((tab) => ({
    id: tab.id,
    name: tab.name,
    description: tab.description,
    color: tab.color,
    createdAt: new Date(tab.created_at),
  }))
}

export async function createTabulation(tabulation: Omit<Tabulation, "id" | "createdAt">): Promise<Tabulation | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("tabulations")
    .insert({
      name: tabulation.name,
      description: tabulation.description,
      color: tabulation.color,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating tabulation:", error)
    return null
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    color: data.color,
    createdAt: new Date(data.created_at),
  }
}

export async function updateTabulation(tabulation: Tabulation): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("tabulations")
    .update({
      name: tabulation.name,
      description: tabulation.description,
      color: tabulation.color,
    })
    .eq("id", tabulation.id)

  if (error) {
    console.error("[v0] Error updating tabulation:", error)
  }
}

export async function deleteTabulation(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("tabulations").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting tabulation:", error)
  }
}

// ============ SERVICE SITUATIONS ============

export async function getSituations(): Promise<ServiceSituation[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("service_situations")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching situations:", error)
    return []
  }

  return data.map((sit) => ({
    id: sit.id,
    name: sit.name,
    description: sit.description,
    isActive: sit.is_active,
    createdAt: new Date(sit.created_at),
    expanded: sit.expanded || false,
  }))
}

export async function createSituation(
  situation: Omit<ServiceSituation, "id" | "createdAt">,
): Promise<ServiceSituation | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("service_situations")
    .insert({
      name: situation.name,
      description: situation.description,
      is_active: situation.isActive,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating situation:", error)
    return null
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    isActive: data.is_active,
    createdAt: new Date(data.created_at),
    expanded: false,
  }
}

export async function updateSituation(situation: ServiceSituation): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("service_situations")
    .update({
      name: situation.name,
      description: situation.description,
      is_active: situation.isActive,
    })
    .eq("id", situation.id)

  if (error) {
    console.error("[v0] Error updating situation:", error)
  }
}

export async function deleteSituation(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("service_situations").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting situation:", error)
  }
}

// ============ CHANNELS ============

export async function getChannels(): Promise<Channel[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("channels").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching channels:", error)
    return []
  }

  return data.map((channel) => ({
    id: channel.id,
    name: channel.name,
    contact: channel.contact,
    isActive: channel.is_active,
    createdAt: new Date(channel.created_at),
  }))
}

export async function createChannel(channel: Omit<Channel, "id" | "createdAt">): Promise<Channel | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("channels")
    .insert({
      name: channel.name,
      contact: channel.contact,
      is_active: channel.isActive,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating channel:", error)
    return null
  }

  return {
    id: data.id,
    name: data.name,
    contact: data.contact,
    isActive: data.is_active,
    createdAt: new Date(data.created_at),
  }
}

export async function updateChannel(channel: Channel): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("channels")
    .update({
      name: channel.name,
      contact: channel.contact,
      is_active: channel.isActive,
    })
    .eq("id", channel.id)

  if (error) {
    console.error("[v0] Error updating channel:", error)
  }
}

export async function deleteChannel(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("channels").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting channel:", error)
  }
}

// ============ MESSAGES ============

export async function getMessages(): Promise<Message[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching messages:", error)
    return []
  }

  return data.map((msg) => ({
    id: msg.id,
    title: msg.title,
    content: msg.content,
    createdBy: msg.created_by,
    createdByName: msg.created_by_name,
    createdAt: new Date(msg.created_at),
    isActive: msg.is_active,
    seenBy: msg.seen_by || [],
    recipients: msg.recipients || [],
    segments: msg.segments || [],
  }))
}

export async function createMessage(message: Omit<Message, "id" | "createdAt" | "seenBy">): Promise<Message | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("messages")
    .insert({
      title: message.title,
      content: message.content,
      created_by: message.createdBy,
      created_by_name: message.createdByName,
      is_active: message.isActive,
      recipients: message.recipients || [],
      segments: message.segments || [],
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating message:", error)
    return null
  }

  return {
    id: data.id,
    title: data.title,
    content: data.content,
    createdBy: data.created_by,
    createdByName: data.created_by_name,
    createdAt: new Date(data.created_at),
    isActive: data.is_active,
    seenBy: data.seen_by || [],
    recipients: data.recipients || [],
    segments: data.segments || [],
  }
}

export async function updateMessage(message: Message): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("messages")
    .update({
      title: message.title,
      content: message.content,
      is_active: message.isActive,
      seen_by: message.seenBy || [],
      recipients: message.recipients || [],
      segments: message.segments || [],
    })
    .eq("id", message.id)

  if (error) {
    console.error("[v0] Error updating message:", error)
  }
}

export async function deleteMessage(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("messages").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting message:", error)
  }
}

// ============ QUIZZES ============

export async function getQuizzes(): Promise<Quiz[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("quizzes").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching quizzes:", error)
    return []
  }

  return data.map((quiz) => ({
    id: quiz.id,
    question: quiz.question,
    options: quiz.options,
    correctAnswer: quiz.correct_answer,
    createdBy: quiz.created_by,
    createdByName: quiz.created_by_name,
    createdAt: new Date(quiz.created_at),
    isActive: quiz.is_active,
    scheduledDate: quiz.scheduled_date ? new Date(quiz.scheduled_date) : undefined,
  }))
}

export async function createQuiz(quiz: Omit<Quiz, "id" | "createdAt">): Promise<Quiz | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("quizzes")
    .insert({
      question: quiz.question,
      options: quiz.options,
      correct_answer: quiz.correctAnswer,
      created_by: quiz.createdBy,
      created_by_name: quiz.createdByName,
      is_active: quiz.isActive,
      scheduled_date: quiz.scheduledDate?.toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating quiz:", error)
    return null
  }

  return {
    id: data.id,
    question: data.question,
    options: data.options,
    correctAnswer: data.correct_answer,
    createdBy: data.created_by,
    createdByName: data.created_by_name,
    createdAt: new Date(data.created_at),
    isActive: data.is_active,
    scheduledDate: data.scheduled_date ? new Date(data.scheduled_date) : undefined,
  }
}

export async function getQuizAttempts(): Promise<QuizAttempt[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("quiz_attempts").select("*").order("attempted_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching quiz attempts:", error)
    return []
  }

  return data.map((attempt) => ({
    id: attempt.id,
    quizId: attempt.quiz_id,
    operatorId: attempt.operator_id,
    operatorName: attempt.operator_name,
    selectedAnswer: attempt.selected_answer,
    isCorrect: attempt.is_correct,
    attemptedAt: new Date(attempt.attempted_at),
  }))
}

export async function createQuizAttempt(attempt: Omit<QuizAttempt, "id" | "attemptedAt">): Promise<QuizAttempt | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("quiz_attempts")
    .insert({
      quiz_id: attempt.quizId,
      operator_id: attempt.operatorId,
      operator_name: attempt.operatorName,
      selected_answer: attempt.selectedAnswer,
      is_correct: attempt.isCorrect,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating quiz attempt:", error)
    return null
  }

  return {
    id: data.id,
    quizId: data.quiz_id,
    operatorId: data.operator_id,
    operatorName: data.operator_name,
    selectedAnswer: data.selected_answer,
    isCorrect: data.is_correct,
    attemptedAt: new Date(data.attempted_at),
  }
}

export async function getQuizAttemptsByQuiz(quizId: string): Promise<QuizAttempt[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("quiz_id", quizId)
    .order("attempted_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching quiz attempts by quiz:", error)
    return []
  }

  return data.map((attempt) => ({
    id: attempt.id,
    quizId: attempt.quiz_id,
    operatorId: attempt.operator_id,
    operatorName: attempt.operator_name,
    selectedAnswer: attempt.selected_answer,
    isCorrect: attempt.is_correct,
    attemptedAt: new Date(attempt.attempted_at),
  }))
}

// ============ CHAT ============

export async function getChatMessages(): Promise<ChatMessage[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("chat_messages").select("*").order("created_at", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching chat messages:", error)
    return []
  }

  return data.map((msg) => ({
    id: msg.id,
    senderId: msg.sender_id,
    senderName: msg.sender_name,
    senderRole: msg.sender_role as "operator" | "admin",
    recipientId: msg.recipient_id,
    content: msg.content,
    attachment: msg.attachment,
    replyTo: msg.reply_to,
    createdAt: new Date(msg.created_at),
    isRead: msg.is_read,
  }))
}

export async function sendChatMessage(
  senderId: string,
  senderName: string,
  senderRole: "operator" | "admin",
  content: string,
  recipientId?: string,
  attachment?: any,
): Promise<ChatMessage | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole,
      recipient_id: recipientId,
      content,
      attachment,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error sending chat message:", error)
    return null
  }

  return {
    id: data.id,
    senderId: data.sender_id,
    senderName: data.sender_name,
    senderRole: data.sender_role as "operator" | "admin",
    recipientId: data.recipient_id,
    content: data.content,
    attachment: data.attachment,
    replyTo: data.reply_to,
    createdAt: new Date(data.created_at),
    isRead: data.is_read,
  }
}

export async function getChatSettings(): Promise<ChatSettings> {
  const supabase = createClient()
  const { data, error } = await supabase.from("chat_settings").select("*").limit(1).single()

  if (error || !data) {
    return { isEnabled: true, updatedAt: new Date(), updatedBy: "system" }
  }

  return {
    isEnabled: data.is_enabled,
    updatedAt: new Date(data.updated_at),
    updatedBy: data.updated_by,
  }
}

export async function updateChatSettings(settings: ChatSettings): Promise<void> {
  const supabase = createClient()

  const { data: existing, error: fetchError } = await supabase.from("chat_settings").select("*").limit(1).single()

  if (fetchError && fetchError.code !== "PGRST116") {
    // PGRST116 = no rows returned
    console.error("[v0] Error fetching chat settings:", fetchError)
    return
  }

  if (existing) {
    // Update existing settings
    const { error } = await supabase
      .from("chat_settings")
      .update({
        is_enabled: settings.isEnabled,
        updated_at: new Date().toISOString(),
        updated_by: settings.updatedBy,
      })
      .eq("id", existing.id)

    if (error) {
      console.error("[v0] Error updating chat settings:", error)
    }
  } else {
    // Create new settings without specifying ID (let UUID generate automatically)
    const { error } = await supabase.from("chat_settings").insert({
      is_enabled: settings.isEnabled,
      updated_at: new Date().toISOString(),
      updated_by: settings.updatedBy,
    })

    if (error) {
      console.error("[v0] Error creating chat settings:", error)
    }
  }
}

export async function deleteChatMessage(messageId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("chat_messages").delete().eq("id", messageId)

  if (error) {
    console.error("[v0] Error deleting chat message:", error)
  }
}

export async function updateChatMessage(message: ChatMessage): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("chat_messages")
    .update({
      content: message.content,
      is_read: message.isRead,
      attachment: message.attachment,
      reply_to: message.replyTo,
    })
    .eq("id", message.id)

  if (error) {
    console.error("[v0] Error updating chat message:", error)
  }
}

// ============ PRESENTATIONS ============

export async function getPresentations(): Promise<Presentation[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("presentations").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching presentations:", error)
    return []
  }

  return data.map((pres) => ({
    id: pres.id,
    title: pres.title,
    description: pres.description,
    slides: pres.slides || [],
    createdBy: pres.created_by,
    createdByName: pres.created_by_name,
    createdAt: new Date(pres.created_at),
    updatedAt: new Date(pres.updated_at),
    isActive: pres.is_active,
    recipients: pres.recipients || [],
  }))
}

export async function createPresentation(
  presentation: Omit<Presentation, "id" | "createdAt" | "updatedAt">,
): Promise<Presentation | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("presentations")
    .insert({
      title: presentation.title,
      description: presentation.description,
      slides: presentation.slides || [],
      created_by: presentation.createdBy,
      created_by_name: presentation.createdByName,
      is_active: presentation.isActive,
      recipients: presentation.recipients || [],
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating presentation:", error)
    return null
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    slides: data.slides || [],
    createdBy: data.created_by,
    createdByName: data.created_by_name,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    isActive: data.is_active,
    recipients: data.recipients || [],
  }
}

export async function updatePresentation(presentation: Presentation): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("presentations")
    .update({
      title: presentation.title,
      description: presentation.description,
      slides: presentation.slides || [],
      is_active: presentation.isActive,
      recipients: presentation.recipients || [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", presentation.id)

  if (error) {
    console.error("[v0] Error updating presentation:", error)
  }
}

export async function deletePresentation(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("presentations").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting presentation:", error)
  }
}

export async function getPresentationById(presentationId: string): Promise<Presentation | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from("presentations").select("*").eq("id", presentationId).single()

  if (error || !data) {
    console.error("[v0] Error fetching presentation by ID:", error)
    return null
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    slides: data.slides || [],
    createdBy: data.created_by,
    createdByName: data.created_by_name,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    isActive: data.is_active,
    recipients: data.recipients || [],
  }
}

export async function getPresentationProgress(): Promise<PresentationProgress[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("presentation_progress")
    .select("*")
    .order("viewed_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching presentation progress:", error)
    return []
  }

  return data
}

export async function getPresentationProgressByPresentation(presentationId: string): Promise<PresentationProgress[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("presentation_progress")
    .select("*")
    .eq("presentation_id", presentationId)
    .order("viewed_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching presentation progress:", error)
    return []
  }

  return data
}

export async function updatePresentationProgress(
  presentationId: string,
  operatorId: string,
  currentSlide: number,
  markedAsSeen: boolean,
): Promise<void> {
  const supabase = createClient()

  // Check if progress already exists
  const { data: existing } = await supabase
    .from("presentation_progress")
    .select("*")
    .eq("presentation_id", presentationId)
    .eq("operator_id", operatorId)
    .single()

  if (existing) {
    // Update existing progress
    const { error } = await supabase
      .from("presentation_progress")
      .update({
        current_slide: currentSlide,
        marked_as_seen: markedAsSeen,
        viewed_at: new Date().toISOString(),
      })
      .eq("id", existing.id)

    if (error) {
      console.error("[v0] Error updating presentation progress:", error)
    }
  } else {
    // Create new progress
    const { error } = await supabase.from("presentation_progress").insert({
      presentation_id: presentationId,
      operator_id: operatorId,
      current_slide: currentSlide,
      marked_as_seen: markedAsSeen,
    })

    if (error) {
      console.error("[v0] Error creating presentation progress:", error)
    }
  }
}

// ============ ATTENDANCE TYPES ============

export async function getAttendanceTypes(): Promise<AttendanceType[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("attendance_types").select("*").order("created_at", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching attendance types:", error)
    return []
  }

  return data.map((type) => ({
    id: type.id,
    value: type.value,
    label: type.label,
    createdAt: new Date(type.created_at),
  }))
}

export async function createAttendanceType(option: { value: string; label: string }): Promise<AttendanceType | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("attendance_types")
    .insert({
      value: option.value,
      label: option.label,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating attendance type:", error)
    return null
  }

  return {
    id: data.id,
    value: data.value,
    label: data.label,
    createdAt: new Date(data.created_at),
  }
}

export async function updateAttendanceType(option: { id: string; value: string; label: string }): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("attendance_types")
    .update({
      value: option.value,
      label: option.label,
    })
    .eq("id", option.id)

  if (error) {
    console.error("[v0] Error updating attendance type:", error)
  }
}

export async function deleteAttendanceType(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("attendance_types").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting attendance type:", error)
  }
}

// ============ PERSON TYPES ============

export async function getPersonTypes(): Promise<PersonType[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("person_types").select("*").order("created_at", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching person types:", error)
    return []
  }

  return data.map((type) => ({
    id: type.id,
    value: type.value,
    label: type.label,
    createdAt: new Date(type.created_at),
  }))
}

export async function createPersonType(option: { value: string; label: string }): Promise<PersonType | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("person_types")
    .insert({
      value: option.value,
      label: option.label,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating person type:", error)
    return null
  }

  return {
    id: data.id,
    value: data.value,
    label: data.label,
    createdAt: new Date(data.created_at),
  }
}

export async function updatePersonType(option: { id: string; value: string; label: string }): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("person_types")
    .update({
      value: option.value,
      label: option.label,
    })
    .eq("id", option.id)

  if (error) {
    console.error("[v0] Error updating person type:", error)
  }
}

export async function deletePersonType(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("person_types").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting person type:", error)
  }
}

// ============ NOTES ============

export async function getNotes(userId: string): Promise<Note[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error getting notes:", error)
    return []
  }

  return data.map((note) => ({
    id: note.id,
    userId: note.user_id,
    content: note.content,
    createdAt: new Date(note.created_at),
    updatedAt: new Date(note.updated_at),
  }))
}

export async function saveNote(userId: string, content: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from("notes").insert({
    user_id: userId,
    content,
  })

  if (error) {
    console.error("[v0] Error saving note:", error)
  }
}

// ============ OPERATORS ============

export async function getOperators(): Promise<User[]> {
  const users = await getAllUsers()
  return users.filter((u) => u.role === "operator")
}

// ============ SESSIONS ============

export async function getSessions(): Promise<any[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("call_sessions").select("*").order("started_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching sessions:", error)
    return []
  }

  return data.map((session) => ({
    id: session.id,
    operatorId: session.operator_id,
    currentStepId: session.current_step_id,
    startedAt: new Date(session.started_at),
    notes: session.notes || "",
  }))
}
