"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore"
import { getFirebaseDb } from "@/lib/firebase/config"
import { COLLECTIONS, toFirestoreDate } from "@/lib/firebase/firestore"
import { mapFirestoreUser } from "@/lib/firebase/auth"
import type { User, QualityPost, QualityComment } from "@/lib/types"

// Users hook with realtime
export function useFirebaseUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const fetchUsers = useCallback(async () => {
    const db = getFirebaseDb()
    const usersRef = collection(db, COLLECTIONS.USERS)
    const q = query(usersRef, orderBy("created_at", "asc"))
    const snapshot = await getDocs(q)
    
    const mappedUsers = snapshot.docs.map(doc => 
      mapFirestoreUser({ id: doc.id, ...doc.data() })
    )
    setUsers(mappedUsers)
    setLoading(false)
  }, [])

  useEffect(() => {
    const db = getFirebaseDb()
    const usersRef = collection(db, COLLECTIONS.USERS)
    const q = query(usersRef, orderBy("created_at", "asc"))
    
    unsubscribeRef.current = onSnapshot(q, (snapshot) => {
      const mappedUsers = snapshot.docs.map(doc => 
        mapFirestoreUser({ id: doc.id, ...doc.data() })
      )
      setUsers(mappedUsers)
      setLoading(false)
    }, (error) => {
      console.error("[Firebase] Users subscription error:", error)
      setLoading(false)
    })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  return { users, loading, refetch: fetchUsers }
}

// Quality Posts hook with realtime
export function useQualityPosts() {
  const [posts, setPosts] = useState<QualityPost[]>([])
  const [loading, setLoading] = useState(true)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const fetchPosts = useCallback(async () => {
    const db = getFirebaseDb()
    const postsRef = collection(db, COLLECTIONS.QUALITY_POSTS)
    const q = query(postsRef, orderBy("created_at", "desc"))
    const snapshot = await getDocs(q)
    
    const mappedPosts: QualityPost[] = []
    
    for (const docSnap of snapshot.docs) {
      const p = docSnap.data()
      if (p.is_active === false) continue
      
      // Fetch comments for this post
      const commentsRef = collection(db, COLLECTIONS.QUALITY_COMMENTS)
      const commentsQuery = query(commentsRef, where("post_id", "==", docSnap.id))
      const commentsSnapshot = await getDocs(commentsQuery)
      
      const comments: QualityComment[] = commentsSnapshot.docs.map(c => ({
        id: c.id,
        authorId: c.data().author_id,
        authorName: c.data().author_name,
        content: c.data().content,
        createdAt: new Date(c.data().created_at),
      }))
      
      mappedPosts.push({
        id: docSnap.id,
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
        comments,
      })
    }
    
    setPosts(mappedPosts)
    setLoading(false)
  }, [])

  useEffect(() => {
    const db = getFirebaseDb()
    const postsRef = collection(db, COLLECTIONS.QUALITY_POSTS)
    const q = query(postsRef, orderBy("created_at", "desc"))
    
    unsubscribeRef.current = onSnapshot(q, async (snapshot) => {
      const mappedPosts: QualityPost[] = []
      
      for (const docSnap of snapshot.docs) {
        const p = docSnap.data()
        if (p.is_active === false) continue
        
        // Fetch comments inline
        const commentsRef = collection(db, COLLECTIONS.QUALITY_COMMENTS)
        const commentsQuery = query(commentsRef, where("post_id", "==", docSnap.id))
        const commentsSnapshot = await getDocs(commentsQuery)
        
        const comments: QualityComment[] = commentsSnapshot.docs.map(c => ({
          id: c.id,
          authorId: c.data().author_id,
          authorName: c.data().author_name,
          content: c.data().content,
          createdAt: new Date(c.data().created_at),
        }))
        
        mappedPosts.push({
          id: docSnap.id,
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
          comments,
        })
      }
      
      setPosts(mappedPosts)
      setLoading(false)
    }, (error) => {
      console.error("[Firebase] Quality posts subscription error:", error)
      setLoading(false)
    })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  return { posts, loading, refetch: fetchPosts }
}

// Admin Questions hook
export function useAdminQuestions(filterByUserId?: string) {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const fetchQuestions = useCallback(async () => {
    const db = getFirebaseDb()
    const questionsRef = collection(db, COLLECTIONS.ADMIN_QUESTIONS)
    let q = query(questionsRef, orderBy("created_at", "desc"))
    
    const snapshot = await getDocs(q)
    let mapped = snapshot.docs.map(docSnap => {
      const d = docSnap.data()
      return {
        id: docSnap.id,
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
      }
    })
    
    if (filterByUserId) {
      mapped = mapped.filter(q => q.authorId === filterByUserId)
    }
    
    setQuestions(mapped)
    setLoading(false)
  }, [filterByUserId])

  useEffect(() => {
    const db = getFirebaseDb()
    const questionsRef = collection(db, COLLECTIONS.ADMIN_QUESTIONS)
    const q = query(questionsRef, orderBy("created_at", "desc"))
    
    unsubscribeRef.current = onSnapshot(q, (snapshot) => {
      let mapped = snapshot.docs.map(docSnap => {
        const d = docSnap.data()
        return {
          id: docSnap.id,
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
        }
      })
      
      if (filterByUserId) {
        mapped = mapped.filter(q => q.authorId === filterByUserId)
      }
      
      setQuestions(mapped)
      setLoading(false)
    }, (error) => {
      console.error("[Firebase] Admin questions subscription error:", error)
      setLoading(false)
    })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [filterByUserId])

  return { questions, loading, refetch: fetchQuestions }
}

// All Users hook (alias)
export function useAllUsers() {
  return useFirebaseUsers()
}

// Operator Presence hook
export function useOperatorPresence() {
  const { users, loading, refetch } = useFirebaseUsers()

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
    const db = getFirebaseDb()
    const userRef = doc(db, COLLECTIONS.USERS, userId)
    
    const updates: any = {
      last_activity: toFirestoreDate(new Date()),
    }
    
    if (data?.currentProduct !== undefined) {
      updates.current_product = data.currentProduct
    }
    if (data?.currentScreen !== undefined) {
      updates.current_screen = data.currentScreen
    }
    if (data?.lastScriptAccess) {
      updates.last_script_access = toFirestoreDate(new Date())
    }

    await updateDoc(userRef, updates)
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
export async function createQualityPostFirebase(post: {
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
    const db = getFirebaseDb()
    const postsRef = collection(db, COLLECTIONS.QUALITY_POSTS)
    
    const docRef = await addDoc(postsRef, {
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
      created_at: toFirestoreDate(new Date()),
    })

    return {
      id: docRef.id,
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
    console.error("[Firebase] Error creating quality post:", error)
    return null
  }
}

export async function likePostFirebase(postId: string, userId: string): Promise<void> {
  const db = getFirebaseDb()
  const postRef = doc(db, COLLECTIONS.QUALITY_POSTS, postId)
  const postSnap = await getDoc(postRef)
  
  if (!postSnap.exists()) return
  
  const currentLikes = postSnap.data().likes || []
  const hasLiked = currentLikes.includes(userId)
  const newLikes = hasLiked
    ? currentLikes.filter((id: string) => id !== userId)
    : [...currentLikes, userId]

  await updateDoc(postRef, { likes: newLikes })
}

export async function addCommentFirebase(
  postId: string,
  comment: { authorId: string; authorName: string; content: string }
): Promise<void> {
  const db = getFirebaseDb()
  const commentsRef = collection(db, COLLECTIONS.QUALITY_COMMENTS)
  
  await addDoc(commentsRef, {
    post_id: postId,
    author_id: comment.authorId,
    author_name: comment.authorName,
    content: comment.content,
    created_at: toFirestoreDate(new Date()),
  })
}

export async function voteOnQuizFirebase(
  postId: string,
  optionId: string,
  userId: string
): Promise<void> {
  const db = getFirebaseDb()
  const postRef = doc(db, COLLECTIONS.QUALITY_POSTS, postId)
  const postSnap = await getDoc(postRef)
  
  if (!postSnap.exists() || !postSnap.data().quiz_options) return

  const updatedOptions = postSnap.data().quiz_options.map((opt: any) => ({
    ...opt,
    votes: opt.id === optionId
      ? [...(opt.votes || []).filter((v: string) => v !== userId), userId]
      : (opt.votes || []).filter((v: string) => v !== userId),
  }))

  await updateDoc(postRef, { quiz_options: updatedOptions })
}

export async function getQualityStatsFirebase(): Promise<{
  totalPosts: number
  totalLikes: number
  totalComments: number
  totalUsers: number
  onlineCount: number
}> {
  const db = getFirebaseDb()
  
  const postsRef = collection(db, COLLECTIONS.QUALITY_POSTS)
  const postsSnap = await getDocs(postsRef)
  const totalPosts = postsSnap.size
  const totalLikes = postsSnap.docs.reduce((acc, doc) => acc + (doc.data().likes?.length || 0), 0)
  
  const commentsRef = collection(db, COLLECTIONS.QUALITY_COMMENTS)
  const commentsSnap = await getDocs(commentsRef)
  const totalComments = commentsSnap.size
  
  const usersRef = collection(db, COLLECTIONS.USERS)
  const usersSnap = await getDocs(usersRef)
  const operators = usersSnap.docs.filter(d => d.data().role === "operator")
  const totalUsers = operators.length
  const onlineCount = operators.filter(d => d.data().is_online === true).length

  return { totalPosts, totalLikes, totalComments, totalUsers, onlineCount }
}

// Feedbacks hook with realtime
export function useFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const fetchFeedbacks = useCallback(async () => {
    const db = getFirebaseDb()
    const feedbacksRef = collection(db, COLLECTIONS.FEEDBACKS)
    const q = query(feedbacksRef, orderBy("created_at", "desc"))
    const snapshot = await getDocs(q)

    const mapped = snapshot.docs.map(docSnap => {
      const f = docSnap.data()
      return {
        id: docSnap.id,
        type: f.type,
        message: f.message,
        operatorId: f.operator_id,
        operatorName: f.operator_name,
        isRead: f.is_read,
        createdAt: f.created_at,
      }
    })
    setFeedbacks(mapped)
    setLoading(false)
  }, [])

  useEffect(() => {
    const db = getFirebaseDb()
    const feedbacksRef = collection(db, COLLECTIONS.FEEDBACKS)
    const q = query(feedbacksRef, orderBy("created_at", "desc"))
    
    unsubscribeRef.current = onSnapshot(q, (snapshot) => {
      const mapped = snapshot.docs.map(docSnap => {
        const f = docSnap.data()
        return {
          id: docSnap.id,
          type: f.type,
          message: f.message,
          operatorId: f.operator_id,
          operatorName: f.operator_name,
          isRead: f.is_read,
          createdAt: f.created_at,
        }
      })
      setFeedbacks(mapped)
      setLoading(false)
    })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

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
    const data = await getQualityStatsFirebase()
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
  const db = getFirebaseDb()
  const questionRef = doc(db, COLLECTIONS.ADMIN_QUESTIONS, questionId)
  
  await updateDoc(questionRef, {
    reply,
    replied_by: adminId,
    replied_by_name: adminName,
    replied_at: toFirestoreDate(new Date()),
    reply_count: 1,
  })
}

export async function answerAdminQuestionSecond(
  questionId: string,
  secondReply: string,
  adminId: string,
  adminName: string
): Promise<void> {
  const db = getFirebaseDb()
  const questionRef = doc(db, COLLECTIONS.ADMIN_QUESTIONS, questionId)
  
  await updateDoc(questionRef, {
    second_reply: secondReply,
    second_replied_at: toFirestoreDate(new Date()),
    reply_count: 2,
    understood: null,
  })
}

export async function markQuestionUnderstood(
  questionId: string,
  understood: boolean
): Promise<void> {
  const db = getFirebaseDb()
  const questionRef = doc(db, COLLECTIONS.ADMIN_QUESTIONS, questionId)
  
  const questionSnap = await getDoc(questionRef)
  const updates: any = { understood }
  
  if (!understood && questionSnap.data()?.reply_count >= 2) {
    updates.needs_in_person_feedback = true
  }
  
  await updateDoc(questionRef, updates)
}

export async function createAdminQuestion(data: {
  question: string
  authorId: string
  authorName: string
}): Promise<void> {
  const db = getFirebaseDb()
  const questionsRef = collection(db, COLLECTIONS.ADMIN_QUESTIONS)
  
  await addDoc(questionsRef, {
    question: data.question,
    author_id: data.authorId,
    author_name: data.authorName,
    reply_count: 0,
    understood: null,
    needs_in_person_feedback: false,
    created_at: toFirestoreDate(new Date()),
  })
}

// Delete quality post
export async function deleteQualityPostFirebase(postId: string): Promise<void> {
  const db = getFirebaseDb()
  
  // Delete comments first
  const commentsRef = collection(db, COLLECTIONS.QUALITY_COMMENTS)
  const commentsQuery = query(commentsRef, where("post_id", "==", postId))
  const commentsSnap = await getDocs(commentsQuery)
  
  for (const commentDoc of commentsSnap.docs) {
    await deleteDoc(doc(db, COLLECTIONS.QUALITY_COMMENTS, commentDoc.id))
  }
  
  // Delete post
  await deleteDoc(doc(db, COLLECTIONS.QUALITY_POSTS, postId))
}

// Edit quality post
export async function editQualityPostFirebase(postId: string, content: string, backgroundColor?: string): Promise<void> {
  const db = getFirebaseDb()
  const postRef = doc(db, COLLECTIONS.QUALITY_POSTS, postId)
  
  const updates: any = { content, updated_at: toFirestoreDate(new Date()) }
  if (backgroundColor !== undefined) {
    updates.background_color = backgroundColor || null
  }
  
  await updateDoc(postRef, updates)
}

// Delete comment
export async function deleteCommentFirebase(commentId: string): Promise<void> {
  const db = getFirebaseDb()
  await deleteDoc(doc(db, COLLECTIONS.QUALITY_COMMENTS, commentId))
}

// Edit comment
export async function editCommentFirebase(commentId: string, content: string): Promise<void> {
  const db = getFirebaseDb()
  const commentRef = doc(db, COLLECTIONS.QUALITY_COMMENTS, commentId)
  
  await updateDoc(commentRef, {
    content,
    updated_at: toFirestoreDate(new Date()),
  })
}

// Mark feedback as read
export async function markFeedbackAsRead(feedbackId: string): Promise<void> {
  const db = getFirebaseDb()
  const feedbackRef = doc(db, COLLECTIONS.FEEDBACKS, feedbackId)
  await updateDoc(feedbackRef, { is_read: true })
}

// Create feedback for operator
export async function createFeedbackFirebase(feedback: {
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
  const db = getFirebaseDb()
  
  // Insert into feedbacks table
  const feedbacksRef = collection(db, COLLECTIONS.FEEDBACKS)
  await addDoc(feedbacksRef, {
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
    created_at: toFirestoreDate(new Date()),
  })

  // Also create a quality_post so it appears in the feed
  const feedbackLabel = feedback.feedbackType === "positive" ? "Feedback Positivo" : "Feedback Construtivo"
  
  const content = `**${feedbackLabel}** para ${feedback.operatorName}\n\n${feedback.details}${
    feedback.positivePoints ? `\n\n**Pontos positivos:** ${feedback.positivePoints}` : ""
  }${
    feedback.improvementPoints ? `\n\n**Pontos de melhoria:** ${feedback.improvementPoints}` : ""
  }`

  const postsRef = collection(db, COLLECTIONS.QUALITY_POSTS)
  await addDoc(postsRef, {
    type: "feedback",
    content: content,
    author_id: feedback.createdBy,
    author_name: feedback.createdByName,
    likes: [],
    recipients: [feedback.operatorId],
    recipient_names: [feedback.operatorName],
    send_to_all: false,
    is_active: true,
    created_at: toFirestoreDate(new Date()),
  })
}

// User management functions
export async function getUserByUsername(username: string): Promise<User | null> {
  const db = getFirebaseDb()
  const usersRef = collection(db, COLLECTIONS.USERS)
  const snapshot = await getDocs(usersRef)
  
  const userDoc = snapshot.docs.find(doc => {
    const data = doc.data()
    return data.username?.toLowerCase() === username.toLowerCase() && data.is_active !== false
  })
  
  if (!userDoc) return null
  
  return mapFirestoreUser({ id: userDoc.id, ...userDoc.data() })
}

export async function updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
  const db = getFirebaseDb()
  const userRef = doc(db, COLLECTIONS.USERS, userId)
  
  await updateDoc(userRef, {
    is_online: isOnline,
    last_activity: toFirestoreDate(new Date()),
  })
}

export async function getAllUsersFromFirebase(): Promise<User[]> {
  const db = getFirebaseDb()
  const usersRef = collection(db, COLLECTIONS.USERS)
  const q = query(usersRef, orderBy("created_at", "asc"))
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(doc => mapFirestoreUser({ id: doc.id, ...doc.data() }))
}

// Supabase compatibility exports (aliases)
export const useSupabaseUsers = useFirebaseUsers
export const createQualityPostSupabase = createQualityPostFirebase
export const likePostSupabase = likePostFirebase
export const addCommentSupabase = addCommentFirebase
export const voteOnQuizSupabase = voteOnQuizFirebase
export const getQualityStatsSupabase = getQualityStatsFirebase
export const deleteQualityPostSupabase = deleteQualityPostFirebase
export const editQualityPostSupabase = editQualityPostFirebase
export const deleteCommentSupabase = deleteCommentFirebase
export const editCommentSupabase = editCommentFirebase
export const createFeedbackSupabase = createFeedbackFirebase
export const getAllUsersFromSupabase = getAllUsersFromFirebase
