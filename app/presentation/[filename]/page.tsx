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

        for (let i = 1; i <= 100; i++) {
          const paddedNum = String(i).padStart(3, "0")
          const slideUrl = `/presentations/slides/${baseFilename}/slide-${paddedNum}.png`

          try {
            const response = await fetch(slideUrl, { method: "HEAD" })
            if (response.ok) {
              slideUrls.push(slideUrl)
            } else {
              break
            }
          } catch {
            break
          }
        }

        if (slideUrls.length > 0) {
          console.log("[v0] Loaded slides:", slideUrls.length)
          setSlides(slideUrls)
          setCurrentSlide(0)
        } else {
          console.log("[v0] No slides found, using fallback viewer")
          setSlides([])
        }
      } catch (error) {
        console.error("[v0] Error loading slides:", error)
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
          setCurrentSlide((prev) => Math.max(0, prev - 1))
          break
        case "ArrowRight":
        case " ":
          e.preventDefault()
          setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))
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
      <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white/70">Carregando apresentação...</p>
        </div>
      </div>
    )
  }

  if (slides.length > 0) {
    const isLastSlide = currentSlide === slides.length - 1

    return (
      <div className="fixed inset-0 bg-black z-[9999] flex flex-col">
        <div className="h-14 bg-black/95 backdrop-blur flex items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-white hover:bg-white/10">
              <X className="h-4 w-4 mr-1" />
              Fechar
            </Button>
            <div className="text-sm font-medium text-white/90 truncate max-w-[300px]">
              {decodeURIComponent(filename).replace(/\.(pptx?|PPTX?)$/, "")}
            </div>
            {isMarkedAsRead && (
              <Badge className="bg-green-600 text-white text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Lido
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-white/80">
              Slide {currentSlide + 1} / {slides.length}
            </span>
            <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-white hover:bg-white/10">
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Tela Cheia</span>
            </Button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center bg-black overflow-hidden">
          <div
            className="relative"
            style={{
              width: isFullscreen ? "100vw" : "95vw",
              height: isFullscreen ? "100vh" : "calc(95vh - 7rem)",
            }}
          >
            <Image
              src={slides[currentSlide] || "/placeholder.svg"}
              alt={`Slide ${currentSlide + 1}`}
              fill
              className="object-contain"
              priority
              sizes="100vw"
            />
          </div>
        </div>

        <div className="h-16 bg-black/95 backdrop-blur flex items-center justify-center gap-4 px-4 border-t border-white/10">
          <Button
            variant="outline"
            size="default"
            onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Anterior
          </Button>

          <div className="text-sm font-medium text-white px-4 min-w-[100px] text-center">
            {currentSlide + 1} / {slides.length}
          </div>

          <Button
            variant="outline"
            size="default"
            onClick={() => setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))}
            disabled={isLastSlide}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-30"
          >
            Próximo
            <ChevronRight className="h-5 w-5 ml-1" />
          </Button>

          {isLastSlide && !isMarkedAsRead && (
            <Button
              variant="default"
              size="default"
              onClick={handleMarkAsRead}
              className="bg-green-600 hover:bg-green-700 text-white ml-4"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Marcar como Lido
            </Button>
          )}
        </div>
      </div>
    )
  }

  const presentationUrl = `/presentations/${decodeURIComponent(filename)}`
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
    typeof window !== "undefined" ? window.location.origin + presentationUrl : presentationUrl,
  )}&embedded=true`

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col">
      <div className="h-14 bg-black/95 backdrop-blur flex items-center justify-between px-4 border-b border-white/10">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-white hover:bg-white/10">
          <X className="h-4 w-4 mr-1" />
          Fechar
        </Button>
        <div className="text-sm font-medium text-white/90">{decodeURIComponent(filename)}</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <iframe
          src={googleViewerUrl}
          className="w-[95%] h-[95%] border-0 rounded-lg shadow-2xl bg-white"
          title="Presentation Viewer"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    </div>
  )
}
