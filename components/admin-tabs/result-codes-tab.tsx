"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useResultCodes } from "@/hooks/use-supabase-admin"
import {
  ListChecks,
  Plus,
  Trash2,
  Edit,
  Search,
  ShieldCheck,
  ShieldAlert,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ResultCode {
  id: string
  code: string
  name: string
  description: string
  category: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export function ResultCodesTab() {
  const { data: resultCodes, loading, create, update, remove } = useResultCodes()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPhase, setFilterPhase] = useState<"all" | "before" | "after">("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCode, setEditingCode] = useState<ResultCode | null>(null)
  const [formCode, setFormCode] = useState("")
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formPhase, setFormPhase] = useState<"before" | "after">("before")
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const filteredCodes = useMemo(() => {
    return resultCodes
      .filter((c) => {
        if (filterPhase !== "all" && c.category !== filterPhase) return false
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          return (
            c.name.toLowerCase().includes(query) || 
            c.code?.toLowerCase().includes(query) ||
            c.description?.toLowerCase().includes(query)
          )
        }
        return true
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [resultCodes, searchQuery, filterPhase])

  const beforeCount = resultCodes.filter((c) => c.category === "before").length
  const afterCount = resultCodes.filter((c) => c.category === "after").length

  const resetForm = () => {
    setFormCode("")
    setFormName("")
    setFormDescription("")
    setFormPhase("before")
    setEditingCode(null)
  }

  const handleCreate = async () => {
    if (!formName.trim()) {
      toast({ title: "Erro", description: "O nome e obrigatorio.", variant: "destructive" })
      return
    }

    setSaving(true)
    const { error } = await create({
      code: formCode.trim() || `TAB-${Date.now()}`,
      name: formName.trim(),
      description: formDescription.trim(),
      category: formPhase,
      color: formPhase === "before" ? "#f59e0b" : "#22c55e",
      is_active: true,
    })

    if (error) {
      toast({ title: "Erro", description: error, variant: "destructive" })
    } else {
      toast({ title: "Sucesso", description: "Tabulacao criada com sucesso." })
      resetForm()
      setShowCreateDialog(false)
    }
    setSaving(false)
  }

  const handleUpdate = async () => {
    if (!editingCode) return
    if (!formName.trim()) {
      toast({ title: "Erro", description: "O nome e obrigatorio.", variant: "destructive" })
      return
    }

    setSaving(true)
    const { error } = await update(editingCode.id, {
      code: formCode.trim(),
      name: formName.trim(),
      description: formDescription.trim(),
      category: formPhase,
      color: formPhase === "before" ? "#f59e0b" : "#22c55e",
    })

    if (error) {
      toast({ title: "Erro", description: error, variant: "destructive" })
    } else {
      toast({ title: "Sucesso", description: "Tabulacao atualizada." })
      resetForm()
      setEditingCode(null)
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta tabulacao?")) return
    
    const { error } = await remove(id)
    if (error) {
      toast({ title: "Erro", description: error, variant: "destructive" })
    } else {
      toast({ title: "Sucesso", description: "Tabulacao excluida." })
    }
  }

  const handleToggleActive = async (code: ResultCode) => {
    await update(code.id, { is_active: !code.is_active })
  }

  const startEdit = (code: ResultCode) => {
    setEditingCode(code)
    setFormCode(code.code || "")
    setFormName(code.name)
    setFormDescription(code.description || "")
    setFormPhase(code.category === "after" ? "after" : "before")
  }

  const cancelEdit = () => {
    resetForm()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  const formFields = (isEdit: boolean) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Nome da Tabulacao</Label>
        <Input
          placeholder="Ex: Sem Interesse"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Descricao</Label>
        <Textarea
          placeholder="Descricao da tabulacao..."
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Fase</Label>
        <Select value={formPhase} onValueChange={(v: "before" | "after") => setFormPhase(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="before">
              <span className="flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                Antes da Identificacao Positiva
              </span>
            </SelectItem>
            <SelectItem value="after">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                Apos Identificacao Positiva
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {isEdit ? (
          <>
            <Button variant="outline" onClick={cancelEdit}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar Alteracoes
            </Button>
          </>
        ) : (
          <Button
            onClick={handleCreate}
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Criar Tabulacao
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-orange-500" />
            Codigos de Resultado
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as tabulacoes antes e apos a identificacao positiva
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => {
                resetForm()
                setShowCreateDialog(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Tabulacao
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Tabulacao</DialogTitle>
              <DialogDescription>
                Adicione uma nova tabulacao para codigos de resultado
              </DialogDescription>
            </DialogHeader>
            {formFields(false)}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{resultCodes.length}</p>
              </div>
              <ListChecks className="h-8 w-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Antes da ID Positiva</p>
                <p className="text-2xl font-bold text-amber-500">{beforeCount}</p>
              </div>
              <ShieldAlert className="h-8 w-8 text-amber-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Apos ID Positiva</p>
                <p className="text-2xl font-bold text-green-500">{afterCount}</p>
              </div>
              <ShieldCheck className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar tabulacao..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={filterPhase}
              onValueChange={(v: "all" | "before" | "after") => setFilterPhase(v)}
            >
              <SelectTrigger className="w-full sm:w-[260px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as fases</SelectItem>
                <SelectItem value="before">Antes da Identificacao Positiva</SelectItem>
                <SelectItem value="after">Apos Identificacao Positiva</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form (inline) */}
      {editingCode && (
        <Card className="border-orange-500/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Edit className="h-4 w-4 text-orange-500" />
              Editando: {editingCode.name}
            </CardTitle>
            <CardDescription>Altere os dados da tabulacao abaixo</CardDescription>
          </CardHeader>
          <CardContent>
            {formFields(true)}
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredCodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                <ListChecks className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">
                {resultCodes.length === 0
                  ? "Nenhuma tabulacao cadastrada"
                  : "Nenhum resultado para os filtros"}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-xs font-semibold min-w-[150px]">Nome</TableHead>
                    <TableHead className="text-xs font-semibold min-w-[200px]">
                      Descricao
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-center min-w-[200px]">
                      Fase
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-center min-w-[80px]">
                      Ativo
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right min-w-[100px] pr-4">
                      Acoes
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCodes.map((code) => (
                    <TableRow key={code.id} className="hover:bg-muted/20">
                      <TableCell className="py-3">
                        <span className="text-sm font-medium text-foreground">{code.name}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-sm text-muted-foreground line-clamp-2">
                          {code.description || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        {code.category === "before" ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          >
                            <ShieldAlert className="h-3 w-3 mr-1" />
                            Antes da ID Positiva
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30"
                          >
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Apos ID Positiva
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <Switch
                          checked={code.is_active}
                          onCheckedChange={() => handleToggleActive(code)}
                        />
                      </TableCell>
                      <TableCell className="py-3 text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEdit(code)}
                            className="h-8 w-8 hover:text-orange-500"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(code.id)}
                            className="h-8 w-8 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
