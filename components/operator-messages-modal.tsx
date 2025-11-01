"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  getCurrentMonthName,
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

interface OperatorMessagesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OperatorMessagesModal({ open, onOpenChange }: OperatorMessagesModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"messages" | "quiz">("messages")
  const [showHistory, setShowHistory] = useState(false)
  const [showRanking, setShowRanking] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [historicalMessages, setHistoricalMessages] = useState<Message[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [historicalQuizzes, setHistoricalQuizzes] = useState<Quiz[]>([])
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string>("")
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [expandedMessage, setExpandedMessage] = useState<Message | null>(null)

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, user])

  useEffect(() => {
    const handleStoreUpdate = () => {
      loadData()
    }

    window.addEventListener("store-updated", handleStoreUpdate)
    return () => window.removeEventListener("store-updated", handleStoreUpdate)
  }, [user])

  const loadData = () => {
    if (!user) return

    setMessages(getActiveMessagesForOperator(user.id))
    setHistoricalMessages(getHistoricalMessagesForOperator(user.id))
    setQuizzes(getActiveQuizzesForOperator())
    setHistoricalQuizzes(getHistoricalQuizzes())
  }

  const handleMarkAsSeen = (messageId: string) => {
    if (user) {
      markMessageAsSeen(messageId, user.id)
      loadData()
      toast({
        title: "Mensagem marcada como vista",
        description: "A mensagem foi marcada como vista com sucesso.",
      })
    }
  }

  const handleSelectQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz)
    setSelectedAnswer("")
    setShowResult(false)
    setIsCorrect(false)
  }

  const handleSubmitQuiz = () => {
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

    toast({
      title: correct ? "Resposta Correta!" : "Resposta Incorreta",
      description: correct ? "Parabéns! Você acertou a resposta." : "Infelizmente você errou.",
      variant: correct ? "default" : "destructive",
    })

    setTimeout(() => {
      loadData()
    }, 1000)
  }

  const getUnseenCount = () => {
    if (!user) return 0
    return messages.filter((m) => !m.seenBy.includes(user.id)).length
  }

  const hasSeenMessage = (message: Message) => {
    if (!user) return false
    return message.seenBy.includes(user.id)
  }

  const hasAnsweredQuiz = (quizId: string) => {
    if (!user) return false
    return hasOperatorAnsweredQuiz(quizId, user.id)
  }

  const displayMessages = showHistory ? historicalMessages : messages
  const displayQuizzes = showHistory ? historicalQuizzes : quizzes

  const rankings = getMonthlyQuizRanking(selectedYear, selectedMonth)
  const currentMonth = getCurrentMonthName()
  const userRanking = user ? rankings.find((r) => r.operatorId === user.id) : null

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

    // Don't allow going beyond current month
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] h-[90vh] flex flex-col p-4 sm:p-6">
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Recados e Quiz
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 sm:gap-4 border-b pb-3 flex-shrink-0 overflow-x-auto">
            <Button
              variant={activeTab === "messages" ? "default" : "ghost"}
              onClick={() => {
                setActiveTab("messages")
                setShowHistory(false)
                setShowRanking(false)
              }}
              className={`relative text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 transition-all duration-300 whitespace-nowrap ${
                activeTab === "messages"
                  ? "bg-gradient-to-r from-primary via-accent to-primary hover:opacity-90 text-white shadow-lg shadow-primary/50 scale-105"
                  : "hover:scale-105"
              }`}
            >
              <MessageSquare
                className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mr-2 ${activeTab === "messages" ? "animate-pulse" : ""}`}
              />
              Recados
              {getUnseenCount() > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 p-0 flex items-center justify-center text-xs sm:text-sm font-bold animate-pulse"
                >
                  {getUnseenCount()}
                </Badge>
              )}
              {activeTab === "messages" && <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 ml-2 animate-spin" />}
            </Button>
            <Button
              variant={activeTab === "quiz" ? "default" : "ghost"}
              onClick={() => {
                setActiveTab("quiz")
                setShowHistory(false)
                setShowRanking(false)
              }}
              className={`text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 transition-all duration-300 whitespace-nowrap ${
                activeTab === "quiz"
                  ? "bg-gradient-to-r from-chart-1 via-chart-4 to-chart-5 hover:opacity-90 text-white shadow-lg shadow-chart-1/50 scale-105"
                  : "hover:scale-105"
              }`}
            >
              <Brain
                className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mr-2 ${activeTab === "quiz" ? "animate-pulse" : ""}`}
              />
              Quiz
              <Sparkles
                className={`h-4 w-4 sm:h-5 sm:w-5 ml-2 ${activeTab === "quiz" ? "animate-spin" : "opacity-50"}`}
              />
            </Button>
            {activeTab === "quiz" && (
              <Button
                variant={showRanking ? "default" : "outline"}
                onClick={() => {
                  setShowRanking(!showRanking)
                  setShowHistory(false)
                }}
                className={`text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 transition-all duration-300 whitespace-nowrap ${
                  showRanking
                    ? "bg-gradient-to-r from-chart-4 via-chart-1 to-chart-5 text-white shadow-lg scale-105"
                    : "hover:scale-105"
                }`}
              >
                <Trophy className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mr-2 ${showRanking ? "animate-bounce" : ""}`} />
                Ranking
              </Button>
            )}
            <Button
              variant={showHistory ? "default" : "outline"}
              onClick={() => {
                setShowHistory(!showHistory)
                setShowRanking(false)
              }}
              className={`ml-auto text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 whitespace-nowrap ${showHistory ? "shadow-lg" : ""}`}
            >
              <History className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mr-2" />
              Histórico
            </Button>
          </div>

          <ScrollArea className="flex-1 min-h-0 pr-2 sm:pr-4 md:pr-6">
            {activeTab === "messages" && (
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
                                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg flex-shrink-0">
                                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                                </div>
                                {!seen && (
                                  <Badge className="bg-gradient-to-r from-primary to-accent text-white border-0 animate-pulse flex-shrink-0 text-xs sm:text-sm">
                                    <Bell className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    Novo
                                  </Badge>
                                )}
                              </div>
                              <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent break-words overflow-wrap-anywhere">
                                {message.title}
                              </CardTitle>
                              <CardDescription className="mt-2 sm:mt-3 text-sm sm:text-base md:text-lg break-words">
                                Por {message.createdByName} • {new Date(message.createdAt).toLocaleDateString("pt-BR")}{" "}
                                às{" "}
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
                          <p className="text-sm sm:text-base md:text-lg whitespace-pre-wrap mb-4 sm:mb-6 leading-relaxed break-words overflow-wrap-anywhere">
                            {message.content}
                          </p>
                          {!seen && !showHistory && (
                            <Button
                              size="lg"
                              onClick={() => handleMarkAsSeen(message.id)}
                              className="w-full text-sm sm:text-base md:text-lg py-4 sm:py-5 md:py-6 bg-gradient-to-r from-primary via-accent to-primary hover:opacity-90 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
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

            {activeTab === "quiz" && (
              <div className="space-y-4 sm:space-y-6 py-2 px-1">
                {showRanking ? (
                  <div className="space-y-6 sm:space-y-8">
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
                              <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-chart-1 via-chart-4 to-chart-5 bg-clip-text text-transparent break-words">
                                Ranking Mensal - {getMonthName(selectedMonth)} {selectedYear}
                              </CardTitle>
                              <CardDescription className="text-sm sm:text-base md:text-lg mt-1">
                                Classificação geral dos operadores
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
                            {rankings.length > 0 && (
                              <div className="space-y-6 sm:space-y-8">
                                <div className="text-center">
                                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-chart-1 via-chart-4 to-chart-5 bg-clip-text text-transparent mb-2 sm:mb-3">
                                    🏆 Top 3 do Mês
                                  </h3>
                                  <p className="text-muted-foreground">Os melhores operadores do ranking</p>
                                </div>

                                <div className="flex items-end justify-center gap-3 px-4 py-6 sm:px-8 md:px-12">
                                  {/* 2nd Place - Left */}
                                  {rankings[1] && (
                                    <div className="flex flex-col items-center flex-1 animate-in fade-in slide-in-from-left duration-700">
                                      <div className="mb-3 text-center">
                                        <div
                                          className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 shadow-xl mb-2 animate-bounce"
                                          style={{ animationDelay: "200ms" }}
                                        >
                                          <Medal className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-white" />
                                        </div>
                                        <p className="font-bold text-base sm:text-lg md:text-xl mb-1 sm:mb-2">
                                          {rankings[1].operatorName}
                                        </p>
                                        <p className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-transparent">
                                          {rankings[1].score}
                                        </p>
                                        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">pontos</p>
                                      </div>
                                      <div
                                        className="w-full bg-gradient-to-br from-gray-300 to-gray-500 rounded-t-2xl shadow-2xl border-4 border-gray-400 dark:border-gray-600 relative overflow-hidden"
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
                                    <div className="flex flex-col items-center flex-1 animate-in fade-in zoom-in-95 duration-700">
                                      <div className="mb-3 text-center">
                                        <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-2xl mb-2 animate-bounce">
                                          <Crown className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-white" />
                                        </div>
                                        <p className="font-bold text-lg sm:text-xl md:text-2xl mb-1 sm:mb-2">
                                          {rankings[0].operatorName}
                                        </p>
                                        <p className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                                          {rankings[0].score}
                                        </p>
                                        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">pontos</p>
                                      </div>
                                      <div
                                        className="w-full bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-t-2xl shadow-2xl border-4 border-yellow-500 dark:border-yellow-700 relative overflow-hidden"
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
                                    <div
                                      className="flex flex-col items-center flex-1 animate-in fade-in slide-in-from-right duration-700"
                                      style={{ animationDelay: "400ms" }}
                                    >
                                      <div className="mb-3 text-center">
                                        <div
                                          className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-xl mb-2 animate-bounce"
                                          style={{ animationDelay: "400ms" }}
                                        >
                                          <Medal className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-white" />
                                        </div>
                                        <p className="font-bold text-base sm:text-lg md:text-xl mb-1 sm:mb-2">
                                          {rankings[2].operatorName}
                                        </p>
                                        <p className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-transparent">
                                          {rankings[2].score}
                                        </p>
                                        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">pontos</p>
                                      </div>
                                      <div
                                        className="w-full bg-gradient-to-br from-orange-400 to-orange-600 rounded-t-2xl shadow-2xl border-4 border-orange-500 dark:border-orange-700 relative overflow-hidden"
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
                            )}

                            <Separator className="my-8 sm:my-10" />

                            <div className="space-y-4 sm:space-y-6">
                              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">Classificação Completa</h3>
                              <div className="rounded-lg border bg-card overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-muted/50">
                                      <TableHead className="w-20 sm:w-24 md:w-28 text-center font-bold">
                                        Posição
                                      </TableHead>
                                      <TableHead className="font-bold">Operador</TableHead>
                                      <TableHead className="text-center font-bold">Quiz Respondidos</TableHead>
                                      <TableHead className="text-center font-bold">Acertos</TableHead>
                                      <TableHead className="text-center font-bold">Precisão</TableHead>
                                      <TableHead className="text-right font-bold">Pontos</TableHead>
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
                                          <TableCell className="text-center">
                                            <div className="flex items-center justify-center">
                                              {ranking.rank === 1 ? (
                                                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg">
                                                  <Crown className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                                                </div>
                                              ) : ranking.rank === 2 ? (
                                                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg">
                                                  <Medal className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                                                </div>
                                              ) : ranking.rank === 3 ? (
                                                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg">
                                                  <Medal className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                                                </div>
                                              ) : (
                                                <span className="text-lg sm:text-xl md:text-2xl font-bold">
                                                  {ranking.rank}º
                                                </span>
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell className="min-w-0">
                                            <div className="flex items-center gap-2 min-w-0">
                                              <span
                                                className={`break-words overflow-wrap-anywhere ${isTopThree ? "font-bold text-lg sm:text-xl md:text-2xl" : "text-base sm:text-lg md:text-xl"}`}
                                              >
                                                {ranking.operatorName}
                                              </span>
                                              {isCurrentUser && (
                                                <Badge className="bg-chart-1 text-white flex-shrink-0">Você</Badge>
                                              )}
                                              {isTopThree && (
                                                <Star className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-chart-1 fill-chart-1 flex-shrink-0" />
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                              <Brain className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-muted-foreground" />
                                              <span className="font-semibold text-lg sm:text-xl md:text-2xl">
                                                {ranking.totalAttempts}
                                              </span>
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
                                              <span className="font-semibold text-lg sm:text-xl md:text-2xl">
                                                {ranking.correctAnswers}
                                              </span>
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-muted-foreground" />
                                              <span className="font-semibold text-lg sm:text-xl md:text-2xl">
                                                {ranking.accuracy.toFixed(1)}%
                                              </span>
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <span
                                              className={`text-lg sm:text-xl md:text-2xl font-bold ${
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
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ) : !selectedQuiz ? (
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
                                  <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-transparent break-words overflow-wrap-anywhere">
                                    {quiz.question}
                                  </CardTitle>
                                  <CardDescription className="mt-2 sm:mt-3 text-sm sm:text-base md:text-lg break-words">
                                    Por {quiz.createdByName} • {new Date(quiz.createdAt).toLocaleDateString("pt-BR")} às{" "}
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
                                className={`w-full text-sm sm:text-base md:text-lg py-4 sm:py-5 md:py-6 transition-all duration-300 ${
                                  !answered && !showHistory
                                    ? "bg-gradient-to-r from-chart-1 via-chart-4 to-chart-5 hover:opacity-90 text-white shadow-lg hover:shadow-xl hover:scale-105"
                                    : ""
                                }`}
                                disabled={answered || showHistory}
                              >
                                <Zap className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mr-2 flex-shrink-0" />
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
                      <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-chart-1/10 rounded-full blur-3xl -z-10" />
                      <div className="absolute bottom-0 left-0 w-36 h-36 sm:w-48 sm:h-48 bg-chart-5/10 rounded-full blur-3xl -z-10" />

                      <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4 flex-wrap">
                        <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-chart-1 to-chart-4 shadow-lg animate-pulse flex-shrink-0">
                          <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                        </div>
                        <Badge className="bg-gradient-to-r from-chart-1 to-chart-4 text-white border-0 px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base flex-shrink-0">
                          <Trophy className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                          Quiz Ativo
                        </Badge>
                      </div>
                      <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-chart-1 via-chart-4 to-chart-5 bg-clip-text text-transparent break-words overflow-wrap-anywhere">
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
                            className={`flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 md:p-5 rounded-xl border-2 transition-all duration-300 transform animate-in slide-in-from-left ${
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
                              className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0"
                            />
                            <Label
                              htmlFor={option.id}
                              className={`flex-1 min-w-0 cursor-pointer text-sm sm:text-base md:text-lg transition-all duration-300 break-words overflow-wrap-anywhere ${
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
                              <span className="inline">{option.text}</span>
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

                      {showResult && (
                        <div
                          className={`p-8 sm:p-10 md:p-12 rounded-xl border-2 transition-all duration-500 relative overflow-hidden ${
                            isCorrect
                              ? "bg-green-500/10 border-green-500 dark:border-green-600 shadow-2xl shadow-green-500/30 animate-in fade-in slide-in-from-bottom-8 zoom-in-95"
                              : "bg-red-500/10 border-red-500 dark:border-red-600 shadow-xl shadow-red-500/20 animate-in fade-in slide-in-from-bottom-4"
                          }`}
                        >
                          {isCorrect && (
                            <>
                              <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-yellow-400/20 dark:bg-yellow-600/10 rounded-full blur-2xl animate-pulse" />
                              <div
                                className="absolute bottom-0 left-0 w-40 h-40 sm:w-48 sm:h-48 bg-green-400/20 dark:bg-green-600/10 rounded-full blur-2xl animate-pulse"
                                style={{ animationDelay: "500ms" }}
                              />
                            </>
                          )}

                          {isCorrect ? (
                            <div className="flex items-center gap-6 relative z-10">
                              <div className="relative">
                                <Trophy className="h-16 w-16 sm:h-20 sm:w-20 text-yellow-500 dark:text-yellow-400 animate-bounce" />
                                <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-400 dark:text-yellow-300 absolute -top-2 -right-2 animate-spin" />
                                <Star className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 dark:text-yellow-400 absolute -bottom-1 -left-1 animate-pulse" />
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-3xl sm:text-4xl md:text-5xl text-green-600 dark:text-green-400 mb-2 sm:mb-3">
                                  🎉 Parabéns! Resposta Correta!
                                </p>
                                <p className="text-lg sm:text-xl md:text-2xl text-green-700 dark:text-green-500">
                                  Excelente trabalho! Você demonstrou conhecimento e acertou a questão.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-6 relative z-10">
                              <XCircle className="h-16 w-16 sm:h-20 sm:w-20 text-red-600 dark:text-red-400 animate-pulse" />
                              <div className="flex-1">
                                <p className="font-semibold text-3xl sm:text-4xl md:text-5xl text-red-700 dark:text-red-400 mb-2 sm:mb-3">
                                  Resposta incorreta
                                </p>
                                <p className="text-lg sm:text-xl md:text-2xl text-red-600 dark:text-red-500">
                                  Não foi desta vez, tente novamente em um próximo Quiz.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <Separator className="my-4 sm:my-6" />

                      <div className="flex gap-2 sm:gap-4">
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
                            className="flex-1 text-sm sm:text-base md:text-lg py-4 sm:py-5 md:py-6 bg-gradient-to-r from-chart-1 via-chart-4 to-chart-5 hover:opacity-90 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
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
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={!!expandedMessage} onOpenChange={(open) => !open && setExpandedMessage(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] max-h-[90vh] flex flex-col p-4 sm:p-6 md:p-8 bg-gradient-to-br from-card via-card to-muted/30 border-2 border-primary/30">
          <DialogHeader className="flex-shrink-0 pb-4 sm:pb-6 relative">
            <div className="absolute top-0 right-0 w-36 h-36 sm:w-48 sm:h-48 bg-primary/10 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-accent/10 rounded-full blur-2xl -z-10" />

            <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg flex-shrink-0">
                <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <Badge className="bg-gradient-to-r from-primary to-accent text-white border-0 px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base flex-shrink-0">
                <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Visualização Ampliada
              </Badge>
            </div>

            <DialogTitle className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent break-words overflow-wrap-anywhere leading-tight">
              {expandedMessage?.title}
            </DialogTitle>

            <CardDescription className="text-sm sm:text-base md:text-lg mt-3 sm:mt-4 break-words flex items-center gap-2 flex-wrap">
              {expandedMessage && (
                <>
                  <span className="font-semibold text-foreground">Por {expandedMessage.createdByName}</span>
                  <span className="text-muted-foreground">•</span>
                  <span>{new Date(expandedMessage.createdAt).toLocaleDateString("pt-BR")}</span>
                  <span className="text-muted-foreground">às</span>
                  <span>
                    {new Date(expandedMessage.createdAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </>
              )}
            </CardDescription>
          </DialogHeader>

          <Separator className="my-3 sm:my-4" />

          <ScrollArea className="flex-1 min-h-0">
            <div className="bg-muted/30 rounded-xl p-4 sm:p-6 md:p-8 border border-border/50">
              <div className="text-base sm:text-lg md:text-xl whitespace-pre-wrap leading-relaxed break-words overflow-wrap-anywhere text-foreground">
                {expandedMessage?.content}
              </div>
            </div>
          </ScrollArea>

          <div className="flex gap-2 sm:gap-4 pt-4 sm:pt-6 flex-shrink-0">
            {expandedMessage && !hasSeenMessage(expandedMessage) && !showHistory && (
              <Button
                size="lg"
                onClick={() => {
                  handleMarkAsSeen(expandedMessage.id)
                  setExpandedMessage(null)
                }}
                className="flex-1 text-sm sm:text-base md:text-lg py-4 sm:py-5 md:py-6 bg-gradient-to-r from-primary via-accent to-primary hover:opacity-90 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                Marcar como Visto
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              onClick={() => setExpandedMessage(null)}
              className={`text-sm sm:text-base md:text-lg py-4 sm:py-5 md:py-6 hover:scale-105 transition-transform ${expandedMessage && !hasSeenMessage(expandedMessage) && !showHistory ? "flex-1" : "w-full"}`}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
