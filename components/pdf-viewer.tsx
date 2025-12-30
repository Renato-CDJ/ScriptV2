"use client"
import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, ZoomIn, ZoomOut, CheckCircle2, FileText } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { markFilePresentationAsRead } from "@/lib/store"

interface PDFViewerProps {
  isOpen: boolean
  onClose: () => void
  fileName: string
  filePath: string
}

export function PDFViewer({ isOpen, onClose, fileName, filePath }: PDFViewerProps) {
  const [zoom, setZoom] = useState(100)
  const { user } = useAuth()
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false)

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50))
  }

  const handleMarkAsRead = () => {
    if (user) {
      console.log("[v0] Marking PDF as read:", fileName, user.id, user.fullName || user.username)
      markFilePresentationAsRead(fileName, user.id, user.fullName || user.username)
      setHasMarkedAsRead(true)
      console.log("[v0] PDF marked as read successfully")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] p-0 rounded-xl overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-background via-orange-500/5 to-background">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 rounded-lg bg-orange-500/20 ring-1 ring-orange-500/30">
                <FileText className="h-5 w-5 text-orange-500" />
              </div>
              <h2 className="text-lg font-semibold truncate">{fileName}</h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/50 border">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut} title="Diminuir zoom">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-muted-foreground min-w-[50px] text-center">{zoom}%</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn} title="Aumentar zoom">
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-8" />

              {user && !hasMarkedAsRead && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleMarkAsRead}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-600/20"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar como Lido
                </Button>
              )}
              {hasMarkedAsRead && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="border-green-600/40 text-green-600 bg-green-600/10"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcado
                </Button>
              )}

              <Separator orientation="vertical" className="h-8" />

              <Button
                variant="outline"
                size="icon"
                onClick={onClose}
                title="Fechar"
                className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 bg-transparent"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-muted/10">
            <div className="flex items-center justify-center min-h-full p-6">
              <iframe
                src={`${filePath}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                className="w-full h-full min-h-[85vh] rounded-lg shadow-2xl bg-white ring-1 ring-border"
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
