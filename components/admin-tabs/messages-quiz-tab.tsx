"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  getMessages,
  createMessage,
  updateMessage,
  deleteMessage,
  getQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizAttemptsByQuiz,
  getAllUsers,
  getMonthlyQuizRanking,
} from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import type { Message, Quiz, QuizOption } from "@/lib/types"
import {
  MessageSquare,
  Brain,
  Plus,
  Trash2,
  Edit,
  Eye,
  Users,
  CheckCircle2,
  Calendar,
  Search,
  Download,
  FileSpreadsheet,
  History,
  Clock,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function MessagesQuizTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"messages" | "quiz">("messages")
  const [messages, setMessages] = useState<Message[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [operators, setOperators] = useState<{ id: string; fullName: string }[]>([])
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [showQuizDialog, setShowQuizDialog] = useState(false)
  const [showMessageHistoryDialog, setShowMessageHistoryDialog] = useState(false)
  const [showQuizHistoryDialog, setShowQuizHistoryDialog] = useState(false)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)

  const [expandedMessageIds, setExpandedMessageIds] = useState<Set<string>>(new Set())
  const [expandedQuizIds, setExpandedQuizIds] = useState<Set<string>>(new Set())

  // Message form state
  const [messageTitle, setMessageTitle] = useState("")
  const [messageContent, setMessageContent] = useState("")
  const [messageActive, setMessageActive] = useState(true)
  const [messageRecipients, setMessageRecipients] = useState<string[]>([])
  const [sendToAll, setSendToAll] = useState(true)
  const [operatorSearch, setOperatorSearch] = useState("")

  // Quiz form state
  const [quizQuestion, setQuizQuestion] = useState("")
  const [quizOptions, setQuizOptions] = useState<QuizOption[]>([
    { id: "opt-a", label: "a", text: "" },
    { id: "opt-b", label: "b", text: "" },
    { id: "opt-c", label: "c", text: "" },
    { id: "opt-d", label: "d", text: "" },
  ])
  const [quizCorrectAnswer, setQuizCorrectAnswer] = useState("")
  const [quizActive, setQuizActive] = useState(true)
  const [quizScheduledDate, setQuizScheduledDate] = useState("")

  useEffect(() => {
    loadData()
    loadOperators()
  }, [])

  useEffect(() => {
    const handleStoreUpdate = () => {
      loadData()
      loadOperators()
    }

    window.addEventListener("store-updated", handleStoreUpdate)
    return () => window.removeEventListener("store-updated", handleStoreUpdate)
  }, [])

  const loadData = () => {
    setMessages(getMessages())
    setQuizzes(getQuizzes())
  }

  const loadOperators = () => {
    const allUsers = getAllUsers()
    const operatorUsers = allUsers.filter((u) => u.role === "operator")
    setOperators(operatorUsers.map((u) => ({ id: u.id, fullName: u.fullName })))
  }

  const filteredOperators = useMemo(() => {
    if (!operatorSearch.trim()) return operators

    const searchLower = operatorSearch.toLowerCase()
    return operators.filter((op) => op.fullName.toLowerCase().includes(searchLower))
  }, [operators, operatorSearch])

  const toggleMessageExpanded = (messageId: string) => {
    setExpandedMessageIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }

  const toggleQuizExpanded = (quizId: string) => {
    setExpandedQuizIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(quizId)) {
        newSet.delete(quizId)
      } else {
        newSet.add(quizId)
      }
      return newSet
    })
  }

  const resetMessageForm = () => {
    setMessageTitle("")
    setMessageContent("")
    setMessageActive(true)
    setMessageRecipients([])
    setSendToAll(true)
    setEditingMessage(null)
    setOperatorSearch("")
  }

  const handleSaveMessage = () => {
    if (!user || !messageTitle.trim() || !messageContent.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    if (!sendToAll && messageRecipients.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um operador ou escolha enviar para todos.",
        variant: "destructive",
      })
      return
    }

    const recipients = sendToAll ? [] : messageRecipients

    if (editingMessage) {
      updateMessage({
        ...editingMessage,
        title: messageTitle,
        content: messageContent,
        isActive: messageActive,
        recipients,
      })
      toast({
        title: "Recado atualizado",
        description: "O recado foi atualizado com sucesso.",
      })
    } else {
      createMessage({
        title: messageTitle,
        content: messageContent,
        createdBy: user.id,
        createdByName: user.fullName,
        isActive: messageActive,
        recipients,
      })
      toast({
        title: "Recado criado",
        description: "O recado foi criado com sucesso.",
      })
    }

    setShowMessageDialog(false)
    resetMessageForm()
    loadData()
  }

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message)
    setMessageTitle(message.title)
    setMessageContent(message.content)
    setMessageActive(message.isActive)
    setMessageRecipients(message.recipients || [])
    setSendToAll(!message.recipients || message.recipients.length === 0)
    setShowMessageDialog(true)
  }

  const handleDeleteMessage = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este recado?")) {
      deleteMessage(id)
      toast({
        title: "Recado excluído",
        description: "O recado foi excluído com sucesso.",
      })
      loadData()
    }
  }

  const toggleRecipient = (operatorId: string) => {
    setMessageRecipients((prev) =>
      prev.includes(operatorId) ? prev.filter((id) => id !== operatorId) : [...prev, operatorId],
    )
  }

  const resetQuizForm = () => {
    setQuizQuestion("")
    setQuizOptions([
      { id: "opt-a", label: "a", text: "" },
      { id: "opt-b", label: "b", text: "" },
      { id: "opt-c", label: "c", text: "" },
      { id: "opt-d", label: "d", text: "" },
    ])
    setQuizCorrectAnswer("")
    setQuizActive(true)
    setQuizScheduledDate("")
    setEditingQuiz(null)
  }

  const handleSaveQuiz = () => {
    if (!user || !quizQuestion.trim() || !quizCorrectAnswer) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    const allOptionsFilled = quizOptions.every((opt) => opt.text.trim())
    if (!allOptionsFilled) {
      toast({
        title: "Erro",
        description: "Preencha todas as opções de resposta.",
        variant: "destructive",
      })
      return
    }

    const scheduledDate = quizScheduledDate ? new Date(quizScheduledDate) : undefined

    if (editingQuiz) {
      updateQuiz({
        ...editingQuiz,
        question: quizQuestion,
        options: quizOptions,
        correctAnswer: quizCorrectAnswer,
        isActive: quizActive,
        scheduledDate,
      })
      toast({
        title: "Quiz atualizado",
        description: "O quiz foi atualizado com sucesso.",
      })
    } else {
      createQuiz({
        question: quizQuestion,
        options: quizOptions,
        correctAnswer: quizCorrectAnswer,
        createdBy: user.id,
        createdByName: user.fullName,
        isActive: quizActive,
        scheduledDate,
      })
      toast({
        title: "Quiz criado",
        description: scheduledDate
          ? `O quiz foi agendado para ${new Date(scheduledDate).toLocaleDateString("pt-BR")}.`
          : "O quiz foi criado com sucesso.",
      })
    }

    setShowQuizDialog(false)
    resetQuizForm()
    loadData()
  }

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz)
    setQuizQuestion(quiz.question)
    setQuizOptions(quiz.options)
    setQuizCorrectAnswer(quiz.correctAnswer)
    setQuizActive(quiz.isActive)
    setQuizScheduledDate(quiz.scheduledDate ? new Date(quiz.scheduledDate).toISOString().split("T")[0] : "")
    setShowQuizDialog(true)
  }

  const handleDeleteQuiz = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este quiz?")) {
      deleteQuiz(id)
      toast({
        title: "Quiz excluído",
        description: "O quiz foi excluído com sucesso.",
      })
      loadData()
    }
  }

  const updateQuizOption = (index: number, text: string) => {
    const newOptions = [...quizOptions]
    newOptions[index].text = text
    setQuizOptions(newOptions)
  }

  const getQuizStats = (quizId: string) => {
    const attempts = getQuizAttemptsByQuiz(quizId)
    const correct = attempts.filter((a) => a.isCorrect).length
    const total = attempts.length
    return { correct, total, percentage: total > 0 ? Math.round((correct / total) * 100) : 0 }
  }

  const getRecipientNames = (recipients: string[]) => {
    if (!recipients || recipients.length === 0) return "Todos os operadores"
    const names = recipients.map((id) => operators.find((op) => op.id === id)?.fullName).filter(Boolean)
    return names.join(", ")
  }

  const handleExportQuizReport = (quiz: Quiz) => {
    const attempts = getQuizAttemptsByQuiz(quiz.id)
    const stats = getQuizStats(quiz.id)

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,"

    // Header
    csvContent += "Relatório de Quiz\n\n"
    csvContent += `Pergunta:,${quiz.question.replace(/,/g, ";")}\n`
    csvContent += `Criado por:,${quiz.createdByName}\n`
    csvContent += `Data de criação:,${new Date(quiz.createdAt).toLocaleDateString("pt-BR")}\n`
    csvContent += `Total de tentativas:,${stats.total}\n`
    csvContent += `Acertos:,${stats.correct}\n`
    csvContent += `Erros:,${stats.total - stats.correct}\n`
    csvContent += `Percentual de acertos:,${stats.percentage}%\n\n`

    // Options
    csvContent += "Opções de Resposta:\n"
    quiz.options.forEach((opt) => {
      const isCorrect = opt.id === quiz.correctAnswer ? " (CORRETA)" : ""
      csvContent += `${opt.label},${opt.text.replace(/,/g, ";")}${isCorrect}\n`
    })

    csvContent += "\n"

    // Attempts details
    csvContent += "Detalhes das Tentativas:\n"
    csvContent += "Operador,Data,Horário,Resposta Selecionada,Resultado\n"

    attempts.forEach((attempt) => {
      const date = new Date(attempt.attemptedAt)
      const selectedOption = quiz.options.find((opt) => opt.id === attempt.selectedAnswer)
      csvContent += `${attempt.operatorName},${date.toLocaleDateString("pt-BR")},${date.toLocaleTimeString("pt-BR")},${selectedOption?.label || "N/A"},${attempt.isCorrect ? "Correto" : "Incorreto"}\n`
    })

    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `quiz_relatorio_${quiz.id}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Relatório exportado",
      description: "O relatório do quiz foi exportado com sucesso.",
    })
  }

  const handleExportRankingReport = () => {
    const rankings = getMonthlyQuizRanking()

    if (rankings.length === 0) {
      toast({
        title: "Nenhum dado disponível",
        description: "Não há dados de ranking para exportar.",
        variant: "destructive",
      })
      return
    }

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,"

    // Header
    csvContent += "Relatório de Ranking - Quiz\n\n"
    csvContent += `Mês:,${new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}\n`
    csvContent += `Data de exportação:,${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}\n\n`

    // Table header
    csvContent += "Posição,Nome do Operador,Acertos,Pontuação\n"

    // Data rows
    rankings.forEach((ranking) => {
      csvContent += `${ranking.rank},${ranking.operatorName},${ranking.correctAnswers},${ranking.score}\n`
    })

    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    const fileName = `ranking_quiz_${new Date().getFullYear()}_${String(new Date().getMonth() + 1).padStart(2, "0")}_${Date.now()}.csv`
    link.setAttribute("download", fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Relatório exportado",
      description: "O relatório de ranking foi exportado com sucesso.",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Recados e Quiz</h2>
          <p className="text-muted-foreground">Gerencie recados e quizzes para os operadores</p>
        </div>
      </div>

      <div className="flex gap-3 border-b pb-4">
        <Button
          variant={activeTab === "messages" ? "default" : "ghost"}
          onClick={() => setActiveTab("messages")}
          className={`text-base px-6 py-5 transition-all duration-300 ${
            activeTab === "messages"
              ? "bg-orange-500 hover:bg-orange-600 dark:bg-gradient-to-r dark:from-primary dark:via-accent dark:to-primary dark:hover:opacity-90 text-white shadow-lg scale-105"
              : "hover:scale-105"
          }`}
        >
          <MessageSquare className={`h-5 w-5 mr-2 ${activeTab === "messages" ? "animate-pulse" : ""}`} />
          Recados
        </Button>
        <Button
          variant={activeTab === "quiz" ? "default" : "ghost"}
          onClick={() => setActiveTab("quiz")}
          className={`text-base px-6 py-5 transition-all duration-300 ${
            activeTab === "quiz"
              ? "bg-orange-500 hover:bg-orange-600 dark:bg-gradient-to-r dark:from-chart-1 dark:via-chart-4 dark:to-chart-5 dark:hover:opacity-90 text-white shadow-lg scale-105"
              : "hover:scale-105"
          }`}
        >
          <Brain className={`h-5 w-5 mr-2 ${activeTab === "quiz" ? "animate-pulse" : ""}`} />
          Quiz
        </Button>
      </div>

      {activeTab === "messages" && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
              <DialogTrigger asChild>
                <Button
                  onClick={resetMessageForm}
                  className="bg-orange-500 hover:bg-orange-600 dark:bg-primary dark:hover:bg-primary/90 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Recado
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingMessage ? "Editar Recado" : "Novo Recado"}</DialogTitle>
                  <DialogDescription>Crie um recado para ser exibido aos operadores</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="message-title">Título</Label>
                    <Input
                      id="message-title"
                      value={messageTitle}
                      onChange={(e) => setMessageTitle(e.target.value)}
                      placeholder="Digite o título do recado"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message-content">Conteúdo</Label>
                    <Textarea
                      id="message-content"
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder="Digite o conteúdo do recado"
                      rows={6}
                    />
                  </div>

                  <Separator />
                  <div className="space-y-3">
                    <Label>Destinatários</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="send-to-all"
                        checked={sendToAll}
                        onCheckedChange={(checked) => setSendToAll(checked as boolean)}
                      />
                      <Label htmlFor="send-to-all" className="cursor-pointer">
                        Enviar para todos os operadores
                      </Label>
                    </div>

                    {!sendToAll && (
                      <div className="border rounded-lg p-4 space-y-3">
                        <Label className="text-sm text-muted-foreground">Selecione os operadores:</Label>

                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Pesquisar operadores..."
                            value={operatorSearch}
                            onChange={(e) => setOperatorSearch(e.target.value)}
                            className="pl-9"
                          />
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-2">
                          {operators.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nenhum operador cadastrado.</p>
                          ) : filteredOperators.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nenhum operador encontrado.</p>
                          ) : (
                            filteredOperators.map((operator) => (
                              <div key={operator.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`operator-${operator.id}`}
                                  checked={messageRecipients.includes(operator.id)}
                                  onCheckedChange={() => toggleRecipient(operator.id)}
                                />
                                <Label htmlFor={`operator-${operator.id}`} className="cursor-pointer">
                                  {operator.fullName}
                                </Label>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />
                  <div className="flex items-center space-x-2">
                    <Switch id="message-active" checked={messageActive} onCheckedChange={setMessageActive} />
                    <Label htmlFor="message-active">Ativo</Label>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveMessage}>Salvar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showMessageHistoryDialog} onOpenChange={setShowMessageHistoryDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 bg-transparent">
                  <History className="h-4 w-4 mr-2" />
                  Ver Histórico de Recados
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[85vh]">
                <DialogHeader>
                  <DialogTitle>Histórico de Recados Enviados</DialogTitle>
                  <DialogDescription>
                    Todos os recados enviados aos operadores ({messages.length} total)
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="space-y-3">
                    {messages.length === 0 ? (
                      <div className="py-12 text-center">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-muted-foreground">Nenhum recado no histórico.</p>
                      </div>
                    ) : (
                      messages
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((message) => {
                          const isExpanded = expandedMessageIds.has(message.id)
                          return (
                            <Card
                              key={message.id}
                              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => toggleMessageExpanded(message.id)}
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-2 flex-1 min-w-0">
                                    {isExpanded ? (
                                      <ChevronDown className="h-5 w-5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-5 w-5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <CardTitle className="text-base break-words overflow-wrap-anywhere">
                                        {message.title}
                                      </CardTitle>
                                      <CardDescription className="mt-1 break-words">
                                        <Clock className="inline h-3 w-3 mr-1" />
                                        {new Date(message.createdAt).toLocaleDateString("pt-BR")} às{" "}
                                        {new Date(message.createdAt).toLocaleTimeString("pt-BR", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </CardDescription>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-2 flex-shrink-0">
                                    <Badge variant={message.isActive ? "default" : "secondary"}>
                                      {message.isActive ? "Ativo" : "Inativo"}
                                    </Badge>
                                    <Badge variant="outline" className="whitespace-nowrap">
                                      <Eye className="h-3 w-3 mr-1" />
                                      {message.seenBy.length}
                                    </Badge>
                                  </div>
                                </div>
                              </CardHeader>
                              {isExpanded && (
                                <CardContent>
                                  <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere mb-3">
                                    {message.content}
                                  </p>
                                  <div className="text-xs text-muted-foreground break-words overflow-wrap-anywhere">
                                    <Users className="inline h-3 w-3 mr-1" />
                                    Destinatários: {getRecipientNames(message.recipients)}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Criado por: {message.createdByName}
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                          )
                        })
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {messages.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">Nenhum recado cadastrado.</p>
                </CardContent>
              </Card>
            ) : (
              messages.map((message) => (
                <Card key={message.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{message.title}</CardTitle>
                        <CardDescription>
                          Por {message.createdByName} • {new Date(message.createdAt).toLocaleDateString("pt-BR")} às{" "}
                          {new Date(message.createdAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </CardDescription>
                        <CardDescription className="mt-1">
                          <Users className="inline h-3 w-3 mr-1" />
                          {getRecipientNames(message.recipients)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={message.isActive ? "default" : "secondary"}>
                          {message.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                        <Badge variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          {message.seenBy.length}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap mb-4">{message.content}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditMessage(message)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteMessage(message.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "quiz" && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
              <DialogTrigger asChild>
                <Button
                  onClick={resetQuizForm}
                  className="bg-orange-500 hover:bg-orange-600 dark:bg-gradient-to-r dark:from-chart-1 dark:to-chart-4 dark:hover:opacity-90 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Quiz
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingQuiz ? "Editar Quiz" : "Novo Quiz"}</DialogTitle>
                  <DialogDescription>Crie um quiz com 4 opções de resposta para os operadores</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quiz-question">Pergunta</Label>
                    <Textarea
                      id="quiz-question"
                      value={quizQuestion}
                      onChange={(e) => setQuizQuestion(e.target.value)}
                      placeholder="Digite a pergunta do quiz"
                      rows={3}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label>Opções de Resposta</Label>
                    {quizOptions.map((option, index) => (
                      <div key={option.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="font-bold w-8">{option.label})</Label>
                          <Input
                            value={option.text}
                            onChange={(e) => updateQuizOption(index, e.target.value)}
                            placeholder={`Digite a opção ${option.label}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Resposta Correta</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {quizOptions.map((option) => (
                        <Button
                          key={option.id}
                          variant={quizCorrectAnswer === option.id ? "default" : "outline"}
                          onClick={() => setQuizCorrectAnswer(option.id)}
                          className="font-bold"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="quiz-scheduled-date">
                      <Calendar className="inline h-4 w-4 mr-2" />
                      Agendar Quiz (Opcional)
                    </Label>
                    <Input
                      id="quiz-scheduled-date"
                      type="date"
                      value={quizScheduledDate}
                      onChange={(e) => setQuizScheduledDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                    <p className="text-xs text-muted-foreground">Deixe em branco para disponibilizar imediatamente</p>
                  </div>

                  <Separator />
                  <div className="flex items-center space-x-2">
                    <Switch id="quiz-active" checked={quizActive} onCheckedChange={setQuizActive} />
                    <Label htmlFor="quiz-active">Ativo</Label>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowQuizDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveQuiz}>Salvar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={handleExportRankingReport}
              variant="outline"
              className="bg-orange-500 hover:bg-orange-600 dark:bg-gradient-to-r dark:from-chart-4 dark:to-chart-1 dark:hover:opacity-90 text-white border-0"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Ranking
            </Button>

            <Dialog open={showQuizHistoryDialog} onOpenChange={setShowQuizHistoryDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-chart-1 text-chart-1 hover:bg-chart-1/10 bg-transparent">
                  <History className="h-4 w-4 mr-2" />
                  Ver Histórico de Quizzes
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[85vh]">
                <DialogHeader>
                  <DialogTitle>Histórico de Quizzes Enviados</DialogTitle>
                  <DialogDescription>
                    Todos os quizzes enviados aos operadores ({quizzes.length} total)
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="space-y-3">
                    {quizzes.length === 0 ? (
                      <div className="py-12 text-center">
                        <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-muted-foreground">Nenhum quiz no histórico.</p>
                      </div>
                    ) : (
                      quizzes
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((quiz) => {
                          const stats = getQuizStats(quiz.id)
                          const isScheduled = quiz.scheduledDate && new Date(quiz.scheduledDate) > new Date()
                          const isExpanded = expandedQuizIds.has(quiz.id)

                          return (
                            <Card
                              key={quiz.id}
                              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => toggleQuizExpanded(quiz.id)}
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-2 flex-1 min-w-0">
                                    {isExpanded ? (
                                      <ChevronDown className="h-5 w-5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-5 w-5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <CardTitle className="text-base break-words overflow-wrap-anywhere">
                                        {quiz.question}
                                      </CardTitle>
                                      <CardDescription className="mt-1 break-words">
                                        <Clock className="inline h-3 w-3 mr-1" />
                                        {new Date(quiz.createdAt).toLocaleDateString("pt-BR")} às{" "}
                                        {new Date(quiz.createdAt).toLocaleTimeString("pt-BR", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </CardDescription>
                                      {quiz.scheduledDate && (
                                        <CardDescription className="mt-1 break-words">
                                          <Calendar className="inline h-3 w-3 mr-1" />
                                          {isScheduled ? "Agendado para: " : "Disponível desde: "}
                                          {new Date(quiz.scheduledDate).toLocaleDateString("pt-BR")}
                                        </CardDescription>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-2 flex-shrink-0">
                                    {isScheduled && <Badge variant="secondary">Agendado</Badge>}
                                    <Badge variant={quiz.isActive ? "default" : "secondary"}>
                                      {quiz.isActive ? "Ativo" : "Inativo"}
                                    </Badge>
                                    <Badge variant="outline" className="whitespace-nowrap">
                                      <Users className="h-3 w-3 mr-1" />
                                      {stats.total}
                                    </Badge>
                                    {stats.total > 0 && (
                                      <Badge
                                        variant={stats.percentage >= 70 ? "default" : "destructive"}
                                        className="whitespace-nowrap"
                                      >
                                        {stats.percentage}%
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CardHeader>
                              {isExpanded && (
                                <CardContent>
                                  <div className="space-y-2 mb-3">
                                    {quiz.options.map((option) => (
                                      <div
                                        key={option.id}
                                        className={`p-2 rounded break-words overflow-wrap-anywhere ${
                                          option.id === quiz.correctAnswer
                                            ? "bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-100"
                                            : "bg-muted/50"
                                        }`}
                                      >
                                        <span className="font-bold mr-2">{option.label})</span>
                                        <span className="break-words overflow-wrap-anywhere">{option.text}</span>
                                        {option.id === quiz.correctAnswer && (
                                          <CheckCircle2 className="inline h-4 w-4 ml-2 text-green-600 dark:text-green-400" />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Criado por: {quiz.createdByName}</div>
                                  {stats.total > 0 && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {stats.correct} acertos de {stats.total} tentativas ({stats.percentage}%)
                                    </div>
                                  )}
                                </CardContent>
                              )}
                            </Card>
                          )
                        })
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {quizzes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">Nenhum quiz cadastrado.</p>
                </CardContent>
              </Card>
            ) : (
              quizzes.map((quiz) => {
                const stats = getQuizStats(quiz.id)
                const isScheduled = quiz.scheduledDate && new Date(quiz.scheduledDate) > new Date()

                return (
                  <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{quiz.question}</CardTitle>
                          <CardDescription>
                            Por {quiz.createdByName} • {new Date(quiz.createdAt).toLocaleDateString("pt-BR")} às{" "}
                            {new Date(quiz.createdAt).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </CardDescription>
                          {quiz.scheduledDate && (
                            <CardDescription className="mt-1">
                              <Calendar className="inline h-3 w-3 mr-1" />
                              {isScheduled ? "Agendado para: " : "Disponível desde: "}
                              {new Date(quiz.scheduledDate).toLocaleDateString("pt-BR")}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isScheduled && <Badge variant="secondary">Agendado</Badge>}
                          <Badge variant={quiz.isActive ? "default" : "secondary"}>
                            {quiz.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                          <Badge variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            {stats.total} tentativas
                          </Badge>
                          {stats.total > 0 && (
                            <Badge variant={stats.percentage >= 70 ? "default" : "destructive"}>
                              {stats.percentage}% acertos
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        {quiz.options.map((option) => (
                          <div
                            key={option.id}
                            className={`p-2 rounded ${
                              option.id === quiz.correctAnswer
                                ? "bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-100"
                                : "bg-muted/50"
                            }`}
                          >
                            <span className="font-bold mr-2">{option.label})</span>
                            {option.text}
                            {option.id === quiz.correctAnswer && (
                              <CheckCircle2 className="inline h-4 w-4 ml-2 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditQuiz(quiz)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportQuizReport(quiz)}
                          disabled={stats.total === 0}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Exportar Relatório
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteQuiz(quiz.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
