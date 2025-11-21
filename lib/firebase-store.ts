import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  writeBatch,
} from "firebase/firestore"
import { db } from "./firebase"
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
  PresentationProgress,
} from "./types"

// Collection names
const COLLECTIONS = {
  USERS: "users",
  SCRIPT_STEPS: "script_steps",
  TABULATIONS: "tabulations",
  SITUATIONS: "situations",
  CHANNELS: "channels",
  NOTES: "notes",
  SESSIONS: "sessions",
  PRODUCTS: "products",
  ATTENDANCE_TYPES: "attendance_types",
  PERSON_TYPES: "person_types",
  MESSAGES: "messages",
  QUIZZES: "quizzes",
  QUIZ_ATTEMPTS: "quiz_attempts",
  CHAT_MESSAGES: "chat_messages",
  CHAT_SETTINGS: "chat_settings",
  PRESENTATIONS: "presentations",
  PRESENTATION_PROGRESS: "presentation_progress",
}

// Helper to convert Firestore Timestamp to Date
function convertTimestamps(data: any): any {
  if (!data) return data
  
  const converted = { ...data }
  Object.keys(converted).forEach((key) => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate()
    } else if (Array.isArray(converted[key])) {
      converted[key] = converted[key].map((item: any) => convertTimestamps(item))
    } else if (typeof converted[key] === "object" && converted[key] !== null) {
      converted[key] = convertTimestamps(converted[key])
    }
  })
  return converted
}

// ============ USERS ============
export async function getAllUsers(): Promise<User[]> {
  const usersCol = collection(db, COLLECTIONS.USERS)
  const snapshot = await getDocs(usersCol)
  return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as User)
}

export async function getUserById(userId: string): Promise<User | null> {
  const userDoc = doc(db, COLLECTIONS.USERS, userId)
  const snapshot = await getDoc(userDoc)
  return snapshot.exists() ? convertTimestamps({ id: snapshot.id, ...snapshot.data() }) as User : null
}

export async function updateUser(user: User): Promise<void> {
  const userDoc = doc(db, COLLECTIONS.USERS, user.id)
  await updateDoc(userDoc, { ...user })
}

export async function deleteUser(userId: string): Promise<void> {
  const userDoc = doc(db, COLLECTIONS.USERS, userId)
  await deleteDoc(userDoc)
}

export async function createAdminUser(username: string, fullName: string): Promise<User | null> {
  try {
    const users = await getAllUsers()
    
    // Check if username already exists
    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      return null
    }

    const newUser: Omit<User, "id"> = {
      username,
      fullName,
      role: "admin",
      isOnline: false,
      createdAt: new Date(),
      permissions: {
        dashboard: true,
        scripts: true,
        products: true,
        attendanceConfig: true,
        tabulations: true,
        situations: true,
        channels: true,
        notes: true,
        operators: true,
        messagesQuiz: true,
        settings: true,
      },
    }

    const docRef = await addDoc(collection(db, COLLECTIONS.USERS), newUser)
    return { id: docRef.id, ...newUser }
  } catch (error) {
    console.error("Error creating admin user:", error)
    return null
  }
}

export async function updateAdminPermissions(userId: string, permissions: AdminPermissions): Promise<void> {
  const user = await getUserById(userId)
  
  if (user && user.role === "admin") {
    user.permissions = permissions
    await updateUser(user)
  }
}

export async function forceLogoutUser(userId: string): Promise<void> {
  const user = await getUserById(userId)
  
  if (user && user.loginSessions && user.loginSessions.length > 0) {
    const lastSession = user.loginSessions[user.loginSessions.length - 1]
    if (!lastSession.logoutAt) {
      lastSession.logoutAt = new Date()
      lastSession.duration = lastSession.logoutAt.getTime() - new Date(lastSession.loginAt).getTime()
      user.isOnline = false
      await updateUser(user)
    }
  }
}

// ============ SCRIPT STEPS ============
export async function getScriptSteps(): Promise<ScriptStep[]> {
  const stepsCol = collection(db, COLLECTIONS.SCRIPT_STEPS)
  const snapshot = await getDocs(stepsCol)
  return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as ScriptStep)
}

export async function getScriptStepById(id: string, productId?: string): Promise<ScriptStep | null> {
  const stepDoc = doc(db, COLLECTIONS.SCRIPT_STEPS, id)
  const snapshot = await getDoc(stepDoc)
  
  if (!snapshot.exists()) return null
  
  const step = convertTimestamps({ id: snapshot.id, ...snapshot.data() }) as ScriptStep
  
  if (productId && step.productId !== productId) {
    return null
  }
  
  return step
}

export async function getScriptStepsByProduct(productId: string): Promise<ScriptStep[]> {
  const stepsCol = collection(db, COLLECTIONS.SCRIPT_STEPS)
  const q = query(stepsCol, where("productId", "==", productId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as ScriptStep)
}

export async function createScriptStep(step: Omit<ScriptStep, "id" | "createdAt" | "updatedAt">): Promise<ScriptStep> {
  const newStep = {
    ...step,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  
  const docRef = await addDoc(collection(db, COLLECTIONS.SCRIPT_STEPS), newStep)
  return { id: docRef.id, ...newStep }
}

export async function updateScriptStep(step: ScriptStep): Promise<void> {
  const stepDoc = doc(db, COLLECTIONS.SCRIPT_STEPS, step.id)
  await updateDoc(stepDoc, { ...step, updatedAt: new Date() })
}

export async function deleteScriptStep(id: string): Promise<void> {
  const stepDoc = doc(db, COLLECTIONS.SCRIPT_STEPS, id)
  await deleteDoc(stepDoc)
}

interface JsonData {
  marcas?: Record<string, Record<string, any>>
}

export async function importScriptFromJson(jsonData: JsonData): Promise<{ productCount: number; stepCount: number }> {
  let productCount = 0
  let stepCount = 0

  try {
    if (jsonData.marcas) {
      const batch = writeBatch(db)
      
      for (const [productName, productSteps] of Object.entries(jsonData.marcas)) {
        if (!productSteps || typeof productSteps !== "object") {
          console.warn(`Skipping invalid product: ${productName}`)
          continue
        }

        const steps: ScriptStep[] = []
        const productId = `prod-${productName.toLowerCase().replace(/\s+/g, "-")}`

        // Delete existing steps for this product
        const existingSteps = await getScriptStepsByProduct(productId)
        existingSteps.forEach((step) => {
          const stepDoc = doc(db, COLLECTIONS.SCRIPT_STEPS, step.id)
          batch.delete(stepDoc)
        })

        for (const [stepKey, stepData] of Object.entries(productSteps) as [string, any][]) {
          if (!stepData || typeof stepData !== "object" || !stepData.id || !stepData.title) {
            console.warn(`Skipping invalid step: ${stepKey} in product ${productName}`)
            continue
          }

          const content = stepData.body || stepData.content || ""

          const step: Omit<ScriptStep, "createdAt" | "updatedAt"> = {
            id: stepData.id,
            productId: productId,
            title: stepData.title || "",
            content: content,
            order: stepData.order || 0,
            buttons: (stepData.buttons || []).map((btn: any, index: number) => ({
              id: `btn-${stepData.id}-${index}`,
              label: btn.label || "",
              nextStepId: btn.next || btn.nextStepId || null,
              primary: btn.primary || false,
              variant: btn.variant || (btn.primary ? "primary" : "secondary"),
              order: btn.order || index,
            })),
            contentSegments: stepData.contentSegments || [],
          }
          
          const stepRef = doc(db, COLLECTIONS.SCRIPT_STEPS, step.id)
          batch.set(stepRef, { ...step, createdAt: new Date(), updatedAt: new Date() })
          steps.push(step as ScriptStep)
        }

        if (steps.length > 0) {
          stepCount += steps.length

          const firstStep =
            steps.find(
              (s) =>
                s.title.toLowerCase().includes("abordagem") ||
                s.id.toLowerCase().includes("abordagem") ||
                s.order === 1,
            ) || steps[0]

          if (!firstStep) {
            console.error(`No valid first step found for product ${productName}`)
            continue
          }

          const product: Omit<Product, "createdAt"> = {
            id: productId,
            name: productName,
            scriptId: firstStep.id,
            category: productName.toLowerCase() as "habitacional" | "comercial" | "outros",
            isActive: true,
          }

          const productDoc = doc(db, COLLECTIONS.PRODUCTS, productId)
          batch.set(productDoc, { ...product, createdAt: new Date() })
          productCount++
        }
      }

      await batch.commit()
    }
  } catch (error) {
    console.error("Error importing script from JSON:", error)
    throw error
  }

  return { productCount, stepCount }
}

// ============ PRODUCTS ============
export async function getProducts(): Promise<Product[]> {
  const productsCol = collection(db, COLLECTIONS.PRODUCTS)
  const snapshot = await getDocs(productsCol)
  return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as Product)
}

export async function getProductById(id: string): Promise<Product | null> {
  const productDoc = doc(db, COLLECTIONS.PRODUCTS, id)
  const snapshot = await getDoc(productDoc)
  return snapshot.exists() ? convertTimestamps({ id: snapshot.id, ...snapshot.data() }) as Product : null
}

export async function createProduct(product: Omit<Product, "id" | "createdAt">): Promise<Product> {
  const newProduct = {
    ...product,
    createdAt: new Date(),
  }
  
  const docRef = await addDoc(collection(db, COLLECTIONS.PRODUCTS), newProduct)
  return { id: docRef.id, ...newProduct }
}

export async function updateProduct(product: Product): Promise<void> {
  const productDoc = doc(db, COLLECTIONS.PRODUCTS, product.id)
  await updateDoc(productDoc, { ...product })
}

export async function deleteProduct(id: string): Promise<void> {
  const productDoc = doc(db, COLLECTIONS.PRODUCTS, id)
  await deleteDoc(productDoc)
}

// ============ TABULATIONS ============
export async function getTabulations(): Promise<Tabulation[]> {
  const tabulationsCol = collection(db, COLLECTIONS.TABULATIONS)
  const snapshot = await getDocs(tabulationsCol)
  return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as Tabulation)
}

export async function createTabulation(tabulation: Omit<Tabulation, "id" | "createdAt">): Promise<Tabulation> {
  const newTabulation = {
    ...tabulation,
    createdAt: new Date(),
  }
  
  const docRef = await addDoc(collection(db, COLLECTIONS.TABULATIONS), newTabulation)
  return { id: docRef.id, ...newTabulation }
}

export async function updateTabulation(tabulation: Tabulation): Promise<void> {
  const tabulationDoc = doc(db, COLLECTIONS.TABULATIONS, tabulation.id)
  await updateDoc(tabulationDoc, { ...tabulation })
}

export async function deleteTabulation(id: string): Promise<void> {
  const tabulationDoc = doc(db, COLLECTIONS.TABULATIONS, id)
  await deleteDoc(tabulationDoc)
}

// ============ SITUATIONS ============
export async function getSituations(): Promise<ServiceSituation[]> {
  const situationsCol = collection(db, COLLECTIONS.SITUATIONS)
  const snapshot = await getDocs(situationsCol)
  return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as ServiceSituation)
}

export async function createSituation(situation: Omit<ServiceSituation, "id" | "createdAt">): Promise<ServiceSituation> {
  const newSituation = {
    ...situation,
    createdAt: new Date(),
  }
  
  const docRef = await addDoc(collection(db, COLLECTIONS.SITUATIONS), newSituation)
  return { id: docRef.id, ...newSituation }
}

export async function updateSituation(situation: ServiceSituation): Promise<void> {
  const situationDoc = doc(db, COLLECTIONS.SITUATIONS, situation.id)
  await updateDoc(situationDoc, { ...situation })
}

export async function deleteSituation(id: string): Promise<void> {
  const situationDoc = doc(db, COLLECTIONS.SITUATIONS, id)
  await deleteDoc(situationDoc)
}

// ============ CHANNELS ============
export async function getChannels(): Promise<Channel[]> {
  const channelsCol = collection(db, COLLECTIONS.CHANNELS)
  const snapshot = await getDocs(channelsCol)
  return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as Channel)
}

export async function createChannel(channel: Omit<Channel, "id" | "createdAt">): Promise<Channel> {
  const newChannel = {
    ...channel,
    createdAt: new Date(),
  }
  
  const docRef = await addDoc(collection(db, COLLECTIONS.CHANNELS), newChannel)
  return { id: docRef.id, ...newChannel }
}

export async function updateChannel(channel: Channel): Promise<void> {
  const channelDoc = doc(db, COLLECTIONS.CHANNELS, channel.id)
  await updateDoc(channelDoc, { ...channel })
}

export async function deleteChannel(id: string): Promise<void> {
  const channelDoc = doc(db, COLLECTIONS.CHANNELS, id)
  await deleteDoc(channelDoc)
}

// ============ ATTENDANCE TYPES ============
export async function getAttendanceTypes(): Promise<AttendanceTypeOption[]> {
  const typesCol = collection(db, COLLECTIONS.ATTENDANCE_TYPES)
  const snapshot = await getDocs(typesCol)
  return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as AttendanceTypeOption)
}

export async function createAttendanceType(option: Omit<AttendanceTypeOption, "id" | "createdAt">): Promise<AttendanceTypeOption> {
  const newOption = {
    ...option,
    createdAt: new Date(),
  }
  
  const docRef = await addDoc(collection(db, COLLECTIONS.ATTENDANCE_TYPES), newOption)
  return { id: docRef.id, ...newOption }
}

export async function updateAttendanceType(option: AttendanceTypeOption): Promise<void> {
  const optionDoc = doc(db, COLLECTIONS.ATTENDANCE_TYPES, option.id)
  await updateDoc(optionDoc, { ...option })
}

export async function deleteAttendanceType(id: string): Promise<void> {
  const optionDoc = doc(db, COLLECTIONS.ATTENDANCE_TYPES, id)
  await deleteDoc(optionDoc)
}

// ============ PERSON TYPES ============
export async function getPersonTypes(): Promise<PersonTypeOption[]> {
  const typesCol = collection(db, COLLECTIONS.PERSON_TYPES)
  const snapshot = await getDocs(typesCol)
  return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as PersonTypeOption)
}

export async function createPersonType(option: Omit<PersonTypeOption, "id" | "createdAt">): Promise<PersonTypeOption> {
  const newOption = {
    ...option,
    createdAt: new Date(),
  }
  
  const docRef = await addDoc(collection(db, COLLECTIONS.PERSON_TYPES), newOption)
  return { id: docRef.id, ...newOption }
}

export async function updatePersonType(option: PersonTypeOption): Promise<void> {
  const optionDoc = doc(db, COLLECTIONS.PERSON_TYPES, option.id)
  await updateDoc(optionDoc, { ...option })
}

export async function deletePersonType(id: string): Promise<void> {
  const optionDoc = doc(db, COLLECTIONS.PERSON_TYPES, id)
  await deleteDoc(optionDoc)
}

// ============ MESSAGES ============
export async function getMessages(): Promise<Message[]> {
  const messagesCol = collection(db, COLLECTIONS.MESSAGES)
  const snapshot = await getDocs(messagesCol)
  return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as Message)
}

export async function getActiveMessages(): Promise<Message[]> {
  const messages = await getMessages()
  return messages.filter((m) => m.isActive)
}

export async function createMessage(message: Omit<Message, "id" | "createdAt" | "seenBy">): Promise<Message> {
  const newMessage = {
    ...message,
    createdAt: new Date(),
    seenBy: [],
  }
  
  const docRef = await addDoc(collection(db, COLLECTIONS.MESSAGES), newMessage)
  return { id: docRef.id, ...newMessage }
}

export async function updateMessage(message: Message): Promise<void> {
  const messageDoc = doc(db, COLLECTIONS.MESSAGES, message.id)
  await updateDoc(messageDoc, { ...message })
}

export async function deleteMessage(id: string): Promise<void> {
  const messageDoc = doc(db, COLLECTIONS.MESSAGES, id)
  await deleteDoc(messageDoc)
}

export async function markMessageAsSeen(messageId: string, operatorId: string): Promise<void> {
  const messages = await getMessages()
  const message = messages.find((m) => m.id === messageId)

  if (message && !message.seenBy.includes(operatorId)) {
    message.seenBy.push(operatorId)
    await updateMessage(message)
  }
}

// ============ QUIZZES ============
export async function getQuizzes(): Promise<Quiz[]> {
  const quizzesCol = collection(db, COLLECTIONS.QUIZZES)
  const snapshot = await getDocs(quizzesCol)
  return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as Quiz)
}

export async function getActiveQuizzes(): Promise<Quiz[]> {
  const quizzes = await getQuizzes()
  return quizzes.filter((q) => q.isActive)
}

export async function createQuiz(quiz: Omit<Quiz, "id" | "createdAt">): Promise<Quiz> {
  const newQuiz = {
    ...quiz,
    createdAt: new Date(),
  }
  
  const docRef = await addDoc(collection(db, COLLECTIONS.QUIZZES), newQuiz)
  return { id: docRef.id, ...newQuiz }
}

export async function updateQuiz(quiz: Quiz): Promise<void> {
  const quizDoc = doc(db, COLLECTIONS.QUIZZES, quiz.id)
  await updateDoc(quizDoc, { ...quiz })
}

export async function deleteQuiz(id: string): Promise<void> {
  const quizDoc = doc(db, COLLECTIONS.QUIZZES, id)
  await deleteDoc(quizDoc)
}

// ============ QUIZ ATTEMPTS ============
export async function getQuizAttempts(): Promise<QuizAttempt[]> {
  const attemptsCol = collection(db, COLLECTIONS.QUIZ_ATTEMPTS)
  const snapshot = await getDocs(attemptsCol)
  return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as QuizAttempt)
}

export async function getQuizAttemptsByOperator(operatorId: string): Promise<QuizAttempt[]> {
  const attemptsCol = collection(db, COLLECTIONS.QUIZ_ATTEMPTS)
  const q = query(attemptsCol, where("operatorId", "==", operatorId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as QuizAttempt)
}

export async function getQuizAttemptsByQuiz(quizId: string): Promise<QuizAttempt[]> {
  const attemptsCol = collection(db, COLLECTIONS.QUIZ_ATTEMPTS)
  const q = query(attemptsCol, where("quizId", "==", quizId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as QuizAttempt)
}

export async function createQuizAttempt(attempt: Omit<QuizAttempt, "id" | "attemptedAt">): Promise<QuizAttempt> {
  const newAttempt = {
    ...attempt,
    attemptedAt: new Date(),
  }
  
  const docRef = await addDoc(collection(db, COLLECTIONS.QUIZ_ATTEMPTS), newAttempt)
  return { id: docRef.id, ...newAttempt }
}

export async function hasOperatorAnsweredQuiz(quizId: string, operatorId: string): Promise<boolean> {
  const attempts = await getQuizAttempts()
  return attempts.some((a) => a.quizId === quizId && a.operatorId === operatorId)
}

// ============ CHAT ============
export async function getAllChatMessages(): Promise<ChatMessage[]> {
  const messagesCol = collection(db, COLLECTIONS.CHAT_MESSAGES)
  const q = query(messagesCol, orderBy("createdAt", "asc"))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as ChatMessage)
}

export async function getChatSettings(): Promise<ChatSettings> {
  const settingsDoc = doc(db, COLLECTIONS.CHAT_SETTINGS, "global")
  const snapshot = await getDoc(settingsDoc)
  
  if (snapshot.exists()) {
    return convertTimestamps(snapshot.data()) as ChatSettings
  }
  
  // Default settings
  return { isEnabled: true, updatedAt: new Date(), updatedBy: "system" }
}

export async function updateChatSettings(settings: ChatSettings): Promise<void> {
  const settingsDoc = doc(db, COLLECTIONS.CHAT_SETTINGS, "global")
  await setDoc(settingsDoc, settings)
}

export async function sendChatMessage(
  senderId: string,
  senderName: string,
  senderRole: "operator" | "admin",
  content: string,
  recipientId?: string,
  attachment?: {
    type: "image"
    url: string
    name: string
  },
): Promise<ChatMessage> {
  const newMessage = {
    senderId,
    senderName,
    senderRole,
    recipientId,
    content,
    attachment,
    createdAt: new Date(),
    isRead: false,
  }
  
  const docRef = await addDoc(collection(db, COLLECTIONS.CHAT_MESSAGES), newMessage)
  return { id: docRef.id, ...newMessage }
}

export async function markChatMessageAsRead(messageId: string): Promise<void> {
  const messageDoc = doc(db, COLLECTIONS.CHAT_MESSAGES, messageId)
  await updateDoc(messageDoc, { isRead: true })
}

export async function deleteChatMessage(messageId: string): Promise<void> {
  const messageDoc = doc(db, COLLECTIONS.CHAT_MESSAGES, messageId)
  await deleteDoc(messageDoc)
}

// ============ PRESENTATIONS ============
export async function getPresentations(): Promise<Presentation[]> {
  const presentationsCol = collection(db, COLLECTIONS.PRESENTATIONS)
  const snapshot = await getDocs(presentationsCol)
  return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as Presentation)
}

export async function getActivePresentations(): Promise<Presentation[]> {
  const presentations = await getPresentations()
  return presentations.filter((p) => p.isActive)
}

export async function createPresentation(presentation: Omit<Presentation, "id" | "createdAt" | "updatedAt">): Promise<Presentation> {
  const newPresentation = {
    ...presentation,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  
  const docRef = await addDoc(collection(db, COLLECTIONS.PRESENTATIONS), newPresentation)
  return { id: docRef.id, ...newPresentation }
}

export async function updatePresentation(presentation: Presentation): Promise<void> {
  const presentationDoc = doc(db, COLLECTIONS.PRESENTATIONS, presentation.id)
  await updateDoc(presentationDoc, { ...presentation, updatedAt: new Date() })
}

export async function deletePresentation(id: string): Promise<void> {
  const presentationDoc = doc(db, COLLECTIONS.PRESENTATIONS, id)
  await deleteDoc(presentationDoc)
}

// ============ PRESENTATION PROGRESS ============
export async function getPresentationProgress(): Promise<PresentationProgress[]> {
  const progressCol = collection(db, COLLECTIONS.PRESENTATION_PROGRESS)
  const snapshot = await getDocs(progressCol)
  return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as PresentationProgress)
}

export async function getPresentationProgressByOperator(operatorId: string): Promise<PresentationProgress[]> {
  const progressCol = collection(db, COLLECTIONS.PRESENTATION_PROGRESS)
  const q = query(progressCol, where("operatorId", "==", operatorId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as PresentationProgress)
}

export async function getPresentationProgressByPresentation(presentationId: string): Promise<PresentationProgress[]> {
  const progressCol = collection(db, COLLECTIONS.PRESENTATION_PROGRESS)
  const q = query(progressCol, where("presentationId", "==", presentationId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as PresentationProgress)
}

export async function markPresentationAsSeen(presentationId: string, operatorId: string, operatorName: string): Promise<void> {
  const progress = await getPresentationProgress()
  const existing = progress.find((p) => p.presentationId === presentationId && p.operatorId === operatorId)

  if (existing) {
    const progressDoc = doc(db, COLLECTIONS.PRESENTATION_PROGRESS, existing.id)
    await updateDoc(progressDoc, {
      marked_as_seen: true,
      completion_date: new Date(),
    })
  } else {
    const newProgress = {
      presentationId,
      operatorId,
      operatorName,
      viewedAt: new Date(),
      marked_as_seen: true,
      completion_date: new Date(),
    }
    await addDoc(collection(db, COLLECTIONS.PRESENTATION_PROGRESS), newProgress)
  }
}

// ============ NOTES ============
export async function getNotes(userId: string): Promise<Note[]> {
  const notesCol = collection(db, COLLECTIONS.NOTES)
  const q = query(notesCol, where("userId", "==", userId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as Note)
}

export async function saveNote(userId: string, content: string): Promise<void> {
  const newNote = {
    userId,
    content,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  
  await addDoc(collection(db, COLLECTIONS.NOTES), newNote)
}

// ============ SESSIONS ============
export async function createCallSession(operatorId: string, startStepId: string): Promise<CallSession> {
  const newSession = {
    operatorId,
    currentStepId: startStepId,
    startedAt: new Date(),
    notes: "",
  }
  
  const docRef = await addDoc(collection(db, COLLECTIONS.SESSIONS), newSession)
  return { id: docRef.id, ...newSession }
}

export async function updateCallSession(session: CallSession): Promise<void> {
  const sessionDoc = doc(db, COLLECTIONS.SESSIONS, session.id)
  await updateDoc(sessionDoc, { ...session })
}
