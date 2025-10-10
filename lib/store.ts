// Client-side state management using localStorage for prototype
// This will be replaced with real database integration later

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
} from "./types"
import { loadHabitacionalScript, loadScriptFromJson } from "./habitacional-loader"

// Mock data for demonstration
const MOCK_USERS: User[] = [
  {
    id: "1",
    username: "admin",
    fullName: "Administrador Sistema",
    role: "admin",
    isOnline: true,
    createdAt: new Date(),
  },
]

const MOCK_SCRIPT_STEPS: ScriptStep[] = loadHabitacionalScript()

const MOCK_TABULATIONS: Tabulation[] = [
  {
    id: "tab-1",
    name: "Acordo Fechado",
    description: "Cliente aceitou a proposta",
    color: "#10b981",
    createdAt: new Date(),
  },
  {
    id: "tab-2",
    name: "Retorno Agendado",
    description: "Cliente pediu para ligar depois",
    color: "#3b82f6",
    createdAt: new Date(),
  },
  { id: "tab-3", name: "Recusa", description: "Cliente recusou a proposta", color: "#ef4444", createdAt: new Date() },
  {
    id: "tab-4",
    name: "Número Errado",
    description: "Contato não pertence ao cliente",
    color: "#6b7280",
    createdAt: new Date(),
  },
]

const MOCK_SITUATIONS: ServiceSituation[] = [
  {
    id: "sit-1",
    name: "Atendimento Ativo",
    description: "Operador está em ligação ativa com o cliente, realizando o atendimento conforme o script.",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-2",
    name: "Pausa",
    description: "Operador está em pausa para descanso, alimentação ou necessidades pessoais.",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-3",
    name: "Pós-Atendimento",
    description: "Operador está finalizando registros, anotações e tabulação do atendimento anterior.",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-4",
    name: "Disponível",
    description: "Operador está disponível e aguardando novo atendimento.",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-5",
    name: "Treinamento",
    description: "Operador está participando de treinamento ou capacitação.",
    isActive: true,
    createdAt: new Date(),
  },
]

const MOCK_CHANNELS: Channel[] = [
  {
    id: "ch-1",
    name: "Alô CAIXA",
    contact: "4004 0 104 (Capitais e Regiões Metropolitanas) | 0800 104 0 104 (Demais regiões)",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "ch-2",
    name: "Atendimento CAIXA Cidadão",
    contact: "0800 726 0207",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "ch-3",
    name: "Agência Digital",
    contact: "4004 0 104 (Capitais) | 0800 104 0 104 (Demais regiões)",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "ch-4",
    name: "Atendimento para Pessoas Surdas",
    contact: "https://icom.app/8AG8Z | www.caixa.gov.br/libras",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "ch-5",
    name: "SAC CAIXA",
    contact: "0800 726 0101",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "ch-6",
    name: "Ouvidoria CAIXA",
    contact: "0800 725 7474",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "ch-7",
    name: "Canal de Denúncias",
    contact: "0800 721 0738 | https://www.caixa.gov.br/denuncia",
    isActive: true,
    createdAt: new Date(),
  },
]

// Storage keys
const STORAGE_KEYS = {
  USERS: "callcenter_users",
  CURRENT_USER: "callcenter_current_user",
  SCRIPT_STEPS: "callcenter_script_steps",
  TABULATIONS: "callcenter_tabulations",
  SITUATIONS: "callcenter_situations",
  CHANNELS: "callcenter_channels",
  NOTES: "callcenter_notes",
  SESSIONS: "callcenter_sessions",
  PRODUCTS: "callcenter_products",
  LAST_UPDATE: "callcenter_last_update", // Track last update for real-time sync
}

// Initialize mock data
export function initializeMockData() {
  if (typeof window === "undefined") return

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS))
  }

  const habitacionalSteps = loadHabitacionalScript()
  if (!localStorage.getItem(STORAGE_KEYS.SCRIPT_STEPS)) {
    localStorage.setItem(STORAGE_KEYS.SCRIPT_STEPS, JSON.stringify(habitacionalSteps))
  }

  if (!localStorage.getItem(STORAGE_KEYS.TABULATIONS)) {
    localStorage.setItem(STORAGE_KEYS.TABULATIONS, JSON.stringify(MOCK_TABULATIONS))
  }
  if (!localStorage.getItem(STORAGE_KEYS.SITUATIONS)) {
    localStorage.setItem(STORAGE_KEYS.SITUATIONS, JSON.stringify(MOCK_SITUATIONS))
  }
  if (!localStorage.getItem(STORAGE_KEYS.CHANNELS)) {
    localStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(MOCK_CHANNELS))
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTES)) {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify([]))
  }
  if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]))
  }

  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    const habitacionalProduct: Product = {
      id: "prod-habitacional",
      name: "HABITACIONAL",
      description: "Financiamento Habitacional",
      scriptId: habitacionalSteps[0]?.id || "hab_abordagem",
      category: "habitacional",
      isActive: true,
      createdAt: new Date(),
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([habitacionalProduct]))
  }

  if (!localStorage.getItem(STORAGE_KEYS.LAST_UPDATE)) {
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, Date.now().toString())
  }
}

// User authentication
export function authenticateUser(username: string, password: string): User | null {
  if (typeof window === "undefined") return null

  const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]")

  const user = users.find((u) => u.username === username)

  if (user) {
    // Admin must provide correct password
    if (user.role === "admin") {
      if (password === "rcp@$") {
        // Track login session
        const session: LoginSession = {
          id: `session-${Date.now()}`,
          loginAt: new Date(),
        }

        user.lastLoginAt = new Date()
        user.loginSessions = user.loginSessions || []
        user.loginSessions.push(session)

        // Update user in storage
        const updatedUsers = users.map((u) => (u.id === user.id ? user : u))
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers))

        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
        return user
      }
      return null // Wrong password for admin
    }

    // Operators don't need password
    // Track login session
    const session: LoginSession = {
      id: `session-${Date.now()}`,
      loginAt: new Date(),
    }

    user.lastLoginAt = new Date()
    user.loginSessions = user.loginSessions || []
    user.loginSessions.push(session)

    // Update user in storage
    const updatedUsers = users.map((u) => (u.id === user.id ? user : u))
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers))

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
    return user
  }

  return null
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
  return userStr ? JSON.parse(userStr) : null
}

export function logout() {
  if (typeof window === "undefined") return

  const currentUser = getCurrentUser()
  if (currentUser && currentUser.loginSessions && currentUser.loginSessions.length > 0) {
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]")
    const user = users.find((u) => u.id === currentUser.id)

    if (user && user.loginSessions) {
      // Update the last session with logout time
      const lastSession = user.loginSessions[user.loginSessions.length - 1]
      if (!lastSession.logoutAt) {
        lastSession.logoutAt = new Date()
        lastSession.duration = lastSession.logoutAt.getTime() - new Date(lastSession.loginAt).getTime()

        // Update user in storage
        const updatedUsers = users.map((u) => (u.id === user.id ? user : u))
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers))
      }
    }
  }

  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
}

// Script steps
export function getScriptSteps(): ScriptStep[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.SCRIPT_STEPS) || "[]")
}

export function getScriptStepById(id: string, productId?: string): ScriptStep | null {
  const steps = getScriptSteps()

  // If productId is provided, filter by product first
  if (productId) {
    const productSteps = steps.filter((s) => s.productId === productId)
    return productSteps.find((s) => s.id === id) || null
  }

  return steps.find((s) => s.id === id) || null
}

export function getScriptStepsByProduct(productId: string): ScriptStep[] {
  if (typeof window === "undefined") return []
  const allSteps = getScriptSteps()
  return allSteps.filter((step) => step.productId === productId)
}

export function updateScriptStep(step: ScriptStep) {
  if (typeof window === "undefined") return

  const steps = getScriptSteps()
  const index = steps.findIndex((s) => s.id === step.id)

  if (index !== -1) {
    steps[index] = { ...step, updatedAt: new Date() }
    localStorage.setItem(STORAGE_KEYS.SCRIPT_STEPS, JSON.stringify(steps))
    notifyUpdate() // Notify about update
    console.log("[v0] Script step updated:", step.id)
  }
}

export function createScriptStep(step: Omit<ScriptStep, "id" | "createdAt" | "updatedAt">): ScriptStep {
  if (typeof window === "undefined") return { ...step, id: "", createdAt: new Date(), updatedAt: new Date() }

  const newStep: ScriptStep = {
    ...step,
    id: step.id || `step-${Date.now()}`, // Use provided ID if available
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const steps = getScriptSteps()
  steps.push(newStep)
  localStorage.setItem(STORAGE_KEYS.SCRIPT_STEPS, JSON.stringify(steps))
  notifyUpdate() // Notify about update

  return newStep
}

export function deleteScriptStep(id: string) {
  if (typeof window === "undefined") return

  const steps = getScriptSteps().filter((s) => s.id !== id)
  localStorage.setItem(STORAGE_KEYS.SCRIPT_STEPS, JSON.stringify(steps))
  notifyUpdate() // Notify about update
}

// Tabulations
export function getTabulations(): Tabulation[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.TABULATIONS) || "[]")
}

// Situations
export function getSituations(): ServiceSituation[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.SITUATIONS) || "[]")
}

// Channels
export function getChannels(): Channel[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CHANNELS) || "[]")
}

// Notes
export function getNotes(userId: string): Note[] {
  if (typeof window === "undefined") return []
  const notes: Note[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES) || "[]")
  return notes.filter((n) => n.userId === userId)
}

export function saveNote(userId: string, content: string) {
  if (typeof window === "undefined") return

  const notes: Note[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES) || "[]")
  const newNote: Note = {
    id: `note-${Date.now()}`,
    userId,
    content,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  notes.push(newNote)
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes))
}

// Call sessions
export function createCallSession(operatorId: string, startStepId: string): CallSession {
  if (typeof window === "undefined")
    return {
      id: "",
      operatorId,
      currentStepId: startStepId,
      startedAt: new Date(),
      notes: "",
    }

  const session: CallSession = {
    id: `session-${Date.now()}`,
    operatorId,
    currentStepId: startStepId,
    startedAt: new Date(),
    notes: "",
  }

  const sessions: CallSession[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || "[]")
  sessions.push(session)
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions))

  return session
}

export function updateCallSession(session: CallSession) {
  if (typeof window === "undefined") return

  const sessions: CallSession[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || "[]")
  const index = sessions.findIndex((s) => s.id === session.id)

  if (index !== -1) {
    sessions[index] = session
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions))
  }
}

// Products
export function getProducts(): Product[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || "[]")
}

export function getProductById(id: string): Product | null {
  const products = getProducts()
  return products.find((p) => p.id === id) || null
}

export function createProduct(product: Omit<Product, "id" | "createdAt">): Product {
  if (typeof window === "undefined") return { ...product, id: "", createdAt: new Date() }

  const newProduct: Product = {
    ...product,
    id: product.id || `prod-${Date.now()}`, // Use provided ID if available
    createdAt: new Date(),
  }

  const products = getProducts()
  products.push(newProduct)
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products))
  notifyUpdate() // Notify about update

  return newProduct
}

export function updateProduct(product: Product) {
  if (typeof window === "undefined") return

  const products = getProducts()
  const index = products.findIndex((p) => p.id === product.id)

  if (index !== -1) {
    products[index] = product
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products))
    notifyUpdate()
  }
}

export function deleteProduct(id: string) {
  if (typeof window === "undefined") return

  const products = getProducts().filter((p) => p.id !== id)
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products))
  notifyUpdate() // Notify about update
}

// Additional user management functions
export function getAllUsers(): User[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]")
}

export function updateUser(user: User) {
  if (typeof window === "undefined") return

  const users = getAllUsers()
  const index = users.findIndex((u) => u.id === user.id)

  if (index !== -1) {
    users[index] = user
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
    notifyUpdate()
  }
}

export function deleteUser(userId: string) {
  if (typeof window === "undefined") return

  const users = getAllUsers().filter((u) => u.id !== userId)
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
  notifyUpdate()
}

export function forceLogoutUser(userId: string) {
  if (typeof window === "undefined") return

  const users = getAllUsers()
  const user = users.find((u) => u.id === userId)

  if (user && user.loginSessions && user.loginSessions.length > 0) {
    const lastSession = user.loginSessions[user.loginSessions.length - 1]
    if (!lastSession.logoutAt) {
      lastSession.logoutAt = new Date()
      lastSession.duration = lastSession.logoutAt.getTime() - new Date(lastSession.loginAt).getTime()

      const updatedUsers = users.map((u) => (u.id === user.id ? user : u))
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers))
      notifyUpdate()
    }
  }
}

export function getTodayLoginSessions(userId: string): LoginSession[] {
  if (typeof window === "undefined") return []

  const users = getAllUsers()
  const user = users.find((u) => u.id === userId)

  if (!user || !user.loginSessions) return []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return user.loginSessions.filter((session) => {
    const sessionDate = new Date(session.loginAt)
    sessionDate.setHours(0, 0, 0, 0)
    return sessionDate.getTime() === today.getTime()
  })
}

export function getTodayConnectedTime(userId: string): number {
  const sessions = getTodayLoginSessions(userId)

  return sessions.reduce((total, session) => {
    if (session.duration) {
      return total + session.duration
    } else if (!session.logoutAt) {
      // Still logged in
      return total + (Date.now() - new Date(session.loginAt).getTime())
    }
    return total
  }, 0)
}

function notifyUpdate() {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, Date.now().toString())
  // Dispatch custom event for components to listen to
  window.dispatchEvent(new CustomEvent("store-updated"))
  console.log("[v0] Store updated, notifying all listeners")
}

export function getLastUpdate(): number {
  if (typeof window === "undefined") return 0
  return Number.parseInt(localStorage.getItem(STORAGE_KEYS.LAST_UPDATE) || "0")
}

export function importScriptFromJson(jsonData: any): { productCount: number; stepCount: number } {
  if (typeof window === "undefined") return { productCount: 0, stepCount: 0 }

  let productCount = 0
  let stepCount = 0

  if (jsonData.marcas) {
    Object.entries(jsonData.marcas).forEach(([productName, productSteps]: [string, any]) => {
      // Load steps for this product
      const steps = loadScriptFromJson(jsonData, productName)

      if (steps.length > 0) {
        // Add all steps to storage
        const existingSteps = getScriptSteps()
        const newSteps = [...existingSteps, ...steps]
        localStorage.setItem(STORAGE_KEYS.SCRIPT_STEPS, JSON.stringify(newSteps))
        stepCount += steps.length

        // Create product
        const productId = `prod-${productName.toLowerCase().replace(/\s+/g, "-")}`
        const product: Product = {
          id: productId,
          name: productName,
          scriptId: steps[0].id, // First step is the start
          category: productName.toLowerCase(),
          isActive: true,
          createdAt: new Date(),
        }

        const existingProducts = getProducts()
        // Check if product already exists
        const existingIndex = existingProducts.findIndex((p) => p.name === productName)
        if (existingIndex !== -1) {
          // Update existing product
          existingProducts[existingIndex] = product
        } else {
          // Add new product
          existingProducts.push(product)
          productCount++
        }
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(existingProducts))
      }
    })

    notifyUpdate() // Notify about update
  }

  return { productCount, stepCount }
}
