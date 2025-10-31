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

  const rankings = getMonthlyQuizRanking()
  const currentMonth = getCurrentMonthName()
  const userRanking = user ? rankings.find((r) => r.operatorId === user.id) : null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[calc(100vw-4.5rem)] sm:!max-w-[calc(100vw-4.5rem)] md:!max-w-[calc(100vw-4.5rem)] lg:!max-w-[calc(100vw-4.5rem)] !h-[calc(100vh-7.5rem)] !top-[4.5rem] !translate-y-0 flex flex-col p-6">
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Recados e Quiz
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-4 border-b pb-3 flex-shrink-0">
            <Button
              variant={activeTab === "messages" ? "default" : "ghost"}
              onClick={() => {
                setActiveTab("messages")
                setShowHistory(false)
                setShowRanking(false)
              }}
              className={`relative text-lg px-8 py-6 transition-all duration-300 ${
                activeTab === "messages"
                  ? "bg-gradient-to-r from-chart-2 via-chart-3 to-chart-2 hover:opacity-90 text-white shadow-lg shadow-chart-2/50 scale-105"
                  : "hover:scale-105"
              }`}
            >
              <MessageSquare className={`h-6 w-6 mr-2 ${activeTab === "messages" ? "animate-pulse" : ""}`} />
              Recados
              {getUnseenCount() > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 h-7 w-7 p-0 flex items-center justify-center text-sm font-bold animate-pulse"
                >
                  {getUnseenCount()}
                </Badge>
              )}
              {activeTab === "messages" && <Sparkles className="h-5 w-5 ml-2 animate-spin" />}
            </Button>
            <Button
              variant={activeTab === "quiz" ? "default" : "ghost"}
              onClick={() => {
                setActiveTab("quiz")
                setShowHistory(false)
                setShowRanking(false)
              }}
              className={`text-lg px-8 py-6 transition-all duration-300 ${
                activeTab === "quiz"
                  ? "bg-gradient-to-r from-chart-1 via-chart-4 to-chart-5 hover:opacity-90 text-white shadow-lg shadow-chart-1/50 scale-105"
                  : "hover:scale-105"
              }`}
            >
              <Brain className={`h-6 w-6 mr-2 ${activeTab === "quiz" ? "animate-pulse" : ""}`} />
              Quiz
              <Sparkles className={`h-5 w-5 ml-2 ${activeTab === "quiz" ? "animate-spin" : "opacity-50"}`} />
            </Button>
            {activeTab === "quiz" && (
              <Button
                variant={showRanking ? "default" : "outline"}
                onClick={() => {
                  setShowRanking(!showRanking)
                  setShowHistory(false)
                }}
                className={`text-lg px-8 py-6 transition-all duration-300 ${
                  showRanking
                    ? "bg-gradient-to-r from-chart-4 via-chart-1 to-chart-5 text-white shadow-lg scale-105"
                    : "hover:scale-105"
                }`}
              >
                <Trophy className={`h-6 w-6 mr-2 ${showRanking ? "animate-bounce" : ""}`} />
                Ranking
              </Button>
            )}
            <Button
              variant={showHistory ? "default" : "outline"}
              onClick={() => {
                setShowHistory(!showHistory)
                setShowRanking(false)
              }}
              className={`ml-auto text-lg px-8 py-6 ${showHistory ? "shadow-lg" : ""}`}
            >
              <History className="h-6 w-6 mr-2" />
              Histórico
            </Button>
          </div>

          <ScrollArea className="flex-1 min-h-0 pr-6">
            {activeTab === "messages" && (
              <div className="space-y-6 py-2">
                {displayMessages.length === 0 ? (
                  <div className="text-center py-32">
                    <MessageSquare className="h-24 w-24 text-muted-foreground mx-auto mb-6 opacity-50" />
                    <p className="text-muted-foreground text-2xl">
                      {showHistory ? "Nenhum recado no histórico." : "Nenhum recado disponível no momento."}
                    </p>
                  </div>
                ) : (
                  displayMessages.map((message, index) => {
                    const seen = hasSeenMessage(message)

                    return (
                      <Card
                        key={message.id}
                        className={`transition-all duration-300 transform hover:scale-[1.01] ${
                          seen
                            ? "opacity-60 bg-muted"
                            : "bg-gradient-to-br from-card to-muted/30 hover:shadow-2xl hover:shadow-chart-2/20 border-2 border-transparent hover:border-chart-2/50"
                        } animate-in fade-in slide-in-from-bottom-4`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <CardHeader className="pb-4 relative overflow-hidden">
                          {!seen && (
                            <>
                              <div className="absolute top-0 right-0 w-32 h-32 bg-chart-2/20 rounded-full blur-3xl -z-10" />
                              <div className="absolute bottom-0 left-0 w-24 h-24 bg-chart-3/20 rounded-full blur-2xl -z-10" />
                            </>
                          )}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-chart-2 to-chart-3 shadow-lg">
                                  <Mail className="h-6 w-6 text-white" />
                                </div>
                                {!seen && (
                                  <Badge className="bg-gradient-to-r from-chart-2 to-chart-3 text-white border-0 animate-pulse">
                                    <Bell className="h-4 w-4 mr-1" />
                                    Novo
                                  </Badge>
                                )}
                              </div>
                              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-chart-2 to-chart-3 bg-clip-text text-transparent">
                                {message.title}
                              </CardTitle>
                              <CardDescription className="mt-3 text-lg">
                                Por {message.createdByName} • {new Date(message.createdAt).toLocaleDateString("pt-BR")}{" "}
                                às{" "}
                                {new Date(message.createdAt).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="lg"
                                onClick={() => setExpandedMessage(message)}
                                className="px-4 hover:scale-105 transition-transform"
                              >
                                <Maximize2 className="h-5 w-5 mr-2" />
                                Ampliar
                              </Button>
                              {seen && (
                                <Badge variant="secondary" className="px-4 py-2 text-base">
                                  <Eye className="h-5 w-5 mr-2" />
                                  Visto
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-lg whitespace-pre-wrap mb-6 leading-relaxed">{message.content}</p>
                          {!seen && !showHistory && (
                            <Button
                              size="lg"
                              onClick={() => handleMarkAsSeen(message.id)}
                              className="w-full text-lg py-6 bg-gradient-to-r from-chart-2 via-chart-3 to-chart-2 hover:opacity-90 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                            >
                              <CheckCircle2 className="h-6 w-6 mr-2" />
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
              <div className="space-y-6 py-2">
                {showRanking ? (
                  <div className="space-y-8">
                    <Card className="bg-gradient-to-br from-card to-muted/30 border-2 border-chart-1/50 shadow-2xl">
                      <CardHeader className="relative overflow-hidden pb-6">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-chart-1/10 rounded-full blur-3xl -z-10" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-chart-4/10 rounded-full blur-3xl -z-10" />
                        <div className="flex items-center gap-4 mb-2">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-chart-1 to-chart-4 shadow-lg">
                            <Trophy className="h-8 w-8 text-white animate-pulse" />
                          </div>
                          <div>
                            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-chart-1 via-chart-4 to-chart-5 bg-clip-text text-transparent">
                              Ranking Mensal - {currentMonth}
                            </CardTitle>
                            <CardDescription className="text-lg mt-1">
                              Classificação geral dos operadores
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-8">
                        {rankings.length === 0 ? (
                          <div className="text-center py-16">
                            <Trophy className="h-20 w-20 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <p className="text-muted-foreground text-xl">Nenhum quiz respondido este mês ainda.</p>
                          </div>
                        ) : (
                          <>
                            {rankings.length > 0 && (
                              <div className="space-y-6">
                                <div className="text-center">
                                  <h3 className="text-2xl font-bold bg-gradient-to-r from-chart-1 via-chart-4 to-chart-5 bg-clip-text text-transparent mb-2">
                                    🏆 Top 3 do Mês
                                  </h3>
                                  <p className="text-muted-foreground">Os melhores operadores do ranking</p>
                                </div>

                                {/* Podium Container */}
                                <div className="flex items-end justify-center gap-4 px-8 py-8">
                                  {/* 2nd Place - Left */}
                                  {rankings[1] && (
                                    <div className="flex flex-col items-center flex-1 animate-in fade-in slide-in-from-left duration-700">
                                      <div className="mb-4 text-center">
                                        <div
                                          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 shadow-xl mb-3 animate-bounce"
                                          style={{ animationDelay: "200ms" }}
                                        >
                                          <Medal className="h-10 w-10 text-white" />
                                        </div>
                                        <p className="font-bold text-lg mb-1">{rankings[1].operatorName}</p>
                                        <p className="text-3xl font-bold bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-transparent">
                                          {rankings[1].score}
                                        </p>
                                        <p className="text-sm text-muted-foreground">pontos</p>
                                      </div>
                                      <div
                                        className="w-full bg-gradient-to-br from-gray-300 to-gray-500 rounded-t-2xl shadow-2xl border-4 border-gray-400 dark:border-gray-600 relative overflow-hidden"
                                        style={{ height: "180px" }}
                                      >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                          <p className="text-6xl font-black text-white/90">2</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* 1st Place - Center (Highest) */}
                                  {rankings[0] && (
                                    <div className="flex flex-col items-center flex-1 animate-in fade-in zoom-in-95 duration-700">
                                      <div className="mb-4 text-center">
                                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-2xl mb-3 animate-bounce">
                                          <Crown className="h-12 w-12 text-white" />
                                        </div>
                                        <p className="font-bold text-xl mb-1">{rankings[0].operatorName}</p>
                                        <p className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                                          {rankings[0].score}
                                        </p>
                                        <p className="text-sm text-muted-foreground">pontos</p>
                                      </div>
                                      <div
                                        className="w-full bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-t-2xl shadow-2xl border-4 border-yellow-500 dark:border-yellow-700 relative overflow-hidden"
                                        style={{ height: "240px" }}
                                      >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse" />
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                          <p className="text-7xl font-black text-white/90">1</p>
                                        </div>
                                        <Sparkles className="absolute top-4 right-4 h-8 w-8 text-white/80 animate-spin" />
                                        <Star className="absolute bottom-4 left-4 h-6 w-6 text-white/80 animate-pulse" />
                                      </div>
                                    </div>
                                  )}

                                  {/* 3rd Place - Right */}
                                  {rankings[2] && (
                                    <div
                                      className="flex flex-col items-center flex-1 animate-in fade-in slide-in-from-right duration-700"
                                      style={{ animationDelay: "400ms" }}
                                    >
                                      <div className="mb-4 text-center">
                                        <div
                                          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-xl mb-3 animate-bounce"
                                          style={{ animationDelay: "400ms" }}
                                        >
                                          <Medal className="h-10 w-10 text-white" />
                                        </div>
                                        <p className="font-bold text-lg mb-1">{rankings[2].operatorName}</p>
                                        <p className="text-3xl font-bold bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-transparent">
                                          {rankings[2].score}
                                        </p>
                                        <p className="text-sm text-muted-foreground">pontos</p>
                                      </div>
                                      <div
                                        className="w-full bg-gradient-to-br from-orange-400 to-orange-600 rounded-t-2xl shadow-2xl border-4 border-orange-500 dark:border-orange-700 relative overflow-hidden"
                                        style={{ height: "140px" }}
                                      >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                          <p className="text-6xl font-black text-white/90">3</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <Separator className="my-8" />

                            <div className="space-y-4">
                              <h3 className="text-xl font-bold">Classificação Completa</h3>
                              <div className="rounded-lg border bg-card overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-muted/50">
                                      <TableHead className="w-20 text-center font-bold">Posição</TableHead>
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
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg">
                                                  <Crown className="h-5 w-5" />
                                                </div>
                                              ) : ranking.rank === 2 ? (
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg">
                                                  <Medal className="h-5 w-5" />
                                                </div>
                                              ) : ranking.rank === 3 ? (
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg">
                                                  <Medal className="h-5 w-5" />
                                                </div>
                                              ) : (
                                                <span className="text-lg font-bold">{ranking.rank}º</span>
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex items-center gap-2">
                                              <span className={isTopThree ? "font-bold text-lg" : "text-base"}>
                                                {ranking.operatorName}
                                              </span>
                                              {isCurrentUser && <Badge className="bg-chart-1 text-white">Você</Badge>}
                                              {isTopThree && <Star className="h-4 w-4 text-chart-1 fill-chart-1" />}
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                              <Brain className="h-4 w-4 text-muted-foreground" />
                                              <span className="font-semibold">{ranking.totalAttempts}</span>
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                              <span className="font-semibold">{ranking.correctAnswers}</span>
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                              <span className="font-semibold">{ranking.accuracy.toFixed(1)}%</span>
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <span
                                              className={`text-lg font-bold ${
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
                      <div className="text-center py-32">
                        <Brain className="h-24 w-24 text-muted-foreground mx-auto mb-6 opacity-50" />
                        <p className="text-muted-foreground text-2xl">
                          {showHistory ? "Nenhum quiz no histórico." : "Nenhum quiz disponível no momento."}
                        </p>
                      </div>
                    ) : (
                      displayQuizzes.map((quiz, index) => {
                        const answered = hasAnsweredQuiz(quiz.id)

                        return (
                          <Card
                            key={quiz.id}
                            className={`cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                              answered
                                ? "opacity-60 bg-muted"
                                : "bg-gradient-to-br from-card to-muted/30 hover:shadow-2xl hover:shadow-chart-1/20 border-2 border-transparent hover:border-chart-1/50"
                            } animate-in fade-in slide-in-from-bottom-4`}
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <CardHeader
                              onClick={() => !answered && !showHistory && handleSelectQuiz(quiz)}
                              className="pb-4 relative overflow-hidden"
                            >
                              {!answered && (
                                <>
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-chart-1/20 rounded-full blur-3xl -z-10" />
                                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-chart-5/20 rounded-full blur-2xl -z-10" />
                                </>
                              )}
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-chart-1 to-chart-4 shadow-lg">
                                      <Brain className="h-6 w-6 text-white" />
                                    </div>
                                    {!answered && (
                                      <Badge className="bg-gradient-to-r from-chart-5 to-chart-1 text-white border-0 animate-pulse">
                                        <Star className="h-4 w-4 mr-1" />
                                        Novo
                                      </Badge>
                                    )}
                                  </div>
                                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-transparent">
                                    {quiz.question}
                                  </CardTitle>
                                  <CardDescription className="mt-3 text-lg">
                                    Por {quiz.createdByName} • {new Date(quiz.createdAt).toLocaleDateString("pt-BR")} às{" "}
                                    {new Date(quiz.createdAt).toLocaleTimeString("pt-BR", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </CardDescription>
                                </div>
                                {answered && (
                                  <Badge variant="secondary" className="ml-2 px-4 py-2 text-base">
                                    <CheckCircle2 className="h-5 w-5 mr-2" />
                                    Respondido
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <Button
                                size="lg"
                                onClick={() => handleSelectQuiz(quiz)}
                                className={`w-full text-lg py-6 transition-all duration-300 ${
                                  !answered && !showHistory
                                    ? "bg-gradient-to-r from-chart-1 via-chart-4 to-chart-5 hover:opacity-90 text-white shadow-lg hover:shadow-xl hover:scale-105"
                                    : ""
                                }`}
                                disabled={answered || showHistory}
                              >
                                <Zap className="h-6 w-6 mr-2" />
                                {answered ? "Já Respondido" : showHistory ? "Visualizar" : "Responder Quiz"}
                                {!answered && !showHistory && <Sparkles className="h-5 w-5 ml-2 animate-pulse" />}
                              </Button>
                            </CardContent>
                          </Card>
                        )
                      })
                    )}
                  </>
                ) : (
                  <Card className="shadow-2xl border-2 border-chart-1/50 bg-gradient-to-br from-card to-muted/30 animate-in fade-in zoom-in-95 duration-500">
                    <CardHeader className="pb-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-chart-1/10 rounded-full blur-3xl -z-10" />
                      <div className="absolute bottom-0 left-0 w-48 h-48 bg-chart-5/10 rounded-full blur-3xl -z-10" />

                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-chart-1 to-chart-4 shadow-lg animate-pulse">
                          <Brain className="h-8 w-8 text-white" />
                        </div>
                        <Badge className="bg-gradient-to-r from-chart-1 to-chart-4 text-white border-0 px-4 py-2 text-base">
                          <Trophy className="h-5 w-5 mr-2" />
                          Quiz Ativo
                        </Badge>
                      </div>
                      <CardTitle className="text-3xl font-bold bg-gradient-to-r from-chart-1 via-chart-4 to-chart-5 bg-clip-text text-transparent">
                        {selectedQuiz.question}
                      </CardTitle>
                      <CardDescription className="text-lg mt-3">Selecione a resposta correta abaixo</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} disabled={showResult}>
                        {selectedQuiz.options.map((option, index) => (
                          <div
                            key={option.id}
                            className={`flex items-center space-x-4 p-5 rounded-xl border-2 transition-all duration-300 transform animate-in slide-in-from-left ${
                              !showResult ? "hover:bg-muted/50 cursor-pointer hover:scale-[1.02] hover:shadow-lg" : ""
                            } ${
                              selectedAnswer === option.id && !showResult
                                ? "border-chart-1 bg-muted/50 shadow-lg scale-[1.02]"
                                : showResult && option.id === selectedQuiz.correctAnswer
                                  ? "border-green-500 dark:border-green-600 bg-green-500/10 shadow-lg shadow-green-500/20"
                                  : showResult && option.id === selectedAnswer && !isCorrect
                                    ? "border-red-500 dark:border-red-600 bg-red-500/10 shadow-lg shadow-red-500/20"
                                    : "border-border"
                            }`}
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <RadioGroupItem value={option.id} id={option.id} className="h-6 w-6" />
                            <Label
                              htmlFor={option.id}
                              className={`flex-1 cursor-pointer text-lg transition-all duration-300 ${
                                showResult && option.id === selectedQuiz.correctAnswer
                                  ? "text-green-600 dark:text-green-400 font-semibold"
                                  : showResult && option.id === selectedAnswer && !isCorrect
                                    ? "text-red-600 dark:text-red-400"
                                    : selectedAnswer === option.id && !showResult
                                      ? "font-semibold"
                                      : ""
                              }`}
                            >
                              <span className="font-bold mr-3 text-xl bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-transparent">
                                {option.label})
                              </span>
                              {option.text}
                              {showResult && option.id === selectedQuiz.correctAnswer && (
                                <CheckCircle2 className="inline h-6 w-6 ml-3 text-green-600 dark:text-green-400 animate-in zoom-in-50 spin-in-180" />
                              )}
                              {showResult && option.id === selectedAnswer && !isCorrect && (
                                <XCircle className="inline h-6 w-6 ml-3 text-red-600 dark:text-red-400 animate-in zoom-in-50" />
                              )}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>

                      {showResult && (
                        <div
                          className={`p-8 rounded-xl border-2 transition-all duration-500 relative overflow-hidden ${
                            isCorrect
                              ? "bg-green-500/10 border-green-500 dark:border-green-600 shadow-2xl shadow-green-500/30 animate-in fade-in slide-in-from-bottom-8 zoom-in-95"
                              : "bg-red-500/10 border-red-500 dark:border-red-600 shadow-xl shadow-red-500/20 animate-in fade-in slide-in-from-bottom-4"
                          }`}
                        >
                          {isCorrect && (
                            <>
                              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/20 dark:bg-yellow-600/10 rounded-full blur-2xl animate-pulse" />
                              <div
                                className="absolute bottom-0 left-0 w-40 h-40 bg-green-400/20 dark:bg-green-600/10 rounded-full blur-2xl animate-pulse"
                                style={{ animationDelay: "500ms" }}
                              />
                            </>
                          )}

                          {isCorrect ? (
                            <div className="flex items-center gap-6 relative z-10">
                              <div className="relative">
                                <Trophy className="h-16 w-16 text-yellow-500 dark:text-yellow-400 animate-bounce" />
                                <Sparkles className="h-8 w-8 text-yellow-400 dark:text-yellow-300 absolute -top-2 -right-2 animate-spin" />
                                <Star className="h-6 w-6 text-yellow-500 dark:text-yellow-400 absolute -bottom-1 -left-1 animate-pulse" />
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-3xl text-green-600 dark:text-green-400 mb-2">
                                  🎉 Parabéns! Resposta Correta!
                                </p>
                                <p className="text-lg text-green-700 dark:text-green-500">
                                  Excelente trabalho! Você demonstrou conhecimento e acertou a questão.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-6 relative z-10">
                              <XCircle className="h-16 w-16 text-red-600 dark:text-red-400 animate-pulse" />
                              <div className="flex-1">
                                <p className="font-semibold text-3xl text-red-700 dark:text-red-400 mb-2">
                                  Resposta incorreta
                                </p>
                                <p className="text-lg text-red-600 dark:text-red-500">
                                  Continue estudando e tente novamente em um próximo quiz.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <Separator />

                      <div className="flex gap-4">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedQuiz(null)}
                          className="flex-1 text-lg py-6 hover:scale-105 transition-transform"
                        >
                          Voltar
                        </Button>
                        {!showResult && (
                          <Button
                            onClick={handleSubmitQuiz}
                            disabled={!selectedAnswer}
                            className="flex-1 text-lg py-6 bg-gradient-to-r from-chart-1 via-chart-4 to-chart-5 hover:opacity-90 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                          >
                            <Zap className="h-6 w-6 mr-2" />
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
        <DialogContent className="!max-w-[calc(100vw-4.5rem)] sm:!max-w-[calc(100vw-4.5rem)] md:!max-w-[calc(100vw-4.5rem)] lg:!max-w-[calc(100vw-4.5rem)] !max-h-[calc(100vh-7.5rem)] !top-[4.5rem] !translate-y-0 flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-4xl font-bold">{expandedMessage?.title}</DialogTitle>
            <CardDescription className="text-lg mt-3">
              {expandedMessage && (
                <>
                  Por {expandedMessage.createdByName} •{" "}
                  {new Date(expandedMessage.createdAt).toLocaleDateString("pt-BR")} às{" "}
                  {new Date(expandedMessage.createdAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </>
              )}
            </CardDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0">
            <div className="text-xl whitespace-pre-wrap leading-relaxed py-6">{expandedMessage?.content}</div>
          </ScrollArea>
          <div className="flex gap-4 pt-6 flex-shrink-0">
            {expandedMessage && !hasSeenMessage(expandedMessage) && !showHistory && (
              <Button
                size="lg"
                onClick={() => {
                  handleMarkAsSeen(expandedMessage.id)
                  setExpandedMessage(null)
                }}
                className="flex-1 text-lg py-6"
              >
                <CheckCircle2 className="h-6 w-6 mr-2" />
                Marcar como Visto
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              onClick={() => setExpandedMessage(null)}
              className="flex-1 text-lg py-6"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
