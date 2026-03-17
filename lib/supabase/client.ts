import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bmedrwhqinmpvlxunook.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtZWRyd2hxaW5tcHZseHVub29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTI1MjEsImV4cCI6MjA4ODQ4ODUyMX0.Gh2NoGTIYCl-Bf8qSR8DOGqD0NvJRRO3ny1g7k4tLyo"

// Singleton instance for browser client
let supabaseInstance: SupabaseClient | null = null

export function createClient() {
  if (typeof window === "undefined") {
    // Server-side: always create new instance
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  
  // Client-side: use singleton
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
}
