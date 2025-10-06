"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"
import { ThemeProvider } from "@/components/theme-provider"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect based on role
      if (user.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/operator")
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4 shadow-lg"></div>
          <p className="text-zinc-600 dark:text-zinc-400 font-medium">Carregando...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-zinc-50 via-orange-50/30 to-amber-50/30 dark:from-black dark:via-zinc-950 dark:to-zinc-900 p-4 md:p-6 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-400/10 dark:bg-orange-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-400/10 dark:bg-amber-500/5 rounded-full blur-3xl animate-pulse-slow"
            style={{ animationDelay: "1.5s" }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-orange-300/5 to-amber-300/5 dark:from-orange-500/3 dark:to-amber-500/3 rounded-full blur-3xl animate-pulse-slow"
            style={{ animationDelay: "3s" }}
          ></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-12 text-center animate-fade-in">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 bg-clip-text text-transparent tracking-tight mb-4 drop-shadow-2xl animate-pulse-slow">
              Roteiro
            </h1>
            <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-orange-500 to-transparent rounded-full mb-4"></div>
            <p className="text-zinc-600 dark:text-zinc-400 text-base md:text-lg font-medium tracking-wide">
              Sistema de Atendimento
            </p>
          </div>

          <div className="animate-fade-in-delay">
            <LoginForm />
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}
