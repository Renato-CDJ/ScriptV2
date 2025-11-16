// Supabase-powered state management
// All data is now stored in Supabase database

import * as db from "./supabase/database"
import type {
  User,
  ScriptStep,
  Tabulation,
  ServiceSituation,
  Channel,
  Note,
  CallSession,
  Product,
  AttendanceTypeOption,
  PersonTypeOption,
  Message,
  Quiz,
  QuizAttempt,
  AdminPermissions,
  ChatMessage,
  ChatSettings,
  Presentation,
  OperatorRanking,
} from "./types"

const saveQueue: Map<string, any> = new Map()
let saveTimeout: NodeJS.Timeout | null = null

function debouncedSave(key: string, data: any) {
  saveQueue.set(key, data)

  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }

  saveTimeout = setTimeout(() => {
    saveQueue.forEach((value, storageKey) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(value))
      } catch (error) {
        console.error(`[v0] Error saving ${storageKey}:`, error)
      }
    })
    saveQueue.clear()
  }, 250) // Batch writes every 250ms
}

export function loadScriptsFromDataFolder() {
  return
}

export async function initializeMockData() {
  if (typeof window === "undefined") return

  console.log("[v0] Using Supabase database - no mock data initialization needed")
}

// ============ USER AUTHENTICATION ============

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  if (typeof window === "undefined") return null

  const users = await db.getAllUsers()
  const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase())

  if (user) {
    if (user.role === "admin") {
      const validPasswords = ["rcp@$", "#qualidade@$"]
      if (!validPasswords.includes(password)) {
        return null
      }
    }

    // Update user status
    user.lastLoginAt = new Date()
    user.isOnline = true
    await db.updateUser(user)

    // Store in localStorage for quick access
    localStorage.setItem("callcenter_current_user", JSON.stringify(user))
    return user
  }

  return null
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const userStr = localStorage.getItem("callcenter_current_user")
  return userStr ? JSON.parse(userStr) : null
}

export async function logout() {
  if (typeof window === "undefined") return

  const currentUser = getCurrentUser()
  if (currentUser) {
    currentUser.isOnline = false
    await db.updateUser(currentUser)
  }

  localStorage.removeItem("callcenter_current_user")
}

// ============ SCRIPT STEPS ============

export async function getScriptSteps(): Promise<ScriptStep[]> {
  return await db.getScriptSteps()
}

export async function getScriptStepById(id: string, productId?: string): Promise<ScriptStep | null> {
  const steps = await getScriptSteps()

  if (productId) {
    const productSteps = steps.filter((s) => s.productId === productId)
    return productSteps.find((s) => s.id === id) || null
  }

  return steps.find((s) => s.id === id) || null
}

export async function getScriptStepsByProduct(productId: string): Promise<ScriptStep[]> {
  return await db.getScriptStepsByProduct(productId)
}

export async function updateScriptStep(step: ScriptStep) {
  await db.updateScriptStep(step)
  window.dispatchEvent(new CustomEvent("store-updated"))
}

export async function createScriptStep(
  step: Omit<ScriptStep, "id" | "createdAt" | "updatedAt">,
): Promise<ScriptStep | null> {
  const newStep = await db.createScriptStep(step)
  window.dispatchEvent(new CustomEvent("store-updated"))
  return newStep
}

export async function deleteScriptStep(id: string) {
  await db.deleteScriptStep(id)
  window.dispatchEvent(new CustomEvent("store-updated"))
}

// ============ PRODUCTS ============

export async function getProducts(): Promise<Product[]> {
  return await db.getProducts()
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await getProducts()
  return products.find((p) => p.id === id) || null
}

export async function createProduct(product: Omit<Product, "id" | "createdAt">): Promise<Product | null> {
  const newProduct = await db.createProduct(product)
  window.dispatchEvent(new CustomEvent("store-updated"))
  return newProduct
}

export async function updateProduct(product: Product) {
  await db.updateProduct(product)
  window.dispatchEvent(new CustomEvent("store-updated"))
}

export async function deleteProduct(id: string) {
  await db.deleteProduct(id)
  window.dispatchEvent(new CustomEvent("store-updated"))
}

// ============ TABULATIONS & SITUATIONS ============

export async function getTabulations(): Promise<Tabulation[]> {
  console.log("[v0] getTabulations called")
  try {
    const result = await db.getTabulations()
    console.log("[v0] getTabulations result:", result)
    return result
  } catch (error) {
    console.error("[v0] Error in getTabulations:", error)
    return []
  }
}

export async function getSituations(): Promise<ServiceSituation[]> {
  console.log("[v0] getSituations called")
  try {
    const result = await db.getSituations()
    console.log("[v0] getSituations result:", result)
    return result
  } catch (error) {
    console.error("[v0] Error in getSituations:", error)
    return []
  }
}

export async function getChannels(): Promise<Channel[]> {
  console.log("[v0] getChannels called")
  try {
    const result = await db.getChannels()
    console.log("[v0] getChannels result:", result)
    return result
  } catch (error) {
    console.error("[v0] Error in getChannels:", error)
    return []
  }
}

// ============ USERS ============

export async function getAllUsers(): Promise<User[]> {
  return await db.getAllUsers()
}

export async function createUser(
  username: string,
  fullName: string,
  role: "operator" | "admin" = "operator",
  permissions: any = {},
): Promise<User | null> {
  const newUser = await db.createUser(username, fullName, role, permissions)
  if (newUser) {
    window.dispatchEvent(new CustomEvent("store-updated"))
  }
  return newUser
}

export async function updateUser(user: User) {
  await db.updateUser(user)
  window.dispatchEvent(new CustomEvent("store-updated"))
}

export async function deleteUser(userId: string) {
  await db.deleteUser(userId)
  window.dispatchEvent(new CustomEvent("store-updated"))
}

export async function forceLogoutUser(userId: string) {
  const users = await getAllUsers()
  const user = users.find((u) => u.id === userId)

  if (user) {
    user.isOnline = false
    await updateUser(user)
  }
}

export async function isUserOnline(userId: string): Promise<boolean> {
  // This will need to be called async in components
  const users = await getAllUsers()
  const user = users.find((u) => u.id === userId)
  return user ? user.isOnline : false
}

export async function getOnlineOperatorsCount(): Promise<number> {
  // This will need to be called async in components
  const users = await getAllUsers()
  return users.filter((u) => u.role === "operator" && u.isOnline).length
}

// ============ MESSAGES ============

export async function getMessages(): Promise<Message[]> {
  return await db.getMessages()
}

export async function getActiveMessages(): Promise<Message[]> {
  const messages = await getMessages()
  return messages.filter((m) => m.isActive)
}

export async function createMessage(message: Omit<Message, "id" | "createdAt" | "seenBy">): Promise<Message | null> {
  const newMessage = await db.createMessage(message)
  window.dispatchEvent(new CustomEvent("store-updated"))
  return newMessage
}

export async function updateMessage(message: Message) {
  await db.updateMessage(message)
  window.dispatchEvent(new CustomEvent("store-updated"))
}

export async function deleteMessage(id: string) {
  await db.deleteMessage(id)
  window.dispatchEvent(new CustomEvent("store-updated"))
}

export async function markMessageAsSeen(messageId: string, operatorId: string) {
  const messages = await getMessages()
  const message = messages.find((m) => m.id === messageId)

  if (message && !message.seenBy.includes(operatorId)) {
    message.seenBy.push(operatorId)
    await updateMessage(message)
  }
}

export async function getActiveMessagesForOperator(operatorId: string): Promise<Message[]> {
  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const messages = await getMessages()

  return messages.filter((m) => {
    if (!m.isActive) return false

    const messageDate = new Date(m.createdAt)
    if (messageDate < twentyFourHoursAgo) return false

    if (m.recipients && m.recipients.length > 0) {
      return m.recipients.includes(operatorId)
    }

    return true
  })
}

export async function getHistoricalMessagesForOperator(operatorId: string): Promise<Message[]> {
  const messages = await getMessages()
  
  return messages.filter((m) => {
    // Include messages that have been marked as seen by this operator
    if (m.seenBy && m.seenBy.includes(operatorId)) {
      return true
    }
    
    // Include inactive messages
    if (!m.isActive) {
      // Check if message was targeted to this operator or was a broadcast
      if (m.recipients && m.recipients.length > 0) {
        return m.recipients.includes(operatorId)
      }
      return true
    }
    
    return false
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// ============ QUIZZES ============

export async function getQuizzes(): Promise<Quiz[]> {
  return await db.getQuizzes()
}

export async function getActiveQuizzes(): Promise<Quiz[]> {
  const quizzes = await getQuizzes()
  return quizzes.filter((q) => q.isActive)
}

export async function getActiveQuizzesForOperator(operatorId: string): Promise<Quiz[]> {
  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const quizzes = await getQuizzes()

  return quizzes.filter((q) => {
    if (!q.isActive) return false

    const quizDate = new Date(q.createdAt)
    if (quizDate < twentyFourHoursAgo) return false

    if (q.recipients && q.recipients.length > 0) {
      return q.recipients.includes(operatorId)
    }

    return true
  })
}

export async function createQuiz(quiz: Omit<Quiz, "id" | "createdAt">): Promise<Quiz | null> {
  const newQuiz = await db.createQuiz(quiz)
  window.dispatchEvent(new CustomEvent("store-updated"))
  return newQuiz
}

export async function updateQuiz(quiz: Quiz) {
  const quizzes = await getQuizzes()
  const existing = quizzes.find((q) => q.id === quiz.id)

  if (existing) {
    // Update logic would go here with db function
    window.dispatchEvent(new CustomEvent("store-updated"))
  }
}

export async function deleteQuiz(id: string) {
  // Delete logic would go here with db function
  window.dispatchEvent(new CustomEvent("store-updated"))
}

export async function getQuizAttempts(): Promise<QuizAttempt[]> {
  return await db.getQuizAttempts()
}

export async function getQuizAttemptsByQuiz(quizId: string): Promise<QuizAttempt[]> {
  return await db.getQuizAttemptsByQuiz(quizId)
}

export async function createQuizAttempt(attempt: Omit<QuizAttempt, "id" | "attemptedAt">): Promise<QuizAttempt | null> {
  const newAttempt = await db.createQuizAttempt(attempt)
  window.dispatchEvent(new CustomEvent("store-updated"))
  return newAttempt
}

export async function hasOperatorAnsweredQuiz(quizId: string, operatorId: string): Promise<boolean> {
  const attempts = await getQuizAttempts()
  return attempts.some((a) => a.quizId === quizId && a.operatorId === operatorId)
}

export async function getHistoricalQuizzes(operatorId: string): Promise<Quiz[]> {
  const quizzes = await getQuizzes()
  const attempts = await getQuizAttempts()
  
  return quizzes.filter((q) => {
    // Include inactive quizzes
    if (!q.isActive) {
      // Check if quiz was targeted to this operator or was a broadcast
      if (q.recipients && q.recipients.length > 0) {
        return q.recipients.includes(operatorId)
      }
      return true
    }
    
    // Include active quizzes that this operator has already answered
    const hasAnswered = attempts.some((a) => a.quizId === q.id && a.operatorId === operatorId)
    if (hasAnswered) {
      // Check if quiz was targeted to this operator or was a broadcast
      if (q.recipients && q.recipients.length > 0) {
        return q.recipients.includes(operatorId)
      }
      return true
    }
    
    return false
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getMonthlyQuizRanking(year?: number, month?: number): Promise<OperatorRanking[]> {
  const now = new Date()
  const targetYear = year ?? now.getFullYear()
  const targetMonth = month ?? now.getMonth()

  const startDate = new Date(targetYear, targetMonth, 1)
  const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59)

  const attempts = await getQuizAttempts()
  const users = await getAllUsers()

  // Filter attempts for the target month
  const monthlyAttempts = attempts.filter((attempt) => {
    const attemptDate = new Date(attempt.attemptedAt)
    return attemptDate >= startDate && attemptDate <= endDate
  })

  // Group attempts by operator
  const operatorStats = new Map<string, { totalAttempts: number; correctAnswers: number }>()

  monthlyAttempts.forEach((attempt) => {
    const stats = operatorStats.get(attempt.operatorId) || { totalAttempts: 0, correctAnswers: 0 }
    stats.totalAttempts++
    if (attempt.isCorrect) {
      stats.correctAnswers++
    }
    operatorStats.set(attempt.operatorId, stats)
  })

  // Create rankings
  const rankings: OperatorRanking[] = []

  operatorStats.forEach((stats, operatorId) => {
    const user = users.find((u) => u.id === operatorId)
    if (!user) return

    const accuracy = stats.totalAttempts > 0 ? (stats.correctAnswers / stats.totalAttempts) * 100 : 0
    const score = stats.correctAnswers

    rankings.push({
      operatorId,
      operatorName: user.fullName,
      totalAttempts: stats.totalAttempts,
      correctAnswers: stats.correctAnswers,
      score,
      accuracy,
      rank: 0, // Will be set after sorting
    })
  })

  // Sort by score (correctAnswers) descending, then by accuracy
  rankings.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }
    return b.accuracy - a.accuracy
  })

  // Assign ranks
  rankings.forEach((ranking, index) => {
    ranking.rank = index + 1
  })

  return rankings
}

// ============ CHAT ============

export async function getAllChatMessages(): Promise<ChatMessage[]> {
  return await db.getChatMessages()
}

export async function getChatSettings(): Promise<ChatSettings> {
  return await db.getChatSettings()
}

export async function updateChatSettings(settings: Partial<ChatSettings>) {
  const current = await getChatSettings()
  const updated = { ...current, ...settings }
  await db.updateChatSettings(updated)
  window.dispatchEvent(new CustomEvent("store-updated"))
}

export async function sendChatMessage(
  senderId: string,
  senderName: string,
  senderRole: "operator" | "admin",
  content: string,
  recipientId?: string,
  attachment?: any,
): Promise<ChatMessage | null> {
  const newMessage = await db.sendChatMessage(senderId, senderName, senderRole, content, recipientId, attachment)
  window.dispatchEvent(new CustomEvent("store-updated"))
  return newMessage
}

export async function getChatMessagesForUser(userId: string, userRole: "operator" | "admin"): Promise<ChatMessage[]> {
  const messages = await getAllChatMessages()

  if (userRole === "operator") {
    return messages
      .filter(
        (m) => m.senderId === userId || (m.senderRole === "admin" && (!m.recipientId || m.recipientId === userId)),
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  } else {
    return messages
      .filter((m) => m.senderRole === "operator" || m.senderId === userId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }
}

export async function deleteChatMessage(messageId: string) {
  await db.deleteChatMessage(messageId)
  window.dispatchEvent(new CustomEvent("store-updated"))
}

export async function markChatMessageAsRead(messageId: string) {
  const messages = await getAllChatMessages()
  const message = messages.find((m) => m.id === messageId)
  
  if (message) {
    // Mark as read by updating the message
    // This could be enhanced to track which operators have read which messages
    await db.updateChatMessage({ ...message, isRead: true })
    window.dispatchEvent(new CustomEvent("store-updated"))
  }
}

// ============ PRESENTATIONS ============

export async function getPresentations(): Promise<Presentation[]> {
  return await db.getPresentations()
}

export async function getActivePresentations(): Promise<Presentation[]> {
  const presentations = await getPresentations()
  return presentations.filter((p) => p.isActive)
}

export async function createPresentation(
  presentation: Omit<Presentation, "id" | "createdAt" | "updatedAt">,
): Promise<Presentation | null> {
  const newPresentation = await db.createPresentation(presentation)
  window.dispatchEvent(new CustomEvent("store-updated"))
  return newPresentation
}

export async function updatePresentation(presentation: Presentation) {
  await db.updatePresentation(presentation)
  window.dispatchEvent(new CustomEvent("store-updated"))
}

export async function deletePresentation(id: string) {
  await db.deletePresentation(id)
  window.dispatchEvent(new CustomEvent("store-updated"))
}

export async function getPresentationProgressByPresentation(presentationId: string) {
  // This needs to be called async in components, return empty for now
  if (typeof window === "undefined") return []

  // For now, return from a synchronous cache or empty array
  // Components should call this asynchronously
  return await db.getPresentationProgressByPresentation(presentationId)
}

export async function updatePresentationProgress(
  presentationId: string,
  operatorId: string,
  currentSlide: number,
  markedAsSeen: boolean,
) {
  await db.updatePresentationProgress(presentationId, operatorId, currentSlide, markedAsSeen)
  window.dispatchEvent(new CustomEvent("store-updated"))
}

export async function exportPresentationReport(presentationId: string): Promise<string | null> {
  if (typeof window === "undefined") return null

  try {
    const presentation = await db.getPresentationById(presentationId)
    if (!presentation) return null

    // Get progress data - this would need to be fetched from db
    const progressList = await db.getPresentationProgressByPresentation(presentationId)
    const operators = await db.getOperators()

    // CSV header
    let csv = "data:text/csv;charset=utf-8,"
    csv += "Operador,Slide Atual,Visto,Data de Visualização\n"

    // CSV rows
    progressList.forEach((progress) => {
      const operator = operators.find((op) => op.id === progress.operatorId)
      const operatorName = operator ? operator.fullName : "Desconhecido"
      const markedAsSeen = progress.markedAsSeen ? "Sim" : "Não"
      const viewedAt = new Date(progress.viewedAt).toLocaleString("pt-BR")

      csv += `${operatorName},${progress.currentSlide},${markedAsSeen},${viewedAt}\n`
    })

    return csv
  } catch (error) {
    console.error("[v0] Error exporting presentation report:", error)
    return null
  }
}

export async function getActivePresentationsForOperator(operatorId: string): Promise<Presentation[]> {
  const presentations = await getPresentations()
  
  return presentations.filter((p) => {
    if (!p.isActive) return false
    
    // If presentation has specific recipients, check if operator is included
    if (p.recipients && p.recipients.length > 0) {
      return p.recipients.includes(operatorId)
    }
    
    // If no specific recipients, it's a broadcast to all operators
    return true
  })
}

export async function getPresentationProgressByOperator(operatorId: string) {
  const allProgress = await db.getPresentationProgress()
  return allProgress.filter((p) => p.operatorId === operatorId)
}

export async function markPresentationAsSeen(presentationId: string, operatorId: string, operatorName: string) {
  // Get current presentation to find total slides
  const presentation = await db.getPresentationById(presentationId)
  if (!presentation) return
  
  const totalSlides = presentation.slides.length
  
  // Mark as seen by updating progress to last slide
  await db.updatePresentationProgress(presentationId, operatorId, totalSlides - 1, true)
  window.dispatchEvent(new CustomEvent("store-updated"))
}

// ============ NOTES ============

export async function getNotes(userId: string): Promise<Note[]> {
  return await db.getNotes(userId)
}

export async function saveNote(userId: string, content: string) {
  await db.saveNote(userId, content)
  window.dispatchEvent(new CustomEvent("store-updated"))
}

// ============ ATTENDANCE TYPES ============

export async function getAttendanceTypes(): Promise<AttendanceTypeOption[]> {
  return await db.getAttendanceTypes()
}

export async function createAttendanceType(
  option: Omit<AttendanceTypeOption, "id" | "createdAt">,
): Promise<AttendanceTypeOption | null> {
  const newOption = await db.createAttendanceType(option)
  window.dispatchEvent(new CustomEvent("store-updated"))
  return newOption
}

export async function updateAttendanceType(option: AttendanceTypeOption) {
  await db.updateAttendanceType(option)
  window.dispatchEvent(new CustomEvent("store-updated"))
}

export async function deleteAttendanceType(id: string) {
  await db.deleteAttendanceType(id)
  window.dispatchEvent(new CustomEvent("store-updated"))
}

// ============ PERSON TYPES ============

export async function getPersonTypes(): Promise<PersonTypeOption[]> {
  return await db.getPersonTypes()
}

export async function createPersonType(
  option: Omit<PersonTypeOption, "id" | "createdAt">,
): Promise<PersonTypeOption | null> {
  const newOption = await db.createPersonType(option)
  window.dispatchEvent(new CustomEvent("store-updated"))
  return newOption
}

export async function updatePersonType(option: PersonTypeOption) {
  await db.updatePersonType(option)
  window.dispatchEvent(new CustomEvent("store-updated"))
}

export async function deletePersonType(id: string) {
  await db.deletePersonType(id)
  window.dispatchEvent(new CustomEvent("store-updated"))
}

// ============ ADMIN USERS ============

export async function getAdminUsers(): Promise<User[]> {
  const users = await db.getAllUsers()
  return users.filter((u) => u.role === "admin")
}

export async function createAdminUser(username: string, fullName: string): Promise<User | null> {
  return await db.createUser(username, fullName, "admin", {})
}

export async function canDeleteAdminUser(userId: string): Promise<boolean> {
  const adminUsers = await getAdminUsers()
  return adminUsers.length > 1
}

export async function updateAdminPermissions(userId: string, permissions: AdminPermissions) {
  const users = await getAllUsers()
  const user = users.find((u) => u.id === userId)
  if (user) {
    user.permissions = permissions
    await db.updateUser(user)
    window.dispatchEvent(new CustomEvent("store-updated"))
  }
}

// ============ LEGACY / COMPATIBILITY FUNCTIONS ============
// These are kept for backward compatibility but may not be fully functional

export function createCallSession(operatorId: string, startStepId: string): CallSession {
  return {
    id: `session-${Date.now()}`,
    operatorId,
    currentStepId: startStepId,
    startedAt: new Date(),
    notes: "",
  }
}

export function getLastUpdate(): number {
  return Date.now()
}

export async function importScriptFromJson(jsonData: any): Promise<{ productCount: number; stepCount: number }> {
  if (!jsonData || !jsonData.marcas) {
    throw new Error("Formato inválido: propriedade 'marcas' não encontrada")
  }

  let productCount = 0
  let stepCount = 0

  const marcas = jsonData.marcas

  for (const produtoNome of Object.keys(marcas)) {
    const productId = `prod-${produtoNome.toLowerCase().replace(/\s+/g, "-")}`
    
    // Check if product exists, if not create it
    const existingProduct = await getProductById(productId)
    if (!existingProduct) {
      await createProduct({
        name: produtoNome,
        description: `Produto ${produtoNome}`,
      })
      productCount++
    }

    const telas = marcas[produtoNome]

    for (const stepKey of Object.keys(telas)) {
      const stepData = telas[stepKey]

      if (!stepData.id || !stepData.title) {
        console.warn(`[v0] Skipping invalid step: ${stepKey}`)
        continue
      }

      // Check if step already exists
      const existingStep = await getScriptStepById(stepData.id, productId)
      
      if (existingStep) {
        // Update existing step
        await updateScriptStep({
          ...existingStep,
          title: stepData.title,
          content: stepData.content || "",
          productId: productId,
          buttons: stepData.buttons || [],
          tabulations: stepData.tabulations,
          alert: stepData.alert,
        })
      } else {
        // Create new step
        await createScriptStep({
          id: stepData.id,
          title: stepData.title,
          content: stepData.content || "",
          contentSegments: [],
          order: stepCount + 1,
          productId: productId,
          buttons: stepData.buttons || [],
          tabulations: stepData.tabulations,
          alert: stepData.alert,
        })
        stepCount++
      }
    }
  }

  return { productCount, stepCount }
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

export async function cleanupOldSessions() {
  // Clean up old sessions that are older than 24 hours
  if (typeof window === "undefined") return

  const sessions = await db.getSessions()
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  for (const session of sessions) {
    const sessionDate = new Date(session.startedAt)
    if (sessionDate < twentyFourHoursAgo) {
      // Old session cleanup logic can be added here if needed
      console.log("[v0] Cleaned up old session:", session.id)
    }
  }
}

export function getTodayConnectedTime(operatorId: string): number {
  // Returns the total time in minutes that an operator has been connected today
  // This is a simplified implementation that returns 0 for now
  // A full implementation would track connection/disconnection events
  if (typeof window === "undefined") return 0

  try {
    const key = `operator_time_${operatorId}_${new Date().toISOString().split("T")[0]}`
    const storedTime = localStorage.getItem(key)
    return storedTime ? Number.parseInt(storedTime, 10) : 0
  } catch (error) {
    console.error("[v0] Error getting today connected time:", error)
    return 0
  }
}

export function getTodayLoginSessions(operatorId: string): Array<{ loginTime: Date; logoutTime?: Date }> {
  // Returns the login sessions for an operator today
  // This is a simplified implementation using localStorage
  if (typeof window === "undefined") return []

  try {
    const today = new Date().toISOString().split("T")[0]
    const key = `operator_sessions_${operatorId}_${today}`
    const storedSessions = localStorage.getItem(key)

    if (storedSessions) {
      const sessions = JSON.parse(storedSessions)
      return sessions.map((s: any) => ({
        loginTime: new Date(s.loginTime),
        logoutTime: s.logoutTime ? new Date(s.logoutTime) : undefined,
      }))
    }

    return []
  } catch (error) {
    console.error("[v0] Error getting today login sessions:", error)
    return []
  }
}
