"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Minimize, X } from "lucide-react"

export default function PresentationPage() {
  const params = useParams()
  const router = useRouter()
  const filename = params.filename as string
  const [zoom, setZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(1)

  const presentationUrl = `/presentations/${decodeURIComponent(filename)}`
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
    window.location.origin + presentationUrl,
  )}&embedded=true`

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
          setCurrentSlide((prev) => Math.max(1, prev - 1))
          break
        case "ArrowRight":
          setCurrentSlide((prev) => prev + 1)
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
  }, [toggleFullscreen, router])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const handleZoomIn = () => setZoom((prev) => Math.min(200, prev + 10))
  const handleZoomOut = () => setZoom((prev) => Math.max(50, prev - 10))

  return (
    <div className="fixed inset-0 bg-background z-[9999] flex flex-col">
      <div className="h-16 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
          <div className="text-sm font-medium truncate max-w-[300px]">
            {decodeURIComponent(filename).replace(/\.(pptx?|PPTX?)$/, "")}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">{zoom}%</span>
          <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 200}>
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* Fullscreen toggle */}
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ height: "calc(100vh - 8rem)" }}>
        <div
          className="absolute inset-0 flex items-center justify-center p-4"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "center center",
          }}
        >
          <iframe
            src={googleViewerUrl}
            className="w-full h-full border-0 rounded-lg shadow-2xl"
            title="Presentation Viewer"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      </div>

      <div className="h-16 border-t flex items-center justify-center gap-4 px-4 bg-background/95 backdrop-blur">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setCurrentSlide((prev) => Math.max(1, prev - 1))}
          disabled={currentSlide === 1}
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          Anterior
        </Button>

        <div className="text-sm font-medium px-4">Slide {currentSlide}</div>

        <Button variant="outline" size="lg" onClick={() => setCurrentSlide((prev) => prev + 1)}>
          Próximo
          <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      </div>

      <div className="absolute bottom-20 right-4 text-xs text-muted-foreground bg-background/80 backdrop-blur px-3 py-2 rounded-md border">
        ← → Navegar • F Tela cheia • ESC Sair
      </div>
    </div>
  )
}
