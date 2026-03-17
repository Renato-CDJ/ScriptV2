"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { QualityCenterHeader } from "./quality-center-header"
import { QualityCenterSidebar } from "./quality-center-sidebar"
import { QualityCenterFeed } from "./quality-center-feed"
import { QualityCenterOnlineUsers } from "./quality-center-online-users"
import { QualityCenterAdminPanel } from "./quality-center-admin-panel"
import { useAllUsers, useAdminQuestions } from "@/hooks/use-supabase-realtime"
import type { User } from "@/lib/types"

export function QualityCenterLayout() {
  const { user } = useAuth()
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  
  const { users: allUsers } = useAllUsers()
  const { questions: adminQuestions } = useAdminQuestions()

  const onlineUsers = allUsers.filter((u) => u.role === "operator" && u.isOnline)
  const pendingQuestions = adminQuestions.length

  const isAdmin = user?.role === "admin"

  return (
    <div className="min-h-screen bg-background">
      <QualityCenterHeader 
        pendingQuestions={pendingQuestions} 
        showAdminPanel={showAdminPanel}
        onToggleAdminPanel={() => setShowAdminPanel(!showAdminPanel)}
      />
      
      <div className="flex">
        <QualityCenterSidebar 
          isAdmin={isAdmin} 
          showAdminPanel={showAdminPanel}
          onShowAdminPanel={() => setShowAdminPanel(true)}
        />
        
        {showAdminPanel && isAdmin ? (
          <main className="flex-1 overflow-auto">
            <QualityCenterAdminPanel pendingQuestions={pendingQuestions} />
          </main>
        ) : (
          <>
            <main className="flex-1 max-w-3xl mx-auto px-4 py-6">
              <QualityCenterFeed />
            </main>
            
            <aside className="hidden lg:block w-72 p-4">
              <QualityCenterOnlineUsers users={onlineUsers} />
            </aside>
          </>
        )}
      </div>
    </div>
  )
}
