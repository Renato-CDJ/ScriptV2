"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
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
import { UserX, Plus, Edit, Trash2, Download, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  getAllUsers,
  updateUser,
  deleteUser,
  forceLogoutUser,
  getTodayLoginSessions,
  getTodayConnectedTime,
  getCurrentUser,
  saveImmediately,
  STORAGE_KEYS,
  cleanupDuplicateUsers,
} from "@/lib/store"
import type { User } from "@/lib/types"
import * as XLSX from "xlsx"

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
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadOperators = () => {
      const allUsers = getAllUsers()
      const ops = allUsers.filter((u) => u.role === "operator")
      console.log("[v0] Operators tab loaded:", ops.length, "operators, Total users:", allUsers.length)
      setOperators(ops)
    }

    loadOperators()

    const cleanup = cleanupDuplicateUsers()
    if (cleanup.removed > 0) {
      toast({
        title: "Duplicatas Removidas",
        description: `${cleanup.removed} usuário(s) duplicado(s) foram removidos automaticamente`,
      })
      loadOperators()
    }

    const interval = setInterval(loadOperators, 3000)

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

    if (currentUser && currentUser.id === operatorId) {
      if (!confirm("Você está prestes a fazer logout de sua própria sessão. Deseja continuar?")) {
        return
      }
    }

    forceLogoutUser(operatorId)

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

    const normalizeUsername = (username: string): string => {
      return username.toLowerCase().trim().replace(/\s+/g, "")
    }

    if (isEditMode && editingOperator) {
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
      const allUsers = getAllUsers()
      const normalizedNew = normalizeUsername(formData.username)
      const existingUser = allUsers.find((u) => normalizeUsername(u.username) === normalizedNew)

      if (existingUser) {
        toast({
          title: "Erro",
          description: `Usuário "${existingUser.username}" já existe no sistema`,
          variant: "destructive",
        })
        return
      }

      const newOperator: User = {
        id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        username: formData.username.trim(),
        fullName: formData.fullName.trim(),
        isOnline: false,
        role: "operator",
        createdAt: new Date(),
        loginSessions: [],
        permissions: {
          dashboard: true,
          scripts: true,
          products: true,
          attendanceConfig: false,
          tabulations: false,
          situations: false,
          channels: false,
          notes: true,
          operators: false,
          messagesQuiz: false,
          chat: true,
          settings: false,
        },
      }

      allUsers.push(newOperator)

      console.log("[v0] Adding new operator:", newOperator.username, "Total users:", allUsers.length)

      saveImmediately(STORAGE_KEYS.USERS, allUsers)

      setOperators([...operators, newOperator])

      toast({
        title: "Sucesso",
        description: "Operador adicionado com sucesso",
      })
    }

    setIsDialogOpen(false)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls") && !fileName.endsWith(".csv")) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV",
        variant: "destructive",
      })
      return
    }

    try {
      let rows: string[][] = []

      if (fileName.endsWith(".csv")) {
        const text = await file.text()
        rows = text.split("\n").map((line) => line.split(",").map((cell) => cell.trim()))
      } else {
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: "array" })

        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]
        rows = data.map((row) => row.map((cell) => String(cell || "").trim()))
      }

      let nameColumnIndex = -1
      let usernameColumnIndex = -1

      if (rows.length > 0) {
        const headerRow = rows[0].map((cell) => cell.toLowerCase())

        nameColumnIndex = headerRow.findIndex((cell) => cell.includes("nome completo") || cell === "nome")

        usernameColumnIndex = headerRow.findIndex(
          (cell) => cell.includes("usuario") || cell.includes("usuário") || cell === "usuario",
        )

        if (nameColumnIndex !== -1 && usernameColumnIndex !== -1) {
          rows = rows.slice(1)
        } else {
          nameColumnIndex = 0
          usernameColumnIndex = 1
        }
      }

      rows = rows.filter(
        (row) =>
          row.length > Math.max(nameColumnIndex, usernameColumnIndex) &&
          row[nameColumnIndex]?.trim() &&
          row[usernameColumnIndex]?.trim(),
      )

      if (rows.length === 0) {
        toast({
          title: "Erro",
          description: "Nenhum dado válido encontrado no arquivo",
          variant: "destructive",
        })
        return
      }

      const normalizeUsername = (username: string): string => {
        return username.toLowerCase().trim().replace(/\s+/g, "")
      }

      const allUsers = getAllUsers()
      let importedCount = 0
      let skippedCount = 0
      const errors: string[] = []

      rows.forEach((row, index) => {
        const fullName = row[nameColumnIndex]?.trim()
        const username = row[usernameColumnIndex]?.trim()

        if (!fullName || !username) {
          errors.push(`Linha ${index + 2}: Dados incompletos`)
          skippedCount++
          return
        }

        const normalizedNew = normalizeUsername(username)
        const existingUser = allUsers.find((u) => normalizeUsername(u.username) === normalizedNew)

        if (existingUser) {
          errors.push(`Linha ${index + 2}: Usuário "${username}" já existe como "${existingUser.username}"`)
          skippedCount++
          return
        }

        const newOperator: User = {
          id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`,
          username: username,
          fullName: fullName,
          isOnline: false,
          role: "operator",
          createdAt: new Date(),
          loginSessions: [],
          permissions: {
            dashboard: true,
            scripts: true,
            products: true,
            attendanceConfig: false,
            tabulations: false,
            situations: false,
            channels: false,
            notes: true,
            operators: false,
            messagesQuiz: false,
            chat: true,
            settings: false,
          },
        }

        allUsers.push(newOperator)
        importedCount++
      })

      console.log("[v0] Saving", importedCount, "imported operators to Firebase immediately")
      saveImmediately(STORAGE_KEYS.USERS, allUsers)

      setOperators(allUsers.filter((u) => u.role === "operator"))
      console.log("[v0] Imported", importedCount, "operators. Total users now:", allUsers.length)

      if (importedCount > 0) {
        toast({
          title: "Importação Concluída",
          description: `${importedCount} operador(es) importado(s) com sucesso${skippedCount > 0 ? `. ${skippedCount} ignorado(s)` : ""}`,
        })
      }

      if (errors.length > 0 && errors.length <= 5) {
        setTimeout(() => {
          toast({
            title: "Avisos",
            description: errors.join("\n"),
            variant: "destructive",
          })
        }, 500)
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar o arquivo. Verifique o formato.",
        variant: "destructive",
      })
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
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
    const headers = ["Nome", "Quantidade Logins no Dia", "Tempo Conectado"]
    const rows = operators.map((operator) => {
      const todaySessions = getTodayLoginSessions(operator.id)
      const connectedTime = getTodayConnectedTime(operator.id)

      return [
        operator.fullName,
        todaySessions.length.toString(),
        connectedTime > 0 ? formatDuration(connectedTime) : "0h 0min",
      ]
    })

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
          <p className="text-muted-foreground mt-1">
            Visualize e gerencie os operadores do sistema ({operators.length} operadores)
          </p>
        </div>
        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button variant="outline" onClick={handleImportClick} className="gap-2 bg-transparent">
            <Upload className="h-4 w-4" />
            Importar Usuários
          </Button>
          <Button variant="outline" onClick={handleExportReport} className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Exportar Relatório
          </Button>
          <Button onClick={handleOpenDialog} className="gap-2">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Operador
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {operators.map((operator) => {
          const todaySessions = getTodayLoginSessions(operator.id)
          const loggedInToday = hasLoggedInToday(operator)

          return (
            <Card key={operator.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      {operator.fullName}
                      {loggedInToday ? (
                        <Badge variant="outline" className="gap-1 text-blue-600 border-blue-600">
                          Logou Hoje
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-gray-400 border-gray-400">
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
                <div className="text-sm">
                  <p className="text-muted-foreground">Logins Hoje</p>
                  <p className="font-semibold">{todaySessions.length}</p>
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
