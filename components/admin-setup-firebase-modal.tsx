"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setupAdminInFirebase, adminExistsInFirebase, getAdminSetupInstructions } from "@/lib/setup-admin-firebase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

export function AdminSetupFirebaseModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [adminExists, setAdminExists] = useState<boolean | null>(null)

  const setupInstructions = getAdminSetupInstructions()

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open)
    if (open) {
      try {
        const exists = await adminExistsInFirebase()
        setAdminExists(exists)
      } catch (err) {
        console.error("[v0] Error checking admin status:", err)
      }
    }
  }

  const handleSetupAdmin = async () => {
    setError(null)

    if (!password || !confirmPassword) {
      setError("Por favor, preencha todos os campos")
      return
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas não correspondem")
      return
    }

    setIsLoading(true)

    try {
      const user = await setupAdminInFirebase(password)
      console.log("[v0] Admin setup successful:", user)
      setSuccess(true)
      setPassword("")
      setConfirmPassword("")

      setTimeout(() => {
        setIsOpen(false)
        setSuccess(false)
        window.location.reload()
      }, 2000)
    } catch (err: any) {
      console.error("[v0] Admin setup error:", err)

      if (err.message.includes("already in use")) {
        setError("Este email já está registrado. O admin pode já estar configurado no Firebase.")
      } else if (err.message.includes("weak-password")) {
        setError("A senha é muito fraca. Use pelo menos 6 caracteres com letras e números.")
      } else {
        setError(`Erro ao configurar admin: ${err.message || "Tente novamente"}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (adminExists === true) {
    return null // Don't show modal if admin already exists in Firebase
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleOpenChange(true)}
        className="mb-4 w-full bg-blue-50 hover:bg-blue-100"
      >
        <AlertCircle className="mr-2 h-4 w-4 text-blue-600" />
        Configurar Admin no Firebase
      </Button>

      <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Configurar Administrador no Firebase</AlertDialogTitle>
            <AlertDialogDescription>
              Seu usuário admin será registrado no Firebase Authentication
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {success ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Admin configurado com sucesso! Redirecionando...
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3 rounded-lg bg-blue-50 p-3 text-sm">
                  <p className="font-semibold text-blue-900">Informações da sua conta:</p>
                  <div className="space-y-1 text-blue-800">
                    <p>
                      <strong>Username:</strong> {setupInstructions.username}
                    </p>
                    <p>
                      <strong>Email:</strong> {setupInstructions.email}
                    </p>
                    <p>
                      <strong>Nome:</strong> {setupInstructions.fullName}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="password" className="text-sm">
                      Nova Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm">
                      Confirmar Senha
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Digite a mesma senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      className="mt-1"
                    />
                  </div>
                </div>

                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Guarde bem esta senha. Ela será usada para fazer login no Firebase.
                  </AlertDescription>
                </Alert>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <AlertDialogCancel disabled={isLoading} className="flex-1">
              Cancelar
            </AlertDialogCancel>
            {!success && (
              <AlertDialogAction
                onClick={handleSetupAdmin}
                disabled={isLoading || !password || !confirmPassword}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  "Configurar Admin"
                )}
              </AlertDialogAction>
            )}
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
