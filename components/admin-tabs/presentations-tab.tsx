"use client"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Trash2,
  Edit,
  FileText,
  Upload,
  Loader2,
  Eye,
  Download,
  BookOpen,
  Search,
} from "lucide-react"

interface Training {
  id: string
  title: string
  description: string
  pdfUrl: string
  pdfPathname: string
  filename: string
  fileSize: number
  isActive: boolean
  createdAt: string
  createdBy: string
}

export function PresentationsTab() {
  const { toast } = useToast()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingTraining, setEditingTraining] = useState<Training | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isActive, setIsActive] = useState(true)

  // Load trainings from localStorage
  const loadTrainings = useCallback(() => {
    try {
      const stored = localStorage.getItem("callcenter_trainings")
      if (stored) {
        setTrainings(JSON.parse(stored))
      }
    } catch (error) {
      console.error("Error loading trainings:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Save trainings to localStorage
  const saveTrainings = (newTrainings: Training[]) => {
    localStorage.setItem("callcenter_trainings", JSON.stringify(newTrainings))
    setTrainings(newTrainings)
    window.dispatchEvent(new Event("store-updated"))
  }

  useEffect(() => {
    loadTrainings()
  }, [loadTrainings])

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setSelectedFile(null)
    setIsActive(true)
    setEditingTraining(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.includes("pdf")) {
        toast({
          title: "Erro",
          description: "Apenas arquivos PDF são permitidos.",
          variant: "destructive",
        })
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "Arquivo muito grande. Máximo 10MB.",
          variant: "destructive",
        })
        return
      }
      setSelectedFile(file)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o título do treinamento.",
        variant: "destructive",
      })
      return
    }

    if (!editingTraining && !selectedFile) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo PDF.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      let pdfUrl = editingTraining?.pdfUrl || ""
      let pdfPathname = editingTraining?.pdfPathname || ""
      let filename = editingTraining?.filename || ""
      let fileSize = editingTraining?.fileSize || 0

      // Upload new file if selected
      if (selectedFile) {
        const formData = new FormData()
        formData.append("file", selectedFile)

        const response = await fetch("/api/upload-pdf", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Falha no upload")
        }

        const data = await response.json()
        pdfUrl = data.url
        pdfPathname = data.pathname
        filename = data.filename
        fileSize = data.size
      }

      if (editingTraining) {
        // Update existing training
        const updatedTrainings = trainings.map((t) =>
          t.id === editingTraining.id
            ? {
                ...t,
                title,
                description,
                pdfUrl,
                pdfPathname,
                filename,
                fileSize,
                isActive,
              }
            : t
        )
        saveTrainings(updatedTrainings)
        toast({
          title: "Sucesso",
          description: "Treinamento atualizado com sucesso.",
        })
      } else {
        // Create new training
        const newTraining: Training = {
          id: `training-${Date.now()}`,
          title,
          description,
          pdfUrl,
          pdfPathname,
          filename,
          fileSize,
          isActive,
          createdAt: new Date().toISOString(),
          createdBy: "admin",
        }
        saveTrainings([...trainings, newTraining])
        toast({
          title: "Sucesso",
          description: "Treinamento criado com sucesso.",
        })
      }

      resetForm()
      setShowDialog(false)
    } catch (error: any) {
      console.error("Error saving training:", error)
      toast({
        title: "Erro",
        description: error.message || "Falha ao salvar treinamento.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (training: Training) => {
    try {
      // Delete file from blob storage
      if (training.pdfUrl) {
        await fetch("/api/upload-pdf", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: training.pdfUrl }),
        })
      }

      const updatedTrainings = trainings.filter((t) => t.id !== training.id)
      saveTrainings(updatedTrainings)

      toast({
        title: "Sucesso",
        description: "Treinamento removido com sucesso.",
      })
    } catch (error) {
      console.error("Error deleting training:", error)
      toast({
        title: "Erro",
        description: "Falha ao remover treinamento.",
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = (training: Training) => {
    const updatedTrainings = trainings.map((t) =>
      t.id === training.id ? { ...t, isActive: !t.isActive } : t
    )
    saveTrainings(updatedTrainings)
  }

  const handleEdit = (training: Training) => {
    setEditingTraining(training)
    setTitle(training.title)
    setDescription(training.description)
    setIsActive(training.isActive)
    setSelectedFile(null)
    setShowDialog(true)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const filteredTrainings = trainings.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeCount = trainings.filter((t) => t.isActive).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-orange-500" />
            Treinamentos (PDFs)
          </h2>
          <p className="text-muted-foreground text-sm">
            Gerencie os materiais de treinamento em PDF para os operadores
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 gap-2">
              <Plus className="h-4 w-4" />
              Novo Treinamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingTraining ? "Editar Treinamento" : "Novo Treinamento"}
              </DialogTitle>
              <DialogDescription>
                {editingTraining
                  ? "Atualize as informações do treinamento"
                  : "Faça upload de um arquivo PDF para criar um novo treinamento"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Treinamento de Vendas"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o conteúdo do treinamento..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdf">
                  Arquivo PDF {!editingTraining && "*"}
                </Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-orange-500/50 transition-colors">
                  <input
                    type="file"
                    id="pdf"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="pdf" className="cursor-pointer">
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2 text-orange-500">
                        <FileText className="h-8 w-8" />
                        <div className="text-left">
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                    ) : editingTraining ? (
                      <div className="space-y-2">
                        <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Arquivo atual: <span className="font-medium">{editingTraining.filename}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Clique para substituir o arquivo
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Clique para selecionar ou arraste um arquivo PDF
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Máximo 10MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Ativo para operadores</Label>
                <Switch
                  id="active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={uploading}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{trainings.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-green-500">{activeCount}</p>
              </div>
              <Eye className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inativos</p>
                <p className="text-2xl font-bold text-muted-foreground">
                  {trainings.length - activeCount}
                </p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar treinamentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Trainings List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista de Treinamentos</CardTitle>
          <CardDescription>
            {filteredTrainings.length} treinamento(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTrainings.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Nenhum treinamento encontrado para esta pesquisa"
                  : "Nenhum treinamento cadastrado. Clique em 'Novo Treinamento' para começar."}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {filteredTrainings.map((training) => (
                  <div
                    key={training.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <FileText className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{training.title}</h4>
                          <Badge
                            variant={training.isActive ? "default" : "secondary"}
                            className={
                              training.isActive
                                ? "bg-green-500/10 text-green-600 border-green-500/30"
                                : ""
                            }
                          >
                            {training.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        {training.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {training.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{training.filename}</span>
                          <span>{formatFileSize(training.fileSize)}</span>
                          <span>
                            {new Date(training.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(training)}
                        title={training.isActive ? "Desativar" : "Ativar"}
                      >
                        {training.isActive ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        title="Visualizar PDF"
                      >
                        <a href={training.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        title="Baixar PDF"
                      >
                        <a href={training.pdfUrl} download={training.filename}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(training)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir treinamento?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. O arquivo PDF também será removido.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(training)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
