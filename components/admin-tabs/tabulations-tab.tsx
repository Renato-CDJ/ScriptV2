"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Save, X, Loader2 } from "lucide-react"
import { getTabulations, createTabulation, updateTabulation, deleteTabulation } from "@/lib/store"
import type { Tabulation } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export function TabulationsTab() {
  const [tabulations, setTabulations] = useState<Tabulation[]>([])
  const [editingItem, setEditingItem] = useState<Tabulation | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getTabulations()
      setTabulations(data)
    } catch (error) {
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar as tabulações.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (item: Tabulation) => {
    setEditingItem({ ...item })
    setIsCreating(false)
  }

  const handleCreate = () => {
    const newItem: Tabulation = {
      id: "",
      name: "",
      description: "",
      color: "#3b82f6",
      createdAt: new Date(),
    }
    setEditingItem(newItem)
    setIsCreating(true)
  }

  const handleSave = async () => {
    if (!editingItem) return

    try {
      setIsLoading(true)
      if (isCreating) {
        await createTabulation(editingItem)
        toast({
          title: "Tabulação criada",
          description: "A nova tabulação foi criada com sucesso.",
        })
      } else {
        await updateTabulation(editingItem)
        toast({
          title: "Tabulação atualizada",
          description: "As alterações foram salvas com sucesso.",
        })
      }

      await loadData()
      setEditingItem(null)
      setIsCreating(false)
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar a tabulação.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta tabulação?")) {
      try {
        setIsLoading(true)
        await deleteTabulation(id)
        await loadData()
        toast({
          title: "Tabulação excluída",
          description: "A tabulação foi removida com sucesso.",
        })
      } catch (error) {
        toast({
          title: "Erro ao excluir",
          description: "Ocorreu um erro ao excluir a tabulação.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleCancel = () => {
    setEditingItem(null)
    setIsCreating(false)
  }

  if (isLoading && !tabulations.length) {
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
          <h2 className="text-3xl font-bold">Tabulações</h2>
          <p className="text-muted-foreground mt-1">Gerencie as categorias de finalização de atendimento</p>
        </div>
        <Button
          onClick={handleCreate}
          disabled={!!editingItem || isLoading}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Tabulação
        </Button>
      </div>

      {editingItem ? (
        <Card>
          <CardHeader>
            <CardTitle>{isCreating ? "Criar Nova Tabulação" : "Editar Tabulação"}</CardTitle>
            <CardDescription>Configure os detalhes da tabulação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                placeholder="Ex: Acordo Fechado"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={editingItem.description}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                placeholder="Descreva quando usar esta tabulação"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={editingItem.color}
                  onChange={(e) => setEditingItem({ ...editingItem, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={editingItem.color}
                  onChange={(e) => setEditingItem({ ...editingItem, color: e.target.value })}
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tabulations.map((tab) => (
            <Card key={tab.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tab.color }} />
                    <div>
                      <CardTitle>{tab.name}</CardTitle>
                      <CardDescription className="mt-1 whitespace-pre-wrap">{tab.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(tab)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(tab.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
