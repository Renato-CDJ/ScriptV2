"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { markPresentationAsSeen, getPresentationProgressByOperator } from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import type { Presentation } from "@/lib/types"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, CheckCircle2, X } from "lucide-react"
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

  useEffect(() => {
    if (isOpen && user) {
      // Check if already marked as seen
      const progress = getPresentationProgressByOperator(user.id)
      const isMarked = progress.some((p) => p.presentationId === presentation.id && p.marked_as_seen)
      setMarkedAsSeen(isMarked)
    }
  }, [isOpen, user, presentation.id])

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
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] h-[90vh] rounded-lg p-0 gap-0">
        <DialogHeader className="border-b px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-4 w-full">
            <div className="flex-1">
              <DialogTitle className="text-xl">{presentation.title}</DialogTitle>
              {presentation.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{presentation.description}</p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            <div className="border rounded-lg bg-muted/30 p-6 flex items-center justify-center w-full h-full">
              {currentSlide.imageUrl ? (
                <div className="flex flex-col items-center gap-3 w-full h-full justify-center">
                  <img
                    src={currentSlide.imageUrl || "/placeholder.svg"}
                    alt={`Slide ${currentSlideIndex + 1}`}
                    style={{ maxWidth: `${zoom}%`, height: "auto" }}
                    className="max-w-full max-h-[calc(90vh-200px)] rounded-lg object-contain"
                  />
                  {(currentSlide.title || currentSlide.description) && (
                    <div className="text-center space-y-1">
                      {currentSlide.title && <h3 className="font-semibold text-base">{currentSlide.title}</h3>}
                      {currentSlide.description && (
                        <p className="text-xs text-muted-foreground">{currentSlide.description}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>Nenhuma imagem carregada para este slide</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t px-6 py-3 flex-shrink-0 bg-background">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 50} title="Diminuir zoom">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
                <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 200} title="Aumentar zoom">
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline">
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
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextSlide}
                  disabled={!hasNextSlide}
                  title="Próximo slide"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {currentSlideIndex === presentation.slides.length - 1 && (
            <div className="border-t px-6 py-3 flex-shrink-0 bg-background flex justify-center gap-2 items-center">
              <Button
                onClick={handleMarkAsSeen}
                disabled={markedAsSeen}
                className={markedAsSeen ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {markedAsSeen ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Treinamento Concluído
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marcar como Visto
                  </>
                )}
              </Button>
              {markedAsSeen && (
                <Badge variant="default" className="ml-2">
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
