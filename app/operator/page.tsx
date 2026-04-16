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
import { useProductScripts, getFirstScriptStep, getScriptsByProductId } from "@/hooks/use-supabase-admin"
import { createClient } from "@/lib/supabase/client"
import type { ScriptStep, AttendanceConfig as AttendanceConfigType } from "@/lib/types"
import { useRouter } from "next/navigation"

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

  // Load all steps when product changes
  useEffect(() => {
    async function loadSteps() {
      if (!currentProductId) {
        setAllSteps([])
        return
      }
      const steps = await getScriptsByProductId(currentProductId)
      const mappedSteps = steps.map(mapScriptRowToStep)
      setAllSteps(mappedSteps)
    }
    loadSteps()
  }, [currentProductId])

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

  // Scripts are updated via allSteps state which loads from Supabase

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

  const handleStartAttendance = useCallback(async (config: AttendanceConfigType) => {
    setAttendanceConfig(config)

    console.log("[v0] handleStartAttendance - config.product ID:", config.product)

    // Get product from Supabase (Firebase compatibility layer)
    const supabase = createClient()
    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", config.product)
      .single()

    console.log("[v0] Product query result:", { product, error })

    if (product) {
      setCurrentProductId(product.id)
      setCurrentProductName(product.name)
      setCurrentProductCategory(product.category)
      
      // Get first script step from Supabase
      const firstStep = await getFirstScriptStep(product.id)

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
      console.error("[v0] Produto não encontrado! ID buscado:", config.product, "Erro:", error)
      alert("Erro: Produto não encontrado. Entre em contato com o administrador.")
    }
  }, [user?.id])

  const handleButtonClick = useCallback(
    async (nextStepId: string | null, buttonLabel?: string) => {
      const supabase = createClient()
      
      if (buttonLabel && buttonLabel.toUpperCase().includes("FINALIZAR")) {
        if (currentProductId) {
          const firstStep = await getFirstScriptStep(currentProductId)
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
        const { data: nextStepData } = await supabase
          .from("scripts")
          .select("*")
          .eq("id", nextStepId)
          .single()

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

  const handleGoBack = useCallback(async () => {
    if (stepHistory.length > 1 && currentProductId) {
      const newHistory = [...stepHistory]
      newHistory.pop()
      
      const previousStepId = newHistory[newHistory.length - 1]
      const supabase = createClient()
      
      const { data: previousStepData } = await supabase
        .from("scripts")
        .select("*")
        .eq("id", previousStepId)
        .single()

      if (previousStepData) {
        const previousStep = mapScriptRowToStep(previousStepData)
        setCurrentStep(previousStep)
        setStepHistory(newHistory)
        setSearchQuery("")
      }
    }
  }, [currentProductId, stepHistory])

  const handleProductSelect = useCallback(async (productId: string) => {
    const supabase = createClient()
    const { data: product } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single()

    if (product) {
      setCurrentProductId(product.id)
      setCurrentProductName(product.name)
      setCurrentProductCategory(product.category)
      
      const firstStep = await getFirstScriptStep(product.id)

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
