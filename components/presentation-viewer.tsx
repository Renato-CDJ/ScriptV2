"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { markPresentationAsSeen, getPresentationProgressByOperator } from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import type { Presentation } from "@/lib/types"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, CheckCircle2, X, Maximize2, Minimize2 } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface PresentationViewerProps {
  presentation: Presentation
  isOpen: boolean
  onClose: () => void
}

export function PresentationViewer({ presentation, isOpen, onClose }: PresentationViewerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [markedAsSeen, setMarkedAsSeen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      // Check if already marked as seen
      const progress = getPresentationProgressByOperator(user.id)
      const isMarked = progress.some((p) => p.presentationId === presentation.id && p.marked_as_seen)
      setMarkedAsSeen(isMarked)
    }
  }, [isOpen, user, presentation.id])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isFullscreen) return
      
      if (event.key === "ArrowRight") {
        if (currentSlideIndex < presentation.slides.length - 1) {
          setCurrentSlideIndex(currentSlideIndex + 1)
        }
      } else if (event.key === "ArrowLeft") {
        if (currentSlideIndex > 0) {
          setCurrentSlideIndex(currentSlideIndex - 1)
        }
      } else if (event.key === "Escape") {
        handleToggleFullscreen()
      }
    }

    if (isFullscreen) {
      document.addEventListener("keydown", handleKeyPress)
      return () => {
        document.removeEventListener("keydown", handleKeyPress)
      }
    }
  }, [isFullscreen, currentSlideIndex, presentation.slides.length])

  const currentSlide = presentation.slides[currentSlideIndex]
  const hasNextSlide = currentSlideIndex < presentation.slides.length - 1
  const hasPrevSlide = currentSlideIndex > 0

  const handleNextSlide = () => {
    if (hasNextSlide) {
      setCurrentSlideIndex(currentSlideIndex + 1)
    }
  }

  const handlePrevSlide = () => {
    if (hasPrevSlide) {
      setCurrentSlideIndex(currentSlideIndex - 1)
    }
  }

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 10, 200))
  }

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 10, 50))
  }

  const handleToggleFullscreen = () => {
    if (!isFullscreen) {
      // Enter fullscreen
      const element = document.getElementById("presentation-viewer-container")
      if (element) {
        if (element.requestFullscreen) {
          element.requestFullscreen().catch((err) => {
            console.error("Error attempting to enable fullscreen:", err)
          })
        }
      }
    } else {
      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.error("Error attempting to exit fullscreen:", err)
        })
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  const handleMarkAsSeen = () => {
    if (user && !markedAsSeen) {
      markPresentationAsSeen(presentation.id, user.id, user.fullName)
      setMarkedAsSeen(true)
      toast({
        title: "Treinamento marcado como visto",
        description: "O treinamento foi registrado como concluído.",
      })
    }
  }

  if (!currentSlide) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`${isFullscreen ? "fixed inset-0 max-w-none rounded-none p-0" : "max-w-[98vw] sm:max-w-[96vw] md:max-w-[94vw] lg:max-w-[92vw] h-[95vh] rounded-lg p-0"} gap-0 flex flex-col`}
        id="presentation-viewer-container"
        style={isFullscreen ? { position: 'fixed', inset: '0px', width: '100vw', height: '100vh', margin: 0, maxWidth: 'none' } : {}}
      >
        <DialogHeader className="border-b px-6 py-4 flex-shrink-0 bg-background">
          <div className="flex items-center justify-between gap-4 w-full">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-bold">{presentation.title}</DialogTitle>
              {presentation.description && (
                <p className="text-sm text-muted-foreground mt-1">{presentation.description}</p>
              )}
            </div>
            {isFullscreen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                title="Fechar"
                className="flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
            {isFullscreen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleFullscreen}
                title="Sair da tela cheia"
                className="flex-shrink-0"
              >
                <Minimize2 className="h-5 w-5" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className={`flex-1 flex flex-col overflow-hidden ${isFullscreen ? "" : ""}`}>
          <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-gradient-to-br from-background to-muted/20 relative">
            <div className={`border-2 border-border rounded-xl bg-background shadow-lg p-8 flex items-center justify-center ${isFullscreen ? "max-w-full max-h-full" : "w-full h-full max-w-5xl"}`}>
              {currentSlide.imageUrl ? (
                <div className="flex items-center justify-center w-full h-full">
                  <img
                    src={currentSlide.imageUrl || "/placeholder.svg"}
                    alt={`Slide ${currentSlideIndex + 1}`}
                    className="max-w-full max-h-full w-auto h-auto rounded-lg object-contain"
                    style={{ zoom: zoom / 100 }}
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <p className="text-lg">Nenhuma imagem carregada para este slide</p>
                </div>
              )}
            </div>
            {isFullscreen && (
              <>
                <Button
                  variant="default"
                  size="lg"
                  onClick={handlePrevSlide}
                  disabled={!hasPrevSlide}
                  title="Slide anterior (← ou clique)"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleNextSlide}
                  disabled={!hasNextSlide}
                  title="Próximo slide (→ ou clique)"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>

          <div className="border-t px-6 py-4 flex-shrink-0 bg-background space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleFullscreen}
                  title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                  className="hover:bg-muted"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  title="Diminuir zoom"
                  className="gap-2"
                >
                  <ZoomOut className="h-5 w-5" />
                  <span className="hidden sm:inline text-xs">Zoom</span>
                </Button>
                <span className="text-sm font-semibold w-16 text-center px-3 py-1 bg-muted rounded">
                  {zoom}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                  title="Aumentar zoom"
                  className="gap-2"
                >
                  <ZoomIn className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {currentSlideIndex + 1} de {presentation.slides.length}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevSlide}
                  disabled={!hasPrevSlide}
                  title="Slide anterior"
                  className="gap-2"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span className="hidden sm:inline text-xs">Anterior</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextSlide}
                  disabled={!hasNextSlide}
                  title="Próximo slide"
                  className="gap-2"
                >
                  <span className="hidden sm:inline text-xs">Próximo</span>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {currentSlideIndex === presentation.slides.length - 1 && (
            <div className="border-t px-6 py-4 flex-shrink-0 bg-muted/30 flex justify-center gap-3 items-center flex-wrap">
              <Button
                onClick={handleMarkAsSeen}
                disabled={markedAsSeen}
                className={`${markedAsSeen ? "bg-green-600 hover:bg-green-700" : ""} gap-2 px-6`}
              >
                <CheckCircle2 className="h-5 w-5" />
                {markedAsSeen ? "Treinamento Concluído" : "Marcar como Visto"}
              </Button>
              {markedAsSeen && (
                <Badge variant="default" className="text-xs">
                  Concluído em {new Date().toLocaleDateString("pt-BR")}
                </Badge>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
