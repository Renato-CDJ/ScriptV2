"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import {
  getActiveQualityPosts,
  createQualityPost,
  likeQualityPost,
  voteOnQualityQuiz,
  addCommentToQualityPost,
  getAdminQuestions,
  getAllUsers,
} from "@/lib/store"
import type { QualityPost, User } from "@/lib/types"
import { Send, HelpCircle, ThumbsUp, MessageCircle, Share2, Megaphone, Brain } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export function QualityCenterFeed() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [posts, setPosts] = useState<QualityPost[]>([])
  const [pendingQuestions, setPendingQuestions] = useState<QualityPost[]>([])
  const [newPostContent, setNewPostContent] = useState("")
  const [isQuestionToAdmin, setIsQuestionToAdmin] = useState(false)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [showComments, setShowComments] = useState<Record<string, boolean>>({})

  const loadData = () => {
    const allPosts = getActiveQualityPosts()
    setPosts(allPosts.filter((p) => !p.isQuestionToAdmin || user?.role === "admin"))
    setPendingQuestions(getAdminQuestions())
  }

  useEffect(() => {
    loadData()
    const handleUpdate = () => loadData()
    window.addEventListener("store-updated", handleUpdate)
    return () => window.removeEventListener("store-updated", handleUpdate)
  }, [user])

  const handleCreatePost = () => {
    if (!newPostContent.trim() || !user) return

    createQualityPost({
      type: isQuestionToAdmin ? "pergunta" : "comunicado",
      content: newPostContent.trim(),
      authorId: user.id,
      authorName: user.fullName,
      isActive: true,
      isQuestionToAdmin,
    })

    setNewPostContent("")
    setIsQuestionToAdmin(false)
    toast({
      title: isQuestionToAdmin ? "Pergunta enviada" : "Publicacao criada",
      description: isQuestionToAdmin ? "Sua pergunta foi enviada para o admin" : "Sua publicacao foi criada com sucesso",
    })
  }

  const handleLike = (postId: string) => {
    if (!user) return
    likeQualityPost(postId, user.id)
  }

  const handleVote = (postId: string, optionId: string) => {
    if (!user) return
    voteOnQualityQuiz(postId, optionId, user.id)
  }

  const handleComment = (postId: string) => {
    const content = commentInputs[postId]?.trim()
    if (!content || !user) return

    addCommentToQualityPost(postId, {
      authorId: user.id,
      authorName: user.fullName,
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

  const getPostTypeBadge = (type: QualityPost["type"], isQuestion?: boolean) => {
    if (isQuestion) {
      return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 text-xs">Pergunta</Badge>
    }
    switch (type) {
      case "comunicado":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs"><Megaphone className="h-3 w-3 mr-1" />Comunicado</Badge>
      case "quiz":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs"><Brain className="h-3 w-3 mr-1" />Quiz</Badge>
      case "recado":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Recado</Badge>
      case "pergunta":
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 text-xs"><HelpCircle className="h-3 w-3 mr-1" />Pergunta</Badge>
      default:
        return null
    }
  }

  const userInitials = getInitials(user?.fullName || "")

  return (
    <div className="space-y-6">
      {/* Pending Questions (Admin Only) */}
      {user?.role === "admin" && pendingQuestions.length > 0 && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900">Perguntas Recebidas</h3>
              <Badge className="bg-blue-500 text-white text-xs">{pendingQuestions.length}</Badge>
            </div>
            <ScrollArea className="w-full">
              <div className="flex gap-3 pb-2">
                {pendingQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="flex flex-col items-center p-3 bg-blue-50 rounded-xl border border-blue-100 min-w-[100px] cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    <Avatar className="h-12 w-12 mb-2">
                      <AvatarFallback className="bg-blue-200 text-blue-700">
                        {getInitials(q.authorName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-slate-700 text-center">{q.authorName.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Create Post */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-100 text-blue-600">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="No que voce esta pensando?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[80px] resize-none border-slate-200 focus:border-blue-500 bg-slate-50"
              />
              <div className="flex items-center justify-between mt-3">
                <Button
                  variant={isQuestionToAdmin ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsQuestionToAdmin(!isQuestionToAdmin)}
                  className={isQuestionToAdmin ? "bg-purple-500 hover:bg-purple-600" : "text-slate-600"}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Pergunta para Admin
                </Button>
                <Button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim()}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Publicar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Megaphone className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500">Nenhuma publicacao ainda</p>
              <p className="text-sm text-slate-400">Seja o primeiro a publicar!</p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-4">
                {/* Post Header */}
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-slate-100 text-slate-600">
                      {getInitials(post.authorName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">{post.authorName}</span>
                      {getPostTypeBadge(post.type, post.isQuestionToAdmin)}
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  <p className="text-slate-800 whitespace-pre-wrap">{post.content}</p>
                </div>

                {/* Quiz Options */}
                {post.type === "quiz" && post.quizOptions && (
                  <div className="space-y-2 mb-4">
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
                          <div className="relative rounded-lg border border-slate-200 p-3 overflow-hidden hover:border-blue-300 transition-colors">
                            <div
                              className="absolute inset-y-0 left-0 bg-blue-100 transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                            <div className="relative flex items-center justify-between">
                              <span className={`text-sm ${hasVoted ? "font-semibold text-blue-700" : "text-slate-700"}`}>
                                {option.text}
                              </span>
                              <span className="text-sm text-slate-500">{percentage}%</span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                    <p className="text-xs text-slate-500">
                      {post.quizOptions.reduce((sum, o) => sum + o.votes.length, 0)} votos no total
                    </p>
                  </div>
                )}

                {/* Likes Count */}
                {post.likes.length > 0 && (
                  <p className="text-sm text-slate-500 mb-2">{post.likes.length} curtida{post.likes.length !== 1 ? "s" : ""}</p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(post.id)}
                    className={`flex-1 ${post.likes.includes(user?.id || "") ? "text-blue-600" : "text-slate-600"}`}
                  >
                    <ThumbsUp className={`h-4 w-4 mr-2 ${post.likes.includes(user?.id || "") ? "fill-blue-600" : ""}`} />
                    Curtir
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                    className="flex-1 text-slate-600"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Comentar {post.comments.length > 0 && `(${post.comments.length})`}
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 text-slate-600">
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar
                  </Button>
                </div>

                {/* Comments Section */}
                {showComments[post.id] && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                    {/* Existing Comments */}
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-slate-100 text-slate-600 text-xs">
                            {getInitials(comment.authorName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-slate-900">{comment.authorName}</span>
                            <span className="text-xs text-slate-400">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700">{comment.content}</p>
                        </div>
                      </div>
                    ))}

                    {/* Add Comment */}
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
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
                          className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleComment(post.id)}
                          disabled={!commentInputs[post.id]?.trim()}
                          className="rounded-full bg-blue-500 hover:bg-blue-600"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
