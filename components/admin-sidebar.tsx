"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  FileText,
  Tags,
  AlertCircle,
  Radio,
  StickyNote,
  Users,
  Settings,
  LogOut,
  Package,
  Sun,
  Moon,
  Settings2,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

interface AdminSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "scripts", label: "Roteiros", icon: FileText },
  { id: "products", label: "Produtos", icon: Package },
  { id: "attendance-config", label: "Configurar Atendimento", icon: Settings2 },
  { id: "tabulations", label: "Tabulações", icon: Tags },
  { id: "situations", label: "Situações", icon: AlertCircle },
  { id: "channels", label: "Canais", icon: Radio },
  { id: "notes", label: "Bloco de Notas", icon: StickyNote },
  { id: "operators", label: "Operadores", icon: Users },
  { id: "settings", label: "Configurações", icon: Settings },
]

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <div className="flex flex-col h-full bg-card border-r border-orange-500/30 dark:border-orange-500/40">
      {/* Header */}
      <div className="p-4 border-b border-orange-500/30 dark:border-orange-500/40">
        <h2 className="text-lg font-bold text-foreground">Painel Admin</h2>
        {user && <p className="text-sm text-muted-foreground mt-1">{user.fullName}</p>}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  activeTab === item.id &&
                    "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-white dark:to-gray-100 dark:hover:from-gray-100 dark:hover:to-white text-white dark:text-black font-semibold border-0",
                )}
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="p-3 border-t border-orange-500/30 dark:border-orange-500/40 space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 border-2 border-orange-500/30 dark:border-orange-500/40 hover:scale-105 transition-all shadow-sm hover:shadow-md bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-700 dark:to-zinc-800 hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-500/20 dark:hover:to-orange-500/20 text-foreground dark:text-white"
          onClick={toggleTheme}
        >
          {theme === "dark" ? (
            <>
              <Sun className="h-4 w-4 text-orange-500" />
              Tema Claro
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-amber-600" />
              Tema Escuro
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-white dark:text-white hover:bg-orange-500/20 dark:hover:bg-orange-500/30 border-0"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  )
}
