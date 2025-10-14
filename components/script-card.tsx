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
  const [textSize, setTextSize] = useState([100])
  const [buttonSize, setButtonSize] = useState([80])
  const [showTabulation, setShowTabulation] = useState(false)
  const [showTabulationPulse, setShowTabulationPulse] = useState(false)

  useEffect(() => {
    if (step.tabulationInfo) {
      setShowTabulationPulse(true)
      const timer = setTimeout(() => setShowTabulationPulse(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [step.id, step.tabulationInfo])

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
                className="flex-1 w-full [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-orange-500 [&_[role=slider]]:to-amber-500 dark:[&_[role=slider]]:from-white dark:[&_[role=slider]]:to-gray-100 [&_[role=slider]]:border-orange-600 dark:[&_[role=slider]]:border-white [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:shadow-md [&_.bg-primary]:bg-gradient-to-r [&_.bg-primary]:from-orange-400 [&_.bg-primary]:to-amber-400 dark:[&_.bg-primary]:from-gray-400 dark:[&_.bg-primary]:to-gray-500"
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
                className="flex-1 w-full [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-orange-500 [&_[role=slider]]:to-amber-500 dark:[&_[role=slider]]:from-white dark:[&_[role=slider]]:to-gray-100 [&_[role=slider]]:border-orange-600 dark:[&_[role=slider]]:border-white [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:shadow-md [&_.bg-primary]:bg-gradient-to-r [&_.bg-primary]:from-orange-400 [&_.bg-primary]:to-amber-400 dark:[&_.bg-primary]:from-gray-400 dark:[&_.bg-primary]:to-gray-500"
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

      <Card className="relative shadow-2xl border-2 border-orange-200/80 dark:border-zinc-700/80 w-full overflow-hidden backdrop-blur-sm">
        <Button
          variant="outline"
          size="sm"
          onClick={handleTabulationOpen}
          className={`absolute top-3 right-3 md:top-4 md:right-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-white dark:to-gray-100 dark:hover:from-gray-100 dark:hover:to-white text-white dark:text-black font-bold border-0 shadow-lg hover:shadow-xl transition-all duration-200 z-10 text-xs md:text-sm ${
            showTabulationPulse ? "animate-bounce" : ""
          }`}
        >
          {step.tabulationInfo ? (
            <AlertCircle className="h-4 w-4 md:h-5 md:w-5 md:mr-2 animate-pulse" />
          ) : (
            <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 md:mr-2" />
          )}
          <span className="hidden md:inline">Verificar Tabulação</span>
          {step.tabulationInfo && showTabulationPulse && (
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
            className="bg-gradient-to-br from-orange-50/60 via-amber-50/40 to-orange-50/60 dark:from-zinc-900/80 dark:via-zinc-900/80 dark:to-zinc-900/80 rounded-2xl p-6 md:p-10 leading-relaxed min-h-[280px] md:min-h-[320px] border-2 border-orange-200/60 dark:border-zinc-700/60 shadow-inner backdrop-blur-sm"
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
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-white dark:to-gray-100 dark:hover:from-gray-100 dark:hover:to-white text-white dark:text-black"
                      : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-800 dark:hover:to-gray-900 text-white"
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
        <DialogContent className="sm:max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Tabulação Recomendada
            </DialogTitle>
            <DialogDescription className="text-sm">
              Se você encerrar o atendimento nesta tela, utilize a seguinte tabulação:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {step.tabulationInfo ? (
              <div className="rounded-xl border-2 border-green-200 bg-green-50 dark:bg-green-950/30 p-5 shadow-sm">
                <h4 className="font-bold text-lg text-green-900 dark:text-green-100 mb-2">
                  {step.tabulationInfo.name}
                </h4>
                <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">
                  {step.tabulationInfo.description}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-muted bg-muted/30 p-5 text-center shadow-sm">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Nenhuma tabulação específica recomendada para esta tela. Continue o atendimento normalmente.
                </p>
              </div>
            )}
          </div>
          <Button
            onClick={handleTabulationClose}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-white dark:to-gray-100 dark:hover:from-gray-100 dark:hover:to-white text-white dark:text-black border-0 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Entendi
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
})
