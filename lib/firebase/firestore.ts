import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
  writeBatch,
} from "firebase/firestore"
import { getFirebaseDb } from "./config"

// Collection names
export const COLLECTIONS = {
  USERS: "users",
  SCRIPTS: "scripts",
  PRODUCTS: "products",
  TABULATIONS: "tabulations",
  SITUATIONS: "situations",
  CHANNELS: "channels",
  MESSAGES: "messages",
  QUIZZES: "quizzes",
  QUIZ_ATTEMPTS: "quiz_attempts",
  PRESENTATIONS: "presentations",
  PRESENTATION_PROGRESS: "presentation_progress",
  CHAT_MESSAGES: "chat_messages",
  CHAT_SETTINGS: "chat_settings",
  QUALITY_POSTS: "quality_posts",
  QUALITY_COMMENTS: "quality_comments",
  FEEDBACKS: "feedbacks",
  RESULT_CODES: "result_codes",
  ADMIN_QUESTIONS: "admin_questions",
  NOTES: "notes",
  APP_SETTINGS: "app_settings",
  INITIAL_GUIDE: "initial_guide",
  CONTRACTS: "contracts",
  PHRASEOLOGY: "phraseology",
  SUPERVISOR_TEAMS: "supervisor_teams",
} as const

// Helper to convert Firestore Timestamp to Date
export function toDate(timestamp: Timestamp | Date | string | null | undefined): Date {
  if (!timestamp) return new Date()
  if (timestamp instanceof Timestamp) return timestamp.toDate()
  if (timestamp instanceof Date) return timestamp
  return new Date(timestamp)
}

// Helper to convert Date to Firestore-compatible format
export function toFirestoreDate(date: Date | string | null | undefined): string {
  if (!date) return new Date().toISOString()
  if (date instanceof Date) return date.toISOString()
  return date
}

// Generic CRUD functions
export async function getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
  const db = getFirebaseDb()
  const docRef = doc(db, collectionName, docId)
  const docSnap = await getDoc(docRef)
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T
  }
  return null
}

export async function getCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const db = getFirebaseDb()
  const collRef = collection(db, collectionName)
  const q = constraints.length > 0 ? query(collRef, ...constraints) : query(collRef)
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T))
}

export async function createDocument<T extends DocumentData>(
  collectionName: string,
  data: T,
  docId?: string
): Promise<string> {
  const db = getFirebaseDb()
  
  if (docId) {
    const docRef = doc(db, collectionName, docId)
    await setDoc(docRef, {
      ...data,
      created_at: toFirestoreDate(new Date()),
      updated_at: toFirestoreDate(new Date()),
    })
    return docId
  } else {
    const collRef = collection(db, collectionName)
    const docRef = await addDoc(collRef, {
      ...data,
      created_at: toFirestoreDate(new Date()),
      updated_at: toFirestoreDate(new Date()),
    })
    return docRef.id
  }
}

export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> {
  const db = getFirebaseDb()
  const docRef = doc(db, collectionName, docId)
  await updateDoc(docRef, {
    ...data,
    updated_at: toFirestoreDate(new Date()),
  })
}

export async function deleteDocument(collectionName: string, docId: string): Promise<void> {
  const db = getFirebaseDb()
  const docRef = doc(db, collectionName, docId)
  await deleteDoc(docRef)
}

// Realtime subscription helper
export function subscribeToCollection<T>(
  collectionName: string,
  callback: (data: T[]) => void,
  constraints: QueryConstraint[] = []
): () => void {
  const db = getFirebaseDb()
  const collRef = collection(db, collectionName)
  const q = constraints.length > 0 ? query(collRef, ...constraints) : query(collRef)
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T))
    callback(data)
  }, (error) => {
    console.error(`[Firebase] Error in ${collectionName} subscription:`, error)
  })
  
  return unsubscribe
}

export function subscribeToDocument<T>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void
): () => void {
  const db = getFirebaseDb()
  const docRef = doc(db, collectionName, docId)
  
  const unsubscribe = onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as T)
    } else {
      callback(null)
    }
  }, (error) => {
    console.error(`[Firebase] Error in ${collectionName}/${docId} subscription:`, error)
  })
  
  return unsubscribe
}

// Batch operations
export async function batchWrite(
  operations: Array<{
    type: "set" | "update" | "delete"
    collection: string
    docId: string
    data?: DocumentData
  }>
): Promise<void> {
  const db = getFirebaseDb()
  const batch = writeBatch(db)
  
  for (const op of operations) {
    const docRef = doc(db, op.collection, op.docId)
    
    switch (op.type) {
      case "set":
        batch.set(docRef, {
          ...op.data,
          created_at: toFirestoreDate(new Date()),
          updated_at: toFirestoreDate(new Date()),
        })
        break
      case "update":
        batch.update(docRef, {
          ...op.data,
          updated_at: toFirestoreDate(new Date()),
        })
        break
      case "delete":
        batch.delete(docRef)
        break
    }
  }
  
  await batch.commit()
}

// Re-export query helpers from firebase
export { query, where, orderBy, limit, collection, doc }
