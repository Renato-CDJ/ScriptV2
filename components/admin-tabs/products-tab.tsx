"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Trash2, Package } from "lucide-react"
import { getProducts, createProduct, updateProduct, deleteProduct, getScriptSteps } from "@/lib/store"
import type { Product } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    scriptId: "",
    category: "habitacional" as "habitacional" | "comercial" | "outros",
    attendanceTypes: [] as ("ativo" | "receptivo")[],
    personTypes: [] as ("fisica" | "juridica")[],
  })
  const { toast } = useToast()

  useEffect(() => {
    loadProducts()
    const handleStoreUpdate = () => loadProducts()
    window.addEventListener("store-updated", handleStoreUpdate)
    return () => window.removeEventListener("store-updated", handleStoreUpdate)
  }, [])

  const loadProducts = () => {
    setProducts(getProducts())
  }

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        scriptId: product.scriptId,
        category: product.category,
        attendanceTypes: product.attendanceTypes || [],
        personTypes: product.personTypes || [],
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: "",
        scriptId: "",
        category: "habitacional",
        attendanceTypes: [],
        personTypes: [],
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.name.trim() || !formData.scriptId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    if (formData.attendanceTypes.length === 0 || formData.personTypes.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um tipo de atendimento e um tipo de pessoa",
        variant: "destructive",
      })
      return
    }

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        ...formData,
      })
      toast({
        title: "Sucesso",
        description: "Produto atualizado com sucesso",
      })
    } else {
      createProduct({
        ...formData,
        isActive: true,
      })
      toast({
        title: "Sucesso",
        description: "Produto criado com sucesso",
      })
    }

    setIsDialogOpen(false)
    loadProducts()
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      deleteProduct(id)
      toast({
        title: "Sucesso",
        description: "Produto excluído com sucesso",
      })
      loadProducts()
    }
  }

  const toggleAttendanceType = (type: "ativo" | "receptivo") => {
    setFormData((prev) => ({
      ...prev,
      attendanceTypes: prev.attendanceTypes.includes(type)
        ? prev.attendanceTypes.filter((t) => t !== type)
        : [...prev.attendanceTypes, type],
    }))
  }

  const togglePersonType = (type: "fisica" | "juridica") => {
    setFormData((prev) => ({
      ...prev,
      personTypes: prev.personTypes.includes(type)
        ? prev.personTypes.filter((t) => t !== type)
        : [...prev.personTypes, type],
    }))
  }

  const scriptSteps = getScriptSteps()
  const startSteps = scriptSteps.filter((step) => step.order === 1 || step.title.toLowerCase().includes("início"))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gerenciar Produtos</h2>
          <p className="text-muted-foreground mt-1">Configure os produtos e onde eles devem aparecer</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Produto
        </Button>
      </div>

      <div className="grid gap-4">
        {products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nenhum produto cadastrado ainda.
                <br />
                Clique em "Adicionar Produto" para começar.
              </p>
            </CardContent>
          </Card>
        ) : (
          products.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {product.name}
                    </CardTitle>
                    <CardDescription>
                      Categoria: {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(product)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-semibold mb-2">Aparece em:</p>
                  <div className="flex flex-wrap gap-2">
                    {product.attendanceTypes?.map((type) => (
                      <Badge key={type} variant="secondary">
                        Atendimento {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Badge>
                    ))}
                    {product.personTypes?.map((type) => (
                      <Badge key={type} variant="secondary">
                        Pessoa {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar Produto" : "Adicionar Produto"}</DialogTitle>
            <DialogDescription>Configure o produto e determine onde ele deve aparecer no sistema</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: HABITACIONAL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scriptId">Script Inicial *</Label>
              <Select
                value={formData.scriptId}
                onValueChange={(value) => setFormData({ ...formData, scriptId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o script inicial" />
                </SelectTrigger>
                <SelectContent>
                  {startSteps.map((step) => (
                    <SelectItem key={step.id} value={step.id}>
                      {step.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="habitacional">Habitacional</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Tipo de Atendimento *</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ativo"
                    checked={formData.attendanceTypes.includes("ativo")}
                    onCheckedChange={() => toggleAttendanceType("ativo")}
                  />
                  <label htmlFor="ativo" className="text-sm font-medium cursor-pointer">
                    Atendimento Ativo
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="receptivo"
                    checked={formData.attendanceTypes.includes("receptivo")}
                    onCheckedChange={() => toggleAttendanceType("receptivo")}
                  />
                  <label htmlFor="receptivo" className="text-sm font-medium cursor-pointer">
                    Atendimento Receptivo
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Tipo de Pessoa *</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fisica"
                    checked={formData.personTypes.includes("fisica")}
                    onCheckedChange={() => togglePersonType("fisica")}
                  />
                  <label htmlFor="fisica" className="text-sm font-medium cursor-pointer">
                    Pessoa Física
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="juridica"
                    checked={formData.personTypes.includes("juridica")}
                    onCheckedChange={() => togglePersonType("juridica")}
                  />
                  <label htmlFor="juridica" className="text-sm font-medium cursor-pointer">
                    Pessoa Jurídica
                  </label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
