// Core types for the call center script system

export type UserRole = "operator" | "admin"

export interface AdminPermissions {
  dashboard?: boolean
  scripts?: boolean
  products?: boolean
  attendanceConfig?: boolean
  tabulations?: boolean
  situations?: boolean
  channels?: boolean
  notes?: boolean
  operators?: boolean
  messagesQuiz?: boolean
  chat?: boolean
  settings?: boolean
}

export interface User {
  id: string
  username: string
  fullName: string
  role: UserRole
  isOnline: boolean
  createdAt: Date
  lastLoginAt?: Date
  loginSessions?: LoginSession[]
  permissions?: AdminPermissions
  password?: string // Added password field for individual user authentication
}

export interface LoginSession {
  id: string
  loginAt: Date
  logoutAt?: Date
  duration?: number // in milliseconds
}

export interface ScriptStep {
  id: string
  title: string
  content: string
  order: number
  buttons: ScriptButton[]
  createdAt: Date
  updatedAt: Date
  productId?: string // Added productId to track which product this step belongs to
  tabulations?: Array<{
    id: string
    name: string
    description: string
  }> // Changed from single tabulationInfo to array of tabulations
  contentSegments?: ContentSegment[]
  formatting?: {
    textColor?: string
    bold?: boolean
    italic?: boolean
    textAlign?: "left" | "center" | "right" | "justify"
  }
  alert?: {
    title: string // Added title field to alert object for customizable alert titles
    message: string
    createdAt: Date
  }
}

export interface ContentSegment {
  id: string
  text: string
  formatting: {
    bold?: boolean
    italic?: boolean
    color?: string
    backgroundColor?: string
    fontSize?: "sm" | "base" | "lg" | "xl"
  }
}

export interface ScriptButton {
  id: string
  label: string
  nextStepId: string | null // null means end of script
  variant: "default" | "primary" | "secondary" | "destructive"
  order: number
  primary?: boolean
}

export interface Tabulation {
  id: string
  name: string
  description: string
  color: string
  createdAt: Date
}

export interface ServiceSituation {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt: Date
  expanded?: boolean // Added expanded state for accordion-style display
}

export interface Channel {
  id: string
  name: string
  contact: string // Changed from icon to contact (number or link)
  isActive: boolean
  createdAt: Date
}

export interface Note {
  id: string
  userId: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  id: string
  title: string
  content: string
  createdBy: string // admin user id
  createdByName: string // admin user name
  createdAt: Date
  isActive: boolean
  seenBy: string[] // array of operator user ids who have seen this message
  recipients: string[] // array of operator user ids, empty array means all operators
  segments?: ContentSegment[] // Added segments field for formatted content
}

export interface Quiz {
  id: string
  question: string
  options: QuizOption[]
  correctAnswer: string
  createdBy: string
  createdByName: string
  createdAt: Date
  isActive: boolean
  scheduledDate?: Date
  recipients?: string[] // Array of operator IDs, empty means all operators (consistent with Message and Presentation)
}

export interface QuizOption {
  id: string
  label: string // a, b, c, d
  text: string
}

export interface QuizAttempt {
  id: string
  quizId: string
  operatorId: string
  operatorName: string
  selectedAnswer: string // id of the selected option
  isCorrect: boolean
  attemptedAt: Date
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: "operator" | "admin"
  recipientId?: string // If undefined, message goes to all admins (from operator) or all operators (from admin)
  content: string
  attachment?: {
    type: "image"
    url: string
    name: string
  }
  replyTo?: {
    messageId: string
    content: string
    senderName: string
  }
  createdAt: Date
  isRead: boolean
}

export interface ChatSettings {
  isEnabled: boolean // Admin can enable/disable chat globally
  updatedAt: Date
  updatedBy: string
}

export interface CallSession {
  id: string
  operatorId: string
  currentStepId: string
  startedAt: Date
  tabulationId?: string
  situationId?: string
  channelId?: string
  notes: string[]
}

export interface AttendanceConfig {
  attendanceType: "ativo" | "receptivo"
  personType: "fisica" | "juridica"
  product: string
}

export interface Product {
  id: string
  name: string
  scriptId: string // Links to the first step of the script for this product
  category: "habitacional" | "comercial" | "cartao" | "outros"
  isActive: boolean
  createdAt: Date
  attendanceTypes?: ("ativo" | "receptivo")[]
  personTypes?: ("fisica" | "juridica")[]
  description?: string // Added description field for hover tooltip
}

export interface PresentationSlide {
  id: string
  order: number
  imageUrl: string
  imageData?: string // base64 for pasted images
  title?: string
  description?: string
}

export interface Presentation {
  id: string
  title: string
  description: string
  slides: PresentationSlide[]
  createdBy: string // admin user id
  createdByName: string // admin user name
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  recipients: string[] // array of operator user ids, empty array means all operators
}

export interface PresentationProgress {
  id: string
  presentationId: string
  operatorId: string
  operatorName: string
  viewedAt: Date
  marked_as_seen: boolean
  completion_date?: Date
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

export type Ranking = OperatorRanking

export interface Contract {
  id: string
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}
