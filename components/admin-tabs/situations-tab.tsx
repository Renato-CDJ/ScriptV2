"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Save, X, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getSituations } from "@/lib/store"
import type { ServiceSituation } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export function SituationsTab() {
  const [situations, setSituations] = useState<ServiceSituation[]>(getSituations())
  const [editingItem, setEditingItem] = useState<ServiceSituation | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const handleStoreUpdate = () => {
      setSituations(getSituations())
    }
    window.addEventListener("store-updated", handleStoreUpdate)
    return () => window.removeEventListener("store-updated", handleStoreUpdate)
  }, [])

  const handleEdit = (item: ServiceSituation) => {
    setEditingItem({ ...item })
    setIsCreating(false)
  }

  const handleCreate = () => {
    const newItem: ServiceSituation = {
      id: `sit-${Date.now()}`,
      name: "",
      description: "",
      isActive: true,
      createdAt: new Date(),
    }
    setEditingItem(newItem)
    setIsCreating(true)
  }

  const handleSave = () => {
    if (!editingItem) return

    if (isCreating) {
      const newSituations = [...situations, editingItem]
      localStorage.setItem("callcenter_situations", JSON.stringify(newSituations))
      setSituations(newSituations)
      toast({
        title: "Situação criada",
        description: "A nova situação foi criada com sucesso.",
      })
    } else {
      const updatedSituations = situations.map((s) => (s.id === editingItem.id ? editingItem : s))
      localStorage.setItem("callcenter_situations", JSON.stringify(updatedSituations))
      setSituations(updatedSituations)
      toast({
        title: "Situação atualizada",
        description: "As alterações foram salvas com sucesso.",
      })
    }

    localStorage.setItem("callcenter_last_update", Date.now().toString())
    window.dispatchEvent(new CustomEvent("store-updated"))

    setEditingItem(null)
    setIsCreating(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta situação?")) {
      const updatedSituations = situations.filter((s) => s.id !== id)
      localStorage.setItem("callcenter_situations", JSON.stringify(updatedSituations))
      setSituations(updatedSituations)

      localStorage.setItem("callcenter_last_update", Date.now().toString())
      window.dispatchEvent(new CustomEvent("store-updated"))

      toast({
        title: "Situação excluída",
        description: "A situação foi removida com sucesso.",
      })
    }
  }

  const handleCancel = () => {
    setEditingItem(null)
    setIsCreating(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Situações de Atendimento</h2>
          <p className="text-muted-foreground mt-1">Configure as situações que podem ocorrer durante o atendimento</p>
        </div>
        <Button
          onClick={handleCreate}
          disabled={!!editingItem}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Situação
        </Button>
      </div>

      {editingItem ? (
        <Card>
          <CardHeader>
            <CardTitle>{isCreating ? "Criar Nova Situação" : "Editar Situação"}</CardTitle>
            <CardDescription>Configure os detalhes da situação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Título da Situação</Label>
              <Input
                id="name"
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                placeholder="Ex: EM CASOS DE FALÊNCIA/CONCORDATA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={editingItem.description}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                placeholder="Descreva o que fazer nesta situação"
                rows={5}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="active">Status Ativo</Label>
                <p className="text-sm text-muted-foreground">Permitir que operadores vejam esta situação</p>
              </div>
              <Switch
                id="active"
                checked={editingItem.isActive}
                onCheckedChange={(checked) => setEditingItem({ ...editingItem, isActive: checked })}
              />
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
        <div className="space-y-3">
          {situations.map((situation) => (
            <Card
              key={situation.id}
              className="cursor-pointer hover:shadow-md transition-all bg-card hover:bg-accent/50"
              onClick={() => setExpandedId(expandedId === situation.id ? null : situation.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex items-center gap-3">
                    <CardTitle className="text-base font-bold uppercase text-foreground">{situation.name}</CardTitle>
                    {situation.isActive && (
                      <Badge
                        variant="outline"
                        className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-400"
                      >
                        Ativo
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(situation)
                      }}
                      className="hover:bg-accent"
                    >
                      <Edit className="h-4 w-4 text-foreground" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(situation.id)
                      }}
                      className="hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <ChevronRight
                      className={`h-5 w-5 text-orange-500 dark:text-orange-400 transition-transform ${
                        expandedId === situation.id ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                </div>
              </CardHeader>
              {expandedId === situation.id && (
                <CardContent className="pt-0 pb-4">
                  <div className="pl-4 border-l-2 border-orange-500 dark:border-orange-400">
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{situation.description}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
