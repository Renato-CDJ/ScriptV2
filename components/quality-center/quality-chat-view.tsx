"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAllUsers } from "@/hooks/use-supabase-realtime"
import { useQualityChatMessages } from "@/hooks/use-supabase-chat-realtime"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Send,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Search,
  ArrowLeft,
  Clock,
} from "lucide-react"

interface QualityChatMessage {
  id: string
  senderId: string
  senderName: string
  content: string
  createdAt: Date
  isFromOperator: boolean
  recipientId?: string
  recipientName?: string
}

export function QualityChatView() {
  const { user } = useAuth()
  const { users: allUsers } = useAllUsers()
  const { messages: realtimeMessages, loading: messagesLoading } = useQualityChatMessages()
  const [selectedMonitor, setSelectedMonitor] = useState<any | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Filter only quality monitors (adminType === "qualidade" or username starts with "Monitoria")
  const monitors = useMemo(() => {
    return allUsers.filter((u) =>
      u.role === "admin" &&
      (u.adminType === "qualidade" || u.username?.toLowerCase().startsWith("monitoria") || u.fullName?.toLowerCase().includes("qualidade"))
    )
  }, [allUsers])

  // Filter messages for current conversation
  const chatMessages = useMemo(() => {
    if (!selectedMonitor || !user) return []
    return realtimeMessages.filter(
      (m) =>
        (m.senderId === user.id && m.recipientId === selectedMonitor.id) ||
        (m.senderId === selectedMonitor.id && m.recipientId === user.id)
    ).map(m => ({
      ...m,
      isFromOperator: m.senderId === user.id
    }))
  }, [realtimeMessages, selectedMonitor, user])

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedMonitor || !user) return
    setIsLoading(true)
    
    try {
      const supabase = createClient()
      const { error } = await supabase.from("quality_chat_messages").insert({
        sender_id: user.id,
        sender_name: user.fullName || user.username || "Operador",
        recipient_id: selectedMonitor.id,
        recipient_name: selectedMonitor.fullName || selectedMonitor.username || "Monitor",
        content: newMessage.trim(),
        is_read: false,
      })

      if (error) {
        console.error("[v0] Error sending message:", error)
        toast({
          title: "Erro",
          description: "Nao foi possivel enviar a mensagem",
          variant: "destructive",
        })
      } else {
        setNewMessage("")
      }
    } catch (error) {
      console.error("[v0] Error:", error)
      toast({
        title: "Erro",
        description: "Falha ao enviar mensagem",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U"
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-orange-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-cyan-500",
    ]
    const index = (name?.charCodeAt(0) || 0) % colors.length
    return colors[index]
  }

  const formatTimeAgo = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })
  }

  // If no monitor selected, show monitor list
  if (!selectedMonitor) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <MessageSquare className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Chat com a Qualidade</h2>
              <p className="text-sm text-muted-foreground">Converse com a equipe de monitoria</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar monitor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50"
            />
          </div>
        </div>

        {/* Monitor List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {monitors.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Nenhum monitor disponivel</p>
                <p className="text-sm">Aguarde um monitor ficar online</p>
              </div>
            ) : (
              monitors
                .filter(m => 
                  !searchQuery || 
                  m.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  m.username?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((monitor) => {
                  const unreadCount = realtimeMessages.filter(
                    m => m.senderId === monitor.id && m.recipientId === user?.id && !m.isRead
                  ).length

                  return (
                    <button
                      key={monitor.id}
                      onClick={() => setSelectedMonitor(monitor)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={cn(getAvatarColor(monitor.fullName || ""), "text-white text-sm font-medium")}>
                            {getInitials(monitor.fullName || monitor.username)}
                          </AvatarFallback>
                        </Avatar>
                        {monitor.isOnline && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{monitor.fullName || monitor.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {monitor.isOnline ? "Online" : "Offline"}
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <Badge className="bg-orange-500 text-white">{unreadCount}</Badge>
                      )}
                    </button>
                  )
                })
            )}
          </div>
        </ScrollArea>
      </div>
    )
  }

  // Chat view with selected monitor
  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-border/50 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedMonitor(null)}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarFallback className={cn(getAvatarColor(selectedMonitor.fullName || ""), "text-white text-sm font-medium")}>
              {getInitials(selectedMonitor.fullName || selectedMonitor.username)}
            </AvatarFallback>
          </Avatar>
          {selectedMonitor.isOnline && (
            <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{selectedMonitor.fullName || selectedMonitor.username}</p>
          <p className="text-xs text-muted-foreground">
            {selectedMonitor.isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium">Nenhuma mensagem ainda</p>
            <p className="text-sm">Inicie uma conversa com o monitor</p>
          </div>
        ) : (
          <div className="space-y-4">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3",
                  msg.isFromOperator ? "flex-row-reverse" : "flex-row"
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className={cn(
                    getAvatarColor(msg.senderName),
                    "text-white text-xs font-medium"
                  )}>
                    {getInitials(msg.senderName)}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "max-w-[70%] rounded-lg p-3",
                  msg.isFromOperator
                    ? "bg-orange-500 text-white"
                    : "bg-muted"
                )}>
                  <p className="text-sm">{msg.content}</p>
                  <p className={cn(
                    "text-xs mt-1",
                    msg.isFromOperator ? "text-white/70" : "text-muted-foreground"
                  )}>
                    {formatTimeAgo(msg.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-border/50">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
