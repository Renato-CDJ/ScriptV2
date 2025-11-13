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
  LoginSession,
  AttendanceTypeOption,
  PersonTypeOption,
  Message,
  Quiz,
  QuizAttempt,
  AdminPermissions,
  ChatMessage,
  ChatSettings,
  Presentation,
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
  return await db.getTabulations()
}

export async function getSituations(): Promise<ServiceSituation[]> {
  return await db.getSituations()
}

export async function getChannels(): Promise<Channel[]> {
  return await db.getChannels()
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

export function isUserOnline(userId: string): boolean {
  // This will need to be called async in components
  return false
}

export function getOnlineOperatorsCount(): number {
  // This will need to be called async in components
  return 0
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

// ============ QUIZZES ============

export async function getQuizzes(): Promise<Quiz[]> {
  return await db.getQuizzes()
}

export async function getActiveQuizzes(): Promise<Quiz[]> {
  const quizzes = await getQuizzes()
  return quizzes.filter((q) => q.isActive)
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

export async function createQuizAttempt(attempt: Omit<QuizAttempt, "id" | "attemptedAt">): Promise<QuizAttempt | null> {
  const newAttempt = await db.createQuizAttempt(attempt)
  window.dispatchEvent(new CustomEvent("store-updated"))
  return newAttempt
}

export async function hasOperatorAnsweredQuiz(quizId: string, operatorId: string): Promise<boolean> {
  const attempts = await getQuizAttempts()
  return attempts.some((a) => a.quizId === quizId && a.operatorId === operatorId)
}

// ============ CHAT ============

export async function getAllChatMessages(): Promise<ChatMessage[]> {
  return await db.getChatMessages()
}

export async function getChatSettings(): Promise<ChatSettings> {
  return await db.getChatSettings()
}

export async function updateChatSettings(settings: ChatSettings) {
  // Would need db function for this
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

// ============ LEGACY / COMPATIBILITY FUNCTIONS ============
// These are kept for backward compatibility but may not be fully functional

export function getNotes(userId: string): Note[] {
  return []
}

export function saveNote(userId: string, content: string) {
  // Would need database implementation
}

export function createCallSession(operatorId: string, startStepId: string): CallSession {
  return {
    id: `session-${Date.now()}`,
    operatorId,
    currentStepId: startStepId,
    startedAt: new Date(),
    notes: "",
  }
}

export function updateCallSession(session: CallSession) {
  // Would need database implementation
}

export function getTodayLoginSessions(userId: string): LoginSession[] {
  return []
}

export function getTodayConnectedTime(userId: string): number {
  return 0
}

export function getLastUpdate(): number {
  return Date.now()
}

export function importScriptFromJson(jsonData: any): { productCount: number; stepCount: number } {
  return { productCount: 0, stepCount: 0 }
}

export function clearCaches() {
  // No longer needed with Supabase
}

export function getAttendanceTypes(): AttendanceTypeOption[] {
  return []
}

export function getPersonTypes(): PersonTypeOption[] {
  return []
}

export function createAttendanceType(option: Omit<AttendanceTypeOption, "id" | "createdAt">): AttendanceTypeOption {
  return { ...option, id: "", createdAt: new Date() }
}

export function updateAttendanceType(option: AttendanceTypeOption) {
  // Would need database implementation
}

export function deleteAttendanceType(id: string) {
  // Would need database implementation
}

export function createPersonType(option: Omit<PersonTypeOption, "id" | "createdAt">): PersonTypeOption {
  return { ...option, id: "", createdAt: new Date() }
}

export function updatePersonType(option: PersonTypeOption) {
  // Would need database implementation
}

export function deletePersonType(id: string) {
  // Would need database implementation
}

export function updateAdminPermissions(userId: string, permissions: AdminPermissions) {
  // Would need database implementation
}

export function getAdminUsers(): User[] {
  return []
}

export function createAdminUser(username: string, fullName: string): User | null {
  return null
}

export function canDeleteAdminUser(userId: string): boolean {
  return false
}

export function cleanupOldSessions() {
  // No longer needed with Supabase
}

export interface OperatorRanking {
  operatorId: string
  operatorName: string
  totalAttempts: number
  correctAnswers: number
  score: number
  accuracy: number
  rank: number
}

export function getMonthlyQuizRanking(year?: number, month?: number): OperatorRanking[] {
  return []
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
