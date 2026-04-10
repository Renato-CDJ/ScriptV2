"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Save, X, ExternalLink, Copy, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useChannels } from "@/hooks/use-supabase-admin"
import { useToast } from "@/hooks/use-toast"

interface Channel {
  id: string
  name: string
  description: string
  icon: string
  contact?: string
  isActive?: boolean
  is_active?: boolean
  created_at: string
  updated_at: string
}

export function ChannelsTab() {
  const { data: channels, loading, create, update, remove } = useChannels()
  const { toast } = useToast()
  const [editingItem, setEditingItem] = useState<Partial<Channel> | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  const mappedChannels = useMemo(
    () => (channels || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description || "",
      icon: c.icon || "phone",
      contact: c.icon || "",
      isActive: c.is_active,
      created_at: c.created_at,
      updated_at: c.updated_at,
    })),
    [channels],
  )

  const handleEdit = (item: Channel) => {
    setEditingItem({ ...item, contact: item.icon })
    setIsCreating(false)
  }

  const handleCreate = () => {
    setEditingItem({
      name: "",
      description: "",
      icon: "phone",
      is_active: true,
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
          icon: editingItem.contact || editingItem.icon || "phone",
          is_active: editingItem.is_active !== false,
        })
        if (error) throw new Error(error)
        toast({
          title: "Canal criado",
          description: "O novo canal foi criado com sucesso.",
        })
      } else if (editingItem.id) {
        const { error } = await update(editingItem.id, {
          name: editingItem.name,
          description: editingItem.description,
          icon: editingItem.contact || editingItem.icon || "phone",
          is_active: editingItem.is_active,
        })
        if (error) throw new Error(error)
        toast({
          title: "Canal atualizado",
          description: "As alteracoes foram salvas com sucesso.",
        })
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao salvar canal",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
      setEditingItem(null)
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este canal?")) {
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
        title: "Canal excluido",
        description: "O canal foi removido com sucesso.",
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

  const isUrl = (text: string | undefined) => {
    if (!text) return false
    return text.startsWith("http://") || text.startsWith("https://")
  }

  const handleCopy = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      toast({
        title: "Copiado!",
        description: "Contato copiado para a área de transferência.",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Canais de Atendimento</h2>
          <p className="text-muted-foreground mt-1">Gerencie os canais disponíveis para contato</p>
        </div>
        <Button
          onClick={handleCreate}
          disabled={!!editingItem}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Canal
        </Button>
      </div>

      {editingItem ? (
        <Card>
          <CardHeader>
            <CardTitle>{isCreating ? "Criar Novo Canal" : "Editar Canal"}</CardTitle>
            <CardDescription>Configure os detalhes do canal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Canal</Label>
              <Textarea
                id="name"
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                placeholder="Ex: WhatsApp Suporte"
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Número ou Link</Label>
              <Textarea
                id="contact"
                value={editingItem.contact || ""}
                onChange={(e) => setEditingItem({ ...editingItem, contact: e.target.value })}
                placeholder="Ex: (11) 98765-4321 ou https://wa.me/5511987654321"
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Pode ser um número de telefone, link do WhatsApp, e-mail ou URL. Use Enter para quebrar linha.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="active">Canal Ativo</Label>
                <p className="text-sm text-muted-foreground">Permitir uso deste canal</p>
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mappedChannels.map((channel) => (
            <Card key={channel.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <CardTitle className="text-lg text-balance break-words">{channel.name}</CardTitle>
                      {channel.isActive ? (
                        <Badge variant="outline" className="text-green-600 border-green-600 shrink-0">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600 border-gray-600 shrink-0">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    {channel.contact && (
                      <div className="flex items-start gap-2 mt-3">
                        <code className="text-sm bg-muted px-2 py-1 rounded flex-1 break-all whitespace-pre-wrap">
                          {channel.contact}
                        </code>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleCopy(channel.contact || "")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          {isUrl(channel.contact) && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => window.open(channel.contact, "_blank")}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(channel)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(channel.id)}>
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
