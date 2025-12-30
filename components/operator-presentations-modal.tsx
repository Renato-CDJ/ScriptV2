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
  getFilePresentationProgressByFile,
} from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import { PresentationViewer } from "@/components/presentation-viewer"
import { PDFViewer } from "@/components/pdf-viewer"
import type { Presentation } from "@/lib/types"
import { BookOpen, Play, PresentationIcon, CheckCircle2, FileText, GraduationCap, Clock } from "lucide-react"
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
    if (file.extension === ".pdf") {
      setSelectedPDFFile(file)
      setShowPDFViewer(true)
    } else {
      router.push(`/presentation/${encodeURIComponent(file.name)}`)
    }
  }

  const handleClosePDFViewer = () => {
    setShowPDFViewer(false)
    setSelectedPDFFile(null)
  }

  const getFileIcon = (extension: string) => {
    if (extension === ".pdf") {
      return <FileText className="h-5 w-5 text-orange-500" />
    }
    return <PresentationIcon className="h-5 w-5 text-orange-500" />
  }

  const getFileTypeLabel = (extension: string) => {
    if (extension === ".pdf") {
      return "PDF"
    }
    return "PowerPoint"
  }

  const getFileCompletionStatus = (fileName: string) => {
    if (!user) return false
    const fileProgress = getFilePresentationProgressByFile(fileName)
    const userProgress = fileProgress.find((p) => p.operatorId === user.id)
    return userProgress?.marked_as_seen || false
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-6xl h-[90vh] rounded-xl p-0 overflow-hidden">
          <div className="relative p-8 border-b bg-gradient-to-br from-orange-500/10 via-background to-background">
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
            <DialogHeader className="relative">
              <DialogTitle className="text-3xl font-bold flex items-center gap-3 text-balance">
                <div className="p-2 rounded-xl bg-orange-500/20 ring-1 ring-orange-500/30">
                  <GraduationCap className="h-7 w-7 text-orange-500" />
                </div>
                Biblioteca de Treinamentos
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                Explore apresentações, PDFs e materiais de capacitação
              </DialogDescription>
            </DialogHeader>
          </div>

          <ScrollArea className="h-[calc(90vh-200px)] px-8 py-6">
            {!loadingFiles && pptFiles.length > 0 && (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-1 bg-orange-500 rounded-full" />
                    <h3 className="text-xl font-semibold flex items-center gap-2">Materiais de Treinamento</h3>
                    <Badge variant="secondary" className="ml-auto">
                      {pptFiles.length} {pptFiles.length === 1 ? "arquivo" : "arquivos"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {pptFiles.map((file) => {
                      const isCompleted = getFileCompletionStatus(file.displayName)
                      const isPDF = file.extension === ".pdf"

                      return (
                        <Card
                          key={file.name}
                          className="group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl hover:border-orange-500/50 hover:-translate-y-1"
                        >
                          {isCompleted && (
                            <div className="absolute top-4 right-4 z-10">
                              <div className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Concluído
                              </div>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                          <CardHeader className="pb-4 space-y-3">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 ring-1 ring-orange-500/20 group-hover:ring-orange-500/40 transition-all">
                                {isPDF ? (
                                  <FileText className="h-6 w-6 text-orange-500" />
                                ) : (
                                  <PresentationIcon className="h-6 w-6 text-orange-500" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg leading-snug line-clamp-2 group-hover:text-orange-500 transition-colors">
                                  {file.displayName}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs font-medium">
                                    {isPDF ? "PDF" : "PowerPoint"}
                                  </Badge>
                                  {!isCompleted && (
                                    <Badge variant="secondary" className="text-xs">
                                      Pendente
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="pt-0">
                            <Button
                              onClick={() => handleViewPPT(file)}
                              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/20 group-hover:shadow-xl group-hover:shadow-orange-500/30 transition-all h-11"
                              size="lg"
                            >
                              <Play className="h-5 w-5 mr-2" />
                              {isPDF ? "Abrir PDF" : "Iniciar Apresentação"}
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>

                {presentations.length > 0 && <Separator className="my-8" />}
              </>
            )}

            {presentations.length > 0 && (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-1 bg-orange-500 rounded-full" />
                    <h3 className="text-xl font-semibold flex items-center gap-2">Apresentações Interativas</h3>
                    <Badge variant="secondary" className="ml-auto">
                      {presentations.length} {presentations.length === 1 ? "apresentação" : "apresentações"}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {presentations.map((presentation) => {
                      const isCompleted = completedIds.has(presentation.id)

                      return (
                        <Card
                          key={presentation.id}
                          className="group overflow-hidden border-2 hover:shadow-lg hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-0.5"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                          <CardHeader className="pb-4 relative">
                            <div className="flex items-start justify-between gap-6">
                              <div className="flex items-start gap-4 flex-1 min-w-0">
                                <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 ring-1 ring-orange-500/20 group-hover:ring-orange-500/40 transition-all">
                                  <BookOpen className="h-6 w-6 text-orange-500" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-xl leading-snug mb-2 group-hover:text-orange-500 transition-colors">
                                    {presentation.title}
                                  </CardTitle>
                                  {presentation.description && (
                                    <CardDescription className="text-sm leading-relaxed mb-3">
                                      {presentation.description}
                                    </CardDescription>
                                  )}
                                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                      <Clock className="h-4 w-4" />
                                      {presentation.slides.length} slides
                                    </span>
                                    <span>•</span>
                                    <span>Por {presentation.createdByName}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                {isCompleted && (
                                  <div className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Concluído
                                  </div>
                                )}
                                {!isCompleted && <Badge variant="secondary">Novo</Badge>}
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="pt-0 relative">
                            <Button
                              onClick={() => handleViewPresentation(presentation)}
                              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/20 group-hover:shadow-xl group-hover:shadow-orange-500/30 transition-all h-11"
                              size="lg"
                            >
                              <Play className="h-5 w-5 mr-2" />
                              {isCompleted ? "Revisar Apresentação" : "Iniciar Apresentação"}
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {presentations.length === 0 && pptFiles.length === 0 && !loadingFiles && (
              <div className="py-20 text-center">
                <div className="inline-flex p-6 rounded-2xl bg-muted/50 ring-1 ring-border mb-6">
                  <GraduationCap className="h-16 w-16 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nenhum treinamento disponível</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Novos materiais de treinamento serão adicionados em breve.
                </p>
              </div>
            )}

            {loadingFiles && (
              <div className="py-20 text-center">
                <div className="inline-flex p-6 rounded-2xl bg-muted/50 ring-1 ring-border mb-6">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-muted-foreground/20 border-t-orange-500"></div>
                </div>
                <p className="text-muted-foreground">Carregando treinamentos...</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {selectedPresentation && (
        <PresentationViewer presentation={selectedPresentation} isOpen={showViewer} onClose={handleCloseViewer} />
      )}

      {selectedPDFFile && (
        <PDFViewer
          isOpen={showPDFViewer}
          onClose={handleClosePDFViewer}
          fileName={selectedPDFFile.displayName}
          filePath={selectedPDFFile.path}
        />
      )}
    </>
  )
}
