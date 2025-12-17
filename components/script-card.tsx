"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { CheckCircle2, AlertCircle, ArrowLeft, AlertTriangle, Search, X } from "lucide-react"
import type { ScriptStep, ContentSegment } from "@/lib/types"
import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

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
  onSearchStep?: (stepId: string) => void
  allSteps?: ScriptStep[]
}

function loadAccessibilitySettings(): { textSize: number; buttonSize: number } {
  if (typeof window === "undefined") return { textSize: 100, buttonSize: 80 }

  try {
    const saved = localStorage.getItem("callcenter_accessibility_settings")
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
    localStorage.setItem("callcenter_accessibility_settings", JSON.stringify({ textSize, buttonSize }))
  } catch (error) {
    console.error("[v0] Error saving accessibility settings:", error)
  }
}

const calculateFontSize = (baseSize: number, scale: number) => baseSize + (scale / 100) * baseSize
const calculatePadding = (basePadding: number, scale: number) => basePadding + (scale / 100) * basePadding

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
  onSearchStep,
  allSteps = [],
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
  const [showAlertBalloon, setShowAlertBalloon] = useState(false)
  const [searchText, setSearchText] = useState("")
  const [showSearch, setShowSearch] = useState(false)

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
      if (event.key === "Escape" && canGoBack && onGoBack) {
        onGoBack()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [canGoBack, onGoBack])

  useEffect(() => {
    if (!hasAlert) {
      setShowAlertBalloon(false)
      return
    }

    setShowAlertBalloon(true)
    const timer = setTimeout(() => {
      setShowAlertBalloon(false)
    }, 10000)

    return () => clearTimeout(timer)
  }, [hasAlert, step.id]) // Reset when step changes

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

  const textFontSize = useMemo(() => calculateFontSize(16, textSize[0]), [textSize])
  const navButtonFontSize = useMemo(() => calculateFontSize(14, buttonSize[0]), [buttonSize])
  const navButtonPadding = useMemo(() => calculatePadding(12, buttonSize[0]), [buttonSize])
  const buttonFontSize = useMemo(() => calculateFontSize(12, buttonSize[0]), [buttonSize])
  const buttonPadding = useMemo(() => calculatePadding(12, buttonSize[0]), [buttonSize])

  const handleTabulationOpen = useCallback(() => setShowTabulation(true), [])
  const handleTabulationClose = useCallback(() => setShowTabulation(false), [])
  const handleAlertOpen = useCallback(() => setShowAlert(true), [])
  const handleAlertClose = useCallback(() => setShowAlert(false), [])
  const handleSearchOpen = useCallback(() => {
    setShowSearch(true)
    setSearchText("")
  }, [])
  const handleSearchClose = useCallback(() => {
    setShowSearch(false)
    setSearchText("")
  }, [])

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchText(value)
      if (value.trim() && allSteps.length > 0) {
        const result = allSteps.find(
          (s) =>
            s.title.toLowerCase().includes(value.toLowerCase()) ||
            s.content.toLowerCase().includes(value.toLowerCase()),
        )
        if (result && onSearchStep) {
          onSearchStep(result.id)
        }
      }
    },
    [allSteps, onSearchStep],
  )

  const handleBalloonClose = useCallback(() => setShowAlertBalloon(false), [])

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

      {productName && (
        <div className="flex items-center justify-center py-2 px-2 md:px-4 border-t border-border/30">
          <span className="inline-flex items-center px-4 py-1.5 bg-primary/10 text-primary rounded-md text-xs font-semibold border border-primary/20">
            {productName}
          </span>
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

      {hasAlert && showAlertBalloon && (
        <div className="fixed top-[140px] left-8 z-[9999] w-[90%] max-w-md animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="relative bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/90 dark:to-amber-900/90 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-amber-300 dark:border-amber-700 p-4">
            {/* Close button */}
            <button
              onClick={handleBalloonClose}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
              aria-label="Fechar alerta"
            >
              <X className="h-4 w-4 text-amber-700 dark:text-amber-300" />
            </button>

            {/* Alert icon and title */}
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-amber-500 dark:bg-amber-600 animate-pulse">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-amber-900 dark:text-amber-100 text-sm">{alertTitle}</h3>
            </div>

            {/* Alert message */}
            <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed whitespace-pre-wrap">
              {step.alert?.message}
            </p>

            {/* Balloon arrow pointing down */}
            <div className="absolute -bottom-3 left-12 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-amber-300 dark:border-t-amber-700"></div>
            <div className="absolute -bottom-[10px] left-12 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-amber-100 dark:border-t-amber-900/90"></div>
          </div>
        </div>
      )}

      <Card className="relative shadow-2xl border-2 border-orange-200/80 dark:border-orange-500/60 w-full overflow-hidden backdrop-blur-sm">
        <Popover open={showSearch} onOpenChange={setShowSearch}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSearchOpen}
              className="absolute top-4 left-4 z-20 h-11 w-11 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm hover:from-blue-500/30 hover:to-cyan-500/30 border-2 border-blue-500/50 shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-110 animate-pulse-subtle"
              title="Buscar tela do roteiro"
            >
              <Search className="h-5 w-5 text-blue-500 dark:text-cyan-400 animate-color-pulse" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start" side="bottom">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-semibold text-sm">Buscar Tela</h4>
              </div>
              <Input
                placeholder="Digite título ou conteúdo..."
                value={searchText}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">A tela será exibida conforme você digita</p>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTabulation(true)}
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
          >
            {typeof renderedContent === "string" ? (
              <div dangerouslySetInnerHTML={{ __html: renderedContent }} />
            ) : (
              renderedContent
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center items-center pt-6 px-2">
        <div className="flex flex-wrap justify-center gap-4 md:gap-5 w-full max-w-3xl">{renderedButtons}</div>
      </div>

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
                  className="group relative rounded-xl border-2 border-slate-600 dark:border-slate-600 bg-white dark:bg-slate-700 p-5 md:p-10 leading-relaxed min-h-[280px] md:min-h-[320px] border-2 border-orange-200/60 dark:border-orange-500/40 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.01] overflow-hidden"
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
              onClick={() => setShowTabulation(false)}
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
