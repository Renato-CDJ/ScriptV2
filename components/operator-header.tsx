"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { Search, Sun, Moon, LogOut, Circle, PanelRightClose, PanelRightOpen, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"

interface OperatorHeaderProps {
  searchQuery?: string
  onSearchChange?: (query: string) => void
  isSidebarOpen?: boolean
  onToggleSidebar?: () => void
  showControls?: boolean
  onToggleControls?: () => void
  isSessionActive?: boolean
}

export function OperatorHeader({
  searchQuery = "",
  onSearchChange,
  isSidebarOpen = true,
  onToggleSidebar,
  showControls = true,
  onToggleControls,
  isSessionActive = false,
}: OperatorHeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"))
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle("dark")
  }

  return (
    <header className="border-b bg-card shadow-sm">
      <div className="container mx-auto px-3 md:px-4 py-3">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            {user && (
              <div className="text-xs md:text-sm font-semibold text-foreground whitespace-nowrap hidden sm:block">
                {user.fullName}
              </div>
            )}
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Pesquisar títulos..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {isSessionActive && onToggleControls && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleControls}
                className="gap-1 md:gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 dark:from-white dark:to-gray-100 dark:hover:from-gray-100 dark:hover:to-white text-white dark:text-black border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all font-semibold"
                title={showControls ? "Ocultar Controles" : "Exibir Controles"}
              >
                {showControls ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="hidden lg:inline text-xs md:text-sm">
                  {showControls ? "Ocultar Controles" : "Exibir Controles"}
                </span>
              </Button>
            )}

            {isSessionActive && onToggleSidebar && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleSidebar}
                className="gap-1 md:gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-800 dark:hover:to-gray-900 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all font-semibold"
                title={isSidebarOpen ? "Ocultar Painel" : "Exibir Painel"}
              >
                {isSidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                <span className="hidden lg:inline text-xs md:text-sm">
                  {isSidebarOpen ? "Ocultar Painel" : "Exibir Painel"}
                </span>
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              title="Alternar tema"
              className="h-9 w-9 border-2 hover:scale-110 transition-all shadow-md hover:shadow-lg bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 hover:from-orange-100 hover:to-amber-100 dark:hover:from-zinc-700 dark:hover:to-zinc-800"
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-orange-500 dark:text-white" />
              ) : (
                <Moon className="h-5 w-5 text-amber-600" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-1 md:gap-2 h-8 md:h-9 px-2 md:px-3 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 transition-all"
            >
              <LogOut className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline text-xs md:text-sm font-medium">Sair</span>
            </Button>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-md border border-green-500/20">
              <Circle className="h-3 w-3 fill-current animate-pulse" />
              <span className="text-sm font-medium">Online</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
