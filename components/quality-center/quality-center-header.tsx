"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Bell, MessageSquare, Moon, Sun, LogOut, User, Settings, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface QualityCenterHeaderProps {
  pendingQuestions: number
  showAdminPanel: boolean
  onToggleAdminPanel: () => void
}

export function QualityCenterHeader({ pendingQuestions, showAdminPanel, onToggleAdminPanel }: QualityCenterHeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U"

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-4 h-16">
        {/* Logo and Back */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(user?.role === "admin" ? "/admin" : "/operator")}
            className="text-slate-600 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-xl font-bold text-blue-600">Central da Qualidade</h1>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-100 border-0 focus-visible:ring-1 focus-visible:ring-blue-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {user?.role === "admin" && (
            <Button
              variant={showAdminPanel ? "default" : "ghost"}
              size="icon"
              onClick={onToggleAdminPanel}
              className={showAdminPanel ? "bg-blue-500 hover:bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900"}
            >
              <Settings className="h-5 w-5" />
            </Button>
          )}

          <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-slate-900">
            <Bell className="h-5 w-5" />
            {pendingQuestions > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingQuestions}
              </span>
            )}
          </Button>

          <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900">
            <MessageSquare className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.fullName}</p>
                <p className="text-xs text-slate-500">{user?.role === "admin" ? "Administrador" : "Operador"}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
