"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import * as firebaseStore from "@/lib/firebase-store"
import { CheckCircle2, AlertCircle, Loader2, Database } from 'lucide-react'

interface VerificationStats {
  users: number
  products: number
  steps: number
  tabulations: number
  situations: number
  channels: number
  messages: number
  quizzes: number
  quizAttempts: number
  chatMessages: number
  presentations: number
  notes: number
}

export function FirebaseVerification() {
  const [stats, setStats] = useState<VerificationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function verifyData() {
      try {
        setLoading(true)
        console.log("[v0] Verifying Firebase data...")

        const [
          users,
          products,
          steps,
          tabulations,
          situations,
          channels,
          messages,
          quizzes,
          quizAttempts,
          chatMessages,
          presentations,
          notes,
        ] = await Promise.all([
          firebaseStore.getAllUsers(),
          firebaseStore.getProducts(),
          firebaseStore.getScriptSteps(),
          firebaseStore.getTabulations(),
          firebaseStore.getSituations(),
          firebaseStore.getChannels(),
          firebaseStore.getMessages(),
          firebaseStore.getQuizzes(),
          firebaseStore.getQuizAttempts(),
          firebaseStore.getAllChatMessages(),
          firebaseStore.getPresentations(),
          firebaseStore.getPresentationProgress(), // Using progress as proxy for notes
        ])

        setStats({
          users: users.length,
          products: products.length,
          steps: steps.length,
          tabulations: tabulations.length,
          situations: situations.length,
          channels: channels.length,
          messages: messages.length,
          quizzes: quizzes.length,
          quizAttempts: quizAttempts.length,
          chatMessages: chatMessages.length,
          presentations: presentations.length,
          notes: notes.length,
        })

        console.log("[v0] Firebase verification complete", stats)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido"
        setError(message)
        console.error("[v0] Verification error:", err)
      } finally {
        setLoading(false)
      }
    }

    verifyData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <div>
              <CardTitle>Verificação de Dados Firebase</CardTitle>
              <CardDescription>Verificando sincronização de dados...</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span>Conectando ao Firebase...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <CardTitle>Erro na Verificação</CardTitle>
              <CardDescription>Não foi possível conectar ao Firebase</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Erro:</strong> {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const totalRecords = stats
    ? Object.values(stats).reduce((a, b) => a + b, 0)
    : 0

  const hasData = totalRecords > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasData ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            <div>
              <CardTitle>Verificação de Dados Firebase</CardTitle>
              <CardDescription>
                {hasData
                  ? `${totalRecords} registros encontrados no Firebase`
                  : "Nenhum dado encontrado no Firebase"}
              </CardDescription>
            </div>
          </div>
          <Badge variant={hasData ? "default" : "secondary"}>
            {hasData ? "Conectado" : "Vazio"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {/* Users */}
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground">Usuários</p>
            <p className="text-2xl font-bold">{stats?.users ?? 0}</p>
          </div>

          {/* Products */}
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground">Produtos</p>
            <p className="text-2xl font-bold">{stats?.products ?? 0}</p>
          </div>

          {/* Script Steps */}
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground">Passos</p>
            <p className="text-2xl font-bold">{stats?.steps ?? 0}</p>
          </div>

          {/* Tabulations */}
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground">Tabulações</p>
            <p className="text-2xl font-bold">{stats?.tabulations ?? 0}</p>
          </div>

          {/* Situations */}
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground">Situações</p>
            <p className="text-2xl font-bold">{stats?.situations ?? 0}</p>
          </div>

          {/* Channels */}
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground">Canais</p>
            <p className="text-2xl font-bold">{stats?.channels ?? 0}</p>
          </div>

          {/* Messages */}
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground">Mensagens</p>
            <p className="text-2xl font-bold">{stats?.messages ?? 0}</p>
          </div>

          {/* Quizzes */}
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground">Quizzes</p>
            <p className="text-2xl font-bold">{stats?.quizzes ?? 0}</p>
          </div>

          {/* Quiz Attempts */}
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground">Tentativas</p>
            <p className="text-2xl font-bold">{stats?.quizAttempts ?? 0}</p>
          </div>

          {/* Chat Messages */}
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground">Chat</p>
            <p className="text-2xl font-bold">{stats?.chatMessages ?? 0}</p>
          </div>

          {/* Presentations */}
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground">Apresentações</p>
            <p className="text-2xl font-bold">{stats?.presentations ?? 0}</p>
          </div>

          {/* Notes */}
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground">Notas</p>
            <p className="text-2xl font-bold">{stats?.notes ?? 0}</p>
          </div>
        </div>

        {hasData && (
          <Alert className="mt-4 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Seus dados estão sincronizados com sucesso no Firebase Firestore!
            </AlertDescription>
          </Alert>
        )}

        {!hasData && (
          <Alert className="mt-4 border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Nenhum dado foi encontrado no Firebase. Execute a migração para sincronizar seus dados armazenados
              localmente.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
