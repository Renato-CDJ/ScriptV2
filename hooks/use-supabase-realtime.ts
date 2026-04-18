"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { mapSupabaseUser } from "@/lib/auth-context"
import type { User, QualityPost, QualityComment } from "@/lib/types"

// Users hook with realtime
export function useSupabaseUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: true })

    if (!error && data) {
      setUsers(data.map(mapSupabaseUser))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchUsers()

    const supabase = createClient()
    const channel = supabase
      .channel("users-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        () => {
          fetchUsers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchUsers])

  return { users, loading, refetch: fetchUsers }
}

// Quality Posts hook with realtime
export function useQualityPosts() {
  const [posts, setPosts] = useState<QualityPost[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = useCallback(async () => {
    const supabase = createClient()
    
    // Fetch posts
    const { data: postsData, error } = await supabase
      .from("quality_posts")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Supabase] Error fetching posts:", error)
      setLoading(false)
      return
    }

    // Fetch all comments
    const { data: commentsData } = await supabase
      .from("quality_comments")
      .select("*")
      .order("created_at", { ascending: true })

    const commentsMap = new Map<string, QualityComment[]>()
    if (commentsData) {
      for (const c of commentsData) {
        const postComments = commentsMap.get(c.post_id) || []
        postComments.push({
          id: c.id,
          authorId: c.author_id,
          authorName: c.author_name,
          content: c.content,
          createdAt: new Date(c.created_at),
        })
        commentsMap.set(c.post_id, postComments)
      }
    }

    const mappedPosts: QualityPost[] = (postsData || []).map((p) => ({
      id: p.id,
      type: p.type,
      content: p.content,
      authorId: p.author_id,
      authorName: p.author_name,
      likes: p.likes || [],
      quizOptions: p.quiz_options || [],
      correctOption: p.correct_option,
      createdAt: new Date(p.created_at),
      isActive: p.is_active ?? true,
      recipients: p.recipients || [],
      recipientNames: p.recipient_names || [],
      sendToAll: p.send_to_all ?? true,
      backgroundColor: p.background_color || undefined,
      comments: commentsMap.get(p.id) || [],
    }))

    setPosts(mappedPosts)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPosts()

    const supabase = createClient()
    const channel = supabase
      .channel("quality-posts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quality_posts" },
        () => fetchPosts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quality_comments" },
        () => fetchPosts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchPosts])

  return { posts, loading, refetch: fetchPosts }
}

// Admin Questions hook
export function useAdminQuestions(filterByUserId?: string) {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchQuestions = useCallback(async () => {
    const supabase = createClient()
    let query = supabase
      .from("admin_questions")
      .select("*")
      .order("created_at", { ascending: false })

    if (filterByUserId) {
      query = query.eq("author_id", filterByUserId)
    }

    const { data, error } = await query

    if (!error && data) {
      const mapped = data.map((d) => ({
        id: d.id,
        question: d.question,
        authorId: d.author_id,
        authorName: d.author_name,
        reply: d.reply,
        repliedBy: d.replied_by,
        repliedByName: d.replied_by_name,
        repliedAt: d.replied_at,
        createdAt: d.created_at,
        understood: d.understood,
        replyCount: d.reply_count || 1,
        needsInPersonFeedback: d.needs_in_person_feedback || false,
        secondReply: d.second_reply,
        secondRepliedAt: d.second_replied_at,
      }))
      setQuestions(mapped)
    }
    setLoading(false)
  }, [filterByUserId])

  useEffect(() => {
    fetchQuestions()

    const supabase = createClient()
    const channel = supabase
      .channel("admin-questions-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_questions" },
        () => fetchQuestions()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchQuestions])

  return { questions, loading, refetch: fetchQuestions }
}

// All Users hook (alias)
export function useAllUsers() {
  return useSupabaseUsers()
}

// Operator Presence hook
export function useOperatorPresence() {
  const { users, loading, refetch } = useSupabaseUsers()

  const operatorsWithStatus = useMemo(() => {
    const now = Date.now()
    const ONLINE_THRESHOLD = 2 * 60 * 1000 // 2 minutes
    const IDLE_THRESHOLD = 10 * 60 * 1000 // 10 minutes

    return users
      .filter((u: any) => u.role === "operator" && u.isActive !== false)
      .map((u: any) => {
        const lastActivityTime = u.lastActivity ? new Date(u.lastActivity).getTime() : 0
        const diff = now - lastActivityTime

        let statusDetail: "online" | "idle" | "offline" = "offline"
        if (lastActivityTime > 0 && diff < ONLINE_THRESHOLD) {
          statusDetail = "online"
        } else if (lastActivityTime > 0 && diff < IDLE_THRESHOLD) {
          statusDetail = "idle"
        }

        return {
          id: u.id,
          username: u.username,
          fullName: u.fullName || u.username,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
          statusDetail,
          lastActivity: u.lastActivity,
          lastHeartbeat: u.lastActivity,
          lastLoginAt: u.lastLoginAt,
          lastScriptAccess: u.lastScriptAccess,
          currentProduct: u.currentProduct,
          currentProductName: u.currentProduct || null,
          currentScreen: u.currentScreen,
        }
      })
  }, [users])

  const onlineCount = operatorsWithStatus.filter((o) => o.statusDetail === "online").length
  const idleCount = operatorsWithStatus.filter((o) => o.statusDetail === "idle").length
  const offlineCount = operatorsWithStatus.filter((o) => o.statusDetail === "offline").length

  return {
    operators: operatorsWithStatus,
    loading,
    onlineCount,
    idleCount,
    offlineCount,
    totalCount: operatorsWithStatus.length,
    refetch,
  }
}

// Update operator presence (heartbeat)
export async function updateOperatorPresence(userId: string, data?: {
  currentProduct?: string
  currentScreen?: string
  lastScriptAccess?: boolean
}) {
  try {
    const supabase = createClient()
    
    const updates: any = {
      last_activity: new Date().toISOString(),
    }

    if (data?.currentProduct !== undefined) {
      updates.current_product = data.currentProduct
    }
    if (data?.currentScreen !== undefined) {
      updates.current_screen = data.currentScreen
    }
    if (data?.lastScriptAccess) {
      updates.last_script_access = new Date().toISOString()
    }

    await supabase.from("users").update(updates).eq("id", userId)
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Hook for operator to maintain presence
export function usePresenceHeartbeat(userId?: string) {
  useEffect(() => {
    if (!userId) return

    updateOperatorPresence(userId)

    const interval = setInterval(() => {
      updateOperatorPresence(userId)
    }, 30000)

    return () => clearInterval(interval)
  }, [userId])
}

// Quality Post CRUD
export async function createQualityPostSupabase(post: {
  type: string
  content: string
  authorId: string
  authorName: string
  authorRole?: string
  quizOptions?: any[]
  correctOption?: number
  recipients?: string[]
  recipientNames?: string[]
  sendToAll?: boolean
  backgroundColor?: string
}): Promise<QualityPost | null> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from("quality_posts")
      .insert({
        type: post.type,
        content: post.content,
        author_id: post.authorId,
        author_name: post.authorName,
        quiz_options: post.quizOptions || null,
        correct_option: post.correctOption ?? null,
        likes: [],
        recipients: post.recipients || [],
        recipient_names: post.recipientNames || [],
        send_to_all: post.sendToAll ?? true,
        background_color: post.backgroundColor || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      type: post.type as any,
      content: post.content,
      authorId: post.authorId,
      authorName: post.authorName,
      likes: [],
      quizOptions: post.quizOptions || [],
      comments: [],
      createdAt: new Date(),
      isActive: true,
      recipients: post.recipients || [],
      recipientNames: post.recipientNames || [],
      sendToAll: post.sendToAll ?? true,
      backgroundColor: post.backgroundColor || undefined,
    }
  } catch (error) {
    console.error("[Supabase] Error creating quality post:", error)
    return null
  }
}

export async function likePostSupabase(postId: string, userId: string): Promise<void> {
  const supabase = createClient()
  
  const { data: post } = await supabase
    .from("quality_posts")
    .select("likes")
    .eq("id", postId)
    .single()

  if (!post) return

  const currentLikes = post.likes || []
  const hasLiked = currentLikes.includes(userId)
  const newLikes = hasLiked
    ? currentLikes.filter((id: string) => id !== userId)
    : [...currentLikes, userId]

  await supabase.from("quality_posts").update({ likes: newLikes }).eq("id", postId)
}

export async function addCommentSupabase(
  postId: string,
  comment: { authorId: string; authorName: string; content: string }
): Promise<void> {
  const supabase = createClient()
  
  await supabase.from("quality_comments").insert({
    post_id: postId,
    author_id: comment.authorId,
    author_name: comment.authorName,
    content: comment.content,
  })
}

export async function voteOnQuizSupabase(
  postId: string,
  optionId: string,
  userId: string
): Promise<void> {
  const supabase = createClient()
  
  const { data: post } = await supabase
    .from("quality_posts")
    .select("quiz_options")
    .eq("id", postId)
    .single()

  if (!post?.quiz_options) return

  const updatedOptions = post.quiz_options.map((opt: any) => ({
    ...opt,
    votes: opt.id === optionId
      ? [...(opt.votes || []).filter((v: string) => v !== userId), userId]
      : (opt.votes || []).filter((v: string) => v !== userId),
  }))

  await supabase.from("quality_posts").update({ quiz_options: updatedOptions }).eq("id", postId)
}

export async function getQualityStatsSupabase(): Promise<{
  totalPosts: number
  totalLikes: number
  totalComments: number
  totalUsers: number
  onlineCount: number
}> {
  const supabase = createClient()

  const { data: posts, count: postsCount } = await supabase
    .from("quality_posts")
    .select("likes", { count: "exact" })

  const totalLikes = (posts || []).reduce((acc, p) => acc + (p.likes?.length || 0), 0)

  const { count: commentsCount } = await supabase
    .from("quality_comments")
    .select("*", { count: "exact", head: true })

  const { data: users } = await supabase
    .from("users")
    .select("role, is_online")
    .eq("role", "operator")

  const totalUsers = users?.length || 0
  const onlineCount = users?.filter((u) => u.is_online === true).length || 0

  return {
    totalPosts: postsCount || 0,
    totalLikes,
    totalComments: commentsCount || 0,
    totalUsers,
    onlineCount,
  }
}

// Feedbacks hook with realtime
export function useFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFeedbacks = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("feedbacks")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      const mapped = data.map((f) => ({
        id: f.id,
        type: f.type,
        message: f.message,
        operatorId: f.operator_id,
        operatorName: f.operator_name,
        isRead: f.is_read,
        createdAt: f.created_at,
      }))
      setFeedbacks(mapped)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchFeedbacks()

    const supabase = createClient()
    const channel = supabase
      .channel("feedbacks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feedbacks" },
        () => fetchFeedbacks()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchFeedbacks])

  return { feedbacks, loading, refetch: fetchFeedbacks }
}

// Quality Stats hook with realtime
export function useQualityStats() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalUsers: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    const data = await getQualityStatsSupabase()
    setStats(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStats()

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [fetchStats])

  return { stats, loading, refetch: fetchStats }
}

// Admin Question CRUD
export async function answerAdminQuestion(
  questionId: string,
  reply: string,
  adminId: string,
  adminName: string
): Promise<void> {
  const supabase = createClient()
  
  await supabase.from("admin_questions").update({
    reply,
    replied_by: adminId,
    replied_by_name: adminName,
    replied_at: new Date().toISOString(),
    reply_count: 1,
  }).eq("id", questionId)
}

export async function answerAdminQuestionSecond(
  questionId: string,
  secondReply: string,
  adminId: string,
  adminName: string
): Promise<void> {
  const supabase = createClient()
  
  await supabase.from("admin_questions").update({
    second_reply: secondReply,
    second_replied_at: new Date().toISOString(),
    reply_count: 2,
    understood: null,
  }).eq("id", questionId)
}

export async function markQuestionUnderstood(
  questionId: string,
  understood: boolean
): Promise<void> {
  const supabase = createClient()

  const { data: question } = await supabase
    .from("admin_questions")
    .select("reply_count")
    .eq("id", questionId)
    .single()

  const updates: any = { understood }

  if (!understood && question?.reply_count >= 2) {
    updates.needs_in_person_feedback = true
  }

  await supabase.from("admin_questions").update(updates).eq("id", questionId)
}

export async function createAdminQuestion(data: {
  question: string
  authorId: string
  authorName: string
}): Promise<void> {
  const supabase = createClient()
  
  await supabase.from("admin_questions").insert({
    question: data.question,
    author_id: data.authorId,
    author_name: data.authorName,
    reply_count: 0,
    understood: null,
    needs_in_person_feedback: false,
  })
}

// Delete quality post
export async function deleteQualityPostSupabase(postId: string): Promise<void> {
  const supabase = createClient()
  
  // Delete comments first
  await supabase.from("quality_comments").delete().eq("post_id", postId)
  
  // Delete post
  await supabase.from("quality_posts").delete().eq("id", postId)
}

// Edit quality post
export async function editQualityPostSupabase(postId: string, content: string, backgroundColor?: string): Promise<void> {
  const supabase = createClient()
  
  const updates: any = { content, updated_at: new Date().toISOString() }
  if (backgroundColor !== undefined) {
    updates.background_color = backgroundColor || null
  }

  await supabase.from("quality_posts").update(updates).eq("id", postId)
}

// Delete comment
export async function deleteCommentSupabase(commentId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from("quality_comments").delete().eq("id", commentId)
}

// Edit comment
export async function editCommentSupabase(commentId: string, content: string): Promise<void> {
  const supabase = createClient()
  await supabase.from("quality_comments").update({
    content,
    updated_at: new Date().toISOString(),
  }).eq("id", commentId)
}

// Mark feedback as read
export async function markFeedbackAsRead(feedbackId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from("feedbacks").update({ is_read: true }).eq("id", feedbackId)
}

// Create feedback for operator
export async function createFeedbackSupabase(feedback: {
  operatorId: string
  operatorName: string
  createdBy: string
  createdByName: string
  supervisorId?: string
  supervisorName?: string
  feedbackType: "positive" | "negative"
  severity?: "elogio" | "leve" | "medio" | "grave"
  details: string
  score?: number
  positivePoints?: string
  improvementPoints?: string
}): Promise<void> {
  const supabase = createClient()

  // Insert into feedbacks table
  await supabase.from("feedbacks").insert({
    type: feedback.feedbackType,
    message: feedback.details,
    operator_id: feedback.operatorId,
    operator_name: feedback.operatorName,
    created_by: feedback.createdBy,
    created_by_name: feedback.createdByName,
    supervisor_id: feedback.supervisorId,
    supervisor_name: feedback.supervisorName,
    severity: feedback.severity || (feedback.feedbackType === "positive" ? "elogio" : "leve"),
    score: feedback.score || (feedback.feedbackType === "positive" ? 80 : 40),
    positive_points: feedback.positivePoints || "",
    improvement_points: feedback.improvementPoints || "",
    is_read: false,
  })

  // Also create a quality_post so it appears in the feed
  const feedbackLabel = feedback.feedbackType === "positive" ? "Feedback Positivo" : "Feedback Construtivo"

  const content = `**${feedbackLabel}** para ${feedback.operatorName}\n\n${feedback.details}${
    feedback.positivePoints ? `\n\n**Pontos positivos:** ${feedback.positivePoints}` : ""
  }${
    feedback.improvementPoints ? `\n\n**Pontos de melhoria:** ${feedback.improvementPoints}` : ""
  }`

  await supabase.from("quality_posts").insert({
    type: "feedback",
    content: content,
    author_id: feedback.createdBy,
    author_name: feedback.createdByName,
    likes: [],
    recipients: [feedback.operatorId],
    recipient_names: [feedback.operatorName],
    send_to_all: false,
    is_active: true,
  })
}

// User management functions
export async function getUserByUsername(username: string): Promise<User | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .ilike("username", username)
    .eq("is_active", true)
    .single()

  if (error || !data) return null
  return mapSupabaseUser(data)
}

export async function updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
  const supabase = createClient()
  
  await supabase.from("users").update({
    is_online: isOnline,
    last_activity: new Date().toISOString(),
  }).eq("id", userId)
}

export async function getAllUsersFromSupabase(): Promise<User[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: true })

  if (error || !data) return []
  return data.map(mapSupabaseUser)
}

// Re-export types
export type { User, QualityPost } from "@/lib/types"
