"use client"
import { Table, TableBody, TableHead, TableHeader, TableCell, TableRow } from "@/components/ui/table"
import { useState, useEffect, useMemo, useCallback } from "react"
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
import type { Message, Quiz, QuizOption, Ranking, ContentSegment } from "@/lib/types"
import { MessageSquare, Brain, Plus, Trash2, Edit, Eye, Users, CheckCircle2, Calendar, Search, Download, FileSpreadsheet, History, Clock, ChevronDown, ChevronRight, Trophy, ChevronLeft, Medal, Crown, Sparkles, Star, TrendingUp } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { RichTextEditorWYSIWYG } from "@/components/rich-text-editor-wysiwyg"

export function MessagesQuizTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeSection, setActiveSection] = useState<"messages" | "quiz" | "ranking">("messages")
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
  const [messageContent, setMessageContent] = useState("")
  const [messageSegments, setMessageSegments] = useState<ContentSegment[]>([])
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

  // Ranking state
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // CHANGE: Using useCallback to memoize expensive functions
  const loadData = useCallback(() => {
    setMessages(getMessages())
    setQuizzes(getQuizzes())
  }, [])

  const loadOperators = useCallback(async () => {
    try {
      const allUsers = await getAllUsers()
      const operatorUsers = allUsers.filter((u) => u.role === "operator")
      setOperators(operatorUsers.map((u) => ({ id: u.id, fullName: u.fullName })))
    } catch (error) {
      console.error("Error loading operators for messages:", error)
    }
  }, [])

  const loadRankings = useCallback(() => {
    setRankings(getMonthlyQuizRanking(selectedYear, selectedMonth))
  }, [selectedYear, selectedMonth])

  // CHANGE: Debounced store update handler to reduce re-renders
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleStoreUpdate = () => {
      // Reduced debounce time from 300ms to 200ms for faster updates
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        loadData()
        loadOperators()
        loadRankings()
      }, 200)
    }

    window.addEventListener("store-updated", handleStoreUpdate)
    return () => {
      window.removeEventListener("store-updated", handleStoreUpdate)
      clearTimeout(timeoutId)
    }
  }, [loadData, loadOperators, loadRankings])

  // CHANGE: Memoize expensive filtering operations
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
    setMessageContent("")
    setMessageSegments([])
    setMessageActive(true)
    setMessageRecipients([])
    setSendToAll(true)
    setEditingMessage(null)
    setOperatorSearch("")
  }

  const [isSaving, setIsSaving] = useState(false)

  const handleSaveMessage = useCallback(async () => {
    if (!user || !messageContent.trim()) {
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

    setIsSaving(true)

    try {
      const recipients = sendToAll ? [] : messageRecipients

      if (editingMessage) {
        updateMessage({
          ...editingMessage,
          title: messageContent.substring(0, 50) + (messageContent.length > 50 ? "..." : ""),
          content: messageContent,
          isActive: messageActive,
          recipients,
          segments: messageSegments,
        })
        toast({
          title: "Recado atualizado",
          description: "O recado foi atualizado com sucesso.",
        })
      } else {
        createMessage({
          title: messageContent.substring(0, 50) + (messageContent.length > 50 ? "..." : ""),
          content: messageContent,
          createdBy: user.id,
          createdByName: user.fullName,
          isActive: messageActive,
          recipients,
          segments: messageSegments,
        })
        toast({
          title: "Recado criado",
          description: "O recado foi criado com sucesso.",
        })
      }

      setShowMessageDialog(false)
      resetMessageForm()
      loadData()
    } finally {
      setIsSaving(false)
    }
  }, [
    user,
    messageContent,
    sendToAll,
    messageRecipients,
    messageActive,
    messageSegments,
    editingMessage,
    toast,
    loadData,
  ])

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message)
    setMessageContent(message.content)
    setMessageSegments(message.segments || [])
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

  const handleDialogChange = (open: boolean) => {
    setShowQuizDialog(open)
    if (!open) {
      resetQuizForm()
    }
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

    if (quizScheduledDate) {
      const selectedDate = new Date(quizScheduledDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate < today) {
        toast({
          title: "Erro",
          description: "A data agendada não pode ser no passado.",
          variant: "destructive",
        })
        return
      }
    }

    const scheduledDate = quizScheduledDate ? new Date(quizScheduledDate) : new Date()

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

  // CHANGE: Memoize quiz stats calculation
  const getQuizStats = useCallback((quizId: string) => {
    const attempts = getQuizAttemptsByQuiz(quizId)
    const correct = attempts.filter((a) => a.isCorrect).length
    const total = attempts.length
    return { correct, total, percentage: total > 0 ? Math.round((correct / total) * 100) : 0 }
  }, [])

  // CHANGE: Memoize recipient names mapping
  const getRecipientNames = useCallback(
    (recipients: string[]) => {
      if (!recipients || recipients.length === 0) return "Todos os operadores"
      const names = recipients.map((id) => operators.find((op) => op.id === id)?.fullName).filter(Boolean)
      return names.join(", ")
    },
    [operators],
  )

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
    csvContent += `Mês:,${getMonthName(selectedMonth)} de ${selectedYear}\n`
    csvContent += `Data de exportação:,${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}\n\n`

    // Table header
    csvContent += "Posição,Nome do Operador,Quiz Respondidos,Acertos,Precisão,Pontuação\n"

    // Data rows
    rankings.forEach((ranking) => {
      csvContent += `${ranking.rank},${ranking.operatorName},${ranking.totalAttempts},${ranking.correctAnswers},${ranking.accuracy.toFixed(1)}%,${ranking.score}\n`
    })

    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    const fileName = `ranking_quiz_${selectedYear}_${String(selectedMonth + 1).padStart(2, "0")}_${Date.now()}.csv`
    link.setAttribute("download", fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Relatório exportado",
      description: "O relatório de ranking foi exportado com sucesso.",
    })
  }

  const getMonthName = (monthIndex: number): string => {
    const date = new Date(selectedYear, monthIndex, 1)
    return date.toLocaleDateString("pt-BR", { month: "long" })
  }

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear(selectedYear - 1)
      setSelectedMonth(11)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
    loadRankings()
  }

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear(selectedYear + 1)
      setSelectedMonth(0)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
    loadRankings()
  }

  const isCurrentMonth = () => {
    const now = new Date()
    return selectedMonth === now.getMonth() && selectedYear === now.getFullYear()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Recados e Quiz</h2>
          <p className="text-muted-foreground">Gerencie recados e quizzes para os operadores</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
        {/* Sidebar Menu */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Menu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant={activeSection === "messages" ? "default" : "ghost"}
              onClick={() => setActiveSection("messages")}
              className={`w-full justify-start text-base transition-all duration-300 ${
                activeSection === "messages"
                  ? "bg-orange-500 hover:bg-orange-600 dark:bg-gradient-to-r dark:from-primary dark:via-accent dark:to-primary text-white shadow-lg"
                  : ""
              }`}
            >
              <MessageSquare className="h-5 w-5 mr-3" />
              Recados
            </Button>
            <Button
              variant={activeSection === "quiz" ? "default" : "ghost"}
              onClick={() => setActiveSection("quiz")}
              className={`w-full justify-start text-base transition-all duration-300 ${
                activeSection === "quiz"
                  ? "bg-orange-500 hover:bg-orange-600 dark:bg-gradient-to-r dark:from-chart-1 dark:via-chart-4 dark:to-chart-5 text-white shadow-lg"
                  : ""
              }`}
            >
              <Brain className="h-5 w-5 mr-3" />
              Quiz
            </Button>
            <Button
              variant={activeSection === "ranking" ? "default" : "ghost"}
              onClick={() => setActiveSection("ranking")}
              className={`w-full justify-start text-base transition-all duration-300 ${
                activeSection === "ranking"
                  ? "bg-orange-500 hover:bg-orange-600 dark:bg-gradient-to-r dark:from-chart-4 dark:via-chart-1 dark:to-chart-5 text-white shadow-lg"
                  : ""
              }`}
            >
              <Trophy className="h-5 w-5 mr-3" />
              Ranking
            </Button>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <div>
          {activeSection === "messages" && (
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
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingMessage ? "Editar Recado" : "Novo Recado"}</DialogTitle>
                      <DialogDescription>Crie um recado formatado para ser exibido aos operadores</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <RichTextEditorWYSIWYG
                        value={messageContent}
                        onChange={(content) => {
                          setMessageContent(content)
                        }}
                        placeholder="Digite o conteúdo do recado e use as ferramentas de formatação"
                      />

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
                        <Button variant="outline" onClick={() => setShowMessageDialog(false)} disabled={isSaving}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSaveMessage} disabled={isSaving}>
                          {isSaving ? "Salvando..." : "Salvar"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showMessageHistoryDialog} onOpenChange={setShowMessageHistoryDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary/10 bg-transparent"
                    >
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
                                      <div
                                        className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere mb-3 prose prose-sm max-w-none dark:prose-invert"
                                        dangerouslySetInnerHTML={{ __html: message.content }}
                                      />
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
                        <div
                          className="text-sm whitespace-pre-wrap mb-4 prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: message.content }}
                        />
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

          {activeSection === "quiz" && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <Dialog open={showQuizDialog} onOpenChange={handleDialogChange}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={resetQuizForm}
                      className="bg-orange-500 hover:bg-orange-600 dark:bg-gradient-to-r dark:from-chart-1 dark:to-chart-4 dark:hover:opacity-90 text-white
