"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { UserX, Plus, Edit, Trash2, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  forceLogoutUser,
  getCurrentUser,
} from "@/lib/store"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@/lib/types"

const supabase = createClient()
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
    const loadOperators = async () => {
      // Fetch operators from Supabase
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "operator")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error loading operators:", error)
        return
      }

      const ops: User[] = (data || []).map((u: any) => ({
        id: u.id,
        username: u.username,
        fullName: u.name,
        isOnline: u.is_online || false,
        role: u.role,
        createdAt: new Date(u.created_at),
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
      }))
      setOperators(ops)
    }

    loadOperators()

    // Subscribe to realtime changes
    const channel = supabase
      .channel("operators-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users", filter: "role=eq.operator" },
        () => {
          loadOperators()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
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

  const handleDelete = async (operatorId: string) => {
    if (confirm("Tem certeza que deseja excluir este operador?")) {
      // Delete from Supabase
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", operatorId)

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir operador: " + error.message,
          variant: "destructive",
        })
        return
      }

      setOperators(operators.filter(op => op.id !== operatorId))
      toast({
        title: "Sucesso",
        description: "Operador excluido com sucesso",
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

  const handleSave = async () => {
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
      // Update in Supabase
      const { error } = await supabase
        .from("users")
        .update({
          name: formData.fullName.trim(),
          username: formData.username.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingOperator.id)

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao atualizar operador: " + error.message,
          variant: "destructive",
        })
        return
      }

      setOperators(operators.map(op => 
        op.id === editingOperator.id 
          ? { ...op, fullName: formData.fullName, username: formData.username }
          : op
      ))
      toast({
        title: "Sucesso",
        description: "Operador atualizado com sucesso",
      })
    } else {
      // Check if username exists in Supabase
      const { data: existingUser } = await supabase
        .from("users")
        .select("username")
        .ilike("username", formData.username.trim())
        .single()

      if (existingUser) {
        toast({
          title: "Erro",
          description: `Usuario "${existingUser.username}" ja existe no sistema`,
          variant: "destructive",
        })
        return
      }

      // Insert into Supabase
      const { data: newUser, error } = await supabase
        .from("users")
        .insert({
          username: formData.username.trim(),
          name: formData.fullName.trim(),
          email: `${formData.username.trim()}@operador.com`,
          role: "operator",
          is_active: true,
          is_online: false,
          allowed_tabs: ["dashboard", "scripts", "products", "notes", "chat"],
        })
        .select()
        .single()

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao criar operador: " + error.message,
          variant: "destructive",
        })
        return
      }

      const newOperator: User = {
        id: newUser.id,
        username: newUser.username,
        fullName: newUser.name,
        isOnline: false,
        role: "operator",
        createdAt: new Date(newUser.created_at),
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

      let importedCount = 0
      let skippedCount = 0
      const errors: string[] = []

      for (let index = 0; index < rows.length; index++) {
        const row = rows[index]
        const fullName = row[nameColumnIndex]?.trim()
        const username = row[usernameColumnIndex]?.trim()

        if (!fullName || !username) {
          errors.push(`Linha ${index + 2}: Dados incompletos`)
          skippedCount++
          continue
        }

        // Check if username already exists in Supabase
        const { data: existingUser } = await supabase
          .from("users")
          .select("username")
          .ilike("username", username)
          .single()

        if (existingUser) {
          errors.push(`Linha ${index + 2}: Usuário "${username}" já existe`)
          skippedCount++
          continue
        }

        // Insert into Supabase
        const { error: insertError } = await supabase
          .from("users")
          .insert({
            username: username,
            name: fullName,
            email: `${username.toLowerCase().replace(/\s+/g, "")}@operador.com`,
            role: "operator",
            is_active: true,
            is_online: false,
            allowed_tabs: ["dashboard", "scripts", "products", "notes", "chat"],
          })

        if (insertError) {
          errors.push(`Linha ${index + 2}: Erro ao inserir - ${insertError.message}`)
          skippedCount++
          continue
        }

        importedCount++
      }

      // Reload operators from Supabase
      const { data: updatedOps } = await supabase
        .from("users")
        .select("*")
        .eq("role", "operator")
        .order("created_at", { ascending: false })

      if (updatedOps) {
        const ops: User[] = updatedOps.map((u: any) => ({
          id: u.id,
          username: u.username,
          fullName: u.name,
          isOnline: u.is_online || false,
          role: u.role,
          createdAt: new Date(u.created_at),
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
        }))
        setOperators(ops)
      }

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
          <Button onClick={handleOpenDialog} className="gap-2">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Operador
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {operators.map((operator) => {
          return (
            <Card key={operator.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3">{operator.fullName}</CardTitle>
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
