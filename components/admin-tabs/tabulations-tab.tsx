"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Save, X, Loader2 } from "lucide-react"
import { useTabulations } from "@/hooks/use-supabase-admin"
import { useToast } from "@/hooks/use-toast"

interface Tabulation {
  id: string
  name: string
  description: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export function TabulationsTab() {
  const { data: tabulations, loading, create, update, remove } = useTabulations()
  const [editingItem, setEditingItem] = useState<Partial<Tabulation> | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleEdit = (item: Tabulation) => {
    setEditingItem({ ...item })
    setIsCreating(false)
  }

  const handleCreate = () => {
    setEditingItem({
      name: "",
      description: "",
      color: "#3b82f6",
    })
    setIsCreating(true)
  }

  const handleSave = async () => {
    if (!editingItem || !editingItem.name) return

    setSaving(true)
    try {
      if (isCreating) {
        const { error } = await create({
          name: editingItem.name,
          description: editingItem.description || "",
          color: editingItem.color || "#3b82f6",
          is_active: true,
        })
        if (error) throw new Error(error)
        toast({
          title: "Tabulacao criada",
          description: "A nova tabulacao foi criada com sucesso.",
        })
      } else if (editingItem.id) {
        const { error } = await update(editingItem.id, {
          name: editingItem.name,
          description: editingItem.description,
          color: editingItem.color,
        })
        if (error) throw new Error(error)
        toast({
          title: "Tabulacao atualizada",
          description: "As alteracoes foram salvas com sucesso.",
        })
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao salvar tabulacao",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
      setEditingItem(null)
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta tabulacao?")) {
      const { error } = await remove(id)
      if (error) {
        toast({
          title: "Erro",
          description: error,
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Tabulacao excluida",
        description: "A tabulacao foi removida com sucesso.",
      })
    }
  }

  const handleCancel = () => {
    setEditingItem(null)
    setIsCreating(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
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
          disabled={!!editingItem}
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
              <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-white">
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              <Button variant="outline" onClick={handleCancel}>
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
