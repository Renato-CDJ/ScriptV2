"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

export interface ChatMessage {
  id: string
  senderId: string | null
  senderName: string
  recipientId: string | null
  recipientName: string | null
  content: string
  messageType: string
  isRead: boolean
  isGlobal: boolean
  isEdited: boolean
  editedAt: string | null
  createdAt: string
}

const getSupabase = () => createClient()

export function useChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<any>(null)
  const isSubscribedRef = useRef(false)

  const fetchMessages = useCallback(async () => {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true })

      if (!error && data) {
        const mappedMessages: ChatMessage[] = data.map((msg: any) => ({
          id: msg.id,
          senderId: msg.sender_id,
          senderName: msg.sender_name,
          recipientId: msg.recipient_id,
          recipientName: msg.recipient_name,
          content: msg.content,
          messageType: msg.message_type || "text",
          isRead: msg.is_read,
          isGlobal: msg.is_global,
          isEdited: msg.is_edited,
          editedAt: msg.edited_at,
          createdAt: msg.created_at,
        }))
        setMessages(mappedMessages)
      } else if (error) {
        console.error("[v0] Erro ao buscar mensagens:", error)
      }
    } catch (error) {
      console.error("[v0] Erro ao buscar mensagens:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Prevent duplicate subscriptions (React StrictMode)
    if (isSubscribedRef.current) return
    isSubscribedRef.current = true

    const supabase = getSupabase()
    fetchMessages()

    // Setup realtime subscription
    const channelName = `chat-messages-realtime-${Math.random().toString(36).slice(2)}`
    const channel = supabase.channel(channelName)

    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
        (payload: any) => {
          fetchMessages()
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      isSubscribedRef.current = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [fetchMessages])

  return { messages, loading, refetch: fetchMessages }
}

export function useSupervisorChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<any>(null)
  const isSubscribedRef = useRef(false)

  const fetchMessages = useCallback(async () => {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("supervisor_chat_messages")
        .select("*")
        .order("created_at", { ascending: true })

      if (!error && data) {
        const mappedMessages: ChatMessage[] = data.map((msg: any) => ({
          id: msg.id,
          senderId: msg.sender_id,
          senderName: msg.sender_name,
          recipientId: msg.recipient_id,
          recipientName: msg.recipient_name,
          content: msg.content,
          messageType: "text",
          isRead: msg.is_read,
          isGlobal: false,
          isEdited: msg.is_edited,
          editedAt: msg.edited_at,
          createdAt: msg.created_at,
        }))
        setMessages(mappedMessages)
      } else if (error) {
        console.error("[v0] Erro ao buscar mensagens do supervisor:", error)
      }
    } catch (error) {
      console.error("[v0] Erro ao buscar mensagens do supervisor:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isSubscribedRef.current) return
    isSubscribedRef.current = true

    const supabase = getSupabase()
    fetchMessages()

    const channelName = `supervisor-chat-messages-realtime-${Math.random().toString(36).slice(2)}`
    const channel = supabase.channel(channelName)

    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "supervisor_chat_messages" },
        (payload: any) => {
          fetchMessages()
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      isSubscribedRef.current = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [fetchMessages])

  return { messages, loading, refetch: fetchMessages }
}

export function useQualityChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<any>(null)
  const isSubscribedRef = useRef(false)

  const fetchMessages = useCallback(async () => {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("quality_chat_messages")
        .select("*")
        .order("created_at", { ascending: true })

      if (!error && data) {
        const mappedMessages: ChatMessage[] = data.map((msg: any) => ({
          id: msg.id,
          senderId: msg.sender_id,
          senderName: msg.sender_name,
          recipientId: msg.recipient_id,
          recipientName: msg.recipient_name,
          content: msg.content,
          messageType: "text",
          isRead: msg.is_read,
          isGlobal: false,
          isEdited: msg.is_edited,
          editedAt: msg.edited_at,
          createdAt: msg.created_at,
        }))
        setMessages(mappedMessages)
      } else if (error) {
        console.error("[v0] Erro ao buscar mensagens da qualidade:", error)
      }
    } catch (error) {
      console.error("[v0] Erro ao buscar mensagens da qualidade:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isSubscribedRef.current) return
    isSubscribedRef.current = true

    const supabase = getSupabase()
    fetchMessages()

    const channelName = `quality-chat-messages-realtime-${Math.random().toString(36).slice(2)}`
    const channel = supabase.channel(channelName)

    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quality_chat_messages" },
        (payload: any) => {
          fetchMessages()
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      isSubscribedRef.current = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [fetchMessages])

  return { messages, loading, refetch: fetchMessages }
}
