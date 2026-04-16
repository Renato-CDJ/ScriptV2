import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cueuqbsecbnnvgawwmca.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1ZXVxYnNlY2JubnZnYXd3bWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjI4MDAsImV4cCI6MjA5MDIzODgwMH0.mKg_X5q3ObkQhgF3s0BwlqOIGZfBLuAHNJEfwp4UhZE"

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
