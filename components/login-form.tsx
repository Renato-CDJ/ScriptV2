"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { authenticateUser } from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import { AlertCircle, Sun, Moon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useTheme } from "next-themes"

export function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { refreshUser } = useAuth()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleUsernameChange = (value: string) => {
    setUsername(value)
    setIsAdmin(value.toLowerCase() === "admin")
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 500))

    const user = authenticateUser(username, password)

    if (user) {
      refreshUser()
    } else {
      if (isAdmin) {
        setError("Senha incorreta para administrador")
      } else {
        setError("Usuário não encontrado")
      }
    }

    setIsLoading(false)
  }

  return (
    <Card className="w-full max-w-md bg-zinc-900/80 border-zinc-800 shadow-[0_0_50px_rgba(249,115,22,0.3)] backdrop-blur-sm transition-all duration-300 hover:shadow-[0_0_80px_rgba(249,115,22,0.5)] hover:scale-[1.02] relative">
      {mounted && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      )}

      <CardContent className="pt-8 pb-8 px-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Input
              id="username"
              type="text"
              placeholder="Digite seu usuário ou e-mail"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              required
              autoComplete="username"
              disabled={isLoading}
              className="h-12 text-base bg-zinc-800/50 border-zinc-700 text-zinc-200 placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-200"
            />
          </div>

          {isAdmin && (
            <div className="space-y-2 animate-fade-in">
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isLoading}
                className="h-12 text-base bg-zinc-800/50 border-zinc-700 text-zinc-200 placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-200"
              />
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="animate-shake bg-red-950/50 border-red-900 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-orange-500/50 text-white border-0"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Entrando...
              </span>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
