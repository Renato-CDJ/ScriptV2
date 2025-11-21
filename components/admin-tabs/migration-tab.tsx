"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FirebaseMigrationModal } from "@/components/firebase-migration-modal"
import { Cloud, Database, AlertTriangle, CheckCircle2 } from 'lucide-react'

export function MigrationTab() {
  const [migrationOpen, setMigrationOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Firebase Integration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-500" />
            <div>
              <CardTitle>Integração Firebase</CardTitle>
              <CardDescription>Migre seus dados para armazenamento em nuvem</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
            <Database className="h-4 w-4" />
            <AlertDescription>
              Sua aplicação está atualmente usando armazenamento local (localStorage). Migre para Firebase para obter
              backup automático, acesso de qualquer lugar e melhor segurança dos dados.
            </AlertDescription>
          </Alert>

          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
            <h4 className="mb-3 font-semibold">Benefícios da Migração:</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Backup automático e recuperação de dados</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Acesso sincronizado em múltiplos dispositivos</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Melhor desempenho e escalabilidade</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Segurança em nível empresarial</span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-950">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600" />
              <div className="text-sm">
                <p className="font-semibold text-orange-900">Importante:</p>
                <p className="text-orange-800">
                  A migração enviará todos os seus dados armazenados localmente para o Firebase. Certifique-se de ter uma
                  conexão estável com a internet e não feche a janela durante o processo.
                </p>
              </div>
            </div>
          </div>

          <Button onClick={() => setMigrationOpen(true)} size="lg" className="w-full">
            <Cloud className="mr-2 h-4 w-4" />
            Iniciar Migração para Firebase
          </Button>
        </CardContent>
      </Card>

      {/* Firebase Migration Modal */}
      <FirebaseMigrationModal open={migrationOpen} onOpenChange={setMigrationOpen} />
    </div>
  )
}
