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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:bg-background">
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white via-orange-50/20 to-amber-50/20 dark:bg-background p-4 md:p-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-400/5 dark:bg-orange-500/5 rounded-full blur-3xl animate-float"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-400/5 dark:bg-amber-500/5 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "1.5s" }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-orange-300/3 to-amber-300/3 dark:from-orange-500/3 dark:to-amber-500/3 rounded-full blur-3xl animate-pulse-slow"
            style={{ animationDelay: "3s" }}
          ></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-12 text-center">
            <div className="relative inline-block">
              <h1
                className={`text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-6 transition-all duration-700 ${
                  showTitle ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"
                }`}
              >
                <span className="relative inline-block">
                  <span className="absolute inset-0 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent blur-lg opacity-50 animate-gradient"></span>
                  <span className="relative bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent animate-gradient">
                    Roteiro
                  </span>
                </span>
              </h1>
              <div className="h-1.5 w-40 mx-auto bg-gradient-to-r from-transparent via-orange-500 to-transparent rounded-full mb-6 animate-shimmer"></div>
            </div>
            <p
              className={`text-zinc-700 dark:text-zinc-300 text-lg md:text-xl font-semibold tracking-wide transition-all duration-700 delay-300 ${
                showTitle ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              }`}
            >
              Sistema de Atendimento
            </p>
          </div>

          <div
            className={`transition-all duration-700 delay-500 ${
              showTitle ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <LoginForm />
          </div>
        </div>
      </div>
    </>
  )
}
