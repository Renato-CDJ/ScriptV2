"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { getActiveResultCodes } from "@/lib/store"
import type { ResultCode } from "@/lib/types"
import { Search, ListChecks, ShieldCheck, ShieldAlert, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OperatorResultCodesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OperatorResultCodesModal({ open, onOpenChange }: OperatorResultCodesModalProps) {
  const [resultCodes, setResultCodes] = useState<ResultCode[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (open) {
      setResultCodes(getActiveResultCodes())
    }
  }, [open])

  useEffect(() => {
    const handleStoreUpdate = () => {
      if (open) {
        setResultCodes(getActiveResultCodes())
      }
    }
    window.addEventListener("store-updated", handleStoreUpdate)
    return () => window.removeEventListener("store-updated", handleStoreUpdate)
  }, [open])

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[98vw] w-[98vw] max-h-[90vh] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b bg-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <ListChecks className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogHeader className="p-0 space-y-0">
                <DialogTitle className="text-lg font-bold text-foreground">
                  Codigos de Resultado
                </DialogTitle>
              </DialogHeader>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tabulacoes por fase de identificacao
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-5 sm:px-6 py-3 border-b bg-muted/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar tabulacao..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm h-9"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-auto px-3 py-4">
          {resultCodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                <ListChecks className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">
                Nenhum codigo de resultado cadastrado
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="text-left px-5 py-3 border-r border-border whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wide text-foreground">
                          Antes da Identificacao Positiva
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                          {beforeCodes.length}
                        </Badge>
                      </div>
                    </th>
                    <th className="text-left px-5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-green-500 shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wide text-foreground">
                          Apos Identificacao Positiva
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                          {afterCodes.length}
                        </Badge>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {maxRows === 0 ? (
                    <tr>
                      <td colSpan={2} className="text-center py-8 text-muted-foreground text-sm">
                        Nenhum resultado encontrado para a pesquisa
                      </td>
                    </tr>
                  ) : (
                    Array.from({ length: maxRows }).map((_, i) => {
                      const beforeCode = beforeCodes[i]
                      const afterCode = afterCodes[i]
                      return (
                        <tr
                          key={`row-${i}`}
                          className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-5 py-3 border-r border-border align-top whitespace-nowrap">
                            {beforeCode ? (
                              <div>
                                <p className="text-sm font-semibold text-foreground">{beforeCode.name}</p>
                                {beforeCode.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {beforeCode.description}
                                  </p>
                                )}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-5 py-3 align-top whitespace-nowrap">
                            {afterCode ? (
                              <div>
                                <p className="text-sm font-semibold text-foreground">{afterCode.name}</p>
                                {afterCode.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
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
      </DialogContent>
    </Dialog>
  )
}
