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
import { PDFViewer } from "@/components/pdf-viewer"
import type { Presentation } from "@/lib/types"
import { Play, PresentationIcon, CheckCircle2, FileText, GraduationCap } from "lucide-react"

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
  const [selectedPDFFile, setSelectedPDFFile] = useState<PPTFile | null>(null)
  const [showPDFViewer, setShowPDFViewer] = useState(false)

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
    console.log("[v0] Button clicked for file:", file.displayName)

    if (file.extension === ".pdf") {
      console.log("[v0] Opening PDF:", file.path)
      setSelectedPDFFile(file)
      setShowPDFViewer(true)
    } else {
      console.log("[v0] Opening PPT - navigating to:", `/presentation/${encodeURIComponent(file.name)}`)
      onClose()
      window.location.href = `/presentation/${encodeURIComponent(file.name)}`
    }
  }

  const getFileCompletionStatus = (fileName: string) => {
    if (!user) return false
    const fileProgress = getFilePresentationProgressByFile(fileName)
    return fileProgress.some((p) => p.operatorId === user.id && p.marked_as_seen)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-orange-500" />
              Biblioteca de Treinamentos
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[calc(85vh-120px)] pr-4">
            {pptFiles.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Materiais de Treinamento
                  <Badge variant="secondary" className="ml-2">
                    {pptFiles.length}
                  </Badge>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pptFiles.map((file) => {
                    const isCompleted = getFileCompletionStatus(file.displayName)
                    const isPDF = file.extension === ".pdf"

                    return (
                      <Card key={file.name} className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-orange-500/10 rounded-lg">
                            {isPDF ? (
                              <FileText className="h-5 w-5 text-orange-500" />
                            ) : (
                              <PresentationIcon className="h-5 w-5 text-orange-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium line-clamp-2 text-sm">{file.displayName}</h4>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {isPDF ? "PDF" : "PowerPoint"}
                              </Badge>
                              {isCompleted ? (
                                <Badge variant="default" className="text-xs bg-green-600">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Lido
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  Pendente
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => openFile(file)}
                          className="w-full bg-orange-500 hover:bg-orange-600"
                          size="sm"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Iniciar Apresentação
                        </Button>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {presentations.length > 0 && (
              <div className="space-y-4 mt-6">
                <h3 className="text-lg font-semibold">
                  Apresentações Interativas
                  <Badge variant="secondary" className="ml-2">
                    {presentations.length}
                  </Badge>
                </h3>

                {presentations.map((presentation) => {
                  const isCompleted = completedIds.has(presentation.id)

                  return (
                    <Card key={presentation.id} className="p-4">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h4 className="font-semibold">{presentation.title}</h4>
                          {presentation.description && (
                            <p className="text-sm text-muted-foreground mt-1">{presentation.description}</p>
                          )}
                        </div>
                        {isCompleted && (
                          <Badge variant="default" className="bg-green-600">
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
                        className="w-full bg-orange-500 hover:bg-orange-600"
                        size="sm"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {isCompleted ? "Revisar" : "Iniciar Apresentação"}
                      </Button>
                    </Card>
                  )
                })}
              </div>
            )}

            {pptFiles.length === 0 && presentations.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum treinamento disponível no momento</p>
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

      {selectedPDFFile && (
        <PDFViewer
          isOpen={showPDFViewer}
          onClose={() => {
            setShowPDFViewer(false)
            setSelectedPDFFile(null)
          }}
          fileName={selectedPDFFile.displayName}
          filePath={selectedPDFFile.path}
        />
      )}
    </>
  )
}
