"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  getDoc,
  setDoc,
  writeBatch,
} from "firebase/firestore"
import { getFirebaseDb } from "@/lib/firebase/config"
import { COLLECTIONS, toFirestoreDate } from "@/lib/firebase/firestore"

// Generic hook for CRUD operations with realtime
export function useFirebaseTable<T extends { id: string }>(
  tableName: string,
  orderByField: string = "created_at",
  ascending: boolean = false
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const db = getFirebaseDb()
      const collRef = collection(db, tableName)
      const q = query(collRef, orderBy(orderByField, ascending ? "asc" : "desc"))
      const snapshot = await getDocs(q)
      
      const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T))
      setData(result)
      setError(null)
    } catch (e: any) {
      setError(e.message || "Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }, [tableName, orderByField, ascending])

  useEffect(() => {
    const db = getFirebaseDb()
    const collRef = collection(db, tableName)
    const q = query(collRef, orderBy(orderByField, ascending ? "asc" : "desc"))
    
    unsubscribeRef.current = onSnapshot(q, (snapshot) => {
      const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T))
      setData(result)
      setLoading(false)
    }, (err) => {
      console.error(`[Firebase] ${tableName} subscription error:`, err)
      setError(err.message)
      setLoading(false)
    })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [tableName, orderByField, ascending])

  const create = async (item: Omit<T, "id" | "created_at" | "updated_at">) => {
    try {
      const db = getFirebaseDb()
      const collRef = collection(db, tableName)
      const docRef = await addDoc(collRef, {
        ...item,
        created_at: toFirestoreDate(new Date()),
        updated_at: toFirestoreDate(new Date()),
      })
      return { data: { id: docRef.id, ...item } as T, error: null }
    } catch (e: any) {
      return { data: null, error: e.message || "Erro ao criar" }
    }
  }

  const update = async (id: string, updates: Partial<T>) => {
    try {
      const db = getFirebaseDb()
      const docRef = doc(db, tableName, id)
      await updateDoc(docRef, {
        ...updates,
        updated_at: toFirestoreDate(new Date()),
      })
      return { data: { id, ...updates } as T, error: null }
    } catch (e: any) {
      return { data: null, error: e.message || "Erro ao atualizar" }
    }
  }

  const remove = async (id: string) => {
    try {
      const db = getFirebaseDb()
      const docRef = doc(db, tableName, id)
      await deleteDoc(docRef)
      return { error: null }
    } catch (e: any) {
      return { error: e.message || "Erro ao excluir" }
    }
  }

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    create,
    update,
    remove,
  }
}

// Specific hooks for each table
export function useScripts() {
  return useFirebaseTable<{
    id: string
    title: string
    content: string
    category: string
    product_id?: string
    product_name?: string
    step_order?: number
    buttons?: any
    tabulations?: any
    alert?: any
    is_active: boolean
    created_at: string
    updated_at: string
  }>(COLLECTIONS.SCRIPTS)
}

// Get scripts for a specific product
// Note: Using single filter + client-side filtering to avoid needing composite indexes
export async function getScriptsByProductId(productId: string) {
  const db = getFirebaseDb()
  const scriptsRef = collection(db, COLLECTIONS.SCRIPTS)
  // Only filter by product_id in Firestore, filter is_active and sort on client
  const q = query(scriptsRef, where("product_id", "==", productId))
  const snapshot = await getDocs(q)
  
  // Filter active scripts and sort by step_order on client side
  const scripts = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as any))
    .filter(script => script.is_active === true)
    .sort((a, b) => (a.step_order || 0) - (b.step_order || 0))
  
  return scripts
}

// Get the first script step for a product
export async function getFirstScriptStep(productId: string) {
  const scripts = await getScriptsByProductId(productId)
  return scripts.length > 0 ? scripts[0] : null
}

// Get a specific script step by ID
export async function getScriptStepByIdFromFirebase(stepId: string) {
  const db = getFirebaseDb()
  const docRef = doc(db, COLLECTIONS.SCRIPTS, stepId)
  const docSnap = await getDoc(docRef)
  
  if (!docSnap.exists()) return null
  return { id: docSnap.id, ...docSnap.data() }
}

// Hook for operator to use scripts with realtime updates
export function useProductScripts(productId: string | null) {
  const [scripts, setScripts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const fetchScripts = useCallback(async () => {
    if (!productId) {
      setScripts([])
      return
    }
    
    setLoading(true)
    const data = await getScriptsByProductId(productId)
    
    const mappedScripts = data.map((s: any) => ({
      id: s.id,
      title: s.title,
      content: s.content,
      productId: s.product_id,
      productName: s.product_name,
      order: s.step_order,
      buttons: s.buttons || [],
      tabulations: s.tabulations || [],
      alert: s.alert,
      isActive: s.is_active,
    }))
    
    setScripts(mappedScripts)
    setLoading(false)
  }, [productId])

  useEffect(() => {
    if (!productId) {
      setScripts([])
      return
    }

    fetchScripts()

    const db = getFirebaseDb()
    const scriptsRef = collection(db, COLLECTIONS.SCRIPTS)
    const q = query(
      scriptsRef,
      where("product_id", "==", productId)
    )
    
    unsubscribeRef.current = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((s: any) => s.is_active !== false)
        .sort((a: any, b: any) => (a.step_order || 0) - (b.step_order || 0))
      
      const mappedScripts = data.map((s: any) => ({
        id: s.id,
        title: s.title,
        content: s.content,
        productId: s.product_id,
        productName: s.product_name,
        order: s.step_order,
        buttons: s.buttons || [],
        tabulations: s.tabulations || [],
        alert: s.alert,
        isActive: s.is_active,
      }))
      
      setScripts(mappedScripts)
      setLoading(false)
    })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [productId, fetchScripts])

  const getStepById = useCallback((stepId: string) => {
    return scripts.find((s) => s.id === stepId) || null
  }, [scripts])

  const getFirstStep = useCallback(() => {
    return scripts.length > 0 ? scripts[0] : null
  }, [scripts])

  return { scripts, loading, getStepById, getFirstStep, refetch: fetchScripts }
}

export function useProducts() {
  return useFirebaseTable<{
    id: string
    name: string
    description: string
    category: string
    price: number
    is_active: boolean
    details: Record<string, any>
    created_at: string
    updated_at: string
  }>(COLLECTIONS.PRODUCTS)
}

export function useTabulations() {
  return useFirebaseTable<{
    id: string
    name: string
    description: string
    color: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>(COLLECTIONS.TABULATIONS)
}

export function useSituations() {
  return useFirebaseTable<{
    id: string
    name: string
    description: string
    color: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>(COLLECTIONS.SITUATIONS)
}

export function useChannels() {
  return useFirebaseTable<{
    id: string
    name: string
    description: string
    icon: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>(COLLECTIONS.CHANNELS)
}

export function useResultCodes() {
  return useFirebaseTable<{
    id: string
    code: string
    name: string
    description: string
    category: string
    color: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>(COLLECTIONS.RESULT_CODES)
}

export function useInitialGuide() {
  return useFirebaseTable<{
    id: string
    title: string
    content: string
    step_order: number
    is_active: boolean
    created_at: string
    updated_at: string
  }>(COLLECTIONS.INITIAL_GUIDE, "step_order", true)
}

export function useContracts() {
  return useFirebaseTable<{
    id: string
    name: string
    description: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>(COLLECTIONS.CONTRACTS)
}

export function useNotes(userId?: string) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const fetchData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    
    const db = getFirebaseDb()
    const notesRef = collection(db, COLLECTIONS.NOTES)
    // Only filter by user_id, sort on client to avoid composite index
    const q = query(notesRef, where("user_id", "==", userId))
    const snapshot = await getDocs(q)
    
    const notes = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as any))
      .sort((a, b) => {
        const dateA = a.created_at?.toDate?.() || new Date(a.created_at || 0)
        const dateB = b.created_at?.toDate?.() || new Date(b.created_at || 0)
        return dateB.getTime() - dateA.getTime()
      })
    setData(notes)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (!userId) return

    fetchData()

    const db = getFirebaseDb()
    const notesRef = collection(db, COLLECTIONS.NOTES)
    // Only filter by user_id, sort on client to avoid composite index
    const q = query(notesRef, where("user_id", "==", userId))
    
    unsubscribeRef.current = onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .sort((a, b) => {
          const dateA = a.created_at?.toDate?.() || new Date(a.created_at || 0)
          const dateB = b.created_at?.toDate?.() || new Date(b.created_at || 0)
          return dateB.getTime() - dateA.getTime()
        })
      setData(notes)
      setLoading(false)
    })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [userId, fetchData])

  const create = async (note: { title: string; content: string; color?: string }) => {
    const db = getFirebaseDb()
    const notesRef = collection(db, COLLECTIONS.NOTES)
    const docRef = await addDoc(notesRef, { 
      ...note, 
      user_id: userId,
      created_at: toFirestoreDate(new Date()),
    })
    return { data: { id: docRef.id, ...note }, error: null }
  }

  const update = async (id: string, updates: any) => {
    const db = getFirebaseDb()
    const docRef = doc(db, COLLECTIONS.NOTES, id)
    await updateDoc(docRef, { ...updates, updated_at: toFirestoreDate(new Date()) })
    return { data: { id, ...updates }, error: null }
  }

  const remove = async (id: string) => {
    const db = getFirebaseDb()
    await deleteDoc(doc(db, COLLECTIONS.NOTES, id))
    return { error: null }
  }

  return { data, loading, refetch: fetchData, create, update, remove }
}

export function useAppSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    const db = getFirebaseDb()
    const settingsRef = collection(db, COLLECTIONS.APP_SETTINGS)
    const snapshot = await getDocs(settingsRef)
    
    const settingsMap: Record<string, any> = {}
    snapshot.docs.forEach((doc) => {
      settingsMap[doc.id] = doc.data().value
    })
    setSettings(settingsMap)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSettings()

    const db = getFirebaseDb()
    const settingsRef = collection(db, COLLECTIONS.APP_SETTINGS)
    
    unsubscribeRef.current = onSnapshot(settingsRef, (snapshot) => {
      const settingsMap: Record<string, any> = {}
      snapshot.docs.forEach((doc) => {
        settingsMap[doc.id] = doc.data().value
      })
      setSettings(settingsMap)
      setLoading(false)
    })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [fetchSettings])

  const updateSetting = async (key: string, value: any) => {
    const db = getFirebaseDb()
    const docRef = doc(db, COLLECTIONS.APP_SETTINGS, key)
    await setDoc(docRef, { value, updated_at: toFirestoreDate(new Date()) })
    return { error: null }
  }

  return { settings, loading, refetch: fetchSettings, updateSetting }
}

export function usePhraseology() {
  return useFirebaseTable<{
    id: string
    title: string
    content: string
    category: string
    shortcut: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>(COLLECTIONS.PHRASEOLOGY)
}

// Import scripts from JSON file
export async function importScriptsFromJson(jsonData: any): Promise<{ productCount: number; stepCount: number }> {
  const db = getFirebaseDb()
  let productCount = 0
  let stepCount = 0
  const errors: string[] = []

  const marcas = jsonData.marcas || jsonData

  for (const [productName, steps] of Object.entries(marcas)) {
    // Check if product already exists by name
    const productsRef = collection(db, COLLECTIONS.PRODUCTS)
    const existingQuery = query(productsRef, where("name", "==", productName))
    const existingSnapshot = await getDocs(existingQuery)

    let productId: string

    if (!existingSnapshot.empty) {
      productId = existingSnapshot.docs[0].id
      productCount++
      
      // Delete existing scripts for this product
      const scriptsRef = collection(db, COLLECTIONS.SCRIPTS)
      const scriptsQuery = query(scriptsRef, where("product_id", "==", productId))
      const scriptsSnapshot = await getDocs(scriptsQuery)
      
      const batch = writeBatch(db)
      scriptsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })
      await batch.commit()
    } else {
      // Create new product
      const productRef = await addDoc(productsRef, {
        name: productName,
        description: `Produto ${productName}`,
        category: "imported",
        is_active: true,
        created_at: toFirestoreDate(new Date()),
      })
      
      productId = productRef.id
      productCount++
    }

    // Create all steps and build ID mapping
    const idMapping: Record<string, string> = {}
    const stepsToInsert: any[] = []
    
    if (typeof steps === "object" && steps !== null) {
      const stepsObj = steps as Record<string, any>
      let order = 0

      for (const [stepKey, stepData] of Object.entries(stepsObj)) {
        order++
        const step = stepData as any
        
        const originalId = step.id || stepKey
        const stepContent = step.body || step.conteudo || step.content || step.texto || ""
        const stepTitle = step.title || step.titulo || stepKey

        stepsToInsert.push({
          originalId,
          title: stepTitle,
          content: stepContent,
          product_id: productId,
          product_name: productName,
          step_order: order,
          buttons: step.botoes || step.buttons || [],
          tabulations: step.tabulacoes || step.tabulations || [],
          alert: step.alerta || step.alert || null,
          is_active: true,
        })
      }
    }

    // Insert all steps
    const scriptsRef = collection(db, COLLECTIONS.SCRIPTS)
    
    for (const stepData of stepsToInsert) {
      const { originalId, ...insertData } = stepData
      
      const newStepRef = await addDoc(scriptsRef, {
        ...insertData,
        created_at: toFirestoreDate(new Date()),
      })
      
      idMapping[originalId] = newStepRef.id
      stepCount++
    }

    // Update all buttons to use new IDs
    for (const [originalId, newId] of Object.entries(idMapping)) {
      const docRef = doc(db, COLLECTIONS.SCRIPTS, newId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists() && docSnap.data()?.buttons) {
        const updatedButtons = docSnap.data().buttons.map((btn: any, index: number) => {
          const nextId = btn.next ? (idMapping[btn.next] || btn.next) : null
          return {
            id: btn.id || `btn-${index}`,
            label: btn.label || btn.text || `Botao ${index + 1}`,
            nextStepId: nextId,
            next: nextId,
            order: btn.order ?? index,
            primary: btn.primary ?? (index === 0),
            variant: btn.variant || (index === 0 ? "primary" : "secondary"),
          }
        })

        await updateDoc(docRef, { buttons: updatedButtons })
      }
    }
  }

  if (errors.length > 0 && stepCount === 0) {
    throw new Error(`Erros na importacao: ${errors[0]}`)
  }

  return { productCount, stepCount }
}

// Bulk import tabulations
export async function importTabulationsFromJson(tabulationsData: any[]): Promise<number> {
  const db = getFirebaseDb()
  let count = 0
  
  for (const tab of tabulationsData) {
    const docRef = doc(db, COLLECTIONS.TABULATIONS, tab.id || `tab-${Date.now()}-${count}`)
    await setDoc(docRef, {
      name: tab.name || tab.nome,
      description: tab.description || tab.descricao || "",
      color: tab.color || tab.cor || "#6b7280",
      is_active: true,
      created_at: toFirestoreDate(new Date()),
    })
    count++
  }
  
  return count
}

// Bulk import situations
export async function importSituationsFromJson(situationsData: any[]): Promise<number> {
  const db = getFirebaseDb()
  let count = 0
  
  for (const sit of situationsData) {
    const docRef = doc(db, COLLECTIONS.SITUATIONS, sit.id || `sit-${Date.now()}-${count}`)
    await setDoc(docRef, {
      name: sit.name || sit.nome,
      description: sit.description || sit.descricao || "",
      color: sit.color || sit.cor || "#6b7280",
      is_active: true,
      created_at: toFirestoreDate(new Date()),
    })
    count++
  }
  
  return count
}

// Delete all scripts for a product
export async function deleteScriptsForProduct(productId: string): Promise<void> {
  const db = getFirebaseDb()
  
  // Delete scripts
  const scriptsRef = collection(db, COLLECTIONS.SCRIPTS)
  const scriptsQuery = query(scriptsRef, where("product_id", "==", productId))
  const scriptsSnapshot = await getDocs(scriptsQuery)
  
  const batch = writeBatch(db)
  scriptsSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref)
  })
  
  // Delete product
  batch.delete(doc(db, COLLECTIONS.PRODUCTS, productId))
  
  await batch.commit()
}

// Delete all scripts for a product by name
export async function deleteScriptsForProductByName(productName: string): Promise<void> {
  const db = getFirebaseDb()
  const productsRef = collection(db, COLLECTIONS.PRODUCTS)
  const q = query(productsRef, where("name", "==", productName))
  const snapshot = await getDocs(q)
  
  if (!snapshot.empty) {
    await deleteScriptsForProduct(snapshot.docs[0].id)
  }
}

// Messages hook for operator messages
export function useMessages(userId?: string) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const db = getFirebaseDb()
    const messagesRef = collection(db, COLLECTIONS.MESSAGES)
    const q = query(messagesRef, orderBy("created_at", "desc"))
    const snapshot = await getDocs(q)

    setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()

    const db = getFirebaseDb()
    const messagesRef = collection(db, COLLECTIONS.MESSAGES)
    const q = query(messagesRef, orderBy("created_at", "desc"))
    
    unsubscribeRef.current = onSnapshot(q, (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [fetchData])

  const markAsSeen = async (messageId: string) => {
    if (!userId) return
    const message = data.find((m) => m.id === messageId)
    if (!message) return

    const seenBy = message.seen_by || []
    if (!seenBy.includes(userId)) {
      const db = getFirebaseDb()
      const messageRef = doc(db, COLLECTIONS.MESSAGES, messageId)
      await updateDoc(messageRef, { seen_by: [...seenBy, userId] })
    }
  }

  const create = async (messageData: any) => {
    const db = getFirebaseDb()
    const messagesRef = collection(db, COLLECTIONS.MESSAGES)
    await addDoc(messagesRef, { ...messageData, created_at: toFirestoreDate(new Date()) })
    return { error: null }
  }

  const update = async (id: string, updates: any) => {
    const db = getFirebaseDb()
    const messageRef = doc(db, COLLECTIONS.MESSAGES, id)
    await updateDoc(messageRef, { ...updates, updated_at: toFirestoreDate(new Date()) })
    return { error: null }
  }

  const remove = async (id: string) => {
    const db = getFirebaseDb()
    await deleteDoc(doc(db, COLLECTIONS.MESSAGES, id))
    return { error: null }
  }

  return { data, loading, refetch: fetchData, markAsSeen, create, update, remove }
}

// Quizzes hook
export function useQuizzes(userId?: string) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const db = getFirebaseDb()
    const quizzesRef = collection(db, COLLECTIONS.QUIZZES)
    const q = query(quizzesRef, orderBy("created_at", "desc"))
    const snapshot = await getDocs(q)

    setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()

    const db = getFirebaseDb()
    const quizzesRef = collection(db, COLLECTIONS.QUIZZES)
    const q = query(quizzesRef, orderBy("created_at", "desc"))
    
    unsubscribeRef.current = onSnapshot(q, (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [fetchData])

  const create = async (quizData: any) => {
    const db = getFirebaseDb()
    const quizzesRef = collection(db, COLLECTIONS.QUIZZES)
    await addDoc(quizzesRef, { ...quizData, created_at: toFirestoreDate(new Date()) })
    return { error: null }
  }

  const update = async (id: string, updates: any) => {
    const db = getFirebaseDb()
    const quizRef = doc(db, COLLECTIONS.QUIZZES, id)
    await updateDoc(quizRef, { ...updates, updated_at: toFirestoreDate(new Date()) })
    return { error: null }
  }

  const remove = async (id: string) => {
    const db = getFirebaseDb()
    await deleteDoc(doc(db, COLLECTIONS.QUIZZES, id))
    return { error: null }
  }

  return { data, loading, refetch: fetchData, create, update, remove }
}

// Presentations hook
export function usePresentations() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const db = getFirebaseDb()
    const presentationsRef = collection(db, COLLECTIONS.PRESENTATIONS)
    const q = query(presentationsRef, orderBy("created_at", "desc"))
    const snapshot = await getDocs(q)

    setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()

    const db = getFirebaseDb()
    const presentationsRef = collection(db, COLLECTIONS.PRESENTATIONS)
    const q = query(presentationsRef, orderBy("created_at", "desc"))
    
    unsubscribeRef.current = onSnapshot(q, (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [fetchData])

  const create = async (presentationData: any) => {
    const db = getFirebaseDb()
    const presentationsRef = collection(db, COLLECTIONS.PRESENTATIONS)
    const docRef = await addDoc(presentationsRef, { 
      ...presentationData, 
      created_at: toFirestoreDate(new Date()),
    })
    return { data: { id: docRef.id, ...presentationData }, error: null }
  }

  const update = async (id: string, updates: any) => {
    const db = getFirebaseDb()
    const presentationRef = doc(db, COLLECTIONS.PRESENTATIONS, id)
    await updateDoc(presentationRef, { ...updates, updated_at: toFirestoreDate(new Date()) })
    return { error: null }
  }

  const remove = async (id: string) => {
    const db = getFirebaseDb()
    await deleteDoc(doc(db, COLLECTIONS.PRESENTATIONS, id))
    return { error: null }
  }

  return { data, loading, refetch: fetchData, create, update, remove }
}

// Chat messages hook
export function useChatMessages() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const db = getFirebaseDb()
    const chatRef = collection(db, COLLECTIONS.CHAT_MESSAGES)
    const q = query(chatRef, orderBy("created_at", "asc"))
    const snapshot = await getDocs(q)

    setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()

    const db = getFirebaseDb()
    const chatRef = collection(db, COLLECTIONS.CHAT_MESSAGES)
    const q = query(chatRef, orderBy("created_at", "asc"))
    
    unsubscribeRef.current = onSnapshot(q, (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [fetchData])

  const create = async (messageData: any) => {
    const db = getFirebaseDb()
    const chatRef = collection(db, COLLECTIONS.CHAT_MESSAGES)
    const docRef = await addDoc(chatRef, { 
      ...messageData, 
      created_at: toFirestoreDate(new Date()),
    })
    return { data: { id: docRef.id, ...messageData }, error: null }
  }

  const update = async (id: string, updates: any) => {
    const db = getFirebaseDb()
    const messageRef = doc(db, COLLECTIONS.CHAT_MESSAGES, id)
    await updateDoc(messageRef, { ...updates, updated_at: toFirestoreDate(new Date()) })
    return { error: null }
  }

  const remove = async (id: string) => {
    const db = getFirebaseDb()
    await deleteDoc(doc(db, COLLECTIONS.CHAT_MESSAGES, id))
    return { error: null }
  }

  return { data, loading, refetch: fetchData, create, update, remove }
}

// Supervisor teams hook
export function useSupervisorTeams() {
  return useFirebaseTable<{
    id: string
    supervisor_id: string
    operator_ids: string[]
    created_at: string
    updated_at: string
  }>(COLLECTIONS.SUPERVISOR_TEAMS)
}

// Supabase compatibility exports (aliases)
export const useSupabaseTable = useFirebaseTable
export const getScriptStepByIdFromSupabase = getScriptStepByIdFromFirebase
