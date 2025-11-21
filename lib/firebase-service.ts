import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type DocumentData,
  addDoc,
} from "firebase/firestore"
import { db } from "./firebase"
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
  ChatMessage,
  ChatSettings,
  Presentation,
  PresentationProgress,
} from "./types"

// User operations
export async function getUser(userId: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    if (userDoc.exists()) {
      const data = userDoc.data()
      return {
        ...data,
        id: userDoc.id,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate?.() || undefined,
      } as User
    }
    return null
  } catch (error) {
    console.error("Error getting user:", error)
    return null
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const usernamesRef = collection(db, "usernames")
    const q = query(usernamesRef, where("username", "==", username), limit(1))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const usernameDoc = querySnapshot.docs[0].data()
      const userId = usernameDoc.userId

      const userDoc = await getDoc(doc(db, "users", userId))
      if (userDoc.exists()) {
        const data = userDoc.data()
        return {
          ...data,
          id: userDoc.id,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          lastLoginAt: data.lastLoginAt?.toDate?.() || undefined,
        } as User
      }
    }
    return null
  } catch (error) {
    console.error("Error getting user by username:", error)
    return null
  }
}

export async function createUser(user: Omit<User, "id">): Promise<string> {
  try {
    const userRef = await addDoc(collection(db, "users"), {
      ...user,
      createdAt: Timestamp.fromDate(new Date()),
      lastLoginAt: user.lastLoginAt ? Timestamp.fromDate(user.lastLoginAt) : null,
    })
    return userRef.id
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"))
    return usersSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate?.() || undefined,
      } as User
    })
  } catch (error: any) {
    if (error.code === "permission-denied" || error.message?.includes("Missing or insufficient permissions")) {
      console.warn("[v0] Permission denied when fetching users. Please update Firestore rules.")
      console.warn("[v0] See FIREBASE_RULES_UPDATE.md for instructions.")
      return [] // Return empty array instead of throwing
    }
    console.error("Error getting users:", error)
    throw error
  }
}

export async function updateUser(userId: string, data: Partial<User>): Promise<void> {
  try {
    const userRef = doc(db, "users", userId)
    const updateData: DocumentData = { ...data }

    if (data.lastLoginAt) {
      updateData.lastLoginAt = Timestamp.fromDate(data.lastLoginAt)
    }

    await updateDoc(userRef, updateData)
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "users", userId))
  } catch (error) {
    console.error("Error deleting user:", error)
    throw error
  }
}

// Products operations
export async function getAllProducts(): Promise<Product[]> {
  try {
    const productsSnapshot = await getDocs(collection(db, "products"))
    return productsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      } as Product
    })
  } catch (error) {
    console.error("Error getting products:", error)
    return []
  }
}

export async function getProduct(productId: string): Promise<Product | null> {
  try {
    const productDoc = await getDoc(doc(db, "products", productId))
    if (productDoc.exists()) {
      const data = productDoc.data()
      return {
        ...data,
        id: productDoc.id,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      } as Product
    }
    return null
  } catch (error) {
    console.error("Error getting product:", error)
    return null
  }
}

export async function createProduct(product: Omit<Product, "id">): Promise<string> {
  try {
    const productRef = await addDoc(collection(db, "products"), {
      ...product,
      createdAt: Timestamp.fromDate(new Date()),
    })
    return productRef.id
  } catch (error) {
    console.error("Error creating product:", error)
    throw error
  }
}

export async function updateProduct(productId: string, data: Partial<Product>): Promise<void> {
  try {
    const productRef = doc(db, "products", productId)
    await updateDoc(productRef, data as DocumentData)
  } catch (error) {
    console.error("Error updating product:", error)
    throw error
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "products", productId))
  } catch (error) {
    console.error("Error deleting product:", error)
    throw error
  }
}

// Script Steps operations
export async function getAllScriptSteps(): Promise<ScriptStep[]> {
  try {
    const stepsSnapshot = await getDocs(collection(db, "scriptSteps"))
    return stepsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as ScriptStep
    })
  } catch (error) {
    console.error("Error getting script steps:", error)
    return []
  }
}

export async function getScriptStep(stepId: string): Promise<ScriptStep | null> {
  try {
    const stepDoc = await getDoc(doc(db, "scriptSteps", stepId))
    if (stepDoc.exists()) {
      const data = stepDoc.data()
      return {
        ...data,
        id: stepDoc.id,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as ScriptStep
    }
    return null
  } catch (error) {
    console.error("Error getting script step:", error)
    return null
  }
}

export async function createScriptStep(step: Omit<ScriptStep, "id">): Promise<string> {
  try {
    const stepRef = await addDoc(collection(db, "scriptSteps"), {
      ...step,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    })
    return stepRef.id
  } catch (error) {
    console.error("Error creating script step:", error)
    throw error
  }
}

export async function updateScriptStep(stepId: string, data: Partial<ScriptStep>): Promise<void> {
  try {
    const stepRef = doc(db, "scriptSteps", stepId)
    await updateDoc(stepRef, {
      ...data,
      updatedAt: Timestamp.fromDate(new Date()),
    } as DocumentData)
  } catch (error) {
    console.error("Error updating script step:", error)
    throw error
  }
}

export async function deleteScriptStep(stepId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "scriptSteps", stepId))
  } catch (error) {
    console.error("Error deleting script step:", error)
    throw error
  }
}

// Tabulations operations
export async function getAllTabulations(): Promise<Tabulation[]> {
  try {
    const tabulationsSnapshot = await getDocs(collection(db, "tabulations"))
    return tabulationsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      } as Tabulation
    })
  } catch (error) {
    console.error("Error getting tabulations:", error)
    return []
  }
}

// Situations operations
export async function getAllSituations(): Promise<ServiceSituation[]> {
  try {
    const situationsSnapshot = await getDocs(collection(db, "situations"))
    return situationsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      } as ServiceSituation
    })
  } catch (error) {
    console.error("Error getting situations:", error)
    return []
  }
}

// Channels operations
export async function getAllChannels(): Promise<Channel[]> {
  try {
    const channelsSnapshot = await getDocs(collection(db, "channels"))
    return channelsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      } as Channel
    })
  } catch (error) {
    console.error("Error getting channels:", error)
    return []
  }
}

// Messages operations
export async function getActiveMessages(): Promise<Message[]> {
  try {
    const messagesRef = collection(db, "messages")
    const q = query(messagesRef, where("isActive", "==", true), orderBy("createdAt", "desc"))
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      } as Message
    })
  } catch (error) {
    console.error("Error getting messages:", error)
    return []
  }
}

// Quizzes operations
export async function getActiveQuizzes(): Promise<Quiz[]> {
  try {
    const quizzesRef = collection(db, "quizzes")
    const q = query(quizzesRef, where("isActive", "==", true), orderBy("createdAt", "desc"))
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        scheduledDate: data.scheduledDate?.toDate?.() || undefined,
      } as Quiz
    })
  } catch (error) {
    console.error("Error getting quizzes:", error)
    return []
  }
}

// Chat operations
export async function getChatMessages(userId: string, userRole: "operator" | "admin"): Promise<ChatMessage[]> {
  try {
    const messagesRef = collection(db, "chatMessages")
    let q

    if (userRole === "operator") {
      // Operators see: messages they sent OR messages sent to them OR broadcast messages
      q = query(
        messagesRef,
        where("recipientId", "in", [userId, undefined]),
        orderBy("createdAt", "asc"),
      )
    } else {
      // Admins see all messages
      q = query(messagesRef, orderBy("createdAt", "asc"))
    }

    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      } as ChatMessage
    })
  } catch (error) {
    console.error("Error getting chat messages:", error)
    return []
  }
}

export async function sendChatMessageToFirebase(message: Omit<ChatMessage, "id">): Promise<string> {
  try {
    const messageRef = await addDoc(collection(db, "chatMessages"), {
      ...message,
      createdAt: Timestamp.fromDate(new Date()),
    })
    return messageRef.id
  } catch (error) {
    console.error("Error sending chat message:", error)
    throw error
  }
}

// Presentations operations
export async function getActivePresentations(): Promise<Presentation[]> {
  try {
    const presentationsRef = collection(db, "presentations")
    const q = query(presentationsRef, where("isActive", "==", true), orderBy("createdAt", "desc"))
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as Presentation
    })
  } catch (error) {
    console.error("Error getting presentations:", error)
    return []
  }
}

// Notes operations
export async function getNotesByUser(userId: string): Promise<Note[]> {
  try {
    const notesRef = collection(db, "notes")
    const q = query(notesRef, where("userId", "==", userId), orderBy("createdAt", "desc"))
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as Note
    })
  } catch (error) {
    console.error("Error getting notes:", error)
    return []
  }
}

export async function saveNoteToFirebase(note: Omit<Note, "id">): Promise<string> {
  try {
    const noteRef = await addDoc(collection(db, "notes"), {
      ...note,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    })
    return noteRef.id
  } catch (error) {
    console.error("Error saving note:", error)
    throw error
  }
}
