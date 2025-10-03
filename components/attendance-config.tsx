"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { getProducts } from "@/lib/store"
import type { AttendanceConfig as AttendanceConfigType } from "@/lib/types"

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
    <div className="max-w-4xl mx-auto">
      <Card className="relative">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Início</CardTitle>
            <Button variant="ghost" size="sm" className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50">
              <div className="h-5 w-5 rounded-full bg-green-600 flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
              Verificar Tabulação
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pb-8">
          {/* Tipo de atendimento */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-foreground">Tipo de atendimento</h3>
            <div className="flex gap-3">
              <Button
                variant={attendanceType === "ativo" ? "default" : "outline"}
                size="lg"
                onClick={() => setAttendanceType("ativo")}
                className={
                  attendanceType === "ativo"
                    ? "bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                    : "bg-white hover:bg-gray-50 text-gray-700 border-2"
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
                    ? "bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                    : "bg-white hover:bg-gray-50 text-gray-700 border-2"
                }
              >
                Receptivo
              </Button>
            </div>
          </div>

          {/* Pessoa */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-foreground">Pessoa</h3>
            <div className="flex gap-3">
              <Button
                variant={personType === "fisica" ? "default" : "outline"}
                size="lg"
                onClick={() => setPersonType("fisica")}
                className={
                  personType === "fisica"
                    ? "bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                    : "bg-white hover:bg-gray-50 text-gray-700 border-2"
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
                    ? "bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                    : "bg-white hover:bg-gray-50 text-gray-700 border-2"
                }
              >
                Jurídica
              </Button>
            </div>
          </div>

          {canSelectProduct && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">Produto</h3>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum produto disponível para esta combinação.</p>
                  <p className="text-sm mt-1">Entre em contato com o administrador.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {filteredProducts.map((prod) => (
                    <Button
                      key={prod.id}
                      variant={product === prod.id ? "default" : "outline"}
                      size="lg"
                      onClick={() => setProduct(prod.id)}
                      className={
                        product === prod.id
                          ? "bg-orange-500 hover:bg-orange-600 text-white font-semibold uppercase"
                          : "bg-white hover:bg-gray-50 text-gray-700 border-2 uppercase"
                      }
                    >
                      {prod.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-6">
        <Button
          size="lg"
          onClick={handleStart}
          disabled={!attendanceType || !personType || !product}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8"
        >
          Iniciar
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={handleReset}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 border-0"
        >
          Resetar
        </Button>
      </div>
    </div>
  )
}
