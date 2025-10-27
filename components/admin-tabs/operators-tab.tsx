"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Circle, UserX, Plus, Edit, Trash2, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  getAllUsers,
  updateUser,
  deleteUser,
  forceLogoutUser,
  getTodayLoginSessions,
  getTodayConnectedTime,
  getCurrentUser,
  isUserOnline,
} from "@/lib/store"
import type { User } from "@/lib/types"

export function OperatorsTab() {
  const [operators, setOperators] = useState<User[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingOperator, setEditingOperator] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    const loadOperators = () => {
      const allUsers = getAllUsers()
      setOperators(allUsers.filter((u) => u.role === "operator"))
    }

    loadOperators()

    const interval = setInterval(loadOperators, 5000)

    const handleStoreUpdate = () => {
      loadOperators()
    }

    window.addEventListener("store-updated", handleStoreUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener("store-updated", handleStoreUpdate)
    }
  }, [])

  const handleOpenDialog = () => {
    setFormData({ fullName: "", username: "" })
    setIsEditMode(false)
    setEditingOperator(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (operator: User) => {
    setFormData({
      fullName: operator.fullName,
      username: operator.username,
    })
    setIsEditMode(true)
    setEditingOperator(operator)
    setIsDialogOpen(true)
  }

  const handleDelete = (operatorId: string) => {
    if (confirm("Tem certeza que deseja excluir este operador?")) {
      deleteUser(operatorId)
      toast({
        title: "Sucesso",
        description: "Operador excluído com sucesso",
      })
    }
  }

  const handleForceLogout = (operatorId: string) => {
    const currentUser = getCurrentUser()

    forceLogoutUser(operatorId)

    // If the logged out user is the current user, redirect to login
    if (currentUser && currentUser.id === operatorId) {
      window.location.href = "/"
    }

    toast({
      title: "Sucesso",
      description: "Operador deslogado com sucesso",
    })
  }

  const handleSave = () => {
    if (!formData.fullName.trim() || !formData.username.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      })
      return
    }

    if (isEditMode && editingOperator) {
      // Update existing operator
      const updatedOperator: User = {
        ...editingOperator,
        fullName: formData.fullName,
        username: formData.username,
      }
      updateUser(updatedOperator)
      toast({
        title: "Sucesso",
        description: "Operador atualizado com sucesso",
      })
    } else {
      // Check if username already exists
      if (operators.some((op) => op.username === formData.username)) {
        toast({
          title: "Erro",
          description: "Este usuário já existe",
          variant: "destructive",
        })
        return
      }

      const newOperator: User = {
        id: `op-${Date.now()}`,
        username: formData.username,
        fullName: formData.fullName,
        isOnline: false,
        role: "operator",
        createdAt: new Date(),
        loginSessions: [],
      }

      const allUsers = getAllUsers()
      allUsers.push(newOperator)
      localStorage.setItem("callcenter_users", JSON.stringify(allUsers))

      toast({
        title: "Sucesso",
        description: "Operador adicionado com sucesso",
      })
    }

    setIsDialogOpen(false)
  }

  const formatDuration = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60))
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}min`
  }

  const hasLoggedInToday = (operator: User): boolean => {
    const sessions = getTodayLoginSessions(operator.id)
    return sessions.length > 0
  }

  const handleExportReport = () => {
    // Prepare data for Excel
    const headers = ["Nome", "Quantidade Logins no Dia", "Tempo Conectado", "Último Login"]
    const rows = operators.map((operator) => {
      const todaySessions = getTodayLoginSessions(operator.id)
      const connectedTime = getTodayConnectedTime(operator.id)
      const lastLogin = operator.lastLoginAt
        ? new Date(operator.lastLoginAt).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Nunca"

      return [
        operator.fullName,
        todaySessions.length.toString(),
        connectedTime > 0 ? formatDuration(connectedTime) : "0h 0min",
        lastLogin,
      ]
    })

    // Create Excel-compatible HTML table
    const htmlTable = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Relatório Operadores</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #4472C4; color: white; font-weight: bold; padding: 8px; border: 1px solid #ddd; }
          td { padding: 8px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              ${headers.map((header) => `<th>${header}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `

    // Create blob and download as Excel file
    const blob = new Blob([htmlTable], { type: "application/vnd.ms-excel" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    const today = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")
    link.setAttribute("href", url)
    link.setAttribute("download", `relatorio-operadores-${today}.xls`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Relatório exportado",
      description: "O relatório Excel foi baixado com sucesso",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gerenciar Operadores</h2>
          <p className="text-muted-foreground mt-1">Visualize e gerencie os operadores do sistema</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExportReport} className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Exportar Relatório
          </Button>
          <Button onClick={handleOpenDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Operador
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {operators.map((operator) => {
          const todaySessions = getTodayLoginSessions(operator.id)
          const connectedTime = getTodayConnectedTime(operator.id)
          const loggedInToday = hasLoggedInToday(operator)
          const online = isUserOnline(operator.id)

          return (
            <Card key={operator.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      {operator.fullName}
                      {online ? (
                        <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                          <Circle className="h-2 w-2 fill-current animate-pulse" />
                          Online
                        </Badge>
                      ) : loggedInToday ? (
                        <Badge variant="outline" className="gap-1 text-gray-600 border-gray-600">
                          <Circle className="h-2 w-2 fill-current" />
                          Offline
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-gray-400 border-gray-400">
                          <Circle className="h-2 w-2 fill-current" />
                          Não Logou Hoje
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">@{operator.username}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(operator)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleForceLogout(operator.id)}>
                      <UserX className="h-4 w-4 mr-2" />
                      Deslogar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(operator.id)}>
                      <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Logins Hoje</p>
                    <p className="font-semibold">{todaySessions.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tempo Conectado Hoje</p>
                    <p className="font-semibold">{connectedTime > 0 ? formatDuration(connectedTime) : "0h 0min"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Último Login</p>
                    <p className="font-semibold">
                      {operator.lastLoginAt
                        ? new Date(operator.lastLoginAt).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Nunca"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Editar Operador" : "Adicionar Operador"}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Edite as informações do operador."
                : "Adicione um novo operador ao sistema. O nome será usado para exibição e o usuário para login."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Nome do operador"
              />
              <p className="text-xs text-muted-foreground">O primeiro nome será exibido na abordagem do script</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Usuário *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="nome.usuario"
              />
              <p className="text-xs text-muted-foreground">Será usado para fazer login no sistema</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>{isEditMode ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
