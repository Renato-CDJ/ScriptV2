"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Save, X, Eye, Upload } from "lucide-react"
import { getScriptSteps, updateScriptStep, createScriptStep, deleteScriptStep, importScriptFromJson } from "@/lib/store"
import type { ScriptStep, ScriptButton } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { AdminScriptPreview } from "@/components/admin-script-preview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ScriptsTab() {
  const [steps, setSteps] = useState<ScriptStep[]>(getScriptSteps())
  const [editingStep, setEditingStep] = useState<ScriptStep | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [previewStep, setPreviewStep] = useState<ScriptStep | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const handleStoreUpdate = () => {
      console.log("[v0] Store updated, refreshing scripts")
      refreshSteps()
    }

    window.addEventListener("store-updated", handleStoreUpdate)
    return () => window.removeEventListener("store-updated", handleStoreUpdate)
  }, [])

  const refreshSteps = () => {
    setSteps(getScriptSteps())
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

        console.log("[v0] Importing script data:", data)

        // Script files have "marcas" property, phraseology files have "fraseologias" property
        const isPhraseology = data.fraseologias && !data.marcas

        if (isPhraseology) {
          toast({
            title: "Arquivo de fraseologia detectado",
            description: "Por favor, use a aba 'Fraseologias' para importar arquivos de fraseologia.",
            variant: "destructive",
          })
          return
        }

        // Import using the new function
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
        console.error("[v0] Import error:", error)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gerenciar Roteiros</h2>
          <p className="text-muted-foreground mt-1">Crie e edite os scripts de atendimento</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleImportScript}
            disabled={!!editingStep || !!previewStep}
            className="border-orange-500 text-orange-500 hover:bg-orange-50 bg-transparent"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar Script JSON
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!!editingStep || !!previewStep}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Roteiro
          </Button>
        </div>
      </div>

      {previewStep ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Visualização do Roteiro</h3>
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
        <Card className="border-orange-200">
          <CardHeader className="bg-orange-50 dark:bg-orange-950">
            <CardTitle>{isCreating ? "Criar Novo Roteiro" : "Editar Roteiro"}</CardTitle>
            <CardDescription>Configure o roteiro e seus botões de navegação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                <TabsTrigger value="buttons">Botões ({editingStep.buttons.length})</TabsTrigger>
                <TabsTrigger value="tabulation">Tabulação</TabsTrigger>
                <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
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
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Placeholders disponíveis: [Nome do operador], [Primeiro nome do cliente], [Nome completo do cliente]
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="buttons" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <Label>Botões de Navegação</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addButton}
                    className="border-orange-500 text-orange-500 bg-transparent"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar Botão
                  </Button>
                </div>

                {editingStep.buttons.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <p>Nenhum botão adicionado ainda.</p>
                      <p className="text-sm mt-1">Clique em "Adicionar Botão" para criar o primeiro.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {editingStep.buttons.map((button, index) => (
                      <Card key={button.id} className="border-2 border-orange-100">
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
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
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`primary-${index}`}
                                    checked={button.primary || false}
                                    onChange={(e) => updateButton(index, "primary", e.target.checked)}
                                    className="rounded"
                                  />
                                  <Label htmlFor={`primary-${index}`} className="text-sm font-normal cursor-pointer">
                                    Botão Principal (laranja)
                                  </Label>
                                </div>
                              </div>
                              <Button size="sm" variant="ghost" onClick={() => removeButton(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tabulation" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <Label>Tabulação Recomendada</Label>
                  {editingStep.tabulationInfo && (
                    <Button size="sm" variant="ghost" onClick={removeTabulation} className="text-destructive">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remover Tabulação
                    </Button>
                  )}
                </div>

                <Card className="border-2 border-green-100">
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tab-name">Nome da Tabulação</Label>
                      <Input
                        id="tab-name"
                        value={editingStep.tabulationInfo?.name || ""}
                        onChange={(e) => updateTabulation("name", e.target.value)}
                        placeholder="Ex: Acordo Fechado"
                      />
                      <p className="text-xs text-muted-foreground">
                        Nome que aparecerá quando o operador verificar a tabulação
                      </p>
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
                      <p className="text-xs text-muted-foreground">
                        Orientação adicional para o operador sobre quando usar esta tabulação
                      </p>
                    </div>

                    {!editingStep.tabulationInfo && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        Preencha os campos acima para adicionar uma tabulação recomendada para esta tela
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <div className="rounded-lg border-2 border-dashed p-6 bg-muted/20">
                  <AdminScriptPreview step={editingStep} />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
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
        <div className="grid gap-4">
          {steps
            .sort((a, b) => a.order - b.order)
            .map((step) => (
              <Card key={step.id} className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">
                          {step.id}
                        </span>
                        {step.tabulationInfo && (
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                            {step.tabulationInfo.name}
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-xl">{step.title}</CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">
                        {step.content.replace(/<[^>]*>/g, "")}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => handlePreview(step)} title="Visualizar">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(step)} title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(step.id)} title="Excluir">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {step.buttons.map((btn) => (
                      <div
                        key={btn.id}
                        className={`text-xs px-3 py-1 rounded-full ${
                          btn.primary
                            ? "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 font-semibold"
                            : "bg-muted"
                        }`}
                      >
                        {btn.label}
                        {btn.nextStepId && <span className="ml-1 opacity-60">→</span>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  )
}
