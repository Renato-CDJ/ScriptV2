"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authenticateUser as authenticateLocal } from "@/lib/store"
import { authenticateUser as authenticateDb } from "@/lib/db"
import { useAuth } from "@/lib/auth-context"

const isSupabaseConfigured = () => {
  return !!(
    process.env.SUPABASE_SUPABASE_NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ANON_KEY
  )
}

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { refreshUser } = useAuth()
  const useDatabase = isSupabaseConfigured()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      let user
      if (useDatabase) {
        console.log("[v0] Authenticating with Supabase")
        user = await authenticateDb(username, password)
      } else {
        console.log("[v0] Authenticating with localStorage")
        user = authenticateLocal(username, password)
      }

      if (user) {
        await refreshUser()
        router.push(user.role === "admin" ? "/admin" : "/operator")
      } else {
        setError("Usuário ou senha inválidos")
      }
    } catch (err) {
      console.error("[v0] Login error:", err)
      setError("Erro ao fazer login. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sistema de Roteiro</CardTitle>
          <CardDescription className="text-center">Entre com suas credenciais para acessar o sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Operadores não precisam de senha. Administradores devem usar: rcp@$ ou #qualidade@$
              </p>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          {!useDatabase && (
            <p className="text-xs text-center text-muted-foreground mt-4">
              Modo local (localStorage) - Configure o Supabase para usar o banco de dados
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
