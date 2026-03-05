"use client"

import { createClient } from "@/lib/supabase/client"
import type { User, Product, ScriptStep, Tabulation, ServiceSituation, Channel, Note, QualityPost, QualityComment } from "./types"

// Create Supabase client
const getSupabase = () => createClient()

// ===== Users =====
export async function getUsers(): Promise<User[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("name")
  
  if (error) {
    console.error("Error fetching users:", error)
    return []
  }
  
  return data.map((u: any) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    password: u.password,
    role: u.role,
    team: u.team,
    avatar: u.avatar,
    isOnline: u.is_online,
    isActive: u.is_active,
    createdAt: new Date(u.created_at),
  }))
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single()
  
  if (error || !data) return null
  
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    password: data.password,
    role: data.role,
    team: data.team,
    avatar: data.avatar,
    isOnline: data.is_online,
    isActive: data.is_active,
    createdAt: new Date(data.created_at),
  }
}

export async function createUser(user: Omit<User, "id" | "createdAt">): Promise<User | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("users")
    .insert({
      email: user.email,
      name: user.name,
      password: user.password,
      role: user.role,
      team: user.team,
      avatar: user.avatar,
      is_online: user.isOnline || false,
      is_active: user.isActive !== false,
    })
    .select()
    .single()
  
  if (error) {
    console.error("Error creating user:", error)
    return null
  }
  
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    password: data.password,
    role: data.role,
    team: data.team,
    avatar: data.avatar,
    isOnline: data.is_online,
    isActive: data.is_active,
    createdAt: new Date(data.created_at),
  }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<void> {
  const supabase = getSupabase()
  const dbUpdates: any = {}
  
  if (updates.email !== undefined) dbUpdates.email = updates.email
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.password !== undefined) dbUpdates.password = updates.password
  if (updates.role !== undefined) dbUpdates.role = updates.role
  if (updates.team !== undefined) dbUpdates.team = updates.team
  if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar
  if (updates.isOnline !== undefined) dbUpdates.is_online = updates.isOnline
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
  dbUpdates.updated_at = new Date().toISOString()
  
  await supabase.from("users").update(dbUpdates).eq("id", id)
}

export async function deleteUser(id: string): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("users").delete().eq("id", id)
}

export async function setUserOnlineStatus(id: string, isOnline: boolean): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("users").update({ is_online: isOnline }).eq("id", id)
}

// ===== Products =====
export async function getProducts(): Promise<Product[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("name")
  
  if (error) return []
  
  return data.map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    icon: p.icon,
    color: p.color,
    isActive: p.is_active,
  }))
}

export async function createProduct(product: Omit<Product, "id">): Promise<Product | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: product.name,
      description: product.description,
      icon: product.icon,
      color: product.color,
      is_active: product.isActive !== false,
    })
    .select()
    .single()
  
  if (error) return null
  
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    icon: data.icon,
    color: data.color,
    isActive: data.is_active,
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const supabase = getSupabase()
  const dbUpdates: any = {}
  
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.description !== undefined) dbUpdates.description = updates.description
  if (updates.icon !== undefined) dbUpdates.icon = updates.icon
  if (updates.color !== undefined) dbUpdates.color = updates.color
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
  
  await supabase.from("products").update(dbUpdates).eq("id", id)
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("products").update({ is_active: false }).eq("id", id)
}

// ===== Script Steps =====
export async function getScriptSteps(productId: string): Promise<ScriptStep[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("script_steps")
    .select("*")
    .eq("product_id", productId)
    .eq("is_active", true)
    .order("step_number")
  
  if (error) return []
  
  return data.map((s: any) => ({
    id: s.id,
    productId: s.product_id,
    stepNumber: s.step_number,
    title: s.title,
    content: s.content,
    isActive: s.is_active,
  }))
}

export async function createScriptStep(step: Omit<ScriptStep, "id">): Promise<ScriptStep | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("script_steps")
    .insert({
      product_id: step.productId,
      step_number: step.stepNumber,
      title: step.title,
      content: step.content,
      is_active: true,
    })
    .select()
    .single()
  
  if (error) return null
  
  return {
    id: data.id,
    productId: data.product_id,
    stepNumber: data.step_number,
    title: data.title,
    content: data.content,
    isActive: data.is_active,
  }
}

export async function updateScriptStep(id: string, updates: Partial<ScriptStep>): Promise<void> {
  const supabase = getSupabase()
  const dbUpdates: any = {}
  
  if (updates.stepNumber !== undefined) dbUpdates.step_number = updates.stepNumber
  if (updates.title !== undefined) dbUpdates.title = updates.title
  if (updates.content !== undefined) dbUpdates.content = updates.content
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
  
  await supabase.from("script_steps").update(dbUpdates).eq("id", id)
}

export async function deleteScriptStep(id: string): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("script_steps").delete().eq("id", id)
}

// ===== Tabulations =====
export async function getTabulations(): Promise<Tabulation[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("tabulations")
    .select("*")
    .eq("is_active", true)
    .order("name")
  
  if (error) return []
  
  return data.map((t: any) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    color: t.color,
    isActive: t.is_active,
  }))
}

export async function createTabulation(tab: Omit<Tabulation, "id">): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("tabulations").insert({
    name: tab.name,
    description: tab.description,
    color: tab.color,
    is_active: true,
  })
}

export async function updateTabulation(id: string, updates: Partial<Tabulation>): Promise<void> {
  const supabase = getSupabase()
  const dbUpdates: any = {}
  
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.description !== undefined) dbUpdates.description = updates.description
  if (updates.color !== undefined) dbUpdates.color = updates.color
  
  await supabase.from("tabulations").update(dbUpdates).eq("id", id)
}

export async function deleteTabulation(id: string): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("tabulations").update({ is_active: false }).eq("id", id)
}

// ===== Service Situations =====
export async function getServiceSituations(): Promise<ServiceSituation[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("service_situations")
    .select("*")
    .eq("is_active", true)
    .order("name")
  
  if (error) return []
  
  return data.map((s: any) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    color: s.color,
    isActive: s.is_active,
  }))
}

export async function createServiceSituation(situation: Omit<ServiceSituation, "id">): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("service_situations").insert({
    name: situation.name,
    description: situation.description,
    color: situation.color,
    is_active: true,
  })
}

export async function updateServiceSituation(id: string, updates: Partial<ServiceSituation>): Promise<void> {
  const supabase = getSupabase()
  const dbUpdates: any = {}
  
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.description !== undefined) dbUpdates.description = updates.description
  if (updates.color !== undefined) dbUpdates.color = updates.color
  
  await supabase.from("service_situations").update(dbUpdates).eq("id", id)
}

export async function deleteServiceSituation(id: string): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("service_situations").update({ is_active: false }).eq("id", id)
}

// ===== Channels =====
export async function getChannels(): Promise<Channel[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .eq("is_active", true)
    .order("name")
  
  if (error) return []
  
  return data.map((c: any) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    isActive: c.is_active,
  }))
}

export async function createChannel(channel: Omit<Channel, "id">): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("channels").insert({
    name: channel.name,
    description: channel.description,
    is_active: true,
  })
}

export async function updateChannel(id: string, updates: Partial<Channel>): Promise<void> {
  const supabase = getSupabase()
  const dbUpdates: any = {}
  
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.description !== undefined) dbUpdates.description = updates.description
  
  await supabase.from("channels").update(dbUpdates).eq("id", id)
}

export async function deleteChannel(id: string): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("channels").update({ is_active: false }).eq("id", id)
}

// ===== Notes =====
export async function getNotes(userId: string): Promise<Note[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false })
  
  if (error) return []
  
  return data.map((n: any) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    color: n.color,
    isPinned: n.is_pinned,
    createdAt: new Date(n.created_at),
    updatedAt: new Date(n.updated_at),
  }))
}

export async function createNote(userId: string, note: Omit<Note, "id" | "createdAt" | "updatedAt">): Promise<Note | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: userId,
      title: note.title,
      content: note.content,
      color: note.color || "yellow",
      is_pinned: note.isPinned || false,
    })
    .select()
    .single()
  
  if (error) return null
  
  return {
    id: data.id,
    title: data.title,
    content: data.content,
    color: data.color,
    isPinned: data.is_pinned,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  }
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<void> {
  const supabase = getSupabase()
  const dbUpdates: any = { updated_at: new Date().toISOString() }
  
  if (updates.title !== undefined) dbUpdates.title = updates.title
  if (updates.content !== undefined) dbUpdates.content = updates.content
  if (updates.color !== undefined) dbUpdates.color = updates.color
  if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned
  
  await supabase.from("notes").update(dbUpdates).eq("id", id)
}

export async function deleteNote(id: string): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("notes").delete().eq("id", id)
}

// ===== Quality Posts =====
export async function getQualityPosts(): Promise<QualityPost[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("quality_posts")
    .select(`
      *,
      quality_comments (*)
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
  
  if (error) return []
  
  return data.map((p: any) => ({
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
  }))
}

export async function createQualityPost(post: Omit<QualityPost, "id" | "createdAt" | "likes" | "comments">): Promise<QualityPost | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("quality_posts")
    .insert({
      type: post.type,
      content: post.content,
      author_id: post.authorId,
      author_name: post.authorName,
      quiz_options: post.quizOptions || [],
      likes: [],
      is_question_to_admin: post.isQuestionToAdmin || false,
      is_active: true,
    })
    .select()
    .single()
  
  if (error) return null
  
  return {
    id: data.id,
    type: data.type,
    content: data.content,
    authorId: data.author_id,
    authorName: data.author_name,
    createdAt: new Date(data.created_at),
    isActive: data.is_active,
    quizOptions: data.quiz_options || [],
    likes: data.likes || [],
    isQuestionToAdmin: data.is_question_to_admin,
    comments: [],
  }
}

export async function likeQualityPost(postId: string, userId: string): Promise<void> {
  const supabase = getSupabase()
  
  // Get current likes
  const { data } = await supabase.from("quality_posts").select("likes").eq("id", postId).single()
  if (!data) return
  
  const likes = data.likes || []
  const newLikes = likes.includes(userId) 
    ? likes.filter((id: string) => id !== userId)
    : [...likes, userId]
  
  await supabase.from("quality_posts").update({ likes: newLikes }).eq("id", postId)
}

export async function voteOnQuiz(postId: string, optionId: string, userId: string): Promise<void> {
  const supabase = getSupabase()
  
  const { data } = await supabase.from("quality_posts").select("quiz_options").eq("id", postId).single()
  if (!data) return
  
  const options = data.quiz_options || []
  const updatedOptions = options.map((opt: any) => ({
    ...opt,
    votes: opt.id === optionId
      ? [...(opt.votes || []).filter((id: string) => id !== userId), userId]
      : (opt.votes || []).filter((id: string) => id !== userId)
  }))
  
  await supabase.from("quality_posts").update({ quiz_options: updatedOptions }).eq("id", postId)
}

export async function addComment(postId: string, comment: Omit<QualityComment, "id" | "createdAt">): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("quality_comments").insert({
    post_id: postId,
    author_id: comment.authorId,
    author_name: comment.authorName,
    content: comment.content,
  })
}

export async function deleteQualityPost(id: string): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("quality_posts").update({ is_active: false }).eq("id", id)
}

// ===== Online Users =====
export async function getOnlineUsers(): Promise<User[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("is_online", true)
    .eq("is_active", true)
  
  if (error) return []
  
  return data.map((u: any) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    password: u.password,
    role: u.role,
    team: u.team,
    avatar: u.avatar,
    isOnline: u.is_online,
    isActive: u.is_active,
    createdAt: new Date(u.created_at),
  }))
}

// ===== Statistics =====
export async function getQualityCenterStats(): Promise<{
  totalPosts: number
  totalLikes: number
  totalComments: number
  totalUsers: number
  onlineNow: number
}> {
  const supabase = getSupabase()
  
  const [postsRes, commentsRes, usersRes, onlineRes] = await Promise.all([
    supabase.from("quality_posts").select("likes", { count: "exact" }).eq("is_active", true),
    supabase.from("quality_comments").select("*", { count: "exact" }),
    supabase.from("users").select("*", { count: "exact" }).eq("role", "operator").eq("is_active", true),
    supabase.from("users").select("*", { count: "exact" }).eq("is_online", true).eq("is_active", true),
  ])
  
  const totalLikes = (postsRes.data || []).reduce((sum: number, p: any) => sum + (p.likes?.length || 0), 0)
  
  return {
    totalPosts: postsRes.count || 0,
    totalLikes,
    totalComments: commentsRes.count || 0,
    totalUsers: usersRes.count || 0,
    onlineNow: onlineRes.count || 0,
  }
}
