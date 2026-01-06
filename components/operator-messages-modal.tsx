"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import {
  getActiveMessagesForOperator,
  getHistoricalMessagesForOperator,
  getActiveQuizzesForOperator,
  getHistoricalQuizzes,
  markMessageAsSeen,
  createQuizAttempt,
  hasOperatorAnsweredQuiz,
  getMonthlyQuizRanking,
} from "@/lib/store"
import type { Message, Quiz } from "@/lib/types"
import {
  MessageSquare,
  Brain,
  CheckCircle2,
  XCircle,
  Eye,
  History,
  Sparkles,
  Trophy,
  Maximize2,
  Zap,
  Star,
  Mail,
  Bell,
  Medal,
  Crown,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface OperatorMessagesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OperatorMessagesModal({ open, onOpenChange }: OperatorMessagesModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [sidebarView, setSidebarView] = useState<"messages" | "quiz" | "ranking">("messages")
  const [activeTab, setActiveTab] = useState<"messages" | "quiz">("messages")
  const [showHistory, setShowHistory] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [historicalMessages, setHistoricalMessages] = useState<Message[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [historicalQuizzes, setHistoricalQuizzes] = useState<Quiz[]>([])
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string>("")
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [expandedMessage, setExpandedMessage] = useState<Message | null>(null)
  const [resultTimeout, setResultTimeout] = useState<NodeJS.Timeout | null>(null)

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())

  const loadDataDebounced = useCallback(() => {
    if (!user) return

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => {
        setMessages(getActiveMessagesForOperator(user.id))
        setHistoricalMessages(getHistoricalMessagesForOperator(user.id))
        setQuizzes(getActiveQuizzesForOperator())
        setHistoricalQuizzes(getHistoricalQuizzes())
      })
    } else {
      setTimeout(() => {
        setMessages(getActiveMessagesForOperator(user.id))
        setHistoricalMessages(getHistoricalMessagesForOperator(user.id))
        setQuizzes(getActiveQuizzesForOperator())
        setHistoricalQuizzes(getHistoricalQuizzes())
      }, 0)
    }
  }, [user])

  useEffect(() => {
    if (open) {
      loadDataDebounced()
    }
  }, [open, loadDataDebounced])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleStoreUpdate = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        loadDataDebounced()
      }, 500)
    }

    window.addEventListener("store-updated", handleStoreUpdate)
    return () => {
      window.removeEventListener("store-updated", handleStoreUpdate)
      clearTimeout(timeoutId)
    }
  }, [loadDataDebounced])

  const unseenCount = useMemo(() => {
    if (!user) return 0
    return messages.filter((m) => !m.seenBy.includes(user.id)).length
  }, [messages, user])

  const hasSeenMessage = useCallback(
    (message: Message) => {
      if (!user) return false
      return message.seenBy.includes(user.id)
    },
    [user],
  )

  const hasAnsweredQuiz = useCallback(
    (quizId: string) => {
      if (!user) return false
      return hasOperatorAnsweredQuiz(quizId, user.id)
    },
    [user],
  )

  const handleMarkAsSeen = useCallback(
    (messageId: string) => {
      if (user) {
        markMessageAsSeen(messageId, user.id)
        loadDataDebounced()
        toast({
          title: "Mensagem marcada como vista",
          description: "A mensagem foi marcada como vista com sucesso.",
        })
      }
    },
    [user, loadDataDebounced, toast],
  )

  const handleSelectQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz)
    setSelectedAnswer("")
    setShowResult(false)
    setIsCorrect(false)
  }

  const handleSubmitQuiz = useCallback(() => {
    if (!selectedQuiz || !selectedAnswer || !user) return

    const correct = selectedAnswer === selectedQuiz.correctAnswer
    setIsCorrect(correct)
    setShowResult(true)

    createQuizAttempt({
      quizId: selectedQuiz.id,
      operatorId: user.id,
      operatorName: user.fullName,
      selectedAnswer,
      isCorrect: correct,
    })

    window.dispatchEvent(new Event("store-updated"))

    if (resultTimeout) clearTimeout(resultTimeout)
    const timeout = setTimeout(() => {
      setShowResult(false)
      setSelectedQuiz(null)
      setSelectedAnswer("")
    }, 5000)
    setResultTimeout(timeout)

    setTimeout(() => {
      loadDataDebounced()
    }, 500)
  }, [selectedQuiz, selectedAnswer, user, loadDataDebounced, resultTimeout])

  const rankings = useMemo(() => {
    const rankingData = getMonthlyQuizRanking(selectedYear, selectedMonth)
    return rankingData
  }, [selectedYear, selectedMonth, user])

  const userRanking = useMemo(() => {
    return user ? rankings.find((r) => r.operatorId === user.id) : null
  }, [rankings, user])

  const displayMessages = useMemo(() => {
    return showHistory ? historicalMessages : messages
  }, [showHistory, historicalMessages, messages])

  const displayQuizzes = useMemo(() => {
    return showHistory ? historicalQuizzes : quizzes
  }, [showHistory, historicalQuizzes, quizzes])

  const getMonthName = (month: number) => {
    const months = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ]
    return months[month]
  }

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonthIndex = now.getMonth()

    if (selectedYear === currentYear && selectedMonth === currentMonthIndex) {
      return
    }

    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  const isCurrentMonth = () => {
    const now = new Date()
    return selectedYear === now.getFullYear() && selectedMonth === now.getMonth()
  }

  const handleSidebarChange = (view: "messages" | "quiz" | "ranking") => {
    setSidebarView(view)
    if (view === "messages") {
      setActiveTab("messages")
    } else if (view === "quiz") {
      setActiveTab("quiz")
    } else if (view === "ranking") {
      setActiveTab("quiz")
    }
    setShowHistory(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] h-[90vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
            <DialogTitle className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Recados e Quiz
            </DialogTitle>
            <DialogDescription className="sr-only">
              Visualize mensagens, responda quizzes e confira o ranking mensal de operadores
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-1 min-h-0 gap-0 overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 border-r bg-muted/30 flex flex-col flex-shrink-0">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  <Button
                    variant={sidebarView === "messages" ? "default" : "ghost"}
                    onClick={() => handleSidebarChange("messages")}
                    className={`w-full justify-start text-left transition-all duration-300 ${
                      sidebarView === "messages"
                        ? "bg-orange-500 hover:bg-orange-600 dark:bg-primary dark:hover:bg-primary/90 text-white shadow-lg"
                        : "hover:bg-muted"
                    }`}
                  >
                    <MessageSquare className="h-5 w-5 mr-3" />
                    <span className="flex-1">Recados</span>
                    {unseenCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="ml-2 h-6 w-6 p-0 flex items-center justify-center text-xs"
                      >
                        {unseenCount}
                      </Badge>
                    )}
                  </Button>

                  <Button
                    variant={sidebarView === "quiz" ? "default" : "ghost"}
                    onClick={() => handleSidebarChange("quiz")}
                    className={`w-full justify-start text-left transition-all duration-300 ${
                      sidebarView === "quiz"
                        ? "bg-orange-500 hover:bg-orange-600 dark:bg-primary dark:hover:bg-primary/90 text-white shadow-lg"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Brain className="h-5 w-5 mr-3" />
                    <span className="flex-1">Quiz</span>
                  </Button>

                  <Button
                    variant={sidebarView === "ranking" ? "default" : "ghost"}
                    onClick={() => handleSidebarChange("ranking")}
                    className={`w-full justify-start text-left transition-all duration-300 ${
                      sidebarView === "ranking"
                        ? "bg-orange-500 hover:bg-orange-600 dark:bg-primary dark:hover:bg-primary/90 text-white shadow-lg"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Trophy className="h-5 w-5 mr-3" />
                    <span className="flex-1">Ranking</span>
                  </Button>
                </div>
              </ScrollArea>

              {sidebarView !== "ranking" && (
                <div className="p-4 border-t">
                  <Button
                    variant={showHistory ? "default" : "outline"}
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full justify-start"
                  >
                    <History className="h-5 w-5 mr-3" />
                    Histórico
                  </Button>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <ScrollArea className="flex-1 px-4 sm:px-6 py-4 overflow-y-auto">
                {sidebarView === "messages" && (
                  <div className="space-y-4 sm:space-y-6 py-2 px-1">
                    {displayMessages.length === 0 ? (
                      <div className="text-center py-16 sm:py-24 md:py-32">
                        <MessageSquare className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-muted-foreground mx-auto mb-4 sm:mb-6 opacity-50" />
                        <p className="text-muted-foreground text-lg sm:text-xl md:text-2xl">
                          {showHistory ? "Nenhum recado no histórico." : "Nenhum recado disponível no momento."}
                        </p>
                      </div>
                    ) : (
                      displayMessages.map((message, index) => {
                        const seen = hasSeenMessage(message)

                        return (
                          <Card
                            key={message.id}
                            className={`transition-all duration-300 overflow-hidden ${
                              seen
                                ? "opacity-60 bg-muted"
                                : "bg-gradient-to-br from-card to-muted/30 hover:shadow-xl hover:shadow-primary/10 border-2 border-transparent hover:border-primary/30"
                            } animate-in fade-in slide-in-from-bottom-4`}
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <CardHeader className="pb-3 sm:pb-4 relative overflow-hidden">
                              {!seen && (
                                <>
                                  <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-primary/20 rounded-full blur-3xl -z-10" />
                                  <div className="absolute bottom-0 left-0 w-20 h-20 sm:w-24 sm:h-24 bg-accent/20 rounded-full blur-2xl -z-10" />
                                </>
                              )}
                              <div className="flex items-start justify-between gap-2 sm:gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="p-1.5 sm:p-2 rounded-lg bg-orange-500 dark:bg-gradient-to-br dark:from-primary dark:to-accent shadow-lg flex-shrink-0 cursor-help">
                                            <Mail className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="font-semibold">Enviado por: {message.createdByName}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    {!seen && (
                                      <Badge className="bg-orange-500 dark:bg-gradient-to-r dark:from-primary dark:to-accent text-white border-0 animate-pulse flex-shrink-0 text-xs sm:text-sm">
                                        <Bell className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                        Novo
                                      </Badge>
                                    )}
                                  </div>
                                  <CardDescription className="mt-2 sm:mt-3 text-sm sm:text-base md:text-lg break-words">
                                    {new Date(message.createdAt).toLocaleDateString("pt-BR")} às{" "}
                                    {new Date(message.createdAt).toLocaleTimeString("pt-BR", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </CardDescription>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setExpandedMessage(message)}
                                    className="px-2 sm:px-3 md:px-4 hover:scale-105 transition-transform text-xs sm:text-sm"
                                  >
                                    <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 sm:mr-2" />
                                    <span className="hidden sm:inline">Ampliar</span>
                                  </Button>
                                  {seen && (
                                    <Badge
                                      variant="secondary"
                                      className="px-2 sm:px-3 md:px-4 py-1 sm:py-2 text-xs sm:text-sm md:text-base"
                                    >
                                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 sm:mr-2" />
                                      <span className="hidden sm:inline">Visto</span>
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="bg-gradient-to-br from-muted/30 to-muted/20 rounded-xl p-4 sm:p-5 md:p-6 border-2 border-orange-500/20 dark:border-primary/20 mb-4 sm:mb-6 shadow-sm">
                                <div
                                  className="text-sm sm:text-base md:text-lg leading-relaxed break-words hyphens-auto max-w-full prose prose-sm sm:prose-base md:prose-lg max-w-none dark:prose-invert"
                                  dangerouslySetInnerHTML={{ __html: message.content }}
                                />

                                {message.attachment && message.attachment.type === "image" && (
                                  <div className="mt-4 sm:mt-6">
                                    <img
                                      src={message.attachment.url || "/placeholder.svg"}
                                      alt={message.attachment.name}
                                      className="max-w-full h-auto rounded-lg border-2 border-orange-500/20 shadow-md cursor-pointer hover:shadow-xl transition-shadow"
                                      onClick={() => window.open(message.attachment!.url, "_blank")}
                                    />
                                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                                      {message.attachment.name}
                                    </p>
                                  </div>
                                )}
                              </div>
                              {!seen && !showHistory && (
                                <Button
                                  size="lg"
                                  onClick={() => handleMarkAsSeen(message.id)}
                                  className="w-auto px-6 sm:px-8 md:px-10 mx-auto block text-sm sm:text-base md:text-lg py-4 sm:py-5 md:py-6 bg-orange-500 hover:bg-orange-600 text-white dark:bg-gradient-to-r dark:from-primary dark:via-accent dark:to-primary dark:hover:opacity-90 dark:text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center"
                                >
                                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mr-2" />
                                  Marcar como Visto
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })
                    )}
                  </div>
                )}

                {sidebarView === "quiz" && (
                  <div className="space-y-4 sm:space-y-6 py-2 px-1">
                    {!selectedQuiz ? (
                      <>
                        {displayQuizzes.length === 0 ? (
                          <div className="text-center py-16 sm:py-24 md:py-32">
                            <Brain className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-muted-foreground mx-auto mb-4 sm:mb-6 opacity-50" />
                            <p className="text-muted-foreground text-lg sm:text-xl md:text-2xl">
                              {showHistory ? "Nenhum quiz no histórico." : "Nenhum quiz disponível no momento."}
                            </p>
                          </div>
                        ) : (
                          displayQuizzes.map((quiz, index) => {
                            const answered = hasAnsweredQuiz(quiz.id)

                            return (
                              <Card
                                key={quiz.id}
                                className={`cursor-pointer transition-all duration-300 overflow-hidden ${
                                  answered
                                    ? "opacity-60 bg-muted"
                                    : "bg-gradient-to-br from-card to-muted/30 hover:shadow-xl hover:shadow-chart-1/10 border-2 border-transparent hover:border-chart-1/30"
                                } animate-in fade-in slide-in-from-bottom-4`}
                                style={{ animationDelay: `${index * 100}ms` }}
                              >
                                <CardHeader
                                  onClick={() => !answered && !showHistory && handleSelectQuiz(quiz)}
                                  className="pb-3 sm:pb-4 relative overflow-hidden"
                                >
                                  {!answered && (
                                    <>
                                      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-chart-1/20 rounded-full blur-3xl -z-10" />
                                      <div className="absolute bottom-0 left-0 w-20 h-20 sm:w-24 sm:h-24 bg-chart-5/20 rounded-full blur-2xl -z-10" />
                                    </>
                                  )}
                                  <div className="flex items-start justify-between gap-2 sm:gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                        <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-chart-1 to-chart-4 shadow-lg flex-shrink-0">
                                          <Brain className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                                        </div>
                                        {!answered && (
                                          <Badge className="bg-gradient-to-r from-chart-5 to-chart-1 text-white border-0 animate-pulse flex-shrink-0 text-xs sm:text-sm">
                                            <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                            Novo
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="bg-gradient-to-br from-muted/30 to-muted/20 rounded-xl p-4 sm:p-5 md:p-6 border-2 border-orange-500/20 dark:border-primary/20 mb-3 sm:mb-4 shadow-sm">
                                        <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-foreground dark:text-white break-words hyphens-auto">
                                          {quiz.question}
                                        </CardTitle>
                                      </div>
                                      <CardDescription className="text-sm sm:text-base md:text-lg break-words">
                                        Por {quiz.createdByName} •{" "}
                                        {new Date(quiz.createdAt).toLocaleDateString("pt-BR")} às{" "}
                                        {new Date(quiz.createdAt).toLocaleTimeString("pt-BR", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </CardDescription>
                                    </div>
                                    {answered && (
                                      <Badge
                                        variant="secondary"
                                        className="ml-2 px-2 sm:px-3 md:px-4 py-1 sm:py-2 text-xs sm:text-sm md:text-base flex-shrink-0"
                                      >
                                        <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 sm:mr-2" />
                                        <span className="hidden sm:inline">Respondido</span>
                                      </Badge>
                                    )}
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <Button
                                    size="lg"
                                    onClick={() => handleSelectQuiz(quiz)}
                                    className={`w-auto px-6 sm:px-8 md:px-10 mx-auto block text-sm sm:text-base md:text-lg py-4 sm:py-5 md:py-6 transition-all duration-300 flex items-center justify-center ${
                                      !answered && !showHistory
                                        ? "bg-orange-500 hover:bg-orange-600 text-white dark:bg-gradient-to-r dark:from-chart-1 dark:via-chart-4 dark:to-chart-5 dark:hover:opacity-90 dark:text-white shadow-lg hover:shadow-xl hover:scale-105"
                                        : ""
                                    }`}
                                    disabled={answered || showHistory}
                                  >
                                    {answered ? "Já Respondido" : showHistory ? "Visualizar" : "Responder Quiz"}
                                    {!answered && !showHistory && (
                                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 ml-2 animate-pulse flex-shrink-0" />
                                    )}
                                  </Button>
                                </CardContent>
                              </Card>
                            )
                          })
                        )}
                      </>
                    ) : (
                      <Card className="shadow-2xl border-2 border-chart-1/50 bg-gradient-to-br from-card to-muted/30 animate-in fade-in zoom-in-95 duration-500">
                        <CardHeader className="pb-4 sm:pb-6 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-chart-1/20 rounded-full blur-3xl -z-10" />
                          <div className="absolute bottom-0 left-0 w-20 h-20 sm:w-24 sm:h-24 bg-chart-5/20 rounded-full blur-2xl -z-10" />

                          <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4 flex-wrap">
                            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-chart-1 to-chart-4 shadow-lg animate-pulse flex-shrink-0">
                              <Brain className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                            </div>
                            <Badge className="bg-gradient-to-r from-chart-1 to-chart-4 text-white border-0 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base flex-shrink-0">
                              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                              Quiz Ativo
                            </Badge>
                          </div>
                          <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground dark:text-white break-words hyphens-auto">
                            {selectedQuiz.question}
                          </CardTitle>
                          <CardDescription className="text-sm sm:text-base md:text-lg mt-2 sm:mt-3 break-words">
                            Selecione a resposta correta abaixo
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 sm:space-y-8">
                          <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} disabled={showResult}>
                            {selectedQuiz.options.map((option, index) => (
                              <div
                                key={option.id}
                                className={`flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 md:p-5 rounded-xl border-2 transition-all duration-300 transform animate-in slide-in-from-left ${
                                  !showResult ? "hover:bg-muted/50 cursor-pointer hover:shadow-md" : ""
                                } ${
                                  selectedAnswer === option.id && !showResult
                                    ? "border-chart-1 bg-muted/50 shadow-md"
                                    : showResult && option.id === selectedQuiz.correctAnswer
                                      ? "border-green-500 dark:border-green-600 bg-green-500/10 shadow-lg shadow-green-500/20"
                                      : showResult && option.id === selectedAnswer && !isCorrect
                                        ? "border-red-500 dark:border-red-600 bg-red-500/10 shadow-lg shadow-red-500/20"
                                        : "border-border"
                                }`}
                                style={{ animationDelay: `${index * 100}ms` }}
                              >
                                <RadioGroupItem
                                  value={option.id}
                                  id={option.id}
                                  className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 mt-1"
                                />
                                <Label
                                  htmlFor={option.id}
                                  className={`flex-1 min-w-0 cursor-pointer text-sm sm:text-base md:text-lg transition-all duration-300 break-words hyphens-auto max-w-full ${
                                    showResult && option.id === selectedQuiz.correctAnswer
                                      ? "text-green-600 dark:text-green-400 font-semibold"
                                      : showResult && option.id === selectedAnswer && !isCorrect
                                        ? "text-red-600 dark:text-red-400"
                                        : selectedAnswer === option.id && !showResult
                                          ? "font-semibold"
                                          : ""
                                  }`}
                                >
                                  <span className="font-bold mr-2 sm:mr-3 text-base sm:text-lg md:text-xl bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-transparent inline-block flex-shrink-0">
                                    {option.label})
                                  </span>
                                  <span className="inline-block max-w-full">{option.text}</span>
                                  {showResult && option.id === selectedQuiz.correctAnswer && (
                                    <CheckCircle2 className="inline h-5 w-5 sm:h-6 sm:w-6 ml-2 sm:ml-3 text-green-600 dark:text-green-400 animate-in zoom-in-50 spin-in-180 flex-shrink-0" />
                                  )}
                                  {showResult && option.id === selectedAnswer && !isCorrect && (
                                    <XCircle className="inline h-5 w-5 sm:h-6 sm:w-6 ml-2 sm:ml-3 text-red-600 dark:text-red-400 animate-in zoom-in-50 flex-shrink-0" />
                                  )}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>

                          {/* Display inline result alert below quiz */}
                          {showResult && (
                            <div
                              className={`mt-8 p-6 sm:p-8 rounded-2xl border-2 transition-all duration-500 transform animate-in fade-in zoom-in-95 ${
                                isCorrect
                                  ? "bg-green-500/15 border-green-500 dark:border-green-600 shadow-2xl shadow-green-500/30"
                                  : "bg-red-500/15 border-red-500 dark:border-red-600 shadow-2xl shadow-red-500/30"
                              }`}
                            >
                              <div className="relative overflow-hidden">
                                {isCorrect && (
                                  <>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/20 dark:bg-yellow-600/10 rounded-full blur-2xl animate-pulse" />
                                    <div
                                      className="absolute bottom-0 left-0 w-40 h-40 bg-green-400/20 dark:bg-green-600/10 rounded-full blur-2xl animate-pulse"
                                      style={{ animationDelay: "500ms" }}
                                    />
                                  </>
                                )}

                                <div className="relative z-10">
                                  <div className="flex items-center gap-4 sm:gap-6 mb-4">
                                    {isCorrect ? (
                                      <div className="relative flex-shrink-0">
                                        <Trophy className="h-12 w-12 sm:h-14 sm:w-14 text-yellow-500 dark:text-yellow-400 animate-bounce" />
                                        <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400 dark:text-yellow-300 absolute -top-2 -right-2 animate-spin" />
                                        <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 dark:text-yellow-400 absolute -bottom-1 -left-1 animate-pulse" />
                                      </div>
                                    ) : (
                                      <XCircle className="h-12 w-12 sm:h-14 sm:w-14 text-red-600 dark:text-red-400 animate-pulse flex-shrink-0" />
                                    )}

                                    <div className="flex-1 min-w-0">
                                      <h3
                                        className={`text-2xl sm:text-3xl font-bold mb-1 ${
                                          isCorrect
                                            ? "text-green-600 dark:text-green-400"
                                            : "text-red-700 dark:text-red-400"
                                        }`}
                                      >
                                        {isCorrect ? "🎉 Parabéns!" : "Resposta Incorreta"}
                                      </h3>
                                      <p
                                        className={`text-lg sm:text-xl font-semibold ${
                                          isCorrect
                                            ? "text-green-700 dark:text-green-500"
                                            : "text-red-600 dark:text-red-500"
                                        }`}
                                      >
                                        {isCorrect ? "Resposta Correta!" : "Tente novamente!"}
                                      </p>
                                    </div>
                                  </div>

                                  <p
                                    className={`text-base sm:text-lg leading-relaxed mb-6 ${
                                      isCorrect
                                        ? "text-green-700 dark:text-green-500"
                                        : "text-red-600 dark:text-red-500"
                                    }`}
                                  >
                                    {isCorrect
                                      ? "Excelente trabalho! Você demonstrou conhecimento e acertou a questão."
                                      : "Não foi desta vez, tente novamente em um próximo Quiz."}
                                  </p>

                                  <div className="flex gap-2 sm:gap-4 flex-wrap">
                                    <Button
                                      onClick={() => {
                                        if (resultTimeout) clearTimeout(resultTimeout)
                                        setShowResult(false)
                                        setSelectedQuiz(null)
                                        setSelectedAnswer("")
                                        setIsCorrect(false)
                                      }}
                                      className="flex-1 min-w-[140px] px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg bg-orange-500 hover:bg-orange-600 text-white dark:bg-gradient-to-r dark:from-chart-1 dark:via-chart-4 dark:to-chart-5 dark:hover:opacity-90 dark:text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
                                    >
                                      <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                                      Voltar
                                    </Button>

                                    {isCorrect && (
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          if (resultTimeout) clearTimeout(resultTimeout)
                                          setShowResult(false)
                                          setSelectedQuiz(null)
                                          setSelectedAnswer("")
                                          setIsCorrect(false)
                                        }}
                                        className="flex-1 min-w-[140px] px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg hover:scale-105 transition-all duration-300 font-semibold"
                                      >
                                        <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                                        Próximo Quiz
                                      </Button>
                                    )}
                                  </div>

                                  <div className="mt-4 text-sm text-muted-foreground text-center animate-pulse">
                                    ⏱️ Voltando automaticamente em 5 segundos...
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {!showResult && <Separator className="my-4 sm:my-6" />}

                          <div className={`flex gap-2 sm:gap-4 ${showResult ? "hidden" : ""}`}>
                            <Button
                              variant="outline"
                              onClick={() => setSelectedQuiz(null)}
                              className="flex-1 text-sm sm:text-base md:text-lg py-4 sm:py-5 md:py-6 hover:scale-105 transition-transform"
                            >
                              Voltar
                            </Button>
                            {!showResult && (
                              <Button
                                onClick={handleSubmitQuiz}
                                disabled={!selectedAnswer}
                                className="flex-1 text-sm sm:text-base md:text-lg py-4 sm:py-5 md:py-6 bg-orange-500 hover:bg-orange-600 text-white dark:bg-gradient-to-r dark:from-chart-1 dark:via-chart-4 dark:to-chart-5 dark:hover:opacity-90 dark:text-white shadow-lg hover:shadow-xl hover:scale-105"
                              >
                                <Zap className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                                Enviar Resposta
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {sidebarView === "ranking" && (
                  <div className="space-y-6 sm:space-y-8 pb-8">
                    <Card className="bg-gradient-to-br from-card to-muted/30 border-2 border-chart-1/50 shadow-2xl">
                      <CardHeader className="relative overflow-hidden pb-4 sm:pb-6">
                        <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-chart-1/10 rounded-full blur-3xl -z-10" />
                        <div className="absolute bottom-0 left-0 w-36 h-36 sm:w-48 sm:h-48 bg-chart-4/10 rounded-full blur-3xl -z-10" />
                        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-chart-1 to-chart-4 shadow-lg flex-shrink-0">
                              <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-white animate-pulse" />
                            </div>
                            <div className="min-w-0">
                              <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-chart-1 via-chart-4 to-chart-5 bg-clip-text text-transparent break-words hyphens-auto">
                                Ranking Mensal
                              </CardTitle>
                              <CardDescription className="text-sm sm:text-base md:text-lg mt-1">
                                {getMonthName(selectedMonth)} {selectedYear}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handlePreviousMonth}
                              className="h-8 w-8 sm:h-10 sm:w-10 p-0 bg-transparent"
                            >
                              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleNextMonth}
                              disabled={isCurrentMonth()}
                              className="h-8 w-8 sm:h-10 sm:w-10 p-0 bg-transparent"
                            >
                              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6 sm:space-y-8">
                        {rankings.length === 0 ? (
                          <div className="text-center py-16 sm:py-24 md:py-32">
                            <Trophy className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 text-muted-foreground mx-auto mb-4 sm:mb-6 opacity-50" />
                            <p className="text-muted-foreground text-lg sm:text-xl md:text-2xl">
                              Nenhum quiz respondido este mês ainda.
                            </p>
                          </div>
                        ) : (
                          <>
                            {/* Top 3 Section */}
                            <div className="space-y-4 sm:space-y-6">
                              <div className="text-center">
                                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-chart-1 via-chart-4 to-chart-5 bg-clip-text text-transparent mb-2 sm:mb-3">
                                  🏆 Top 3 do Mês
                                </h3>
                                <p className="text-muted-foreground">Os melhores operadores do ranking</p>
                              </div>

                              <div className="flex flex-col sm:flex-row items-center sm:items-end justify-center gap-6 sm:gap-3 px-2 sm:px-4 py-6 sm:px-8 md:px-12">
                                {/* 2nd Place - Left */}
                                {rankings[1] && (
                                  <div className="flex flex-col items-center w-full sm:flex-1 animate-in fade-in slide-in-from-left duration-700">
                                    <div className="mb-3 text-center">
                                      <div
                                        className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 shadow-xl mb-2 animate-bounce"
                                        style={{ animationDelay: "200ms" }}
                                      >
                                        <Medal className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-white" />
                                      </div>
                                      <p className="font-bold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 break-words hyphens-auto max-w-full px-2">
                                        {rankings[1].operatorName}
                                      </p>
                                      <p className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-transparent">
                                        {rankings[1].score}
                                      </p>
                                      <p className="text-xs sm:text-sm md:text-base text-muted-foreground">pontos</p>
                                    </div>
                                    <div
                                      className="w-full max-w-[200px] sm:max-w-none bg-gradient-to-br from-gray-300 to-gray-500 rounded-t-2xl shadow-2xl border-4 border-gray-400 dark:border-gray-600 relative overflow-hidden"
                                      style={{ height: "120px" }}
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                        <p className="text-5xl sm:text-6xl md:text-7xl font-black text-white/90">2</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* 1st Place - Center (Highest) */}
                                {rankings[0] && (
                                  <div className="flex flex-col items-center w-full sm:flex-1 animate-in fade-in zoom-in-95 duration-700 order-first sm:order-none">
                                    <div className="mb-3 text-center">
                                      <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-2xl mb-2 animate-bounce">
                                        <Crown className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-white" />
                                      </div>
                                      <p className="font-bold text-lg sm:text-xl md:text-2xl mb-1 sm:mb-2 break-words hyphens-auto max-w-full px-2">
                                        {rankings[0].operatorName}
                                      </p>
                                      <p className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                                        {rankings[0].score}
                                      </p>
                                      <p className="text-xs sm:text-sm md:text-base text-muted-foreground">pontos</p>
                                    </div>
                                    <div
                                      className="w-full max-w-[200px] sm:max-w-none bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-t-2xl shadow-2xl border-4 border-yellow-500 dark:border-yellow-700 relative overflow-hidden"
                                      style={{ height: "160px" }}
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                                      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse" />
                                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                        <p className="text-6xl sm:text-7xl md:text-8xl font-black text-white/90">1</p>
                                      </div>
                                      <Sparkles className="absolute top-3 right-3 h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-white/80 animate-spin" />
                                      <Star className="absolute bottom-3 left-3 h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white/80 animate-pulse" />
                                    </div>
                                  </div>
                                )}

                                {/* 3rd Place - Right */}
                                {rankings[2] && (
                                  <div className="flex flex-col items-center w-full sm:flex-1 animate-in fade-in slide-in-from-right duration-700">
                                    <div className="mb-3 text-center">
                                      <div
                                        className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-xl mb-2 animate-bounce"
                                        style={{ animationDelay: "400ms" }}
                                      >
                                        <Medal className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-white" />
                                      </div>
                                      <p className="font-bold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 break-words hyphens-auto max-w-full px-2">
                                        {rankings[2].operatorName}
                                      </p>
                                      <p className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-transparent">
                                        {rankings[2].score}
                                      </p>
                                      <p className="text-xs sm:text-sm md:text-base text-muted-foreground">pontos</p>
                                    </div>
                                    <div
                                      className="w-full max-w-[200px] sm:max-w-none bg-gradient-to-br from-orange-400 to-orange-600 rounded-t-2xl shadow-2xl border-4 border-orange-500 dark:border-orange-700 relative overflow-hidden"
                                      style={{ height: "100px" }}
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                        <p className="text-5xl sm:text-6xl md:text-7xl font-black text-white/90">3</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <Separator className="my-8 sm:my-10" />

                            <div className="space-y-4 sm:space-y-6 pb-8">
                              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">Classificação Completa</h3>
                              <div className="rounded-lg border bg-card overflow-hidden shadow-lg">
                                <div className="w-full overflow-x-auto">
                                  <Table>
                                    <TableHeader className="bg-muted/50">
                                      <TableRow>
                                        <TableHead className="w-16 sm:w-20 md:w-24 text-center font-bold whitespace-nowrap">
                                          Pos.
                                        </TableHead>
                                        <TableHead className="font-bold min-w-[120px] sm:min-w-[150px]">
                                          Operador
                                        </TableHead>
                                        <TableHead className="text-center font-bold whitespace-nowrap min-w-[100px] sm:min-w-[120px]">
                                          Quiz
                                        </TableHead>
                                        <TableHead className="text-center font-bold whitespace-nowrap min-w-[80px] sm:min-w-[90px]">
                                          Acertos
                                        </TableHead>
                                        <TableHead className="text-center font-bold whitespace-nowrap min-w-[80px] sm:min-w-[90px]">
                                          Precisão
                                        </TableHead>
                                        <TableHead className="text-right font-bold min-w-[70px] sm:min-w-[80px] pr-4 sm:pr-6">
                                          Pontos
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {rankings.map((ranking, index) => {
                                        const isCurrentUser = user && ranking.operatorId === user.id
                                        const isTopThree = ranking.rank <= 3

                                        return (
                                          <TableRow
                                            key={ranking.operatorId}
                                            className={`transition-all duration-300 animate-in fade-in slide-in-from-left ${
                                              isCurrentUser
                                                ? "bg-chart-1/10 border-l-4 border-l-chart-1 font-semibold"
                                                : isTopThree
                                                  ? "bg-muted/30"
                                                  : ""
                                            }`}
                                            style={{ animationDelay: `${index * 50}ms` }}
                                          >
                                            <TableCell className="text-center py-3 sm:py-4 md:py-5">
                                              <div className="flex items-center justify-center">
                                                {ranking.rank === 1 ? (
                                                  <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg">
                                                    <Crown className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                                                  </div>
                                                ) : ranking.rank === 2 ? (
                                                  <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg">
                                                    <Medal className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                                                  </div>
                                                ) : ranking.rank === 3 ? (
                                                  <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg">
                                                    <Medal className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                                                  </div>
                                                ) : (
                                                  <span className="text-base sm:text-lg md:text-xl font-bold">
                                                    {ranking.rank}º
                                                  </span>
                                                )}
                                              </div>
                                            </TableCell>
                                            <TableCell className="py-3 sm:py-4 md:py-5">
                                              <div className="flex items-center gap-2">
                                                <span
                                                  className={`text-xs sm:text-sm md:text-base ${isTopThree ? "font-bold" : "font-semibold"} break-words`}
                                                >
                                                  {ranking.operatorName}
                                                </span>
                                                {isCurrentUser && (
                                                  <Badge className="bg-chart-1 text-white flex-shrink-0 text-xs">
                                                    Você
                                                  </Badge>
                                                )}
                                                {isTopThree && (
                                                  <Star className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-chart-1 fill-chart-1 flex-shrink-0" />
                                                )}
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-center py-3 sm:py-4 md:py-5">
                                              <div className="flex items-center justify-center gap-1 sm:gap-2">
                                                <Brain className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
                                                <span className="font-semibold text-xs sm:text-sm md:text-base">
                                                  {ranking.totalAttempts}
                                                </span>
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-center py-3 sm:py-4 md:py-5">
                                              <div className="flex items-center justify-center gap-1 sm:gap-2">
                                                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                                <span className="font-semibold text-xs sm:text-sm md:text-base">
                                                  {ranking.correctAnswers}
                                                </span>
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-center py-3 sm:py-4 md:py-5">
                                              <div className="flex items-center justify-center gap-1 sm:gap-2">
                                                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
                                                <span className="font-semibold text-xs sm:text-sm md:text-base">
                                                  {ranking.accuracy.toFixed(1)}%
                                                </span>
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-right py-3 sm:py-4 md:py-5 pr-4 sm:pr-6">
                                              <span
                                                className={`text-base sm:text-lg md:text-xl font-bold ${
                                                  isTopThree
                                                    ? "bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-transparent"
                                                    : ""
                                                }`}
                                              >
                                                {ranking.score}
                                              </span>
                                            </TableCell>
                                          </TableRow>
                                        )
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Message Dialog */}
      <Dialog open={!!expandedMessage} onOpenChange={(open) => !open && setExpandedMessage(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[70vw] max-h-[90vh] flex flex-col p-6 sm:p-8 md:p-10 bg-gradient-to-br from-card to-muted/30 border-2 border-orange-500/30 dark:border-primary/30 shadow-2xl">
          <DialogHeader className="flex-shrink-0 pb-4 sm:pb-6 relative">
            <div className="absolute top-0 right-0 w-36 h-36 sm:w-48 sm:h-48 bg-orange-500/10 dark:bg-primary/10 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-orange-400/10 dark:bg-accent/10 rounded-full blur-2xl -z-10" />

            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-1 min-w-0">
                <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 dark:from-primary dark:to-accent text-white border-0 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm flex-shrink-0 mb-2">
                  <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                  Visualização Ampliada
                </Badge>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {expandedMessage && (
                    <>
                      Enviado por {expandedMessage.createdByName} •{" "}
                      {new Date(expandedMessage.createdAt).toLocaleDateString("pt-BR")} às{" "}
                      {new Date(expandedMessage.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </>
                  )}
                </p>
              </div>
            </div>
            <DialogDescription className="sr-only">
              Visualização ampliada da mensagem {expandedMessage?.createdByName} enviada em{" "}
              {expandedMessage && new Date(expandedMessage.createdAt).toLocaleDateString("pt-BR")}
            </DialogDescription>
          </DialogHeader>

          <Separator className="my-4 sm:my-6" />

          <ScrollArea className="flex-1 min-h-0">
            <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl p-6 sm:p-8 md:p-10 border-2 border-orange-500/20 dark:border-primary/20 shadow-inner">
              <div className="prose prose-lg sm:prose-xl md:prose-2xl max-w-none dark:prose-invert">
                <div
                  className="text-lg sm:text-xl md:text-2xl leading-relaxed break-words hyphens-auto text-foreground/90 max-w-full font-normal"
                  dangerouslySetInnerHTML={{ __html: expandedMessage?.content || "" }}
                />

                {expandedMessage?.attachment && expandedMessage.attachment.type === "image" && (
                  <div className="mt-6 sm:mt-8">
                    <img
                      src={expandedMessage.attachment.url || "/placeholder.svg"}
                      alt={expandedMessage.attachment.name}
                      className="max-w-full h-auto rounded-lg border-2 border-orange-500/20 shadow-lg cursor-pointer hover:shadow-2xl transition-shadow"
                      onClick={() => window.open(expandedMessage.attachment!.url, "_blank")}
                    />
                    <p className="text-sm sm:text-base text-muted-foreground mt-3">{expandedMessage.attachment.name}</p>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <div className="flex gap-3 sm:gap-4 pt-6 sm:pt-8 flex-shrink-0">
            {expandedMessage && !hasSeenMessage(expandedMessage) && !showHistory && (
              <Button
                size="lg"
                onClick={() => {
                  handleMarkAsSeen(expandedMessage.id)
                  setExpandedMessage(null)
                }}
                className="flex-1 text-base sm:text-lg md:text-lg py-5 sm:py-6 md:py-7 bg-orange-500 hover:bg-orange-600 text-white dark:bg-gradient-to-r dark:from-primary dark:via-accent dark:to-primary dark:hover:opacity-90 dark:text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
              >
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                Marcar como Visto
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              onClick={() => setExpandedMessage(null)}
              className={`text-base sm:text-lg md:text-lg py-5 sm:py-6 md:py-7 hover:scale-105 transition-transform font-semibold ${expandedMessage && !hasSeenMessage(expandedMessage) && !showHistory ? "flex-1" : "w-full"}`}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
