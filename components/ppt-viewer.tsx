"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, ExternalLink } from "lucide-react"

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
  const [viewerError, setViewerError] = useState(false)

  const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(
    window.location.origin + file.path,
  )}&embedded=true`

  const handleOpenInNewTab = () => {
    window.open(file.path, "_blank")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] h-[95vh] rounded-lg p-0 gap-0 flex flex-col">
        <DialogHeader className="border-b px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-2xl font-bold">{file.displayName}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir em Nova Aba
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-muted">
          {!viewerError ? (
            <iframe
              src={viewerUrl}
              className="w-full h-full border-0"
              title={file.displayName}
              onError={() => setViewerError(true)}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
              <p className="text-lg font-medium text-center mb-4">Não foi possível carregar a apresentação</p>
              <p className="text-sm text-center mb-6">Clique no botão abaixo para baixar o arquivo</p>
              <Button onClick={handleOpenInNewTab}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Baixar Apresentação
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
