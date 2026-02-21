"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Circle,
  Clock,
  Monitor,
  LogIn,
  FileText,
  Filter,
} from "lucide-react"
import {
  getOperatorsWithStatus,
  getOnlineOperatorsCount,
  getAllUsers,
  convertFirestoreTimestamp,
} from "@/lib/store"
import type { User } from "@/lib/types"

type StatusDetail = "online" | "idle" | "offline"

function safeDate(date: any): Date | null {
  if (!date) return null
  try {
    const d = convertFirestoreTimestamp(date)
    if (isNaN(d.getTime())) return null
    return d
  } catch {
    return null
  }
}

function formatTimeAgo(date: any): string {
  const d = safeDate(date)
  if (!d) return "Nunca"
  const now = Date.now()
  const diff = now - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return "Agora"
  if (minutes < 60) return `${minutes}min atras`
  if (hours < 24) return `${hours}h atras`
  return `${days}d atras`
}

function formatDateTime(date: any): string {
  const d = safeDate(date)
  if (!d) return "-"
  return `${d.toLocaleDateString("pt-BR")} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
}

function StatusIndicator({ status }: { status: StatusDetail }) {
  const config = {
    online: { color: "text-green-500", bg: "bg-green-500", label: "Online", animate: true },
    idle: { color: "text-amber-500", bg: "bg-amber-500", label: "Ausente", animate: false },
    offline: { color: "text-muted-foreground/40", bg: "bg-muted-foreground/40", label: "Offline", animate: false },
  }
  const c = config[status]
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        {c.animate && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${c.bg} opacity-75`} />
        )}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${c.bg}`} />
      </span>
      <span className={`text-xs font-medium ${c.color}`}>{c.label}</span>
    </div>
  )
}

export function DashboardTab() {
  const [operators, setOperators] = useState<(User & { statusDetail: StatusDetail })[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | StatusDetail>("all")
  const [filterScript, setFilterScript] = useState<"all" | "accessed" | "not-accessed">("all")
  const [onlineCount, setOnlineCount] = useState(0)

  useEffect(() => {
    const updateData = () => {
      setOperators(getOperatorsWithStatus())
      setOnlineCount(getOnlineOperatorsCount())
    }

    updateData()

    // Refresh every 10 seconds for near real-time
    const interval = setInterval(updateData, 10000)

    const handleStoreUpdate = () => updateData()
    window.addEventListener("store-updated", handleStoreUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener("store-updated", handleStoreUpdate)
    }
  }, [])

  const totalOperators = operators.length
  const idleCount = operators.filter((o) => o.statusDetail === "idle").length
  const offlineCount = operators.filter((o) => o.statusDetail === "offline").length
  const activeOnline = operators.filter((o) => o.statusDetail === "online").length

  // Today's script access
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const accessedTodayCount = operators.filter((o) => {
    const d = safeDate(o.lastScriptAccess)
    if (!d) return false
    return d.getTime() >= today.getTime()
  }).length
  const notAccessedTodayCount = totalOperators - accessedTodayCount

  const filteredOperators = useMemo(() => {
    let list = [...operators]

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((o) => o.fullName.toLowerCase().includes(q) || o.username.toLowerCase().includes(q))
    }

    // Status filter
    if (filterStatus !== "all") {
      list = list.filter((o) => o.statusDetail === filterStatus)
    }

    // Script access filter
    if (filterScript === "accessed") {
      list = list.filter((o) => {
        const d = safeDate(o.lastScriptAccess)
        if (!d) return false
        return d.getTime() >= today.getTime()
      })
    } else if (filterScript === "not-accessed") {
      list = list.filter((o) => {
        const d = safeDate(o.lastScriptAccess)
        if (!d) return true
        return d.getTime() < today.getTime()
      })
    }

    // Sort: online first, then idle, then offline; within each group sort by name
    const order = { online: 0, idle: 1, offline: 2 }
    list.sort((a, b) => {
      const diff = order[a.statusDetail] - order[b.statusDetail]
      if (diff !== 0) return diff
      return a.fullName.localeCompare(b.fullName)
    })

    return list
  }, [operators, searchQuery, filterStatus, filterScript])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          Monitoramento de operadores em tempo real
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{activeOnline}</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{idleCount}</p>
                <p className="text-xs text-muted-foreground">Ausente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center">
                <UserX className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{offlineCount}</p>
                <p className="text-xs text-muted-foreground">Offline</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{accessedTodayCount}</p>
                <p className="text-xs text-muted-foreground">Acessou roteiro</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{notAccessedTodayCount}</p>
                <p className="text-xs text-muted-foreground">Nao acessou</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar operador..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Status:</span>
              {(["all", "online", "idle", "offline"] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={filterStatus === s ? "default" : "outline"}
                  onClick={() => setFilterStatus(s)}
                  className={`text-xs h-7 ${filterStatus === s ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}`}
                >
                  {s === "all" && `Todos (${totalOperators})`}
                  {s === "online" && `Online (${activeOnline})`}
                  {s === "idle" && `Ausente (${idleCount})`}
                  {s === "offline" && `Offline (${offlineCount})`}
                </Button>
              ))}
            </div>

            {/* Script Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Roteiro:</span>
              {(["all", "accessed", "not-accessed"] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={filterScript === s ? "default" : "outline"}
                  onClick={() => setFilterScript(s)}
                  className={`text-xs h-7 ${filterScript === s ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}`}
                >
                  {s === "all" && "Todos"}
                  {s === "accessed" && `Acessou (${accessedTodayCount})`}
                  {s === "not-accessed" && `Nao acessou (${notAccessedTodayCount})`}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operators Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-500" />
            Operadores ({filteredOperators.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    Operador
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    Ultimo login
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    Ultima atividade
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    Roteiro (hoje)
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    Produto atual
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOperators.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                      Nenhum operador encontrado
                    </td>
                  </tr>
                ) : (
                  filteredOperators.map((op) => {
                    const scriptDate = safeDate(op.lastScriptAccess)
                    const accessedToday = scriptDate && scriptDate.getTime() >= today.getTime()

                    return (
                      <tr
                        key={op.id}
                        className="border-b border-border/50 last:border-b-0 hover:bg-muted/20 transition-colors"
                      >
                        {/* Name */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              op.statusDetail === "online"
                                ? "bg-green-500"
                                : op.statusDetail === "idle"
                                  ? "bg-amber-500"
                                  : "bg-muted-foreground/30"
                            }`}>
                              {op.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{op.fullName}</p>
                              <p className="text-[11px] text-muted-foreground">@{op.username}</p>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <StatusIndicator status={op.statusDetail} />
                        </td>

                        {/* Last login */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <LogIn className="h-3.5 w-3.5" />
                            <span>{formatDateTime(op.lastLoginAt)}</span>
                          </div>
                        </td>

                        {/* Last heartbeat */}
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(op.lastHeartbeat)}
                          </span>
                        </td>

                        {/* Script access today */}
                        <td className="px-5 py-3.5">
                          {accessedToday ? (
                            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 border-green-500/20 text-[10px]">
                              Acessou
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600 dark:text-red-400 border-red-500/20 bg-red-500/5 text-[10px]">
                              Nao acessou
                            </Badge>
                          )}
                        </td>

                        {/* Current product */}
                        <td className="px-5 py-3.5">
                          {accessedToday && op.currentProductName ? (
                            <span className="text-xs font-medium text-foreground">{op.currentProductName}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
