"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  syncIfNeeded,
  syncAll,
  getCachedProducts,
  getCachedScripts,
  getCachedScriptsByProductId,
  getCachedScriptById,
  getCachedTabulations,
  getCachedSituations,
  getCachedChannels,
  getCachedResultCodes,
  getCachedInitialGuide,
  getCachedMessages,
  getCachedAppSettings,
  getCachedPhraseology,
  getCachedProductById,
  hasCachedData,
  getLastSyncTime,
} from "@/lib/cache-service"
import type { ScriptStep } from "@/lib/types"

// Intervalo de verificação de atualizações (5 minutos)
const SYNC_CHECK_INTERVAL = 5 * 60 * 1000

/**
 * Hook principal para inicializar e manter o cache sincronizado
 * Usar no layout principal do operador
 */
export function useCacheSync() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const doSync = useCallback(async (force = false) => {
    if (isSyncing) return
    
    setIsSyncing(true)
    try {
      if (force || !hasCachedData()) {
        await syncAll()
      } else {
        await syncIfNeeded()
      }
      setLastSync(new Date(getLastSyncTime()))
    } catch (e) {
      console.error("[Cache] Erro na sincronização:", e)
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing])

  useEffect(() => {
    // Sincronização inicial
    const initialize = async () => {
      await doSync(!hasCachedData())
      setIsInitialized(true)
    }
    
    initialize()

    // Configurar verificação periódica
    syncIntervalRef.current = setInterval(() => {
      doSync(false)
    }, SYNC_CHECK_INTERVAL)

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [doSync])

  const forceSync = useCallback(() => {
    doSync(true)
  }, [doSync])

  return {
    isInitialized,
    isSyncing,
    lastSync,
    forceSync,
  }
}

/**
 * Hook para acessar produtos do cache
 */
export function useCachedProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProducts = () => {
      const cached = getCachedProducts()
      setProducts(cached)
      setLoading(false)
    }

    loadProducts()

    // Escutar atualizações do cache
    const handleCacheUpdate = () => {
      loadProducts()
    }

    window.addEventListener("cache-updated", handleCacheUpdate)
    return () => window.removeEventListener("cache-updated", handleCacheUpdate)
  }, [])

  return { products, loading }
}

/**
 * Hook para acessar scripts de um produto específico do cache
 */
export function useCachedProductScripts(productId: string | null) {
  const [scripts, setScripts] = useState<ScriptStep[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!productId) {
      setScripts([])
      return
    }

    setLoading(true)
    const cached = getCachedScriptsByProductId(productId)
    
    const mappedScripts: ScriptStep[] = cached.map((s: any) => ({
      id: s.id,
      title: s.title,
      content: s.content,
      productId: s.product_id,
      productName: s.product_name,
      order: s.step_order ?? 0,
      buttons: s.buttons || [],
      tabulations: s.tabulations || [],
      alert: s.alert,
      isActive: s.is_active,
      createdAt: s.created_at ? new Date(s.created_at) : new Date(),
      updatedAt: s.updated_at ? new Date(s.updated_at) : new Date(),
    }))
    
    setScripts(mappedScripts)
    setLoading(false)
  }, [productId])

  const getStepById = useCallback((stepId: string): ScriptStep | null => {
    const step = scripts.find(s => s.id === stepId)
    return step || null
  }, [scripts])

  const getFirstStep = useCallback((): ScriptStep | null => {
    return scripts.length > 0 ? scripts[0] : null
  }, [scripts])

  return { scripts, loading, getStepById, getFirstStep }
}

/**
 * Hook para acessar um script específico do cache
 */
export function useCachedScript(scriptId: string | null) {
  const [script, setScript] = useState<any | null>(null)

  useEffect(() => {
    if (!scriptId) {
      setScript(null)
      return
    }

    const cached = getCachedScriptById(scriptId)
    setScript(cached)
  }, [scriptId])

  return script
}

/**
 * Hook para acessar tabulações do cache
 */
export function useCachedTabulations() {
  const [tabulations, setTabulations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = getCachedTabulations()
    setTabulations(cached)
    setLoading(false)
  }, [])

  return { tabulations, loading }
}

/**
 * Hook para acessar situações do cache
 */
export function useCachedSituations() {
  const [situations, setSituations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = getCachedSituations()
    setSituations(cached)
    setLoading(false)
  }, [])

  return { situations, loading }
}

/**
 * Hook para acessar canais do cache
 */
export function useCachedChannels() {
  const [channels, setChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = getCachedChannels()
    setChannels(cached)
    setLoading(false)
  }, [])

  return { channels, loading }
}

/**
 * Hook para acessar códigos de resultado do cache
 */
export function useCachedResultCodes() {
  const [resultCodes, setResultCodes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = getCachedResultCodes()
    setResultCodes(cached)
    setLoading(false)
  }, [])

  return { resultCodes, loading }
}

/**
 * Hook para acessar guia inicial do cache
 */
export function useCachedInitialGuide() {
  const [guide, setGuide] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = getCachedInitialGuide()
    setGuide(cached)
    setLoading(false)
  }, [])

  return { guide, loading }
}

/**
 * Hook para acessar mensagens do cache
 */
export function useCachedMessages() {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = getCachedMessages()
    setMessages(cached)
    setLoading(false)
  }, [])

  return { messages, loading }
}

/**
 * Hook para acessar configurações do app do cache
 */
export function useCachedAppSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = getCachedAppSettings()
    setSettings(cached)
    setLoading(false)
  }, [])

  return { settings, loading }
}

/**
 * Hook para acessar fraseologia do cache
 */
export function useCachedPhraseology() {
  const [phraseology, setPhraseology] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = getCachedPhraseology()
    setPhraseology(cached)
    setLoading(false)
  }, [])

  return { phraseology, loading }
}

/**
 * Hook para acessar um produto específico do cache
 */
export function useCachedProduct(productId: string | null) {
  const [product, setProduct] = useState<any | null>(null)

  useEffect(() => {
    if (!productId) {
      setProduct(null)
      return
    }

    const cached = getCachedProductById(productId)
    setProduct(cached)
  }, [productId])

  return product
}

/**
 * Hook para acessar contratos do cache (alias para guia inicial)
 */
export function useCachedContracts() {
  const [contracts, setContracts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = getCachedInitialGuide()
    setContracts(cached)
    setLoading(false)
  }, [])

  return { data: contracts, loading }
}

// Funções auxiliares para acesso direto (sem hook)
export {
  getCachedProducts,
  getCachedScripts,
  getCachedScriptsByProductId,
  getCachedScriptById,
  getCachedTabulations,
  getCachedSituations,
  getCachedChannels,
  getCachedResultCodes,
  getCachedInitialGuide,
  getCachedMessages,
  getCachedAppSettings,
  getCachedPhraseology,
  getCachedProductById,
}
