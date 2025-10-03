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
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface AdminSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "scripts", label: "Roteiros", icon: FileText },
  { id: "products", label: "Produtos", icon: Package },
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

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="flex flex-col h-full bg-card border-r">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold">Painel Admin</h2>
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
                className={cn("w-full justify-start gap-3", activeTab === item.id && "bg-primary/10 text-primary")}
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t">
        <Button variant="ghost" className="w-full justify-start gap-3 text-destructive" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  )
}
