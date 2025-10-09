"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, CheckCircle, Clock } from "lucide-react"

export function DashboardTab() {
  const stats = [
    {
      title: "Operadores Online",
      value: "1",
      description: "Ativos no momento",
      icon: Users,
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Roteiros Ativos",
      value: "3",
      description: "Scripts configurados",
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Atendimentos Hoje",
      value: "0",
      description: "Total do dia",
      icon: CheckCircle,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Tempo Médio",
      value: "0min",
      description: "Por atendimento",
      icon: Clock,
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
