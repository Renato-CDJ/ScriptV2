"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import type { User, AdminPermissions, AdminType } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Shield, Edit2, Save, X, Plus, Trash2, UserPlus, Eye, EyeOff, Key } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
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

export function AccessControlTab() {
  const [adminUsers, setAdminUsers] = useState<User[]>([])
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editedName, setEditedName] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [newFullName, setNewFullName] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newAdminType, setNewAdminType] = useState<AdminType>("supervisao")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [editingPasswordUser, setEditingPasswordUser] = useState<string | null>(null)
  const [editedPassword, setEditedPassword] = useState("")
  const [showEditedPassword, setShowEditedPassword] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const adminTypeLabels: Record<AdminType, string> = {
    master: "Master (Acesso Total)",
    monitoria: "Monitoria (Acesso Total)",
    supervisao: "Supervisao (Limitado)",
  }

  const availableTabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "central-qualidade", label: "Central da Qualidade" },
    { id: "scripts", label: "Roteiros" },
    { id: "products", label: "Produtos" },
    { id: "operators", label: "Operadores" },
    { id: "tabulations", label: "Tabulacoes" },
    { id: "situations", label: "Situacoes" },
    { id: "channels", label: "Canais" },
    { id: "messages-quiz", label: "Recados e Quiz" },
    { id: "feedback", label: "Feedback" },
    { id: "presentations", label: "Apresentacoes" },
    { id: "settings", label: "Configuracoes" },
  ]

  useEffect(() => {
    loadAdminUsers()
  }, [])

  const loadAdminUsers = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "admin")
      .order("admin_type", { ascending: true })
      .order("username", { ascending: true })
    
    if (!error && data) {
      const users: User[] = data.map((u) => ({
        id: u.id,
        username: u.username,
        fullName: u.name,
        email: u.email,
        role: u.role,
        adminType: u.admin_type,
        allowedTabs: u.allowed_tabs || [],
        isOnline: u.is_online,
        createdAt: new Date(u.created_at),
        password: u.password,
      }))
      setAdminUsers(users)
    }
    setLoading(false)
  }

  const handleEditName = useCallback((user: User) => {
    setEditingUser(user.id)
    setEditedName(user.fullName)
  }, [])

  const handleSaveName = useCallback(
    async (user: User) => {
      if (!editedName.trim()) {
        toast({
          title: "Erro",
          description: "O nome não pode estar vazio",
          variant: "destructive",
        })
        return
      }

      const supabase = createClient()
      const { error } = await supabase
        .from("users")
        .update({ name: editedName.trim() })
        .eq("id", user.id)

      if (error) {
        toast({ title: "Erro", description: "Erro ao atualizar nome", variant: "destructive" })
        return
      }

      setEditingUser(null)
      loadAdminUsers()

      toast({
        title: "Nome atualizado",
        description: `Nome do usuário ${user.username} foi atualizado com sucesso`,
      })
    },
    [editedName, toast],
  )

  const handleCancelEdit = useCallback(() => {
    setEditingUser(null)
    setEditedName("")
  }, [])

  const handleEditPassword = useCallback((user: User) => {
    setEditingPasswordUser(user.id)
    setEditedPassword("")
    setShowEditedPassword(false)
  }, [])

  const handleSavePassword = useCallback(
    async (user: User) => {
      if (!editedPassword.trim()) {
        toast({
          title: "Erro",
          description: "A senha não pode estar vazia",
          variant: "destructive",
        })
        return
      }

      if (editedPassword.length < 4) {
        toast({
          title: "Erro",
          description: "A senha deve ter pelo menos 4 caracteres",
          variant: "destructive",
        })
        return
      }

      const supabase = createClient()
      const { error } = await supabase
        .from("users")
        .update({ password: editedPassword.trim() })
        .eq("id", user.id)

      if (error) {
        toast({ title: "Erro", description: "Erro ao atualizar senha", variant: "destructive" })
        return
      }

      setEditingPasswordUser(null)
      setEditedPassword("")
      setShowEditedPassword(false)
      loadAdminUsers()

      toast({
        title: "Senha atualizada",
        description: `Senha do usuário ${user.username} foi atualizada com sucesso`,
      })
    },
    [editedPassword, toast],
  )

  const handleCancelPasswordEdit = useCallback(() => {
    setEditingPasswordUser(null)
    setEditedPassword("")
    setShowEditedPassword(false)
  }, [])

  const handleTabToggle = useCallback(
    async (user: User, tabId: string) => {
      const currentTabs = user.allowedTabs || []
      const isEnabled = currentTabs.includes(tabId)
      const updatedTabs = isEnabled
        ? currentTabs.filter((t) => t !== tabId)
        : [...currentTabs, tabId]

      const supabase = createClient()
      const { error } = await supabase
        .from("users")
        .update({ allowed_tabs: updatedTabs })
        .eq("id", user.id)

      if (error) {
        toast({ title: "Erro", description: "Erro ao atualizar permissoes", variant: "destructive" })
        return
      }

      loadAdminUsers()

      const tabLabel = availableTabs.find((t) => t.id === tabId)?.label || tabId
      toast({
        title: "Permissao atualizada",
        description: `${tabLabel} foi ${!isEnabled ? "habilitada" : "desabilitada"} para ${user.fullName}`,
      })
    },
    [toast, availableTabs],
  )

  const handleAdminTypeChange = useCallback(
    async (user: User, newType: AdminType) => {
      const supabase = createClient()
      
      // If changing to supervisao, set default allowed tabs
      const allowedTabs = newType === "supervisao" 
        ? ["dashboard", "central-qualidade"] 
        : []

      const { error } = await supabase
        .from("users")
        .update({ admin_type: newType, allowed_tabs: allowedTabs })
        .eq("id", user.id)

      if (error) {
        toast({ title: "Erro", description: "Erro ao atualizar tipo de admin", variant: "destructive" })
        return
      }

      loadAdminUsers()
      toast({
        title: "Tipo atualizado",
        description: `${user.fullName} agora e ${adminTypeLabels[newType]}`,
      })
    },
    [toast, adminTypeLabels],
  )

  const handleCreateUser = useCallback(async () => {
    if (!newUsername.trim() || !newFullName.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatorios",
        variant: "destructive",
      })
      return
    }

    if (newPassword && newPassword.length < 4) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 4 caracteres",
        variant: "destructive",
      })
      return
    }

    const supabase = createClient()
    
    // Check if username already exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .ilike("username", newUsername.trim())
      .single()

    if (existing) {
      toast({
        title: "Erro",
        description: "Nome de usuario ja existe",
        variant: "destructive",
      })
      return
    }

    const allowedTabs = newAdminType === "supervisao" 
      ? ["dashboard", "central-qualidade"] 
      : []

    const { error } = await supabase.from("users").insert({
      username: newUsername.trim(),
      name: newFullName.trim(),
      email: `${newUsername.trim().toLowerCase()}@rcp.com`,
      password: newPassword.trim() || "rcp@$",
      role: "admin",
      admin_type: newAdminType,
      allowed_tabs: allowedTabs,
      is_active: true,
      is_online: false,
    })

    if (error) {
      toast({ title: "Erro", description: "Erro ao criar usuario", variant: "destructive" })
      return
    }

    setShowCreateForm(false)
    setNewUsername("")
    setNewFullName("")
    setNewPassword("")
    setNewAdminType("supervisao")
    setShowNewPassword(false)
    loadAdminUsers()

    toast({
      title: "Usuario criado",
      description: `Usuario ${newUsername} foi criado com sucesso`,
    })
  }, [newUsername, newFullName, newPassword, newAdminType, toast])

  const handleDeleteUser = useCallback(async () => {
    if (!userToDelete) return

    // Prevent deleting master admin
    if (userToDelete.adminType === "master") {
      toast({
        title: "Erro",
        description: "Nao e possivel excluir o usuario master",
        variant: "destructive",
      })
      setUserToDelete(null)
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", userToDelete.id)

    if (error) {
      toast({ title: "Erro", description: "Erro ao excluir usuario", variant: "destructive" })
      return
    }

    setUserToDelete(null)
    loadAdminUsers()

    toast({
      title: "Usuario excluido",
      description: `Usuario ${userToDelete.username} foi excluido com sucesso`,
    })
  }, [userToDelete, toast])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-400 dark:to-orange-500">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Controle de Acesso</h2>
            <p className="text-sm text-muted-foreground">
              Gerencie nomes, senhas e permissões dos usuários administradores
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {showCreateForm && (
        <Card className="border-2 border-orange-500/30 bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              Criar Novo Usuário Administrador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-username">Nome de Usuario *</Label>
                <Input
                  id="new-username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Ex: Supervisor31"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-fullname">Nome Completo *</Label>
                <Input
                  id="new-fullname"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Ex: Joao da Silva"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-admin-type">Tipo de Admin *</Label>
                <Select value={newAdminType} onValueChange={(v) => setNewAdminType(v as AdminType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monitoria">Monitoria (Acesso Total)</SelectItem>
                    <SelectItem value="supervisao">Supervisao (Limitado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Senha de Acesso</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Padrao: rcp@$"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false)
                  setNewUsername("")
                  setNewFullName("")
                  setNewPassword("")
                  setNewAdminType("supervisao")
                  setShowNewPassword(false)
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateUser}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Usuário
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-4 pr-4">
          {adminUsers.map((user) => (
            <Card key={user.id} className="border-2 border-orange-500/20 dark:border-orange-500/30">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                      <span className="text-orange-600 dark:text-orange-400 break-words">{user.username}</span>
                      {editingUser === user.id ? (
                        <div className="flex items-center gap-2 ml-2">
                          <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="h-8 max-w-xs"
                            placeholder="Nome completo"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSaveName(user)}
                            className="h-8 w-8 p-0 flex-shrink-0"
                          >
                            <Save className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="h-8 w-8 p-0 flex-shrink-0"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditName(user)}
                          className="h-8 w-8 p-0 ml-2 flex-shrink-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1 break-words flex items-center gap-2">
                      {user.fullName}
                      <Badge 
                        variant="outline" 
                        className={
                          user.adminType === "master" 
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-500"
                            : user.adminType === "monitoria"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-500"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-500"
                        }
                      >
                        {user.adminType === "master" ? "Master" : user.adminType === "monitoria" ? "Monitoria" : "Supervisao"}
                      </Badge>
                    </CardDescription>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {editingPasswordUser === user.id ? (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Input
                              type={showEditedPassword ? "text" : "password"}
                              value={editedPassword}
                              onChange={(e) => setEditedPassword(e.target.value)}
                              className="h-8 w-48 pr-10"
                              placeholder="Nova senha"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                              onClick={() => setShowEditedPassword(!showEditedPassword)}
                            >
                              {showEditedPassword ? (
                                <EyeOff className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <Eye className="h-3 w-3 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSavePassword(user)}
                            className="h-8 w-8 p-0"
                          >
                            <Save className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancelPasswordEdit} className="h-8 w-8 p-0">
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPassword(user)}
                          className="h-7 text-xs gap-1"
                        >
                          <Key className="h-3 w-3" />
                          {user.password ? "Alterar Senha" : "Definir Senha"}
                        </Button>
                      )}
                      {user.password && (
                        <span className="text-xs text-green-600 dark:text-green-400">Senha personalizada</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        user.isOnline
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {user.isOnline ? "Online" : "Offline"}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setUserToDelete(user)}
                      className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Admin Type Selector */}
                  {user.adminType !== "master" && (
                    <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/30">
                      <Label className="text-sm font-semibold text-foreground whitespace-nowrap">Tipo de Admin:</Label>
                      <Select 
                        value={user.adminType || "supervisao"} 
                        onValueChange={(v) => handleAdminTypeChange(user, v as AdminType)}
                      >
                        <SelectTrigger className="w-[250px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monitoria">Monitoria (Acesso Total)</SelectItem>
                          <SelectItem value="supervisao">Supervisao (Limitado)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Tab Permissions - Only for Supervisao */}
                  {user.adminType === "supervisao" && (
                    <>
                      <Label className="text-sm font-semibold text-foreground">Abas Permitidas</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {availableTabs.map((tab) => {
                          const isEnabled = (user.allowedTabs || []).includes(tab.id)
                          return (
                            <div
                              key={tab.id}
                              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors min-w-0"
                            >
                              <Label htmlFor={`${user.id}-${tab.id}`} className="text-sm cursor-pointer flex-1 break-words">
                                {tab.label}
                              </Label>
                              <Switch
                                id={`${user.id}-${tab.id}`}
                                checked={isEnabled}
                                onCheckedChange={() => handleTabToggle(user, tab.id)}
                                className="flex-shrink-0"
                              />
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}

                  {/* Full access message for Master/Monitoria */}
                  {(user.adminType === "master" || user.adminType === "monitoria") && (
                    <div className="p-4 rounded-lg border border-green-500/30 bg-green-50 dark:bg-green-900/20">
                      <p className="text-sm text-green-700 dark:text-green-400">
                        Este usuario tem acesso total ao painel administrativo.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {adminUsers.length === 0 && (
            <Card className="border-2 border-dashed border-orange-500/30">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">Nenhum usuário administrador encontrado</p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{userToDelete?.username}</strong>? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700 text-white">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
