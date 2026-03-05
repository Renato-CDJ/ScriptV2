"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  MessageSquare,
} from "lucide-react"
import { useTheme } from "next-themes"
import {
  useQualityPosts,
  useAdminQuestions,
  useAllUsers,
  createQualityPostSupabase,
  likePostSupabase,
  addCommentSupabase,
  voteOnQuizSupabase,
  getQualityStatsSupabase,
  createFeedbackSupabase,
} from "@/hooks/use-supabase-realtime"
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
  
  // Use real-time hooks from Supabase
  const { posts, loading: postsLoading, refetch: refetchPosts } = useQualityPosts()

  const isAdmin = user?.role === "admin"

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
      <DialogContent className="!max-w-[98vw] w-[98vw] !max-h-[90vh] h-[85vh] p-0 gap-0 overflow-hidden flex flex-col bg-background">
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
          <aside className="w-56 bg-card border-r border-border p-4 shrink-0 flex flex-col">
            <nav className="space-y-1 flex-1">
              <SidebarButton
                icon={<Home className="h-5 w-5" />}
                label="Inicio"
                active={activeView === "inicio"}
                onClick={() => setActiveView("inicio")}
              />
              <SidebarButton
                icon={<User className="h-5 w-5" />}
                label="Meu Perfil"
                active={activeView === "perfil"}
                onClick={() => setActiveView("perfil")}
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
          <main className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-6">
                {activeView === "inicio" && (
                  <FeedView
                    posts={posts}
                    user={user}
                    searchQuery={searchQuery}
                    getInitials={getInitials}
                    formatTimeAgo={formatTimeAgo}
                  />
                )}
                {activeView === "perfil" && (
                  <ProfileView user={user} getInitials={getInitials} />
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
                  <FilteredFeedView
                    posts={posts.filter(p => p.type === "pergunta")}
                    user={user}
                    title="Perguntas"
                    icon={<MessageSquare className="h-5 w-5 text-cyan-500" />}
                    getInitials={getInitials}
                    formatTimeAgo={formatTimeAgo}
                  />
                )}
                {!["inicio", "admin", "perfil", "filter-comunicado", "filter-recado", "filter-feedback", "filter-quiz", "filter-perguntas"].includes(activeView) && (
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
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200",
        active
          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
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
function ProfileView({ user, getInitials }: { user: any; getInitials: (name: string) => string }) {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    nome: user?.fullName || user?.username || "",
    idade: "",
    interesses: "",
    curso: "",
    instituicao: "",
    email: user?.email || "",
    telefone: "",
    cidade: "",
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Meu Perfil</h2>
          <p className="text-muted-foreground text-sm">Gerencie suas informacoes pessoais</p>
        </div>
        <Button
          variant={isEditing ? "default" : "outline"}
          onClick={() => setIsEditing(!isEditing)}
          className={isEditing ? "bg-orange-500 hover:bg-orange-600" : ""}
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </>
          ) : (
            <>
              <Edit3 className="h-4 w-4 mr-2" />
              Editar
            </>
          )}
        </Button>
      </div>

      {/* Profile Header Card */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-zinc-800 to-zinc-700 dark:from-zinc-700 dark:to-zinc-600" />
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                {getInitials(profile.nome)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-2">
              <h3 className="text-xl font-bold">{profile.nome || "Seu Nome"}</h3>
              <p className="text-muted-foreground text-sm capitalize">{user?.role || "Operador"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal Info */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-orange-500" />
              Informacoes Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Nome Completo</Label>
              {isEditing ? (
                <Input
                  value={profile.nome}
                  onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
                  className="h-9"
                />
              ) : (
                <p className="text-sm font-medium">{profile.nome || "-"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Cake className="h-3 w-3" /> Idade
              </Label>
              {isEditing ? (
                <Input
                  value={profile.idade}
                  onChange={(e) => setProfile({ ...profile, idade: e.target.value })}
                  placeholder="Ex: 25 anos"
                  className="h-9"
                />
              ) : (
                <p className="text-sm font-medium">{profile.idade || "-"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Cidade
              </Label>
              {isEditing ? (
                <Input
                  value={profile.cidade}
                  onChange={(e) => setProfile({ ...profile, cidade: e.target.value })}
                  placeholder="Ex: Sao Paulo, SP"
                  className="h-9"
                />
              ) : (
                <p className="text-sm font-medium">{profile.cidade || "-"}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Education */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blue-500" />
              Formacao
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Curso</Label>
              {isEditing ? (
                <Input
                  value={profile.curso}
                  onChange={(e) => setProfile({ ...profile, curso: e.target.value })}
                  placeholder="Ex: Administracao"
                  className="h-9"
                />
              ) : (
                <p className="text-sm font-medium">{profile.curso || "-"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Instituicao</Label>
              {isEditing ? (
                <Input
                  value={profile.instituicao}
                  onChange={(e) => setProfile({ ...profile, instituicao: e.target.value })}
                  placeholder="Ex: Universidade XYZ"
                  className="h-9"
                />
              ) : (
                <p className="text-sm font-medium">{profile.instituicao || "-"}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Interests */}
        <Card className="border-0 shadow-sm md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              Interesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">O que voce gosta?</Label>
              {isEditing ? (
                <Textarea
                  value={profile.interesses}
                  onChange={(e) => setProfile({ ...profile, interesses: e.target.value })}
                  placeholder="Ex: Musica, Esportes, Tecnologia, Viagens..."
                  className="min-h-[80px] resize-none"
                />
              ) : (
                <p className="text-sm font-medium">{profile.interesses || "-"}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="border-0 shadow-sm md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-green-500" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Mail className="h-3 w-3" /> E-mail
                </Label>
                {isEditing ? (
                  <Input
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="seu@email.com"
                    className="h-9"
                  />
                ) : (
                  <p className="text-sm font-medium">{profile.email || "-"}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Telefone
                </Label>
                {isEditing ? (
                  <Input
                    value={profile.telefone}
                    onChange={(e) => setProfile({ ...profile, telefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="h-9"
                  />
                ) : (
                  <p className="text-sm font-medium">{profile.telefone || "-"}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

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
}: {
  posts: QualityPost[]
  user: any
  searchQuery: string
  getInitials: (name: string) => string
  formatTimeAgo: (date: Date) => string
}) {
  const [newPostContent, setNewPostContent] = useState("")
  const [isQuestionToAdmin, setIsQuestionToAdmin] = useState(false)
  const [expandedComments, setExpandedComments] = useState<string[]>([])
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery) return true
    return (
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.authorName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user) return

    await createQualityPostSupabase({
      type: isQuestionToAdmin ? "pergunta" : "comunicado",
      content: newPostContent,
      authorId: user.id,
      authorName: user.fullName || user.username || "Usuario",
      isQuestionToAdmin,
    })

    setNewPostContent("")
    setIsQuestionToAdmin(false)
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Questions Received Section (for admins) */}
      {user?.role === "admin" && (
        <QuestionsReceivedSection getInitials={getInitials} formatTimeAgo={formatTimeAgo} />
      )}

      {/* New Post Card */}
      <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="h-11 w-11 bg-orange-100 dark:bg-orange-900/50 border-2 border-orange-500/30">
              <AvatarFallback className="text-orange-600 dark:text-orange-300 font-semibold">
                {getInitials(user?.fullName || user?.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Compartilhe algo com a equipe..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[80px] bg-muted/50 border-0 resize-none focus:ring-2 focus:ring-orange-500/20"
              />
              <div className="flex items-center justify-between mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsQuestionToAdmin(!isQuestionToAdmin)}
                  className={cn(
                    "gap-2 transition-colors",
                    isQuestionToAdmin &&
                      "bg-orange-500/10 border-orange-500/50 text-orange-600 dark:text-orange-400"
                  )}
                >
                  <HelpCircle className="h-4 w-4" />
                  Pergunta para Admin
                </Button>
                <Button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim()}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-2 shadow-md"
                >
                  <Send className="h-4 w-4" />
                  Publicar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      {filteredPosts.map((post) => {
        const badge = getPostTypeBadge(post.type)
        const isLiked = post.likes?.includes(user?.id || "")
        const totalVotes = post.quizOptions?.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0) || 0

        return (
          <Card key={post.id} className="border-border shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-4">
              {/* Post Header */}
              <div className="flex items-start gap-3 mb-3">
                <Avatar className="h-11 w-11 bg-muted">
                  <AvatarFallback className="font-medium">{getInitials(post.authorName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{post.authorName}</span>
                    <Badge variant="outline" className={cn("text-xs gap-1", badge.className)}>
                      {badge.icon}
                      {badge.label}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{formatTimeAgo(post.createdAt)}</span>
                </div>
              </div>

              {/* Post Content */}
              <div
                className="mb-4 text-foreground prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Quiz Options */}
              {post.type === "quiz" && post.quizOptions && (
                <div className="space-y-2 mb-4">
                  {post.quizOptions.map((option) => {
                    const voteCount = option.votes?.length || 0
                    const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
                    const hasVoted = option.votes?.includes(user?.id || "")

                    return (
                      <button
                        key={option.id}
                        onClick={() => handleVote(post.id, option.id)}
                        className={cn(
                          "w-full p-3 rounded-lg border-2 text-left relative overflow-hidden transition-all",
                          hasVoted
                            ? "border-orange-500 bg-orange-500/10"
                            : "border-border hover:border-orange-500/50 hover:bg-muted/50"
                        )}
                      >
                        <div
                          className="absolute inset-0 bg-orange-500/20 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                        <div className="relative flex justify-between items-center">
                          <span className="font-medium">{option.text}</span>
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
                    <div key={comment.id} className="flex gap-2">
                      <Avatar className="h-8 w-8 bg-muted">
                        <AvatarFallback className="text-xs">{getInitials(comment.authorName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-muted rounded-xl p-3">
                        <span className="font-medium text-sm">{comment.authorName}</span>
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
    </div>
  )
}

// Questions Received Section
function QuestionsReceivedSection({
  getInitials,
  formatTimeAgo,
}: {
  getInitials: (name: string) => string
  formatTimeAgo: (date: Date) => string
}) {
  const { questions } = useAdminQuestions()

  if (questions.length === 0) return null

  return (
    <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-orange-600/5 dark:from-orange-500/10 dark:to-orange-600/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <HelpCircle className="h-5 w-5 text-orange-500" />
          </div>
          <span className="font-semibold">Perguntas dos Operadores</span>
          <Badge className="bg-orange-500 text-white">{questions.length}</Badge>
        </div>
        <div className="space-y-3">
          {questions.slice(0, 3).map((question) => (
            <div key={question.id} className="flex items-start gap-3 p-3 bg-card rounded-xl border border-border">
              <Avatar className="h-10 w-10 bg-muted">
                <AvatarFallback>{getInitials(question.authorName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{question.authorName}</span>
                  <span className="text-sm text-muted-foreground">{formatTimeAgo(question.createdAt)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {question.content.replace(/<[^>]*>/g, "")}
                </p>
              </div>
              <Button size="sm" variant="outline" className="shrink-0">
                Responder
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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
      {/* Questions Panel - Left Side */}
      <div className="w-80 shrink-0">
        <QuestionsTab getInitials={getInitials} formatTimeAgo={formatTimeAgo} compact />
      </div>

      {/* Main Admin Panel - Right Side */}
      <div className="flex-1 max-w-3xl">
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
    </div>
  )
}

// Publish Tab
function PublishTab({ user }: { user: any }) {
  const [content, setContent] = useState("")
  const [type, setType] = useState<"comunicado" | "recado">("comunicado")
  const [sendToAll, setSendToAll] = useState(true)

  const handlePublish = async () => {
    if (!content.trim() || !user) return

    await createQualityPostSupabase({
      type,
      content,
      authorId: user.id,
      authorName: user.fullName || user.username || "Admin",
    })

    setContent("")
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

        <div className="space-y-2 pt-3 border-t">
          <Label className="text-xs font-medium">Destinatarios</Label>
          <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-md">
            <Checkbox 
              id="sendToAll" 
              checked={sendToAll} 
              onCheckedChange={(checked) => setSendToAll(checked as boolean)}
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
        </div>

        <Button
          onClick={handlePublish}
          disabled={!content.trim()}
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

  const addOption = () => setOptions([...options, ""])
  const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index))
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handlePublish = async () => {
    if (!question.trim() || options.filter((o) => o.trim()).length < 2 || !user) return

    await createQualityPostSupabase({
      type: "quiz",
      content: question,
      authorId: user.id,
      authorName: user.fullName || user.username || "Admin",
      quizOptions: options
        .filter((o) => o.trim())
        .map((text, i) => ({ id: `opt-${Date.now()}-${i}`, text, votes: [] })),
    })

    setQuestion("")
    setOptions(["", ""])
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
          <Label>Opcoes</Label>
          {options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder={`Opcao ${index + 1}`}
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
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
        </div>

        <Button
          onClick={handlePublish}
          disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}
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

// Questions Tab
function QuestionsTab({
  getInitials,
  formatTimeAgo,
  compact = false,
}: {
  getInitials: (name: string) => string
  formatTimeAgo: (date: Date) => string
  compact?: boolean
}) {
  const { questions, loading } = useAdminQuestions()

  return (
    <Card className={compact ? "border-orange-500/50 border-2" : ""}>
      <CardHeader className={compact ? "py-3 px-4" : "pb-4"}>
        <CardTitle className={`flex items-center gap-2 ${compact ? "text-base" : "text-lg"}`}>
          <HelpCircle className={`text-orange-500 ${compact ? "h-4 w-4" : "h-5 w-5"}`} />
          Perguntas dos Operadores
          {questions.length > 0 && (
            <Badge className="bg-orange-500 text-white ml-1">{questions.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className={compact ? "px-4 pb-4 pt-0" : "p-6 pt-0"}>
        {questions.length === 0 ? (
          <div className={`text-center ${compact ? "py-6" : "py-12"}`}>
            <div className={`bg-muted rounded-full inline-block mb-3 ${compact ? "p-3" : "p-6"}`}>
              <HelpCircle className={`text-muted-foreground ${compact ? "h-6 w-6" : "h-12 w-12"}`} />
            </div>
            <h3 className={`font-semibold mb-1 ${compact ? "text-sm" : "text-xl"}`}>Nenhuma pergunta</h3>
            <p className={`text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}>Nenhuma pergunta pendente</p>
          </div>
        ) : (
          <ScrollArea className={compact ? "h-[400px]" : "max-h-[500px]"}>
            <div className="space-y-3">
              {questions.map((question) => (
                <div key={question.id} className={`border border-border rounded-lg ${compact ? "p-3" : "p-4"}`}>
                  <div className="flex items-start gap-2">
                    <Avatar className={`bg-orange-100 dark:bg-orange-900/50 ${compact ? "h-8 w-8" : "h-10 w-10"}`}>
                      <AvatarFallback className={`text-orange-600 dark:text-orange-300 ${compact ? "text-xs" : "text-sm"}`}>
                        {getInitials(question.authorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold ${compact ? "text-sm" : ""}`}>{question.authorName}</span>
                        <span className={`text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}>
                          {formatTimeAgo(question.createdAt)}
                        </span>
                      </div>
                      <p className={`mt-1 text-foreground ${compact ? "text-sm" : ""}`}>
                        {question.content.replace(/<[^>]*>/g, "")}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-orange-500/50 text-orange-600 hover:bg-orange-500/10"
                        >
                          Responder
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

// Stats Tab
function StatsTab() {
  const [stats, setStats] = useState({ totalPosts: 0, totalLikes: 0, totalComments: 0, totalUsers: 0, onlineNow: 0 })

  useEffect(() => {
    getQualityStatsSupabase().then((data) => {
      setStats({ ...data, onlineNow: 0 })
    })
  }, [])

  const statCards = [
    { label: "Publicacoes", value: stats.totalPosts, icon: <MessageSquare className="h-6 w-6" />, color: "blue" },
    { label: "Curtidas", value: stats.totalLikes, icon: <ThumbsUp className="h-6 w-6" />, color: "orange" },
    { label: "Comentarios", value: stats.totalComments, icon: <MessageCircle className="h-6 w-6" />, color: "green" },
    { label: "Usuarios", value: stats.totalUsers, icon: <Users className="h-6 w-6" />, color: "purple" },
    { label: "Online Agora", value: stats.onlineNow, icon: <TrendingUp className="h-6 w-6" />, color: "emerald" },
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
