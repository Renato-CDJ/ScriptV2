"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  CheckCircle2,
  FileText,
  PresentationIcon,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { markFilePresentationAsRead } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"

interface PresentationSlideshowViewerProps {
  isOpen: boolean
  onClose: () => void
  fileName: string
  filePath: string
  isPDF?: boolean
}

export function PresentationSlideshowViewer({
  isOpen,
  onClose,
  fileName,
  filePath,
  isPDF = false,
}: PresentationSlideshowViewerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [slides, setSlides] = useState<string[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false)

  useEffect(() => {
    if (isOpen && !isPDF) {
      loadSlides()
    }
  }, [isOpen, fileName, isPDF])

  const loadSlides = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/presentations/slides?filename=${encodeURIComponent(fileName)}`)
      const data = await response.json()

      if (data.slides && data.slides.length > 0) {
        setSlides(data.slides)
      } else {
        setError("Nenhum slide encontrado")
      }
    } catch (err) {
      console.error("[v0] Error loading slides:", err)
      setError("Erro ao carregar slides")
    } finally {
      setLoading(false)
    }
  }

  const handlePrevSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.max(0, prev - 1))
  }, [])

  const handleNextSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))
  }, [slides.length])

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === "ArrowLeft") handlePrevSlide()
      if (e.key === "ArrowRight") handleNextSlide()
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false)
    },
    [isOpen, handlePrevSlide, handleNextSlide, isFullscreen],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [handleKeyPress])

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleMarkAsRead = () => {
    if (!user) return

    markFilePresentationAsRead(fileName, user.id, user.fullName)
    setHasMarkedAsRead(true)

    toast({
      title: "Marcado como lido",
      description: "Esta apresentação foi marcada como lida com sucesso.",
    })

    setTimeout(() => {
      onClose()
    }, 1500)
  }

  const isLastSlide = currentSlide === slides.length - 1

  if (isPDF) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className={`p-0 gap-0 ${isFullscreen ? "max-w-full w-screen h-screen" : "max-w-7xl w-[95vw] h-[90vh]"}`}
          showCloseButton={false}
        >
          <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-500" />
                <h3 className="font-semibold text-sm line-clamp-1">{fileName}</h3>
                <Badge variant="outline" className="text-xs">
                  PDF
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-8 w-8">
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* PDF Content */}
            <div className="flex-1 flex flex-col items-center justify-center overflow-auto bg-gray-900">
              <iframe src={`${filePath}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full" title={fileName} />
            </div>

            {/* Footer with Mark as Read */}
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
              <p className="text-sm text-muted-foreground">Visualize todo o conteúdo para marcar como lido</p>
              <Button
                onClick={handleMarkAsRead}
                disabled={hasMarkedAsRead}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {hasMarkedAsRead ? "Marcado como Lido" : "Marcar como Lido"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`p-0 gap-0 ${isFullscreen ? "max-w-full w-screen h-screen" : "max-w-7xl w-[95vw] h-[90vh]"}`}
        showCloseButton={false}
      >
        <div className="flex flex-col h-full bg-background">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <PresentationIcon className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold text-sm line-clamp-1">{fileName}</h3>
              <Badge variant="outline" className="text-xs">
                PPT
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {currentSlide + 1} / {slides.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-8 w-8">
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Slide Content */}
          <div className="flex-1 flex items-center justify-center overflow-auto bg-gray-900 relative">
            {loading ? (
              <div className="text-white text-center">
                <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p>Carregando apresentação...</p>
              </div>
            ) : error ? (
              <div className="text-white text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={onClose} variant="outline">
                  Fechar
                </Button>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center p-4">
                <img
                  src={slides[currentSlide] || "/placeholder.svg"}
                  alt={`Slide ${currentSlide + 1}`}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    console.error("[v0] Error loading slide:", slides[currentSlide])
                    e.currentTarget.src = "/placeholder.svg?height=600&width=800"
                  }}
                />

                {/* Navigation Buttons */}
                {currentSlide > 0 && (
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handlePrevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-lg"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                )}
                {currentSlide < slides.length - 1 && (
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleNextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-lg"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevSlide}
                disabled={currentSlide === 0}
                className="gap-2 bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextSlide}
                disabled={currentSlide === slides.length - 1}
                className="gap-2 bg-transparent"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {isLastSlide && (
              <Button
                onClick={handleMarkAsRead}
                disabled={hasMarkedAsRead}
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                {hasMarkedAsRead ? "Marcado como Lido" : "Marcar como Lido"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
