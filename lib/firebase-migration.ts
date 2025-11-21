import {
  collection,
  doc,
  setDoc,
  getDocs,
  writeBatch,
  Timestamp,
  query,
  where,
} from "firebase/firestore"
import { db } from "./firebase"
import * as firebaseStore from "./firebase-store"
import type {
  User,
  ScriptStep,
  Product,
  Tabulation,
  ServiceSituation,
  Channel,
  Note,
  Message,
  Quiz,
  QuizAttempt,
  AttendanceTypeOption,
  PersonTypeOption,
  ChatMessage,
  ChatSettings,
  Presentation,
  PresentationProgress,
} from "./types"

export async function migrateAllDataToFirebase(): Promise<{
  success: boolean
  message: string
  stats: {
    usersCount: number
    productsCount: number
    stepsCount: number
    tabulationsCount: number
    situationsCount: number
    channelsCount: number
    messagesCount: number
    quizzesCount: number
    quizAttemptsCount: number
    chatMessagesCount: number
    presentationsCount: number
    notesCount: number
  }
}> {
  const stats = {
    usersCount: 0,
    productsCount: 0,
    stepsCount: 0,
    tabulationsCount: 0,
    situationsCount: 0,
    channelsCount: 0,
    messagesCount: 0,
    quizzesCount: 0,
    quizAttemptsCount: 0,
    chatMessagesCount: 0,
    presentationsCount: 0,
    notesCount: 0,
  }

  try {
    console.log("[v0] Starting Firebase migration...")

    // Check if data already migrated
    const isAlreadyMigrated = await checkIfMigrationComplete()
    if (isAlreadyMigrated) {
      console.log("[v0] Migration already completed")
      return {
        success: true,
        message: "Data already migrated to Firebase",
        stats,
      }
    }

    // Get all data from localStorage (using client-side store functions)
    const users = getLocalStorageUsers()
    const products = getLocalStorageProducts()
    const scriptSteps = getLocalStorageScriptSteps()
    const tabulations = getLocalStorageTabulations()
    const situations = getLocalStorageSituations()
    const channels = getLocalStorageChannels()
    const messages = getLocalStorageMessages()
    const quizzes = getLocalStorageQuizzes()
    const quizAttempts = getLocalStorageQuizAttempts()
    const chatMessages = getLocalStorageChatMessages()
    const presentations = getLocalStoragePresentations()
    const notes = getLocalStorageNotes()

    // Create a batch write for better performance
    const batch = writeBatch(db)

    // Migrate users
    for (const user of users) {
      const userRef = doc(db, "users", user.id)
      batch.set(userRef, {
        ...user,
        createdAt: user.createdAt instanceof Date ? Timestamp.fromDate(user.createdAt) : user.createdAt,
        lastLoginAt: user.lastLoginAt ? Timestamp.fromDate(user.lastLoginAt) : null,
        loginSessions: user.loginSessions?.map((s) => ({
          ...s,
          loginAt: s.loginAt instanceof Date ? Timestamp.fromDate(s.loginAt) : s.loginAt,
          logoutAt: s.logoutAt ? Timestamp.fromDate(s.logoutAt) : null,
        })),
      })
      stats.usersCount++
    }

    // Migrate products
    for (const product of products) {
      const productRef = doc(db, "products", product.id)
      batch.set(productRef, {
        ...product,
        createdAt: product.createdAt instanceof Date ? Timestamp.fromDate(product.createdAt) : product.createdAt,
      })
      stats.productsCount++
    }

    // Migrate script steps
    for (const step of scriptSteps) {
      const stepRef = doc(db, "script_steps", step.id)
      batch.set(stepRef, {
        ...step,
        createdAt: step.createdAt instanceof Date ? Timestamp.fromDate(step.createdAt) : step.createdAt,
        updatedAt: step.updatedAt instanceof Date ? Timestamp.fromDate(step.updatedAt) : step.updatedAt,
      })
      stats.stepsCount++
    }

    // Migrate tabulations
    for (const tabulation of tabulations) {
      const tabulationRef = doc(db, "tabulations", tabulation.id)
      batch.set(tabulationRef, {
        ...tabulation,
        createdAt: tabulation.createdAt instanceof Date ? Timestamp.fromDate(tabulation.createdAt) : tabulation.createdAt,
      })
      stats.tabulationsCount++
    }

    // Migrate situations
    for (const situation of situations) {
      const situationRef = doc(db, "situations", situation.id)
      batch.set(situationRef, {
        ...situation,
        createdAt: situation.createdAt instanceof Date ? Timestamp.fromDate(situation.createdAt) : situation.createdAt,
      })
      stats.situationsCount++
    }

    // Migrate channels
    for (const channel of channels) {
      const channelRef = doc(db, "channels", channel.id)
      batch.set(channelRef, {
        ...channel,
        createdAt: channel.createdAt instanceof Date ? Timestamp.fromDate(channel.createdAt) : channel.createdAt,
      })
      stats.channelsCount++
    }

    // Migrate messages
    for (const message of messages) {
      const messageRef = doc(db, "messages", message.id)
      batch.set(messageRef, {
        ...message,
        createdAt: message.createdAt instanceof Date ? Timestamp.fromDate(message.createdAt) : message.createdAt,
      })
      stats.messagesCount++
    }

    // Migrate quizzes
    for (const quiz of quizzes) {
      const quizRef = doc(db, "quizzes", quiz.id)
      batch.set(quizRef, {
        ...quiz,
        createdAt: quiz.createdAt instanceof Date ? Timestamp.fromDate(quiz.createdAt) : quiz.createdAt,
        scheduledDate: quiz.scheduledDate ? Timestamp.fromDate(quiz.scheduledDate) : null,
      })
      stats.quizzesCount++
    }

    // Migrate quiz attempts
    for (const attempt of quizAttempts) {
      const attemptRef = doc(db, "quiz_attempts", attempt.id)
      batch.set(attemptRef, {
        ...attempt,
        attemptedAt: attempt.attemptedAt instanceof Date ? Timestamp.fromDate(attempt.attemptedAt) : attempt.attemptedAt,
      })
      stats.quizAttemptsCount++
    }

    // Migrate chat messages
    for (const chatMessage of chatMessages) {
      const chatRef = doc(db, "chat_messages", chatMessage.id)
      batch.set(chatRef, {
        ...chatMessage,
        createdAt: chatMessage.createdAt instanceof Date ? Timestamp.fromDate(chatMessage.createdAt) : chatMessage.createdAt,
      })
      stats.chatMessagesCount++
    }

    // Migrate presentations
    for (const presentation of presentations) {
      const presentationRef = doc(db, "presentations", presentation.id)
      batch.set(presentationRef, {
        ...presentation,
        createdAt: presentation.createdAt instanceof Date ? Timestamp.fromDate(presentation.createdAt) : presentation.createdAt,
        updatedAt: presentation.updatedAt instanceof Date ? Timestamp.fromDate(presentation.updatedAt) : presentation.updatedAt,
      })
      stats.presentationsCount++
    }

    // Migrate notes
    for (const note of notes) {
      const noteRef = doc(db, "notes", note.id)
      batch.set(noteRef, {
        ...note,
        createdAt: note.createdAt instanceof Date ? Timestamp.fromDate(note.createdAt) : note.createdAt,
        updatedAt: note.updatedAt instanceof Date ? Timestamp.fromDate(note.updatedAt) : note.updatedAt,
      })
      stats.notesCount++
    }

    // Commit the batch
    await batch.commit()

    // Mark migration as complete
    await markMigrationComplete()

    console.log("[v0] Firebase migration completed successfully", stats)
    return {
      success: true,
      message: "All data successfully migrated to Firebase",
      stats,
    }
  } catch (error) {
    console.error("[v0] Migration error:", error)
    return {
      success: false,
      message: `Migration failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      stats,
    }
  }
}

async function checkIfMigrationComplete(): Promise<boolean> {
  try {
    const settingsRef = doc(db, "system_settings", "migration_status")
    const snapshot = await getDocs(collection(db, "system_settings"))
    const migrationDoc = snapshot.docs.find((doc) => doc.id === "migration_status")

    if (migrationDoc?.exists()) {
      const data = migrationDoc.data()
      return data.completed === true
    }

    return false
  } catch {
    return false
  }
}

async function markMigrationComplete(): Promise<void> {
  try {
    const settingsRef = doc(db, "system_settings", "migration_status")
    await setDoc(settingsRef, {
      completed: true,
      migratedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error("[v0] Error marking migration complete:", error)
  }
}

function getLocalStorageUsers(): User[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem("callcenter_users")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function getLocalStorageProducts(): Product[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem("callcenter_products")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function getLocalStorageScriptSteps(): ScriptStep[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem("callcenter_script_steps")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function getLocalStorageTabulations(): Tabulation[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem("callcenter_tabulations")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function getLocalStorageSituations(): ServiceSituation[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem("callcenter_situations")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function getLocalStorageChannels(): Channel[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem("callcenter_channels")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function getLocalStorageMessages(): Message[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem("callcenter_messages")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function getLocalStorageQuizzes(): Quiz[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem("callcenter_quizzes")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function getLocalStorageQuizAttempts(): QuizAttempt[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem("callcenter_quiz_attempts")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function getLocalStorageChatMessages(): ChatMessage[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem("callcenter_chat_messages")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function getLocalStoragePresentations(): Presentation[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem("callcenter_presentations")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function getLocalStorageNotes(): Note[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem("callcenter_notes")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}
