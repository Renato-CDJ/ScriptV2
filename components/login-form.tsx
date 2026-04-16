"use client"

import type React from "react"
import { useState, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { AlertCircle, User, Lock, Sun, Moon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useTheme } from "next-themes"
import Image from "next/image"
import { useRouter } from "next/navigation"

export const LoginForm = memo(function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswordField, setShowPasswordField] = useState(false)
  const { theme, setTheme } = useTheme()
  const { login } = useAuth()
  const router = useRouter()

  // Check if user is admin based on username pattern
  const checkIfAdminUser = useCallback((inputUsername: string) => {
    const adminPatterns = ["admin", "monitoria", "supervisor", "qualidade"]
    const lowerUsername = inputUsername.toLowerCase()
    return adminPatterns.some((pattern) => lowerUsername.includes(pattern))
  }, [])

  const handleUsernameChange = useCallback(
    (value: string) => {
      setUsername(value)
      setShowPasswordField(checkIfAdminUser(value))
      setError("")
    },
    [checkIfAdminUser],
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError("")
      setIsLoading(true)

      try {
        // For admin users, password is required
        if (showPasswordField && !password) {
          setError("Senha obrigatoria para administradores")
          setIsLoading(false)
          return
        }
        
        const result = await login(username.trim(), showPasswordField ? password : "")
        
        if (!result.success) {
          setError(result.error || "Erro ao fazer login")
          setIsLoading(false)
          return
        }
        
        // Login successful - redirect based on role
        const isAdmin = checkIfAdminUser(username.trim())
        window.location.href = isAdmin ? "/admin" : "/operator"
      } catch (err) {
        setError("Erro ao fazer login")
        setIsLoading(false)
      }
    },
    [username, password, login, showPasswordField, checkIfAdminUser],
  )

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark")
  }, [theme, setTheme])

  return (
    <Card className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl transition-all duration-300 hover:shadow-2xl">
      {/* Botao tema */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title="Alternar tema"
          className="h-9 w-9 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>

      <CardContent className="pt-8 pb-8 px-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-zinc-100 dark:ring-zinc-800">
            <Image
              src="/images/grupo_roveri_logo.jpg"
              alt="Grupo Roveri"
              width={64}
              height={64}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Usuario */}
          <div className="space-y-2">
            <label htmlFor="username" className="sr-only">
              Usuario
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                id="username"
                type="text"
                placeholder="Usuario"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                required
                autoComplete="username"
                disabled={isLoading}
                className="h-12 pl-10 text-sm bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
              />
            </div>
          </div>

          {/* Senha */}
          {showPasswordField && (
            <div className="space-y-2 animate-fade-in">
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="h-12 pl-10 text-sm bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
                />
              </div>
            </div>
          )}

          {/* Erro */}
          {error && (
            <Alert
              variant="destructive"
              className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* Botao */}
          <Button
            type="submit"
            className="w-full h-12 text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white transition-all duration-200 shadow-sm hover:shadow-md"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
})
