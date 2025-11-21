"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from 'next/navigation'

type TableName = 
  | "users" 
  | "script_steps" 
  | "products" 
  | "tabulations" 
  | "service_situations" 
  | "channels" 
  | "messages" 
  | "quizzes" 
  | "chat_messages" 
  | "chat_settings" 
  | "presentations"

interface RealtimeOptions {
  table: TableName
  filter?: string
  event?: "INSERT" | "UPDATE" | "DELETE" | "*"
  callback: (payload: any) => void
}

export function useRealtimeSubscription({ table, filter, event = "*", callback }: RealtimeOptions) {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const channel = supabase
      .channel(`public:${table}${filter ? `:${filter}` : ''}`)
      .on(
        "postgres_changes",
        {
          event,
          schema: "public",
          table,
          filter,
        },
        (payload) => {
          callback(payload)
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, table, filter, event, callback, router])
}
