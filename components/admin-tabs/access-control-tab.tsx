"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import {
  getAdminUsers,
  updateUser,
  updateAdminPermissions,
  createAdminUser,
  deleteUser,
  canDeleteAdminUser,
  saveImmediately,
  STORAGE_KEYS,
  getAllUsers,
} from "@/lib/store"
import type { User, AdminPermissions } from "@/lib/types"
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
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [editingPasswordUser, setEditingPasswordUser] = useState<string | null>(null)
  const [editedPassword, setEditedPassword] = useState("")
  const [showEditedPassword, setShowEditedPassword] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const { toast } = useToast()

  const permissionLabels: Record<keyof AdminPermissions, string> = useMemo(
    () => ({
      dashboard: "Dashboard",
      scripts: "Roteiros",
      products: "Produtos",
      attendanceConfig: "Configurar Atendimento",
      tabulations: "Tabulações",
      situations: "Situações",
      channels: "Canais",
      notes: "Bloco de Notas",
      operators: "Operadores",
      messagesQuiz: "Recados e Quiz",
      chat: "Chat",
      settings: "Configurações",
    }),
    [],
  )

  useEffect(() => {
    loadAdminUsers()

    const handleStoreUpdate = () => {
      loadAdminUsers()
    }
    window.addEventListener("store-updated", handleStoreUpdate)
    return () => window.removeEventListener("store-updated", handleStoreUpdate)
  }, [])

  const loadAdminUsers = () => {
    const users = getAdminUsers()
    setAdminUsers(users)
  }

  const handleEditName = useCallback((user: User) => {
    setEditingUser(user.id)
    setEditedName(user.fullName)
  }, [])

  const handleSaveName = useCallback(
    (user: User) => {
      if (!editedName.trim()) {
        toast({
          title: "Erro",
          description: "O nome não pode estar vazio",
          variant: "destructive",
        })
        return
      }

      const updatedUser = { ...user, fullName: editedName.trim() }
      updateUser(updatedUser)
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
    (user: User) => {
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

      // Update user with new password
      const allUsers = getAllUsers()
      const updatedUsers = allUsers.map((u) => (u.id === user.id ? { ...u, password: editedPassword.trim() } : u))
      saveImmediately(STORAGE_KEYS.USERS, updatedUsers)

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

  const handlePermissionToggle = useCallback(
    (user: User, permission: keyof AdminPermissions) => {
      const currentPermissions = user.permissions || {}
      const updatedPermissions = {
        ...currentPermissions,
        [permission]: !currentPermissions[permission],
      }

      updateAdminPermissions(user.id, updatedPermissions)
      loadAdminUsers()

      toast({
        title: "Permissão atualizada",
        description: `Permissão ${permissionLabels[permission]} foi ${updatedPermissions[permission] ? "habilitada" : "desabilitada"} para ${user.fullName}`,
      })
    },
    [toast, permissionLabels],
  )

  const handleCreateUser = useCallback(() => {
    if (!newUsername.trim() || !newFullName.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
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

    const newUser = createAdminUser(newUsername.trim(), newFullName.trim(), newPassword.trim() || undefined)

    if (!newUser) {
      toast({
        title: "Erro",
        description: "Nome de usuário já existe",
        variant: "destructive",
      })
      return
    }

    setShowCreateForm(false)
    setNewUsername("")
    setNewFullName("")
    setNewPassword("")
    setShowNewPassword(false)
    loadAdminUsers()

    toast({
      title: "Usuário criado",
      description: `Usuário ${newUser.username} foi criado com sucesso${newPassword ? " com senha personalizada" : ""}`,
    })
  }, [newUsername, newFullName, newPassword, toast])

  const handleDeleteUser = useCallback(() => {
    if (!userToDelete) return

    if (!canDeleteAdminUser(userToDelete.id)) {
      toast({
        title: "Erro",
        description: "Não é possível excluir este usuário",
        variant: "destructive",
      })
      setUserToDelete(null)
      return
    }

    deleteUser(userToDelete.id)
    setUserToDelete(null)
    loadAdminUsers()

    toast({
      title: "Usuário excluído",
      description: `Usuário ${userToDelete.username} foi excluído com sucesso`,
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-username">Nome de Usuário *</Label>
                <Input
                  id="new-username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Ex: Supervisao"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-fullname">Nome Completo *</Label>
                <Input
                  id="new-fullname"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Ex: Supervisão"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Senha de Acesso</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Deixe vazio para senha padrão"
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
                <p className="text-xs text-muted-foreground">
                  Mínimo 4 caracteres. Se vazio, usa senha padrão do admin.
                </p>
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
                    <CardDescription className="mt-1 break-words">{user.fullName}</CardDescription>
                    <div className="mt-2 flex items-center gap-2">
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
                  <Label className="text-sm font-semibold text-foreground">Permissões do Painel Admin</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(permissionLabels).map(([key, label]) => {
                      const permissionKey = key as keyof AdminPermissions
                      const isEnabled = user.permissions?.[permissionKey] ?? true
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors min-w-0"
                        >
                          <Label htmlFor={`${user.id}-${key}`} className="text-sm cursor-pointer flex-1 break-words">
                            {label}
                          </Label>
                          <Switch
                            id={`${user.id}-${key}`}
                            checked={isEnabled}
                            onCheckedChange={() => handlePermissionToggle(user, permissionKey)}
                            className="flex-shrink-0"
                          />
                        </div>
                      )
                    })}
                  </div>
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
