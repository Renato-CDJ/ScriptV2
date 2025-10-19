"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react"
import type { ScriptStep } from "@/lib/types"
import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ScriptCardProps {
  step: ScriptStep
  onButtonClick: (nextStepId: string | null) => void
  onGoBack?: () => void
  canGoBack?: boolean
  operatorName: string
  customerFirstName?: string
  searchQuery?: string
  showControls?: boolean
}

const ACCESSIBILITY_STORAGE_KEY = "callcenter_accessibility_settings"

function loadAccessibilitySettings(): { textSize: number; buttonSize: number } {
  if (typeof window === "undefined") return { textSize: 100, buttonSize: 80 }

  try {
    const saved = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error("[v0] Error loading accessibility settings:", error)
  }

  return { textSize: 100, buttonSize: 80 }
}

function saveAccessibilitySettings(textSize: number, buttonSize: number) {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify({ textSize, buttonSize }))
  } catch (error) {
    console.error("[v0] Error saving accessibility settings:", error)
  }
}

export const ScriptCard = memo(function ScriptCard({
  step,
  onButtonClick,
  onGoBack,
  canGoBack = false,
  operatorName,
  customerFirstName = "Cliente",
  searchQuery = "",
  showControls = true,
}: ScriptCardProps) {
  const [textSize, setTextSize] = useState<number[]>(() => {
    const settings = loadAccessibilitySettings()
    return [settings.textSize]
  })
  const [buttonSize, setButtonSize] = useState<number[]>(() => {
    const settings = loadAccessibilitySettings()
    return [settings.buttonSize]
  })
  const [showTabulation, setShowTabulation] = useState(false)
  const [showTabulationPulse, setShowTabulationPulse] = useState(false)

  const hasTabulations = (step.tabulations && step.tabulations.length > 0) || step.tabulationInfo

  useEffect(() => {
    saveAccessibilitySettings(textSize[0], buttonSize[0])
  }, [textSize, buttonSize])

  useEffect(() => {
    if (hasTabulations) {
      setShowTabulationPulse(true)
      const timer = setTimeout(() => setShowTabulationPulse(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [step.id, hasTabulations])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape" && canGoBack && onGoBack) {
        onGoBack()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [canGoBack, onGoBack])

  const processedContent = useMemo(
    () =>
      step.content
        .replace(/\[Nome do operador\]/gi, `<strong>${operatorName}</strong>`)
        .replace(/\[Primeiro nome do cliente\]/gi, `<strong>${customerFirstName}</strong>`)
        .replace(/$$Primeiro nome do cliente$$/gi, `<strong>${customerFirstName}</strong>`)
        .replace(/$$nome completo do cliente$$/gi, `<strong>${customerFirstName}</strong>`)
        .replace(/\[CPF do cliente\]/gi, "<strong>***.***.***-**</strong>"),
    [step.content, operatorName, customerFirstName],
  )

  const highlightedTitle = useMemo(
    () =>
      searchQuery && step.title.toLowerCase().includes(searchQuery.toLowerCase())
        ? step.title.replace(
            new RegExp(`(${searchQuery})`, "gi"),
            '<mark class="bg-yellow-300 dark:bg-yellow-600">$1</mark>',
          )
        : step.title,
    [searchQuery, step.title],
  )

  const textFontSize = useMemo(() => 16 + (textSize[0] / 100) * 16, [textSize])
  const navButtonFontSize = useMemo(() => 14 + (buttonSize[0] / 100) * 8, [buttonSize])
  const navButtonPadding = useMemo(() => 12 + (buttonSize[0] / 100) * 8, [buttonSize])
  const buttonFontSize = useMemo(() => 12 + (buttonSize[0] / 100) * 8, [buttonSize])
  const buttonPadding = useMemo(() => 12 + (buttonSize[0] / 100) * 8, [buttonSize])

  const handleTabulationOpen = useCallback(() => setShowTabulation(true), [])
  const handleTabulationClose = useCallback(() => setShowTabulation(false), [])

  const contentStyles = useMemo(() => {
    const styles: React.CSSProperties = {
      fontSize: `${textFontSize}px`,
      lineHeight: "1.75",
    }

    if (step.formatting) {
      if (step.formatting.textColor) {
        styles.color = step.formatting.textColor
      }
      if (step.formatting.bold) {
        styles.fontWeight = "bold"
      }
      if (step.formatting.italic) {
        styles.fontStyle = "italic"
      }
      if (step.formatting.textAlign) {
        styles.textAlign = step.formatting.textAlign
      }
    }

    return styles
  }, [textFontSize, step.formatting])

  return (
    <div className="space-y-4 w-full max-w-7xl mx-auto">
      {showControls && (
        <div className="py-3 px-2 md:px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-center max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <label className="text-xs md:text-sm font-semibold text-foreground whitespace-nowrap min-w-fit flex items-center gap-2">
                <span className="text-base md:text-lg">📝</span>
                Texto:
              </label>
              <Slider
                value={textSize}
                onValueChange={setTextSize}
                min={50}
                max={120}
                step={5}
                className="flex-1 w-full [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-orange-500 [&_[role=slider]]:to-amber-500 dark:[&_[role=slider]]:from-orange-500 dark:[&_[role=slider]]:to-orange-600 [&_[role=slider]]:border-orange-600 dark:[&_[role=slider]]:border-orange-500 [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:shadow-md [&_.bg-primary]:bg-gradient-to-r [&_.bg-primary]:from-orange-400 [&_.bg-primary]:to-amber-400 dark:[&_.bg-primary]:from-orange-500 dark:[&_.bg-primary]:to-orange-600"
              />
              <span className="text-xs font-medium text-muted-foreground min-w-[2.5rem] text-right">
                {textSize[0]}%
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <label className="text-xs md:text-sm font-semibold text-foreground whitespace-nowrap min-w-fit flex items-center gap-2">
                <span className="text-base md:text-lg">🔘</span>
                Botões:
              </label>
              <Slider
                value={buttonSize}
                onValueChange={setButtonSize}
                min={50}
                max={150}
                step={5}
                className="flex-1 w-full [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-orange-500 [&_[role=slider]]:to-amber-500 dark:[&_[role=slider]]:from-orange-500 dark:[&_[role=slider]]:to-orange-600 [&_[role=slider]]:border-orange-600 dark:[&_[role=slider]]:border-orange-500 [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:shadow-md [&_.bg-primary]:bg-gradient-to-r [&_.bg-primary]:from-orange-400 [&_.bg-primary]:to-amber-400 dark:[&_.bg-primary]:from-orange-500 dark:[&_.bg-primary]:to-orange-600"
              />
              <span className="text-xs font-medium text-muted-foreground min-w-[2.5rem] text-right">
                {buttonSize[0]}%
              </span>
            </div>
          </div>
        </div>
      )}

      {canGoBack && onGoBack && (
        <Button
          variant="outline"
          size="sm"
          onClick={onGoBack}
          className="fixed left-2 md:left-4 top-1/2 -translate-y-1/2 z-50 shadow-2xl hover:shadow-3xl bg-gradient-to-r from-zinc-700 to-zinc-800 hover:from-zinc-800 hover:to-zinc-900 text-white border-0 h-10 w-10 md:h-12 md:w-12 p-0 rounded-full transition-all duration-200 hover:scale-110"
        >
          <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
      )}

      <Card className="relative shadow-2xl border-2 border-orange-200/80 dark:border-orange-500/60 w-full overflow-hidden backdrop-blur-sm">
        <Button
          variant="outline"
          size="sm"
          onClick={handleTabulationOpen}
          className={`absolute top-3 right-3 md:top-4 md:right-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-white dark:to-gray-100 dark:hover:from-gray-100 dark:hover:to-white text-white dark:text-black font-bold border-0 shadow-lg hover:shadow-xl transition-all duration-200 z-10 text-xs md:text-sm ${
            showTabulationPulse ? "animate-bounce" : ""
          }`}
        >
          {hasTabulations ? (
            <AlertCircle className="h-4 w-4 md:h-5 md:w-5 md:mr-2 animate-pulse" />
          ) : (
            <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 md:mr-2" />
          )}
          <span className="hidden md:inline">Verificar Tabulação</span>
          {hasTabulations && showTabulationPulse && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          )}
        </Button>

        <CardHeader className="pb-5 pt-7 px-4 md:px-8">
          <CardTitle
            className="text-2xl md:text-3xl lg:text-4xl text-center font-bold text-balance leading-tight text-orange-900 dark:text-white drop-shadow-sm"
            dangerouslySetInnerHTML={{ __html: highlightedTitle }}
          />
        </CardHeader>

        <CardContent className="space-y-6 pb-8 px-4 md:px-8">
          <div
            className="bg-gradient-to-br from-orange-50/60 via-amber-50/40 to-orange-50/60 dark:from-gray-600/40 dark:via-gray-600/40 dark:to-gray-600/40 rounded-2xl p-6 md:p-10 leading-relaxed min-h-[280px] md:min-h-[320px] border-2 border-orange-200/60 dark:border-orange-500/40 shadow-inner backdrop-blur-sm"
            style={contentStyles}
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        </CardContent>
      </Card>

      <div className="flex justify-center items-center pt-6 px-2">
        <div className="flex flex-wrap justify-center gap-4 md:gap-5 w-full max-w-3xl">
          {step.buttons
            .sort((a, b) => a.order - b.order)
            .map((button) => {
              const isPrimary = button.primary || button.variant === "primary" || button.variant === "default"

              return (
                <Button
                  key={button.id}
                  size="lg"
                  onClick={() => onButtonClick(button.nextStepId)}
                  className={`font-bold transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-xl hover:shadow-2xl border-0 rounded-xl ${
                    isPrimary
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-orange-500 dark:to-orange-600 dark:hover:from-orange-600 dark:hover:to-orange-700 dark:text-white"
                      : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 dark:from-orange-500 dark:to-orange-600 dark:hover:from-orange-600 dark:hover:to-orange-700 dark:text-white"
                  }`}
                  style={{
                    fontSize: `${navButtonFontSize}px`,
                    padding: `${navButtonPadding}px ${navButtonPadding * 2}px`,
                    minHeight: `${navButtonPadding * 3}px`,
                  }}
                >
                  {button.label}
                </Button>
              )
            })}
        </div>
      </div>

      <Dialog open={showTabulation} onOpenChange={setShowTabulation}>
        <DialogContent className="sm:max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto border-2 border-orange-200 dark:border-zinc-700">
          <DialogHeader className="space-y-3 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-400 dark:to-orange-500">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-orange-600 to-orange-500 dark:from-orange-400 dark:to-orange-300 bg-clip-text text-transparent">
                Tabulação Recomendada
              </span>
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Se você encerrar o atendimento nesta tela, utilize a(s) seguinte(s) tabulação(ões):
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {step.tabulations && step.tabulations.length > 0 ? (
              step.tabulations.map((tabulation, index) => (
                <div
                  key={tabulation.id || index}
                  className="group relative rounded-xl border-2 border-orange-200 dark:border-orange-400/50 bg-gradient-to-br from-orange-50 to-amber-50 dark:bg-card p-5 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.01] overflow-hidden"
                >
                  <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <CheckCircle2 className="h-12 w-12 text-orange-500" />
                  </div>
                  <div className="relative">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-1.5 rounded-lg bg-orange-500 dark:bg-orange-400 flex-shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-bold text-lg text-orange-900 dark:text-orange-100 leading-tight break-words">
                        {tabulation.name}
                      </h4>
                    </div>
                    <p className="text-sm text-orange-800 dark:text-orange-200 leading-relaxed whitespace-pre-wrap pl-9 break-words">
                      {tabulation.description}
                    </p>
                  </div>
                </div>
              ))
            ) : step.tabulationInfo ? (
              <div className="group relative rounded-xl border-2 border-orange-200 dark:border-orange-400/50 bg-gradient-to-br from-orange-50 to-amber-50 dark:bg-card p-5 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.01] overflow-hidden">
                <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <CheckCircle2 className="h-12 w-12 text-orange-500" />
                </div>
                <div className="relative">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-1.5 rounded-lg bg-orange-500 dark:bg-orange-400 flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-bold text-lg text-orange-900 dark:text-orange-100 leading-tight break-words">
                      {step.tabulationInfo.name}
                    </h4>
                  </div>
                  <p className="text-sm text-orange-800 dark:text-orange-200 leading-relaxed whitespace-pre-wrap pl-9 break-words">
                    {step.tabulationInfo.description}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-muted bg-muted/30 p-6 text-center shadow-sm">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-full bg-muted">
                    <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                    Nenhuma tabulação específica recomendada para esta tela. Continue o atendimento normalmente.
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="pt-4 border-t border-border">
            <Button
              onClick={handleTabulationClose}
              className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-orange-500 dark:to-orange-600 dark:hover:from-orange-600 dark:hover:to-orange-700 text-white dark:text-white font-bold border-0 shadow-lg hover:shadow-xl transition-all duration-200 text-base"
            >
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
})
