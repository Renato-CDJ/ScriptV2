"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import {
  Search,
  Sun,
  Moon,
  LogOut,
  Circle,
  PanelRightClose,
  PanelRightOpen,
  Eye,
  EyeOff,
  Home,
  Hash,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { getProducts } from "@/lib/store"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTheme } from "next-themes"

interface OperatorHeaderProps {
  searchQuery?: string
  onSearchChange?: (query: string) => void
  isSidebarOpen?: boolean
  onToggleSidebar?: () => void
  showControls?: boolean
  onToggleControls?: () => void
  isSessionActive?: boolean
  onBackToStart?: () => void
  onProductSelect?: (productId: string) => void
}

export function OperatorHeader({
  searchQuery = "",
  onSearchChange,
  isSidebarOpen = true,
  onToggleSidebar,
  showControls = true,
  onToggleControls,
  isSessionActive = false,
  onBackToStart,
  onProductSelect,
}: OperatorHeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [products, setProducts] = useState(getProducts().filter((p) => p.isActive))

  useEffect(() => {
    const handleStoreUpdate = () => {
      setProducts(getProducts().filter((p) => p.isActive))
    }

    window.addEventListener("store-updated", handleStoreUpdate)
    return () => window.removeEventListener("store-updated", handleStoreUpdate)
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleSearchInput = (value: string) => {
    if (value.startsWith("#")) {
      setShowProductSearch(true)
    } else {
      setShowProductSearch(false)
      onSearchChange?.(value)
    }
  }

  const handleProductSelect = (productId: string) => {
    setShowProductSearch(false)
    onSearchChange?.("")
    onProductSelect?.(productId)
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
              <Popover open={showProductSearch} onOpenChange={setShowProductSearch}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Pesquisar títulos ou #produto..."
                      value={searchQuery}
                      onChange={(e) => handleSearchInput(e.target.value)}
                      className="pl-9 pr-9 text-sm"
                    />
                    {searchQuery.startsWith("#") && (
                      <Hash className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500 animate-pulse" />
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Digite o nome do produto..." />
                    <CommandList>
                      <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                      <CommandGroup heading="Produtos Disponíveis">
                        {products.map((product) => (
                          <CommandItem
                            key={product.id}
                            onSelect={() => handleProductSelect(product.id)}
                            className="cursor-pointer"
                          >
                            <Hash className="mr-2 h-4 w-4 text-orange-500" />
                            <span className="font-semibold">{product.name}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToStart}
              className="gap-1 md:gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 dark:from-green-600 dark:to-emerald-600 dark:hover:from-green-700 dark:hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all font-semibold"
              title="Voltar ao Início"
            >
              <Home className="h-4 w-4" />
              <span className="hidden lg:inline text-xs md:text-sm">Voltar ao Início</span>
            </Button>

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
              {theme === "dark" ? (
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
