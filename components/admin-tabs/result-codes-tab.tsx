"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
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
import {
  getResultCodes,
  createResultCode,
  updateResultCode,
  deleteResultCode,
} from "@/lib/store"
import type { ResultCode } from "@/lib/types"
import {
  ListChecks,
  Plus,
  Trash2,
  Edit,
  Search,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function ResultCodesTab() {
  const [resultCodes, setResultCodes] = useState<ResultCode[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPhase, setFilterPhase] = useState<"all" | "before" | "after">("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCode, setEditingCode] = useState<ResultCode | null>(null)
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formPhase, setFormPhase] = useState<"before" | "after">("before")
  const { toast } = useToast()

  const loadData = useCallback(() => {
    setResultCodes(getResultCodes())
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const handleStoreUpdate = () => loadData()
    window.addEventListener("store-updated", handleStoreUpdate)
    return () => window.removeEventListener("store-updated", handleStoreUpdate)
  }, [loadData])

  const filteredCodes = useMemo(() => {
    return resultCodes
      .filter((c) => {
        if (filterPhase !== "all" && c.phase !== filterPhase) return false
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          return (
            c.name.toLowerCase().includes(query) || c.description.toLowerCase().includes(query)
          )
        }
        return true
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [resultCodes, searchQuery, filterPhase])

  const beforeCount = resultCodes.filter((c) => c.phase === "before").length
  const afterCount = resultCodes.filter((c) => c.phase === "after").length

  const resetForm = () => {
    setFormName("")
    setFormDescription("")
    setFormPhase("before")
    setEditingCode(null)
  }

  const handleCreate = () => {
    if (!formName.trim()) {
      toast({ title: "Erro", description: "O nome e obrigatorio.", variant: "destructive" })
      return
    }

    createResultCode({
      name: formName.trim(),
      description: formDescription.trim(),
      phase: formPhase,
      isActive: true,
    })

    toast({ title: "Sucesso", description: "Codigo de resultado criado." })
    resetForm()
    setShowCreateDialog(false)
    loadData()
  }

  const handleUpdate = () => {
    if (!editingCode) return
    if (!formName.trim()) {
      toast({ title: "Erro", description: "O nome e obrigatorio.", variant: "destructive" })
      return
    }

    updateResultCode(editingCode.id, {
      name: formName.trim(),
      description: formDescription.trim(),
      phase: formPhase,
    })

    toast({ title: "Sucesso", description: "Codigo de resultado atualizado." })
    resetForm()
    loadData()
  }

  const handleDelete = (id: string) => {
    deleteResultCode(id)
    toast({ title: "Sucesso", description: "Codigo de resultado removido." })
    loadData()
  }

  const handleToggleActive = (code: ResultCode) => {
    updateResultCode(code.id, { isActive: !code.isActive })
    loadData()
  }

  const startEdit = (code: ResultCode) => {
    setEditingCode(code)
    setFormName(code.name)
    setFormDescription(code.description)
    setFormPhase(code.phase)
  }

  const cancelEdit = () => {
    resetForm()
  }

  const formFields = (isEdit: boolean) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-code-name" : "create-code-name"} className="text-sm font-medium">
          Nome da Tabulacao
        </Label>
        <Input
          id={isEdit ? "edit-code-name" : "create-code-name"}
          placeholder="Ex: Sem Interesse"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-code-desc" : "create-code-desc"} className="text-sm font-medium">
          Descricao
        </Label>
        <Textarea
          id={isEdit ? "edit-code-desc" : "create-code-desc"}
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
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Salvar Alteracoes
            </Button>
          </>
        ) : (
          <Button
            onClick={handleCreate}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
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
                        {code.phase === "before" ? (
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
                          checked={code.isActive}
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
