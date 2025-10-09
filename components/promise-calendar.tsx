"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { CalendarIcon, AlertCircle, CheckCircle2 } from "lucide-react"
import { getMaxPromiseDate, isBusinessDay } from "@/lib/business-days"

type ProductType = "cartao" | "comercial" | "habitacional"

export function PromiseCalendar() {
  const [selectedProduct, setSelectedProduct] = useState<ProductType | "">("")
  const [showCalendarDialog, setShowCalendarDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const handleProductSelect = (value: string) => {
    setSelectedProduct(value as ProductType)
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

  return (
    <>
      <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setShowCalendarDialog(true)}>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Prazo para Promessa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative flex items-start gap-2 p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 border-2 border-blue-400 dark:border-blue-600 rounded-lg shadow-md animate-pulse hover:animate-none transition-all hover:shadow-lg hover:scale-[1.02]">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0 animate-bounce" />
            <div>
              <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                Clique aqui para verificar as datas para Promessas de Pagamento
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Selecione o tipo de produto e escolha uma data disponível
              </p>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Calendar
              mode="single"
              selected={today}
              disabled={(date) => date.getTime() !== today.getTime()}
              className="rounded-lg border shadow-sm scale-90 origin-top"
              classNames={{
                day_today: "ring-2 ring-orange-500 dark:ring-orange-400 font-bold text-gray-900 dark:text-gray-100",
                months: "flex flex-col space-y-2",
                month: "space-y-2 w-full",
                table: "w-full border-collapse",
                head_cell: "text-muted-foreground rounded-md w-8 font-medium text-xs",
                cell: "h-8 w-8 text-center text-xs p-0 relative",
                day: "h-8 w-8 p-0 font-normal text-sm text-gray-900 dark:text-gray-100",
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCalendarDialog} onOpenChange={setShowCalendarDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-orange-500" />
                Tipo de Produto
              </label>
              <Select value={selectedProduct} onValueChange={handleProductSelect}>
                <SelectTrigger className="w-full h-10 text-sm border-2 hover:border-orange-400 transition-colors">
                  <SelectValue placeholder="Escolha o tipo de produto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cartao" className="h-12">
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="font-bold text-sm">Cartão</span>
                      <span className="text-xs text-muted-foreground">Prazo: até 7 dias úteis</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="comercial" className="h-12">
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="font-bold text-sm">Comercial</span>
                      <span className="text-xs text-muted-foreground">Prazo: até 10 dias úteis</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="habitacional" className="h-12">
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="font-bold text-sm">Habitacional</span>
                      <span className="text-xs text-muted-foreground">Prazo: até 10 dias úteis</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!selectedProduct ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <p className="text-sm font-bold text-foreground">Data Atual</p>
                  </div>
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={today}
                      disabled={(date) => date.getTime() !== today.getTime()}
                      className="rounded-lg border-2 shadow-md"
                      classNames={{
                        day_today:
                          "ring-2 ring-orange-500 dark:ring-orange-400 font-bold text-gray-900 dark:text-gray-100",
                        months: "flex flex-col space-y-3",
                        month: "space-y-3 w-full",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                        table: "w-full border-collapse",
                        head_cell: "text-gray-700 dark:text-gray-200 rounded-md w-10 font-semibold text-sm",
                        cell: "h-10 w-10 text-center text-sm p-0 relative",
                        day: "h-10 w-10 p-0 font-semibold text-base text-gray-900 dark:text-gray-100",
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <p className="text-xs text-blue-900 dark:text-blue-100 font-medium">
                    Selecione um tipo de produto para ver as datas disponíveis
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {maxDate && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-l-4 border-green-500 rounded-lg p-3">
                    <p className="text-xs font-semibold text-green-800 dark:text-green-200 mb-1">
                      Data Máxima para Agendamento:
                    </p>
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">
                      {maxDate.toLocaleDateString("pt-BR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <p className="text-sm font-bold text-foreground">Datas Disponíveis para Promessa</p>
                  </div>
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => !isDateInRange(date)}
                      className="rounded-lg border-2 shadow-md"
                      modifiers={{
                        available: (date) => isDateInRange(date) && date.getTime() !== today.getTime(),
                      }}
                      modifiersClassNames={{
                        available:
                          "bg-green-100 dark:bg-green-900/50 text-green-900 dark:text-green-100 font-bold hover:bg-green-200 dark:hover:bg-green-800 border-2 border-green-400 dark:border-green-600",
                      }}
                      classNames={{
                        day_today:
                          "ring-2 ring-orange-500 dark:ring-orange-400 font-bold text-gray-900 dark:text-gray-100",
                        day_selected:
                          "bg-green-600 text-white dark:bg-green-500 dark:text-white font-bold hover:bg-green-700 dark:hover:bg-green-600 ring-2 ring-green-400 dark:ring-green-600",
                        day_disabled: "text-gray-400 dark:text-gray-600 opacity-40 line-through",
                        months: "flex flex-col space-y-3",
                        month: "space-y-3 w-full",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                        table: "w-full border-collapse",
                        head_cell: "text-gray-700 dark:text-gray-200 rounded-md w-10 font-semibold text-sm",
                        cell: "h-10 w-10 text-center text-sm p-0 relative",
                        day: "h-10 w-10 p-0 font-semibold text-base text-gray-900 dark:text-gray-100",
                      }}
                    />
                  </div>
                </div>

                {selectedDate && (
                  <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 border-l-4 border-green-500 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <p className="text-xs font-bold text-green-900 dark:text-green-100">Data Selecionada:</p>
                    </div>
                    <p className="text-sm font-bold text-green-700 dark:text-green-300 ml-6">
                      {selectedDate.toLocaleDateString("pt-BR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}

                <div className="bg-muted/30 dark:bg-muted/20 rounded-lg p-3 space-y-2 border">
                  <p className="font-bold text-xs text-foreground flex items-center gap-2">
                    <span className="text-sm">📋</span> Legenda:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-background rounded-md ring-2 ring-orange-500 dark:ring-orange-400 shadow-sm"></div>
                      <span className="text-xs font-medium">Hoje</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-100 dark:bg-green-900/50 border-2 border-green-400 dark:border-green-600 rounded-md shadow-sm"></div>
                      <span className="text-xs font-medium">Disponíveis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-600 dark:bg-green-500 rounded-md ring-2 ring-green-400 dark:ring-green-600 shadow-sm"></div>
                      <span className="text-xs font-medium">Selecionada</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-muted line-through rounded-md border-2 shadow-sm"></div>
                      <span className="text-xs font-medium">Indisponível</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={() => {
                setShowCalendarDialog(false)
                setSelectedProduct("")
                setSelectedDate(undefined)
              }}
              className="flex-1 h-10 bg-orange-500 hover:bg-orange-600 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-semibold text-sm"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
