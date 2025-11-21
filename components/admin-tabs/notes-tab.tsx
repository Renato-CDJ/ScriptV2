"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Save, Clock, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getNotes, saveNote } from "@/lib/store"
import type { Note } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export function NotesTab() {
  const { user } = useAuth()
  const [content, setContent] = useState("")
  const [notes, setNotes] = useState<Note[]>([])
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      loadNotes()
    }
  }, [user])

  const loadNotes = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const userNotes = await getNotes(user.id)
      setNotes(userNotes)
      if (userNotes.length > 0) {
        setContent(userNotes[0].content) // Assuming getNotes returns ordered by updated_at desc
        setLastSaved(userNotes[0].updatedAt)
      }
    } catch (error) {
      console.error("Error loading notes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      await saveNote(user.id, content)
      setLastSaved(new Date())
      await loadNotes()

      toast({
        title: "Nota salva",
        description: "Suas anotações foram salvas com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar sua nota.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-save every 30 seconds if there are changes
  useEffect(() => {
    if (!content || !user) return

    const autoSaveInterval = setInterval(async () => {
      // Only save if content is different from last saved note
      if (notes.length > 0 && notes[0].content === content) return

      await saveNote(user.id, content)
      setLastSaved(new Date())
      // We don't reload notes here to avoid UI jumps, just update last saved
    }, 30000)

    return () => clearInterval(autoSaveInterval)
  }, [content, user, notes])

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
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
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
                .slice(1, 6) // Skip the first one (current) and take next 5
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
