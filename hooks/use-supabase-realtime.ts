"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, QualityPost } from "@/lib/types"

// Use singleton client
const getSupabase = () => createClient()

// Users hook with realtime
export function useSupabaseUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabase>["channel"]> | null>(null)

  const fetchUsers = useCallback(async () => {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: true })

    if (!error && data) {
      const mappedUsers: User[] = data.map((u) => ({
        id: u.id,
        username: u.username,
        fullName: u.name,
        email: u.email,
        password: u.password,
        role: u.role,
        adminType: u.admin_type,
        allowedTabs: u.allowed_tabs || [],
        isOnline: u.is_online,
        isActive: u.is_active,
        createdAt: new Date(u.created_at),
        // Presence fields for Dashboard
        lastActivity: u.last_activity,
        lastLogin: u.last_login,
        lastScriptAccess: u.last_script_access,
        currentProduct: u.current_product,
        currentScreen: u.current_screen,
      }))
      setUsers(mappedUsers)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const supabase = getSupabase()
    fetchUsers()

    // Cleanup existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // Setup realtime subscription with unique channel name
    const channelName = `users-changes-${Date.now()}`
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        () => {
          fetchUsers()
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [fetchUsers])

  return { users, loading, refetch: fetchUsers }
}

// Quality Posts hook with realtime
export function useQualityPosts() {
  const [posts, setPosts] = useState<QualityPost[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabase>["channel"]> | null>(null)

  const fetchPosts = useCallback(async () => {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("quality_posts")
      .select(`
        *,
        quality_comments (*)
      `)
      .order("created_at", { ascending: false })

    if (!error && data) {
      const mappedPosts: QualityPost[] = data.map((p) => ({
        id: p.id,
        type: p.type,
        content: p.content,
        authorId: p.author_id,
        authorName: p.author_name,
        likes: p.likes || [],
        quizOptions: p.quiz_options || [],
        createdAt: new Date(p.created_at),
        isActive: p.is_active ?? true,
        recipients: p.recipients || [],
        recipientNames: p.recipient_names || [],
        sendToAll: p.send_to_all ?? true,
        comments: (p.quality_comments || []).map((c: any) => ({
          id: c.id,
          authorId: c.author_id,
          authorName: c.author_name,
          content: c.content,
          createdAt: new Date(c.created_at),
        })),
      }))
      setPosts(mappedPosts)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const supabase = getSupabase()
    fetchPosts()

    // Cleanup existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channelName = `quality-posts-changes-${Date.now()}`
    const channel = supabase
      .channel(channelName)
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

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [fetchPosts])

  return { posts, loading, refetch: fetchPosts }
}

// Admin Questions hook
export function useAdminQuestions(filterByUserId?: string) {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabase>["channel"]> | null>(null)

  const fetchQuestions = useCallback(async () => {
    const supabase = getSupabase()
    let query = supabase
      .from("admin_questions")
      .select("*")
      .order("created_at", { ascending: false })
    
    // Filter by user if provided (for operator view)
    if (filterByUserId) {
      query = query.eq("author_id", filterByUserId)
    }

    const { data, error } = await query

    if (!error && data) {
      setQuestions(data.map((q) => ({
        id: q.id,
        question: q.question,
        authorId: q.author_id,
        authorName: q.author_name,
        reply: q.reply,
        repliedBy: q.replied_by,
        repliedByName: q.replied_by_name,
        repliedAt: q.replied_at,
        createdAt: q.created_at,
        // New fields for understand flow
        understood: q.understood,
        replyCount: q.reply_count || 1,
        needsInPersonFeedback: q.needs_in_person_feedback || false,
        secondReply: q.second_reply,
        secondRepliedAt: q.second_replied_at,
      })))
    }
    setLoading(false)
  }, [filterByUserId])

  useEffect(() => {
    const supabase = getSupabase()
    fetchQuestions()

    // Cleanup existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channelName = `admin-questions-changes-${Date.now()}`
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_questions" },
        () => fetchQuestions()
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [fetchQuestions])

  return { questions, loading, refetch: fetchQuestions }
}

// All Users hook (simplified)
export function useAllUsers() {
  return useSupabaseUsers()
}

// Operator Presence hook - shows online/idle/offline status in realtime
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
          lastHeartbeat: u.lastActivity, // alias for dashboard
          lastLoginAt: u.lastLogin,
          lastScriptAccess: u.lastScriptAccess,
          currentProduct: u.currentProduct,
          currentProductName: u.currentProduct || null, // alias for dashboard
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
  const supabase = getSupabase()
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

  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)

  return { error: error?.message }
}

// Hook for operator to maintain presence
export function usePresenceHeartbeat(userId?: string) {
  useEffect(() => {
    if (!userId) return

    // Update presence immediately
    updateOperatorPresence(userId)

    // Then update every 30 seconds
    const interval = setInterval(() => {
      updateOperatorPresence(userId)
    }, 30000)

    return () => clearInterval(interval)
  }, [userId])
}

// Supabase CRUD functions
export async function createQualityPostSupabase(post: {
  type: string
  content: string
  authorId: string
  authorName: string
  quizOptions?: any[]
  recipients?: string[]
  recipientNames?: string[]
  sendToAll?: boolean
}): Promise<QualityPost | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("quality_posts")
    .insert({
      type: post.type,
      content: post.content,
      author_id: post.authorId,
      author_name: post.authorName,
      quiz_options: post.quizOptions || null,
      likes: [],
      recipients: post.recipients || [],
      recipient_names: post.recipientNames || [],
      send_to_all: post.sendToAll ?? true,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating post:", error)
    return null
  }

  return {
    id: data.id,
    type: data.type,
    content: data.content,
    authorId: data.author_id,
    authorName: data.author_name,
    likes: data.likes || [],
    quizOptions: data.quiz_options || [],
    comments: [],
    createdAt: new Date(data.created_at),
    recipients: data.recipients || [],
    recipientNames: data.recipient_names || [],
    sendToAll: data.send_to_all ?? true,
  }
}

export async function likePostSupabase(postId: string, userId: string): Promise<void> {
  const supabase = getSupabase()
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

  await supabase
    .from("quality_posts")
    .update({ likes: newLikes })
    .eq("id", postId)
}

export async function addCommentSupabase(
  postId: string,
  comment: { authorId: string; authorName: string; content: string }
): Promise<void> {
  const supabase = getSupabase()
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
  const supabase = getSupabase()
  const { data: post } = await supabase
    .from("quality_posts")
    .select("quiz_options")
    .eq("id", postId)
    .single()

  if (!post || !post.quiz_options) return

  const updatedOptions = post.quiz_options.map((opt: any) => ({
    ...opt,
    votes: opt.id === optionId
      ? [...(opt.votes || []).filter((v: string) => v !== userId), userId]
      : (opt.votes || []).filter((v: string) => v !== userId),
  }))

  await supabase
    .from("quality_posts")
    .update({ quiz_options: updatedOptions })
    .eq("id", postId)
}

export async function getQualityStatsSupabase(): Promise<{
  totalPosts: number
  totalLikes: number
  totalComments: number
  totalUsers: number
}> {
  const supabase = getSupabase()
  const { data: posts } = await supabase.from("quality_posts").select("likes")
  const { count: commentsCount } = await supabase
    .from("quality_comments")
    .select("*", { count: "exact", head: true })
  const { count: usersCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("role", "operator")

  const totalPosts = posts?.length || 0
  const totalLikes = posts?.reduce((acc, p) => acc + (p.likes?.length || 0), 0) || 0

  return { 
    totalPosts, 
    totalLikes, 
    totalComments: commentsCount || 0,
    totalUsers: usersCount || 0
  }
}

// Feedbacks hook with realtime
export function useFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabase>["channel"]> | null>(null)

  const fetchFeedbacks = useCallback(async () => {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("feedbacks")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setFeedbacks(data.map((f) => ({
        id: f.id,
        type: f.type,
        message: f.message,
        operatorId: f.operator_id,
        operatorName: f.operator_name,
        isRead: f.is_read,
        createdAt: f.created_at,
      })))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const supabase = getSupabase()
    fetchFeedbacks()

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channelName = `feedbacks-changes-${Date.now()}`
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feedbacks" },
        () => fetchFeedbacks()
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
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
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabase>["channel"]> | null>(null)

  const fetchStats = useCallback(async () => {
    const data = await getQualityStatsSupabase()
    setStats(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    const supabase = getSupabase()
    fetchStats()

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channelName = `quality-stats-changes-${Date.now()}`
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quality_posts" },
        () => fetchStats()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quality_comments" },
        () => fetchStats()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        () => fetchStats()
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [fetchStats])

  return { stats, loading, refetch: fetchStats }
}

// Answer admin question (first reply)
export async function answerAdminQuestion(
  questionId: string,
  reply: string,
  adminId: string,
  adminName: string
): Promise<void> {
  const supabase = getSupabase()
  await supabase
    .from("admin_questions")
    .update({
      reply,
      replied_by: adminId,
      replied_by_name: adminName,
      replied_at: new Date().toISOString(),
      reply_count: 1,
    })
    .eq("id", questionId)
}

// Answer admin question (second reply - when operator didn't understand first)
export async function answerAdminQuestionSecond(
  questionId: string,
  secondReply: string,
  adminId: string,
  adminName: string
): Promise<void> {
  const supabase = getSupabase()
  await supabase
    .from("admin_questions")
    .update({
      second_reply: secondReply,
      second_replied_at: new Date().toISOString(),
      reply_count: 2,
      understood: null, // Reset understood status for operator to respond again
    })
    .eq("id", questionId)
}

// Operator marks if they understood the answer
export async function markQuestionUnderstood(
  questionId: string,
  understood: boolean
): Promise<void> {
  const supabase = getSupabase()
  const updates: any = { understood }
  
  // If operator didn't understand after second reply, mark for in-person feedback
  const { data } = await supabase
    .from("admin_questions")
    .select("reply_count")
    .eq("id", questionId)
    .single()
  
  if (!understood && data?.reply_count >= 2) {
    updates.needs_in_person_feedback = true
  }
  
  await supabase
    .from("admin_questions")
    .update(updates)
    .eq("id", questionId)
}

// Create admin question (from operator)
export async function createAdminQuestion(data: {
  question: string
  authorId: string
  authorName: string
}): Promise<void> {
  const supabase = getSupabase()
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
  const supabase = getSupabase()
  // First delete all comments associated with this post
  await supabase.from("quality_comments").delete().eq("post_id", postId)
  // Then delete the post
  await supabase.from("quality_posts").delete().eq("id", postId)
}

// Edit quality post
export async function editQualityPostSupabase(postId: string, content: string): Promise<void> {
  const supabase = getSupabase()
  await supabase
    .from("quality_posts")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", postId)
}

// Delete comment
export async function deleteCommentSupabase(commentId: string): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("quality_comments").delete().eq("id", commentId)
}

// Edit comment
export async function editCommentSupabase(commentId: string, content: string): Promise<void> {
  const supabase = getSupabase()
  await supabase
    .from("quality_comments")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", commentId)
}

// Mark feedback as read
export async function markFeedbackAsRead(feedbackId: string): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("feedbacks").update({ is_read: true }).eq("id", feedbackId)
}

// Create feedback for operator (admin function)
export async function createFeedbackSupabase(feedback: {
  operatorId: string
  operatorName: string
  createdBy: string
  createdByName: string
  feedbackType: "positive" | "negative"
  details: string
  score?: number
}): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("feedbacks").insert({
    type: feedback.feedbackType,
    message: feedback.details,
    operator_id: feedback.operatorId,
    operator_name: feedback.operatorName,
    created_by: feedback.createdBy,
    created_by_name: feedback.createdByName,
    score: feedback.score || (feedback.feedbackType === "positive" ? 80 : 40),
  })
}

// User management functions
export async function getUserByUsername(username: string): Promise<User | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .ilike("username", username)
    .eq("is_active", true)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    username: data.username,
    fullName: data.name,
    email: data.email,
    password: data.password,
    role: data.role,
    adminType: data.admin_type,
    allowedTabs: data.allowed_tabs || [],
    isOnline: data.is_online,
    isActive: data.is_active,
    createdAt: new Date(data.created_at),
  }
}

export async function updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
  const supabase = getSupabase()
  await supabase
    .from("users")
    .update({ is_online: isOnline, last_seen: new Date().toISOString() })
    .eq("id", userId)
}

export async function getAllUsersFromSupabase(): Promise<User[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: true })

  if (error || !data) return []

  return data.map((u) => ({
    id: u.id,
    username: u.username,
    fullName: u.name,
    email: u.email,
    password: u.password,
    role: u.role,
    adminType: u.admin_type,
    allowedTabs: u.allowed_tabs || [],
    isOnline: u.is_online,
    isActive: u.is_active,
    createdAt: new Date(u.created_at),
  }))
}
