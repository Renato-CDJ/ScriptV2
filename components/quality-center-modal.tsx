"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { RichTextEditorWYSIWYG } from "@/components/rich-text-editor-wysiwyg"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Search,
  Bell,
  Moon,
  Sun,
  Home,
  User,
  Users,
  Image,
  Video,
  Settings,
  Shield,
  ThumbsUp,
  MessageCircle,
  Share2,
  Send,
  HelpCircle,
  BarChart3,
  MessageSquare,
  ClipboardList,
  Plus,
  Trash2,
  CalendarIcon,
  Award,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  GraduationCap,
  Heart,
  Cake,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  Edit3,
  Save,
  Check,
  X,
  BookOpen,
  FileText,
  Eye,
  AtSign,
  MoreVertical,
  Pencil,
  Paintbrush,
  Reply,
  Smile,
  ImageIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { 
  useQualityPosts, 
  useAdminQuestions, 
  useAllUsers,
  useQualityStats,
  useFeedbacks,
  createQualityPostSupabase,
  likePostSupabase,
  addCommentSupabase,
  voteOnQuizSupabase,
  createFeedbackSupabase,
  getQualityStatsSupabase,
  answerAdminQuestion,
  answerAdminQuestionSecond,
  markQuestionUnderstood,
  createAdminQuestion,
  deleteQualityPostSupabase,
  editQualityPostSupabase,
  deleteCommentSupabase,
  editCommentSupabase,
  markFeedbackAsRead,
} from "@/hooks/use-supabase-realtime"
import { containsProfanity, getProfanityWarning } from "@/lib/profanity-filter"
import { useToast } from "@/hooks/use-toast"
import type { QualityPost, User as UserType } from "@/lib/types"

interface QualityCenterModalProps {
  isOpen: boolean
  onClose: () => void
}

// Post Details Modal Component
function PostDetailsModal({
  post,
  isOpen,
  onClose,
  user,
  getInitials,
  formatTimeAgo,
}: {
  post: QualityPost | null
  isOpen: boolean
  onClose: () => void
  user: any
  getInitials: (name: string) => string
  formatTimeAgo: (date: Date) => string
}) {
  const [commentText, setCommentText] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const { toast } = useToast()

  if (!post) return null

  const hasLiked = post.likes?.includes(user?.id || "")
  const isQuiz = post.type === "quiz"
  const userVote = post.quizOptions?.find(opt => opt.votes?.includes(user?.id || ""))

  const handleLike = async () => {
    if (!user) return
    await likePostSupabase(post.id, user.id)
  }

  const handleComment = async () => {
    if (!commentText.trim() || !user || isSubmittingComment) return
    
    setIsSubmittingComment(true)
    const result = await addCommentSupabase(post.id, {
      text: commentText,
      authorId: user.id,
      authorName: user.fullName || user.username || "Usuario",
    })
    
    setIsSubmittingComment(false)
    
    if (result) {
      setCommentText("")
      toast({
        title: "Comentario adicionado!",
        description: "Seu comentario foi publicado com sucesso.",
      })
    }
  }

  const handleVote = async (optionId: string) => {
    if (!user || userVote) return
    await voteOnQuizSupabase(post.id, optionId, user.id)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {post.type}
            </Badge>
            <span className="text-muted-foreground text-sm font-normal">
              {formatTimeAgo(new Date(post.createdAt))}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Autor */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-border">
              <AvatarFallback className="text-sm bg-muted font-semibold">
                {getInitials(post.authorName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-base">{post.authorName}</p>
              <p className="text-xs text-muted-foreground">
                Publicado em {format(new Date(post.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>

          {/* Conteúdo */}
          <div 
            className={cn(
              "rounded-lg p-6 min-h-[100px]",
              post.backgroundColor || "bg-muted/50",
              (post.backgroundColor?.includes("gradient") || post.backgroundColor?.includes("500") || post.backgroundColor?.includes("600")) && "text-white"
            )}
          >
            <div 
              className={cn(
                "prose prose-sm max-w-none",
                (post.backgroundColor?.includes("gradient") || post.backgroundColor?.includes("500") || post.backgroundColor?.includes("600")) 
                  ? "prose-invert" 
                  : "dark:prose-invert"
              )}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Quiz Options */}
          {isQuiz && post.quizOptions && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Opcoes:</h4>
              {post.quizOptions.map((option) => {
                const voteCount = option.votes?.length || 0
                const totalVotes = post.quizOptions?.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0) || 0
                const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
                const hasVoted = option.votes?.includes(user?.id || "")

                return (
                  <button
                    key={option.id}
                    onClick={() => handleVote(option.id)}
                    disabled={!!userVote}
                    className={cn(
                      "w-full p-4 rounded-lg border-2 transition-all text-left relative overflow-hidden",
                      hasVoted && "border-orange-500 bg-orange-500/10",
                      !userVote && "hover:border-orange-500/50 cursor-pointer",
                      userVote && !hasVoted && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    {userVote && (
                      <div 
                        className="absolute inset-0 bg-orange-500/20 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    )}
                    <div className="relative flex items-center justify-between">
                      <span className="font-medium">{option.text}</span>
                      {userVote && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{percentage}%</span>
                          <span className="text-xs text-muted-foreground">({voteCount} voto{voteCount !== 1 ? 's' : ''})</span>
                          {hasVoted && <Check className="h-5 w-5 text-orange-500" />}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Interacoes */}
          <div className="flex items-center gap-4 py-3 border-y">
            <Button
              variant={hasLiked ? "default" : "ghost"}
              size="sm"
              onClick={handleLike}
              className={cn(
                "gap-2",
                hasLiked && "bg-orange-500 hover:bg-orange-600"
              )}
            >
              <ThumbsUp className={cn("h-4 w-4", hasLiked && "fill-current")} />
              <span>{post.likes?.length || 0}</span>
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span>{post.comments?.length || 0} comentarios</span>
            </div>
          </div>

          {/* Comentarios */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Comentarios</h4>
            
            {/* Novo Comentario */}
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="text-xs bg-muted">
                  {getInitials(user?.fullName || user?.username)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escreva um comentario..."
                  className="min-h-[60px] resize-none"
                />
                <Button
                  onClick={handleComment}
                  disabled={!commentText.trim() || isSubmittingComment}
                  size="sm"
                  className="ml-auto bg-orange-500 hover:bg-orange-600"
                >
                  {isSubmittingComment ? (
                    <>
                      <div className="h-3.5 w-3.5 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 mr-2" />
                      Comentar
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Lista de Comentarios */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {post.comments?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum comentario ainda. Seja o primeiro a comentar!
                </p>
              ) : (
                post.comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarFallback className="text-xs bg-muted">
                        {getInitials(comment.authorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{comment.authorName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(new Date(comment.createdAt))}
                        </span>
                      </div>
                      <p className="text-sm">{comment.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function QualityCenterModal({ isOpen, onClose }: QualityCenterModalProps) {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [activeView, setActiveView] = useState("inicio")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined)
  
  // Use local hooks with localStorage
  const { posts, loading: postsLoading, refetch: refetchPosts } = useQualityPosts()
  const { users: allUsers } = useAllUsers()

  const isAdmin = user?.role === "admin"
  
  // Filter posts by date if set
  const filteredPostsByDate = filterDate 
    ? posts.filter(post => {
        const postDate = new Date(post.createdAt)
        return postDate.toDateString() === filterDate.toDateString()
      })
    : posts

  const getInitials = (name: string | undefined | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - new Date(date).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "agora"
    if (diffMins < 60) return `${diffMins}min atras`
    if (diffHours < 24) return `${diffHours}h atras`
    if (diffDays < 7) return `${diffDays}d atras`
    return format(new Date(date), "dd 'de' MMM", { locale: ptBR })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!max-w-[90vw] w-[90vw] !max-h-[90vh] h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-background">
        {/* Header */}
        <DialogHeader className="border-b px-6 py-3 flex-shrink-0 bg-card">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md">
                <Award className="h-5 w-5 text-white" />
              </div>
              <span className="text-foreground">Central da Qualidade</span>
            </DialogTitle>

            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar publicacoes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-muted/50 border-border text-sm"
                />
              </div>

              {/* Date Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-9 gap-2 text-sm",
                      filterDate && "bg-orange-500/10 border-orange-500/50 text-orange-600"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {filterDate ? format(filterDate, "dd/MM/yyyy", { locale: ptBR }) : "Filtrar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={filterDate}
                    onSelect={setFilterDate}
                    locale={ptBR}
                    initialFocus
                  />
                  {filterDate && (
                    <div className="p-2 border-t">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-muted-foreground"
                        onClick={() => setFilterDate(undefined)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Limpar filtro
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-orange-500 rounded-full" />
              </Button>

              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="text-xs font-medium bg-muted">
                  {getInitials(user?.fullName || user?.username)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-52 bg-card border-r border-border p-3 shrink-0 flex flex-col">
            <nav className="space-y-0.5 flex-1">
              <SidebarButton
                icon={<Home className="h-5 w-5" />}
                label="Inicio"
                active={activeView === "inicio"}
                onClick={() => setActiveView("inicio")}
              />
              {/* Chat com Supervisao - esconder para supervisores e monitoria */}
              {user?.adminType !== "supervisao" && user?.adminType !== "monitoria" && (
                <SidebarButton
                  icon={<Users className="h-5 w-5" />}
                  label="Chat com a Supervisão"
                  active={activeView === "colegas"}
                  onClick={() => setActiveView("colegas")}
                />
              )}
              {/* Chat com Qualidade/Operacao - esconder para supervisores */}
              {user?.adminType !== "supervisao" && (
                <SidebarButton
                  icon={<MessageSquare className="h-5 w-5" />}
                  label={user?.adminType === "monitoria" || user?.adminType === "qualidade" ? "Chat com a Operacao" : "Chat com a Qualidade"}
                  active={activeView === "filter-perguntas"}
                  onClick={() => setActiveView("filter-perguntas")}
                />
              )}
              {/* Chat com Operadores - apenas para supervisores */}
              {user?.adminType === "supervisao" && (
                <SidebarButton
                  icon={<Users className="h-5 w-5" />}
                  label="Chat com os Operadores"
                  active={activeView === "chat-operadores"}
                  onClick={() => setActiveView("chat-operadores")}
                />
              )}
              <SidebarButton
                icon={<BookOpen className="h-5 w-5" />}
                label="Treinamentos"
                active={activeView === "treinamentos"}
                onClick={() => setActiveView("treinamentos")}
              />

              {/* Filter shortcuts */}
              <div className="my-3 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-2">Filtros</p>
                <SidebarButton
                  icon={<Megaphone className="h-5 w-5" />}
                  label="Comunicados"
                  active={activeView === "filter-comunicado"}
                  onClick={() => setActiveView("filter-comunicado")}
                />
                <SidebarButton
                  icon={<MessageCircle className="h-5 w-5" />}
                  label="Recados"
                  active={activeView === "filter-recado"}
                  onClick={() => setActiveView("filter-recado")}
                />
                <SidebarButton
                  icon={<ClipboardList className="h-5 w-5" />}
                  label="Feedback"
                  active={activeView === "filter-feedback"}
                  onClick={() => setActiveView("filter-feedback")}
                />
                <SidebarButton
                  icon={<HelpCircle className="h-5 w-5" />}
                  label="Quiz"
                  active={activeView === "filter-quiz"}
                  onClick={() => setActiveView("filter-quiz")}
                />
              </div>

              {isAdmin && (
                <>
                  <div className="my-3 border-t border-border" />
                  <SidebarButton
                    icon={<Shield className="h-5 w-5" />}
                    label="Painel Admin"
                    active={activeView === "admin"}
                    onClick={() => setActiveView("admin")}
                    highlight
                  />
                </>
              )}
            </nav>

            {/* User Info Card */}
            <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarFallback className="text-sm font-medium bg-background">
                    {getInitials(user?.fullName || user?.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user?.fullName || user?.username}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                {activeView === "inicio" && (
                  <FeedView
                    posts={filteredPostsByDate}
                    user={user}
                    searchQuery={searchQuery}
                    getInitials={getInitials}
                    formatTimeAgo={formatTimeAgo}
                    allUsers={allUsers}
                  />
                )}
                {activeView === "admin" && isAdmin && (
                  <AdminPanelView user={user} getInitials={getInitials} formatTimeAgo={formatTimeAgo} />
                )}
                {activeView === "filter-comunicado" && (
                  <FilteredFeedView
                    posts={posts.filter(p => p.type === "comunicado")}
                    user={user}
                    title="Comunicados"
                    icon={<Megaphone className="h-5 w-5 text-orange-500" />}
                    getInitials={getInitials}
                    formatTimeAgo={formatTimeAgo}
                  />
                )}
                {activeView === "filter-recado" && (
                  <FilteredFeedView
                    posts={posts.filter(p => p.type === "recado")}
                    user={user}
                    title="Recados"
                    icon={<MessageCircle className="h-5 w-5 text-blue-500" />}
                    getInitials={getInitials}
                    formatTimeAgo={formatTimeAgo}
                  />
                )}
                {activeView === "filter-feedback" && (
                  <FilteredFeedView
                    posts={posts.filter(p => p.type === "feedback")}
                    user={user}
                    title="Feedbacks"
                    icon={<ClipboardList className="h-5 w-5 text-green-500" />}
                    getInitials={getInitials}
                    formatTimeAgo={formatTimeAgo}
                  />
                )}
                {activeView === "filter-quiz" && (
                  <FilteredFeedView
                    posts={posts.filter(p => p.type === "quiz")}
                    user={user}
                    title="Quizzes"
                    icon={<HelpCircle className="h-5 w-5 text-purple-500" />}
                    getInitials={getInitials}
                    formatTimeAgo={formatTimeAgo}
                  />
                )}
                {activeView === "filter-perguntas" && (
                  user?.role === "admin" ? (
                    (user?.adminType === "monitoria" || user?.adminType === "qualidade") ? (
                      <MonitoriaOperationChatView
                        user={user}
                        getInitials={getInitials}
                        formatTimeAgo={formatTimeAgo}
                        allUsers={allUsers}
                      />
                    ) : (
                      <QuestionsTab
                        getInitials={getInitials}
                        formatTimeAgo={formatTimeAgo}
                      />
                    )
                  ) : (
                    <OperatorQuestionsView
                      user={user}
                      getInitials={getInitials}
                      formatTimeAgo={formatTimeAgo}
                      allUsers={allUsers}
                    />
                  )
                )}
                {activeView === "treinamentos" && (
                  <TreinamentosView user={user} getInitials={getInitials} />
                )}
                {activeView === "colegas" && (
                  <EquipeView user={user} getInitials={getInitials} allUsers={allUsers} />
                )}
                {activeView === "chat-operadores" && (
                  <SupervisorOperationChatView
                    user={user}
                    getInitials={getInitials}
                    formatTimeAgo={formatTimeAgo}
                    allUsers={allUsers}
                  />
                )}
                {!["inicio", "admin", "perfil", "treinamentos", "filter-comunicado", "filter-recado", "filter-feedback", "filter-quiz", "filter-perguntas", "colegas", "chat-operadores"].includes(activeView) && (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
                    <div className="p-6 bg-muted rounded-full mb-4">
                      <Settings className="h-12 w-12" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Em Desenvolvimento</h3>
                    <p className="text-sm">Esta funcionalidade estara disponivel em breve</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Sidebar Button Component
function SidebarButton({
  icon,
  label,
  active,
  onClick,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
  highlight?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-all duration-200 text-sm",
        active
          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        highlight && !active && "text-orange-500 dark:text-orange-400 font-medium"
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  )
}

// Profile View Component
// Filtered Feed View Component
function FilteredFeedView({
  posts,
  user,
  title,
  icon,
  getInitials,
  formatTimeAgo,
}: {
  posts: QualityPost[]
  user: any
  title: string
  icon: React.ReactNode
  getInitials: (name: string) => string
  formatTimeAgo: (date: Date) => string
}) {
  const [selectedPost, setSelectedPost] = useState<QualityPost | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-xl font-bold">{title}</h2>
        <Badge variant="secondary" className="ml-2">{posts.length}</Badge>
      </div>
      
      {posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-3">
            {icon}
          </div>
          <p>Nenhum {title.toLowerCase().slice(0, -1)} encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card 
              key={post.id} 
              className="border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedPost(post)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarFallback className="text-sm bg-muted">
                      {getInitials(post.authorName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{post.authorName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(new Date(post.createdAt))}
                      </span>
                      <Badge variant="outline" className="text-xs capitalize ml-auto">
                        {post.type}
                      </Badge>
                    </div>
                    <div 
                      className="text-sm prose prose-sm dark:prose-invert max-w-none line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span>{post.likes?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>{post.comments?.length || 0}</span>
                      </div>
                      <span className="ml-auto text-orange-500 hover:text-orange-600">
                        Clique para ver detalhes →
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Detalhes */}
      <PostDetailsModal
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        user={user}
        getInitials={getInitials}
        formatTimeAgo={formatTimeAgo}
      />
    </div>
  )
}

// Feed View Component
function FeedView({
  posts,
  user,
  searchQuery,
  getInitials,
  formatTimeAgo,
  allUsers = [],
}: {
  posts: QualityPost[]
  user: any
  searchQuery: string
  getInitials: (name: string) => string
  formatTimeAgo: (date: Date) => string
  allUsers?: any[]
}) {
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostBgColor, setNewPostBgColor] = useState("") // "" means use system default
  const [expandedComments, setExpandedComments] = useState<string[]>([])
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [mentionType, setMentionType] = useState<"all" | "qualidade" | "supervisao">("qualidade") // "all" = Todos podem ver, "qualidade" = Monitoria, "supervisao" = Supervisores

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery) return true
    return (
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.authorName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user) return

    // Check for profanity
    if (containsProfanity(newPostContent)) {
      alert(getProfanityWarning())
      return
    }

    // Operadores sempre publicam como "pergunta", admins publicam comunicados
    const isOperator = user.role === "operator"
    const postType = isOperator ? "pergunta" : "comunicado"

    // Determine recipients based on mention type
    const sendToAll = mentionType === "all"
    let recipients: string[] = []
    let recipientNames: string[] = []
    
    if (mentionType === "qualidade") {
      recipients = ["qualidade"]
      recipientNames = ["Qualidade"]
    } else if (mentionType === "supervisao") {
      recipients = ["supervisao"]
      recipientNames = ["Supervisão"]
    }

    await createQualityPostSupabase({
      type: postType,
      content: newPostContent.trim(),
      authorId: user.id,
      authorName: user.fullName || user.username || "Usuario",
      sendToAll: sendToAll,
      recipients: recipients,
      recipientNames: recipientNames,
      backgroundColor: newPostBgColor || undefined,
    })

    setNewPostContent("")
    setNewPostBgColor("")
    setMentionType("all")
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
    if (!user || !commentInputs[postId]?.trim()) return

    // Check for profanity
    if (containsProfanity(commentInputs[postId])) {
      alert(getProfanityWarning())
      return
    }

    await addCommentSupabase(postId, {
      authorId: user.id,
      authorName: user.fullName || user.username || "Usuario",
      content: commentInputs[postId],
    })

    setCommentInputs((prev) => ({ ...prev, [postId]: "" }))
  }

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    )
  }

  // Edit/Delete post states
  const [editingPost, setEditingPost] = useState<QualityPost | null>(null)
  const [editPostContent, setEditPostContent] = useState("")
  const [editPostBgColor, setEditPostBgColor] = useState("")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const handleEditPost = (post: QualityPost) => {
    setEditingPost(post)
    setEditPostContent(post.content)
    setEditPostBgColor(post.backgroundColor || "")
  }

  const handleSaveEditPost = async () => {
    if (!editingPost || !editPostContent.trim()) return
    
    // Check for profanity
    if (containsProfanity(editPostContent)) {
      alert(getProfanityWarning())
      return
    }
    
    await editQualityPostSupabase(editingPost.id, editPostContent, editPostBgColor || undefined)
    setEditingPost(null)
    setEditPostContent("")
    setEditPostBgColor("")
  }

  const handleDeletePost = async (postId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta publicacao?")) {
      await deleteQualityPostSupabase(postId)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este comentario?")) {
      await deleteCommentSupabase(commentId)
    }
  }

  const getPostTypeBadge = (type: QualityPost["type"]) => {
    const badges: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      comunicado: {
        label: "Comunicado",
        className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
        icon: <MessageSquare className="h-3 w-3" />,
      },
      quiz: {
        label: "Quiz",
        className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
        icon: <HelpCircle className="h-3 w-3" />,
      },
      recado: {
        label: "Recado",
        className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
        icon: <MessageCircle className="h-3 w-3" />,
      },
      pergunta: {
        label: "Publicação",
        className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
        icon: <HelpCircle className="h-3 w-3" />,
      },
      feedback: {
        label: "Feedback",
        className: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
        icon: <MessageCircle className="h-3 w-3" />,
      },
      aviso: {
        label: "Aviso",
        className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
        icon: <MessageSquare className="h-3 w-3" />,
      },
      procedimento: {
        label: "Procedimento",
        className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
        icon: <MessageSquare className="h-3 w-3" />,
      },
      dica: {
        label: "Dica",
        className: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30",
        icon: <MessageSquare className="h-3 w-3" />,
      },
    }
    return badges[type] || badges.comunicado
  }

  return (
  <div className="max-w-2xl mx-auto space-y-3">
  {/* New Post Card - Only for operators */}
      {user?.role === "operator" && (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-3">
            <div className="flex gap-2.5">
              <Avatar className="h-9 w-9 bg-orange-100 dark:bg-orange-900/50 border border-orange-500/30">
                <AvatarFallback className="text-orange-600 dark:text-orange-300 font-medium text-sm">
                  {getInitials(user?.fullName || user?.username)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Compartilhe algo com a equipe..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="min-h-[60px] text-sm bg-muted/30 border-0 resize-none focus:ring-1 focus:ring-orange-500/30 placeholder:text-muted-foreground/60"
                />
                
                {/* Color Palette Picker */}
                <div className="flex items-center gap-2 py-1">
                  <span className="text-xs text-muted-foreground font-medium">Cor de fundo:</span>
                  <button
                    onClick={() => setNewPostBgColor("")}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-all",
                      newPostBgColor === "" ? "border-orange-500 ring-1 ring-orange-500" : "border-border"
                    )}
                    title="Sistema padrão"
                  >
                    <div className="h-full w-full rounded-full bg-muted" />
                  </button>
                  <button
                    onClick={() => setNewPostBgColor("bg-gradient-to-br from-pink-500 via-purple-500 to-blue-600")}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-all",
                      newPostBgColor?.includes("pink-500") ? "border-orange-500 ring-1 ring-orange-500" : "border-border"
                    )}
                    title="Rosa-Roxo-Azul"
                  >
                    <div className="h-full w-full rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-600" />
                  </button>
                  <button
                    onClick={() => setNewPostBgColor("bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600")}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-all",
                      newPostBgColor?.includes("orange-500 via-pink") ? "border-orange-500 ring-1 ring-orange-500" : "border-border"
                    )}
                    title="Laranja-Rosa-Roxo"
                  >
                    <div className="h-full w-full rounded-full bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600" />
                  </button>
                  <button
                    onClick={() => setNewPostBgColor("bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500")}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-all",
                      newPostBgColor?.includes("blue-500 via-purple") ? "border-orange-500 ring-1 ring-orange-500" : "border-border"
                    )}
                    title="Azul-Roxo-Rosa"
                  >
                    <div className="h-full w-full rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" />
                  </button>
                  <button
                    onClick={() => setNewPostBgColor("bg-gradient-to-br from-green-500 via-teal-500 to-blue-500")}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-all",
                      newPostBgColor?.includes("green-500") ? "border-orange-500 ring-1 ring-orange-500" : "border-border"
                    )}
                    title="Verde-Teal-Azul"
                  >
                    <div className="h-full w-full rounded-full bg-gradient-to-br from-green-500 via-teal-500 to-blue-500" />
                  </button>
                  <button
                    onClick={() => setNewPostBgColor("bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500")}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-all",
                      newPostBgColor?.includes("yellow-500") ? "border-orange-500 ring-1 ring-orange-500" : "border-border"
                    )}
                    title="Amarelo-Laranja-Vermelho"
                  >
                    <div className="h-full w-full rounded-full bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500" />
                  </button>
                </div>
                
                {/* Mention/Visibility and Publish in same row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground",
                            mentionType !== "all" && "text-orange-600 dark:text-orange-400"
                          )}
                        >
                          <AtSign className="h-3.5 w-3.5" />
                          Mencionar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48 bg-popover">
                        <DropdownMenuItem 
                          onClick={() => setMentionType("qualidade")}
                          className={cn(
                            "text-sm text-foreground cursor-pointer", 
                            mentionType === "qualidade" && "bg-orange-100 dark:bg-orange-900/30"
                          )}
                        >
                          <Shield className="h-3.5 w-3.5 mr-2 text-orange-500" />
                          <span className="text-foreground">Qualidade</span>
                          {mentionType === "qualidade" && <Check className="ml-auto h-3.5 w-3.5 text-orange-500" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setMentionType("supervisao")}
                          className={cn(
                            "text-sm text-foreground cursor-pointer", 
                            mentionType === "supervisao" && "bg-blue-100 dark:bg-blue-900/30"
                          )}
                        >
                          <Users className="h-3.5 w-3.5 mr-2 text-blue-500" />
                          <span className="text-foreground">Supervisão</span>
                          {mentionType === "supervisao" && <Check className="ml-auto h-3.5 w-3.5 text-blue-500" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setMentionType("all")}
                          className={cn(
                            "text-sm text-foreground cursor-pointer", 
                            mentionType === "all" && "bg-green-100 dark:bg-green-900/30"
                          )}
                        >
                          <Users className="h-3.5 w-3.5 mr-2 text-green-500" />
                          <span className="text-foreground">Todos podem ver</span>
                          {mentionType === "all" && <Check className="ml-auto h-3.5 w-3.5 text-green-500" />}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* Show current visibility as small badge */}
                    <Badge variant="outline" className={cn(
                      "text-[10px] h-5 px-1.5",
                      mentionType === "all" 
                        ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30" 
                        : mentionType === "qualidade"
                          ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                    )}>
                      {mentionType === "all" ? "@Todos" : mentionType === "qualidade" ? "@Qualidade" : "@Supervisão"}
                    </Badge>
                  </div>

                  <Button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim()}
                    size="sm"
                    className="h-7 bg-orange-500 hover:bg-orange-600 text-white gap-1 text-xs px-3"
                  >
                    <Send className="h-3 w-3" />
                    Publicar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts Feed */}
      {filteredPosts.map((post) => {
        const badge = getPostTypeBadge(post.type)
        const isLiked = post.likes?.includes(user?.id || "")
        const totalVotes = post.quizOptions?.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0) || 0

        // Usar a cor de fundo customizada ou padrão do sistema
        const contentBgClass = post.backgroundColor || "bg-muted"

        return (
          <Card key={post.id} className="border-border/50 shadow-sm hover:shadow-md transition-all overflow-hidden bg-card">
            {/* Post Header - Estilo Facebook */}
            <div className="flex items-center justify-between px-4 pt-2 pb-1">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-muted text-foreground font-semibold text-sm">
                    {getInitials(post.authorName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{post.authorName}</span>
                    <Badge variant="outline" className={cn("text-[10px] h-4 gap-0.5 px-1.5", badge.className)}>
                      {badge.icon}
                      {badge.label}
                    </Badge>
                    {/* Mentions Icon */}
                    {!post.sendToAll && post.recipientNames && post.recipientNames.length > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-5 px-1.5 gap-0.5 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10">
                            <AtSign className="h-3 w-3" />
                            <span className="text-[10px]">{post.recipientNames.length}</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2" align="start">
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-medium text-muted-foreground">Mencionados:</p>
                            <div className="flex flex-wrap gap-1">
                              {post.recipientNames.map((name, idx) => (
                                <Badge key={idx} variant="secondary" className="text-[10px] h-4 px-1">
                                  @{name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{formatTimeAgo(post.createdAt)}</span>
                    <span>·</span>
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM5.5 4.002h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1zm2.5 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>
                    </svg>
                  </div>
                </div>
              </div>
              {/* Post Actions Menu */}
              {(post.authorId === user?.id || user?.role === "admin" || user?.role === "master") && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-muted">
                      <MoreVertical className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditPost(post)} className="text-sm">
                      <Pencil className="h-3.5 w-3.5 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeletePost(post.id)}
                      className="text-red-600 focus:text-red-600 text-sm"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Post Content - Estilo Facebook */}
            <div className={cn(
              "min-h-[200px] flex items-center justify-center px-8 py-4 text-center",
              contentBgClass,
              // Se usar cores de gradiente, adicionar texto branco com sombra
              post.backgroundColor && (
                post.backgroundColor.includes("gradient") || 
                post.backgroundColor.includes("500") || 
                post.backgroundColor.includes("600")
              ) && "text-white"
            )}>
              <p className={cn(
                "text-xl font-bold leading-relaxed max-w-md",
                (post.backgroundColor && (
                  post.backgroundColor.includes("gradient") || 
                  post.backgroundColor.includes("500") || 
                  post.backgroundColor.includes("600")
                )) ? "text-white drop-shadow-lg" : "text-foreground"
              )}
                dangerouslySetInnerHTML={{ __html: (post.content || "").replace(/<span class="text-orange-500[^"]*">@[^<]+<\/span>\s*/g, '').replace(/<[^>]*>/g, '') }}
              />
            </div>

            {/* Quiz Options */}
            {post.type === "quiz" && post.quizOptions && (
              <div className="px-4 py-3 space-y-3">
                {post.quizOptions.map((option, index) => {
                  const voteCount = option.votes?.length || 0
                  const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
                  const hasVoted = option.votes?.includes(user?.id || "")
                  const isCorrectAnswer = option.isCorrect
                  const userHasVoted = post.quizOptions?.some((opt) => opt.votes?.includes(user?.id || ""))

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleVote(post.id, option.id)}
                      disabled={userHasVoted}
                      className={cn(
                        "w-full rounded-xl text-left relative overflow-hidden transition-all",
                        userHasVoted && isCorrectAnswer && "ring-2 ring-green-500/60",
                        userHasVoted && hasVoted && !isCorrectAnswer && "ring-2 ring-red-500/60",
                        !userHasVoted && "hover:scale-[1.01] hover:shadow-md"
                      )}
                    >
                      {/* Background progress bar */}
                      <div className="absolute inset-0 bg-muted/30" />
                      <div
                        className={cn(
                          "absolute inset-y-0 left-0 transition-all duration-500",
                          isCorrectAnswer && userHasVoted
                            ? "bg-gradient-to-r from-green-500/40 to-green-500/20"
                            : !isCorrectAnswer && hasVoted && userHasVoted
                              ? "bg-gradient-to-r from-red-500/40 to-red-500/20"
                              : "bg-gradient-to-r from-orange-500/30 to-orange-500/10"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                      
                      {/* Content */}
                      <div className="relative flex items-center p-3 gap-3">
                        {/* Option number badge */}
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                          isCorrectAnswer && userHasVoted
                            ? "bg-green-500 text-white"
                            : !isCorrectAnswer && hasVoted && userHasVoted
                              ? "bg-red-500 text-white"
                              : hasVoted
                                ? "bg-orange-500 text-white"
                                : "bg-muted text-foreground"
                        )}>
                          {index + 1}
                        </div>
                        
                        {/* Option text and status */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn(
                              "font-medium text-sm",
                              hasVoted && "text-foreground"
                            )}>
                              {option.text}
                            </span>
                            {isCorrectAnswer && userHasVoted && (
                              <span className="inline-flex items-center gap-1 bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                                <Check className="h-3 w-3" />
                                Correto
                              </span>
                            )}
                            {!isCorrectAnswer && hasVoted && userHasVoted && (
                              <span className="inline-flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                                <X className="h-3 w-3" />
                                Incorreto
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Percentage */}
                        <div className={cn(
                          "flex-shrink-0 text-sm font-bold",
                          isCorrectAnswer && userHasVoted
                            ? "text-green-500"
                            : !isCorrectAnswer && hasVoted && userHasVoted
                              ? "text-red-500"
                              : "text-muted-foreground"
                        )}>
                          {percentage}%
                        </div>
                      </div>
                    </button>
                  )
                })}
                <p className="text-sm text-muted-foreground text-center pt-1">{totalVotes} votos no total</p>
              </div>
            )}

            {/* Likes and Comments Count - Estilo Facebook */}
            <div className="px-4 py-1 flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                {(post.likes?.length || 0) > 0 && (
                  <>
                    <div className="flex -space-x-1">
                      <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <ThumbsUp className="h-3 w-3 text-white fill-white" />
                      </div>
                    </div>
                    <span className="ml-1">{post.likes?.length}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                {(post.comments?.length || 0) > 0 && (
                  <button 
                    onClick={() => toggleComments(post.id)}
                    className="hover:underline"
                  >
                    {post.comments?.length} comentario{(post.comments?.length || 0) !== 1 ? "s" : ""}
                  </button>
                )}
              </div>
            </div>

            {/* Actions - Estilo Facebook */}
            <div className="px-2 py-0.5 border-t border-border">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(post.id)}
                  className={cn(
                    "flex-1 h-10 gap-2 rounded-md font-semibold",
                    isLiked ? "text-blue-500 hover:bg-blue-500/10" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <ThumbsUp className={cn("h-5 w-5", isLiked && "fill-current")} />
                  Curtir
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleComments(post.id)}
                  className="flex-1 h-10 gap-2 rounded-md text-muted-foreground hover:bg-muted font-semibold"
                >
                  <MessageCircle className="h-5 w-5" />
                  Comentar
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1 h-10 gap-2 rounded-md text-muted-foreground hover:bg-muted font-semibold"
                >
                  <Share2 className="h-5 w-5" />
                  Compartilhar
                </Button>
              </div>
            </div>

            {/* Comments Section - Estilo Facebook */}
            {expandedComments.includes(post.id) && (
              <div className="px-4 pb-2 pt-1 border-t border-border space-y-2">
                {/* Ver mais comentarios */}
                {(post.comments?.length || 0) > 2 && (
                  <button className="text-sm text-muted-foreground hover:underline font-medium">
                    Ver mais comentarios
                  </button>
                )}
                
                {/* Comments List */}
                {post.comments?.slice(-3).map((comment) => (
                  <div key={comment.id} className="flex gap-2 group">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-muted text-foreground font-medium">
                        {getInitials(comment.authorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted rounded-2xl px-3 py-2 inline-block">
                        <span className="font-semibold text-sm text-foreground block">{comment.authorName}</span>
                        <p className="text-sm text-foreground">{comment.content}</p>
                      </div>
                      {/* Comment Actions */}
                      <div className="flex items-center gap-3 mt-1 ml-3 text-xs text-muted-foreground">
                        <span>{formatTimeAgo(new Date(comment.createdAt))}</span>
                        <button className="font-semibold hover:underline">Curtir</button>
                        <button className="font-semibold hover:underline">Responder</button>
                        {(comment.authorId === user?.id || user?.role === "admin" || user?.role === "master") && (
                          <button 
                            onClick={() => handleDeleteComment(comment.id)}
                            className="font-semibold hover:underline text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Add Comment Input */}
                <div className="flex gap-2 pt-2">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="text-xs bg-muted text-foreground font-medium">
                      {getInitials(user?.fullName || user?.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Escreva um comentario..."
                      value={commentInputs[post.id] || ""}
                      onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && handleComment(post.id)}
                      className="w-full bg-muted border-0 rounded-full pr-10 focus-visible:ring-1 focus-visible:ring-blue-500"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleComment(post.id)}
                      disabled={!commentInputs[post.id]?.trim()}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-full text-blue-500 hover:bg-blue-500/10 disabled:opacity-30"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )
      })}

      {filteredPosts.length === 0 && (
        <div className="text-center py-16">
          <div className="p-6 bg-muted rounded-full inline-block mb-4">
            <MessageSquare className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhuma publicacao</h3>
          <p className="text-muted-foreground">Seja o primeiro a compartilhar algo!</p>
        </div>
        )}

        {/* Edit Post Modal */}
        <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-orange-500" />
              Editar Publicacao
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={editPostContent}
              onChange={(e) => setEditPostContent(e.target.value)}
              className="min-h-[150px]"
              placeholder="Edite o conteudo da publicacao..."
            />
            {containsProfanity(editPostContent) && (
              <p className="text-sm text-red-500 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Conteudo contem palavras inadequadas
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPost(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveEditPost}
              disabled={!editPostContent.trim() || containsProfanity(editPostContent)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Admin Panel View
function AdminPanelView({
  user,
  getInitials,
  formatTimeAgo,
}: {
  user: any
  getInitials: (name: string) => string
  formatTimeAgo: (date: Date) => string
}) {
  const [activeTab, setActiveTab] = useState("publicar")

  return (
    <div className="flex gap-6">
      {/* Left Side - Admin Panel with Forms */}
      <div className="flex-1">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-bold">Painel Administrativo</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Gerencie publicacoes, quizzes, feedbacks e estatisticas.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/30 border border-border p-1 mb-4 h-auto flex-wrap">
            <TabsTrigger
              value="publicar"
              className="gap-1.5 text-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <Send className="h-3.5 w-3.5" />
              Publicar
            </TabsTrigger>
            <TabsTrigger
              value="quiz"
              className="gap-1.5 text-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Quiz
            </TabsTrigger>
            <TabsTrigger
              value="feedback"
              className="gap-1.5 text-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Feedback
            </TabsTrigger>
            <TabsTrigger
              value="estatisticas"
              className="gap-1.5 text-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Estatisticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="publicar" className="mt-0">
            <PublishTab user={user} />
          </TabsContent>

          <TabsContent value="quiz">
            <QuizTab user={user} />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackTab user={user} />
          </TabsContent>

          <TabsContent value="estatisticas">
            <StatsTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Side - Stats on top, Questions on bottom */}
      <div className="w-80 shrink-0 flex flex-col gap-4">
        {/* Stats Cards */}
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <BarChart3 className="h-4 w-4" />
            <span>Estatisticas</span>
          </div>
          <AdminStatsCards />
        </div>

        {/* Questions Panel */}
        <div className="flex-1">
          <QuestionsTab getInitials={getInitials} formatTimeAgo={formatTimeAgo} compact />
        </div>
      </div>
    </div>
  )
}

// Publish Tab
function PublishTab({ user }: { user: any }) {
  const [content, setContent] = useState("")
  const [type, setType] = useState<"comunicado" | "recado">("comunicado")
  const [sendToAll, setSendToAll] = useState(true)
  const [selectedOperators, setSelectedOperators] = useState<string[]>([])
  const [isPublishing, setIsPublishing] = useState(false)
  const [backgroundColor, setBackgroundColor] = useState<string>("")
  const { users: allUsers } = useAllUsers()
  const { toast } = useToast()
  
  const operators = allUsers.filter(u => u.role === "operator" && u.isActive)
  
  // Paleta de cores predefinidas
  const colorPalette = [
    { name: "Padrão", value: "", class: "bg-muted" },
    { name: "Branco", value: "bg-white", class: "bg-white border-2" },
    { name: "Laranja", value: "bg-orange-500", class: "bg-orange-500" },
    { name: "Azul", value: "bg-blue-500", class: "bg-blue-500" },
    { name: "Verde", value: "bg-green-500", class: "bg-green-500" },
    { name: "Vermelho", value: "bg-red-500", class: "bg-red-500" },
    { name: "Roxo", value: "bg-purple-500", class: "bg-purple-500" },
    { name: "Rosa", value: "bg-pink-500", class: "bg-pink-500" },
    { name: "Amarelo", value: "bg-yellow-500", class: "bg-yellow-500" },
    { name: "Ciano", value: "bg-cyan-500", class: "bg-cyan-500" },
    { name: "Grad. Laranja", value: "bg-gradient-to-r from-orange-500 to-red-500", class: "bg-gradient-to-r from-orange-500 to-red-500" },
    { name: "Grad. Azul", value: "bg-gradient-to-r from-blue-500 to-cyan-500", class: "bg-gradient-to-r from-blue-500 to-cyan-500" },
    { name: "Grad. Verde", value: "bg-gradient-to-r from-green-500 to-emerald-500", class: "bg-gradient-to-r from-green-500 to-emerald-500" },
    { name: "Grad. Roxo", value: "bg-gradient-to-r from-purple-500 to-pink-500", class: "bg-gradient-to-r from-purple-500 to-pink-500" },
    { name: "Grad. Pôr do Sol", value: "bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600", class: "bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600" },
    { name: "Grad. Oceano", value: "bg-gradient-to-r from-blue-400 via-teal-500 to-green-500", class: "bg-gradient-to-r from-blue-400 via-teal-500 to-green-500" },
    { name: "Grad. Aurora", value: "bg-gradient-to-r from-green-400 via-blue-500 to-purple-600", class: "bg-gradient-to-r from-green-400 via-blue-500 to-purple-600" },
    { name: "Grad. Fogo", value: "bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600", class: "bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600" },
  ]

  const handlePublish = async () => {
    if (!content.trim() || !user) return
    if (!sendToAll && selectedOperators.length === 0) return

    setIsPublishing(true)

    const recipientNames = sendToAll 
      ? [] 
      : selectedOperators.map(id => {
          const op = operators.find(o => o.id === id)
          return op?.fullName || op?.username || "Operador"
        })

    const result = await createQualityPostSupabase({
      type,
      content,
      authorId: user.id,
      authorName: user.fullName || user.username || "Admin",
      recipients: sendToAll ? [] : selectedOperators,
      recipientNames,
      sendToAll,
      backgroundColor: backgroundColor || undefined,
    })

    setIsPublishing(false)

    if (result) {
      toast({
        title: type === "comunicado" ? "Comunicado publicado!" : "Recado publicado!",
        description: "Sua publicacao foi enviada com sucesso para " + (sendToAll ? "todos os operadores" : `${selectedOperators.length} operador(es)`),
      })
      setContent("")
      setSelectedOperators([])
      setBackgroundColor("")
    } else {
      toast({
        title: "Erro ao publicar",
        description: "Ocorreu um erro ao enviar sua publicacao. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const toggleOperator = (operatorId: string) => {
    setSelectedOperators(prev => 
      prev.includes(operatorId) 
        ? prev.filter(id => id !== operatorId)
        : [...prev, operatorId]
    )
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="py-4 px-5">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          {type === "comunicado" ? (
            <Megaphone className="h-4 w-4 text-orange-500" />
          ) : (
            <MessageCircle className="h-4 w-4 text-blue-500" />
          )}
          {type === "comunicado" ? "Novo Comunicado" : "Novo Recado"}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {type === "comunicado" 
            ? "Crie um comunicado oficial para ser exibido aos operadores"
            : "Crie um recado formatado para ser exibido aos operadores"
          }
        </p>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Tipo de Publicacao</Label>
          <Select value={type} onValueChange={(v) => setType(v as "comunicado" | "recado")}>
            <SelectTrigger className="h-9 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comunicado">
                <span className="flex items-center gap-2">
                  <Megaphone className="h-3.5 w-3.5 text-orange-500" />
                  Comunicado
                </span>
              </SelectItem>
              <SelectItem value="recado">
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-3.5 w-3.5 text-blue-500" />
                  Recado
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <RichTextEditorWYSIWYG
          value={content}
          onChange={setContent}
          placeholder={type === "comunicado" 
            ? "Digite o conteudo do comunicado e use as ferramentas de formatacao..." 
            : "Digite o conteudo do recado e use as ferramentas de formatacao..."
          }
        />

        {/* Paleta de Cores de Fundo */}
        <div className="space-y-2">
          <Label className="text-xs font-medium flex items-center gap-2">
            <Paintbrush className="h-3.5 w-3.5" />
            Cor de Fundo da Publicacao
          </Label>
          <div className="grid grid-cols-6 gap-2">
            {colorPalette.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setBackgroundColor(color.value)}
                className={cn(
                  "h-10 rounded-md border-2 transition-all relative group overflow-hidden",
                  backgroundColor === color.value 
                    ? "border-primary ring-2 ring-primary/30 scale-105" 
                    : "border-border hover:border-primary/50 hover:scale-105",
                  color.class
                )}
                title={color.name}
              >
                {backgroundColor === color.value && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="h-4 w-4 rounded-full bg-white flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                  </div>
                )}
                <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                  {color.name}
                </span>
              </button>
            ))}
          </div>
          {backgroundColor && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                <p className="text-xs text-muted-foreground">
                  Cor selecionada: <span className="font-medium text-foreground">{colorPalette.find(c => c.value === backgroundColor)?.name || "Personalizada"}</span>
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setBackgroundColor("")}
                  className="h-6 text-xs"
                >
                  Remover
                </Button>
              </div>
              {/* Preview da publicação com a cor */}
              <div className="border rounded-md overflow-hidden">
                <div className="px-2 py-1 bg-muted/50 border-b">
                  <p className="text-[10px] text-muted-foreground">Preview da Publicacao</p>
                </div>
                <div className={cn(
                  "min-h-[120px] flex items-center justify-center px-4 py-3",
                  backgroundColor,
                  (backgroundColor.includes("gradient") || backgroundColor.includes("500") || backgroundColor.includes("600")) && "text-white"
                )}>
                  <p className={cn(
                    "text-base font-semibold text-center leading-relaxed",
                    (backgroundColor.includes("gradient") || backgroundColor.includes("500") || backgroundColor.includes("600")) 
                      ? "text-white drop-shadow-lg" 
                      : "text-foreground"
                  )}>
                    {content.replace(/<[^>]*>/g, '').substring(0, 100) || "Seu texto aparecera aqui..."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 pt-3 border-t">
          <Label className="text-xs font-medium">Destinatarios</Label>
          <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-md">
            <Checkbox 
              id="sendToAll" 
              checked={sendToAll} 
              onCheckedChange={(checked) => {
                setSendToAll(checked as boolean)
                if (checked) setSelectedOperators([])
              }}
              className="h-4 w-4 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
            />
            <label 
              htmlFor="sendToAll" 
              className="text-sm cursor-pointer flex items-center gap-2"
            >
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              Enviar para todos os operadores
            </label>
          </div>
          
          {/* Operator Selection when not sending to all */}
          {!sendToAll && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Selecione os operadores:</p>
              <ScrollArea className="h-32 border rounded-md p-2">
                <div className="space-y-1">
                  {operators.map(op => (
                    <div 
                      key={op.id} 
                      className={cn(
                        "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                        selectedOperators.includes(op.id) 
                          ? "bg-orange-500/20 border border-orange-500/30" 
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => toggleOperator(op.id)}
                    >
                      <Checkbox 
                        checked={selectedOperators.includes(op.id)}
                        className="h-3.5 w-3.5 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {(op.fullName || op.username || "O").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{op.fullName || op.username}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {selectedOperators.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedOperators.map(id => {
                    const op = operators.find(o => o.id === id)
                    return (
                      <Badge key={id} variant="secondary" className="text-xs gap-1">
                        <AtSign className="h-3 w-3" />
                        {op?.fullName || op?.username}
                        <button 
                          onClick={() => toggleOperator(id)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <Button
          onClick={handlePublish}
          disabled={!content.trim() || (!sendToAll && selectedOperators.length === 0) || isPublishing}
          className="w-full h-10 bg-orange-500 hover:bg-orange-600 text-white font-medium"
        >
          {isPublishing ? (
            <>
              <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Publicando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Publicar {type === "comunicado" ? "Comunicado" : "Recado"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// Quiz Tab
function QuizTab({ user }: { user: any }) {
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const { toast } = useToast()
  
  const addOption = () => setOptions([...options, ""])
  const removeOption = (index: number) => {
  setOptions(options.filter((_, i) => i !== index))
  if (correctOptionIndex === index) {
  setCorrectOptionIndex(null)
  } else if (correctOptionIndex !== null && correctOptionIndex > index) {
  setCorrectOptionIndex(correctOptionIndex - 1)
  }
  }
  const updateOption = (index: number, value: string) => {
  const newOptions = [...options]
  newOptions[index] = value
  setOptions(newOptions)
  }
  
  const handlePublish = async () => {
  if (!question.trim() || options.filter((o) => o.trim()).length < 2 || !user || correctOptionIndex === null) return
  
  setIsPublishing(true)
  
  const timestamp = Date.now()
  const quizOptions = options
  .filter((o) => o.trim())
  .map((text, i) => ({
  id: `opt-${timestamp}-${i}`,
  text,
  votes: [],
  isCorrect: i === correctOptionIndex
  }))
  
  const result = await createQualityPostSupabase({
  type: "quiz",
  content: question,
  authorId: user.id,
  authorName: user.fullName || user.username || "Admin",
  quizOptions,
  })
  
  setIsPublishing(false)
  
  if (result) {
    toast({
      title: "Quiz publicado!",
      description: "Seu quiz foi enviado com sucesso para todos os operadores.",
    })
    setQuestion("")
    setOptions(["", ""])
    setCorrectOptionIndex(null)
  } else {
    toast({
      title: "Erro ao publicar quiz",
      description: "Ocorreu um erro ao enviar o quiz. Tente novamente.",
      variant: "destructive",
    })
  }
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <Label>Pergunta do Quiz</Label>
          <Input
            placeholder="Digite a pergunta..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Opcoes (clique no circulo para marcar a resposta correta)</Label>
          {options.map((option, index) => (
            <div key={index} className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => setCorrectOptionIndex(index)}
                className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                  correctOptionIndex === index 
                    ? "border-green-500 bg-green-500 text-white" 
                    : "border-muted-foreground/30 hover:border-green-500/50"
                )}
                title={correctOptionIndex === index ? "Resposta correta" : "Marcar como correta"}
              >
                {correctOptionIndex === index && <Check className="h-4 w-4" />}
              </button>
              <Input
                placeholder={`Opcao ${index + 1}`}
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                className={cn(correctOptionIndex === index && "border-green-500/50 bg-green-500/5")}
              />
              {options.length > 2 && (
                <Button variant="ghost" size="icon" onClick={() => removeOption(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addOption} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Opcao
          </Button>
          {correctOptionIndex === null && options.some(o => o.trim()) && (
            <p className="text-sm text-amber-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Selecione qual e a resposta correta
            </p>
          )}
        </div>

        <Button
          onClick={handlePublish}
          disabled={!question.trim() || options.filter((o) => o.trim()).length < 2 || correctOptionIndex === null || isPublishing}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
        >
          {isPublishing ? (
            <>
              <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Publicando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Publicar Quiz
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// Feedback Tab
function FeedbackTab({ user }: { user: any }) {
  const [selectedOperator, setSelectedOperator] = useState("")
  const [feedbackType, setFeedbackType] = useState<"positive" | "negative">("positive")
  const [details, setDetails] = useState("")
  const { users: operators } = useAllUsers()

  const filteredOperators = operators.filter((u) => u.role === "operator")

  const handleSubmit = async () => {
    if (!selectedOperator || !details.trim() || !user) return

    const operator = filteredOperators.find((o) => o.id === selectedOperator)
    await createFeedbackSupabase({
      operatorId: selectedOperator,
      operatorName: operator?.fullName || operator?.username || "Operador",
      createdBy: user.id,
      createdByName: user.fullName || user.username || "Admin",
      feedbackType,
      details,
      score: feedbackType === "positive" ? 80 : 40,
    })

    setSelectedOperator("")
    setDetails("")
    setFeedbackType("positive")
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <Label>Operador</Label>
          <Select value={selectedOperator} onValueChange={setSelectedOperator}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o operador" />
            </SelectTrigger>
            <SelectContent>
              {filteredOperators.map((op) => (
                <SelectItem key={op.id} value={op.id}>
                  {op.fullName || op.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tipo de Feedback</Label>
          <div className="flex gap-2">
            <Button
              variant={feedbackType === "positive" ? "default" : "outline"}
              onClick={() => setFeedbackType("positive")}
              className={cn(
                "flex-1 gap-2",
                feedbackType === "positive" && "bg-green-500 hover:bg-green-600 text-white"
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              Positivo
            </Button>
            <Button
              variant={feedbackType === "negative" ? "default" : "outline"}
              onClick={() => setFeedbackType("negative")}
              className={cn(
                "flex-1 gap-2",
                feedbackType === "negative" && "bg-red-500 hover:bg-red-600 text-white"
              )}
            >
              <AlertCircle className="h-4 w-4" />
              Negativo
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Detalhes</Label>
          <Textarea
            placeholder="Descreva o feedback..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!selectedOperator || !details.trim()}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
        >
          <Send className="h-4 w-4 mr-2" />
          Enviar Feedback
        </Button>
      </CardContent>
    </Card>
  )
}

// Questions Tab with realtime answer functionality (ADMIN VIEW)
function QuestionsTab({
  getInitials,
  formatTimeAgo,
  compact = false,
}: {
  getInitials: (name: string) => string
  formatTimeAgo: (date: Date) => string
  compact?: boolean
}) {
  const { user } = useAuth()
  const { questions, loading } = useAdminQuestions()
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [isSecondReply, setIsSecondReply] = useState(false)
  const [viewMode, setViewMode] = useState<"pending" | "all">("pending")
  
  // Filter questions that need attention:
  // 1. No reply yet
  // 2. Has reply but operator marked as not understood and no second reply yet
  const pendingQuestions = questions.filter((q) => 
    !q.reply || 
    (q.understood === false && !q.secondReply && !q.needsInPersonFeedback)
  )
  
  const answeredQuestions = questions.filter((q) => 
    q.reply && (q.understood === true || q.needsInPersonFeedback || q.secondReply)
  )
  
  const displayQuestions = viewMode === "pending" ? pendingQuestions : questions

  const handleReply = async (questionId: string, isSecond: boolean = false) => {
    if (!replyText.trim() || !user) return
    
    // Check profanity in reply
    if (containsProfanity(replyText)) {
      alert(getProfanityWarning())
      return
    }
    
    if (isSecond) {
      await answerAdminQuestionSecond(
        questionId,
        replyText,
        user.id,
        user.fullName || user.username || "Admin"
      )
    } else {
      await answerAdminQuestion(
        questionId,
        replyText,
        user.id,
        user.fullName || user.username || "Admin"
      )
    }
    
    setReplyText("")
    setReplyingTo(null)
    setIsSecondReply(false)
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {!compact && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-xl bg-orange-500/20 mb-2">
                <HelpCircle className="h-5 w-5 text-orange-500" />
              </div>
              <span className="text-2xl font-bold">{pendingQuestions.length}</span>
              <span className="text-xs text-muted-foreground">Pendentes</span>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-xl bg-green-500/20 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <span className="text-2xl font-bold">{answeredQuestions.length}</span>
              <span className="text-xs text-muted-foreground">Respondidas</span>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-xl bg-blue-500/20 mb-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
              <span className="text-2xl font-bold">{questions.length}</span>
              <span className="text-xs text-muted-foreground">Total</span>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-xl bg-yellow-500/20 mb-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              </div>
              <span className="text-2xl font-bold">{questions.filter(q => q.needsInPersonFeedback).length}</span>
              <span className="text-xs text-muted-foreground">Feedback Presencial</span>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className={compact ? "border-orange-500/30 border-dashed border-2 bg-card/30" : ""}>
        <CardHeader className={compact ? "py-3 px-4" : "pb-4"}>
          <div className="flex items-center justify-between">
            <CardTitle className={`flex items-center gap-2 ${compact ? "text-sm" : "text-lg"}`}>
              <HelpCircle className={`text-orange-500 ${compact ? "h-4 w-4" : "h-5 w-5"}`} />
              Perguntas dos Operadores
              {pendingQuestions.length > 0 && (
                <Badge className="bg-orange-500 text-white ml-1 text-xs">{pendingQuestions.length}</Badge>
              )}
            </CardTitle>
            {!compact && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={viewMode === "pending" ? "default" : "ghost"}
                  onClick={() => setViewMode("pending")}
                  className={cn("h-7 text-xs", viewMode === "pending" && "bg-orange-500 hover:bg-orange-600")}
                >
                  Pendentes ({pendingQuestions.length})
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "all" ? "default" : "ghost"}
                  onClick={() => setViewMode("all")}
                  className={cn("h-7 text-xs", viewMode === "all" && "bg-orange-500 hover:bg-orange-600")}
                >
                  Todas ({questions.length})
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      <CardContent className={compact ? "px-4 pb-4 pt-0" : "p-6 pt-0"}>
        {displayQuestions.length === 0 ? (
          <div className={`text-center ${compact ? "py-6" : "py-12"}`}>
            <div className={`bg-muted/50 rounded-full inline-block mb-3 ${compact ? "p-3" : "p-6"}`}>
              <HelpCircle className={`text-muted-foreground ${compact ? "h-6 w-6" : "h-12 w-12"}`} />
            </div>
            <h3 className={`font-semibold mb-1 ${compact ? "text-sm" : "text-xl"}`}>Nenhuma pergunta</h3>
            <p className={`text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}>
              {viewMode === "pending" ? "Nenhuma pergunta pendente" : "Nenhuma pergunta recebida"}
            </p>
          </div>
        ) : (
          <ScrollArea className={compact ? "h-[300px]" : "max-h-[500px]"}>
            <div className="space-y-3">
              {displayQuestions.map((question) => {
                const isPending = !question.reply || (question.understood === false && !question.secondReply && !question.needsInPersonFeedback)
                
                return (
                <div key={question.id} className={cn(
                  "border rounded-lg",
                  compact ? "p-3" : "p-4",
                  isPending 
                    ? "border-orange-500/30 bg-orange-500/5" 
                    : "border-border bg-background/50"
                )}>
                  <div className="flex items-start gap-2">
                    <Avatar className={`bg-orange-100 dark:bg-orange-900/50 ${compact ? "h-7 w-7" : "h-10 w-10"}`}>
                      <AvatarFallback className={`text-orange-600 dark:text-orange-300 ${compact ? "text-[10px]" : "text-sm"}`}>
                        {getInitials(question.authorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold ${compact ? "text-xs" : ""}`}>{question.authorName}</span>
                        <span className={`text-muted-foreground ${compact ? "text-[10px]" : "text-sm"}`}>
                          {formatTimeAgo(new Date(question.createdAt))}
                        </span>
                        {/* Status badges */}
                        {question.understood === true && (
                          <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-[10px]">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Resolvido
                          </Badge>
                        )}
                        {question.needsInPersonFeedback && (
                          <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-[10px]">
                            Feedback Presencial
                          </Badge>
                        )}
                      </div>
                      <p className={`mt-1 text-foreground ${compact ? "text-xs" : ""}`}>
                        {question.question}
                      </p>

                      {/* Show previous reply if operator didn't understand */}
                      {question.understood === false && question.reply && !question.secondReply && (
                        <div className={`mt-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/30 ${compact ? "text-xs" : "text-sm"}`}>
                          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">Operador nao entendeu a resposta</span>
                          </div>
                          <p className="text-muted-foreground mt-1">Sua resposta: {question.reply}</p>
                        </div>
                      )}
                      
                      {/* Show answered status for resolved questions */}
                      {question.reply && question.understood !== false && (
                        <div className={`mt-2 p-2 bg-green-500/10 rounded border border-green-500/30 ${compact ? "text-xs" : "text-sm"}`}>
                          <p className="text-muted-foreground">
                            <span className="font-medium text-green-600">Sua resposta:</span> {question.reply}
                          </p>
                          {question.secondReply && (
                            <p className="text-muted-foreground mt-1">
                              <span className="font-medium text-green-600">2a resposta:</span> {question.secondReply}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {isPending && (
                        replyingTo === question.id ? (
                          <div className="mt-2 space-y-2">
                            <div className="relative">
                              <Textarea
                                placeholder={isSecondReply ? "Digite uma nova resposta mais detalhada..." : "Digite sua resposta..."}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className={compact ? "text-xs min-h-[60px] pr-10" : "min-h-[80px] pr-10"}
                              />
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-2 h-7 w-7"
                                  >
                                    <Smile className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-72" align="end">
                                  <div className="grid grid-cols-8 gap-1">
                                    {EMOJI_LIST_CHAT.map((emoji, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => setReplyText(prev => prev + emoji)}
                                        className="text-xl hover:bg-accent rounded p-1 transition-colors"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleReply(question.id, isSecondReply)}
                                disabled={!replyText.trim()}
                                className="h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white"
                              >
                                <Send className="h-3 w-3 mr-1" />
                                {isSecondReply ? "Enviar Nova Resposta" : "Enviar"}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setReplyingTo(null)
                                  setReplyText("")
                                  setIsSecondReply(false)
                                }}
                                className="h-7 text-xs"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReplyingTo(question.id)
                                setIsSecondReply(question.understood === false && !!question.reply)
                              }}
                              className="h-7 text-xs border-orange-500/50 text-orange-600 hover:bg-orange-500/10"
                            >
                              {question.understood === false && question.reply ? "Responder Novamente" : "Responder"}
                            </Button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
    </div>
  )
}

// Stats Tab with realtime
function StatsTab() {
  const { stats } = useQualityStats()
  const { users: allUsers } = useAllUsers()
  
  const onlineCount = allUsers.filter((u) => u.role === "operator" && u.isOnline).length

  const statCards = [
    { label: "Publicacoes", value: stats.totalPosts, icon: <MessageSquare className="h-6 w-6" />, color: "blue" },
    { label: "Curtidas", value: stats.totalLikes, icon: <ThumbsUp className="h-6 w-6" />, color: "orange" },
    { label: "Comentarios", value: stats.totalComments, icon: <MessageCircle className="h-6 w-6" />, color: "green" },
    { label: "Usuarios", value: stats.totalUsers, icon: <Users className="h-6 w-6" />, color: "purple" },
    { label: "Online Agora", value: onlineCount, icon: <TrendingUp className="h-6 w-6" />, color: "emerald" },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4 text-center">
            <div
              className={cn(
                "p-3 rounded-xl inline-block mb-3",
                stat.color === "blue" && "bg-blue-500/10 text-blue-500",
                stat.color === "orange" && "bg-orange-500/10 text-orange-500",
                stat.color === "green" && "bg-green-500/10 text-green-500",
                stat.color === "purple" && "bg-purple-500/10 text-purple-500",
                stat.color === "emerald" && "bg-emerald-500/10 text-emerald-500"
              )}
            >
              {stat.icon}
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Admin Stats Cards - Compact version for sidebar with realtime
function AdminStatsCards() {
  const { stats, loading } = useQualityStats()
  const { users: allUsers } = useAllUsers()
  
  const onlineCount = allUsers.filter((u) => u.role === "operator" && u.isOnline).length

  const statCards = [
    { label: "Publicacoes", value: stats.totalPosts, icon: MessageSquare, color: "bg-blue-500/20", iconColor: "text-blue-400" },
    { label: "Curtidas", value: stats.totalLikes, icon: ThumbsUp, color: "bg-yellow-500/20", iconColor: "text-yellow-400" },
    { label: "Comentarios", value: stats.totalComments, icon: MessageCircle, color: "bg-green-500/20", iconColor: "text-green-400" },
    { label: "Usuarios", value: stats.totalUsers, icon: Users, color: "bg-purple-500/20", iconColor: "text-purple-400" },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-border/50 bg-card/30 hover:bg-card/50 transition-colors">
            <CardContent className="p-3 flex flex-col items-center justify-center text-center">
              <div className={`p-2 rounded-lg ${stat.color} mb-1.5`}>
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
              <span className="text-lg font-bold">{stat.value}</span>
              <span className="text-[10px] text-muted-foreground">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Online Now Card */}
      <Card className="border-border/50 bg-card/30">
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <TrendingUp className="h-4 w-4 text-orange-400" />
            </div>
            <span className="text-xs text-muted-foreground">Online Agora</span>
          </div>
          <span className="text-2xl font-bold text-orange-500">{onlineCount}</span>
        </CardContent>
      </Card>
    </div>
  )
}

// Operator Questions View - Chat com Qualidade (Monitoria)
function OperatorQuestionsView({
  user,
  getInitials,
  formatTimeAgo,
  allUsers,
}: {
  user: any
  getInitials: (name: string) => string
  formatTimeAgo: (date: Date) => string
  allUsers: any[]
}) {
  const [selectedMonitor, setSelectedMonitor] = useState<any | null>(null)
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string
    senderId: string
    senderName: string
    content: string
    createdAt: Date
    isFromOperator: boolean
    isEdited?: boolean
    editedAt?: Date
    replyTo?: {
      messageId: string
      senderName: string
      content: string
    }
  }>>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [replyingTo, setReplyingTo] = useState<any | null>(null)
  const [editingMessage, setEditingMessage] = useState<any | null>(null)
  const [editText, setEditText] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Filter only quality monitors (adminType === "qualidade" or username starts with "Monitoria")
  const monitors = useMemo(() => {
    return allUsers.filter((u) => 
      u.role === "admin" && 
      (u.adminType === "qualidade" || u.username?.toLowerCase().startsWith("monitoria"))
    )
  }, [allUsers])

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  // Load chat messages when monitor is selected and setup realtime subscription
  useEffect(() => {
    if (selectedMonitor && user) {
      loadChatMessages()
      
      // Setup realtime subscription for new messages
      const supabase = createClient()
      const channel = supabase
        .channel(`quality_chat_${user.id}_${selectedMonitor.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'quality_chat_messages',
          },
          (payload) => {
            // Reload messages on any change
            loadChatMessages()
          }
        )
        .subscribe()
      
      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedMonitor, user])

  const loadChatMessages = async () => {
    if (!selectedMonitor || !user) return
    setIsLoading(true)
    try {
      const supabase = createClient()
      
      let query = supabase.from("quality_chat_messages").select("*")
      
      // Se for o Grupo Geral da Qualidade, busca todas as mensagens enviadas para "general-quality"
      // Se for um monitor específico, busca apenas o chat privado
      if (selectedMonitor.id === "general-quality") {
        // Grupo Geral: mostra todas as mensagens onde recipient_id = "general-quality"
        query = query.eq("recipient_id", "general-quality")
      } else {
        // Chat privado: mostra apenas mensagens entre operador e monitor específico
        // Exclui mensagens do grupo geral
        query = query
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${selectedMonitor.id}),and(sender_id.eq.${selectedMonitor.id},recipient_id.eq.${user.id})`)
          .neq("recipient_id", "general-quality")
      }
      
      const { data, error } = await query.order("created_at", { ascending: true })

      if (!error && data) {
        setChatMessages(data.map((m: any) => ({
          id: m.id,
          senderId: m.sender_id,
          senderName: m.sender_name,
          content: m.content,
          createdAt: new Date(m.created_at),
          isFromOperator: m.sender_id === user.id,
          isEdited: m.is_edited,
          editedAt: m.edited_at ? new Date(m.edited_at) : undefined,
          replyTo: m.reply_to_id ? {
            messageId: m.reply_to_id,
            senderName: m.reply_to_sender_name || "",
            content: m.reply_to_content || "",
          } : undefined,
        })))
      }
    } catch (error) {
      console.error("Error loading chat messages:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedMonitor || !user) return

    // Check for profanity
    if (containsProfanity(newMessage)) {
      toast({
        title: "Mensagem bloqueada",
        description: getProfanityWarning(),
        variant: "destructive",
      })
      return
    }

    const messageContent = newMessage.trim()
    setNewMessage("")

    // Add optimistic message
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      senderId: user.id,
      senderName: user.fullName || user.username,
      content: messageContent,
      createdAt: new Date(),
      isFromOperator: true,
      replyTo: replyingTo ? {
        messageId: replyingTo.id,
        senderName: replyingTo.senderName,
        content: replyingTo.content.substring(0, 100),
      } : undefined,
    }
    setChatMessages(prev => [...prev, optimisticMsg])
    setReplyingTo(null)

    try {
      const supabase = createClient()
      const insertData: any = {
        sender_id: user.id,
        sender_name: user.fullName || user.username,
        recipient_id: selectedMonitor.id,
        recipient_name: selectedMonitor.fullName || selectedMonitor.username,
        content: messageContent,
        is_read: false,
      }

      if (replyingTo) {
        insertData.reply_to_id = replyingTo.id
        insertData.reply_to_sender_name = replyingTo.senderName
        insertData.reply_to_content = replyingTo.content.substring(0, 100)
      }

      const { error } = await supabase
        .from("quality_chat_messages")
        .insert(insertData)

      if (error) throw error

      toast({
        title: "Mensagem enviada",
        description: `Sua mensagem foi enviada para ${selectedMonitor.fullName || selectedMonitor.username}`,
      })

      // Reload messages to get the real one
      loadChatMessages()
    } catch (error) {
      console.error("Error sending message:", error)
      // Remove optimistic message on error
      setChatMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
      toast({
        title: "Erro ao enviar",
        description: "Nao foi possivel enviar a mensagem. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!newContent.trim()) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("quality_chat_messages")
        .update({
          content: newContent.trim(),
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq("id", messageId)

      if (error) throw error

      setEditingMessage(null)
      setEditText("")
      loadChatMessages()
      toast({
        title: "Mensagem editada",
        description: "Sua mensagem foi atualizada com sucesso.",
      })
    } catch (error) {
      console.error("Error editing message:", error)
      toast({
        title: "Erro ao editar",
        description: "Nao foi possivel editar a mensagem.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta mensagem?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("quality_chat_messages")
        .delete()
        .eq("id", messageId)

      if (error) throw error

      loadChatMessages()
      toast({
        title: "Mensagem excluida",
        description: "A mensagem foi removida com sucesso.",
      })
    } catch (error) {
      console.error("Error deleting message:", error)
      toast({
        title: "Erro ao excluir",
        description: "Nao foi possivel excluir a mensagem.",
        variant: "destructive",
      })
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    if (editingMessage) {
      setEditText(prev => prev + emoji)
    } else {
      setNewMessage(prev => prev + emoji)
    }
    setShowEmojiPicker(false)
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-orange-500",
      "bg-amber-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-pink-500",
      "bg-rose-500",
    ]
    const index = (name?.charCodeAt(0) || 0) % colors.length
    return colors[index]
  }

  // Chat view when a monitor is selected
  if (selectedMonitor) {
    return (
      <div className="max-w-3xl mx-auto h-[calc(100vh-200px)] flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-card rounded-t-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedMonitor(null)
              setChatMessages([])
            }}
            className="mr-2"
          >
            <X className="h-4 w-4" />
          </Button>
          <Avatar className="h-10 w-10 border-2 border-orange-500">
            <AvatarFallback className={cn(getAvatarColor(selectedMonitor.fullName || ""), "text-white font-semibold")}>
              {getInitials(selectedMonitor.fullName || selectedMonitor.username)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">{selectedMonitor.fullName || selectedMonitor.username}</p>
            <div className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", selectedMonitor.isOnline ? "bg-green-500" : "bg-gray-400")} />
              <span className="text-xs text-muted-foreground">
                {selectedMonitor.isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
          <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30">
            Qualidade
          </Badge>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            </div>
          ) : chatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">Nenhuma mensagem ainda</p>
              <p className="text-xs">Envie uma mensagem para iniciar a conversa</p>
            </div>
          ) : (
            chatMessages.map((msg) => {
              const isEditing = editingMessage?.id === msg.id
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2 max-w-[80%] group",
                    msg.isFromOperator ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={cn(
                      getAvatarColor(msg.senderName),
                      "text-white text-xs font-medium"
                    )}>
                      {getInitials(msg.senderName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2",
                        msg.isFromOperator
                          ? "bg-orange-500 text-white rounded-br-md"
                          : "bg-card border border-border rounded-bl-md"
                      )}
                    >
                      {/* Reply indicator */}
                      {msg.replyTo && (
                        <div className={cn(
                          "mb-2 p-2 rounded border-l-2 text-xs",
                          msg.isFromOperator
                            ? "bg-orange-600/50 border-white/50"
                            : "bg-muted/50 border-muted-foreground/50"
                        )}>
                          <p className="font-semibold">{msg.replyTo.senderName}</p>
                          <p className="opacity-80 line-clamp-1">{msg.replyTo.content}</p>
                        </div>
                      )}
                      
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="bg-white/10 border-white/30 text-white"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEditMessage(msg.id, editText)}
                              className="h-7 bg-green-500 hover:bg-green-600 text-white"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingMessage(null)
                                setEditText("")
                              }}
                              className="h-7 text-white hover:bg-white/20"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          "text-[10px]",
                          msg.isFromOperator ? "text-orange-100" : "text-muted-foreground"
                        )}>
                          {format(msg.createdAt, "HH:mm", { locale: ptBR })}
                        </span>
                        {msg.isEdited && (
                          <span className={cn(
                            "text-[10px] italic",
                            msg.isFromOperator ? "text-orange-200" : "text-muted-foreground"
                          )}>
                            editada
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Message actions */}
                    {!isEditing && (
                      <div className={cn(
                        "flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                        msg.isFromOperator ? "justify-end" : "justify-start"
                      )}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingTo(msg)}
                          className="h-6 px-2 text-xs"
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Responder
                        </Button>
                        {msg.isFromOperator && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingMessage(msg)
                                setEditText(msg.content)
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="h-6 px-2 text-xs text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Excluir
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-border bg-card rounded-b-lg space-y-2">
          {/* Reply indicator */}
          {replyingTo && (
            <div className="bg-muted p-2 rounded-lg flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Reply className="h-3 w-3" />
                  <p className="text-xs font-semibold">Respondendo a {replyingTo.senderName}</p>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{replyingTo.content}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setReplyingTo(null)}
                className="h-6 w-6 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="flex gap-2">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                className="flex-1"
              />
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72" align="end">
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJI_LIST_CHAT.map((emoji, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-xl hover:bg-accent rounded p-1 transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Monitor list view
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
        <h2 className="text-2xl font-bold text-foreground">Chat com a Qualidade</h2>
        <p className="text-muted-foreground text-sm">Envie mensagens diretamente para a equipe de qualidade</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Shield className="h-3.5 w-3.5" />
          {monitors.length} monitor(es)
        </Badge>
      </div>

      {/* General Group Card */}
      <Card 
        className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-500/5 to-transparent"
        onClick={() => setSelectedMonitor({ id: "general-quality", fullName: "Grupo Geral - Qualidade", username: "general-quality", isOnline: true })}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-full">
              <Shield className="h-6 w-6 text-orange-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Grupo Geral</h3>
              <p className="text-sm text-muted-foreground">Mensagem para toda a equipe de qualidade</p>
            </div>
            <Badge className="bg-orange-500 text-white">
              {monitors.length} membros
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-border" />
        <span className="text-xs text-muted-foreground font-medium">ou escolha um monitor</span>
        <div className="flex-1 border-t border-border" />
      </div>

      {/* Monitors List */}
      {monitors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Shield className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum monitor disponivel</h3>
            <p className="text-muted-foreground text-sm text-center">
              Nao ha monitores de qualidade cadastrados no sistema.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {monitors.map((monitor) => (
            <Card
              key={monitor.id}
              className="cursor-pointer hover:shadow-md transition-all hover:border-orange-500/50"
              onClick={() => setSelectedMonitor(monitor)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-border">
                    <AvatarFallback className={cn(getAvatarColor(monitor.fullName || ""), "text-white font-semibold")}>
                      {getInitials(monitor.fullName || monitor.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">{monitor.fullName || monitor.username}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "h-2 w-2 rounded-full",
                        monitor.isOnline ? "bg-green-500" : "bg-gray-400"
                      )} />
                      <span className="text-xs text-muted-foreground">
                        {monitor.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600 hover:bg-orange-500/10">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Conversar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Monitoria Operation Chat View - Chat com a Operacao (para monitoria ver mensagens dos operadores)
function MonitoriaOperationChatView({
  user,
  getInitials,
  formatTimeAgo,
  allUsers,
}: {
  user: any
  getInitials: (name: string) => string
  formatTimeAgo: (date: Date) => string
  allUsers: any[]
}) {
  const [selectedOperator, setSelectedOperator] = useState<any | null>(null)
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string
    senderId: string
    senderName: string
    content: string
    createdAt: Date
    isFromOperator: boolean
    isEdited?: boolean
    editedAt?: Date
    replyTo?: {
      messageId: string
      senderName: string
      content: string
    }
  }>>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [replyingTo, setReplyingTo] = useState<any | null>(null)
  const [editingMessage, setEditingMessage] = useState<any | null>(null)
  const [editText, setEditText] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [operatorsWithMessages, setOperatorsWithMessages] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Filter only operators
  const operators = useMemo(() => {
    return allUsers.filter((u) => u.role === "operator")
  }, [allUsers])

  // Load operators who have sent messages to this monitor
  useEffect(() => {
    if (user) {
      loadOperatorsWithMessages()
    }
  }, [user])

  const loadOperatorsWithMessages = async () => {
    if (!user) return
    try {
      const supabase = createClient()
      // Get distinct senders who sent messages to this monitor
      const { data, error } = await supabase
        .from("quality_chat_messages")
        .select("sender_id, sender_name")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })

      if (!error && data) {
        // Get unique operators with their latest info
        const uniqueOperators = new Map()
        data.forEach((m: any) => {
          if (!uniqueOperators.has(m.sender_id)) {
            const operatorInfo = operators.find(o => o.id === m.sender_id) || {
              id: m.sender_id,
              fullName: m.sender_name,
              username: m.sender_name,
              isOnline: false,
            }
            uniqueOperators.set(m.sender_id, operatorInfo)
          }
        })
        setOperatorsWithMessages(Array.from(uniqueOperators.values()))
      }
    } catch (error) {
      console.error("Error loading operators with messages:", error)
    }
  }

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  // Load chat messages when operator is selected and setup realtime subscription
  useEffect(() => {
    if (selectedOperator && user) {
      loadChatMessages()
      
      // Setup realtime subscription for new messages
      const supabase = createClient()
      const channel = supabase
        .channel(`monitoria_chat_${user.id}_${selectedOperator.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'quality_chat_messages',
          },
          (payload) => {
            // Reload messages on any change
            loadChatMessages()
            loadOperatorsWithMessages()
          }
        )
        .subscribe()
      
      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedOperator, user])

  const loadChatMessages = async () => {
    if (!selectedOperator || !user) return
    setIsLoading(true)
    try {
      const supabase = createClient()
      
      let query = supabase.from("quality_chat_messages").select("*")
      
      // Se for o Grupo Geral de Operadores, busca todas as mensagens enviadas para "general-operation"
      // Se for um operador específico, busca apenas o chat privado
      if (selectedOperator.id === "general-operation") {
        // Grupo Geral: mostra todas as mensagens onde recipient_id = "general-operation"
        query = query.eq("recipient_id", "general-operation")
      } else {
        // Chat privado: mostra apenas mensagens entre monitor e operador específico
        // Exclui mensagens do grupo geral
        query = query
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${selectedOperator.id}),and(sender_id.eq.${selectedOperator.id},recipient_id.eq.${user.id})`)
          .neq("recipient_id", "general-operation")
      }
      
      const { data, error } = await query.order("created_at", { ascending: true })

      if (!error && data) {
        setChatMessages(data.map((m: any) => ({
          id: m.id,
          senderId: m.sender_id,
          senderName: m.sender_name,
          content: m.content,
          createdAt: new Date(m.created_at),
          isFromOperator: m.sender_id === selectedOperator.id,
          isEdited: m.is_edited,
          editedAt: m.edited_at ? new Date(m.edited_at) : undefined,
          replyTo: m.reply_to_id ? {
            messageId: m.reply_to_id,
            senderName: m.reply_to_sender_name || "",
            content: m.reply_to_content || "",
          } : undefined,
        })))
      }
    } catch (error) {
      console.error("Error loading chat messages:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedOperator || !user) return

    // Check for profanity
    if (containsProfanity(newMessage)) {
      toast({
        title: "Mensagem bloqueada",
        description: getProfanityWarning(),
        variant: "destructive",
      })
      return
    }

    const messageContent = newMessage.trim()
    setNewMessage("")

    // Add optimistic message
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      senderId: user.id,
      senderName: user.fullName || user.username,
      content: messageContent,
      createdAt: new Date(),
      isFromOperator: false,
      replyTo: replyingTo ? {
        messageId: replyingTo.id,
        senderName: replyingTo.senderName,
        content: replyingTo.content.substring(0, 100),
      } : undefined,
    }
    setChatMessages(prev => [...prev, optimisticMsg])
    setReplyingTo(null)

    try {
      const supabase = createClient()
      const insertData: any = {
        sender_id: user.id,
        sender_name: user.fullName || user.username,
        recipient_id: selectedOperator.id,
        recipient_name: selectedOperator.fullName || selectedOperator.username,
        content: messageContent,
        is_read: false,
      }

      if (replyingTo) {
        insertData.reply_to_id = replyingTo.id
        insertData.reply_to_sender_name = replyingTo.senderName
        insertData.reply_to_content = replyingTo.content.substring(0, 100)
      }

      const { error } = await supabase
        .from("quality_chat_messages")
        .insert(insertData)

      if (error) throw error

      toast({
        title: "Mensagem enviada",
        description: `Sua mensagem foi enviada para ${selectedOperator.fullName || selectedOperator.username}`,
      })

      // Reload messages to get the real one
      loadChatMessages()
    } catch (error) {
      console.error("Error sending message:", error)
      // Remove optimistic message on error
      setChatMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
      toast({
        title: "Erro ao enviar",
        description: "Nao foi possivel enviar a mensagem. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!newContent.trim()) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("quality_chat_messages")
        .update({
          content: newContent.trim(),
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq("id", messageId)

      if (error) throw error

      setEditingMessage(null)
      setEditText("")
      loadChatMessages()
      toast({
        title: "Mensagem editada",
        description: "Sua mensagem foi atualizada com sucesso.",
      })
    } catch (error) {
      console.error("Error editing message:", error)
      toast({
        title: "Erro ao editar",
        description: "Nao foi possivel editar a mensagem.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta mensagem?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("quality_chat_messages")
        .delete()
        .eq("id", messageId)

      if (error) throw error

      loadChatMessages()
      toast({
        title: "Mensagem excluida",
        description: "A mensagem foi removida com sucesso.",
      })
    } catch (error) {
      console.error("Error deleting message:", error)
      toast({
        title: "Erro ao excluir",
        description: "Nao foi possivel excluir a mensagem.",
        variant: "destructive",
      })
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    if (editingMessage) {
      setEditText(prev => prev + emoji)
    } else {
      setNewMessage(prev => prev + emoji)
    }
    setShowEmojiPicker(false)
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-orange-500",
      "bg-amber-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-pink-500",
      "bg-rose-500",
    ]
    const index = (name?.charCodeAt(0) || 0) % colors.length
    return colors[index]
  }

  // Chat view when an operator is selected
  if (selectedOperator) {
    return (
      <div className="max-w-3xl mx-auto h-[calc(100vh-200px)] flex flex-col bg-[#1a1a1a] rounded-lg overflow-hidden">
        {/* Chat Header - Similar ao print */}
        <div className="flex items-center gap-3 p-4 border-b border-border/30 bg-[#1a1a1a]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedOperator(null)
              setChatMessages([])
              setReplyingTo(null)
              setEditingMessage(null)
            }}
            className="text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
          <Avatar className="h-10 w-10 border-2 border-pink-500">
            <AvatarFallback className="bg-pink-500 text-white font-semibold">
              {getInitials(selectedOperator.fullName || selectedOperator.username)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-white">{selectedOperator.fullName || selectedOperator.username}</p>
            <div className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", selectedOperator.isOnline ? "bg-green-500" : "bg-gray-400")} />
              <span className="text-xs text-gray-400">
                {selectedOperator.isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
          <Badge className="bg-transparent text-gray-400 border border-gray-600">
            Qualidade
          </Badge>
        </div>

        {/* Chat Messages - Estilo do print com fundo escuro */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#1a1a1a]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            </div>
          ) : chatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <MessageCircle className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">Nenhuma mensagem ainda</p>
              <p className="text-xs">O operador ainda nao enviou mensagens</p>
            </div>
          ) : (
            chatMessages.map((msg) => {
              const isEditing = editingMessage?.id === msg.id
              const isMyMessage = !msg.isFromOperator // Mensagens da monitoria
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2 max-w-[80%] group",
                    isMyMessage ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={cn(
                      "text-white text-xs font-medium",
                      msg.isFromOperator ? "bg-orange-500" : "bg-pink-500"
                    )}>
                      {msg.isFromOperator ? "O" : getInitials(msg.senderName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2",
                        isMyMessage
                          ? "bg-orange-500 text-white rounded-br-md"
                          : "bg-orange-500 text-white rounded-bl-md"
                      )}
                    >
                      {/* Reply indicator */}
                      {msg.replyTo && (
                        <div className="mb-2 p-2 rounded border-l-2 text-xs bg-orange-600/50 border-white/50">
                          <p className="font-semibold">{msg.replyTo.senderName}</p>
                          <p className="opacity-80 line-clamp-1">{msg.replyTo.content}</p>
                        </div>
                      )}
                      
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="bg-white/10 border-white/30 text-white"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEditMessage(msg.id, editText)}
                              className="h-7 bg-green-500 hover:bg-green-600 text-white"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingMessage(null)
                                setEditText("")
                              }}
                              className="h-7 text-white hover:bg-white/20"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-orange-100">
                          {format(msg.createdAt, "HH:mm", { locale: ptBR })}
                        </span>
                        {msg.isEdited && (
                          <span className="text-[10px] italic text-orange-200">
                            editada
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Message actions */}
                    {!isEditing && (
                      <div className={cn(
                        "flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                        isMyMessage ? "justify-end" : "justify-start"
                      )}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingTo(msg)}
                          className="h-6 px-2 text-xs text-gray-400 hover:text-white hover:bg-white/10"
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Responder
                        </Button>
                        {isMyMessage && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingMessage(msg)
                                setEditText(msg.content)
                              }}
                              className="h-6 px-2 text-xs text-gray-400 hover:text-white hover:bg-white/10"
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="h-6 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Excluir
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input - Estilo do print */}
        <div className="p-4 border-t border-border/30 bg-[#1a1a1a] space-y-2">
          {/* Reply indicator */}
          {replyingTo && (
            <div className="bg-[#2a2a2a] p-2 rounded-lg flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Reply className="h-3 w-3 text-gray-400" />
                  <p className="text-xs font-semibold text-white">Respondendo a {replyingTo.senderName}</p>
                </div>
                <p className="text-xs text-gray-400 line-clamp-1">{replyingTo.content}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setReplyingTo(null)}
                className="h-6 w-6 flex-shrink-0 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="flex gap-2">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                className="flex-1 bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500"
              />
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="border-[#3a3a3a] bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#3a3a3a]">
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 bg-[#2a2a2a] border-[#3a3a3a]" align="end">
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJI_LIST_MONITORIA.map((emoji, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-xl hover:bg-[#3a3a3a] rounded p-1 transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Operator list view - Lista de operadores que enviaram mensagens
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Chat com a Operacao</h2>
          <p className="text-muted-foreground text-sm">Visualize e responda mensagens dos operadores</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Users className="h-3.5 w-3.5" />
          {operatorsWithMessages.length} conversa(s)
        </Badge>
      </div>

      {/* General Group Card */}
      <Card 
        className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-pink-500 bg-gradient-to-r from-pink-500/5 to-transparent"
        onClick={() => setSelectedOperator({ id: "general-operation", fullName: "Grupo Geral - Operadores", username: "general-operation", isOnline: true })}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-pink-500/10 rounded-full">
              <Users className="h-6 w-6 text-pink-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Grupo Geral - Operadores</h3>
              <p className="text-sm text-muted-foreground">Mensagens para todos os operadores</p>
            </div>
            <Badge className="bg-pink-500 text-white">
              Grupo
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-border" />
        <span className="text-xs text-muted-foreground font-medium">operadores com mensagens</span>
        <div className="flex-1 border-t border-border" />
      </div>

      {/* Operators List */}
      {operatorsWithMessages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-muted rounded-full mb-4">
              <MessageCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma conversa ainda</h3>
            <p className="text-muted-foreground text-sm text-center">
              Os operadores ainda nao enviaram mensagens para voce.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {operatorsWithMessages.map((operator) => (
            <Card
              key={operator.id}
              className="cursor-pointer hover:shadow-md transition-all hover:border-orange-500/50"
              onClick={() => setSelectedOperator(operator)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-orange-500">
                    <AvatarFallback className="bg-orange-500 text-white font-semibold">
                      {getInitials(operator.fullName || operator.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">{operator.fullName || operator.username}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "h-2 w-2 rounded-full",
                        operator.isOnline ? "bg-green-500" : "bg-gray-400"
                      )} />
                      <span className="text-xs text-muted-foreground">
                        {operator.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600 hover:bg-orange-500/10">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Ver conversa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* All Operators Section */}
      <div className="pt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 border-t border-border" />
          <span className="text-xs text-muted-foreground font-medium">todos os operadores</span>
          <div className="flex-1 border-t border-border" />
        </div>
        
        <div className="grid gap-2">
          {operators.filter(op => !operatorsWithMessages.find(o => o.id === op.id)).slice(0, 5).map((operator) => (
            <Card
              key={operator.id}
              className="cursor-pointer hover:shadow-sm transition-all hover:border-border/80"
              onClick={() => setSelectedOperator(operator)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarFallback className={cn(getAvatarColor(operator.fullName || ""), "text-white text-xs font-medium")}>
                      {getInitials(operator.fullName || operator.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{operator.fullName || operator.username}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        operator.isOnline ? "bg-green-500" : "bg-gray-400"
                      )} />
                      <span className="text-[10px] text-muted-foreground">
                        {operator.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground">
                    <Send className="h-3 w-3 mr-1" />
                    Iniciar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

const EMOJI_LIST_MONITORIA = [
  "😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂",
  "😉", "😌", "😍", "🥰", "😘", "👍", "👎", "👌", "✌️", "🤞",
  "🤝", "👏", "🙌", "🙏", "💪", "❤️", "🧡", "💛", "💚", "💙",
  "💜", "🖤", "🤍", "💯", "✨", "🔥", "⭐", "🎉", "✅", "❌",
]

const EMOJI_LIST_SUPERVISOR = [
  "😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂",
  "😉", "😌", "😍", "🥰", "😘", "👍", "👎", "👌", "✌️", "🤞",
  "🤝", "👏", "🙌", "🙏", "💪", "❤️", "🧡", "💛", "💚", "💙",
  "💜", "🖤", "🤍", "💯", "✨", "🔥", "⭐", "🎉", "✅", "❌",
]

// Supervisor Operation Chat View - Chat com os Operadores (para supervisores verem mensagens dos operadores)
function SupervisorOperationChatView({
  user,
  getInitials,
  formatTimeAgo,
  allUsers,
}: {
  user: any
  getInitials: (name: string) => string
  formatTimeAgo: (date: Date) => string
  allUsers: any[]
}) {
  const [selectedOperator, setSelectedOperator] = useState<any | null>(null)
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string
    senderId: string
    senderName: string
    content: string
    createdAt: Date
    isFromOperator: boolean
    isEdited?: boolean
    editedAt?: Date
    replyTo?: {
      messageId: string
      senderName: string
      content: string
    }
  }>>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [replyingTo, setReplyingTo] = useState<any | null>(null)
  const [editingMessage, setEditingMessage] = useState<any | null>(null)
  const [editText, setEditText] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [operatorsWithMessages, setOperatorsWithMessages] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Filter only operators
  const operators = useMemo(() => {
    return allUsers.filter((u) => u.role === "operator")
  }, [allUsers])

  // Load operators who have sent messages to this supervisor with realtime subscription
  useEffect(() => {
    if (!user) return
    
    loadOperatorsWithMessages()
    
    // Setup realtime subscription for new messages to update the operators list
    const supabase = createClient()
    const channel = supabase
      .channel(`supervisor_operators_list_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'supervisor_chat_messages',
        },
        (payload) => {
          // Reload operators with messages on any change
          loadOperatorsWithMessages()
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, operators])

  const loadOperatorsWithMessages = async () => {
    if (!user) return
    try {
      const supabase = createClient()
      // Get distinct senders who sent messages to this supervisor
      const { data, error } = await supabase
        .from("supervisor_chat_messages")
        .select("sender_id, sender_name")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })

      if (!error && data) {
        // Get unique operators with their latest info
        const uniqueOperators = new Map()
        data.forEach((m: any) => {
          if (!uniqueOperators.has(m.sender_id)) {
            const operatorInfo = operators.find(o => o.id === m.sender_id) || {
              id: m.sender_id,
              fullName: m.sender_name,
              username: m.sender_name,
              isOnline: false,
            }
            uniqueOperators.set(m.sender_id, operatorInfo)
          }
        })
        setOperatorsWithMessages(Array.from(uniqueOperators.values()))
      }
    } catch (error) {
      console.error("Error loading operators with messages:", error)
    }
  }

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  // Load chat messages when operator is selected and setup realtime subscription
  useEffect(() => {
    if (selectedOperator && user) {
      loadChatMessages()
      
      // Setup realtime subscription for new messages
      const supabase = createClient()
      const channel = supabase
        .channel(`supervisor_op_chat_${user.id}_${selectedOperator.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'supervisor_chat_messages',
          },
          (payload) => {
            // Reload messages on any change
            loadChatMessages()
            loadOperatorsWithMessages()
          }
        )
        .subscribe()
      
      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedOperator, user])

  const loadChatMessages = async () => {
    if (!selectedOperator || !user) return
    setIsLoading(true)
    try {
      const supabase = createClient()
      
      let query = supabase.from("supervisor_chat_messages").select("*")
      
      // Se for o Grupo Geral de Operadores, busca todas as mensagens enviadas para "general-operation"
      // Se for um operador específico, busca apenas o chat privado
      if (selectedOperator.id === "general-operation") {
        // Grupo Geral: mostra todas as mensagens onde recipient_id = "general-operation"
        query = query.eq("recipient_id", "general-operation")
      } else {
        // Chat privado: mostra apenas mensagens entre supervisor e operador específico
        // Exclui mensagens do grupo geral
        query = query
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${selectedOperator.id}),and(sender_id.eq.${selectedOperator.id},recipient_id.eq.${user.id})`)
          .neq("recipient_id", "general-operation")
      }
      
      const { data, error } = await query.order("created_at", { ascending: true })

      if (!error && data) {
        setChatMessages(data.map((m: any) => ({
          id: m.id,
          senderId: m.sender_id,
          senderName: m.sender_name,
          content: m.content,
          createdAt: new Date(m.created_at),
          isFromOperator: m.sender_id === selectedOperator.id,
          isEdited: m.is_edited,
          editedAt: m.edited_at ? new Date(m.edited_at) : undefined,
          replyTo: m.reply_to_id ? {
            messageId: m.reply_to_id,
            senderName: m.reply_to_sender_name || "",
            content: m.reply_to_content || "",
          } : undefined,
        })))
      }
    } catch (error) {
      console.error("Error loading chat messages:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedOperator || !user) return

    // Check for profanity
    if (containsProfanity(newMessage)) {
      toast({
        title: "Mensagem bloqueada",
        description: getProfanityWarning(),
        variant: "destructive",
      })
      return
    }

    const messageContent = newMessage.trim()
    setNewMessage("")

    // Add optimistic message
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      senderId: user.id,
      senderName: user.fullName || user.username,
      content: messageContent,
      createdAt: new Date(),
      isFromOperator: false,
      replyTo: replyingTo ? {
        messageId: replyingTo.id,
        senderName: replyingTo.senderName,
        content: replyingTo.content.substring(0, 100),
      } : undefined,
    }
    setChatMessages(prev => [...prev, optimisticMsg])
    setReplyingTo(null)

    try {
      const supabase = createClient()
      const insertData: any = {
        sender_id: user.id,
        sender_name: user.fullName || user.username,
        recipient_id: selectedOperator.id,
        recipient_name: selectedOperator.fullName || selectedOperator.username,
        content: messageContent,
        is_read: false,
      }

      if (replyingTo) {
        insertData.reply_to_id = replyingTo.id
        insertData.reply_to_sender_name = replyingTo.senderName
        insertData.reply_to_content = replyingTo.content.substring(0, 100)
      }

      const { error } = await supabase
        .from("supervisor_chat_messages")
        .insert(insertData)

      if (error) throw error

      toast({
        title: "Mensagem enviada",
        description: `Sua mensagem foi enviada para ${selectedOperator.fullName || selectedOperator.username}`,
      })

      // Reload messages to get the real one
      loadChatMessages()
    } catch (error) {
      console.error("Error sending message:", error)
      // Remove optimistic message on error
      setChatMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
      toast({
        title: "Erro ao enviar",
        description: "Nao foi possivel enviar a mensagem. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!newContent.trim()) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("supervisor_chat_messages")
        .update({
          content: newContent.trim(),
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq("id", messageId)

      if (error) throw error

      setEditingMessage(null)
      setEditText("")
      loadChatMessages()
      toast({
        title: "Mensagem editada",
        description: "Sua mensagem foi atualizada com sucesso.",
      })
    } catch (error) {
      console.error("Error editing message:", error)
      toast({
        title: "Erro ao editar",
        description: "Nao foi possivel editar a mensagem.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta mensagem?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("supervisor_chat_messages")
        .delete()
        .eq("id", messageId)

      if (error) throw error

      loadChatMessages()
      toast({
        title: "Mensagem excluida",
        description: "A mensagem foi removida com sucesso.",
      })
    } catch (error) {
      console.error("Error deleting message:", error)
      toast({
        title: "Erro ao excluir",
        description: "Nao foi possivel excluir a mensagem.",
        variant: "destructive",
      })
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    if (editingMessage) {
      setEditText(prev => prev + emoji)
    } else {
      setNewMessage(prev => prev + emoji)
    }
    setShowEmojiPicker(false)
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

  // Chat view when an operator is selected
  if (selectedOperator) {
    return (
      <div className="max-w-3xl mx-auto h-[calc(100vh-200px)] flex flex-col bg-[#1a1a1a] rounded-lg overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border/30 bg-[#1a1a1a]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedOperator(null)
              setChatMessages([])
              setReplyingTo(null)
              setEditingMessage(null)
            }}
            className="text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
          <Avatar className="h-10 w-10 border-2 border-blue-500">
            <AvatarFallback className="bg-blue-500 text-white font-semibold">
              {getInitials(selectedOperator.fullName || selectedOperator.username)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-white">{selectedOperator.fullName || selectedOperator.username}</p>
            <div className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", selectedOperator.isOnline ? "bg-green-500" : "bg-gray-400")} />
              <span className="text-xs text-gray-400">
                {selectedOperator.isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
          <Badge className="bg-transparent text-gray-400 border border-gray-600">
            Operador
          </Badge>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#1a1a1a]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : chatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <MessageCircle className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">Nenhuma mensagem ainda</p>
              <p className="text-xs">O operador ainda nao enviou mensagens</p>
            </div>
          ) : (
            chatMessages.map((msg) => {
              const isEditing = editingMessage?.id === msg.id
              const isMyMessage = !msg.isFromOperator // Mensagens do supervisor
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2 max-w-[80%] group",
                    isMyMessage ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={cn(
                      "text-white text-xs font-medium",
                      msg.isFromOperator ? "bg-blue-500" : "bg-green-500"
                    )}>
                      {msg.isFromOperator ? "O" : getInitials(msg.senderName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2",
                        isMyMessage
                          ? "bg-blue-500 text-white rounded-br-md"
                          : "bg-blue-500 text-white rounded-bl-md"
                      )}
                    >
                      {/* Reply indicator */}
                      {msg.replyTo && (
                        <div className="mb-2 p-2 rounded border-l-2 text-xs bg-blue-600/50 border-white/50">
                          <p className="font-semibold">{msg.replyTo.senderName}</p>
                          <p className="opacity-80 line-clamp-1">{msg.replyTo.content}</p>
                        </div>
                      )}
                      
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="bg-white/10 border-white/30 text-white"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEditMessage(msg.id, editText)}
                              className="h-7 bg-green-500 hover:bg-green-600 text-white"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingMessage(null)
                                setEditText("")
                              }}
                              className="h-7 text-white hover:bg-white/20"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-blue-100">
                          {format(msg.createdAt, "HH:mm", { locale: ptBR })}
                        </span>
                        {msg.isEdited && (
                          <span className="text-[10px] italic text-blue-200">
                            editada
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Message actions */}
                    {!isEditing && (
                      <div className={cn(
                        "flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                        isMyMessage ? "justify-end" : "justify-start"
                      )}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingTo(msg)}
                          className="h-6 px-2 text-xs text-gray-400 hover:text-white hover:bg-white/10"
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Responder
                        </Button>
                        {isMyMessage && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingMessage(msg)
                                setEditText(msg.content)
                              }}
                              className="h-6 px-2 text-xs text-gray-400 hover:text-white hover:bg-white/10"
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="h-6 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Excluir
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-border/30 bg-[#1a1a1a] space-y-2">
          {/* Reply indicator */}
          {replyingTo && (
            <div className="bg-[#2a2a2a] p-2 rounded-lg flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Reply className="h-3 w-3 text-gray-400" />
                  <p className="text-xs font-semibold text-white">Respondendo a {replyingTo.senderName}</p>
                </div>
                <p className="text-xs text-gray-400 line-clamp-1">{replyingTo.content}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setReplyingTo(null)}
                className="h-6 w-6 flex-shrink-0 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="flex gap-2">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                className="flex-1 bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500"
              />
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="border-[#3a3a3a] bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#3a3a3a]">
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 bg-[#2a2a2a] border-[#3a3a3a]" align="end">
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJI_LIST_SUPERVISOR.map((emoji, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-xl hover:bg-[#3a3a3a] rounded p-1 transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Operator list view - Lista de operadores que enviaram mensagens
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Chat com os Operadores</h2>
          <p className="text-muted-foreground text-sm">Visualize e responda mensagens dos operadores</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Users className="h-3.5 w-3.5" />
          {operatorsWithMessages.length} conversa(s)
        </Badge>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-border" />
        <span className="text-xs text-muted-foreground font-medium">operadores com mensagens</span>
        <div className="flex-1 border-t border-border" />
      </div>

      {/* Operators List */}
      {operatorsWithMessages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-muted rounded-full mb-4">
              <MessageCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma conversa ainda</h3>
            <p className="text-muted-foreground text-sm text-center">
              Os operadores ainda nao enviaram mensagens para voce.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {operatorsWithMessages.map((operator) => (
            <Card
              key={operator.id}
              className="cursor-pointer hover:shadow-md transition-all hover:border-blue-500/50"
              onClick={() => setSelectedOperator(operator)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-blue-500">
                    <AvatarFallback className="bg-blue-500 text-white font-semibold">
                      {getInitials(operator.fullName || operator.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">{operator.fullName || operator.username}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "h-2 w-2 rounded-full",
                        operator.isOnline ? "bg-green-500" : "bg-gray-400"
                      )} />
                      <span className="text-xs text-muted-foreground">
                        {operator.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Ver conversa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* All Operators Section */}
      <div className="pt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 border-t border-border" />
          <span className="text-xs text-muted-foreground font-medium">todos os operadores</span>
          <div className="flex-1 border-t border-border" />
        </div>
        
        <div className="grid gap-2">
          {operators.filter(op => !operatorsWithMessages.find(o => o.id === op.id)).slice(0, 5).map((operator) => (
            <Card
              key={operator.id}
              className="cursor-pointer hover:shadow-sm transition-all hover:border-border/80"
              onClick={() => setSelectedOperator(operator)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarFallback className={cn(getAvatarColor(operator.fullName || ""), "text-white text-xs font-medium")}>
                      {getInitials(operator.fullName || operator.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{operator.fullName || operator.username}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        operator.isOnline ? "bg-green-500" : "bg-gray-400"
                      )} />
                      <span className="text-[10px] text-muted-foreground">
                        {operator.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground">
                    <Send className="h-3 w-3 mr-1" />
                    Iniciar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// Equipe View Component - Chat com Supervisores
const EMOJI_LIST_CHAT = [
  "😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂",
  "😉", "😌", "😍", "🥰", "😘", "👍", "👎", "👌", "✌️", "🤞",
  "🤝", "👏", "🙌", "🙏", "💪", "❤️", "🧡", "💛", "💚", "💙",
  "💜", "🖤", "🤍", "💯", "✨", "🔥", "⭐", "🎉", "✅", "❌",
]

function EquipeView({
  user,
  getInitials,
  allUsers,
}: {
  user: any
  getInitials: (name: string) => string
  allUsers: any[]
}) {
  const [selectedSupervisor, setSelectedSupervisor] = useState<any | null>(null)
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string
    senderId: string
    senderName: string
    content: string
    createdAt: Date
    isFromOperator: boolean
    isEdited?: boolean
    editedAt?: Date
    replyTo?: {
      messageId: string
      senderName: string
      content: string
    }
  }>>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [replyingTo, setReplyingTo] = useState<any | null>(null)
  const [editingMessage, setEditingMessage] = useState<any | null>(null)
  const [editText, setEditText] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Filter only supervisors (adminType === "supervisao" or username starts with "Supervisor")
  const supervisors = useMemo(() => {
    return allUsers.filter((u) => 
      u.role === "admin" && 
      (u.adminType === "supervisao" || u.username?.toLowerCase().startsWith("supervisor"))
    )
  }, [allUsers])

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  // Load chat messages when supervisor is selected and setup realtime subscription
  useEffect(() => {
    if (selectedSupervisor && user) {
      loadChatMessages()
      
      // Setup realtime subscription for new messages
      const supabase = createClient()
      const channel = supabase
        .channel(`supervisor_chat_${user.id}_${selectedSupervisor.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'supervisor_chat_messages',
          },
          (payload) => {
            // Reload messages on any change
            loadChatMessages()
          }
        )
        .subscribe()
      
      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedSupervisor, user])

  const loadChatMessages = async () => {
    if (!selectedSupervisor || !user) return
    setIsLoading(true)
    try {
      const supabase = createClient()
      
      let query = supabase.from("supervisor_chat_messages").select("*")
      
      // Se for o Grupo Geral, busca todas as mensagens enviadas para "general"
      // Se for um supervisor específico, busca apenas o chat privado entre operador e supervisor
      if (selectedSupervisor.id === "general") {
        // Grupo Geral: mostra todas as mensagens onde recipient_id = "general"
        query = query.eq("recipient_id", "general")
      } else {
        // Chat privado: mostra apenas mensagens entre o operador e o supervisor específico
        // Exclui mensagens do grupo geral
        query = query
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${selectedSupervisor.id}),and(sender_id.eq.${selectedSupervisor.id},recipient_id.eq.${user.id})`)
          .neq("recipient_id", "general")
      }
      
      const { data, error } = await query.order("created_at", { ascending: true })

      if (!error && data) {
        setChatMessages(data.map((m: any) => ({
          id: m.id,
          senderId: m.sender_id,
          senderName: m.sender_name,
          content: m.content,
          createdAt: new Date(m.created_at),
          isFromOperator: m.sender_id === user.id,
          isEdited: m.is_edited,
          editedAt: m.edited_at ? new Date(m.edited_at) : undefined,
          replyTo: m.reply_to_id ? {
            messageId: m.reply_to_id,
            senderName: m.reply_to_sender_name || "",
            content: m.reply_to_content || "",
          } : undefined,
        })))
      }
    } catch (error) {
      console.error("Error loading chat messages:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedSupervisor || !user) return

    const messageContent = newMessage.trim()
    setNewMessage("")

    // Add optimistic message
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      senderId: user.id,
      senderName: user.fullName || user.username,
      content: messageContent,
      createdAt: new Date(),
      isFromOperator: true,
      replyTo: replyingTo ? {
        messageId: replyingTo.id,
        senderName: replyingTo.senderName,
        content: replyingTo.content.substring(0, 100),
      } : undefined,
    }
    setChatMessages(prev => [...prev, optimisticMsg])
    setReplyingTo(null)

    try {
      const supabase = createClient()
      const insertData: any = {
        sender_id: user.id,
        sender_name: user.fullName || user.username,
        recipient_id: selectedSupervisor.id,
        recipient_name: selectedSupervisor.fullName || selectedSupervisor.username,
        content: messageContent,
        is_read: false,
      }

      if (replyingTo) {
        insertData.reply_to_id = replyingTo.id
        insertData.reply_to_sender_name = replyingTo.senderName
        insertData.reply_to_content = replyingTo.content.substring(0, 100)
      }

      const { error } = await supabase
        .from("supervisor_chat_messages")
        .insert(insertData)

      if (error) throw error

      toast({
        title: "Mensagem enviada",
        description: `Sua mensagem foi enviada para ${selectedSupervisor.fullName || selectedSupervisor.username}`,
      })

      // Reload messages to get the real one
      loadChatMessages()
    } catch (error) {
      console.error("Error sending message:", error)
      // Remove optimistic message on error
      setChatMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
      toast({
        title: "Erro ao enviar",
        description: "Nao foi possivel enviar a mensagem. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!newContent.trim()) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("supervisor_chat_messages")
        .update({
          content: newContent.trim(),
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq("id", messageId)

      if (error) throw error

      setEditingMessage(null)
      setEditText("")
      loadChatMessages()
      toast({
        title: "Mensagem editada",
        description: "Sua mensagem foi atualizada com sucesso.",
      })
    } catch (error) {
      console.error("Error editing message:", error)
      toast({
        title: "Erro ao editar",
        description: "Nao foi possivel editar a mensagem.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta mensagem?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("supervisor_chat_messages")
        .delete()
        .eq("id", messageId)

      if (error) throw error

      loadChatMessages()
      toast({
        title: "Mensagem excluida",
        description: "A mensagem foi removida com sucesso.",
      })
    } catch (error) {
      console.error("Error deleting message:", error)
      toast({
        title: "Erro ao excluir",
        description: "Nao foi possivel excluir a mensagem.",
        variant: "destructive",
      })
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    if (editingMessage) {
      setEditText(prev => prev + emoji)
    } else {
      setNewMessage(prev => prev + emoji)
    }
    setShowEmojiPicker(false)
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

  // Chat view when a supervisor is selected
  if (selectedSupervisor) {
    return (
      <div className="max-w-3xl mx-auto h-[calc(100vh-200px)] flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-card rounded-t-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedSupervisor(null)
              setChatMessages([])
              setReplyingTo(null)
              setEditingMessage(null)
            }}
            className="mr-2"
          >
            <X className="h-4 w-4" />
          </Button>
          <Avatar className="h-10 w-10 border-2 border-blue-500">
            <AvatarFallback className={cn(getAvatarColor(selectedSupervisor.fullName || ""), "text-white font-semibold")}>
              {getInitials(selectedSupervisor.fullName || selectedSupervisor.username)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">{selectedSupervisor.fullName || selectedSupervisor.username}</p>
            <div className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", selectedSupervisor.isOnline ? "bg-green-500" : "bg-gray-400")} />
              <span className="text-xs text-muted-foreground">
                {selectedSupervisor.isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">
            Supervisor
          </Badge>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : chatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">Nenhuma mensagem ainda</p>
              <p className="text-xs">Envie uma mensagem para iniciar a conversa</p>
            </div>
          ) : (
            chatMessages.map((msg) => {
              const isEditing = editingMessage?.id === msg.id
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2 max-w-[80%] group",
                    msg.isFromOperator ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0 cursor-pointer" title={msg.senderName}>
                    <AvatarFallback className={cn(
                      getAvatarColor(msg.senderName),
                      "text-white text-xs font-medium"
                    )}>
                      {getInitials(msg.senderName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2",
                        msg.isFromOperator
                          ? "bg-blue-500 text-white rounded-br-md"
                          : "bg-card border border-border rounded-bl-md"
                      )}
                    >
                      {/* Reply indicator */}
                      {msg.replyTo && (
                        <div className={cn(
                          "mb-2 p-2 rounded border-l-2 text-xs",
                          msg.isFromOperator
                            ? "bg-blue-600/50 border-white/50"
                            : "bg-muted/50 border-muted-foreground/50"
                        )}>
                          <p className="font-semibold">{msg.replyTo.senderName}</p>
                          <p className="opacity-80 line-clamp-1">{msg.replyTo.content}</p>
                        </div>
                      )}
                      
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="bg-white/10 border-white/30 text-white"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEditMessage(msg.id, editText)}
                              className="h-7 bg-green-500 hover:bg-green-600 text-white"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingMessage(null)
                                setEditText("")
                              }}
                              className="h-7 text-white hover:bg-white/20"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          "text-[10px]",
                          msg.isFromOperator ? "text-blue-100" : "text-muted-foreground"
                        )}>
                          {format(msg.createdAt, "HH:mm", { locale: ptBR })}
                        </span>
                        {msg.isEdited && (
                          <span className={cn(
                            "text-[10px] italic",
                            msg.isFromOperator ? "text-blue-200" : "text-muted-foreground"
                          )}>
                            ✏️ editada
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Message actions */}
                    {!isEditing && (
                      <div className={cn(
                        "flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                        msg.isFromOperator ? "justify-end" : "justify-start"
                      )}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingTo(msg)}
                          className="h-6 px-2 text-xs"
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Responder
                        </Button>
                        {msg.isFromOperator && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingMessage(msg)
                                setEditText(msg.content)
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="h-6 px-2 text-xs text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Excluir
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-border bg-card rounded-b-lg space-y-2">
          {/* Reply indicator */}
          {replyingTo && (
            <div className="bg-muted p-2 rounded-lg flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Reply className="h-3 w-3" />
                  <p className="text-xs font-semibold">Respondendo a {replyingTo.senderName}</p>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{replyingTo.content}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setReplyingTo(null)}
                className="h-6 w-6 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="flex gap-2">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                className="flex-1"
              />
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72">
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJI_LIST_CHAT.map((emoji, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-xl hover:bg-accent rounded p-1 transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Supervisor list view
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Chat com a Supervisao</h2>
          <p className="text-muted-foreground text-sm">Envie mensagens diretamente para os supervisores</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Users className="h-3.5 w-3.5" />
          {supervisors.length} supervisor(es)
        </Badge>
      </div>

      {/* General Group Card */}
      <Card 
        className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-500/5 to-transparent"
        onClick={() => setSelectedSupervisor({ id: "general", fullName: "Grupo Geral", username: "general", isOnline: true })}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Grupo Geral</h3>
              <p className="text-sm text-muted-foreground">Mensagem para todos os supervisores</p>
            </div>
            <Badge className="bg-blue-500 text-white">
              {supervisors.length} membros
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-border" />
        <span className="text-xs text-muted-foreground font-medium">ou escolha um supervisor</span>
        <div className="flex-1 border-t border-border" />
      </div>

      {/* Supervisors List */}
      {supervisors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum supervisor disponivel</h3>
            <p className="text-muted-foreground text-sm text-center">
              Não há supervisores cadastrados no sistema.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {supervisors.map((supervisor) => (
            <Card
              key={supervisor.id}
              className="cursor-pointer hover:shadow-md transition-all hover:border-blue-500/50"
              onClick={() => setSelectedSupervisor(supervisor)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-border">
                    <AvatarFallback className={cn(getAvatarColor(supervisor.fullName || ""), "text-white font-semibold")}>
                      {getInitials(supervisor.fullName || supervisor.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">{supervisor.fullName || supervisor.username}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "h-2 w-2 rounded-full",
                        supervisor.isOnline ? "bg-green-500" : "bg-gray-400"
                      )} />
                      <span className="text-xs text-muted-foreground">
                        {supervisor.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Conversar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// PDF Viewer Component - Abre em nova aba
function PDFViewer({ pdfUrl, title }: { pdfUrl: string; title: string }) {
  return (
    <div className="flex flex-col h-[70vh] items-center justify-center bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg border border-border/50 gap-6">
      <div className="text-center space-y-4 max-w-sm">
        <div className="flex justify-center">
          <div className="p-4 bg-orange-500/10 rounded-full">
            <FileText className="h-12 w-12 text-orange-600" />
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-muted-foreground text-sm mt-2">
            O arquivo PDF será aberto em uma nova aba para melhor visualização.
          </p>
        </div>
        <Button 
          onClick={() => window.open(pdfUrl, '_blank')}
          className="gap-2 bg-orange-500 hover:bg-orange-600 text-white w-full"
          size="lg"
        >
          <FileText className="h-5 w-5" />
          Abrir PDF
        </Button>
        <p className="text-xs text-muted-foreground">
          Clique no botão acima ou permite pop-ups no navegador.
        </p>
      </div>
    </div>
  )
}

// Treinamentos View Component
function TreinamentosView({
  user,
  getInitials,
}: {
  user: any
  getInitials: (name: string) => string
}) {
  const [trainings, setTrainings] = useState<any[]>([])
  const [selectedTraining, setSelectedTraining] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTrainings = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/trainings')
        if (!response.ok) throw new Error('Erro ao carregar treinamentos')
        const data = await response.json()
        setTrainings(data.trainings || [])
      } catch (err) {
        console.error("Error loading trainings:", err)
        setError("Erro ao carregar treinamentos. Tente novamente.")
      } finally {
        setLoading(false)
      }
    }
    loadTrainings()
  }, [])

  // Abre um treinamento
  const handleOpenTraining = (training: any) => {
    setSelectedTraining(training)
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return ""
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (selectedTraining) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setSelectedTraining(null)}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Voltar
          </Button>
          <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30">
            Treinamento PDF
          </Badge>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{selectedTraining.title}</CardTitle>
            <p className="text-muted-foreground text-sm">{selectedTraining.filename}</p>
          </CardHeader>
          <CardContent>
            <PDFViewer 
              pdfUrl={selectedTraining.url}
              title={selectedTraining.title}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="text-muted-foreground">Carregando treinamentos...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-destructive/10 rounded-full mb-4">
              <X className="h-10 w-10 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar</h3>
            <p className="text-muted-foreground text-sm text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Treinamentos</h2>
          <p className="text-muted-foreground text-sm">Acesse os materiais de treinamento em PDF</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <BookOpen className="h-3.5 w-3.5" />
          {trainings.length} disponível(is)
        </Badge>
      </div>

      {trainings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-muted rounded-full mb-4">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum treinamento disponível</h3>
            <p className="text-muted-foreground text-sm text-center">
              Quando novos treinamentos forem publicados, eles aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {trainings.map((training) => (
            <Card 
              key={training.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-orange-500"
              onClick={() => handleOpenTraining(training)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                      <FileText className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{training.title}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          PDF
                        </Badge>
                        {training.filename && (
                          <span className="text-xs text-muted-foreground">
                            {training.filename}
                          </span>
                        )}
                        {training.size && (
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(training.size)}
                          </span>
                        )}
                        {training.uploadedAt && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(training.uploadedAt), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-orange-500">
                    Visualizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
