"use client"

import type React from "react"
import { useState, useEffect, useRef, memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Send, Trash2, MessageCircle, User, Search, ImageIcon, Smile, Reply, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  sendChatMessage,
  getChatSettings,
  updateChatSettings,
  deleteChatMessage,
  getAllUsers,
  getAllChatMessages,
} from "@/lib/store"
import type { ChatMessage, User as UserType } from "@/lib/types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const EMOJI_LIST = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😅",
  "😂",
  "🤣",
  "😊",
  "😇",
  "🙂",
  "😉",
  "😌",
  "😍",
  "🥰",
  "😘",
  "😗",
  "😙",
  "😚",
  "😋",
  "😛",
  "😝",
  "😜",
  "🤪",
  "🤨",
  "🧐",
  "🤓",
  "😎",
  "🤩",
  "🥳",
  "😏",
  "👍",
  "👎",
  "👌",
  "✌️",
  "🤞",
  "🤝",
  "👏",
  "🙌",
  "🙏",
  "💪",
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "🤍",
  "💯",
  "✨",
]

export const ChatTab = memo(function ChatTab() {
  const { user } = useAuth()
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([])
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [chatEnabled, setChatEnabled] = useState(true)
  const [operators, setOperators] = useState<UserType[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)
  const [attachmentName, setAttachmentName] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredMessages = selectedOperatorId
    ? allMessages.filter((msg) => msg.senderId === selectedOperatorId || msg.recipientId === selectedOperatorId)
    : []

  const filteredOperators = operators.filter(
    (op) =>
      op.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  useEffect(() => {
    if (user) {
      loadAllMessages()
      loadSettings()
      loadOperators()
    }
  }, [user])

  useEffect(() => {
    const handleStoreUpdate = () => {
      if (user) {
        loadAllMessages()
        loadSettings()
        loadOperators()
      }
    }

    window.addEventListener("store-updated", handleStoreUpdate)
    return () => window.removeEventListener("store-updated", handleStoreUpdate)
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [filteredMessages])

  const loadAllMessages = async () => {
    const msgs = await getAllChatMessages()
    setAllMessages(msgs)
  }

  const loadSettings = async () => {
    const settings = await getChatSettings()
    setChatEnabled(settings.isEnabled)
  }

  const loadOperators = async () => {
    const allUsers = await getAllUsers()
    const ops = allUsers.filter((u) => u.role === "operator")
    setOperators(ops)

    if (ops.length > 0 && !selectedOperatorId) {
      setSelectedOperatorId(ops[0].id)
    }
  }

  const handleSend = async () => {
    if (!user || !newMessage.trim() || !selectedOperatorId) return

    const replyToData = replyingTo
      ? {
          messageId: replyingTo.id,
          content: replyingTo.content.substring(0, 100),
          senderName: replyingTo.senderName,
        }
      : undefined

    await sendChatMessage(
      user.id,
      user.fullName,
      "admin",
      newMessage.trim(),
      selectedOperatorId,
      attachmentPreview && attachmentName
        ? {
            type: "image",
            url: attachmentPreview,
            name: attachmentName,
          }
        : undefined,
      replyToData,
    )
    setNewMessage("")
    setAttachmentPreview(null)
    setAttachmentName(null)
    setReplyingTo(null)
    await loadAllMessages()
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleToggleChat = async (enabled: boolean) => {
    if (!user) return

    await updateChatSettings({
      isEnabled: enabled,
      updatedAt: new Date(),
      updatedBy: user.id,
    })
    setChatEnabled(enabled)
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm("Tem certeza que deseja excluir esta mensagem?")) {
      await deleteChatMessage(messageId)
      await loadAllMessages()
    }
  }

  const getUnreadCount = (operatorId: string) => {
    return allMessages.filter((m) => !m.isRead && m.senderId === operatorId && m.recipientId !== operatorId).length
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione apenas imagens.")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setAttachmentPreview(event.target?.result as string)
      setAttachmentName(file.name)
    }
    reader.readAsDataURL(file)
  }

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onload = (event) => {
            setAttachmentPreview(event.target?.result as string)
            setAttachmentName(`pasted-image-${Date.now()}.png`)
          }
          reader.readAsDataURL(file)
          e.preventDefault()
        }
      }
    }
  }

  const handleReply = (message: ChatMessage) => {
    setReplyingTo(message)
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
  }

  if (!user) return null

  const selectedOperator = operators.find((op) => op.id === selectedOperatorId)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Chat com Operadores
              </CardTitle>
              <CardDescription>Comunicação em tempo real com os operadores</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={chatEnabled} onCheckedChange={handleToggleChat} id="chat-toggle" />
              <Label htmlFor="chat-toggle" className="cursor-pointer">
                {chatEnabled ? "Chat Ativado" : "Chat Desativado"}
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg h-[600px] flex">
            <div className="w-64 border-r bg-muted/30">
              <div className="p-3 border-b bg-muted/50 space-y-2">
                <h3 className="font-semibold text-sm">Operadores</h3>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Pesquisar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
              </div>
              <ScrollArea className="h-[calc(600px-97px)]">
                <div className="p-2 space-y-1">
                  {filteredOperators.map((op) => {
                    const unreadCount = getUnreadCount(op.id)
                    const isSelected = op.id === selectedOperatorId
                    return (
                      <button
                        key={op.id}
                        onClick={() => setSelectedOperatorId(op.id)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          isSelected ? "bg-orange-500 text-white" : "hover:bg-accent"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{op.fullName}</p>
                            <p className={`text-xs truncate ${isSelected ? "text-white/70" : "text-muted-foreground"}`}>
                              @{op.username}
                            </p>
                          </div>
                          {unreadCount > 0 && (
                            <Badge
                              variant="destructive"
                              className="h-5 w-5 p-0 flex items-center justify-center text-xs"
                            >
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                      </button>
                    )
                  })}
                  {filteredOperators.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-8">
                      {searchQuery ? "Nenhum operador encontrado" : "Nenhum operador cadastrado"}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="flex-1 flex flex-col">
              {selectedOperator ? (
                <>
                  <div className="p-3 border-b bg-muted/50">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <div>
                        <p className="font-semibold text-sm">{selectedOperator.fullName}</p>
                        <p className="text-xs text-muted-foreground">@{selectedOperator.username}</p>
                      </div>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 p-4 [&_[data-radix-scroll-area-viewport]]:max-h-none">
                    <div className="space-y-3 pr-4">
                      {filteredMessages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <p>Nenhuma mensagem ainda</p>
                        </div>
                      ) : (
                        filteredMessages.map((msg) => {
                          const isOwnMessage = msg.senderId === user.id
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} group`}
                            >
                              <div className="max-w-[85%] sm:max-w-[70%] space-y-1">
                                <div
                                  className={`rounded-lg p-3 break-words hyphens-auto ${
                                    isOwnMessage ? "bg-orange-500 text-white" : "bg-accent text-foreground"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="font-semibold text-sm break-words">{msg.senderName}</span>
                                    <Badge variant="outline" className="text-xs flex-shrink-0">
                                      {msg.senderRole === "admin" ? "ADM" : "OP"}
                                    </Badge>
                                  </div>
                                  {msg.replyTo && (
                                    <div
                                      className={`mb-2 p-2 rounded border-l-2 break-words hyphens-auto ${
                                        isOwnMessage
                                          ? "bg-orange-600/50 border-white/50"
                                          : "bg-muted/50 border-muted-foreground/50"
                                      }`}
                                    >
                                      <p className="text-xs font-semibold mb-1 break-words">{msg.replyTo.senderName}</p>
                                      <p className="text-xs opacity-80 line-clamp-2 break-words">
                                        {msg.replyTo.content}
                                      </p>
                                    </div>
                                  )}
                                  <p className="text-sm whitespace-pre-wrap break-words hyphens-auto">{msg.content}</p>
                                  {msg.attachment && msg.attachment.type === "image" && (
                                    <div className="mt-2">
                                      <img
                                        src={msg.attachment.url || "/placeholder.svg"}
                                        alt={msg.attachment.name}
                                        className="rounded-lg max-w-full max-h-64 object-contain"
                                      />
                                    </div>
                                  )}
                                  <span className="text-xs opacity-70 mt-1 block">
                                    {new Date(msg.createdAt).toLocaleString("pt-BR")}
                                  </span>
                                </div>
                                <div className="flex gap-1 flex-wrap">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleReply(msg)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-xs"
                                  >
                                    <Reply className="h-3 w-3 mr-1" />
                                    <span className="hidden sm:inline">Responder</span>
                                  </Button>
                                  {isOwnMessage && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteMessage(msg.id)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-xs"
                                    >
                                      <Trash2 className="h-3 w-3 mr-1" />
                                      <span className="hidden sm:inline">Excluir</span>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="border-t p-4 space-y-2">
                    {attachmentPreview && (
                      <div className="relative inline-block">
                        <img
                          src={attachmentPreview || "/placeholder.svg"}
                          alt="Preview"
                          className="h-20 rounded-lg border"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => {
                            setAttachmentPreview(null)
                            setAttachmentName(null)
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    )}
                    {replyingTo && (
                      <div className="bg-muted p-2 rounded-lg flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Reply className="h-3 w-3" />
                            <p className="text-xs font-semibold">Respondendo a {replyingTo.senderName}</p>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{replyingTo.content}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCancelReply}
                          className="h-6 w-6 flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <div className="flex flex-col gap-2 flex-1">
                        <Textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          onPaste={handlePaste}
                          placeholder="Digite sua mensagem... (Shift+Enter para nova linha, Ctrl+V para colar imagem)"
                          className="resize-none"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Anexar Imagem
                          </Button>

                          <Popover>
                            <PopoverTrigger asChild>
                              <Button type="button" variant="outline" size="sm">
                                <Smile className="h-4 w-4 mr-2" />
                                Emojis
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="grid grid-cols-10 gap-2">
                                {EMOJI_LIST.map((emoji, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleEmojiSelect(emoji)}
                                    className="text-2xl hover:bg-accent rounded p-1 transition-colors"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <Button
                        onClick={handleSend}
                        disabled={!newMessage.trim()}
                        className="bg-orange-500 hover:bg-orange-600 text-white self-end"
                        size="icon"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <p>Selecione um operador para iniciar a conversa</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})
