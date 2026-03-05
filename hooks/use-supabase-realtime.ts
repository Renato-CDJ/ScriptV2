"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { QualityPost, User } from "@/lib/types"

// Hook for real-time quality posts
export function useQualityPosts() {
  const [posts, setPosts] = useState<QualityPost[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("quality_posts")
      .select(`
        *,
        quality_comments (*)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setPosts(data.map((p: any) => ({
        id: p.id,
        type: p.type,
        content: p.content,
        authorId: p.author_id,
        authorName: p.author_name,
        createdAt: new Date(p.created_at),
        isActive: p.is_active,
        quizOptions: p.quiz_options || [],
        likes: p.likes || [],
        isQuestionToAdmin: p.is_question_to_admin,
        comments: (p.quality_comments || []).map((c: any) => ({
          id: c.id,
          authorId: c.author_id,
          authorName: c.author_name,
          content: c.content,
          createdAt: new Date(c.created_at),
        })),
      })))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPosts()

    // Subscribe to real-time changes
    const supabase = createClient()
    const channel = supabase
      .channel("quality_posts_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quality_posts" },
        () => {
          fetchPosts()
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quality_comments" },
        () => {
          fetchPosts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchPosts])

  return { posts, loading, refetch: fetchPosts }
}

// Hook for online users
export function useOnlineUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("is_online", true)
      .eq("is_active", true)

    if (!error && data) {
      setUsers(data.map((u: any) => ({
        id: u.id,
        username: u.username,
        fullName: u.name,
        role: u.role,
        isOnline: u.is_online,
        createdAt: new Date(u.created_at),
      })))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchUsers()

    const supabase = createClient()
    const channel = supabase
      .channel("users_online_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "users" },
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

// Hook for all users
export function useAllUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("is_active", true)
      .order("name")

    if (!error && data) {
      setUsers(data.map((u: any) => ({
        id: u.id,
        username: u.username,
        fullName: u.name,
        role: u.role,
        isOnline: u.is_online,
        createdAt: new Date(u.created_at),
      })))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchUsers()

    const supabase = createClient()
    const channel = supabase
      .channel("users_changes")
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

// Create quality post
export async function createQualityPostSupabase(post: {
  type: string
  content: string
  authorId: string
  authorName: string
  isQuestionToAdmin?: boolean
  quizOptions?: any[]
}): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from("quality_posts")
    .insert({
      type: post.type,
      content: post.content,
      author_id: post.authorId,
      author_name: post.authorName,
      is_question_to_admin: post.isQuestionToAdmin || false,
      quiz_options: post.quizOptions || [],
      likes: [],
      is_active: true,
    })

  return !error
}

// Like post
export async function likePostSupabase(postId: string, userId: string): Promise<boolean> {
  const supabase = createClient()
  
  const { data } = await supabase.from("quality_posts").select("likes").eq("id", postId).single()
  if (!data) return false
  
  const likes = data.likes || []
  const newLikes = likes.includes(userId) 
    ? likes.filter((id: string) => id !== userId)
    : [...likes, userId]
  
  const { error } = await supabase.from("quality_posts").update({ likes: newLikes }).eq("id", postId)
  return !error
}

// Add comment
export async function addCommentSupabase(postId: string, comment: {
  authorId: string
  authorName: string
  content: string
}): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from("quality_comments").insert({
    post_id: postId,
    author_id: comment.authorId,
    author_name: comment.authorName,
    content: comment.content,
  })
  return !error
}

// Get admin questions (questions to admin)
export function useAdminQuestions() {
  const [questions, setQuestions] = useState<QualityPost[]>([])
  const [loading, setLoading] = useState(true)

  const fetchQuestions = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("quality_posts")
      .select("*")
      .eq("is_question_to_admin", true)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setQuestions(data.map((p: any) => ({
        id: p.id,
        type: p.type,
        content: p.content,
        authorId: p.author_id,
        authorName: p.author_name,
        createdAt: new Date(p.created_at),
        isActive: p.is_active,
        isQuestionToAdmin: p.is_question_to_admin,
        likes: p.likes || [],
        comments: [],
      })))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchQuestions()

    const supabase = createClient()
    const channel = supabase
      .channel("admin_questions_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quality_posts" },
        () => {
          fetchQuestions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchQuestions])

  return { questions, loading, refetch: fetchQuestions }
}

// Vote on quiz
export async function voteOnQuizSupabase(postId: string, optionId: string, userId: string): Promise<boolean> {
  const supabase = createClient()
  
  const { data } = await supabase.from("quality_posts").select("quiz_options").eq("id", postId).single()
  if (!data) return false
  
  const options = data.quiz_options || []
  const updatedOptions = options.map((opt: any) => ({
    ...opt,
    votes: opt.id === optionId
      ? [...(opt.votes || []).filter((id: string) => id !== userId), userId]
      : (opt.votes || []).filter((id: string) => id !== userId)
  }))
  
  const { error } = await supabase.from("quality_posts").update({ quiz_options: updatedOptions }).eq("id", postId)
  return !error
}

// Get stats
export async function getQualityStatsSupabase(): Promise<{
  totalPosts: number
  totalLikes: number
  totalComments: number
  totalUsers: number
}> {
  const supabase = createClient()
  
  const [postsRes, commentsRes, usersRes] = await Promise.all([
    supabase.from("quality_posts").select("likes", { count: "exact" }).eq("is_active", true),
    supabase.from("quality_comments").select("*", { count: "exact" }),
    supabase.from("users").select("*", { count: "exact" }).eq("role", "operator").eq("is_active", true),
  ])
  
  const totalLikes = (postsRes.data || []).reduce((sum: number, p: any) => sum + (p.likes?.length || 0), 0)
  
  return {
    totalPosts: postsRes.count || 0,
    totalLikes,
    totalComments: commentsRes.count || 0,
    totalUsers: usersRes.count || 0,
  }
}

// Set user online status
export async function setUserOnlineSupabase(userId: string, isOnline: boolean): Promise<void> {
  const supabase = createClient()
  await supabase.from("users").update({ is_online: isOnline }).eq("id", userId)
}
