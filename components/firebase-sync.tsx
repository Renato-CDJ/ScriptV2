"use client"

import { useEffect } from "react"
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore"
import { signInAnonymously } from "firebase/auth"
import { db, auth } from "@/lib/firebase"
import { syncChatMessage } from "@/lib/store"
import type { ChatMessage } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"

export function FirebaseSync() {
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) return

    let unsubscribe: (() => void) | undefined

    const connect = async () => {
      try {
        // Sign in anonymously to satisfy basic security rules
        // If this fails with 'auth/admin-restricted-operation', you must enable Anonymous Auth in Firebase Console
        if (!auth.currentUser) {
          await signInAnonymously(auth)
        }

        // Subscribe to chat messages
        // We limit to last 100 to avoid fetching too much history on load
        const q = query(collection(db, "chat_messages"), orderBy("createdAt", "desc"), limit(100))

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            console.log("[v0] Firebase Chat Connected. Messages synced:", snapshot.size)

            snapshot.docChanges().forEach((change) => {
              if (change.type === "added" || change.type === "modified") {
                const messageData = change.doc.data() as any

                // Convert Firestore Timestamp to Date object if needed
                const createdAt = messageData.createdAt?.toDate
                  ? messageData.createdAt.toDate()
                  : new Date(messageData.createdAt)

                const message: ChatMessage = {
                  ...messageData,
                  id: change.doc.id,
                  createdAt,
                }

                syncChatMessage(message)
              }
            })
          },
          (error) => {
            console.error("Firebase snapshot error:", error)
            // Only show toast for permission errors which might indicate rule issues
            if (error.code === "permission-denied") {
              toast({
                variant: "destructive",
                title: "Chat Unavailable",
                description: "Missing permissions. Please check Firebase Security Rules.",
              })
            }
          },
        )
      } catch (error: any) {
        if (error.code === "auth/admin-restricted-operation" || error.code === "auth/operation-not-allowed") {
          console.error(
            "FIREBASE CONFIG ERROR: You must enable 'Anonymous' authentication in your Firebase Console -> Authentication -> Sign-in method.",
          )
          toast({
            variant: "destructive",
            title: "Firebase Config Error",
            description: "Enable 'Anonymous' auth in Firebase Console to use chat.",
            duration: 10000,
          })
        } else {
          console.error("Error connecting to Firebase:", error)
          toast({
            variant: "destructive",
            title: "Connection Error",
            description: "Failed to connect to chat server.",
          })
        }
      }
    }

    connect()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [user, toast])

  return null
}
