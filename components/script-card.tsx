"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  AlertTriangle,
  Badge,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import type { ScriptStep, ContentSegment } from "@/lib/types"
import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ScriptCardProps {
  step: ScriptStep
  onButtonClick: (nextStepId: string | null, buttonLabel?: string) => void
  onGoBack?: () => void
  canGoBack?: boolean
  operatorName: string
  customerFirstName?: string
  searchQuery?: string
  showControls?: boolean
  productName?: string
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

const renderContentWithSegments = memo(function renderContentWithSegments(
  content: string,
  segments: ContentSegment[] | undefined,
  textFontSize: number,
  operatorName: string,
  customerFirstName: string,
): React.ReactNode {
  const safeContent = content || ""

  if (!segments || segments.length === 0) {
    return safeContent
      .replace(/\[Nome do operador\]/gi, `<strong>${operatorName}</strong>`)
      .replace(/\[Primeiro nome do cliente\]/gi, `<strong>${customerFirstName}</strong>`)
      .replace(/$$Primeiro nome do cliente$$/gi, `<strong>${customerFirstName}</strong>`)
      .replace(/$$nome completo do cliente$$/gi, `<strong>${customerFirstName}</strong>`)
      .replace(/\[CPF do cliente\]/gi, "<strong>***.***.***-**</strong>")
      .replace(/\n/g, "<br>")
  }

  const textToElements = (text: string, keyPrefix: string): React.ReactNode[] => {
    const lines = text.split("\n")
    const elements: React.ReactNode[] = []

    lines.forEach((line, lineIdx) => {
      if (lineIdx > 0) {
        elements.push(<br key={`${keyPrefix}-br-${lineIdx}`} />)
      }
      if (line) {
        elements.push(<span key={`${keyPrefix}-line-${lineIdx}`}>{line}</span>)
      }
    })

    return elements
  }

  const segmentMap = new Map<string, ContentSegment>()
  segments.forEach((seg) => {
    segmentMap.set(seg.text, seg)
  })

  let lastIndex = 0
  const elements: React.ReactNode[] = []

  segments.forEach((segment, idx) => {
    const index = safeContent.indexOf(segment.text, lastIndex)
    if (index !== -1) {
      if (index > lastIndex) {
        const textBefore = safeContent.substring(lastIndex, index)
        elements.push(...textToElements(textBefore, `text-${idx}`))
      }

      const segmentStyle: React.CSSProperties = {
        fontWeight: segment.formatting.bold ? "bold" : "normal",
        fontStyle: segment.formatting.italic ? "italic" : "normal",
        color: segment.formatting.color || "inherit",
        backgroundColor: segment.formatting.backgroundColor || "transparent",
        fontSize:
          segment.formatting.fontSize === "sm"
            ? `${textFontSize * 0.875}px`
            : segment.formatting.fontSize === "lg"
              ? `${textFontSize * 1.125}px`
              : segment.formatting.fontSize === "xl"
                ? `${textFontSize * 1.25}px`
                : `${textFontSize}px`,
        padding: segment.formatting.backgroundColor ? "2px 4px" : "0",
        borderRadius: segment.formatting.backgroundColor ? "4px" : "0",
      }

      const segmentLines = segment.text.split("\n")
      const segmentElements: React.ReactNode[] = []

      segmentLines.forEach((line, lineIdx) => {
        if (lineIdx > 0) {
          segmentElements.push(<br key={`segment-${idx}-br-${lineIdx}`} />)
        }
        if (line) {
          segmentElements.push(
            <span key={`segment-${idx}-line-${lineIdx}`} style={segmentStyle}>
              {line}
            </span>,
          )
        }
      })

      elements.push(...segmentElements)

      lastIndex = index + segment.text.length
    }
  })

  if (lastIndex < safeContent.length) {
    const remainingText = safeContent.substring(lastIndex)
    elements.push(...textToElements(remainingText, "text-end"))
  }

  return elements
})

export const ScriptCard = memo(function ScriptCard({
  step,
  onButtonClick,
  onGoBack,
  canGoBack = false,
  operatorName,
  customerFirstName = "Cliente",
  searchQuery = "",
  showControls = true,
  productName = "",
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
  const [showAlert, setShowAlert] = useState(false)
  const [pptPage, setPptPage] = useState(1)
  const [pptZoom, setPptZoom] = useState(100)
  const [isPptFullscreen, setIsPptFullscreen] = useState(false)
  const isPptStep = Boolean(step.pptUrl)

  const hasTabulations = step.tabulations && step.tabulations.length > 0
  const hasAlert = step.alert && step.alert.message
  const alertTitle = step.alert?.title || "Alerta Importante"

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
      if (isPptFullscreen && event.key === "Escape") {
        setIsPptFullscreen(false)
        return
      }
      if (event.key === "Escape" && canGoBack && onGoBack) {
        onGoBack()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [canGoBack, onGoBack, isPptFullscreen])

  const processedContent = useMemo(() => {
    const safeContent = step.content || ""
    return safeContent
      .replace(/\[Nome do operador\]/gi, `<strong>${operatorName}</strong>`)
      .replace(/\[Primeiro nome do cliente\]/gi, `<strong>${customerFirstName}</strong>`)
      .replace(/$$Primeiro nome do cliente$$/gi, `<strong>${customerFirstName}</strong>`)
      .replace(/$$nome completo do cliente$$/gi, `<strong>${customerFirstName}</strong>`)
      .replace(/\[CPF do cliente\]/gi, "<strong>***.***.***-**</strong>")
      .replace(/\n/g, "<br>")
  }, [step.content, operatorName, customerFirstName])

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
  const handleAlertOpen = useCallback(() => setShowAlert(true), [])
  const handleAlertClose = useCallback(() => setShowAlert(false), [])
  const handlePptZoomIn = useCallback(() => {
    setPptZoom((prev) => Math.min(prev + 10, 200))
  }, [])
  const handlePptZoomOut = useCallback(() => {
    setPptZoom((prev) => Math.max(prev - 10, 50))
  }, [])
  const handleTogglePptFullscreen = useCallback(() => {
    setIsPptFullscreen((prev) => !prev)
  }, [])

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

  const renderedContent = useMemo(() => {
    if (step.contentSegments && step.contentSegments.length > 0) {
      return renderContentWithSegments(
        step.content,
        step.contentSegments,
        textFontSize,
        operatorName,
        customerFirstName,
      )
    }
    return processedContent
  }, [step.content, step.contentSegments, textFontSize, operatorName, customerFirstName, processedContent])

  const renderedButtons = useMemo(() => {
    return step.buttons
      .sort((a, b) => a.order - b.order)
      .map((button) => {
        const isPrimary = button.primary || button.variant === "primary" || button.variant === "default"

        return (
          <Button
            key={button.id}
            size="lg"
            onClick={() => onButtonClick(button.nextStepId, button.label)}
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
      })
  }, [step.buttons, step.id, navButtonFontSize, navButtonPadding, onButtonClick])

  if (isPptFullscreen && isPptStep && step.pptUrl) {
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center">
        <div className="flex-1 w-full flex items-center justify-center overflow-hidden relative px-2 py-2">
          <div className="relative w-full h-full max-w-full flex items-center justify-center">
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(
                window.location.origin + step.pptUrl,
              )}&embedded=true&rm=minimal`}
              className="w-full h-full border-0 rounded-lg"
              title={step.title}
              allowFullScreen
              style={{
                transform: `scale(${pptZoom / 100})`,
                transformOrigin: "center center",
              }}
            />
          </div>
        </div>

        <div className="w-full border-t border-white/20 px-4 py-3 flex items-center justify-between gap-4 flex-wrap bg-black/50">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePptZoomOut}
              disabled={pptZoom <= 50}
              title="Diminuir zoom"
              className="hover:bg-white/10 text-white border-white/30 h-9 px-2 bg-transparent"
            >
              <ZoomOut className="h-4 w-4" />
              <span className="text-xs ml-1">-</span>
            </Button>
            <span className="text-sm font-semibold w-16 text-center px-2 py-1 bg-white/10 rounded text-white">
              {pptZoom}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePptZoomIn}
              disabled={pptZoom >= 200}
              title="Aumentar zoom"
              className="hover:bg-white/10 text-white border-white/30 h-9 px-2"
            >
              <ZoomIn className="h-4 w-4" />
              <span className="text-xs ml-1">+</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePptFullscreen}
              title="Sair da tela cheia (ESC)"
              className="hover:bg-white/10 text-white border-white/30 h-9 px-2 bg-transparent"
            >
              <Minimize2 className="h-4 w-4" />
              <span className="text-xs ml-1 hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

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

      <Card className="shadow-xl border-2 border-primary/20">
        <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-3">
            {canGoBack && onGoBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onGoBack}
                className="hover:bg-primary/20"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex-1">
              <CardTitle
                className="text-xl md:text-2xl lg:text-3xl font-bold"
                dangerouslySetInnerHTML={{ __html: highlightedTitle }}
              />
              {productName && (
                <Badge variant="secondary" className="mt-2">
                  {productName}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasAlert && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAlertOpen}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 dark:from-amber-400 dark:to-amber-500 dark:hover:from-amber-500 dark:hover:to-amber-600 text-white font-bold border-0 shadow-lg hover:shadow-xl transition-all duration-200 z-10 text-xs md:text-sm animate-pulse"
                >
                  <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 md:mr-2 animate-bounce" />
                  <span className="hidden md:inline">{alertTitle}</span>
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleTabulationOpen}
                className={`bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-white dark:to-gray-100 dark:hover:from-gray-100 dark:hover:to-white text-white dark:text-black font-bold border-0 shadow-lg hover:shadow-xl transition-all duration-200 z-10 text-xs md:text-sm ${
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
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 pb-8 space-y-4">
          {isPptStep && step.pptUrl ? (
            <div className="space-y-4">
              <div
                className="relative w-full bg-muted rounded-lg overflow-hidden border-2 border-border"
                style={{ height: "70vh" }}
              >
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(
                    window.location.origin + step.pptUrl,
                  )}&embedded=true&rm=minimal`}
                  className="w-full h-full border-0"
                  title={step.title}
                  allowFullScreen
                  style={{
                    transform: `scale(${pptZoom / 100})`,
                    transformOrigin: "center center",
                  }}
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-4 bg-muted rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePptZoomOut}
                    disabled={pptZoom <= 50}
                    title="Diminuir zoom"
                  >
                    <ZoomOut className="h-4 w-4" />
                    <span className="text-xs ml-1 hidden sm:inline">-</span>
                  </Button>
                  <span className="text-sm font-semibold w-16 text-center px-2 py-1 bg-background rounded border">
                    {pptZoom}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePptZoomIn}
                    disabled={pptZoom >= 200}
                    title="Aumentar zoom"
                  >
                    <ZoomIn className="h-4 w-4" />
                    <span className="text-xs ml-1 hidden sm:inline">+</span>
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTogglePptFullscreen}
                  title="Modo tela cheia"
                  className="gap-2 bg-transparent"
                >
                  <Maximize2 className="h-4 w-4" />
                  <span className="text-xs hidden sm:inline">Tela Cheia</span>
                </Button>
              </div>

              {step.content && (
                <div
                  className="prose dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed"
                  style={contentStyles}
                >
                  {typeof renderedContent === "string" ? (
                    <div dangerouslySetInnerHTML={{ __html: renderedContent }} />
                  ) : (
                    renderedContent
                  )}
                </div>
              )}
            </div>
          ) : (
            <div
              className="prose dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed"
              style={contentStyles}
            >
              {typeof renderedContent === "string" ? (
                <div dangerouslySetInnerHTML={{ __html: renderedContent }} />
              ) : (
                renderedContent
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center items-center pt-6 px-2">
        <div className="flex flex-wrap justify-center gap-4 md:gap-5 w-full max-w-3xl">{renderedButtons}</div>
      </div>

      <Dialog open={showAlert} onOpenChange={setShowAlert}>
        <DialogContent className="sm:max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto border-2 border-border">
          <DialogHeader className="space-y-3 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 rounded-lg bg-amber-500 dark:bg-amber-600 animate-pulse">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <span className="text-foreground">{alertTitle}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="group relative rounded-xl border-2 border-border bg-muted/50 p-6 shadow-md">
              <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <AlertTriangle className="h-12 w-12 text-amber-500 dark:text-amber-400" />
              </div>
              <div className="relative">
                <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap break-words">
                  {step.alert?.message}
                </p>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-border">
            <Button
              onClick={handleAlertClose}
              className="w-full h-11 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-bold border-0 shadow-lg hover:shadow-xl transition-all duration-200 text-base"
            >
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTabulation} onOpenChange={setShowTabulation}>
        <DialogContent className="sm:max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto border-2 border-orange-200 dark:border-zinc-700">
          <DialogHeader className="space-y-3 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-400 dark:to-orange-300">
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
                  className="group relative rounded-xl border-2 border-slate-600 dark:border-slate-600 bg-white dark:bg-slate-700 p-5 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.01] overflow-hidden"
                >
                  <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <CheckCircle2 className="h-12 w-12 text-orange-500 dark:text-orange-400" />
                  </div>
                  <div className="relative">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-1.5 rounded-lg bg-orange-500 dark:bg-orange-400 flex-shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white leading-tight break-words">
                        {tabulation.name}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-100 leading-relaxed whitespace-pre-wrap pl-9 break-words">
                      {tabulation.description}
                    </p>
                  </div>
                </div>
              ))
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
