"use client"

import type React from "react"
import { useState, useCallback, useMemo, memo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { authenticateWithFirebase } from "@/lib/firebase-auth"
import { useAuth } from "@/lib/auth-context"
import { AlertCircle, User, Lock, Sun, Moon } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useTheme } from "next-themes"

export const LoginForm = memo(function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswordField, setShowPasswordField] = useState(false)
  const { theme, setTheme } = useTheme()
  const { refreshUser } = useAuth()

  const handleUsernameChange = useCallback(
    (value: string) => {
      setUsername(value)
      setShowPasswordField(value.toLowerCase() === "admin" || value.includes("@"))
      setError("")
    },
    [],
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError("")
      setIsLoading(true)

      try {
        console.log("[v0] Submitting login form")
        
        let loginPassword = password
        if (!password && !username.includes("@") && username.toLowerCase() !== "admin") {
          console.log("[v0] No password provided for username, using default")
          loginPassword = "123456"
        }

        const user = await authenticateWithFirebase(username, loginPassword)

        if (user) {
          console.log("[v0] Login successful")
          refreshUser()
        } else {
          console.log("[v0] Login failed - invalid credentials")
          setError("Usuário ou senha incorretos")
        }
      } catch (error: any) {
        console.error("[v0] Login error:", error)
        setError("Erro ao fazer login. Tente novamente.")
      } finally {
        setIsLoading(false)
      }
    },
    [username, password, refreshUser],
  )

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark")
  }, [theme, setTheme])

  return (
    <Card className="w-full max-w-md bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl backdrop-blur-sm transition-all duration-300 hover:shadow-[0_20px_60px_rgba(249,115,22,0.4)] hover:scale-[1.02] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 pointer-events-none"></div>

      <div className="absolute top-4 right-4 z-20">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          title="Alternar tema"
          className="h-9 w-9 border-2 hover:scale-110 transition-all shadow-md hover:shadow-lg bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 hover:from-orange-100 hover:to-amber-100 dark:hover:from-zinc-700 dark:hover:to-zinc-800"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-orange-500 dark:text-white" />
          ) : (
            <Moon className="h-5 w-5 text-amber-600" />
          )}
        </Button>
      </div>

      <CardContent className="pt-10 pb-10 px-10 relative z-10">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <User className="h-10 w-10 text-white" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="username" className="sr-only">
              Usuário ou e-mail
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 dark:text-zinc-500" />
              <Input
                id="username"
                type="text"
                placeholder="Usuário"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                required
                autoComplete="username"
                disabled={isLoading}
                className="h-14 pl-12 text-base bg-white dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
          </div>

          {(username.includes("@") || username.toLowerCase() === "admin" || showPasswordField) && (
            <div className="space-y-2 animate-fade-in">
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={username.includes("@") || username.toLowerCase() === "admin"}
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="h-14 pl-12 text-base bg-white dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>
            </div>
          )}

          {error && (
            <Alert
              variant="destructive"
              className="animate-shake bg-red-50 dark:bg-red-950/50 border-2 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200"
            >
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full h-14 text-base font-bold bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:via-orange-700 hover:to-amber-600 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-orange-500/50 text-white border-0 relative overflow-hidden group"
            disabled={isLoading}
          >
            <span className="relative z-10">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
          </Button>
        </form>
      </CardContent>
    </Card>
  )
})
