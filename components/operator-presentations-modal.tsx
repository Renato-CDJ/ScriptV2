"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  getActivePresentationsForOperator,
  getPresentationProgressByOperator,
  getFilePresentationProgressByFile,
} from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import { PresentationViewer } from "@/components/presentation-viewer"
import { PresentationSlideshowViewer } from "@/components/presentation-slideshow-viewer"
import type { Presentation } from "@/lib/types"
import { Play, CheckCircle2, GraduationCap } from "lucide-react"

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
  const [selectedPPTFile, setSelectedPPTFile] = useState<PPTFile | null>(null)
  const [showSlideshowViewer, setShowSlideshowViewer] = useState(false)

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
      const response = await fetch("/api/presentations/files")
      const data = await response.json()
      setPptFiles(data.files || [])
    } catch (error) {
      console.error("[v0] Error loading files:", error)
      setPptFiles([])
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadData()
      loadPPTFiles()
    }
  }, [isOpen, loadData, loadPPTFiles])

  const openFile = (file: PPTFile) => {
    console.log("[v0] Opening file:", file.displayName, "Type:", file.extension)

    setSelectedPPTFile(file)
    setShowSlideshowViewer(true)
  }

  const getFileCompletionStatus = (fileName: string) => {
    if (!user) return false
    const fileProgress = getFilePresentationProgressByFile(fileName)
    return fileProgress.some((p) => p.operatorId === user.id && p.marked_as_seen)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <GraduationCap className="h-7 w-7 text-orange-500" />
              </div>
              Biblioteca de Treinamentos
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Explore apresentações, PDFs e materiais de capacitação</p>
          </DialogHeader>

          <ScrollArea className="h-[calc(90vh-180px)] pr-4">
            {pptFiles.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Materiais de Treinamento</h3>
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {pptFiles.length} {pptFiles.length === 1 ? "arquivo" : "arquivos"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pptFiles.map((file) => {
                    const isCompleted = getFileCompletionStatus(file.displayName)

                    return (
                      <Card
                        key={file.name}
                        className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-orange-500/50"
                      >
                        {isCompleted && (
                          <div className="absolute top-3 right-3 z-10">
                            <Badge className="bg-green-600 text-white border-0 shadow-lg">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Concluído
                            </Badge>
                          </div>
                        )}

                        <div className="p-5 space-y-4">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-base line-clamp-2 leading-tight min-h-[2.5rem]">
                              {file.displayName}
                            </h4>
                          </div>

                          <Button
                            onClick={() => openFile(file)}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg transition-all duration-200 group-hover:scale-105"
                            size="lg"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Abrir Apresentação
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {presentations.length > 0 && (
              <div className="space-y-6 mt-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Apresentações Interativas</h3>
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {presentations.length} {presentations.length === 1 ? "apresentação" : "apresentações"}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {presentations.map((presentation) => {
                    const isCompleted = completedIds.has(presentation.id)

                    return (
                      <Card
                        key={presentation.id}
                        className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-orange-500/50"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base mb-1">{presentation.title}</h4>
                              {presentation.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">{presentation.description}</p>
                              )}
                            </div>
                            {isCompleted && (
                              <Badge className="bg-green-600 text-white border-0 shadow-lg flex-shrink-0">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Concluído
                              </Badge>
                            )}
                          </div>
                          <Button
                            onClick={() => {
                              setSelectedPresentation(presentation)
                              setShowViewer(true)
                            }}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
                            size="lg"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            {isCompleted ? "Revisar Apresentação" : "Iniciar Apresentação"}
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {pptFiles.length === 0 && presentations.length === 0 && (
              <div className="py-16 text-center">
                <div className="inline-flex p-4 bg-muted rounded-full mb-4">
                  <GraduationCap className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhum treinamento disponível</h3>
                <p className="text-sm text-muted-foreground">Novos materiais serão adicionados em breve</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {selectedPresentation && (
        <PresentationViewer
          presentation={selectedPresentation}
          isOpen={showViewer}
          onClose={() => {
            setShowViewer(false)
            setSelectedPresentation(null)
            loadData()
          }}
        />
      )}

      {selectedPPTFile && (
        <PresentationSlideshowViewer
          isOpen={showSlideshowViewer}
          onClose={() => {
            setShowSlideshowViewer(false)
            setSelectedPPTFile(null)
            loadData()
            loadPPTFiles()
          }}
          fileName={selectedPPTFile.displayName}
          filePath={selectedPPTFile.path}
          isPDF={selectedPPTFile.extension === ".pdf"}
        />
      )}
    </>
  )
}
