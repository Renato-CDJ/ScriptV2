"use client"

// Re-export all Firebase realtime hooks with Supabase naming for backwards compatibility
export {
  useFirebaseUsers as useSupabaseUsers,
  useQualityPosts,
  useAdminQuestions,
  useAllUsers,
  useOperatorPresence,
  updateOperatorPresence,
  usePresenceHeartbeat,
  createQualityPostFirebase as createQualityPostSupabase,
  likePostFirebase as likePostSupabase,
  addCommentFirebase as addCommentSupabase,
  voteOnQuizFirebase as voteOnQuizSupabase,
  getQualityStatsFirebase as getQualityStatsSupabase,
  useFeedbacks,
  useQualityStats,
  answerAdminQuestion,
  answerAdminQuestionSecond,
  markQuestionUnderstood,
  createAdminQuestion,
  deleteQualityPostFirebase as deleteQualityPostSupabase,
  editQualityPostFirebase as editQualityPostSupabase,
  deleteCommentFirebase as deleteCommentSupabase,
  editCommentFirebase as editCommentSupabase,
  markFeedbackAsRead,
  createFeedbackFirebase as createFeedbackSupabase,
  getUserByUsername,
  updateUserOnlineStatus,
  getAllUsersFromFirebase as getAllUsersFromSupabase,
} from "./use-firebase-realtime"

// Re-export types that components might need
export type { User, QualityPost } from "@/lib/types"
