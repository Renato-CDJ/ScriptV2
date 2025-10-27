"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RichTextEditor } from "@/components/rich-text-editor"
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Eye,
  Upload,
  ChevronDown,
  ChevronRight,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  RotateCcw,
  Download,
  FileJson,
  AlertCircle,
} from "lucide-react"
import {
  getScriptSteps,
  updateScriptStep,
  createScriptStep,
  deleteScriptStep,
  importScriptFromJson,
  getProducts,
} from "@/lib/store"
import type { ScriptStep, ScriptButton, Product } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { AdminScriptPreview } from "@/components/admin-script-preview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const AVAILABLE_JSON_FILES = [
  { name: "Comercial", file: "comercial.json", path: "/data/comercial.json" },
  { name: "Habitacional 532", file: "hab532.json", path: "/data/hab532.json" },
  { name: "Habitacional", file: "habitacional-script.json", path: "/data/habitacional-script.json" },
]

export function ScriptsTab() {
  const [steps, setSteps] = useState<ScriptStep[]>(getScriptSteps())
  const [products, setProducts] = useState<Product[]>(getProducts())
  const [editingStep, setEditingStep] = useState<ScriptStep | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [previewStep, setPreviewStep] = useState<ScriptStep | null>(null)
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const [showJsonList, setShowJsonList] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const handleStoreUpdate = () => {
      refreshSteps()
    }

    window.addEventListener("store-updated", handleStoreUpdate)
    return () => window.removeEventListener("store-updated", handleStoreUpdate)
  }, [])

  const refreshSteps = () => {
    setSteps(getScriptSteps())
    setProducts(getProducts())
  }

  const toggleProductExpansion = (productId: string) => {
    setExpandedProducts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  const groupedSteps = steps.reduce(
    (acc, step) => {
      const key = step.productId || "standalone"
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(step)
      return acc
    },
    {} as Record<string, ScriptStep[]>,
  )

  const handleImportFromDataFolder = async (filePath: string, fileName: string) => {
    try {
      const response = await fetch(filePath)
      if (!response.ok) {
        throw new Error("Arquivo não encontrado")
      }

      const data = await response.json()

      const isPhraseology = data.fraseologias && !data.marcas

      if (isPhraseology) {
        toast({
          title: "Arquivo de fraseologia detectado",
          description: "Por favor, use a aba 'Fraseologias' para importar arquivos de fraseologia.",
          variant: "destructive",
        })
        return
      }

      const result = importScriptFromJson(data)

      if (result.stepCount > 0) {
        refreshSteps()
        setEditingStep(null)
        setIsCreating(false)
        setPreviewStep(null)

        toast({
          title: "Script importado com sucesso!",
          description: `${result.productCount} produto(s) e ${result.stepCount} tela(s) foram importados de ${fileName}.`,
        })
      } else {
        throw new Error("Nenhuma tela foi importada")
      }
    } catch (error) {
      toast({
        title: "Erro ao importar",
        description: `Não foi possível importar o arquivo ${fileName}. Verifique se o arquivo existe e está no formato correto.`,
        variant: "destructive",
      })
    }
  }

  const handleImportScript = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)

        const isPhraseology = data.fraseologias && !data.marcas

        if (isPhraseology) {
          toast({
            title: "Arquivo de fraseologia detectado",
            description: "Por favor, use a aba 'Fraseologias' para importar arquivos de fraseologia.",
            variant: "destructive",
          })
          return
        }

        const result = importScriptFromJson(data)

        if (result.stepCount > 0) {
          refreshSteps()
          setEditingStep(null)
          setIsCreating(false)
          setPreviewStep(null)

          toast({
            title: "Script importado com sucesso!",
            description: `${result.productCount} produto(s) e ${result.stepCount} tela(s) foram importados.`,
          })
        } else {
          throw new Error("Nenhuma tela foi importada")
        }
      } catch (error) {
        toast({
          title: "Erro ao importar",
          description: "O arquivo não está no formato correto. Esperado: { marcas: { PRODUTO: { step_key: {...} } } }",
          variant: "destructive",
        })
      }
    }
    input.click()
  }

  const handleEdit = (step: ScriptStep) => {
    setEditingStep({ ...step })
    setIsCreating(false)
    setPreviewStep(null)
  }

  const handlePreview = (step: ScriptStep) => {
    setPreviewStep(step)
    setEditingStep(null)
    setIsCreating(false)
  }

  const handleCreate = () => {
    const newStep: ScriptStep = {
      id: "",
      title: "",
      content: "",
      contentSegments: [],
      order: steps.length + 1,
      buttons: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setEditingStep(newStep)
    setIsCreating(true)
    setPreviewStep(null)
  }

  const handleSave = () => {
    if (!editingStep) return

    if (isCreating) {
      createScriptStep(editingStep)
      toast({
        title: "Roteiro criado",
        description: "O novo roteiro foi criado com sucesso.",
      })
    } else {
      updateScriptStep(editingStep)
      toast({
        title: "Roteiro atualizado",
        description: "As alterações foram salvas com sucesso.",
      })
    }

    refreshSteps()
    setEditingStep(null)
    setIsCreating(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este roteiro?")) {
      deleteScriptStep(id)
      refreshSteps()
      toast({
        title: "Roteiro excluído",
        description: "O roteiro foi removido com sucesso.",
      })
    }
  }

  const handleCancel = () => {
    setEditingStep(null)
    setIsCreating(false)
    setPreviewStep(null)
  }

  const addButton = () => {
    if (!editingStep) return
    const newButton: ScriptButton = {
      id: `btn-${Date.now()}`,
      label: "Novo Botão",
      nextStepId: null,
      variant: "default",
      order: editingStep.buttons.length + 1,
    }
    setEditingStep({
      ...editingStep,
      buttons: [...editingStep.buttons, newButton],
    })
  }

  const updateButton = (index: number, field: keyof ScriptButton, value: any) => {
    if (!editingStep) return
    const updatedButtons = [...editingStep.buttons]
    updatedButtons[index] = { ...updatedButtons[index], [field]: value }
    setEditingStep({ ...editingStep, buttons: updatedButtons })
  }

  const removeButton = (index: number) => {
    if (!editingStep) return
    const updatedButtons = editingStep.buttons.filter((_, i) => i !== index)
    setEditingStep({ ...editingStep, buttons: updatedButtons })
  }

  const addTabulation = () => {
    if (!editingStep) return
    const newTabulation = {
      id: `tab-${Date.now()}`,
      name: "",
      description: "",
    }
    setEditingStep({
      ...editingStep,
      tabulations: [...(editingStep.tabulations || []), newTabulation],
    })
  }

  const updateTabulation = (index: number, field: "name" | "description", value: string) => {
    if (!editingStep || !editingStep.tabulations) return
    const updatedTabulations = [...editingStep.tabulations]
    updatedTabulations[index] = { ...updatedTabulations[index], [field]: value }
    setEditingStep({ ...editingStep, tabulations: updatedTabulations })
  }

  const removeTabulation = (index: number) => {
    if (!editingStep) return
    const updatedTabulations = editingStep.tabulations?.filter((_, i) => i !== index) || []
    setEditingStep({
      ...editingStep,
      tabulations: updatedTabulations.length > 0 ? updatedTabulations : undefined,
    })
  }

  const getAlignmentIcon = (align: string) => {
    switch (align) {
      case "left":
        return <AlignLeft className="h-4 w-4" />
      case "center":
        return <AlignCenter className="h-4 w-4" />
      case "right":
        return <AlignRight className="h-4 w-4" />
      case "justify":
        return <AlignJustify className="h-4 w-4" />
      default:
        return <AlignLeft className="h-4 w-4" />
    }
  }

  const handleExportScriptsAsJson = () => {
    // Group scripts by product
    const exportData: any = {
      marcas: {},
    }

    steps.forEach((step) => {
      const productKey = step.productId || "standalone"
      if (!exportData.marcas[productKey]) {
        exportData.marcas[productKey] = {}
      }
      exportData.marcas[productKey][step.id] = {
        title: step.title,
        content: step.content,
        contentSegments: step.contentSegments,
        buttons: step.buttons,
        formatting: step.formatting,
        tabulations: step.tabulations,
        order: step.order,
      }
    })

    // Create JSON blob and download
    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    const today = new Date().toISOString().split("T")[0]
    link.setAttribute("href", url)
    link.setAttribute("download", `roteiros-export-${today}.json`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Roteiros exportados",
      description: "O arquivo JSON foi baixado com sucesso",
    })
  }

  const handleExportProductScripts = (productId: string) => {
    const productSteps = steps.filter((s) => s.productId === productId)
    const product = products.find((p) => p.id === productId)

    const exportData: any = {
      marcas: {
        [productId]: {},
      },
    }

    productSteps.forEach((step) => {
      exportData.marcas[productId][step.id] = {
        title: step.title,
        content: step.content,
        contentSegments: step.contentSegments,
        buttons: step.buttons,
        formatting: step.formatting,
        tabulations: step.tabulations,
        order: step.order,
      }
    })

    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    const fileName = product?.name.toLowerCase().replace(/\s+/g, "-") || productId
    link.setAttribute("href", url)
    link.setAttribute("download", `roteiro-${fileName}.json`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Roteiro exportado",
      description: `Roteiro de ${product?.name || productId} exportado com sucesso`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gerenciar Roteiros</h2>
          <p className="text-muted-foreground mt-1">Crie e edite os scripts de atendimento com formatação avançada</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowJsonList(!showJsonList)}
            disabled={!!editingStep || !!previewStep}
          >
            <FileJson className="h-4 w-4 mr-2" />
            {showJsonList ? "Ocultar" : "Ver"} Roteiros JSON
          </Button>
          <Button variant="outline" onClick={handleImportScript} disabled={!!editingStep || !!previewStep}>
            <Upload className="h-4 w-4 mr-2" />
            Importar JSON
          </Button>
          <Button onClick={handleCreate} disabled={!!editingStep || !!previewStep}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Roteiro
          </Button>
        </div>
      </div>

      {showJsonList && !editingStep && !previewStep && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              Roteiros Disponíveis para Exportação
            </CardTitle>
            <CardDescription>Exporte seus roteiros como arquivos JSON para backup ou compartilhamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="mb-6 pb-6 border-b">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Importar da Pasta Data</h3>
              <div className="space-y-2">
                {AVAILABLE_JSON_FILES.map((jsonFile) => (
                  <div
                    key={jsonFile.file}
                    className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center gap-3">
                      <FileJson className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="font-semibold text-sm">{jsonFile.name}</p>
                        <p className="text-xs text-muted-foreground">{jsonFile.file}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleImportFromDataFolder(jsonFile.path, jsonFile.name)}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Importar
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Exportar Roteiros Existentes</h3>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">Todos os Roteiros</p>
                <p className="text-sm text-muted-foreground">
                  {steps.length} {steps.length === 1 ? "tela" : "telas"} no total
                </p>
              </div>
              <Button size="sm" onClick={handleExportScriptsAsJson}>
                <Download className="h-4 w-4 mr-2" />
                Exportar Tudo
              </Button>
            </div>

            {Object.entries(groupedSteps).map(([groupKey, groupSteps]) => {
              const product = products.find((p) => p.id === groupKey)
              const isStandalone = groupKey === "standalone"

              return (
                <div key={groupKey} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-semibold">{isStandalone ? "Roteiros Avulsos" : product?.name || groupKey}</p>
                    <p className="text-sm text-muted-foreground">
                      {groupSteps.length} {groupSteps.length === 1 ? "tela" : "telas"}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleExportProductScripts(groupKey)}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {previewStep ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Visualização do Roteiro</h3>
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Fechar Visualização
            </Button>
          </div>
          <AdminScriptPreview
            step={previewStep}
            onEdit={() => handleEdit(previewStep)}
            onDelete={() => {
              handleDelete(previewStep.id)
              setPreviewStep(null)
            }}
            onAddButton={() => {
              handleEdit(previewStep)
              addButton()
            }}
          />
        </div>
      ) : editingStep ? (
        <Card>
          <CardHeader>
            <CardTitle>{isCreating ? "Criar Novo Roteiro" : "Editar Roteiro"}</CardTitle>
            <CardDescription>Configure o roteiro e seus botões de navegação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                <TabsTrigger value="buttons">Botões ({editingStep.buttons.length})</TabsTrigger>
                <TabsTrigger value="tabulation">Tabulações</TabsTrigger>
                <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="id">ID do Roteiro</Label>
                    <Input
                      id="id"
                      value={editingStep.id}
                      onChange={(e) => setEditingStep({ ...editingStep, id: e.target.value })}
                      placeholder="Ex: hab_abordagem"
                      disabled={!isCreating}
                    />
                    <p className="text-xs text-muted-foreground">
                      {isCreating ? "Defina um ID único para este roteiro" : "O ID não pode ser alterado"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={editingStep.title}
                      onChange={(e) => setEditingStep({ ...editingStep, title: e.target.value })}
                      placeholder="Ex: Abordagem"
                    />
                  </div>
                </div>

                <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      Alerta para Operador
                    </CardTitle>
                    <CardDescription>
                      Adicione uma mensagem de alerta que será exibida para o operador nesta tela
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="alertMessage">Mensagem de Alerta</Label>
                      <Textarea
                        id="alertMessage"
                        value={editingStep.alert?.message || ""}
                        onChange={(e) =>
                          setEditingStep({
                            ...editingStep,
                            alert: e.target.value
                              ? {
                                  message: e.target.value,
                                  createdAt: editingStep.alert?.createdAt || new Date(),
                                }
                              : undefined,
                          })
                        }
                        placeholder="Digite uma mensagem importante para o operador visualizar nesta tela..."
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        {editingStep.alert?.message
                          ? "Um ícone de alerta piscante será exibido para o operador"
                          : "Deixe em branco se não houver alertas"}
                      </p>
                    </div>
                    {editingStep.alert?.message && (
                      <div className="flex items-center gap-2 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-300 dark:border-amber-700">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                        <span className="text-sm text-amber-900 dark:text-amber-100">
                          Alerta ativo - será exibido ao operador
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <RichTextEditor
                  value={editingStep.content}
                  segments={editingStep.contentSegments}
                  onChange={(content, segments) =>
                    setEditingStep({
                      ...editingStep,
                      content,
                      contentSegments: segments,
                    })
                  }
                  placeholder="Digite o texto do roteiro. Selecione trechos para aplicar formatação específica."
                />

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Formatação Global do Texto
                    </CardTitle>
                    <CardDescription>Configure a aparência padrão do texto no roteiro</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="textColor" className="flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Cor do Texto
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="textColor"
                            type="color"
                            value={editingStep.formatting?.textColor || "#000000"}
                            onChange={(e) =>
                              setEditingStep({
                                ...editingStep,
                                formatting: {
                                  ...editingStep.formatting,
                                  textColor: e.target.value,
                                },
                              })
                            }
                            className="w-20 h-10 cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={editingStep.formatting?.textColor || "#000000"}
                            onChange={(e) =>
                              setEditingStep({
                                ...editingStep,
                                formatting: {
                                  ...editingStep.formatting,
                                  textColor: e.target.value,
                                },
                              })
                            }
                            placeholder="#000000"
                            className="flex-1 font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="textAlign">Alinhamento</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { value: "left", icon: <AlignLeft className="h-4 w-4" /> },
                            { value: "center", icon: <AlignCenter className="h-4 w-4" /> },
                            { value: "right", icon: <AlignRight className="h-4 w-4" /> },
                            { value: "justify", icon: <AlignJustify className="h-4 w-4" /> },
                          ].map((align) => (
                            <Button
                              key={align.value}
                              type="button"
                              variant={
                                (editingStep.formatting?.textAlign || "left") === align.value ? "default" : "outline"
                              }
                              size="icon"
                              onClick={() =>
                                setEditingStep({
                                  ...editingStep,
                                  formatting: {
                                    ...editingStep.formatting,
                                    textAlign: align.value as "left" | "center" | "right" | "justify",
                                  },
                                })
                              }
                            >
                              {align.icon}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="bold"
                          checked={editingStep.formatting?.bold || false}
                          onCheckedChange={(checked) =>
                            setEditingStep({
                              ...editingStep,
                              formatting: {
                                ...editingStep.formatting,
                                bold: checked as boolean,
                              },
                            })
                          }
                        />
                        <label htmlFor="bold" className="text-sm font-bold cursor-pointer">
                          Negrito
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="italic"
                          checked={editingStep.formatting?.italic || false}
                          onCheckedChange={(checked) =>
                            setEditingStep({
                              ...editingStep,
                              formatting: {
                                ...editingStep.formatting,
                                italic: checked as boolean,
                              },
                            })
                          }
                        />
                        <label htmlFor="italic" className="text-sm italic cursor-pointer">
                          Itálico
                        </label>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setEditingStep({
                          ...editingStep,
                          formatting: undefined,
                        })
                      }
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Resetar Formatação
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="buttons" className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Botões de Navegação</Label>
                  <Button size="sm" onClick={addButton}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Botão
                  </Button>
                </div>

                {editingStep.buttons.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Nenhum botão adicionado ainda. Clique em "Adicionar Botão" para criar o primeiro.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {editingStep.buttons.map((button, index) => (
                      <Card key={button.id}>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Texto do Botão</Label>
                                <Input
                                  value={button.label}
                                  onChange={(e) => updateButton(index, "label", e.target.value)}
                                  placeholder="Ex: É O CLIENTE"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Próxima Tela (ID)</Label>
                                <Input
                                  value={button.nextStepId || ""}
                                  onChange={(e) => updateButton(index, "nextStepId", e.target.value || null)}
                                  placeholder="Ex: hab_identificacao ou vazio para fim"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`primary-${index}`}
                                  checked={button.primary || false}
                                  onCheckedChange={(checked) => updateButton(index, "primary", checked)}
                                />
                                <label htmlFor={`primary-${index}`} className="text-sm cursor-pointer">
                                  Botão Principal (destaque)
                                </label>
                              </div>
                              <Button size="sm" variant="ghost" onClick={() => removeButton(index)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remover
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tabulation" className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Tabulações Recomendadas</Label>
                  <Button size="sm" onClick={addTabulation}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Tabulação
                  </Button>
                </div>

                {!editingStep.tabulations || editingStep.tabulations.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Nenhuma tabulação adicionada ainda. Clique em "Adicionar Tabulação" para criar a primeira.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {editingStep.tabulations.map((tabulation, index) => (
                      <Card key={tabulation.id}>
                        <CardContent className="pt-6 space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Tabulação {index + 1}</span>
                            <Button size="sm" variant="ghost" onClick={() => removeTabulation(index)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remover
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`tab-name-${index}`}>Nome da Tabulação</Label>
                            <Input
                              id={`tab-name-${index}`}
                              value={tabulation.name}
                              onChange={(e) => updateTabulation(index, "name", e.target.value)}
                              placeholder="Ex: Acordo Fechado"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`tab-description-${index}`}>Descrição / Orientação</Label>
                            <Textarea
                              id={`tab-description-${index}`}
                              value={tabulation.description}
                              onChange={(e) => updateTabulation(index, "description", e.target.value)}
                              placeholder="Ex: Cliente aceitou a proposta de pagamento&#10;Pressione Enter para quebrar linha"
                              rows={4}
                              className="whitespace-pre-wrap"
                            />
                            <p className="text-xs text-muted-foreground">
                              Pressione Enter para criar quebras de linha no texto
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="preview" className="mt-6">
                <div className="rounded-lg border-2 border-dashed p-6">
                  <AdminScriptPreview step={editingStep} />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Roteiro
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedSteps).map(([groupKey, groupSteps]) => {
            const product = products.find((p) => p.id === groupKey)
            const isStandalone = groupKey === "standalone"
            const isExpanded = expandedProducts.has(groupKey)
            const sortedSteps = groupSteps.sort((a, b) => a.order - b.order)

            return (
              <div key={groupKey} className="space-y-3">
                <div
                  className="flex items-center justify-between p-4 bg-muted rounded-lg border cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => toggleProductExpansion(groupKey)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    <div>
                      <h3 className="text-lg font-semibold">
                        {isStandalone ? "Roteiros Avulsos" : product?.name || groupKey}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {sortedSteps.length} {sortedSteps.length === 1 ? "tela" : "telas"}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">
                    {isStandalone ? "Sem produto" : product?.id || groupKey}
                  </div>
                </div>

                {isExpanded && (
                  <div className="grid gap-3 pl-8">
                    {sortedSteps.map((step) => (
                      <Card key={step.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{step.id}</span>
                                {step.tabulations && step.tabulations.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {step.tabulations.map((tab) => (
                                      <span
                                        key={tab.id}
                                        className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded"
                                      >
                                        {tab.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <CardTitle className="text-lg">{step.title}</CardTitle>
                              <CardDescription className="line-clamp-2 mt-1">
                                {step.content.replace(/<[^>]*>/g, "")}
                              </CardDescription>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handlePreview(step)}
                                title="Visualizar"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleEdit(step)} title="Editar">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleDelete(step.id)} title="Excluir">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        {step.buttons.length > 0 && (
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {step.buttons.map((btn) => (
                                <span
                                  key={btn.id}
                                  className={`text-xs px-3 py-1 rounded-full ${
                                    btn.primary ? "bg-primary text-primary-foreground" : "bg-muted"
                                  }`}
                                >
                                  {btn.label}
                                </span>
                              ))}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {Object.keys(groupedSteps).length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p className="text-lg">Nenhum roteiro cadastrado ainda.</p>
                <p className="text-sm mt-2">Clique em "Novo Roteiro" ou "Importar JSON" para começar.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
