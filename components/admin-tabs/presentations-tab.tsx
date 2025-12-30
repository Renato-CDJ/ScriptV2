"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  getPresentations,
  createPresentation,
  updatePresentation,
  deletePresentation,
  getAllUsers,
  getPresentationProgressByPresentation,
  exportPresentationReport,
  getFilePresentationProgressByFile,
  exportFilePresentationReport,
} from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import type { Presentation, PresentationSlide } from "@/lib/types"
import {
  Plus,
  Trash2,
  Edit,
  Download,
  EyeIcon,
  ImageIcon,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  AlertTriangle,
  Check,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"

export function PresentationsTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [presentations, setPresentations] = useState<Presentation[]>([])
  const [operators, setOperators] = useState<{ id: string; fullName: string }[]>([])
  const [pptFiles, setPptFiles] = useState<any[]>([])
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingPresentation, setEditingPresentation] = useState<Presentation | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showImagePreview, setShowImagePreview] = useState(false)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [slides, setSlides] = useState<PresentationSlide[]>([])
  const [isActive, setIsActive] = useState(true)
  const [recipients, setRecipients] = useState<string[]>([])
  const [sendToAll, setSendToAll] = useState(true)
  const [operatorSearch, setOperatorSearch] = useState("")

  const loadData = useCallback(() => {
    setPresentations(getPresentations())
    const allUsers = getAllUsers()
    setOperators(allUsers.filter((u) => u.role === "operator").map((u) => ({ id: u.id, fullName: u.fullName })))
  }, [])

  const loadOperators = useCallback(() => {
    const allUsers = getAllUsers()
    setOperators(allUsers.filter((u) => u.role === "operator").map((u) => ({ id: u.id, fullName: u.fullName })))
  }, [])

  const loadPresentations = useCallback(() => {
    setPresentations(getPresentations())
  }, [])

  const loadPPTFiles = useCallback(async () => {
    try {
      setLoadingFiles(true)
      console.log("[v0] Loading PPT/PDF files...")
      const response = await fetch("/api/presentations/files")
      const data = await response.json()
      console.log("[v0] Loaded files:", data.files)
      setPptFiles(data.files || [])
    } catch (error) {
      console.error("Error loading PPT files:", error)
      setPptFiles([])
    } finally {
      setLoadingFiles(false)
    }
  }, [])

  useEffect(() => {
    loadOperators()
    loadPresentations()
    loadPPTFiles()
  }, [loadOperators, loadPresentations, loadPPTFiles])

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

  const filteredOperators = useMemo(() => {
    if (!operatorSearch.trim()) return operators

    const searchLower = operatorSearch.toLowerCase()
    return operators.filter((op) => op.fullName.toLowerCase().includes(searchLower))
  }, [operators, operatorSearch])

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setSlides([])
    setIsActive(true)
    setRecipients([])
    setSendToAll(true)
    setOperatorSearch("")
    setEditingPresentation(null)
    setShowImagePreview(false)
  }

  const handleAddSlide = () => {
    const newSlide: PresentationSlide = {
      id: `slide-${Date.now()}`,
      order: slides.length + 1,
      imageUrl: "",
      title: "",
      description: "",
    }
    setSlides([...slides, newSlide])
  }

  const handleRemoveSlide = (slideId: string) => {
    const newSlides = slides.filter((s) => s.id !== slideId)
    setSlides(newSlides.map((s, idx) => ({ ...s, order: idx + 1 })))
  }

  const handleUpdateSlide = (slideId: string, updates: Partial<PresentationSlide>) => {
    setSlides(slides.map((s) => (s.id === slideId ? { ...s, ...updates } : s)))
  }

  const handleImageUpload = (slideId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        handleUpdateSlide(slideId, { imageData: base64, imageUrl: base64 })
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePasteImage = (slideId: string, event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile()
          if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
              const base64 = e.target?.result as string
              handleUpdateSlide(slideId, { imageData: base64, imageUrl: base64 })
            }
            reader.readAsDataURL(file)
          }
        }
      }
    }
  }

  const handleSave = () => {
    if (!user || !title.trim() || slides.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha o título e adicione pelo menos um slide.",
        variant: "destructive",
      })
      return
    }

    const slidesWithoutImages = slides.filter((s) => !s.imageUrl || !s.imageData)
    if (slidesWithoutImages.length > 0) {
      toast({
        title: "Erro",
        description: `${slidesWithoutImages.length} slide(s) sem imagem. Todos os slides devem ter uma imagem.`,
        variant: "destructive",
      })
      return
    }

    if (!sendToAll && recipients.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um operador ou escolha enviar para todos.",
        variant: "destructive",
      })
      return
    }

    const presentationData = {
      title,
      description,
      slides,
      isActive,
      recipients: sendToAll ? [] : recipients,
      createdBy: user.id,
      createdByName: user.fullName,
    }

    if (editingPresentation) {
      updatePresentation({
        ...editingPresentation,
        ...presentationData,
      })
      toast({
        title: "Apresentação atualizada",
        description: "A apresentação foi atualizada com sucesso.",
      })
    } else {
      createPresentation(presentationData as any)
      toast({
        title: "Apresentação criada",
        description: "A apresentação foi criada com sucesso.",
      })
    }

    setShowDialog(false)
    resetForm()
    loadData()
  }

  const handleEdit = (presentation: Presentation) => {
    setEditingPresentation(presentation)
    setTitle(presentation.title)
    setDescription(presentation.description)
    setSlides(presentation.slides)
    setIsActive(presentation.isActive)
    setRecipients(presentation.recipients || [])
    setSendToAll(!presentation.recipients || presentation.recipients.length === 0)
    setShowDialog(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta apresentação?")) {
      deletePresentation(id)
      toast({
        title: "Apresentação excluída",
        description: "A apresentação foi excluída com sucesso.",
      })
      loadData()
    }
  }

  const handleExportReport = (presentationId: string) => {
    const csvContent = exportPresentationReport(presentationId)
    if (!csvContent) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório.",
        variant: "destructive",
      })
      return
    }

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `apresentacao_relatorio_${presentationId}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Relatório exportado",
      description: "O relatório foi exportado com sucesso.",
    })
  }

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleRecipient = (operatorId: string) => {
    setRecipients((prev) =>
      prev.includes(operatorId) ? prev.filter((id) => id !== operatorId) : [...prev, operatorId],
    )
  }

  const getRecipientNames = (recs: string[]) => {
    if (!recs || recs.length === 0) return "Todos os operadores"
    const names = recs.map((id) => operators.find((op) => op.id === id)?.fullName).filter(Boolean)
    return names.join(", ")
  }

  const handleDialogChange = (open: boolean) => {
    setShowDialog(open)
    if (!open) {
      resetForm()
    }
  }

  const hasMissingImages = (presentation: Presentation): boolean => {
    return presentation.slides.some(
      (slide) => slide.imageData === "[IMAGE_STORED_LOCALLY]" || (!slide.imageData && !slide.imageUrl),
    )
  }

  const handleExportFileReport = (fileName: string) => {
    const csvContent = exportFilePresentationReport(fileName)
    if (!csvContent) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório.",
        variant: "destructive",
      })
      return
    }

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `arquivo_relatorio_${fileName}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Relatório exportado",
      description: "O relatório foi baixado com sucesso.",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Apresentações de Treinamento</h2>
          <p className="text-muted-foreground">Gerencie apresentações de slides para os operadores</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Dialog open={showDialog} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-orange-500 hover:bg-orange-600 dark:bg-primary dark:hover:bg-primary/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Apresentação
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-[95vw] max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPresentation ? "Editar Apresentação" : "Nova Apresentação"}</DialogTitle>
              <DialogDescription>Crie uma apresentação de treinamento com múltiplos slides</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título da apresentação"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição da apresentação"
                  rows={3}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Slides ({slides.length})</h3>
                <div className="flex gap-2">
                  {slides.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowImagePreview(!showImagePreview)}
                      className="gap-2"
                    >
                      {showImagePreview ? (
                        <>
                          <EyeOff className="h-4 w-4" />
                          Ocultar Pré-visualização
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          Ver Pré-visualização
                        </>
                      )}
                    </Button>
                  )}
                  <Button size="sm" onClick={handleAddSlide} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Slide
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {showImagePreview && slides.length > 0 && (
                  <div className="lg:col-span-1 order-last lg:order-first">
                    <Card className="h-full bg-muted/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Pré-visualização das Imagens</CardTitle>
                        <CardDescription className="text-xs">Visualize todas as imagens dos slides</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[600px]">
                          <div className="space-y-3 pr-4">
                            {slides.map((slide, index) => (
                              <div key={slide.id} className="space-y-2">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold text-muted-foreground">
                                    Slide {slide.order}
                                  </span>
                                  {slide.imageUrl && (
                                    <Badge variant="secondary" className="text-xs">
                                      Carregado
                                    </Badge>
                                  )}
                                </div>
                                {slide.imageUrl ? (
                                  <div className="border rounded-lg p-2 bg-background overflow-hidden">
                                    <img
                                      src={slide.imageUrl || "/placeholder.svg"}
                                      alt={`Slide ${slide.order} preview`}
                                      className="w-full h-auto rounded object-contain max-h-32"
                                    />
                                  </div>
                                ) : (
                                  <div className="border rounded-lg p-4 text-center bg-background border-dashed">
                                    <ImageIcon className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                                    <p className="text-xs text-muted-foreground">Sem imagem</p>
                                  </div>
                                )}
                                <Separator className="my-2" />
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className={showImagePreview ? "lg:col-span-2" : "lg:col-span-3"}>
                  <ScrollArea className="h-[600px] border rounded-lg p-4">
                    <div className="space-y-4">
                      {slides.map((slide, index) => (
                        <Card key={slide.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="font-semibold">Slide {slide.order}</Label>
                              <Button size="sm" variant="destructive" onClick={() => handleRemoveSlide(slide.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <Label>Imagem</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(slide.id, e)}
                                  className="cursor-pointer"
                                />
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Você também pode colar uma imagem (Ctrl+V ou Cmd+V)
                              </p>
                              <div
                                className="border-2 border-dashed rounded-lg p-4 text-center cursor-text bg-muted/50"
                                onPaste={(e) => handlePasteImage(slide.id, e)}
                                onDragOver={(e) => e.preventDefault()}
                              >
                                {slide.imageUrl ? (
                                  <div className="space-y-2">
                                    <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                                    <p className="text-sm text-green-600 dark:text-green-400">Imagem carregada</p>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">Cole uma imagem aqui</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Destinatários</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send-to-all-pres"
                    checked={sendToAll}
                    onCheckedChange={(checked) => setSendToAll(checked as boolean)}
                  />
                  <Label htmlFor="send-to-all-pres" className="cursor-pointer">
                    Enviar para todos os operadores
                  </Label>
                </div>

                {!sendToAll && (
                  <div className="border rounded-lg p-4 space-y-3">
                    <Input
                      placeholder="Pesquisar operadores..."
                      value={operatorSearch}
                      onChange={(e) => setOperatorSearch(e.target.value)}
                    />
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {filteredOperators.map((operator) => (
                        <div key={operator.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`operator-pres-${operator.id}`}
                            checked={recipients.includes(operator.id)}
                            onCheckedChange={() => toggleRecipient(operator.id)}
                          />
                          <Label htmlFor={`operator-pres-${operator.id}`} className="cursor-pointer">
                            {operator.fullName}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator />
              <div className="flex items-center space-x-2">
                <Switch id="pres-active" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="pres-active">Ativo</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {presentations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <EyeIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">Nenhuma apresentação cadastrada.</p>
            </CardContent>
          </Card>
        ) : (
          presentations.map((presentation) => {
            const isExpanded = expandedIds.has(presentation.id)
            const progressList = getPresentationProgressByPresentation(presentation.id)
            const viewedCount = progressList.filter((p) => p.marked_as_seen).length

            return (
              <Card key={presentation.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 pb-3"
                  onClick={() => toggleExpanded(presentation.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base break-words">{presentation.title}</CardTitle>
                        <CardDescription className="mt-1 break-words">
                          {presentation.slides.length} slides • Por {presentation.createdByName}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasMissingImages(presentation) && (
                        <Badge variant="outline" className="text-orange-500 border-orange-500 gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span className="hidden sm:inline">Imagens locais</span>
                        </Badge>
                      )}
                      <Badge variant={presentation.isActive ? "default" : "secondary"}>
                        {presentation.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge variant="outline">
                        <EyeIcon className="h-3 w-3 mr-1" />
                        {viewedCount}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4">
                    {presentation.description && (
                      <p className="text-sm text-muted-foreground">{presentation.description}</p>
                    )}

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(presentation)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportReport(presentation.id)}
                        disabled={viewedCount === 0}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar Relatório
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(presentation.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    </div>

                    {viewedCount > 0 && (
                      <div className="text-xs text-muted-foreground">{viewedCount} operador(es) marcou como visto</div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
      </div>

      {pptFiles.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-bold tracking-tight mb-4">Arquivos PPT e PDF</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Arquivos de apresentação disponíveis na pasta public/presentations
          </p>

          <div className="space-y-4">
            {pptFiles.map((file) => {
              const fileProgress = getFilePresentationProgressByFile(file.displayName)
              const readCount = fileProgress.filter((p) => p.marked_as_seen).length
              console.log("[v0] File:", file.displayName, "Progress:", fileProgress, "Read count:", readCount)

              return (
                <Card key={file.name} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-base break-words">{file.displayName}</CardTitle>
                        <CardDescription>
                          {file.extension.toUpperCase()} • {readCount} operador(es) marcaram como lido
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">{file.extension === ".pdf" ? "PDF" : "PPT"}</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportFileReport(file.displayName)}
                        disabled={readCount === 0}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar Relatório ({readCount})
                      </Button>
                    </div>

                    {/* Show list of operators who marked as read */}
                    {readCount > 0 && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-md">
                        <p className="text-sm font-medium mb-2">Operadores que marcaram como lido:</p>
                        <div className="space-y-1">
                          {fileProgress
                            .filter((p) => p.marked_as_seen)
                            .map((progress) => (
                              <div key={progress.id} className="text-sm text-muted-foreground flex items-center gap-2">
                                <Check className="h-3 w-3 text-green-600" />
                                {progress.operatorName} -{" "}
                                {new Date(progress.completion_date!).toLocaleDateString("pt-BR")}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
