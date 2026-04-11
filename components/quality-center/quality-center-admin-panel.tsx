"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { RichTextEditorWYSIWYG } from "@/components/rich-text-editor-wysiwyg"
import {
  createQualityPost,
  getAdminQuestions,
  deleteQualityPost,
  getQualityCenterStats,
  getAllUsers,
  addFeedback,
} from "@/lib/store"
import type { QualityPost, User } from "@/lib/types"
import {
  Send,
  Megaphone,
  Brain,
  MessageSquare,
  ClipboardList,
  HelpCircle,
  BarChart3,
  Plus,
  Trash2,
  Users,
  ThumbsUp,
  MessageCircle,
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface QualityCenterAdminPanelProps {
  pendingQuestions: number
}

export function QualityCenterAdminPanel({ pendingQuestions }: QualityCenterAdminPanelProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("publicar")
  const [operators, setOperators] = useState<User[]>([])
  const [questions, setQuestions] = useState<QualityPost[]>([])
  const [stats, setStats] = useState({ totalPosts: 0, totalLikes: 0, totalComments: 0, totalUsers: 0, onlineNow: 0 })

  // Publicar form
  const [comunicadoContent, setComunicadoContent] = useState("")

  // Quiz form
  const [quizQuestion, setQuizQuestion] = useState("")
  const [quizOptions, setQuizOptions] = useState(["Opcao 1", "Opcao 2", "Opcao 3"])

  // Recado form
  const [recadoContent, setRecadoContent] = useState("")

  // Feedback form
  const [feedbackForm, setFeedbackForm] = useState({
    operatorId: "",
    callDate: "",
    callTime: "",
    ecNumber: "",
    feedbackType: "positive" as "positive" | "negative",
    severity: "leve" as "elogio" | "leve" | "medio" | "grave",
    score: 50,
    details: "",
    positivePoints: "",
    improvementPoints: "",
  })

  const loadData = () => {
    setOperators(getAllUsers().filter((u) => u.role === "operator"))
    setQuestions(getAdminQuestions())
    setStats(getQualityCenterStats())
  }

  useEffect(() => {
    loadData()
    const handleUpdate = () => loadData()
    window.addEventListener("store-updated", handleUpdate)
    return () => window.removeEventListener("store-updated", handleUpdate)
  }, [])

  const handlePublicarComunicado = () => {
    if (!comunicadoContent.trim() || !user) return

    createQualityPost({
      type: "comunicado",
      content: comunicadoContent,
      authorId: user.id,
      authorName: user.fullName,
      isActive: true,
    })

    setComunicadoContent("")
    toast({ title: "Comunicado publicado", description: "O comunicado foi publicado com sucesso" })
  }

  const handlePublicarQuiz = () => {
    if (!quizQuestion.trim() || quizOptions.filter((o) => o.trim()).length < 2 || !user) return

    createQualityPost({
      type: "quiz",
      content: quizQuestion,
      authorId: user.id,
      authorName: user.fullName,
      isActive: true,
      quizOptions: quizOptions
        .filter((o) => o.trim())
        .map((text, i) => ({
          id: `opt-${Date.now()}-${i}`,
          text,
          votes: [],
        })),
    })

    setQuizQuestion("")
    setQuizOptions(["Opcao 1", "Opcao 2", "Opcao 3"])
    toast({ title: "Quiz publicado", description: "O quiz foi publicado com sucesso" })
  }

  const handlePublicarRecado = () => {
    if (!recadoContent.trim() || !user) return

    createQualityPost({
      type: "recado",
      content: recadoContent,
      authorId: user.id,
      authorName: user.fullName,
      isActive: true,
    })

    setRecadoContent("")
    toast({ title: "Recado enviado", description: "O recado foi enviado para a equipe" })
  }

  const handleCriarFeedback = () => {
    if (!user || !feedbackForm.operatorId || !feedbackForm.callDate || !feedbackForm.ecNumber) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatorios", variant: "destructive" })
      return
    }

    const operator = operators.find((o) => o.id === feedbackForm.operatorId)
    if (!operator) return

    addFeedback({
      ...feedbackForm,
      operatorName: operator.fullName,
      createdBy: user.id,
      createdByName: user.fullName,
      callDate: new Date(`${feedbackForm.callDate}T${feedbackForm.callTime || "00:00"}`),
      isRead: false,
      isActive: true,
    })

    setFeedbackForm({
      operatorId: "",
      callDate: "",
      callTime: "",
      ecNumber: "",
      feedbackType: "positive",
      severity: "leve",
      score: 50,
      details: "",
      positivePoints: "",
      improvementPoints: "",
    })
    toast({ title: "Feedback criado", description: "O feedback foi criado com sucesso" })
  }

  const handleDeleteQuestion = (id: string) => {
    deleteQualityPost(id)
    toast({ title: "Pergunta removida" })
  }

  const getInitials = (name: string) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Painel Administrativo</h2>
        <p className="text-slate-500">
          Gerencie publicacoes, quizzes, recados e visualize perguntas dos colaboradores.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-slate-200 p-1 h-auto flex-wrap">
          <TabsTrigger value="publicar" className="gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <Megaphone className="h-4 w-4" />
            Publicar
          </TabsTrigger>
          <TabsTrigger value="quiz" className="gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <Brain className="h-4 w-4" />
            Quiz
          </TabsTrigger>
          <TabsTrigger value="recados" className="gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <MessageSquare className="h-4 w-4" />
            Recados
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <ClipboardList className="h-4 w-4" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="perguntas" className="gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 relative">
            <HelpCircle className="h-4 w-4" />
            Perguntas
            {pendingQuestions > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {pendingQuestions}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="estatisticas" className="gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <BarChart3 className="h-4 w-4" />
            Estatisticas
          </TabsTrigger>
        </TabsList>

        {/* Publicar Tab */}
        <TabsContent value="publicar" className="mt-6">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Conteudo do comunicado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RichTextEditorWYSIWYG
                value={comunicadoContent}
                onChange={setComunicadoContent}
                placeholder="Escreva o comunicado para todos os colaboradores..."
                minHeight={200}
              />
              <p className="text-xs text-slate-500">
                Selecione um trecho de texto e use as ferramentas de formatacao acima para aplicar estilos diretamente
              </p>
              <div className="flex justify-end">
                <Button
                  onClick={handlePublicarComunicado}
                  disabled={!comunicadoContent.trim()}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Publicar Comunicado
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quiz Tab */}
        <TabsContent value="quiz" className="mt-6">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Pergunta do Quiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Textarea
                placeholder="Escreva a pergunta do quiz..."
                value={quizQuestion}
                onChange={(e) => setQuizQuestion(e.target.value)}
                className="min-h-[100px] resize-none"
              />

              <div className="space-y-3">
                <Label>Opcoes de resposta</Label>
                {quizOptions.map((option, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-sm text-slate-500 w-6">{index + 1}.</span>
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...quizOptions]
                        newOptions[index] = e.target.value
                        setQuizOptions(newOptions)
                      }}
                      placeholder={`Opcao ${index + 1}`}
                      className="flex-1"
                    />
                    {quizOptions.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuizOptions(quizOptions.filter((_, i) => i !== index))}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuizOptions([...quizOptions, `Opcao ${quizOptions.length + 1}`])}
                  className="text-blue-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar opcao
                </Button>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handlePublicarQuiz}
                  disabled={!quizQuestion.trim() || quizOptions.filter((o) => o.trim()).length < 2}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Publicar Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recados Tab */}
        <TabsContent value="recados" className="mt-6">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Recado para a equipe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RichTextEditorWYSIWYG
                value={recadoContent}
                onChange={setRecadoContent}
                placeholder="Escreva um recado para a equipe..."
                minHeight={200}
              />
              <p className="text-xs text-slate-500">
                Selecione um trecho de texto e use as ferramentas de formatacao acima para aplicar estilos diretamente
              </p>
              <div className="flex justify-end">
                <Button
                  onClick={handlePublicarRecado}
                  disabled={!recadoContent.trim()}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Recado
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="mt-6">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Novo Feedback</CardTitle>
              <CardDescription>Preencha as informacoes do feedback para o operador</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Operador *</Label>
                <Select
                  value={feedbackForm.operatorId}
                  onValueChange={(v) => setFeedbackForm({ ...feedbackForm, operatorId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o operador" />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((op) => (
                      <SelectItem key={op.id} value={op.id}>{op.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data da Ligacao *</Label>
                  <Input
                    type="date"
                    value={feedbackForm.callDate}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, callDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora da Ligacao *</Label>
                  <Input
                    type="time"
                    value={feedbackForm.callTime}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, callTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>EC da Ligacao *</Label>
                <Input
                  placeholder="Digite o numero do EC"
                  value={feedbackForm.ecNumber}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, ecNumber: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Feedback</Label>
                  <Select
                    value={feedbackForm.feedbackType}
                    onValueChange={(v) => setFeedbackForm({ ...feedbackForm, feedbackType: v as "positive" | "negative" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">Positivo</SelectItem>
                      <SelectItem value="negative">Negativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nivel de Gravidade</Label>
                  <Select
                    value={feedbackForm.severity}
                    onValueChange={(v) => setFeedbackForm({ ...feedbackForm, severity: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elogio">Elogio</SelectItem>
                      <SelectItem value="leve">Leve</SelectItem>
                      <SelectItem value="medio">Medio</SelectItem>
                      <SelectItem value="grave">Grave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pontuacao (0-100)</Label>
                <Slider
                  value={[feedbackForm.score]}
                  onValueChange={([v]) => setFeedbackForm({ ...feedbackForm, score: v })}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-end">
                  <Badge variant="outline">{feedbackForm.score}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Detalhes do Feedback</Label>
                <Textarea
                  placeholder="Descreva o feedback sobre o atendimento"
                  value={feedbackForm.details}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, details: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Pontos Positivos</Label>
                <Textarea
                  placeholder="Descreva os pontos positivos do atendimento"
                  value={feedbackForm.positivePoints}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, positivePoints: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Pontos a Melhorar</Label>
                <Textarea
                  placeholder="Descreva os pontos que precisam ser melhorados"
                  value={feedbackForm.improvementPoints}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, improvementPoints: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setFeedbackForm({
                  operatorId: "",
                  callDate: "",
                  callTime: "",
                  ecNumber: "",
                  feedbackType: "positive",
                  severity: "leve",
                  score: 50,
                  details: "",
                  positivePoints: "",
                  improvementPoints: "",
                })}>
                  Cancelar
                </Button>
                <Button onClick={handleCriarFeedback} className="bg-blue-500 hover:bg-blue-600">
                  Criar Feedback
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Perguntas Tab */}
        <TabsContent value="perguntas" className="mt-6">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardDescription>
                Perguntas enviadas pelos colaboradores (visiveis apenas para administradores).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>Nenhuma pergunta pendente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q) => (
                    <div key={q.id} className="flex gap-3 p-4 bg-slate-50 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials(q.authorName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900">{q.authorName}</span>
                          <span className="text-xs text-slate-500">
                            {format(new Date(q.createdAt), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-slate-700">{q.content}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Estatisticas Tab */}
        <TabsContent value="estatisticas" className="mt-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-white border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <ClipboardList className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900">{stats.totalPosts}</p>
                    <p className="text-sm text-slate-500">Total de Publicacoes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900">{stats.totalLikes}</p>
                    <p className="text-sm text-slate-500">Total de Curtidas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900">{stats.totalComments}</p>
                    <p className="text-sm text-slate-500">Total de Comentarios</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
                    <p className="text-sm text-slate-500">Colaboradores</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900">{stats.onlineNow}</p>
                    <p className="text-sm text-slate-500">Online Agora</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
