// Import and re-export all functions from supabase-store
export {
  // Authentication
  authenticateUser,
  getCurrentUser,
  logout,
  // Users
  getAllUsers,
  updateUser,
  deleteUser,
  forceLogoutUser,
  isUserOnline,
  getOnlineOperatorsCount,
  getTodayLoginSessions,
  getTodayConnectedTime,
  createAdminUser,
  getAdminUsers,
  canDeleteAdminUser,
  updateAdminPermissions,
  // Scripts
  getScriptSteps,
  getScriptStepById,
  getScriptStepsByProduct,
  updateScriptStep,
  createScriptStep,
  deleteScriptStep,
  importScriptFromJson,
  // Products
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  // Static data
  getTabulations,
  getSituations,
  getChannels,
  // Notes
  getNotes,
  saveNote,
  // Sessions
  createCallSession,
  updateCallSession,
  // Attendance Types
  getAttendanceTypes,
  createAttendanceType,
  updateAttendanceType,
  deleteAttendanceType,
  // Person Types
  getPersonTypes,
  createPersonType,
  updatePersonType,
  deletePersonType,
  // Messages
  getMessages,
  getActiveMessages,
  createMessage,
  updateMessage,
  deleteMessage,
  markMessageAsSeen,
  getActiveMessagesForOperator,
  getHistoricalMessagesForOperator,
  // Quiz
  getQuizzes,
  getActiveQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getActiveQuizzesForOperator,
  getHistoricalQuizzes,
  hasOperatorAnsweredQuiz,
  // Quiz Attempts
  getQuizAttempts,
  getQuizAttemptsByOperator,
  getQuizAttemptsByQuiz,
  createQuizAttempt,
  getMonthlyQuizRanking,
  getCurrentMonthName,
  // Chat
  getAllChatMessages,
  getChatSettings,
  updateChatSettings,
  sendChatMessage,
  markChatMessageAsRead,
  getChatMessagesForUser,
  getUnreadChatCount,
  deleteChatMessage,
  // Utility
  getLastUpdate,
  clearCaches,
  cleanupOldSessions,
  initializeMockData,
  loadScriptsFromDataFolder,
} from "./supabase-store"

// Re-export types
export type { AttendanceTypeOption, PersonTypeOption, OperatorRanking } from "./supabase-store"
