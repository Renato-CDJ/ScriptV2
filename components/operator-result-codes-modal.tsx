"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useCachedResultCodes } from "@/hooks/use-cached-data"
import type { ResultCode } from "@/lib/types"
import { Search, ListChecks, ShieldCheck, ShieldAlert, Loader2, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OperatorResultCodesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OperatorResultCodesModal({ open, onOpenChange }: OperatorResultCodesModalProps) {
  const { resultCodes: resultCodesData, loading } = useCachedResultCodes()
  const [searchQuery, setSearchQuery] = useState("")
  const [globalZoom, setGlobalZoom] = useState(100)

  // Map Supabase data to component format
  const resultCodes = useMemo(() => resultCodesData
    .filter((c: any) => c.is_active)
    .map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description || "",
      phase: c.category === "before" ? "before" : "after",
      isActive: c.is_active,
    })), [resultCodesData])

  const beforeCodes = useMemo(() => {
    return resultCodes
      .filter((c) => c.phase === "before")
      .filter(
        (c) =>
          !searchQuery ||
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [resultCodes, searchQuery])

  const afterCodes = useMemo(() => {
    return resultCodes
      .filter((c) => c.phase === "after")
      .filter(
        (c) =>
          !searchQuery ||
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [resultCodes, searchQuery])

  const maxRows = Math.max(beforeCodes.length, afterCodes.length)
  const totalCodes = beforeCodes.length + afterCodes.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-6xl w-[90vw] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-lg">
                <ListChecks className="h-6 w-6" />
              </div>
              Tabulacoes - Antes e Depois da Confirmacao
            </DialogTitle>
            <DialogDescription className="text-blue-100 mt-2">
              Consulte as tabulacoes separadas por fase de identificacao do cliente
            </DialogDescription>
          </DialogHeader>
          
          {/* Barra de busca e controles */}
          <div className="flex items-center gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-200" />
              <Input
                placeholder="Buscar tabulacao..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus-visible:ring-white/30"
              />
            </div>
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setGlobalZoom(Math.max(80, globalZoom - 10))}
                className="h-8 w-8 text-white hover:bg-white/20"
                title="Diminuir texto"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-12 text-center">{globalZoom}%</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setGlobalZoom(Math.min(150, globalZoom + 10))}
                className="h-8 w-8 text-white hover:bg-white/20"
                title="Aumentar texto"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="px-6 py-3 bg-muted/50 border-b flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {totalCodes} {totalCodes === 1 ? "tabulacao encontrada" : "tabulacoes encontradas"}
          </span>
          {searchQuery && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSearchQuery("")}
              className="text-xs h-7"
            >
              Limpar busca
            </Button>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
                <p className="text-muted-foreground">Carregando tabulacoes...</p>
              </div>
            ) : resultCodes.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <ListChecks className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium">Nenhuma tabulacao cadastrada</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Entre em contato com o administrador
                </p>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-border overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-muted/80 to-muted/40">
                      <th className="text-left px-6 py-4 border-r-2 border-border w-1/2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                            <ShieldAlert className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <span 
                              className="font-bold text-foreground block"
                              style={{ fontSize: `${globalZoom}%` }}
                            >
                              Antes de confirmar os dados (CPF)
                            </span>
                            <Badge className="mt-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              {beforeCodes.length} {beforeCodes.length === 1 ? "tabulacao" : "tabulacoes"}
                            </Badge>
                          </div>
                        </div>
                      </th>
                      <th className="text-left px-6 py-4 w-1/2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md">
                            <ShieldCheck className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <span 
                              className="font-bold text-foreground block"
                              style={{ fontSize: `${globalZoom}%` }}
                            >
                              Apos confirmar os dados (CPF)
                            </span>
                            <Badge className="mt-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              {afterCodes.length} {afterCodes.length === 1 ? "tabulacao" : "tabulacoes"}
                            </Badge>
                          </div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {maxRows === 0 ? (
                      <tr>
                        <td colSpan={2} className="text-center py-12 text-muted-foreground">
                          <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
                          <p className="font-medium">Nenhum resultado encontrado</p>
                          <p className="text-sm mt-1">Tente buscar por outro termo</p>
                        </td>
                      </tr>
                    ) : (
                      Array.from({ length: maxRows }).map((_, i) => {
                        const beforeCode = beforeCodes[i]
                        const afterCode = afterCodes[i]
                        return (
                          <tr
                            key={`row-${i}`}
                            className="border-t border-border hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-6 py-4 border-r-2 border-border align-top">
                              {beforeCode ? (
                                <div className="group">
                                  <p 
                                    className="font-semibold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors"
                                    style={{ fontSize: `${globalZoom}%` }}
                                  >
                                    {beforeCode.name}
                                  </p>
                                  {beforeCode.description && (
                                    <p 
                                      className="text-muted-foreground mt-1 leading-relaxed"
                                      style={{ fontSize: `${globalZoom * 0.875}%` }}
                                    >
                                      {beforeCode.description}
                                    </p>
                                  )}
                                </div>
                              ) : null}
                            </td>
                            <td className="px-6 py-4 align-top">
                              {afterCode ? (
                                <div className="group">
                                  <p 
                                    className="font-semibold text-foreground group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors"
                                    style={{ fontSize: `${globalZoom}%` }}
                                  >
                                    {afterCode.name}
                                  </p>
                                  {afterCode.description && (
                                    <p 
                                      className="text-muted-foreground mt-1 leading-relaxed"
                                      style={{ fontSize: `${globalZoom * 0.875}%` }}
                                    >
                                      {afterCode.description}
                                    </p>
                                  )}
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
