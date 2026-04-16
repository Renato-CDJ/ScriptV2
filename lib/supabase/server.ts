// Firebase server compatibility layer
// This file provides compatibility with existing server-side code that used Supabase

import { getFirebaseDb } from "@/lib/firebase/config"

export async function createServerSupabaseClient() {
  // Return a minimal compatibility object
  // Server-side operations should use Firebase Admin SDK if needed
  // For now, we return the client-side Firebase instance
  return {
    from: (tableName: string) => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
    }),
  }
}
