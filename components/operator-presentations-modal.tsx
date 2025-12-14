"use client"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getActivePresentationsForOperator, getPresentationProgressByOperator } from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import { PresentationViewer } from "@/components/presentation-viewer"
import type { Presentation } from "@/lib/types"
import { BookOpen, Play, Download, FileText } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface OperatorPresentationsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface PPTFile {
  name: string
  path: string
  extension: string
  displayName: string
}

export function OperatorPresentationsModal({ isOpen, onClose }: OperatorPresentationsModalProps) {
  const { user } = useAuth()
  const [presentations, setPresentations] = useState<Presentation[]>([])
  const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null)
  const [showViewer, setShowViewer] = useState(false)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [pptFiles, setPptFiles] = useState<PPTFile[]>([])
  const [loadingFiles, setLoadingFiles] = useState(true)

  const loadData = useCallback(() => {
    if (user) {
      const activePresentations = getActivePresentationsForOperator(user.id)
      setPresentations(activePresentations)

      const progress = getPresentationProgressByOperator(user.id)
      const completed = new Set(progress.filter((p) => p.marked_as_seen).map((p) => p.presentationId))
      setCompletedIds(completed)
    }
  }, [user])

  const loadPPTFiles = useCallback(async () => {
    try {
      setLoadingFiles(true)
      const response = await fetch("/api/presentations/files")
      const data = await response.json()
      setPptFiles(data.files || [])
    } catch (error) {
      console.error("Error loading PPT files:", error)
      setPptFiles([])
    } finally {
      setLoadingFiles(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadData()
      loadPPTFiles()
    }
  }, [isOpen, loadData, loadPPTFiles])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleStoreUpdate = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        loadData()
      }, 200)
    }

    window.addEventListener("store-updated", handleStoreUpdate)
    return () => {
      window.removeEventListener("store-updated", handleStoreUpdate)
      clearTimeout(timeoutId)
    }
  }, [loadData])

  const handleViewPresentation = (presentation: Presentation) => {
    setSelectedPresentation(presentation)
    setShowViewer(true)
  }

  const handleCloseViewer = () => {
    setShowViewer(false)
    setSelectedPresentation(null)
    loadData()
  }

  const handleDownloadPPT = (file: PPTFile) => {
    window.open(file.path, "_blank")
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] h-[90vh] rounded-lg p-0">
          <div className="p-6 border-b">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                Treinamentos
              </DialogTitle>
              <DialogDescription>Visualize as apresentações de treinamento disponíveis</DialogDescription>
            </DialogHeader>
          </div>

          <ScrollArea className="h-[calc(90vh-180px)] px-6 pr-4">
            {!loadingFiles && pptFiles.length > 0 && (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Apresentações PowerPoint
                  </h3>
                  <div className="space-y-3">
                    {pptFiles.map((file) => (
                      <Card key={file.name} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{file.displayName}</CardTitle>
                              <CardDescription className="mt-1">Arquivo {file.extension.toUpperCase()}</CardDescription>
                            </div>
                            <Badge variant="secondary">PowerPoint</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Button
                            onClick={() => handleDownloadPPT(file)}
                            className="w-full bg-orange-500 hover:bg-orange-600 dark:bg-primary dark:hover:bg-primary/90"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Baixar Apresentação
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                <Separator className="my-6" />
              </>
            )}

            {/* Original presentations section */}
            {presentations.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Apresentações Interativas
                </h3>
                <div className="space-y-3">
                  {presentations.map((presentation) => {
                    const isCompleted = completedIds.has(presentation.id)

                    return (
                      <Card key={presentation.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{presentation.title}</CardTitle>
                              {presentation.description && (
                                <CardDescription className="mt-1">{presentation.description}</CardDescription>
                              )}
                              <CardDescription className="mt-2">
                                {presentation.slides.length} slides • Criada por {presentation.createdByName}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              {isCompleted && (
                                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                  Concluído
                                </Badge>
                              )}
                              <Badge variant={isCompleted ? "secondary" : "default"}>
                                {isCompleted ? "Visto" : "Novo"}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Button
                            onClick={() => handleViewPresentation(presentation)}
                            className="w-full bg-orange-500 hover:bg-orange-600 dark:bg-primary dark:hover:bg-primary/90"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Iniciar
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </>
            )}

            {/* Empty state */}
            {presentations.length === 0 && pptFiles.length === 0 && !loadingFiles && (
              <div className="py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Nenhuma apresentação disponível no momento.</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {selectedPresentation && (
        <PresentationViewer presentation={selectedPresentation} isOpen={showViewer} onClose={handleCloseViewer} />
      )}
    </>
  )
}
