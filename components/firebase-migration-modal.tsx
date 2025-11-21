"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { migrateAllDataToFirebase } from "@/lib/firebase-migration"
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface MigrationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FirebaseMigrationModal({ open, onOpenChange }: MigrationModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<null | {
    success: boolean
    message: string
    stats: Record<string, number>
  }>(null)

  async function handleMigrate() {
    setIsLoading(true)
    console.log("[v0] Starting migration from localStorage to Firebase...")

    const migrationResult = await migrateAllDataToFirebase()
    setResult({
      success: migrationResult.success,
      message: migrationResult.message,
      stats: migrationResult.stats,
    })

    setIsLoading(false)
  }

  function handleClose() {
    setResult(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Migrar Dados para Firebase</DialogTitle>
          <DialogDescription>
            Esta operação irá transferir todos os seus dados armazenados localmente para o Firebase Firestore
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <Alert className="border-orange-200 bg-orange-50 text-orange-900">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Esta operação pode levar alguns minutos dependendo da quantidade de dados. Por favor, não feche esta janela.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handleMigrate} disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Migrando...
                  </>
                ) : (
                  "Iniciar Migração"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {result.success ? (
              <Alert className="border-green-200 bg-green-50 text-green-900">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-200 bg-red-50 text-red-900">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}

            <div className="rounded-lg bg-slate-100 p-4 dark:bg-slate-800">
              <h4 className="mb-2 text-sm font-semibold">Resumo da Migração:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Usuários:</span>
                  <span className="font-medium">{result.stats.usersCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Produtos:</span>
                  <span className="font-medium">{result.stats.productsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Passos do Script:</span>
                  <span className="font-medium">{result.stats.stepsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tabulações:</span>
                  <span className="font-medium">{result.stats.tabulationsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Situações:</span>
                  <span className="font-medium">{result.stats.situationsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Canais:</span>
                  <span className="font-medium">{result.stats.channelsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mensagens:</span>
                  <span className="font-medium">{result.stats.messagesCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quizzes:</span>
                  <span className="font-medium">{result.stats.quizzesCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tentativas de Quiz:</span>
                  <span className="font-medium">{result.stats.quizAttemptsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mensagens de Chat:</span>
                  <span className="font-medium">{result.stats.chatMessagesCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Apresentações:</span>
                  <span className="font-medium">{result.stats.presentationsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Notas:</span>
                  <span className="font-medium">{result.stats.notesCount}</span>
                </div>
              </div>
            </div>

            <Button onClick={handleClose} className="w-full">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
