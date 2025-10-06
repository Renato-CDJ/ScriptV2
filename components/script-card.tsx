"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react"
import type { ScriptStep } from "@/lib/types"
import { useState, useEffect } from "react"
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

export function ScriptCard({
  step,
  onButtonClick,
  onGoBack,
  canGoBack = false,
  operatorName,
  customerFirstName = "Cliente",
  searchQuery = "",
  showControls = true,
}: ScriptCardProps) {
  const [textSize, setTextSize] = useState([50])
  const [buttonSize, setButtonSize] = useState([50])
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

  const firstName = operatorName.split(" ")[0]

  const processedContent = step.content
    .replace(/\[Nome do operador\]/g, `<strong>${firstName}</strong>`)
    .replace(/\[Primeiro nome do cliente\]/g, `<strong>${customerFirstName}</strong>`)
    .replace(/\[Nome completo do cliente\]/g, `<strong>${customerFirstName} Silva</strong>`)
    .replace(/\[CPF do cliente\]/g, "<strong>***.***.***-**</strong>")

  const highlightedTitle =
    searchQuery && step.title.toLowerCase().includes(searchQuery.toLowerCase())
      ? step.title.replace(
          new RegExp(`(${searchQuery})`, "gi"),
          '<mark class="bg-yellow-300 dark:bg-yellow-600">$1</mark>',
        )
      : step.title

  const textFontSize = 14 + (textSize[0] / 100) * 10
  const buttonFontSize = 14 + (buttonSize[0] / 100) * 6
  const buttonPadding = 14 + (buttonSize[0] / 100) * 10

  return (
    <div className="space-y-4 w-full max-w-7xl mx-auto">
      {showControls && (
        <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 border-2 border-orange-300 dark:border-zinc-700 rounded-xl py-5 px-4 md:px-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 items-center">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <label className="text-sm font-bold text-orange-700 dark:text-white whitespace-nowrap min-w-fit flex items-center gap-2">
                <span className="text-lg">📝</span>
                Texto do Script:
              </label>
              <Slider
                value={textSize}
                onValueChange={setTextSize}
                max={100}
                step={1}
                className="flex-1 w-full [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-orange-500 [&_[role=slider]]:to-amber-500 dark:[&_[role=slider]]:from-white dark:[&_[role=slider]]:to-gray-100 [&_[role=slider]]:border-orange-600 dark:[&_[role=slider]]:border-white [&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:shadow-lg [&_.bg-primary]:bg-gradient-to-r [&_.bg-primary]:from-orange-400 [&_.bg-primary]:to-amber-400 dark:[&_.bg-primary]:from-gray-400 dark:[&_.bg-primary]:to-gray-500"
              />
              <span className="text-xs font-semibold text-orange-600 dark:text-white min-w-[3rem] text-right">
                {textSize[0]}%
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <label className="text-sm font-bold text-orange-700 dark:text-white whitespace-nowrap min-w-fit flex items-center gap-2">
                <span className="text-lg">🔘</span>
                Botões:
              </label>
              <Slider
                value={buttonSize}
                onValueChange={setButtonSize}
                max={100}
                step={1}
                className="flex-1 w-full [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-orange-500 [&_[role=slider]]:to-amber-500 dark:[&_[role=slider]]:from-white dark:[&_[role=slider]]:to-gray-100 [&_[role=slider]]:border-orange-600 dark:[&_[role=slider]]:border-white [&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:shadow-lg [&_.bg-primary]:bg-gradient-to-r [&_.bg-primary]:from-orange-400 [&_.bg-primary]:to-amber-400 dark:[&_.bg-primary]:from-gray-400 dark:[&_.bg-primary]:to-gray-500"
              />
              <span className="text-xs font-semibold text-orange-600 dark:text-white min-w-[3rem] text-right">
                {buttonSize[0]}%
              </span>
            </div>
          </div>
        </div>
      )}

      <Card className="relative shadow-xl border-2 border-orange-200 dark:border-zinc-700 w-full overflow-hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTabulation(true)}
          className={`absolute top-3 right-3 md:top-4 md:right-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-white dark:to-gray-100 dark:hover:from-gray-100 dark:hover:to-white text-white dark:text-black font-bold border-0 shadow-lg transition-all z-10 text-xs md:text-sm ${
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

        {canGoBack && onGoBack && (
          <Button
            variant="outline"
            size="sm"
            onClick={onGoBack}
            className="fixed left-2 md:left-4 top-1/2 -translate-y-1/2 z-50 shadow-xl bg-gradient-to-r from-zinc-700 to-zinc-800 hover:from-zinc-800 hover:to-zinc-900 text-white border-0 h-10 w-10 md:h-12 md:w-12 p-0 rounded-full"
          >
            <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
        )}

        <CardHeader className="pb-4 pt-6 px-4 md:px-6">
          <CardTitle
            className="text-2xl md:text-3xl lg:text-4xl text-center font-bold text-balance leading-tight text-orange-900 dark:text-white"
            dangerouslySetInnerHTML={{ __html: highlightedTitle }}
          />
        </CardHeader>

        <CardContent className="space-y-6 pb-6 px-4 md:px-6">
          <div
            className="bg-gradient-to-br from-orange-50/50 via-amber-50/30 to-orange-50/50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 rounded-2xl p-6 md:p-8 leading-relaxed min-h-[280px] md:min-h-[320px] border-2 border-orange-200 dark:border-zinc-700 shadow-inner text-zinc-800 dark:text-white"
            style={{ fontSize: `${textFontSize}px`, lineHeight: "1.7" }}
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        </CardContent>
      </Card>

      <div className="flex justify-center items-center pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
          {step.buttons
            .sort((a, b) => a.order - b.order)
            .map((button) => {
              const isPrimary = button.primary || button.variant === "primary" || button.variant === "default"

              return (
                <Button
                  key={button.id}
                  size="lg"
                  onClick={() => onButtonClick(button.nextStepId)}
                  className={`w-full font-bold transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl border-0 rounded-xl ${
                    isPrimary
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-white dark:to-gray-100 dark:hover:from-gray-100 dark:hover:to-white text-white dark:text-black"
                      : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-800 dark:hover:to-gray-900 text-white"
                  }`}
                  style={{
                    fontSize: `${buttonFontSize}px`,
                    padding: `${buttonPadding}px ${buttonPadding * 1.2}px`,
                    minHeight: `${buttonPadding * 3}px`,
                  }}
                >
                  {button.label}
                </Button>
              )
            })}
        </div>
      </div>

      <Dialog open={showTabulation} onOpenChange={setShowTabulation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Tabulação Recomendada
            </DialogTitle>
            <DialogDescription>
              Se você encerrar o atendimento nesta tela, utilize a seguinte tabulação:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {step.tabulationInfo ? (
              <div className="rounded-lg border-2 border-green-200 bg-green-50 dark:bg-green-950/30 p-4">
                <h4 className="font-bold text-lg text-green-900 dark:text-green-100 mb-2">
                  {step.tabulationInfo.name}
                </h4>
                <p className="text-sm text-green-800 dark:text-green-200">{step.tabulationInfo.description}</p>
              </div>
            ) : (
              <div className="rounded-lg border-2 border-muted bg-muted/30 p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhuma tabulação específica recomendada para esta tela. Continue o atendimento normalmente.
                </p>
              </div>
            )}
          </div>
          <Button
            onClick={() => setShowTabulation(false)}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-white dark:to-gray-100 dark:hover:from-gray-100 dark:hover:to-white text-white dark:text-black border-0"
          >
            Entendi
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
