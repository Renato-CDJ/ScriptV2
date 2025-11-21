"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RichTextEditorWYSIWYG } from "@/components/rich-text-editor-wysiwyg"
import { Plus, Edit, Trash2, Save, X, Eye, Upload, ChevronDown, ChevronRight, AlertCircle, Loader2 } from "lucide-react"
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
import { validateScriptJson } from "@/lib/scripts-loader"
import { getAutoLoadScripts } from "@/lib/auto-load-scripts"

export function ScriptsTab() {
  const [steps, setSteps] = useState<ScriptStep[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [editingStep, setEditingStep] = useState<ScriptStep | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [previewStep, setPreviewStep] = useState<ScriptStep | null>(null)
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const [availableScripts, setAvailableScripts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
    loadAvailableScripts()

    // Subscribe to realtime updates if needed, or just refresh on focus
    // For now we'll rely on manual refresh after actions
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [fetchedSteps, fetchedProducts] = await Promise.all([getScriptSteps(), getProducts()])
      setSteps(fetchedSteps)
      setProducts(fetchedProducts)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os roteiros e produtos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableScripts = () => {
    try {
      const scripts = getAutoLoadScripts()
      setAvailableScripts(scripts)
    } catch (error) {
      console.error("[v0] Error loading available scripts:", error)
    }
  }

  const refreshSteps = () => {
    loadData()
  }

  const isScriptImported = (scriptName: string): boolean => {
    const productId = `prod-${scriptName.toLowerCase().replace(/\s+/g, "-")}`
    return products.some((p) => p.scriptId === productId)
  }

  const handleImportAvailableScript = async (scriptData: any, scriptName: string) => {
    try {
      setIsLoading(true)
      const result = await importScriptFromJson(scriptData)

      if (result.stepCount > 0) {
        await refreshSteps()
        toast({
          title: "Script importado com sucesso!",
          description: `${result.productCount} produto(s) e ${result.stepCount} tela(s) foram importados de ${scriptName}.`,
        })
      } else {
        throw new Error("Nenhuma tela foi importada")
      }
    } catch (error) {
      toast({
        title: "Erro ao importar",
        description: `Não foi possível importar o script ${scriptName}.`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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

  const handleImportScript = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        setIsLoading(true)
        const text = await file.text()
        const data = JSON.parse(text)

        const isPhraseology = data.fraseologias && !data.marcas

        if (isPhraseology) {
          toast({
            title: "Arquivo de fraseologia detectado",
            description: "Por favor, use a aba 'Fraseologias' para importar arquivos de fraseologia.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        const validation = validateScriptJson(data)
        if (!validation.valid) {
          toast({
            title: "Erro de validação",
            description: validation.errors.join(", "),
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        const result = await importScriptFromJson(data)

        if (result.stepCount > 0) {
          await refreshSteps()
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
      } finally {
        setIsLoading(false)
      }
    }
    input.click()
  }

  const handleEdit = (step: ScriptStep) => {
    setEditingStep({
      ...step,
      content: step.content || "", // Ensure content is never undefined
    })
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

  const handleSave = async () => {
    if (!editingStep) return

    try {
      setIsLoading(true)
      if (isCreating) {
        await createScriptStep(editingStep)
        toast({
          title: "Roteiro criado",
          description: "O novo roteiro foi criado com sucesso.",
        })
      } else {
        await updateScriptStep(editingStep)
        toast({
          title: "Roteiro atualizado",
          description: "As alterações foram salvas com sucesso.",
        })
      }

      await refreshSteps()
      setEditingStep(null)
      setIsCreating(false)
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o roteiro.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este roteiro?")) {
      try {
        setIsLoading(true)
        await deleteScriptStep(id)
        await refreshSteps()
        toast({
          title: "Roteiro excluído",
          description: "O roteiro foi removido com sucesso.",
        })
      } catch (error) {
        toast({
          title: "Erro ao excluir",
          description: "Ocorreu um erro ao excluir o roteiro.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
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

  if (isLoading && !steps.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gerenciar Roteiros</h2>
          <p className="text-muted-foreground mt-1">Crie e edite os scripts de atendimento com formatação avançada</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleImportScript} disabled={!!editingStep || !!previewStep || isLoading}>
            <Upload className="h-4 w-4 mr-2" />
            Importar JSON
          </Button>
          <Button onClick={handleCreate} disabled={!!editingStep || !!previewStep || isLoading}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Roteiro
          </Button>
        </div>
      </div>

      {/* ... existing code for preview and edit modes ... */}
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

                {/* ... existing alert card ... */}
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
                      <Label htmlFor="alertTitle">Título do Alerta</Label>
                      <Input
                        id="alertTitle"
                        value={editingStep.alert?.title || ""}
                        onChange={(e) =>
                          setEditingStep({
                            ...editingStep,
                            alert:
                              e.target.value || editingStep.alert?.message
                                ? {
                                    title: e.target.value,
                                    message: editingStep.alert?.message || "",
                                    createdAt: editingStep.alert?.createdAt || new Date(),
                                  }
                                : undefined,
                          })
                        }
                        placeholder="Ex: Atenção, Importante, Leia com cuidado..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Este título aparecerá ao lado do ícone de alerta na tela do operador
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alertMessage">Mensagem de Alerta</Label>
                      <Textarea
                        id="alertMessage"
                        value={editingStep.alert?.message || ""}
                        onChange={(e) =>
                          setEditingStep({
                            ...editingStep,
                            alert:
                              e.target.value || editingStep.alert?.title
                                ? {
                                    title: editingStep.alert?.title || "Alerta Importante",
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

                <RichTextEditorWYSIWYG
                  value={editingStep.content}
                  onChange={(content) =>
                    setEditingStep({
                      ...editingStep,
                      content,
                    })
                  }
                  placeholder="Digite o texto do roteiro. Use as ferramentas acima para aplicar formatação (negrito, itálico, cores, tamanhos, etc.) diretamente no conteúdo"
                />
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
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Roteiro
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
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
