import { createBrowserClient } from "@supabase/ssr"

// Singleton instance for client-side
let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (clientInstance) {
    return clientInstance
  }

  clientInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return clientInstance
}

// Re-export types for convenience
export type SupabaseClient = ReturnType<typeof createClient>
