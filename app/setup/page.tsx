"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { setupAdminInFirebase, adminExistsInFirebase, getAdminSetupInstructions } from "@/lib/setup-admin-firebase"
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck, ArrowLeft } from 'lucide-react'
import Link from "next/link"

export default function SetupPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [adminExists, setAdminExists] = useState<boolean | null>(null)

  const setupInstructions = getAdminSetupInstructions()

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const exists = await adminExistsInFirebase()
        setAdminExists(exists)
      } catch (err) {
        console.error("[v0] Error checking admin status:", err)
      } finally {
        setIsChecking(false)
      }
    }
    checkStatus()
  }, [])

  const handleSetupAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
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
      
      // Redirect after delay
      setTimeout(() => {
        router.push("/")
      }, 3000)
    } catch (err: any) {
      console.error("[v0] Admin setup error:", err)

      if (err.message.includes("already in use")) {
        setError("Este email já está registrado. O admin pode já estar configurado no Firebase.")
        setAdminExists(true)
      } else if (err.message.includes("weak-password")) {
        setError("A senha é muito fraca. Use pelo menos 6 caracteres com letras e números.")
      } else {
        setError(`Erro ao configurar admin: ${err.message || "Tente novamente"}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-500 mb-4" />
          <p className="text-zinc-500">Verificando status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-md shadow-lg border-orange-100 dark:border-zinc-800">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-6 w-6 text-orange-500" />
            <CardTitle className="text-2xl font-bold">Configuração Inicial</CardTitle>
          </div>
          <CardDescription>
            Configure o usuário administrador para acessar o sistema via Firebase.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {adminExists ? (
            <div className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-800 dark:text-blue-300">Admin já configurado</AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-400">
                  O usuário administrador já existe no Firebase. Você pode fazer login normalmente.
                </AlertDescription>
              </Alert>
              
              <Button asChild className="w-full bg-orange-500 hover:bg-orange-600">
                <Link href="/">Ir para Login</Link>
              </Button>
            </div>
          ) : success ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-800 dark:text-green-300">Sucesso!</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-400">
                  Admin configurado com sucesso. Redirecionando para o login...
                </AlertDescription>
              </Alert>
              
              <Button asChild className="w-full bg-orange-500 hover:bg-orange-600">
                <Link href="/">Ir para Login Agora</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSetupAdmin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="rounded-lg bg-zinc-100 dark:bg-zinc-900 p-4 text-sm space-y-2">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">Dados do Administrador:</p>
                <div className="grid grid-cols-[80px_1fr] gap-1 text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium">Username:</span>
                  <span>{setupInstructions.username}</span>
                  <span className="font-medium">Email:</span>
                  <span>{setupInstructions.email}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Defina uma Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirme a Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Digite a mesma senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  "Criar Admin e Habilitar Acesso"
                )}
              </Button>
            </form>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <Link 
            href="/" 
            className="flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="mr-1 h-3 w-3" />
            Voltar para Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
