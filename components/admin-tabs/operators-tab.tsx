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
import { Circle, UserX, Plus, Edit, Trash2, Download, Upload } from "lucide-react"
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
  saveImmediately, // Import saveImmediately instead of debouncedSave
  STORAGE_KEYS,
} from "@/lib/store"
import type { User } from "@/lib/types"
import * as XLSX from "xlsx"
import { DEFAULT_OPERATORS } from "@/data/operators"
import { REGULAR_OPERATORS } from "@/data/regular-operators" // Import regular operators list

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
    const loadOperators = async () => {
      console.log("[v0] Loading operators from localStorage and Firebase...")

      const allUsers = getAllUsers()

      if (allUsers.length === 0) {
        console.log("[v0] No users found, initializing with default operators")
        const allDefaultUsers = [...DEFAULT_OPERATORS, ...REGULAR_OPERATORS]
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(allDefaultUsers))

        // Sync to Firebase
        if (typeof window !== "undefined") {
          allDefaultUsers.forEach((user) => {
            saveImmediately(STORAGE_KEYS.USERS, allDefaultUsers)
          })
        }

        const ops = allDefaultUsers.filter((u) => u.role === "operator")
        setOperators(ops)
        return
      }

      const ops = allUsers.filter((u) => u.role === "operator")
      console.log("[v0] Loaded operators count:", ops.length)
      console.log(
        "[v0] Operators:",
        ops.map((o) => o.username),
      )
      setOperators(ops)
    }

    loadOperators()

    const interval = setInterval(loadOperators, 5000)

    const handleStoreUpdate = () => {
      console.log("[v0] Store updated, reloading operators...")
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
      const allUsers = getAllUsers()
      if (allUsers.some((u) => u.username === formData.username)) {
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

      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(allUsers))

      console.log("[v0] Saving new operator to Firebase:", newOperator.username)
      saveImmediately(STORAGE_KEYS.USERS, allUsers)

      setOperators([...operators, newOperator])

      window.dispatchEvent(new Event("store-updated"))

      console.log("[v0] New operator created successfully")

      toast({
        title: "Sucesso",
        description: "Operador adicionado e sincronizado com Firebase.",
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

    // Check file extension
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
        // Parse CSV
        const text = await file.text()
        rows = text.split("\n").map((line) => line.split(",").map((cell) => cell.trim()))
      } else {
        // Parse Excel file
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: "array" })

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // Convert to array of arrays
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]
        rows = data.map((row) => row.map((cell) => String(cell || "").trim()))
      }

      let nameColumnIndex = -1
      let usernameColumnIndex = -1

      if (rows.length > 0) {
        const headerRow = rows[0].map((cell) => cell.toLowerCase())

        // Look for "nome completo" or "nome" column
        nameColumnIndex = headerRow.findIndex((cell) => cell.includes("nome completo") || cell === "nome")

        // Look for "usuario" or "usuário" column
        usernameColumnIndex = headerRow.findIndex(
          (cell) => cell.includes("usuario") || cell.includes("usuário") || cell === "usuario",
        )

        // If headers found, remove header row
        if (nameColumnIndex !== -1 && usernameColumnIndex !== -1) {
          rows = rows.slice(1)
        } else {
          // If no headers found, assume first two columns are name and username
          nameColumnIndex = 0
          usernameColumnIndex = 1
        }
      }

      // Filter out empty rows
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

      // Import operators
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

        // Check if username already exists
        if (allUsers.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
          errors.push(`Linha ${index + 2}: Usuário "${username}" já existe`)
          skippedCount++
          return
        }

        // Create new operator
        const newOperator: User = {
          id: `op-${Date.now()}-${index}`,
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

      saveImmediately(STORAGE_KEYS.USERS, allUsers)

      // Show results
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

    // Reset file input
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
    // Prepare data for Excel
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
          <p className="text-xs text-muted-foreground mt-2">
            Os operadores padrão são carregados de{" "}
            <code className="bg-muted px-1 py-0.5 rounded">data/operators.ts</code> (admins) e{" "}
            <code className="bg-muted px-1 py-0.5 rounded">data/regular-operators.ts</code> (operadores regulares). Você
            também pode adicionar operadores manualmente ou importar via planilha Excel/CSV.
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
