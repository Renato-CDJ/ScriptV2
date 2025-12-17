"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Maximize, Minimize, X, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import { markPPTFileAsRead, getPPTFileProgressByOperator } from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
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
  const [isMarkedAsRead, setIsMarkedAsRead] = useState(false)

  useEffect(() => {
    const loadSlides = async () => {
      try {
        const baseFilename = decodeURIComponent(filename).replace(/\.(pptx?|PPTX?)$/, "")
        const slideUrls: string[] = []

        // Try to load up to 100 slides
        for (let i = 1; i <= 100; i++) {
          const paddedNum = String(i).padStart(3, "0")
          const slideUrl = `/presentations/slides/${baseFilename}/slide-${paddedNum}.png`

          try {
            const response = await fetch(slideUrl, { method: "HEAD" })
            if (response.ok) {
              slideUrls.push(slideUrl)
            } else {
              // Try alternative naming: 001.png, 002.png
              const altUrl = `/presentations/slides/${baseFilename}/${paddedNum}.png`
              const altResponse = await fetch(altUrl, { method: "HEAD" })
              if (altResponse.ok) {
                slideUrls.push(altUrl)
              } else {
                // No more slides found
                break
              }
            }
          } catch {
            break
          }
        }

        if (slideUrls.length > 0) {
          setSlides(slideUrls)
        } else {
          // Fallback: use iframe viewer
          setSlides([])
        }
      } catch (error) {
        console.error("Error loading slides:", error)
        setSlides([])
      } finally {
        setIsLoading(false)
      }
    }

    loadSlides()
  }, [filename])

  useEffect(() => {
    if (user && filename) {
      const progress = getPPTFileProgressByOperator(user.id)
      const decodedFilename = decodeURIComponent(filename)
      const isRead = progress.some((p) => p.filename === decodedFilename)
      setIsMarkedAsRead(isRead)
    }
  }, [user, filename])

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

  const handleMarkAsRead = useCallback(() => {
    if (user && filename && !isMarkedAsRead) {
      const decodedFilename = decodeURIComponent(filename)
      markPPTFileAsRead(decodedFilename, user.id, user.fullName)
      setIsMarkedAsRead(true)
      toast({
        title: "Treinamento marcado como lido",
        description: "O treinamento foi registrado como concluído.",
      })
    }
  }, [user, filename, isMarkedAsRead, toast])

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
        {/* Header - Compact header when not fullscreen */}
        <div
          className={`${
            isFullscreen ? "h-0 opacity-0" : "h-12"
          } bg-black/90 backdrop-blur flex items-center justify-between px-3 border-b border-white/10 transition-all duration-200`}
        >
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-white hover:bg-white/10 h-8"
            >
              <X className="h-4 w-4 mr-1" />
              Fechar
            </Button>
            <div className="text-xs font-medium text-white/90 truncate max-w-[250px]">
              {decodeURIComponent(filename).replace(/\.(pptx?|PPTX?)$/, "")}
            </div>
            {isMarkedAsRead && (
              <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs h-6">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Lido
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-white/80">
              {currentSlide + 1} / {slides.length}
            </span>
            {currentSlide === slides.length - 1 && !isMarkedAsRead && (
              <Button
                variant="default"
                size="sm"
                onClick={handleMarkAsRead}
                className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Marcar como Lido
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-white hover:bg-white/10 h-8">
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div
          className="flex-1 flex items-center justify-center"
          style={{
            height: isFullscreen ? "100vh" : "calc(100vh - 3rem - 3.5rem)",
            width: "100vw",
          }}
        >
          <div
            className="relative flex items-center justify-center"
            style={{
              width: isFullscreen ? "100vw" : "95vw",
              height: isFullscreen ? "100vh" : "95%",
            }}
          >
            <Image
              src={slides[currentSlide] || "/placeholder.svg"}
              alt={`Slide ${currentSlide + 1}`}
              fill
              className="object-contain"
              priority={currentSlide < 3}
              sizes="(max-width: 768px) 95vw, 95vw"
            />
          </div>
        </div>

        <div
          className={`${
            isFullscreen ? "absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 hover:opacity-100" : "relative h-14"
          } bg-black/90 backdrop-blur flex items-center justify-center gap-3 px-4 border-t border-white/10 transition-all duration-200 rounded-lg`}
          style={isFullscreen ? { width: "auto" } : {}}
        >
          <Button
            variant="outline"
            size={isFullscreen ? "sm" : "default"}
            onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ChevronLeft className={`${isFullscreen ? "h-4 w-4" : "h-5 w-5"}`} />
            {!isFullscreen && <span className="ml-1">Anterior</span>}
          </Button>

          <div
            className={`${isFullscreen ? "text-xs" : "text-sm"} font-medium text-white px-3 min-w-[80px] text-center`}
          >
            {currentSlide + 1} / {slides.length}
          </div>

          <Button
            variant="outline"
            size={isFullscreen ? "sm" : "default"}
            onClick={() => setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))}
            disabled={currentSlide === slides.length - 1}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            {!isFullscreen && <span className="mr-1">Próximo</span>}
            <ChevronRight className={`${isFullscreen ? "h-4 w-4" : "h-5 w-5"}`} />
          </Button>
        </div>

        {/* Keyboard shortcuts hint - Smaller and repositioned */}
        {!isFullscreen && (
          <div className="absolute bottom-16 right-4 text-xs text-white/50 bg-black/50 backdrop-blur px-2 py-1 rounded border border-white/10">
            ← → Space F ESC
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-background z-[9999] flex flex-col">
      <div className="flex-1 relative overflow-hidden bg-muted/20 flex items-center justify-center">
        <div className="w-[95vw] h-[95vh]">
          <iframe
            src={googleViewerUrl}
            className="w-full h-full border-0 rounded-lg shadow-2xl bg-white"
            title="Presentation Viewer"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      </div>
    </div>
  )
}
