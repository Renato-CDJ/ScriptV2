"use client"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { markPPTFileAsRead } from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, CheckCircle2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PPTSlideViewerProps {
  filename: string
  displayName: string
  isOpen: boolean
  onClose: () => void
  alreadyRead?: boolean
}

export function PPTSlideViewer({ filename, displayName, isOpen, onClose, alreadyRead = false }: PPTSlideViewerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [slides, setSlides] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [markedAsRead, setMarkedAsRead] = useState(alreadyRead)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const loadSlides = useCallback(async () => {
    setLoading(true)
    const slidesList: string[] = []

    console.log("[v0] Loading slides from folder:", filename)
    console.log("[v0] Full path will be: /presentations/slides/" + filename + "/")

    for (let slideNumber = 1; slideNumber <= 200; slideNumber++) {
      const paddedNumber = slideNumber.toString().padStart(3, "0")
      const slidePath = `/presentations/slides/${filename}/slide-${paddedNumber}.png`

      if (slideNumber <= 3) {
        console.log(`[v0] Attempting to load slide ${slideNumber}:`, slidePath)
      }

      const imageExists = await new Promise<boolean>((resolve) => {
        const img = new Image()
        img.onload = () => {
          if (slideNumber <= 3) {
            console.log(`[v0] Successfully loaded:`, slidePath)
          }
          resolve(true)
        }
        img.onerror = () => {
          if (slideNumber <= 3) {
            console.log(`[v0] Failed to load:`, slidePath)
          }
          resolve(false)
        }
        img.src = slidePath
      })

      if (imageExists) {
        slidesList.push(slidePath)
      } else {
        break
      }
    }

    console.log("[v0] Loaded slides:", slidesList.length)
    setSlides(slidesList)
    setLoading(false)
  }, [filename])

  useEffect(() => {
    if (isOpen) {
      setCurrentSlideIndex(0)
      setMarkedAsRead(alreadyRead)
      loadSlides()
    }
  }, [isOpen, alreadyRead, loadSlides])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isOpen) return

      if (event.key === "ArrowRight") {
        handleNextSlide()
      } else if (event.key === "ArrowLeft") {
        handlePrevSlide()
      } else if (event.key === "f" || event.key === "F") {
        setIsFullscreen(!isFullscreen)
      } else if (event.key === "Escape" && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    document.addEventListener("keydown", handleKeyPress)
    return () => document.removeEventListener("keydown", handleKeyPress)
  }, [isOpen, currentSlideIndex, slides.length, isFullscreen])

  const handleNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1)
    }
  }

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1)
    }
  }

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleMarkAsRead = () => {
    if (user && !markedAsRead) {
      markPPTFileAsRead(filename, user.id, user.fullName)
      setMarkedAsRead(true)
      toast({
        title: "Marcado como Lido",
        description: "A apresentação foi registrada como concluída.",
      })
    }
  }

  const hasNextSlide = currentSlideIndex < slides.length - 1
  const hasPrevSlide = currentSlideIndex > 0
  const isLastSlide = currentSlideIndex === slides.length - 1

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] h-[95vh] flex items-center justify-center">
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Carregando Apresentação</DialogTitle>
              <DialogDescription>Por favor, aguarde enquanto a apresentação é carregada.</DialogDescription>
            </VisuallyHidden>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <p className="text-muted-foreground">Carregando apresentação...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (slides.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] h-[95vh] flex items-center justify-center">
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Slides Não Encontrados</DialogTitle>
              <DialogDescription>Os slides para esta apresentação não foram encontrados.</DialogDescription>
            </VisuallyHidden>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-lg font-semibold">Slides não encontrados</p>
            <p className="text-muted-foreground">
              Os slides para esta apresentação não estão disponíveis em{" "}
              <code className="bg-muted px-2 py-1 rounded">/presentations/slides/{filename}/</code>
            </p>
            <p className="text-sm text-muted-foreground">
              Certifique-se de que os arquivos estão nomeados como: slide-001.png, slide-002.png, etc.
            </p>
            <Button onClick={onClose} className="mt-4 bg-orange-500 hover:bg-orange-600">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black z-[9999] flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4 relative">
          <img
            src={slides[currentSlideIndex] || "/placeholder.svg"}
            alt={`Slide ${currentSlideIndex + 1}`}
            className="max-w-full max-h-full w-auto h-auto object-contain"
          />

          <Button
            variant="ghost"
            size="lg"
            onClick={handlePrevSlide}
            disabled={!hasPrevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white h-16 w-16 rounded-full disabled:opacity-30"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={handleNextSlide}
            disabled={!hasNextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white h-16 w-16 rounded-full disabled:opacity-30"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </div>

        <div className="bg-black/90 border-t border-white/10 p-4 flex items-center justify-between gap-4">
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            Slide {currentSlideIndex + 1} de {slides.length}
          </Badge>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevSlide}
              disabled={!hasPrevSlide}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextSlide}
              disabled={!hasNextSlide}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30"
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleFullscreen}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30"
            >
              <Minimize2 className="h-4 w-4 mr-1" />
              Sair
            </Button>
            {isLastSlide && (
              <Button
                onClick={handleMarkAsRead}
                disabled={markedAsRead}
                size="sm"
                className={`gap-2 ${markedAsRead ? "bg-green-600 hover:bg-green-700" : "bg-orange-500 hover:bg-orange-600"}`}
              >
                <CheckCircle2 className="h-4 w-4" />
                {markedAsRead ? "Lido" : "Marcar como Lido"}
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] p-0 flex flex-col">
        <DialogHeader className="border-b px-6 py-4 flex-shrink-0">
          <DialogTitle className="text-2xl">{displayName}</DialogTitle>
          <DialogDescription>Navegue pelos slides usando os botões ou as teclas de seta</DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex items-center justify-center bg-muted/20 p-8 overflow-hidden">
          <img
            src={slides[currentSlideIndex] || "/placeholder.svg"}
            alt={`Slide ${currentSlideIndex + 1}`}
            className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl"
          />
        </div>

        <div className="border-t px-6 py-4 flex-shrink-0 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Badge variant="secondary" className="text-sm">
              Slide {currentSlideIndex + 1} de {slides.length}
            </Badge>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleToggleFullscreen}>
                <Maximize2 className="h-4 w-4 mr-1" />
                Tela Cheia
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrevSlide} disabled={!hasPrevSlide}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextSlide} disabled={!hasNextSlide}>
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          {isLastSlide && (
            <div className="flex justify-center pt-2 border-t">
              <Button
                onClick={handleMarkAsRead}
                disabled={markedAsRead}
                size="lg"
                className={`gap-2 ${markedAsRead ? "bg-green-600 hover:bg-green-700" : "bg-orange-500 hover:bg-orange-600"}`}
              >
                <CheckCircle2 className="h-5 w-5" />
                {markedAsRead ? "Marcado como Lido" : "Marcar como Lido"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
