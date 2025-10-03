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
}

export function ScriptCard({
  step,
  onButtonClick,
  onGoBack,
  canGoBack = false,
  operatorName,
  customerFirstName = "Cliente",
  searchQuery = "",
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

  const textFontSize = 14 + (textSize[0] / 100) * 8
  const buttonFontSize = 13 + (buttonSize[0] / 100) * 5
  const buttonPadding = 12 + (buttonSize[0] / 100) * 8

  return (
    <div className="space-y-4 w-full">
      <div className="bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-950/20 dark:to-pink-950/20 border border-orange-200 dark:border-orange-800 rounded-lg py-3 px-6">
        <div className="grid grid-cols-2 gap-6 items-center">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-orange-600 dark:text-orange-400 whitespace-nowrap">
              Texto do Script:
            </span>
            <Slider
              value={textSize}
              onValueChange={setTextSize}
              max={100}
              step={1}
              className="flex-1 [&_[role=slider]]:bg-orange-500 [&_[role=slider]]:border-orange-600 [&_.bg-primary]:bg-orange-500"
              aria-label="Tamanho do texto do script"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-orange-600 dark:text-orange-400 whitespace-nowrap">
              Botões:
            </span>
            <Slider
              value={buttonSize}
              onValueChange={setButtonSize}
              max={100}
              step={1}
              className="flex-1 [&_[role=slider]]:bg-orange-500 [&_[role=slider]]:border-orange-600 [&_.bg-primary]:bg-orange-500"
              aria-label="Tamanho dos botões"
            />
          </div>
        </div>
      </div>

      <Card className="relative shadow-lg border-2 w-full">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTabulation(true)}
          className={`absolute top-4 right-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-all ${
            showTabulationPulse ? "animate-bounce" : ""
          }`}
        >
          {step.tabulationInfo ? (
            <AlertCircle className="h-5 w-5 mr-2 animate-pulse" />
          ) : (
            <CheckCircle2 className="h-5 w-5 mr-2" />
          )}
          Verificar Tabulação
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
            className="fixed left-4 top-1/2 -translate-y-1/2 z-50 shadow-lg bg-zinc-600 hover:bg-zinc-700 text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        <CardHeader className="pb-3 pt-4">
          <CardTitle
            className="text-3xl text-center font-bold"
            dangerouslySetInnerHTML={{ __html: highlightedTitle }}
          />
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          <div
            className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl p-8 leading-relaxed min-h-[320px] border border-border/50"
            style={{ fontSize: `${textFontSize}px` }}
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full px-2">
        {step.buttons
          .sort((a, b) => a.order - b.order)
          .map((button) => {
            const isPrimary = button.primary || button.variant === "primary" || button.variant === "default"

            return (
              <Button
                key={button.id}
                size="lg"
                onClick={() => onButtonClick(button.nextStepId)}
                className={`min-w-[140px] max-w-[280px] font-semibold transition-all duration-300 hover:scale-105 active:scale-95 ${
                  isPrimary
                    ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-xl"
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}
                style={{
                  fontSize: `${buttonFontSize}px`,
                  padding: `${buttonPadding}px ${buttonPadding * 1.5}px`,
                }}
              >
                {button.label}
              </Button>
            )
          })}
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
          <Button onClick={() => setShowTabulation(false)} className="w-full bg-orange-500 hover:bg-orange-600">
            Entendi
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
