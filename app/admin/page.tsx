"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminSidebar } from "@/components/admin-sidebar"
import { DashboardTab } from "@/components/admin-tabs/dashboard-tab"
import { ScriptsTab } from "@/components/admin-tabs/scripts-tab"
import { ProductsTab } from "@/components/admin-tabs/products-tab"
import { OperatorsTab } from "@/components/admin-tabs/operators-tab"
import { TabulationsTab } from "@/components/admin-tabs/tabulations-tab"
import { SituationsTab } from "@/components/admin-tabs/situations-tab"
import { ChannelsTab } from "@/components/admin-tabs/channels-tab"
import { NotesTab } from "@/components/admin-tabs/notes-tab"
import { Toaster } from "@/components/ui/toaster"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

function AdminContent() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const router = useRouter()
  const { logout } = useAuth()

  const handleBack = () => {
    logout()
    router.push("/")
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab />
      case "scripts":
        return <ScriptsTab />
      case "products":
        return <ProductsTab />
      case "operators":
        return <OperatorsTab />
      case "tabulations":
        return <TabulationsTab />
      case "situations":
        return <SituationsTab />
      case "channels":
        return <ChannelsTab />
      case "notes":
        return <NotesTab />
      case "settings":
        return (
          <div>
            <h2 className="text-3xl font-bold">Configurações</h2>
            <p className="text-muted-foreground mt-1">Configurações gerais do sistema</p>
          </div>
        )
      default:
        return <DashboardTab />
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden">
      <aside className="w-full md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-border">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">{renderContent()}</div>
      </main>

      <Toaster />
    </div>
  )
}

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminContent />
    </ProtectedRoute>
  )
}
