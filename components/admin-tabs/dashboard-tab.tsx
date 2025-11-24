"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Users, MessageSquare, Presentation, BrainCircuit, CalendarIcon, Clock } from "lucide-react"
import {
  getOnlineOperatorsCount,
  getProducts,
  getQuizRespondentsCount,
  getMessageViewersCount,
  getPresentationViewersCount,
  getAllUsers,
  getConnectedTimeForDate,
} from "@/lib/store"

export function DashboardTab() {
  const [onlineCount, setOnlineCount] = useState(0)
  const [productsCount, setProductsCount] = useState(0)
  const [quizRespondents, setQuizRespondents] = useState(0)
  const [messageViewers, setMessageViewers] = useState(0)
  const [presentationViewers, setPresentationViewers] = useState(0)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [operatorTimes, setOperatorTimes] = useState<{ name: string; time: number }[]>([])

  useEffect(() => {
    const updateCounts = () => {
      setOnlineCount(getOnlineOperatorsCount())
      setProductsCount(getProducts().filter((p) => p.isActive).length)
      setQuizRespondents(getQuizRespondentsCount())
      setMessageViewers(getMessageViewersCount())
      setPresentationViewers(getPresentationViewersCount())
    }

    updateCounts()

    const interval = setInterval(updateCounts, 5000)

    const handleStoreUpdate = () => {
      updateCounts()
    }

    window.addEventListener("store-updated", handleStoreUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener("store-updated", handleStoreUpdate)
    }
  }, [])

  useEffect(() => {
    if (selectedDate) {
      const users = getAllUsers()
      const operators = users.filter((u) => u.role === "operator")
      const times = operators.map((op) => ({
        name: op.fullName,
        time: getConnectedTimeForDate(op.id, selectedDate),
      }))
      times.sort((a, b) => b.time - a.time)
      setOperatorTimes(times)
    }
  }, [selectedDate])

  const formatDuration = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60))
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}min`
  }

  const stats = [
    {
      title: "Operadores Online",
      value: onlineCount.toString(),
      description: "Ativos no momento",
      icon: Users,
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Respostas Quiz",
      value: quizRespondents.toString(),
      description: "Operadores que responderam",
      icon: BrainCircuit,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Visualizações de Recados",
      value: messageViewers.toString(),
      description: "Operadores que leram",
      icon: MessageSquare,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Treinamentos Vistos",
      value: presentationViewers.toString(),
      description: "Operadores que assistiram",
      icon: Presentation,
      color: "text-orange-600 dark:text-orange-400",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Visão geral do sistema de atendimento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tempo Conectado por Dia</CardTitle>
            <CardDescription>Visualize o tempo de conexão dos operadores em uma data específica</CardDescription>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus locale={ptBR} />
            </PopoverContent>
          </Popover>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {operatorTimes.length > 0 ? (
              <div className="border rounded-md">
                <div className="grid grid-cols-2 gap-4 p-4 font-medium border-b bg-muted/50">
                  <div>Operador</div>
                  <div className="text-right">Tempo Conectado</div>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {operatorTimes.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-2 gap-4 p-4 border-b last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {item.name.substring(0, 2).toUpperCase()}
                        </div>
                        {item.name}
                      </div>
                      <div className="flex items-center justify-end gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatDuration(item.time)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">Nenhum operador encontrado.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Últimas ações no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Nenhuma atividade registrada ainda</div>
        </CardContent>
      </Card>
    </div>
  )
}
