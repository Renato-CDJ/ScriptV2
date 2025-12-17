"use client"

import { useState, useEffect, useCallback, memo } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { OperatorHeader } from "@/components/operator-header"
import { OperatorSidebar } from "@/components/operator-sidebar"
import { ScriptCard } from "@/components/script-card"
import { AttendanceConfig } from "@/components/attendance-config"
import { OperatorChatModal } from "@/components/operator-chat-modal"
import { useAuth } from "@/lib/auth-context"
import { getScriptSteps, getScriptStepById, getProductById } from "@/lib/store"
import type { ScriptStep, AttendanceConfig as AttendanceConfigType } from "@/lib/types"
import { useRouter } from "next/navigation"

const OperatorContent = memo(function OperatorContent() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<ScriptStep | null>(null)
  const [stepHistory, setStepHistory] = useState<string[]>([])
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [showConfig, setShowConfig] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [attendanceConfig, setAttendanceConfig] = useState<AttendanceConfigType | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentProductId, setCurrentProductId] = useState<string | null>(null)
  const [currentProductName, setCurrentProductName] = useState<string>("")
  const [currentProductCategory, setCurrentProductCategory] = useState<
    "habitacional" | "comercial" | "cartao" | "outros" | undefined
  >(undefined)
  const [showChatModal, setShowChatModal] = useState(false) // Declared showChatModal variable

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
    setShowChatModal(false) // Reset showChatModal on back to start
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

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let isUpdating = false

    const handleStoreUpdate = () => {
      if (isUpdating) return // Prevent concurrent updates

      if (currentStep && currentProductId) {
        isUpdating = true
        clearTimeout(timeoutId)

        timeoutId = setTimeout(() => {
          const updatedStep = getScriptStepById(currentStep.id, currentProductId)
          if (updatedStep) {
            setCurrentStep(updatedStep)
          }
          isUpdating = false
        }, 200) // Increased debounce time
      }
    }

    window.addEventListener("store-updated", handleStoreUpdate)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener("store-updated", handleStoreUpdate)
    }
  }, [currentStep, currentProductId])

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)

      if (query.trim() && isSessionActive && currentProductId) {
        const steps = getScriptSteps().filter((s) => s.productId === currentProductId)
        const foundStep = steps.find((step) => step.title.toLowerCase().includes(query.toLowerCase()))

        if (foundStep) {
          setCurrentStep(foundStep)
        }
      }
    },
    [isSessionActive, currentProductId],
  )

  const handleSearchStep = useCallback(
    (stepId: string) => {
      if (currentProductId) {
        const step = getScriptStepById(stepId, currentProductId)
        if (step) {
          setStepHistory((prev) => [...prev, step.id])
          setCurrentStep(step)
          setSearchQuery("")
        }
      }
    },
    [currentProductId],
  )

  const handleStartAttendance = useCallback((config: AttendanceConfigType) => {
    setAttendanceConfig(config)

    const product = getProductById(config.product)

    if (product) {
      setCurrentProductId(product.id)
      setCurrentProductName(product.name)
      setCurrentProductCategory(product.category)
      const firstStep = getScriptStepById(product.scriptId, product.id)

      if (firstStep) {
        setCurrentStep(firstStep)
        setStepHistory([firstStep.id])
        setIsSessionActive(true)
        setShowConfig(false)
      } else {
        alert("Erro: Script não encontrado para este produto. Entre em contato com o administrador.")
      }
    } else {
      alert("Erro: Produto não encontrado. Entre em contato com o administrador.")
    }
  }, [])

  const handleButtonClick = useCallback(
    (nextStepId: string | null, buttonLabel?: string) => {
      if (buttonLabel && buttonLabel.toUpperCase().includes("FINALIZAR")) {
        if (currentProductId) {
          const product = getProductById(currentProductId)
          if (product) {
            const firstStep = getScriptStepById(product.scriptId, product.id)
            if (firstStep) {
              setCurrentStep(firstStep)
              setStepHistory([firstStep.id])
              setSearchQuery("")
              return
            }
          }
        }
        // Fallback to config if product not found
        handleBackToStart()
        return
      }

      if (!currentProductId) {
        alert("Erro: Produto não identificado. Por favor, reinicie o atendimento.")
        handleBackToStart()
        return
      }

      if (nextStepId) {
        const nextStep = getScriptStepById(nextStepId, currentProductId)

        if (nextStep) {
          setStepHistory((prev) => [...prev, nextStep.id])
          setCurrentStep(nextStep)
          setSearchQuery("")
        } else {
          alert(`Próxima tela não encontrada. ID: ${nextStepId}. Por favor, contate o administrador.`)
        }
      } else {
        alert(
          "Fim do roteiro atingido. Clique em 'Voltar ao Início' para iniciar um novo atendimento ou contate o administrador para configurar o próximo passo.",
        )
      }
    },
    [currentProductId, handleBackToStart],
  )

  const handleGoBack = useCallback(() => {
    setStepHistory((prev) => {
      if (prev.length > 1 && currentProductId) {
        const newHistory = [...prev]
        newHistory.pop()

        const previousStepId = newHistory[newHistory.length - 1]
        const previousStep = getScriptStepById(previousStepId, currentProductId)

        if (previousStep) {
          setCurrentStep(previousStep)
          setSearchQuery("")
        }

        return newHistory
      }
      return prev
    })
  }, [currentProductId])

  const handleProductSelect = useCallback((productId: string) => {
    const product = getProductById(productId)

    if (product) {
      setCurrentProductId(product.id)
      setCurrentProductName(product.name)
      setCurrentProductCategory(product.category)
      const firstStep = getScriptStepById(product.scriptId, product.id)

      if (firstStep) {
        setCurrentStep(firstStep)
        setStepHistory([firstStep.id])
        setIsSessionActive(true)
        setShowConfig(false)
        setSearchQuery("")
      }
    }
  }, [])

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
                  allSteps={currentProductId ? getScriptSteps().filter((s) => s.productId === currentProductId) : []}
                />
              </div>
            ) : null}
          </div>
        </main>

        {isSessionActive && <OperatorSidebar isOpen={isSidebarOpen} productCategory={currentProductCategory} />}
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
