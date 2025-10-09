"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Sparkles } from "lucide-react"
import { getProducts } from "@/lib/store"
import type { AttendanceConfig as AttendanceConfigType } from "@/lib/types"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

interface AttendanceConfigProps {
  onStart: (config: AttendanceConfigType) => void
}

export function AttendanceConfig({ onStart }: AttendanceConfigProps) {
  const [attendanceType, setAttendanceType] = useState<"ativo" | "receptivo" | null>(null)
  const [personType, setPersonType] = useState<"fisica" | "juridica" | null>(null)
  const [product, setProduct] = useState<string>("")
  const [products, setProducts] = useState(getProducts().filter((p) => p.isActive))

  useEffect(() => {
    const handleStoreUpdate = () => {
      console.log("[v0] Store updated, refreshing products")
      setProducts(getProducts().filter((p) => p.isActive))
    }

    window.addEventListener("store-updated", handleStoreUpdate)
    return () => window.removeEventListener("store-updated", handleStoreUpdate)
  }, [])

  const filteredProducts = products.filter((p) => {
    if (!attendanceType || !personType) return false
    const matchesAttendance = p.attendanceTypes?.includes(attendanceType) ?? false
    const matchesPerson = p.personTypes?.includes(personType) ?? false
    return matchesAttendance && matchesPerson
  })

  const canSelectProduct = attendanceType !== null && personType !== null

  const handleStart = () => {
    if (!attendanceType || !personType || !product) {
      alert("Por favor, complete todas as seleções antes de iniciar")
      return
    }

    onStart({
      attendanceType,
      personType,
      product,
    })
  }

  const handleReset = () => {
    setAttendanceType(null)
    setPersonType(null)
    setProduct("")
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Wrapped Card component with TooltipProvider */}
      <TooltipProvider>
        <Card className="relative shadow-2xl border-0 bg-gradient-to-br from-white via-orange-50/30 to-amber-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-400/10 to-amber-400/10 dark:from-orange-500/5 dark:to-amber-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-orange-400/10 to-amber-400/10 dark:from-orange-500/5 dark:to-amber-500/5 rounded-full blur-3xl"></div>

          <CardHeader className="pb-6 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 bg-clip-text text-transparent">
                  Configuração de Atendimento
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30 font-semibold"
              >
                <div className="h-5 w-5 rounded-full bg-green-600 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
                Verificar Tabulação
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-10 pb-10 relative z-10">
            {/* Tipo de atendimento */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground text-center">Tipo de Atendimento</h3>
              <div className="flex gap-4 justify-center">
                <Button
                  variant={attendanceType === "ativo" ? "default" : "outline"}
                  size="lg"
                  onClick={() => setAttendanceType("ativo")}
                  className={
                    attendanceType === "ativo"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-white dark:to-gray-100 dark:hover:from-gray-100 dark:hover:to-white text-white dark:text-black font-bold border-0 shadow-xl hover:shadow-2xl hover:scale-105 transition-all min-w-[160px] h-14 text-base"
                      : "bg-white dark:bg-zinc-800 hover:bg-orange-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-white border-2 border-gray-300 dark:border-zinc-600 hover:border-orange-300 dark:hover:border-orange-500 min-w-[160px] h-14 text-base font-semibold transition-all hover:scale-105"
                  }
                >
                  Ativo
                </Button>
                <Button
                  variant={attendanceType === "receptivo" ? "default" : "outline"}
                  size="lg"
                  onClick={() => setAttendanceType("receptivo")}
                  className={
                    attendanceType === "receptivo"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-white dark:to-gray-100 dark:hover:from-gray-100 dark:hover:to-white text-white dark:text-black font-bold border-0 shadow-xl hover:shadow-2xl hover:scale-105 transition-all min-w-[160px] h-14 text-base"
                      : "bg-white dark:bg-zinc-800 hover:bg-orange-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-white border-2 border-gray-300 dark:border-zinc-600 hover:border-orange-300 dark:hover:border-orange-500 min-w-[160px] h-14 text-base font-semibold transition-all hover:scale-105"
                  }
                >
                  Receptivo
                </Button>
              </div>
            </div>

            {/* Pessoa */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground text-center">Tipo de Pessoa</h3>
              <div className="flex gap-4 justify-center">
                <Button
                  variant={personType === "fisica" ? "default" : "outline"}
                  size="lg"
                  onClick={() => setPersonType("fisica")}
                  className={
                    personType === "fisica"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-white dark:to-gray-100 dark:hover:from-gray-100 dark:hover:to-white text-white dark:text-black font-bold border-0 shadow-xl hover:shadow-2xl hover:scale-105 transition-all min-w-[160px] h-14 text-base"
                      : "bg-white dark:bg-zinc-800 hover:bg-orange-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-white border-2 border-gray-300 dark:border-zinc-600 hover:border-orange-300 dark:hover:border-orange-500 min-w-[160px] h-14 text-base font-semibold transition-all hover:scale-105"
                  }
                >
                  Física
                </Button>
                <Button
                  variant={personType === "juridica" ? "default" : "outline"}
                  size="lg"
                  onClick={() => setPersonType("juridica")}
                  className={
                    personType === "juridica"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-white dark:to-gray-100 dark:hover:from-gray-100 dark:hover:to-white text-white dark:text-black font-bold border-0 shadow-xl hover:shadow-2xl hover:scale-105 transition-all min-w-[160px] h-14 text-base"
                      : "bg-white dark:bg-zinc-800 hover:bg-orange-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-white border-2 border-gray-300 dark:border-zinc-600 hover:border-orange-300 dark:hover:border-orange-500 min-w-[160px] h-14 text-base font-semibold transition-all hover:scale-105"
                  }
                >
                  Jurídica
                </Button>
              </div>
            </div>

            {canSelectProduct && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground text-center">Selecione o Produto</h3>
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground bg-white/50 dark:bg-zinc-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-zinc-700">
                    <p className="text-lg font-semibold">Nenhum produto disponível</p>
                    <p className="text-sm mt-2">Entre em contato com o administrador.</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-4 justify-center">
                    {filteredProducts.map((prod) => (
                      <Tooltip key={prod.id}>
                        <TooltipTrigger asChild>
                          <Button
                            variant={product === prod.id ? "default" : "outline"}
                            size="lg"
                            onClick={() => setProduct(prod.id)}
                            className={
                              product === prod.id
                                ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-white dark:to-gray-100 dark:hover:from-gray-100 dark:hover:to-white text-white dark:text-black font-bold uppercase border-0 shadow-xl hover:shadow-2xl hover:scale-105 transition-all min-w-[160px] h-14 text-base"
                                : "bg-white dark:bg-zinc-800 hover:bg-orange-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-white border-2 border-gray-300 dark:border-zinc-600 hover:border-orange-300 dark:hover:border-orange-500 uppercase min-w-[160px] h-14 text-base font-semibold transition-all hover:scale-105"
                            }
                          >
                            {prod.name}
                          </Button>
                        </TooltipTrigger>
                        {prod.description && (
                          <TooltipContent side="top" className="max-w-xs">
                            <p>{prod.description}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </TooltipProvider>

      {/* Action Buttons */}
      <div className="flex justify-center gap-6 mt-8">
        <Button
          size="lg"
          onClick={handleStart}
          disabled={!attendanceType || !personType || !product}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-white dark:to-gray-100 dark:hover:from-gray-100 dark:hover:to-white text-white dark:text-black font-bold px-16 py-7 text-xl shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 hover:scale-110 border-0 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          Iniciar Atendimento
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={handleReset}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-800 dark:hover:to-gray-900 text-white font-bold px-16 py-7 text-xl shadow-2xl hover:shadow-amber-500/50 transition-all duration-300 hover:scale-110 border-0 rounded-2xl"
        >
          Limpar
        </Button>
      </div>
    </div>
  )
}
