"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, CheckCircle2, Info, CreditCard, Building2, Home } from "lucide-react"
import { getMaxPromiseDate, isBusinessDay } from "@/lib/business-days"

type ProductType = "cartao" | "comercial" | "habitacional"

export function PromiseCalendarInline() {
  const [selectedProduct, setSelectedProduct] = useState<ProductType | "">("")
  const [selectedDate, setSelectedDate] = useState<Date>()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const handleProductSelect = (value: ProductType) => {
    setSelectedProduct(value)
    setSelectedDate(undefined)
  }

  const maxDate = selectedProduct ? getMaxPromiseDate(selectedProduct) : undefined

  const isDateInRange = (date: Date) => {
    if (!selectedProduct) return false

    const dateTime = new Date(date)
    dateTime.setHours(0, 0, 0, 0)
    const todayTime = new Date(today)
    todayTime.setHours(0, 0, 0, 0)

    if (dateTime < todayTime) return false

    if (maxDate) {
      const maxDateTime = new Date(maxDate)
      maxDateTime.setHours(0, 0, 0, 0)
      if (dateTime > maxDateTime) return false
    }

    return isBusinessDay(dateTime)
  }

  const productOptions = [
    {
      value: "cartao" as ProductType,
      name: "Cartão fase 1",
      deadline: "7 dias úteis",
      icon: CreditCard,
    },
    {
      value: "comercial" as ProductType,
      name: "Comercial",
      deadline: "10 dias úteis",
      icon: Building2,
    },
    {
      value: "habitacional" as ProductType,
      name: "Habitacional",
      deadline: "10 dias úteis",
      icon: Home,
    },
  ]

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
          <CalendarIcon className="h-4 w-4 text-primary" />
          Calendário de Promessas
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">Selecione o tipo de produto e escolha uma data disponível</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-primary" />
            Tipo de Produto
          </label>
          <div className="grid grid-cols-1 gap-2">
            {productOptions.map((product) => {
              const Icon = product.icon
              const isSelected = selectedProduct === product.value
              return (
                <button
                  key={product.value}
                  onClick={() => handleProductSelect(product.value)}
                  className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                    isSelected
                      ? "bg-orange-500 dark:bg-gradient-to-r dark:from-orange-500 dark:to-amber-500 border-orange-600 dark:border-orange-400 shadow-md"
                      : "bg-card border-border hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${isSelected ? "bg-white/20 dark:bg-white/10" : "bg-muted"}`}>
                      <Icon className={`h-5 w-5 ${isSelected ? "text-white" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-semibold text-sm ${isSelected ? "text-white" : "text-foreground"}`}>
                        {product.name}
                      </p>
                      <p className={`text-xs ${isSelected ? "text-white/90" : "text-muted-foreground"}`}>
                        Prazo: {product.deadline}
                      </p>
                    </div>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-white flex-shrink-0" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {!selectedProduct ? (
          <div className="space-y-3">
            {/* Current Date Calendar */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md">
                <CalendarIcon className="h-3 w-3 text-primary" />
                <p className="text-xs font-semibold text-foreground">Data Atual</p>
              </div>
              <div className="flex justify-center p-2 bg-card rounded-lg border border-border">
                <Calendar
                  mode="single"
                  selected={today}
                  disabled={(date) => date.getTime() !== today.getTime()}
                  className="rounded-lg scale-90"
                  classNames={{
                    day_today: "bg-primary text-primary-foreground font-bold ring-2 ring-primary/20",
                    months: "flex flex-col space-y-2",
                    month: "space-y-2 w-full",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-xs font-semibold",
                    nav: "space-x-1 flex items-center",
                    nav_button:
                      "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-accent rounded-md transition-colors",
                    table: "w-full border-collapse",
                    head_cell: "text-muted-foreground rounded-md w-8 font-semibold text-[10px]",
                    cell: "h-8 w-8 text-center text-xs p-0 relative",
                    day: "h-8 w-8 p-0 font-medium text-xs hover:bg-accent rounded-md transition-colors",
                  }}
                />
              </div>
            </div>

            {/* Info Message */}
            <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 rounded-md">
              <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-900 dark:text-blue-100 font-medium">
                Selecione um tipo de produto acima para visualizar as datas disponíveis
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Max Date Info */}
            {maxDate && (
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-l-4 border-emerald-500 rounded-md p-2">
                <p className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-200 mb-0.5 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Data Máxima
                </p>
                <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  {maxDate.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}

            {/* Available Dates Calendar */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md">
                <CalendarIcon className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs font-semibold text-foreground">Datas Disponíveis</p>
              </div>
              <div className="flex justify-center p-2 bg-card rounded-lg border border-border">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => !isDateInRange(date)}
                  className="rounded-lg scale-90"
                  modifiers={{
                    available: (date) => isDateInRange(date) && date.getTime() !== today.getTime(),
                  }}
                  modifiersClassNames={{
                    available:
                      "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-100 font-semibold hover:bg-emerald-200 dark:hover:bg-emerald-800 border-2 border-emerald-400 dark:border-emerald-600",
                  }}
                  classNames={{
                    day_today: "bg-primary text-primary-foreground font-bold ring-2 ring-primary/20",
                    day_selected:
                      "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white font-bold hover:bg-emerald-700 dark:hover:bg-emerald-600 ring-2 ring-emerald-400 dark:ring-emerald-600",
                    day_disabled: "text-muted-foreground opacity-30 line-through cursor-not-allowed",
                    months: "flex flex-col space-y-2",
                    month: "space-y-2 w-full",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-xs font-semibold",
                    nav: "space-x-1 flex items-center",
                    nav_button:
                      "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-accent rounded-md transition-colors",
                    table: "w-full border-collapse",
                    head_cell: "text-muted-foreground rounded-md w-8 font-semibold text-[10px]",
                    cell: "h-8 w-8 text-center text-xs p-0 relative",
                    day: "h-8 w-8 p-0 font-medium text-xs hover:bg-accent rounded-md transition-colors",
                  }}
                />
              </div>
            </div>

            {/* Selected Date Display */}
            {selectedDate && (
              <div className="bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/40 dark:to-green-900/40 border-l-4 border-emerald-500 rounded-md p-2">
                <div className="flex items-center gap-1 mb-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-[10px] font-bold text-emerald-900 dark:text-emerald-100">Data Selecionada</p>
                </div>
                <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 ml-4">
                  {selectedDate.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
