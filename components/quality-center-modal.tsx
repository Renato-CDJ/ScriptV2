"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
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
import type { QualityPost, User as UserType } from "@/lib/types"

interface QualityCenterModalProps {
  isOpen: boolean
  onClose: () => void
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
              <SidebarButton
                icon={<Users className="h-5 w-5" />}
                label="Equipe"
                active={activeView === "colegas"}
                onClick={() => setActiveView("colegas")}
              />
              <SidebarButton
                icon={<TrendingUp className="h-5 w-5" />}
                label="Ranking"
                active={activeView === "ranking"}
                onClick={() => setActiveView("ranking")}
              />
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
                <SidebarButton
                  icon={<MessageSquare className="h-5 w-5" />}
                  label="Perguntas"
                  active={activeView === "filter-perguntas"}
                  onClick={() => setActiveView("filter-perguntas")}
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
                    <QuestionsTab
                      getInitials={getInitials}
                      formatTimeAgo={formatTimeAgo}
                    />
                  ) : (
                    <OperatorQuestionsView
                      user={user}
                      getInitials={getInitials}
                      formatTimeAgo={formatTimeAgo}
                    />
                  )
                )}
                {activeView === "treinamentos" && (
                  <TreinamentosView user={user} getInitials={getInitials} />
                )}
                {!["inicio", "admin", "perfil", "treinamentos", "filter-comunicado", "filter-recado", "filter-feedback", "filter-quiz", "filter-perguntas"].includes(activeView) && (
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
            <Card key={post.id} className="border shadow-sm">
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
                    </div>
                    <div 
                      className="text-sm prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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
  const [expandedComments, setExpandedComments] = useState<string[]>([])
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [mentionType, setMentionType] = useState<"all" | "admins">("admins") // "all" = Todos podem ver, "admins" = ADM's (default)

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

    // Determine if sending to admins only or to all
    const sendToAdminsOnly = mentionType === "admins"

    await createQualityPostSupabase({
      type: postType,
      content: newPostContent.trim(),
      authorId: user.id,
      authorName: user.fullName || user.username || "Usuario",
      sendToAll: !sendToAdminsOnly,
      recipients: sendToAdminsOnly ? ["admins"] : [],
      recipientNames: sendToAdminsOnly ? ["Administradores"] : [],
    })

    setNewPostContent("")
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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const handleEditPost = (post: QualityPost) => {
    setEditingPost(post)
    setEditPostContent(post.content)
  }

  const handleSaveEditPost = async () => {
    if (!editingPost || !editPostContent.trim()) return
    
    // Check for profanity
    if (containsProfanity(editPostContent)) {
      alert(getProfanityWarning())
      return
    }
    
    await editQualityPostSupabase(editingPost.id, editPostContent)
    setEditingPost(null)
    setEditPostContent("")
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
    const badges = {
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
        label: "Pergunta",
        className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
        icon: <HelpCircle className="h-3 w-3" />,
      },
    }
    return badges[type]
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
                            mentionType === "admins" && "text-orange-600 dark:text-orange-400"
                          )}
                        >
                          <AtSign className="h-3.5 w-3.5" />
                          Mencionar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-44 bg-popover">
                        <DropdownMenuItem 
                          onClick={() => setMentionType("admins")}
                          className={cn(
                            "text-sm text-foreground cursor-pointer", 
                            mentionType === "admins" && "bg-orange-100 dark:bg-orange-900/30"
                          )}
                        >
                          <Shield className="h-3.5 w-3.5 mr-2 text-orange-500" />
                          <span className="text-foreground">ADMs</span>
                          {mentionType === "admins" && <Check className="ml-auto h-3.5 w-3.5 text-orange-500" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setMentionType("all")}
                          className={cn(
                            "text-sm text-foreground cursor-pointer", 
                            mentionType === "all" && "bg-orange-100 dark:bg-orange-900/30"
                          )}
                        >
                          <Users className="h-3.5 w-3.5 mr-2 text-blue-500" />
                          <span className="text-foreground">Todos podem ver</span>
                          {mentionType === "all" && <Check className="ml-auto h-3.5 w-3.5 text-orange-500" />}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* Show current visibility as small badge */}
                    <Badge variant="outline" className={cn(
                      "text-[10px] h-5 px-1.5",
                      mentionType === "all" 
                        ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30" 
                        : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30"
                    )}>
                      {mentionType === "all" ? "@Todos" : "@ADMs"}
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

        return (
          <Card key={post.id} className="border-border/50 shadow-sm hover:shadow transition-all">
            <CardContent className="p-3">
              {/* Post Header */}
              <div className="flex items-start gap-2.5 mb-2">
                <Avatar className="h-8 w-8 bg-muted">
                  <AvatarFallback className="font-medium text-xs">{getInitials(post.authorName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-sm">{post.authorName}</span>
                    <Badge variant="outline" className={cn("text-[10px] h-4 gap-0.5 px-1", badge.className)}>
                      {badge.icon}
                      {badge.label}
                    </Badge>
                    {/* Mentions Icon - Show when there are specific recipients */}
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
                  <span className="text-xs text-muted-foreground">{formatTimeAgo(post.createdAt)}</span>
                </div>
                {/* Post Actions Menu - Only show for post author or admin */}
                {(post.authorId === user?.id || user?.role === "admin" || user?.role === "master") && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3.5 w-3.5" />
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

              {/* Post Content - Remove inline mentions since we now have the icon */}
              <div
                className="mb-2.5 text-sm text-foreground prose prose-sm dark:prose-invert max-w-none [&_.text-orange-500]:hidden"
                dangerouslySetInnerHTML={{ __html: (post.content || "").replace(/<span class="text-orange-500[^"]*">@[^<]+<\/span>\s*/g, '') }}
              />

              {/* Quiz Options */}
              {post.type === "quiz" && post.quizOptions && (
                <div className="space-y-2 mb-4">
                  {post.quizOptions.map((option) => {
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
                          "w-full p-3 rounded-lg border-2 text-left relative overflow-hidden transition-all",
                          userHasVoted && isCorrectAnswer && "border-green-500/60 bg-green-500/10",
                          userHasVoted && hasVoted && !isCorrectAnswer && "border-red-500/60 bg-red-500/10",
                          userHasVoted
                            ? "cursor-default"
                            : "border-border hover:border-orange-500/50 hover:bg-muted/50 cursor-pointer"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute inset-0 transition-all",
                            isCorrectAnswer && userHasVoted
                              ? "bg-green-500/20"
                              : !isCorrectAnswer && hasVoted && userHasVoted
                                ? "bg-red-500/20"
                                : "bg-orange-500/20"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                        <div className="relative flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="font-medium">{option.text}</span>
                            {isCorrectAnswer && userHasVoted && (
                              <div className="flex items-center gap-1 bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
                                <Check className="h-3 w-3" />
                                Correto
                              </div>
                            )}
                            {!isCorrectAnswer && hasVoted && userHasVoted && (
                              <div className="flex items-center gap-1 bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
                                <X className="h-3 w-3" />
                                Incorreto
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground font-semibold">{percentage}%</span>
                        </div>
                      </button>
                    )
                  })}
                  <p className="text-sm text-muted-foreground">{totalVotes} votos no total</p>
                </div>
              )}

              {/* Likes Count */}
              {(post.likes?.length || 0) > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                  <ThumbsUp className="h-4 w-4 fill-orange-500 text-orange-500" />
                  <span>{post.likes?.length} curtidas</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(post.id)}
                  className={cn("gap-2 hover:text-orange-500", isLiked && "text-orange-500")}
                >
                  <ThumbsUp className={cn("h-4 w-4", isLiked && "fill-current")} />
                  Curtir
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleComments(post.id)}
                  className="gap-2 hover:text-orange-500"
                >
                  <MessageCircle className="h-4 w-4" />
                  Comentar {(post.comments?.length || 0) > 0 && `(${post.comments?.length})`}
                </Button>
                <Button variant="ghost" size="sm" className="gap-2 hover:text-orange-500">
                  <Share2 className="h-4 w-4" />
                  Compartilhar
                </Button>
              </div>

              {/* Comments Section */}
              {expandedComments.includes(post.id) && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  {post.comments?.map((comment) => (
                    <div key={comment.id} className="flex gap-2 group">
                      <Avatar className="h-8 w-8 bg-muted">
                        <AvatarFallback className="text-xs">{getInitials(comment.authorName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-muted rounded-xl p-3 relative">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{comment.authorName}</span>
                          {/* Delete comment button - show for comment author or admin */}
                          {(comment.authorId === user?.id || user?.role === "admin" || user?.role === "master") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Avatar className="h-8 w-8 bg-orange-100 dark:bg-orange-900/50">
                      <AvatarFallback className="text-xs text-orange-600 dark:text-orange-300">
                        {getInitials(user?.fullName || user?.username)}
                      </AvatarFallback>
                    </Avatar>
                    <Input
                      placeholder="Escreva um comentario..."
                      value={commentInputs[post.id] || ""}
                      onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && handleComment(post.id)}
                      className="flex-1 bg-muted border-0 rounded-full focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                </div>
              )}
            </CardContent>
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
  const { users: allUsers } = useAllUsers()
  
  const operators = allUsers.filter(u => u.role === "operator" && u.isActive)

  const handlePublish = async () => {
    if (!content.trim() || !user) return
    if (!sendToAll && selectedOperators.length === 0) return

    const recipientNames = sendToAll 
      ? [] 
      : selectedOperators.map(id => {
          const op = operators.find(o => o.id === id)
          return op?.fullName || op?.username || "Operador"
        })

    await createQualityPostSupabase({
      type,
      content,
      authorId: user.id,
      authorName: user.fullName || user.username || "Admin",
      recipients: sendToAll ? [] : selectedOperators,
      recipientNames,
      sendToAll,
    })

    setContent("")
    setSelectedOperators([])
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
          disabled={!content.trim() || (!sendToAll && selectedOperators.length === 0)}
          className="w-full h-10 bg-orange-500 hover:bg-orange-600 text-white font-medium"
        >
          <Send className="h-4 w-4 mr-2" />
          Publicar {type === "comunicado" ? "Comunicado" : "Recado"}
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

    const timestamp = Date.now()
    const quizOptions = options
      .filter((o) => o.trim())
      .map((text, i) => ({ 
        id: `opt-${timestamp}-${i}`, 
        text, 
        votes: [],
        isCorrect: i === correctOptionIndex 
      }))

    await createQualityPostSupabase({
      type: "quiz",
      content: question,
      authorId: user.id,
      authorName: user.fullName || user.username || "Admin",
      quizOptions,
    })

    setQuestion("")
    setOptions(["", ""])
    setCorrectOptionIndex(null)
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
          disabled={!question.trim() || options.filter((o) => o.trim()).length < 2 || correctOptionIndex === null}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
        >
          <Send className="h-4 w-4 mr-2" />
          Publicar Quiz
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
                            <Textarea
                              placeholder={isSecondReply ? "Digite uma nova resposta mais detalhada..." : "Digite sua resposta..."}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className={compact ? "text-xs min-h-[60px]" : "min-h-[80px]"}
                            />
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

// Operator Questions View - Shows only the operator's own questions to admin
function OperatorQuestionsView({
  user,
  getInitials,
  formatTimeAgo,
}: {
  user: any
  getInitials: (name: string) => string
  formatTimeAgo: (date: Date) => string
}) {
  // Filter questions by current user's ID
  const { questions, loading } = useAdminQuestions(user?.id)
  const [newQuestion, setNewQuestion] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim() || !user) return
    
    // Check for profanity
    if (containsProfanity(newQuestion)) {
      alert(getProfanityWarning())
      return
    }
    
    setSubmitting(true)
    await createAdminQuestion({
      question: newQuestion,
      authorId: user.id,
      authorName: user.fullName || user.username || "Operador",
    })
    setNewQuestion("")
    setSubmitting(false)
  }

  const handleMarkUnderstood = async (questionId: string, understood: boolean) => {
    await markQuestionUnderstood(questionId, understood)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-cyan-500/20 rounded-lg">
          <MessageSquare className="h-5 w-5 text-cyan-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Minhas Perguntas</h2>
          <p className="text-sm text-muted-foreground">Envie perguntas para a administracao</p>
        </div>
      </div>

      {/* New Question Form */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="space-y-3">
            <Label>Fazer uma pergunta</Label>
            <Textarea
              placeholder="Digite sua pergunta aqui..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="min-h-[80px]"
            />
            <Button
              onClick={handleSubmitQuestion}
              disabled={!newQuestion.trim() || submitting}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Pergunta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground">
          Historico de Perguntas ({questions.length})
        </h3>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : questions.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-8 text-center">
              <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="font-medium">Nenhuma pergunta enviada</p>
              <p className="text-sm text-muted-foreground">Suas perguntas aparecerao aqui</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {questions.map((q) => (
              <Card key={q.id} className="border-border/50">
                <CardContent className="p-4 space-y-3">
                  {/* Question */}
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 bg-cyan-500/20">
                      <AvatarFallback className="text-xs text-cyan-500">
                        {getInitials(q.authorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{q.authorName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(new Date(q.createdAt))}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{q.question}</p>
                    </div>
                  </div>

                  {/* Admin Reply */}
                  {q.reply && (
                    <div className="ml-11 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="h-4 w-4 text-orange-500" />
                        <span className="text-xs font-medium text-orange-500">
                          Resposta do Admin
                        </span>
                        {q.repliedAt && (
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(new Date(q.repliedAt))}
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{q.reply}</p>

                      {/* Second Reply if exists */}
                      {q.secondReply && (
                        <div className="mt-3 pt-3 border-t border-orange-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Shield className="h-4 w-4 text-orange-500" />
                            <span className="text-xs font-medium text-orange-500">
                              Segunda Resposta
                            </span>
                          </div>
                          <p className="text-sm">{q.secondReply}</p>
                        </div>
                      )}

                      {/* Needs In-Person Feedback */}
                      {q.needsInPersonFeedback && (
                        <div className="mt-3 p-2 bg-yellow-500/20 rounded border border-yellow-500/30">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                            <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                              Esta pergunta sera respondida em feedback presencial
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Understood Buttons - Only show if not already marked and not needs in-person */}
                      {q.reply && q.understood === null && !q.needsInPersonFeedback && (
                        <div className="mt-3 pt-3 border-t border-orange-500/20">
                          <p className="text-xs text-muted-foreground mb-2">Voce entendeu a resposta?</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkUnderstood(q.id, true)}
                              className="h-7 text-xs border-green-500/50 text-green-600 hover:bg-green-500/10"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Sim, entendi
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkUnderstood(q.id, false)}
                              className="h-7 text-xs border-red-500/50 text-red-600 hover:bg-red-500/10"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Nao entendi
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Show understood status */}
                      {q.understood === true && (
                        <div className="mt-3 flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-xs font-medium">Voce marcou que entendeu</span>
                        </div>
                      )}
                      {q.understood === false && !q.needsInPersonFeedback && !q.secondReply && (
                        <div className="mt-3 flex items-center gap-2 text-orange-500">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xs font-medium">Aguardando nova resposta do admin</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Waiting for reply */}
                  {!q.reply && (
                    <div className="ml-11 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="animate-pulse">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <span className="text-xs">Aguardando resposta da administracao...</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
    // Load trainings from Vercel Blob API
    const loadTrainings = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/trainings')
        
        if (!response.ok) {
          throw new Error('Erro ao carregar treinamentos')
        }
        
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
            <div className="space-y-4">
              <div className="w-full h-[70vh] border rounded-lg overflow-hidden bg-background">
                <iframe
                  src={`/api/trainings/pdf?url=${encodeURIComponent(selectedTraining.url)}`}
                  className="w-full h-full"
                  title={selectedTraining.title}
                />
              </div>
            </div>
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
              onClick={() => setSelectedTraining(training)}
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
