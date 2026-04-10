"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getActiveContracts } from "@/lib/store"
import { FileText, ZoomIn } from "lucide-react"

interface OperatorInitialGuideModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OperatorInitialGuideModal({ open, onOpenChange }: OperatorInitialGuideModalProps) {
  const contracts = getActiveContracts()
  const [zoomLevels, setZoomLevels] = useState<Record<string, number>>({})

  const toggleZoom = (contractId: string) => {
    setZoomLevels((prev) => ({
      ...prev,
      [contractId]: prev[contractId] === 125 ? 100 : 125,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-orange-500" />
            Guia Inicial - Contratos
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {contracts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum contrato disponível no momento</p>
              </div>
            ) : (
              contracts.map((contract) => {
                const currentZoom = zoomLevels[contract.id] || 100
                const isZoomed = currentZoom === 125

                return (
                  <Card
                    key={contract.id}
                    className="border-2 border-orange-500/30 hover:border-orange-500/50 transition-colors relative"
                  >
                    <CardContent className="pt-6">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleZoom(contract.id)}
                        className="absolute top-2 right-2 h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                        title={isZoomed ? "Reduzir zoom" : "Ampliar texto"}
                      >
                        <ZoomIn className={`h-4 w-4 transition-transform ${isZoomed ? "scale-125" : ""}`} />
                      </Button>
                      <h3 className="text-xl font-bold text-orange-500 mb-3 pr-10">{contract.name}</h3>
                      <p
                        className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed transition-all"
                        style={{ fontSize: `${currentZoom}%` }}
                      >
                        {contract.description}
                      </p>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
