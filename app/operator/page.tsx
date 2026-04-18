"use client"

import { useState, useEffect, useCallback, memo } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { OperatorHeader } from "@/components/operator-header"
import { OperatorSidebar } from "@/components/operator-sidebar"
import { ScriptCard } from "@/components/script-card"
import { AttendanceConfig } from "@/components/attendance-config"
import { OperatorChatModal } from "@/components/operator-chat-modal"
import { useAuth } from "@/lib/auth-context"
import { sendOperatorHeartbeat, trackScriptAccess } from "@/lib/store"
import { usePresenceHeartbeat, updateOperatorPresence } from "@/hooks/use-supabase-realtime"
import { 
  useCacheSync, 
  useCachedProductScripts,
  getCachedProductById,
  getCachedScriptsByProductId,
  getCachedScriptById,
} from "@/hooks/use-cached-data"
import type { ScriptStep, AttendanceConfig as AttendanceConfigType } from "@/lib/types"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

const mapScriptRowToStep = (step: any): ScriptStep => ({
  id: step.id,
  title: step.title,
  content: step.content,
  productId: step.product_id,
  productName: step.product_name,
  order: step.step_order ?? 0,
  buttons: step.buttons || [],
  tabulations: step.tabulations || [],
  alert: step.alert,
  isActive: step.is_active,
  createdAt: step.created_at ? new Date(step.created_at) : new Date(),
  updatedAt: step.updated_at ? new Date(step.updated_at) : new Date(),
})

const OperatorContent = memo(function OperatorContent() {
  const { user, logout } = useAuth()
  const router = useRouter()
  
  // Inicializar e manter cache sincronizado
  const { isInitialized, isSyncing } = useCacheSync()
  
  // Maintain presence in Supabase for realtime dashboard
  usePresenceHeartbeat(user?.id)
  const [currentStep, setCurrentStep] = useState<ScriptStep | null>(null)
  const [stepHistory, setStepHistory] = useState<string[]>([])
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [showConfig, setShowConfig] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [showControls, setShowControls] = useState(false)
  const [attendanceConfig, setAttendanceConfig] = useState<AttendanceConfigType | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentProductId, setCurrentProductId] = useState<string | null>(null)
  const [currentProductName, setCurrentProductName] = useState<string>("")
  const [currentProductCategory, setCurrentProductCategory] = useState<
    "habitacional" | "comercial" | "cartao" | "outros" | undefined
  >(undefined)
  const [showChatModal, setShowChatModal] = useState(false)
  const [allSteps, setAllSteps] = useState<ScriptStep[]>([])

  // Load all steps when product changes (from cache)
  useEffect(() => {
    if (!currentProductId) {
      setAllSteps([])
      return
    }
    
    const steps = getCachedScriptsByProductId(currentProductId)
    const mappedSteps = steps.map(mapScriptRowToStep)
    setAllSteps(mappedSteps)
  }, [currentProductId, isInitialized])

  const handleBackToStart = useCallback(() => {
    setIsSessionActive(false)
    setCurrentStep(null)
    setShowConfig(true)
    setAttendanceConfig(null)
    setSearchQuery("")
    setStepHistory([])
    setCurrentProductId(null)
    setCurrentProductName("")
    setCurrentProductCategory(undefined)
    setShowChatModal(false)
    setAllSteps([])
  }, [])

  useEffect(() => {
    const checkAutoLogout = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()

      if (hours === 21 && minutes === 0) {
        logout()
        router.push("/")
      }
    }

    checkAutoLogout()

    const interval = setInterval(checkAutoLogout, 30000)

    return () => clearInterval(interval)
  }, [logout, router])

  // Heartbeat: send every 30s to prove operator is active
  useEffect(() => {
    if (!user) return
    sendOperatorHeartbeat(user.id)
    const heartbeatInterval = setInterval(() => {
      sendOperatorHeartbeat(user.id)
    }, 30000)
    return () => clearInterval(heartbeatInterval)
  }, [user])

  // Track script access when operator starts a session with a product
  useEffect(() => {
    if (user && isSessionActive && currentProductName) {
      trackScriptAccess(user.id, currentProductName)
    }
  }, [user, isSessionActive, currentProductName])

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)

      if (query.trim() && isSessionActive && allSteps.length > 0) {
        const foundStep = allSteps.find((step) => step.title.toLowerCase().includes(query.toLowerCase()))

        if (foundStep) {
          setCurrentStep(foundStep)
        }
      }
    },
    [isSessionActive, allSteps],
  )

  const handleSearchStep = useCallback(
    (stepId: string) => {
      const step = allSteps.find((s) => s.id === stepId)
      if (step) {
        setStepHistory((prev) => [...prev, step.id])
        setCurrentStep(step)
        setSearchQuery("")
      }
    },
    [allSteps],
  )

  const handleStartAttendance = useCallback((config: AttendanceConfigType) => {
    setAttendanceConfig(config)

    // Get product from cache
    const product = getCachedProductById(config.product)

    if (product) {
      setCurrentProductId(product.id)
      setCurrentProductName(product.name)
      setCurrentProductCategory(product.category)
      
      // Get first script step from cache
      const steps = getCachedScriptsByProductId(product.id)
      const firstStep = steps.length > 0 ? steps[0] : null

      if (firstStep) {
        const mappedStep = mapScriptRowToStep(firstStep)
        setCurrentStep(mappedStep)
        setStepHistory([mappedStep.id])
        setIsSessionActive(true)
        setShowConfig(false)
        
        // Update presence
        if (user?.id) {
          updateOperatorPresence(user.id, {
            currentProduct: product.name,
            currentScreen: mappedStep.title,
            lastScriptAccess: true,
          })
        }
      } else {
        alert("Erro: Script não encontrado para este produto. Entre em contato com o administrador.")
      }
    } else {
      alert("Erro: Produto não encontrado. Entre em contato com o administrador.")
    }
  }, [user?.id])

  const handleButtonClick = useCallback(
    (nextStepId: string | null, buttonLabel?: string) => {
      if (buttonLabel && buttonLabel.toUpperCase().includes("FINALIZAR")) {
        if (currentProductId) {
          const steps = getCachedScriptsByProductId(currentProductId)
          const firstStep = steps.length > 0 ? steps[0] : null
          if (firstStep) {
            const mappedStep = mapScriptRowToStep(firstStep)
            setCurrentStep(mappedStep)
            setStepHistory([mappedStep.id])
            setSearchQuery("")
            return
          }
        }
        handleBackToStart()
        return
      }

      if (!currentProductId) {
        alert("Erro: Produto não identificado. Por favor, reinicie o atendimento.")
        handleBackToStart()
        return
      }

      if (nextStepId) {
        // Get next step from cache
        const nextStepData = getCachedScriptById(nextStepId)

        if (nextStepData) {
          const nextStep = mapScriptRowToStep(nextStepData)
          setStepHistory((prev) => [...prev, nextStep.id])
          setCurrentStep(nextStep)
          setSearchQuery("")
          
          if (user?.id) {
            updateOperatorPresence(user.id, {
              currentScreen: nextStep.title,
            })
          }
        } else {
          alert(`Próxima tela não encontrada. ID: ${nextStepId}. Por favor, contate o administrador.`)
        }
      } else {
        alert(
          "Fim do roteiro atingido. Clique em 'Voltar ao Início' para iniciar um novo atendimento ou contate o administrador para configurar o próximo passo.",
        )
      }
    },
    [currentProductId, handleBackToStart, user?.id],
  )

  const handleGoBack = useCallback(() => {
    if (stepHistory.length > 1 && currentProductId) {
      const newHistory = [...stepHistory]
      newHistory.pop()
      
      const previousStepId = newHistory[newHistory.length - 1]
      
      // Get previous step from cache
      const previousStepData = getCachedScriptById(previousStepId)

      if (previousStepData) {
        const previousStep = mapScriptRowToStep(previousStepData)
        setCurrentStep(previousStep)
        setStepHistory(newHistory)
        setSearchQuery("")
      }
    }
  }, [currentProductId, stepHistory])

  const handleProductSelect = useCallback((productId: string) => {
    // Get product from cache
    const product = getCachedProductById(productId)

    if (product) {
      setCurrentProductId(product.id)
      setCurrentProductName(product.name)
      setCurrentProductCategory(product.category)
      
      const steps = getCachedScriptsByProductId(product.id)
      const firstStep = steps.length > 0 ? steps[0] : null

      if (firstStep) {
        const mappedStep = mapScriptRowToStep(firstStep)
        setCurrentStep(mappedStep)
        setStepHistory([mappedStep.id])
        setIsSessionActive(true)
        setShowConfig(false)
        setSearchQuery("")
        
        if (user?.id) {
          updateOperatorPresence(user.id, {
            currentProduct: product.name,
            currentScreen: mappedStep.title,
            lastScriptAccess: true,
          })
        }
      }
    }
  }, [user?.id])

  const toggleSidebar = useCallback(() => setIsSidebarOpen((prev) => !prev), [])
  const toggleControls = useCallback(() => setShowControls((prev) => !prev), [])

  // Show loading while cache initializes
  if (!isInitialized) {
    return (
      <div className="flex flex-col h-screen h-dvh bg-background items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    )
  }

  if (!user) return null

  const operatorFirstName = user.fullName.split(" ")[0]

  return (
    <div className="flex flex-col h-screen h-dvh bg-background overflow-hidden">
      <OperatorHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        showControls={showControls}
        onToggleControls={toggleControls}
        isSessionActive={isSessionActive}
        onBackToStart={handleBackToStart}
        onProductSelect={handleProductSelect}
        onOpenChat={() => setShowChatModal(true)}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
            {showConfig && !isSessionActive ? (
              <div className="space-y-6 max-w-4xl mx-auto">
                <div className="text-center space-y-2">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-balance">
                    Bem-vindo, {user.fullName}
                  </h1>
                  <p className="text-muted-foreground text-base md:text-lg text-pretty">
                    Configure as opções abaixo para iniciar um novo atendimento
                  </p>
                </div>
                <AttendanceConfig onStart={handleStartAttendance} />
              </div>
            ) : currentStep ? (
              <div className="w-full">
                <ScriptCard
                  step={currentStep}
                  onButtonClick={handleButtonClick}
                  onGoBack={handleGoBack}
                  canGoBack={stepHistory.length > 1}
                  operatorName={operatorFirstName}
                  customerFirstName="[Primeiro nome do cliente]"
                  searchQuery={searchQuery}
                  showControls={showControls}
                  productName={currentProductName}
                  onSearchStep={handleSearchStep}
                  allSteps={allSteps}
                />
              </div>
            ) : null}
          </div>
        </main>

        {isSessionActive && <OperatorSidebar isOpen={isSidebarOpen} productCategory={currentProductCategory} currentStep={currentStep} />}
      </div>

      <OperatorChatModal isOpen={showChatModal} onClose={() => setShowChatModal(false)} />
      
      {/* Indicator de sincronização */}
      {isSyncing && (
        <div className="fixed bottom-4 right-4 bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-lg">
          <Loader2 className="h-3 w-3 animate-spin" />
          Sincronizando...
        </div>
      )}
    </div>
  )
})

export default function OperatorPage() {
  return (
    <ProtectedRoute allowedRoles={["operator"]}>
      <OperatorContent />
    </ProtectedRoute>
  )
}
