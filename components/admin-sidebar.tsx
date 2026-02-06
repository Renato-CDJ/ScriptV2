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
  MessageSquare,
  Shield,

  Presentation,
  BookOpen,
  Megaphone,
  ListChecks,
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
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { id: "scripts", label: "Roteiros", icon: FileText, permission: "scripts" },
  { id: "products", label: "Produtos", icon: Package, permission: "products" },
  { id: "initial-guide", label: "Guia Inicial", icon: BookOpen, permission: "dashboard" },
  { id: "attendance-config", label: "Configurar Atendimento", icon: Settings2, permission: "attendanceConfig" },
  { id: "tabulations", label: "Tabulações", icon: Tags, permission: "tabulations" },
  { id: "situations", label: "Situações", icon: AlertCircle, permission: "situations" },
  { id: "channels", label: "Canais", icon: Radio, permission: "channels" },
  { id: "notes", label: "Bloco de Notas", icon: StickyNote, permission: "notes" },
  { id: "operators", label: "Operadores", icon: Users, permission: "operators" },
  { id: "messages-quiz", label: "Recados e Quiz", icon: MessageSquare, permission: "messagesQuiz" },
  { id: "presentations", label: "Apresentações", icon: Presentation, permission: "messagesQuiz" },
  { id: "feedback", label: "Feedback", icon: Megaphone, permission: "messagesQuiz" },
  { id: "result-codes", label: "Codigos de Resultado", icon: ListChecks, permission: "tabulations" },
  { id: "settings", label: "Configurações", icon: Settings, permission: "settings" },
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

  const hasPermission = (permission: string) => {
    if (!user) return false
    // Admin role has all permissions
    if (user.role === "admin") return true

    const permissions = user.permissions || {}
    return permissions[permission as keyof typeof permissions] !== false
  }

  const visibleMenuItems = menuItems.filter((item) => hasPermission(item.permission))

  const isMainAdmin = user?.role === "admin"

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
          {visibleMenuItems.map((item) => {
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

          {isMainAdmin && (
            <Button
              variant={activeTab === "access-control" ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                activeTab === "access-control" &&
                  "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-white dark:to-gray-100 dark:hover:from-gray-100 dark:hover:to-white text-white dark:text-black font-semibold border-0",
              )}
              onClick={() => onTabChange("access-control")}
            >
              <Shield className="h-4 w-4" />
              Controle de Acesso
            </Button>
          )}
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
          className="w-full justify-start gap-3 text-black dark:text-white hover:bg-orange-500/20 dark:hover:bg-orange-500/30 border-0"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  )
}
