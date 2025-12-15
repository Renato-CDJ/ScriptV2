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
} from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import type { Presentation, PresentationSlide } from "@/lib/types"
import { Plus, Trash2, Edit, Download, EyeIcon, ImageIcon, ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"

export function PresentationsTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [presentations, setPresentations] = useState<Presentation[]>([])
  const [operators, setOperators] = useState<{ id: string; fullName: string }[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [editingPresentation, setEditingPresentation] = useState<Presentation | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [selectedPresentationForReport, setSelectedPresentationForReport] = useState<string | null>(null)

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

  useEffect(() => {
    loadData()
  }, [loadData])

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

  const getPresentationReport = (presentationId: string) => {
    const progress = getPresentationProgressByPresentation(presentationId)
    const presentation = presentations.find((p) => p.id === presentationId)

    if (!presentation) return []

    // Get all operators who should see this presentation
    const targetOperators =
      presentation.recipients && presentation.recipients.length > 0
        ? operators.filter((op) => presentation.recipients.includes(op.id))
        : operators

    // Create report with all operators
    return targetOperators.map((op) => {
      const opProgress = progress.find((p) => p.operatorId === op.id)
      return {
        operatorId: op.id,
        operatorName: op.fullName,
        hasViewed: !!opProgress,
        markedAsRead: opProgress?.marked_as_seen || false,
        viewedAt: opProgress?.viewedAt,
        completionDate: opProgress?.completion_date,
      }
    })
  }

  const handleExportExcel = (presentationId: string) => {
    const presentation = presentations.find((p) => p.id === presentationId)
    if (!presentation) return

    const report = getPresentationReport(presentationId)

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"

    // Header
    csvContent += "RELATÓRIO DE VISUALIZAÇÃO DE APRESENTAÇÃO\n\n"
    csvContent += `Título:,${presentation.title.replace(/,/g, ";")}\n`
    csvContent += `Descrição:,${presentation.description.replace(/,/g, ";")}\n`
    csvContent += `Total de Slides:,${presentation.slides.length}\n`
    csvContent += `Criada por:,${presentation.createdByName}\n`
    csvContent += `Data de Criação:,${new Date(presentation.createdAt).toLocaleDateString("pt-BR")}\n`
    csvContent += `Total de Operadores:,${report.length}\n`
    csvContent += `Visualizaram:,${report.filter((r) => r.hasViewed).length}\n`
    csvContent += `Marcaram como Lido:,${report.filter((r) => r.markedAsRead).length}\n\n`

    // Table header
    csvContent += "Operador,Visualizou,Marcou como Lido,Data de Visualização,Data de Conclusão\n"

    // Table rows
    report.forEach((r) => {
      csvContent += `${r.operatorName},`
      csvContent += `${r.hasViewed ? "Sim" : "Não"},`
      csvContent += `${r.markedAsRead ? "Sim" : "Não"},`
      csvContent += `${r.viewedAt ? new Date(r.viewedAt).toLocaleString("pt-BR") : "-"},`
      csvContent += `${r.completionDate ? new Date(r.completionDate).toLocaleString("pt-BR") : "-"}\n`
    })

    // Download
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `relatorio_${presentation.title.replace(/[^a-z0-9]/gi, "_")}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Relatório exportado",
      description: "O relatório foi exportado com sucesso em formato CSV (compatível com Excel).",
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
            const report = getPresentationReport(presentation.id)
            const viewedCount = report.filter((r) => r.hasViewed).length
            const readCount = report.filter((r) => r.markedAsRead).length

            return (
              <Card key={presentation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{presentation.title}</CardTitle>
                        <Badge variant={presentation.isActive ? "default" : "secondary"}>
                          {presentation.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">
                          {viewedCount}/{report.length} Visualizaram
                        </Badge>
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
                          {readCount}/{report.length} Leram
                        </Badge>
                      </div>
                      <CardDescription>{presentation.description}</CardDescription>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <span>{presentation.slides.length} slides</span>
                        <span>•</span>
                        <span>Criada por {presentation.createdByName}</span>
                        <span>•</span>
                        <span>{new Date(presentation.createdAt).toLocaleDateString("pt-BR")}</span>
                        <span>•</span>
                        <span className="text-xs">{getRecipientNames(presentation.recipients)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportExcel(presentation.id)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Exportar Relatório
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleExpanded(presentation.id)}>
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(presentation)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(presentation.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent>
                    <Separator className="mb-4" />
                    <div className="space-y-4">
                      <h4 className="font-semibold">Relatório de Visualização</h4>
                      <ScrollArea className="h-[400px] border rounded-lg">
                        <div className="p-4">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">Operador</th>
                                <th className="text-center p-2">Visualizou</th>
                                <th className="text-center p-2">Marcou como Lido</th>
                                <th className="text-center p-2">Data de Visualização</th>
                                <th className="text-center p-2">Data de Conclusão</th>
                              </tr>
                            </thead>
                            <tbody>
                              {report.map((r) => (
                                <tr key={r.operatorId} className="border-b">
                                  <td className="p-2">{r.operatorName}</td>
                                  <td className="text-center p-2">
                                    {r.hasViewed ? (
                                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">
                                        Sim
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-gray-50 dark:bg-gray-950">
                                        Não
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="text-center p-2">
                                    {r.markedAsRead ? (
                                      <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
                                        Sim
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-gray-50 dark:bg-gray-950">
                                        Não
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="text-center p-2 text-sm">
                                    {r.viewedAt ? new Date(r.viewedAt).toLocaleString("pt-BR") : "-"}
                                  </td>
                                  <td className="text-center p-2 text-sm">
                                    {r.completionDate ? new Date(r.completionDate).toLocaleString("pt-BR") : "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </ScrollArea>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
