"use client"
import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, ZoomIn, ZoomOut } from "lucide-react"

interface PDFViewerProps {
  isOpen: boolean
  onClose: () => void
  fileName: string
  filePath: string
}

export function PDFViewer({ isOpen, onClose, fileName, filePath }: PDFViewerProps) {
  const [zoom, setZoom] = useState(100)

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] p-0 rounded-lg overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-background">
            <h2 className="text-lg font-semibold truncate flex-1">{fileName}</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleZoomOut} title="Diminuir zoom">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[60px] text-center">{zoom}%</span>
              <Button variant="outline" size="icon" onClick={handleZoomIn} title="Aumentar zoom">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={onClose} title="Fechar">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* PDF Content */}
          <div className="flex-1 overflow-auto bg-muted/20">
            <div className="flex items-center justify-center min-h-full p-4">
              <iframe
                src={filePath}
                className="w-full h-full min-h-[80vh] rounded-lg shadow-lg bg-white"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top center",
                }}
                title={fileName}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
