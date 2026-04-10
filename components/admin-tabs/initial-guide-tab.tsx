"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, FileText } from "lucide-react"
import { getContracts, addContract, updateContract, deleteContract } from "@/lib/store"
import type { Contract } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"

export function InitialGuideTab() {
  const [contracts, setContracts] = useState<Contract[]>(getContracts())
  const [showDialog, setShowDialog] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  })
  const { toast } = useToast()

  const refreshContracts = () => {
    setContracts(getContracts())
  }

  const handleOpenDialog = (contract?: Contract) => {
    if (contract) {
      setEditingContract(contract)
      setFormData({
        name: contract.name,
        description: contract.description,
        isActive: contract.isActive,
      })
    } else {
      setEditingContract(null)
      setFormData({ name: "", description: "", isActive: true })
    }
    setShowDialog(true)
  }

  const handleSave = () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    if (editingContract) {
      updateContract(editingContract.id, formData)
      toast({
        title: "Sucesso",
        description: "Contrato atualizado com sucesso",
      })
    } else {
      addContract(formData)
      toast({
        title: "Sucesso",
        description: "Contrato adicionado com sucesso",
      })
    }

    setShowDialog(false)
    refreshContracts()
  }

  const handleDelete = (id: string) => {
    deleteContract(id)
    toast({
      title: "Sucesso",
      description: "Contrato removido com sucesso",
    })
    setDeleteConfirm(null)
    refreshContracts()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Guia Inicial</h1>
          <p className="text-muted-foreground mt-1">Gerencie os contratos e informações para operadores</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Contrato
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contratos Disponíveis
          </CardTitle>
          <CardDescription>Lista de contratos e suas descrições para os operadores</CardDescription>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum contrato cadastrado</p>
              <p className="text-sm mt-2">Clique em &quot;Adicionar Contrato&quot; para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contracts.map((contract) => (
                <Card key={contract.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{contract.name}</h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              contract.isActive
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {contract.isActive ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contract.description}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="icon" onClick={() => handleOpenDialog(contract)} title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setDeleteConfirm(contract.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingContract ? "Editar Contrato" : "Adicionar Contrato"}</DialogTitle>
            <DialogDescription>Preencha as informações do contrato para os operadores</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Contrato *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: CRÉDITO DIRETO CAIXA - CDC"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição detalhada do contrato..."
                rows={6}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Contrato Ativo</Label>
              <Switch
                id="active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
              {editingContract ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
