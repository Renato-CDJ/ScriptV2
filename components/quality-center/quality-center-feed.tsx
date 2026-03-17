"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  useQualityPosts,
  createQualityPostSupabase,
  likePostSupabase,
  voteOnQuizSupabase,
  addCommentSupabase,
} from "@/hooks/use-supabase-realtime"
import type { QualityPost } from "@/lib/types"
import { Send, HelpCircle, Heart, MessageCircle, Share2, Megaphone, MoreHorizontal, Bookmark, AtSign, Users, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function QualityCenterFeed() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { posts: allPosts } = useQualityPosts()
  const [newPostContent, setNewPostContent] = useState("")
  const [isQuestionToAdmin, setIsQuestionToAdmin] = useState(false)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [showComments, setShowComments] = useState<Record<string, boolean>>({})
  const [mentionType, setMentionType] = useState<"all" | "admins">("all") // "all" = Todos podem ver, "admins" = ADM's

  // Filter posts based on user role and visibility
  const posts = allPosts.filter((p) => {
    // Admins can see all posts
    if (user?.role === "admin") return true
    
    // If post is a question, only admins can see it (already filtered above)
    if (p.type === "pergunta") return false
    
    // If post is for admins only, operators can't see it (unless they are the author)
    if (p.recipients?.includes("admins") && !p.sendToAll) {
      return p.authorId === user?.id
    }
    
    return true
  })

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user) return

    const isOperator = user.role === "operator"
    const postType = isOperator ? "pergunta" : (isQuestionToAdmin ? "pergunta" : "comunicado")

    // Determine if sending to admins only or to all
    const sendToAdminsOnly = mentionType === "admins"

    await createQualityPostSupabase({
      type: postType,
      content: newPostContent.trim(),
      authorId: user.id,
      authorName: user.fullName || user.username,
      sendToAll: !sendToAdminsOnly,
      recipients: sendToAdminsOnly ? ["admins"] : [],
      recipientNames: sendToAdminsOnly ? ["Administradores"] : [],
    })

    setNewPostContent("")
    setIsQuestionToAdmin(false)
    setMentionType("all")
    toast({
      title: isQuestionToAdmin || isOperator ? "Pergunta enviada" : "Publicacao criada",
      description: sendToAdminsOnly 
        ? "Sua mensagem foi enviada para os administradores" 
        : (isQuestionToAdmin || isOperator ? "Sua pergunta foi enviada para o admin" : "Sua publicacao foi criada com sucesso"),
    })
  }

  const handleLike = async (postId: string) => {
    if (!user) return
    await likePostSupabase(postId, user.id)
  }

  const handleVote = async (postId: string, optionId: string) => {
    if (!user) return
    await voteOnQuizSupabase(postId, optionId, user.id)
  }

  const handleComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim()
    if (!content || !user) return

    await addCommentSupabase(postId, {
      authorId: user.id,
      authorName: user.fullName || user.username,
      content,
    })

    setCommentInputs((prev) => ({ ...prev, [postId]: "" }))
  }

  const getInitials = (name: string) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U"

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500", 
      "bg-orange-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-cyan-500",
      "bg-yellow-500",
      "bg-red-500",
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  const getPostTypeBadge = (type: QualityPost["type"]) => {
    switch (type) {
      case "comunicado":
        return <Badge className="bg-blue-500 text-white hover:bg-blue-600 border-0 text-xs font-medium">Comunicado</Badge>
      case "quiz":
        return <Badge className="bg-amber-500 text-white hover:bg-amber-600 border-0 text-xs font-medium">Quiz</Badge>
      case "recado":
        return <Badge className="bg-green-500 text-white hover:bg-green-600 border-0 text-xs font-medium">Aviso</Badge>
      case "pergunta":
        return <Badge className="bg-purple-500 text-white hover:bg-purple-600 border-0 text-xs font-medium">Pergunta</Badge>
      default:
        return null
    }
  }

  const getDepartmentName = (authorName: string) => {
    const departments: Record<string, string> = {
      "Admin": "Setor Administrativo",
      "RH": "Setor de Pessoas",
      "Diretoria": "Gestao Executiva",
    }
    const firstWord = authorName.split(" ")[0]
    return departments[firstWord] || "Central da Qualidade"
  }

  const userInitials = getInitials(user?.fullName || "")

  return (
    <div className="space-y-4">
      {/* Create Post - Only for operators */}
      {user?.role === "operator" && (
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className={cn(getAvatarColor(user?.fullName || ""), "text-white font-medium")}>
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Compartilhe algo com a equipe..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="min-h-[80px] resize-none bg-muted/30 border-border/50 focus:border-orange-500/50"
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "border-border/50",
                            mentionType === "admins" && "bg-orange-100 border-orange-300 text-orange-700 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-400"
                          )}
                        >
                          <AtSign className="h-4 w-4 mr-2" />
                          Mencionar
                          {mentionType === "admins" && <span className="ml-1 text-xs">(ADMs)</span>}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem 
                          onClick={() => setMentionType("admins")}
                          className={cn(mentionType === "admins" && "bg-orange-100 dark:bg-orange-900/30")}
                        >
                          <Shield className="h-4 w-4 mr-2 text-orange-500" />
                          <span>ADMs</span>
                          {mentionType === "admins" && <span className="ml-auto text-orange-500">&#10003;</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setMentionType("all")}
                          className={cn(mentionType === "all" && "bg-orange-100 dark:bg-orange-900/30")}
                        >
                          <Users className="h-4 w-4 mr-2 text-blue-500" />
                          <span>Todos podem ver</span>
                          {mentionType === "all" && <span className="ml-auto text-orange-500">&#10003;</span>}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant={isQuestionToAdmin ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsQuestionToAdmin(!isQuestionToAdmin)}
                      className={isQuestionToAdmin ? "bg-purple-500 hover:bg-purple-600 border-0" : "border-border/50"}
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Pergunta para Admin
                    </Button>
                  </div>
                  <Button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim()}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Publicar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card className="bg-card border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Megaphone className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-foreground font-medium">Nenhuma publicacao ainda</p>
              <p className="text-sm text-muted-foreground">Seja o primeiro a publicar!</p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => {
            const isLiked = post.likes.includes(user?.id || "")
            return (
              <Card key={post.id} className="bg-card border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  {/* Post Header */}
                  <div className="flex items-start justify-between p-4 pb-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-11 w-11">
                        <AvatarFallback className={cn(getAvatarColor(post.authorName), "text-white font-semibold")}>
                          {getInitials(post.authorName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{post.authorName}</span>
                          {getPostTypeBadge(post.type)}
                          <Badge variant="outline" className="text-xs text-muted-foreground border-border/50">
                            Todos
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: false, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Salvar publicacao</DropdownMenuItem>
                        <DropdownMenuItem>Copiar link</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500">Denunciar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Post Content */}
                  <div className="px-4 pb-3">
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">{post.content}</p>
                  </div>

                  {/* Quiz Options */}
                  {post.type === "quiz" && post.quizOptions && (
                    <div className="px-4 pb-3 space-y-2">
                      {post.quizOptions.map((option) => {
                        const totalVotes = post.quizOptions!.reduce((sum, o) => sum + o.votes.length, 0)
                        const percentage = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0
                        const hasVoted = option.votes.includes(user?.id || "")

                        return (
                          <button
                            key={option.id}
                            onClick={() => handleVote(post.id, option.id)}
                            className="w-full text-left"
                          >
                            <div className="relative rounded-lg border border-border/50 p-3 overflow-hidden hover:border-orange-500/50 transition-colors bg-muted/20">
                              <div
                                className="absolute inset-y-0 left-0 bg-orange-500/20 transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                              <div className="relative flex items-center justify-between">
                                <span className={`text-sm ${hasVoted ? "font-semibold text-orange-500" : "text-foreground"}`}>
                                  {option.text}
                                </span>
                                <span className="text-sm text-muted-foreground">{percentage}%</span>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                      <p className="text-xs text-muted-foreground pt-1">
                        {post.quizOptions.reduce((sum, o) => sum + o.votes.length, 0)} votos no total
                      </p>
                    </div>
                  )}

                  {/* Likes and Comments Count */}
                  {(post.likes.length > 0 || post.comments.length > 0) && (
                    <div className="px-4 pb-2">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {post.likes.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4 fill-orange-500 text-orange-500" />
                            {post.likes.length} curtida{post.likes.length !== 1 ? "s" : ""}
                          </span>
                        )}
                        {post.comments.length > 0 && (
                          <span>{post.comments.length} comentario{post.comments.length !== 1 ? "s" : ""}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center border-t border-border/50 px-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className={`flex-1 h-11 gap-2 rounded-none ${isLiked ? "text-orange-500 hover:text-orange-600" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Heart className={`h-5 w-5 ${isLiked ? "fill-orange-500" : ""}`} />
                      <span className="font-medium">Curtir</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                      className="flex-1 h-11 gap-2 rounded-none text-muted-foreground hover:text-foreground"
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span className="font-medium">Comentar{post.comments.length > 0 ? ` (${post.comments.length})` : ""}</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 h-11 gap-2 rounded-none text-muted-foreground hover:text-foreground"
                    >
                      <Share2 className="h-5 w-5" />
                      <span className="font-medium">Compartilhar</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-11 w-11 rounded-none text-muted-foreground hover:text-foreground"
                    >
                      <Bookmark className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Comments Section */}
                  {showComments[post.id] && (
                    <div className="p-4 pt-3 border-t border-border/50 space-y-4 bg-muted/5">
                      {/* Existing Comments */}
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className={`${getAvatarColor(comment.authorName)} text-white text-xs font-medium`}>
                              {getInitials(comment.authorName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 bg-muted/50 rounded-2xl px-4 py-2.5">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-semibold text-foreground">{comment.authorName}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: false, locale: ptBR })}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/90">{comment.content}</p>
                          </div>
                        </div>
                      ))}

                      {/* Add Comment */}
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={`${getAvatarColor(user?.fullName || "")} text-white text-xs font-medium`}>
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            placeholder="Escreva um comentario..."
                            value={commentInputs[post.id] || ""}
                            onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && handleComment(post.id)}
                            className="flex-1 px-4 py-2 text-sm bg-muted/50 border border-border/50 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent text-foreground placeholder:text-muted-foreground"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleComment(post.id)}
                            disabled={!commentInputs[post.id]?.trim()}
                            className="rounded-full bg-orange-500 hover:bg-orange-600 h-9 w-9 p-0"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
