"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  getActivePresentationsForOperator,
  getPresentationProgressByOperator,
  getPPTFileProgressByOperator,
} from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import { PresentationViewer } from "@/components/presentation-viewer"
import { PPTSlideViewer } from "@/components/ppt-slide-viewer"
import type { Presentation } from "@/lib/types"
import { BookOpen, Play, PresentationIcon, CheckCircle2 } from "lucide-react"
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
  const router = useRouter()
  const [presentations, setPresentations] = useState<Presentation[]>([])
  const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null)
  const [showViewer, setShowViewer] = useState(false)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [pptFiles, setPptFiles] = useState<PPTFile[]>([])
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [readPPTFiles, setReadPPTFiles] = useState<Set<string>>(new Set())

  const [selectedPPTFile, setSelectedPPTFile] = useState<PPTFile | null>(null)
  const [showPPTViewer, setShowPPTViewer] = useState(false)

  const loadData = useCallback(() => {
    if (user) {
      const activePresentations = getActivePresentationsForOperator(user.id)
      setPresentations(activePresentations)

      const progress = getPresentationProgressByOperator(user.id)
      const completed = new Set(progress.filter((p) => p.marked_as_seen).map((p) => p.presentationId))
      setCompletedIds(completed)

      const pptProgress = getPPTFileProgressByOperator(user.id)
      const readFiles = new Set(pptProgress.map((p) => p.filename))
      setReadPPTFiles(readFiles)
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

  const handleViewPPT = (file: PPTFile) => {
    setSelectedPPTFile(file)
    setShowPPTViewer(true)
  }

  const handleClosePPTViewer = () => {
    setShowPPTViewer(false)
    setSelectedPPTFile(null)
    loadData()
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
                <div className="mb-6 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pptFiles.map((file) => {
                      const isRead = readPPTFiles.has(file.name)

                      return (
                        <Card
                          key={file.name}
                          className="overflow-hidden hover:shadow-lg hover:border-orange-500/50 transition-all duration-200 group"
                        >
                          <CardHeader className="pb-4 bg-gradient-to-br from-background to-muted/30">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                                <PresentationIcon className="h-5 w-5 text-orange-500" />
                              </div>
                              <CardTitle className="text-lg flex-1">{file.displayName}</CardTitle>
                              {isRead && (
                                <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Lido
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <Button
                              onClick={() => handleViewPPT(file)}
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white dark:bg-primary dark:hover:bg-primary/90"
                              size="lg"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Iniciar Apresentação
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
                {presentations.length > 0 && <Separator className="my-6" />}
              </>
            )}

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

      {selectedPPTFile && (
        <PPTSlideViewer
          filename={selectedPPTFile.name}
          displayName={selectedPPTFile.displayName}
          isOpen={showPPTViewer}
          onClose={handleClosePPTViewer}
          alreadyRead={readPPTFiles.has(selectedPPTFile.name)}
        />
      )}
    </>
  )
}
