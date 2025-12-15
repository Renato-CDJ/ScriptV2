"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Maximize, Minimize, X, Check } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { markPresentationAsSeen } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"

export default function PresentationPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const filename = params.filename as string
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slides, setSlides] = useState<string[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false)

  useEffect(() => {
    const loadSlides = async () => {
      try {
        const folderName = decodeURIComponent(filename).replace(/\.(pptx?|PPTX?)$/, "")
        const detectedSlides: string[] = []

        for (let i = 1; i <= 100; i++) {
          const slideNumber = i.toString().padStart(3, "0")
          const slidePath = `/presentations/slides/${folderName}/slide-${slideNumber}.png`

          try {
            const response = await fetch(slidePath, { method: "HEAD" })
            if (response.ok) {
              detectedSlides.push(slidePath)
            } else {
              break
            }
          } catch {
            break
          }
        }

        setSlides(detectedSlides)
      } catch (error) {
        console.error("Error loading slides:", error)
        setSlides([])
      } finally {
        setIsLoading(false)
      }
    }

    loadSlides()
  }, [filename])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
        case "PageUp":
          setCurrentSlide((prev) => Math.max(0, prev - 1))
          break
        case "ArrowRight":
        case "PageDown":
        case " ":
          e.preventDefault()
          setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))
          break
        case "Home":
          setCurrentSlide(0)
          break
        case "End":
          setCurrentSlide(slides.length - 1)
          break
        case "f":
        case "F":
          toggleFullscreen()
          break
        case "Escape":
          if (document.fullscreenElement) {
            document.exitFullscreen()
            setIsFullscreen(false)
          } else {
            router.back()
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [slides.length, toggleFullscreen, router])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const presentationUrl = `/presentations/${decodeURIComponent(filename)}`
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
    typeof window !== "undefined" ? window.location.origin + presentationUrl : presentationUrl,
  )}&embedded=true`

  const handleMarkAsRead = () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para marcar como lido.",
        variant: "destructive",
      })
      return
    }

    const presentationId = decodeURIComponent(filename).replace(/\.(pptx?|PPTX?)$/, "")

    markPresentationAsSeen(presentationId, user.id, user.fullName)
    setHasMarkedAsRead(true)

    toast({
      title: "Marcado como lido",
      description: "A apresentação foi marcada como lida com sucesso.",
    })
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background z-[9999] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando apresentação...</p>
        </div>
      </div>
    )
  }

  if (slides.length > 0) {
    return (
      <div className="fixed inset-0 bg-black z-[9999] flex flex-col">
        <div className="h-14 bg-black/80 backdrop-blur flex items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-white hover:bg-white/10">
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
            <div className="text-sm font-medium text-white/90 truncate max-w-[300px]">
              {decodeURIComponent(filename).replace(/\.(pptx?|PPTX?)$/, "")}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-white/80">
              Slide {currentSlide + 1} de {slides.length}
            </span>
            <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-white hover:bg-white/10">
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4" style={{ height: "calc(95vh - 3.5rem - 4rem)" }}>
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={slides[currentSlide] || "/placeholder.svg"}
              alt={`Slide ${currentSlide + 1}`}
              fill
              className="object-contain"
              priority={currentSlide < 3}
              sizes="95vw"
            />
          </div>
        </div>

        <div className="h-16 bg-black/80 backdrop-blur flex items-center justify-center gap-4 px-4 border-t border-white/10">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Anterior
          </Button>

          <div className="text-sm font-medium text-white px-4 min-w-[120px] text-center">
            {currentSlide + 1} / {slides.length}
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={() => setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))}
            disabled={currentSlide === slides.length - 1}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Próximo
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>

          {currentSlide === slides.length - 1 && (
            <Button
              variant="default"
              size="lg"
              onClick={handleMarkAsRead}
              disabled={hasMarkedAsRead}
              className="bg-green-600 hover:bg-green-700 text-white ml-4"
            >
              <Check className="h-5 w-5 mr-2" />
              {hasMarkedAsRead ? "Marcado como Lido" : "Marcar como Lido"}
            </Button>
          )}
        </div>

        <div className="absolute bottom-20 right-4 text-xs text-white/60 bg-black/60 backdrop-blur px-3 py-2 rounded-md border border-white/10">
          ← → Navegar • Space Próximo • F Tela cheia • ESC Sair
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-background z-[9999] flex flex-col">
      <div className="h-14 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
          <div className="text-sm font-medium truncate max-w-[300px]">
            {decodeURIComponent(filename).replace(/\.(pptx?|PPTX?)$/, "")}
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex-1 relative overflow-hidden bg-muted/20 flex items-center justify-center p-8">
        <div className="w-full h-full max-w-[95vw] max-h-[90vh]">
          <iframe
            src={googleViewerUrl}
            className="w-full h-full border-0 rounded-lg shadow-2xl bg-white"
            title="Presentation Viewer"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      </div>

      <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
        <Button
          variant="default"
          size="lg"
          onClick={handleMarkAsRead}
          disabled={hasMarkedAsRead}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Check className="h-5 w-5 mr-2" />
          {hasMarkedAsRead ? "Marcado como Lido" : "Marcar como Lido"}
        </Button>
      </div>

      <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background/80 backdrop-blur px-3 py-2 rounded-md border">
        Para navegação por slides individuais, converta o PPT em imagens
      </div>
    </div>
  )
}
