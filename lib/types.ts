// Core types for the call center script system

export type UserRole = "operator" | "admin"

export interface User {
  id: string
  username: string
  fullName: string
  role: UserRole
  isOnline: boolean
  createdAt: Date
  lastLoginAt?: Date
  loginSessions?: LoginSession[]
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
  tabulationInfo?: {
    id: string
    name: string
    description: string
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
  category: "habitacional" | "comercial" | "outros"
  isActive: boolean
  createdAt: Date
  attendanceTypes?: ("ativo" | "receptivo")[]
  personTypes?: ("fisica" | "juridica")[]
}
