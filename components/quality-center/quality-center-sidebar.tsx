"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, User, Users, Image, Video, Settings, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

interface QualityCenterSidebarProps {
  isAdmin: boolean
  showAdminPanel: boolean
  onShowAdminPanel: () => void
}

export function QualityCenterSidebar({ isAdmin, showAdminPanel, onShowAdminPanel }: QualityCenterSidebarProps) {
  const router = useRouter()

  const menuItems = [
    { icon: Home, label: "Inicio", active: !showAdminPanel },
    { icon: User, label: "Perfil", active: false },
    { icon: Users, label: "Colegas", active: false },
    { icon: Image, label: "Fotos", active: false },
    { icon: Video, label: "Videos", active: false },
    { icon: Settings, label: "Configuracoes", active: false },
  ]

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-[calc(100vh-64px)] bg-white border-r border-slate-200 p-4">
      <nav className="space-y-1">
        {menuItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-11 text-slate-600 hover:text-blue-600 hover:bg-blue-50",
              item.active && "bg-blue-50 text-blue-600 font-medium"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Button>
        ))}
      </nav>

      {isAdmin && (
        <div className="mt-auto pt-4 border-t border-slate-200">
          <Button
            variant="ghost"
            onClick={onShowAdminPanel}
            className={cn(
              "w-full justify-start gap-3 h-11 text-slate-600 hover:text-blue-600 hover:bg-blue-50",
              showAdminPanel && "bg-blue-50 text-blue-600 font-medium"
            )}
          >
            <Shield className="h-5 w-5" />
            Painel Admin
          </Button>
        </div>
      )}
    </aside>
  )
}
