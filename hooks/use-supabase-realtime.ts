"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, QualityPost } from "@/lib/types"

const supabase = createClient()

// Users hook with realtime
export function useSupabaseUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(async () => {
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
      }))
      setUsers(mappedUsers)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchUsers()

    // Setup realtime subscription
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
    fetchPosts()

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
export function useAdminQuestions() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchQuestions = useCallback(async () => {
    const { data, error } = await supabase
      .from("admin_questions")
      .select("*")
      .order("created_at", { ascending: false })

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
      })))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchQuestions()

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

// All Users hook (simplified)
export function useAllUsers() {
  return useSupabaseUsers()
}

// Supabase CRUD functions
export async function createQualityPostSupabase(post: {
  type: string
  content: string
  authorId: string
  authorName: string
  quizOptions?: any[]
}): Promise<QualityPost | null> {
  const { data, error } = await supabase
    .from("quality_posts")
    .insert({
      type: post.type,
      content: post.content,
      author_id: post.authorId,
      author_name: post.authorName,
      quiz_options: post.quizOptions || null,
      likes: [],
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
  }
}

export async function likePostSupabase(postId: string, userId: string): Promise<void> {
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
  postsCount: number
  likesCount: number
  commentsCount: number
}> {
  const { data: posts } = await supabase.from("quality_posts").select("likes")
  const { count: commentsCount } = await supabase
    .from("quality_comments")
    .select("*", { count: "exact", head: true })

  const postsCount = posts?.length || 0
  const likesCount = posts?.reduce((acc, p) => acc + (p.likes?.length || 0), 0) || 0

  return { postsCount, likesCount, commentsCount: commentsCount || 0 }
}

export async function createFeedbackSupabase(feedback: {
  type: string
  message: string
  authorId: string
  authorName: string
}): Promise<void> {
  await supabase.from("feedbacks").insert({
    type: feedback.type,
    message: feedback.message,
    operator_id: feedback.authorId,
    operator_name: feedback.authorName,
  })
}

// User management functions
export async function getUserByUsername(username: string): Promise<User | null> {
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
  await supabase
    .from("users")
    .update({ is_online: isOnline, last_seen: new Date().toISOString() })
    .eq("id", userId)
}

export async function getAllUsersFromSupabase(): Promise<User[]> {
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
