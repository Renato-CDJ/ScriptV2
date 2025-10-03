"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { OperatorHeader } from "@/components/operator-header"
import { OperatorSidebar } from "@/components/operator-sidebar"
import { ScriptCard } from "@/components/script-card"
import { AttendanceConfig } from "@/components/attendance-config"
import { useAuth } from "@/lib/auth-context"
import { getScriptSteps, getScriptStepById, getProductById } from "@/lib/store"
import type { ScriptStep, AttendanceConfig as AttendanceConfigType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { PanelRightOpen, PanelRightClose } from "lucide-react"
import { useRouter } from "next/navigation"

function OperatorContent() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<ScriptStep | null>(null)
  const [stepHistory, setStepHistory] = useState<string[]>([])
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [showConfig, setShowConfig] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [attendanceConfig, setAttendanceConfig] = useState<AttendanceConfigType | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const checkAutoLogout = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()

      // Check if it's 21:00 (9 PM)
      if (hours === 21 && minutes === 0) {
        logout()
        router.push("/")
      }
    }

    // Check every minute
    const interval = setInterval(checkAutoLogout, 60000)

    // Check immediately on mount
    checkAutoLogout()

    return () => clearInterval(interval)
  }, [logout, router])

  useEffect(() => {
    const handleStoreUpdate = () => {
      console.log("[v0] Store updated, refreshing data")
      if (currentStep) {
        const updatedStep = getScriptStepById(currentStep.id)
        if (updatedStep) {
          setCurrentStep(updatedStep)
          console.log("[v0] Current step refreshed:", updatedStep.id)
        }
      }
    }

    window.addEventListener("store-updated", handleStoreUpdate)
    return () => window.removeEventListener("store-updated", handleStoreUpdate)
  }, [currentStep])

  const handleSearch = (query: string) => {
    setSearchQuery(query)

    if (query.trim() && isSessionActive) {
      const steps = getScriptSteps()
      const foundStep = steps.find((step) => step.title.toLowerCase().includes(query.toLowerCase()))

      if (foundStep) {
        console.log("[v0] Search found step:", foundStep.title)
        setCurrentStep(foundStep)
      }
    }
  }

  const handleStartAttendance = (config: AttendanceConfigType) => {
    setAttendanceConfig(config)

    const product = getProductById(config.product)
    console.log("[v0] Starting attendance with product:", product)

    if (product) {
      const steps = getScriptSteps()
      console.log("[v0] Loaded", steps.length, "steps for product", product.name)

      const firstStep = getScriptStepById(product.scriptId)
      console.log("[v0] First step:", firstStep)

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
  }

  const handleButtonClick = (nextStepId: string | null) => {
    if (nextStepId) {
      const nextStep = getScriptStepById(nextStepId)
      if (nextStep) {
        if (currentStep) {
          setStepHistory((prev) => [...prev, nextStep.id])
        }
        setCurrentStep(nextStep)
        setSearchQuery("")
      }
    } else {
      // End session
      setIsSessionActive(false)
      setCurrentStep(null)
      setShowConfig(true)
      setAttendanceConfig(null)
      setSearchQuery("")
      setStepHistory([])
    }
  }

  const handleGoBack = () => {
    if (stepHistory.length > 1) {
      // Remove current step from history
      const newHistory = [...stepHistory]
      newHistory.pop()
      setStepHistory(newHistory)

      // Get previous step
      const previousStepId = newHistory[newHistory.length - 1]
      const previousStep = getScriptStepById(previousStepId)

      if (previousStep) {
        setCurrentStep(previousStep)
        setSearchQuery("")
      }
    }
  }

  if (!user) return null

  const operatorFirstName = user.fullName.split(" ")[0]

  return (
    <div className="flex flex-col h-screen bg-background">
      <OperatorHeader searchQuery={searchQuery} onSearchChange={handleSearch} />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-8">
            {showConfig && !isSessionActive ? (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-bold">Bem-vindo, {user.fullName}</h1>
                  <p className="text-muted-foreground text-lg">
                    Configure as opções abaixo para iniciar um novo atendimento
                  </p>
                </div>
                <AttendanceConfig onStart={handleStartAttendance} />
              </div>
            ) : currentStep ? (
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-end mb-4">
                  <Button variant="outline" size="sm" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    {isSidebarOpen ? (
                      <>
                        <PanelRightClose className="h-4 w-4 mr-2" />
                        Ocultar Painel
                      </>
                    ) : (
                      <>
                        <PanelRightOpen className="h-4 w-4 mr-2" />
                        Mostrar Painel
                      </>
                    )}
                  </Button>
                </div>
                <ScriptCard
                  step={currentStep}
                  onButtonClick={handleButtonClick}
                  onGoBack={handleGoBack}
                  canGoBack={stepHistory.length > 1}
                  operatorName={operatorFirstName}
                  customerFirstName="Maria"
                  searchQuery={searchQuery}
                />
              </div>
            ) : null}
          </div>
        </main>

        {isSessionActive && <OperatorSidebar isOpen={isSidebarOpen} />}
      </div>
    </div>
  )
}

export default function OperatorPage() {
  return (
    <ProtectedRoute allowedRoles={["operator"]}>
      <OperatorContent />
    </ProtectedRoute>
  )
}
