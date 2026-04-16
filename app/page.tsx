"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"
import { MouseTrail } from "@/components/mouse-trail"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [showTitle, setShowTitle] = useState(false)

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

  useEffect(() => {
    const timer = setTimeout(() => setShowTitle(true), 100)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
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
    <>
      <MouseTrail />
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6 relative overflow-hidden">
        {/* Background sutil */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/[0.03] dark:bg-orange-500/[0.02] rounded-full blur-3xl animate-float"
          />
          <div 
            className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/[0.03] dark:bg-amber-500/[0.02] rounded-full blur-3xl animate-float"
            style={{ animationDelay: "3s" }}
          />
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* Titulo com animacao */}
          <div className="mb-10 text-center">
            <h1
              className={`text-6xl md:text-7xl font-black tracking-tight mb-4 transition-all duration-700 ${
                showTitle ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
              }`}
            >
              <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                Roteiro
              </span>
            </h1>
            
            {/* Linha animada */}
            <div 
              className={`relative h-1 w-32 mx-auto mb-5 overflow-hidden rounded-full transition-all duration-700 delay-200 ${
                showTitle ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full animate-line-expand origin-center" />
            </div>
            
            <p
              className={`text-zinc-500 dark:text-zinc-400 text-base font-medium tracking-wide transition-all duration-700 delay-300 ${
                showTitle ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Sistema de Atendimento
            </p>
          </div>

          {/* Formulario */}
          <div
            className={`transition-all duration-700 delay-500 ${
              showTitle ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <LoginForm />
          </div>
        </div>
        
        {/* Rodape minimalista */}
        <p 
          className={`absolute bottom-4 text-xs text-zinc-400 dark:text-zinc-600 transition-all duration-700 delay-700 ${
            showTitle ? "opacity-100" : "opacity-0"
          }`}
        >
          Grupo Roveri
        </p>
      </div>
    </>
  )
}
