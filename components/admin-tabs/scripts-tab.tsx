"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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

export function ScriptsTab() {
  const [steps, setSteps] = useState<ScriptStep[]>(getScriptSteps())
  const [products, setProducts] = useState<Product[]>(getProducts())
  const [editingStep, setEditingStep] = useState<ScriptStep | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [previewStep, setPreviewStep] = useState<ScriptStep | null>(null)
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
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

  const updateTabulation = (field: "name" | "description", value: string) => {
    if (!editingStep) return
    setEditingStep({
      ...editingStep,
      tabulationInfo: editingStep.tabulationInfo
        ? { ...editingStep.tabulationInfo, [field]: value }
        : { id: `tab-${editingStep.id}`, name: value, description: "" },
    })
  }

  const removeTabulation = () => {
    if (!editingStep) return
    setEditingStep({
      ...editingStep,
      tabulationInfo: undefined,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gerenciar Roteiros</h2>
          <p className="text-muted-foreground mt-1">Crie e edite os scripts de atendimento com formatação avançada</p>
        </div>
        <div className="flex gap-3">
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
                <TabsTrigger value="tabulation">Tabulação</TabsTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="content">Conteúdo do Script</Label>
                  <Textarea
                    id="content"
                    value={editingStep.content}
                    onChange={(e) => setEditingStep({ ...editingStep, content: e.target.value })}
                    placeholder="Digite o texto do roteiro. Use <b> para negrito, <br> para quebra de linha, <i> para itálico."
                    rows={10}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    <strong>Placeholders disponíveis:</strong> [Nome do operador], [Primeiro nome do cliente], [Nome
                    completo do cliente]
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Formatação do Texto
                    </CardTitle>
                    <CardDescription>Configure a aparência do texto no roteiro</CardDescription>
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
                  <Label className="text-base font-semibold">Tabulação Recomendada</Label>
                  {editingStep.tabulationInfo && (
                    <Button size="sm" variant="ghost" onClick={removeTabulation}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover Tabulação
                    </Button>
                  )}
                </div>

                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tab-name">Nome da Tabulação</Label>
                      <Input
                        id="tab-name"
                        value={editingStep.tabulationInfo?.name || ""}
                        onChange={(e) => updateTabulation("name", e.target.value)}
                        placeholder="Ex: Acordo Fechado"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tab-description">Descrição / Orientação</Label>
                      <Textarea
                        id="tab-description"
                        value={editingStep.tabulationInfo?.description || ""}
                        onChange={(e) => updateTabulation("description", e.target.value)}
                        placeholder="Ex: Cliente aceitou a proposta de pagamento"
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
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
                                {step.tabulationInfo && (
                                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                                    {step.tabulationInfo.name}
                                  </span>
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
