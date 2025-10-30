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
} from "@/lib/store"
import type { Message, Quiz } from "@/lib/types"
import { MessageSquare, Brain, CheckCircle2, XCircle, Eye, History, Sparkles, Trophy, Maximize2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface OperatorMessagesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OperatorMessagesModal({ open, onOpenChange }: OperatorMessagesModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[90vw] h-[calc(100vh-8rem)] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              Recados e Quiz
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-3 border-b pb-2 flex-shrink-0">
            <Button
              variant={activeTab === "messages" ? "default" : "ghost"}
              onClick={() => {
                setActiveTab("messages")
                setShowHistory(false)
              }}
              className={`relative text-base px-6 py-5 ${activeTab === "messages" ? "bg-orange-500 hover:bg-orange-600 text-white shadow-lg" : ""}`}
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Recados
              {getUnseenCount() > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 h-6 w-6 p-0 flex items-center justify-center text-xs font-bold"
                >
                  {getUnseenCount()}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeTab === "quiz" ? "default" : "ghost"}
              onClick={() => {
                setActiveTab("quiz")
                setShowHistory(false)
              }}
              className={`text-base px-6 py-5 ${activeTab === "quiz" ? "bg-orange-500 hover:bg-orange-600 text-white shadow-lg" : ""}`}
            >
              <Brain className="h-5 w-5 mr-2" />
              Quiz
            </Button>
            <Button
              variant={showHistory ? "default" : "outline"}
              onClick={() => setShowHistory(!showHistory)}
              className={`ml-auto text-base px-6 py-5 ${showHistory ? "shadow-lg" : ""}`}
            >
              <History className="h-5 w-5 mr-2" />
              Histórico
            </Button>
          </div>

          <ScrollArea className="flex-1 min-h-0 pr-4">
            {activeTab === "messages" && (
              <div className="space-y-4">
                {displayMessages.length === 0 ? (
                  <div className="text-center py-16">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground text-lg">
                      {showHistory ? "Nenhum recado no histórico." : "Nenhum recado disponível no momento."}
                    </p>
                  </div>
                ) : (
                  displayMessages.map((message) => (
                    <Card
                      key={message.id}
                      className={`transition-all duration-200 ${
                        hasSeenMessage(message) ? "opacity-60" : "border-orange-500/50 shadow-md hover:shadow-lg"
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl font-bold">{message.title}</CardTitle>
                            <CardDescription className="mt-2 text-base">
                              Por {message.createdByName} • {new Date(message.createdAt).toLocaleDateString("pt-BR")} às{" "}
                              {new Date(message.createdAt).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setExpandedMessage(message)}
                              className="px-3"
                            >
                              <Maximize2 className="h-4 w-4 mr-1" />
                              Ampliar
                            </Button>
                            {hasSeenMessage(message) && (
                              <Badge variant="secondary" className="px-3 py-1">
                                <Eye className="h-4 w-4 mr-1" />
                                Visto
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-base whitespace-pre-wrap mb-5 leading-relaxed">{message.content}</p>
                        {!hasSeenMessage(message) && !showHistory && (
                          <Button size="lg" onClick={() => handleMarkAsSeen(message.id)} className="w-full text-base">
                            <CheckCircle2 className="h-5 w-5 mr-2" />
                            Marcar como Visto
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeTab === "quiz" && (
              <div className="space-y-4">
                {!selectedQuiz ? (
                  <>
                    {displayQuizzes.length === 0 ? (
                      <div className="text-center py-16">
                        <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground text-lg">
                          {showHistory ? "Nenhum quiz no histórico." : "Nenhum quiz disponível no momento."}
                        </p>
                      </div>
                    ) : (
                      displayQuizzes.map((quiz) => {
                        const answered = hasAnsweredQuiz(quiz.id)

                        return (
                          <Card
                            key={quiz.id}
                            className={`cursor-pointer transition-all duration-200 ${
                              answered ? "opacity-60" : "hover:border-orange-500/50 hover:shadow-lg"
                            }`}
                          >
                            <CardHeader
                              onClick={() => !answered && !showHistory && handleSelectQuiz(quiz)}
                              className="pb-3"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-xl font-bold">{quiz.question}</CardTitle>
                                  <CardDescription className="mt-2 text-base">
                                    Por {quiz.createdByName} • {new Date(quiz.createdAt).toLocaleDateString("pt-BR")} às{" "}
                                    {new Date(quiz.createdAt).toLocaleTimeString("pt-BR", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </CardDescription>
                                </div>
                                {answered && (
                                  <Badge variant="secondary" className="ml-2 px-3 py-1">
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Respondido
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <Button
                                size="lg"
                                onClick={() => handleSelectQuiz(quiz)}
                                className="w-full text-base"
                                disabled={answered || showHistory}
                              >
                                {answered ? "Já Respondido" : showHistory ? "Visualizar" : "Responder Quiz"}
                              </Button>
                            </CardContent>
                          </Card>
                        )
                      })
                    )}
                  </>
                ) : (
                  <Card className="shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-2xl font-bold">{selectedQuiz.question}</CardTitle>
                      <CardDescription className="text-base mt-2">Selecione a resposta correta abaixo</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} disabled={showResult}>
                        {selectedQuiz.options.map((option) => (
                          <div
                            key={option.id}
                            className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                              !showResult ? "hover:bg-accent cursor-pointer" : ""
                            } ${
                              selectedAnswer === option.id && !showResult
                                ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                                : "border-transparent"
                            }`}
                          >
                            <RadioGroupItem value={option.id} id={option.id} className="h-5 w-5" />
                            <Label
                              htmlFor={option.id}
                              className={`flex-1 cursor-pointer text-base ${
                                showResult && option.id === selectedQuiz.correctAnswer
                                  ? "text-green-600 font-semibold"
                                  : showResult && option.id === selectedAnswer && !isCorrect
                                    ? "text-red-600"
                                    : ""
                              }`}
                            >
                              <span className="font-bold mr-2 text-lg">{option.label})</span>
                              {option.text}
                              {showResult && option.id === selectedQuiz.correctAnswer && (
                                <CheckCircle2 className="inline h-5 w-5 ml-2 text-green-600" />
                              )}
                              {showResult && option.id === selectedAnswer && !isCorrect && (
                                <XCircle className="inline h-5 w-5 ml-2 text-red-600" />
                              )}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>

                      {showResult && (
                        <div
                          className={`p-6 rounded-lg border-2 transition-all duration-500 ${
                            isCorrect
                              ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-500 animate-in fade-in slide-in-from-bottom-4"
                              : "bg-red-50 dark:bg-red-950/20 border-red-500 animate-in fade-in"
                          }`}
                        >
                          {isCorrect ? (
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <Trophy className="h-10 w-10 text-green-600 dark:text-green-400 animate-bounce" />
                                <Sparkles className="h-5 w-5 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
                              </div>
                              <div>
                                <p className="font-bold text-xl text-green-700 dark:text-green-400">
                                  Parabéns! Resposta Correta!
                                </p>
                                <p className="text-base text-green-600 dark:text-green-500 mt-2">
                                  Excelente trabalho! Você demonstrou conhecimento e acertou a questão.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-4">
                              <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                              <div>
                                <p className="font-semibold text-xl text-red-700 dark:text-red-400">
                                  Resposta incorreta.
                                </p>
                                <p className="text-base text-red-600 dark:text-red-500 mt-2">
                                  Continue estudando e tente novamente em um próximo quiz.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <Separator />

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedQuiz(null)}
                          className="flex-1 text-base py-5"
                        >
                          Voltar
                        </Button>
                        {!showResult && (
                          <Button
                            onClick={handleSubmitQuiz}
                            disabled={!selectedAnswer}
                            className="flex-1 text-base py-5"
                          >
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
        <DialogContent className="max-w-[85vw] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-3xl font-bold">{expandedMessage?.title}</DialogTitle>
            <CardDescription className="text-base mt-2">
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
          <ScrollArea className="flex-1 min-h-0 pr-4">
            <div className="text-lg whitespace-pre-wrap leading-relaxed py-4">{expandedMessage?.content}</div>
          </ScrollArea>
          <div className="flex gap-3 pt-4 flex-shrink-0">
            {expandedMessage && !hasSeenMessage(expandedMessage) && !showHistory && (
              <Button
                size="lg"
                onClick={() => {
                  handleMarkAsSeen(expandedMessage.id)
                  setExpandedMessage(null)
                }}
                className="flex-1 text-base"
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Marcar como Visto
              </Button>
            )}
            <Button variant="outline" size="lg" onClick={() => setExpandedMessage(null)} className="flex-1 text-base">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
