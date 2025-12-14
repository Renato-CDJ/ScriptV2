"use client"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react"

interface PPTViewerProps {
  file: {
    name: string
    path: string
    displayName: string
  }
  isOpen: boolean
  onClose: () => void
}

export function PPTViewer({ file, isOpen, onClose }: PPTViewerProps) {
  const [isPresentationMode, setIsPresentationMode] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [currentSlide, setCurrentSlide] = useState(1)
  const [viewerError, setViewerError] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsPresentationMode(false)
      setZoom(100)
      setCurrentSlide(1)
      setViewerError(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setCurrentSlide((prev) => prev + 1)
      } else if (e.key === "ArrowLeft") {
        setCurrentSlide((prev) => Math.max(1, prev - 1))
      } else if (e.key === "Escape" && isPresentationMode) {
        setIsPresentationMode(false)
      } else if (e.key === "f" || e.key === "F") {
        setIsPresentationMode((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, isPresentationMode])

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(200, prev + 10))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(50, prev - 10))
  }, [])

  const handleNextSlide = useCallback(() => {
    setCurrentSlide((prev) => prev + 1)
  }, [])

  const handlePrevSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.max(1, prev - 1))
  }, [])

  const togglePresentationMode = useCallback(() => {
    setIsPresentationMode((prev) => !prev)
  }, [])

  const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(
    window.location.origin + file.path,
  )}&embedded=true`

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`${
          isPresentationMode ? "max-w-[100vw] h-[100vh] w-[100vw]" : "max-w-[95vw] h-[90vh]"
        } rounded-lg p-0 gap-0 flex flex-col transition-all duration-300`}
      >
        <div className="border-b px-4 py-3 flex-shrink-0 bg-background">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold truncate">{file.displayName}</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={togglePresentationMode}
                title={isPresentationMode ? "Sair do Modo Apresentação" : "Modo Apresentação"}
              >
                {isPresentationMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">{isPresentationMode ? "Sair" : "Apresentação"}</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className={`flex-1 overflow-hidden bg-muted ${isPresentationMode ? "h-[90vh]" : ""}`}>
          {!viewerError ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <iframe
                src={viewerUrl}
                className="w-full h-full border-0"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "center center",
                }}
                title={file.displayName}
                onError={() => setViewerError(true)}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
              <p className="text-lg font-medium text-center mb-4">Não foi possível carregar a apresentação</p>
              <p className="text-sm text-center">Use o Google Docs ou outro visualizador para abrir o arquivo</p>
            </div>
          )}
        </div>

        <div className={`border-t px-4 py-3 flex-shrink-0 bg-background ${isPresentationMode ? "py-4" : ""}`}>
          <div className="flex items-center justify-between gap-4">
            {/* Navigation controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size={isPresentationMode ? "default" : "sm"}
                onClick={handlePrevSlide}
                disabled={currentSlide <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-1">Anterior</span>
              </Button>
              <span className="text-sm font-medium px-3 py-1 bg-muted rounded">Slide {currentSlide}</span>
              <Button variant="outline" size={isPresentationMode ? "default" : "sm"} onClick={handleNextSlide}>
                <span className="mr-1">Próximo</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size={isPresentationMode ? "default" : "sm"} onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-3 py-1 bg-muted rounded min-w-[60px] text-center">{zoom}%</span>
              <Button variant="outline" size={isPresentationMode ? "default" : "sm"} onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Keyboard shortcuts hint */}
          {isPresentationMode && (
            <div className="mt-2 text-xs text-muted-foreground text-center">
              Use as setas ← → para navegar | F para alternar tela cheia | ESC para sair
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
