"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Save, Clock, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useNotes } from "@/hooks/use-supabase-admin"
import { useToast } from "@/hooks/use-toast"

export function NotesTab() {
  const { user } = useAuth()
  const { data: notes, loading, create, update } = useNotes(user?.id)
  const [content, setContent] = useState("")
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (notes && notes.length > 0) {
      const latestNote = notes[0]
      setContent(latestNote.content || "")
      setCurrentNoteId(latestNote.id)
      setLastSaved(new Date(latestNote.updated_at || latestNote.created_at))
    }
  }, [notes])

  const handleSave = useCallback(async () => {
    if (!user) return

    setSaving(true)
    try {
      if (currentNoteId) {
        await update(currentNoteId, { content, title: "Notas" })
      } else {
        const { data } = await create({ title: "Notas", content })
        if (data) setCurrentNoteId(data.id)
      }
      setLastSaved(new Date())
      toast({
        title: "Nota salva",
        description: "Suas anotacoes foram salvas com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar nota",
        variant: "destructive",
      })
    }
    setSaving(false)
  }, [user, currentNoteId, content, create, update, toast])

  // Auto-save every 30 seconds if there are changes
  useEffect(() => {
    if (!content || !user) return

    const autoSaveInterval = setInterval(() => {
      handleSave()
    }, 30000)

    return () => clearInterval(autoSaveInterval)
  }, [content, user, handleSave])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Bloco de Notas</h2>
        <p className="text-muted-foreground mt-1">Espaço para anotações pessoais e lembretes</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Suas Anotações</CardTitle>
              <CardDescription>
                {lastSaved ? (
                  <span className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    Última atualização: {lastSaved.toLocaleString("pt-BR")}
                  </span>
                ) : (
                  "Comece a escrever suas anotações"
                )}
              </CardDescription>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Digite suas anotações aqui..."
            className="min-h-[400px] font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Salvamento automático a cada 30 segundos. {content.length} caracteres
          </p>
        </CardContent>
      </Card>

      {notes.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Notas</CardTitle>
            <CardDescription>Versões anteriores das suas anotações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notes
                .slice(0, -1)
                .reverse()
                .slice(0, 5)
                .map((note) => (
                  <div key={note.id} className="p-3 bg-muted rounded-lg text-sm">
                    <p className="text-xs text-muted-foreground mb-1">
                      {new Date(note.createdAt).toLocaleString("pt-BR")}
                    </p>
                    <p className="line-clamp-2">{note.content}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
