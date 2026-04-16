// Firebase compatibility layer - provides Supabase-like API using Firebase
import { getFirebaseDb } from "@/lib/firebase/config"
import { COLLECTIONS, toFirestoreDate } from "@/lib/firebase/firestore"
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where, 
  limit,
  onSnapshot,
  type QueryConstraint,
} from "firebase/firestore"

// Supabase-like client interface using Firebase
class FirebaseSupabaseClient {
  // Lazy initialization to avoid SSR issues
  private getDb() {
    return getFirebaseDb()
  }

  from(tableName: string) {
    return new QueryBuilder(this.getDb(), tableName)
  }

  channel(channelName: string) {
    return new RealtimeChannel(this.getDb(), channelName)
  }

  removeChannel(channel: RealtimeChannel) {
    channel.unsubscribe()
  }
}

class QueryBuilder {
  private db: ReturnType<typeof getFirebaseDb>
  private tableName: string
  private constraints: QueryConstraint[] = []
  private selectFields: string = "*"
  private isSingle: boolean = false
  private updateData: Record<string, any> | null = null
  private insertData: Record<string, any> | null = null
  private deleteMode: boolean = false

  constructor(db: ReturnType<typeof getFirebaseDb>, tableName: string) {
    this.db = db
    this.tableName = tableName
  }

  select(fields: string = "*") {
    this.selectFields = fields
    return this
  }

  eq(field: string, value: any) {
    this.constraints.push(where(field, "==", value))
    return this
  }

  ilike(field: string, value: string) {
    // Firebase doesn't support ILIKE natively, so we store the field and value for post-filtering
    // For now, we'll do an exact match since Firebase doesn't support case-insensitive queries easily
    this.constraints.push(where(field, "==", value))
    return this
  }

  or(conditions: string) {
    // Firebase doesn't support OR queries easily, so we skip for now
    // The main query will still work, we just won't filter by OR
    return this
  }

  order(field: string, options: { ascending?: boolean } = {}) {
    this.constraints.push(orderBy(field, options.ascending === false ? "desc" : "asc"))
    return this
  }

  limit(count: number) {
    this.constraints.push(limit(count))
    return this
  }

  single() {
    this.isSingle = true
    return this
  }

  update(data: Record<string, any>) {
    this.updateData = data
    return this
  }

  insert(data: Record<string, any> | Record<string, any>[]) {
    this.insertData = Array.isArray(data) ? data[0] : data
    return this
  }

  delete() {
    this.deleteMode = true
    return this
  }

  async then(resolve: (result: { data: any; error: any; count?: number }) => void) {
    try {
      const collRef = collection(this.db, this.tableName)
      
      if (this.insertData) {
        const docRef = await addDoc(collRef, {
          ...this.insertData,
          created_at: toFirestoreDate(new Date()),
          updated_at: toFirestoreDate(new Date()),
        })
        resolve({ data: { id: docRef.id, ...this.insertData }, error: null })
        return
      }

      if (this.updateData && this.constraints.length > 0) {
        // For updates with constraints, we need to find the doc first
        const q = query(collRef, ...this.constraints)
        const snapshot = await getDocs(q)
        
        for (const docSnap of snapshot.docs) {
          await updateDoc(doc(this.db, this.tableName, docSnap.id), {
            ...this.updateData,
            updated_at: toFirestoreDate(new Date()),
          })
        }
        resolve({ data: this.updateData, error: null })
        return
      }

      if (this.deleteMode && this.constraints.length > 0) {
        const q = query(collRef, ...this.constraints)
        const snapshot = await getDocs(q)
        
        for (const docSnap of snapshot.docs) {
          await deleteDoc(doc(this.db, this.tableName, docSnap.id))
        }
        resolve({ data: null, error: null })
        return
      }

      // Select query
      const q = this.constraints.length > 0 
        ? query(collRef, ...this.constraints) 
        : query(collRef)
      const snapshot = await getDocs(q)
      
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      if (this.isSingle) {
        resolve({ data: data.length > 0 ? data[0] : null, error: data.length === 0 ? { message: "No rows found" } : null })
      } else {
        resolve({ data, error: null, count: data.length })
      }
    } catch (error: any) {
      resolve({ data: null, error: { message: error.message } })
    }
  }
}

class RealtimeChannel {
  private db: ReturnType<typeof getFirebaseDb>
  private channelName: string
  private unsubscribers: (() => void)[] = []
  private callbacks: Map<string, (payload: any) => void> = new Map()

  constructor(db: ReturnType<typeof getFirebaseDb>, channelName: string) {
    this.db = db
    this.channelName = channelName
  }

  on(
    event: string,
    config: { event: string; schema: string; table: string; filter?: string },
    callback: (payload: any) => void
  ) {
    this.callbacks.set(config.table, callback)
    return this
  }

  subscribe() {
    for (const [tableName, callback] of this.callbacks) {
      const collRef = collection(this.db, tableName)
      const unsub = onSnapshot(collRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          callback({
            eventType: change.type === "added" ? "INSERT" : change.type === "modified" ? "UPDATE" : "DELETE",
            new: { id: change.doc.id, ...change.doc.data() },
            old: null,
          })
        })
      })
      this.unsubscribers.push(unsub)
    }
    return this
  }

  unsubscribe() {
    this.unsubscribers.forEach(unsub => unsub())
    this.unsubscribers = []
  }
}

// Singleton instance
let clientInstance: FirebaseSupabaseClient | null = null

export function createClient() {
  if (!clientInstance) {
    clientInstance = new FirebaseSupabaseClient()
  }
  return clientInstance
}

// For compatibility
export type SupabaseClient = FirebaseSupabaseClient
