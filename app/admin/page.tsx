"use client"

import { useState, lazy, Suspense, memo } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Toaster } from "@/components/ui/toaster"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

const DashboardTab = lazy(() =>
  import("@/components/admin-tabs/dashboard-tab").then((m) => ({ default: m.DashboardTab })),
)
const ScriptsTab = lazy(() => import("@/components/admin-tabs/scripts-tab").then((m) => ({ default: m.ScriptsTab })))
const ProductsTab = lazy(() => import("@/components/admin-tabs/products-tab").then((m) => ({ default: m.ProductsTab })))
const AttendanceTypesTab = lazy(() =>
  import("@/components/admin-tabs/attendance-types-tab").then((m) => ({ default: m.AttendanceTypesTab })),
)
const OperatorsTab = lazy(() =>
  import("@/components/admin-tabs/operators-tab").then((m) => ({ default: m.OperatorsTab })),
)
const TabulationsTab = lazy(() =>
  import("@/components/admin-tabs/tabulations-tab").then((m) => ({ default: m.TabulationsTab })),
)
const SituationsTab = lazy(() =>
  import("@/components/admin-tabs/situations-tab").then((m) => ({ default: m.SituationsTab })),
)
const ChannelsTab = lazy(() => import("@/components/admin-tabs/channels-tab").then((m) => ({ default: m.ChannelsTab })))
const NotesTab = lazy(() => import("@/components/admin-tabs/notes-tab").then((m) => ({ default: m.NotesTab })))
const MessagesQuizTab = lazy(() =>
  import("@/components/admin-tabs/messages-quiz-tab").then((m) => ({ default: m.MessagesQuizTab })),
)
const ChatTab = lazy(() => import("@/components/admin-tabs/chat-tab").then((m) => ({ default: m.ChatTab })))
const SettingsPage = lazy(() => import("@/app/admin/settings/page"))
const AccessControlTab = lazy(() =>
  import("@/components/admin-tabs/access-control-tab").then((m) => ({ default: m.AccessControlTab })),
)
const PresentationsTab = lazy(() =>
  import("@/components/admin-tabs/presentations-tab").then((m) => ({ default: m.PresentationsTab })),
)
const InitialGuideTab = lazy(() =>
  import("@/components/admin-tabs/initial-guide-tab").then((m) => ({ default: m.InitialGuideTab })),
)
const FeedbackTab = lazy(() => import("@/components/admin-tabs/feedback-tab").then((m) => ({ default: m.FeedbackTab }))) // Added Feedback tab lazy import

const LoadingFallback = memo(function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  )
})

const AdminContent = memo(function AdminContent() {
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
        return (
          <Suspense fallback={<LoadingFallback />}>
            <DashboardTab />
          </Suspense>
        )
      case "scripts":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ScriptsTab />
          </Suspense>
        )
      case "products":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ProductsTab />
          </Suspense>
        )
      case "attendance-config":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AttendanceTypesTab />
          </Suspense>
        )
      case "operators":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <OperatorsTab />
          </Suspense>
        )
      case "tabulations":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <TabulationsTab />
          </Suspense>
        )
      case "situations":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <SituationsTab />
          </Suspense>
        )
      case "channels":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ChannelsTab />
          </Suspense>
        )
      case "notes":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <NotesTab />
          </Suspense>
        )
      case "messages-quiz":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <MessagesQuizTab />
          </Suspense>
        )
      case "feedback":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FeedbackTab />
          </Suspense>
        )
      case "chat":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ChatTab />
          </Suspense>
        )
      case "settings":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <SettingsPage />
          </Suspense>
        )
      case "access-control":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AccessControlTab />
          </Suspense>
        )
      case "presentations":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <PresentationsTab />
          </Suspense>
        )
      case "initial-guide":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <InitialGuideTab />
          </Suspense>
        )
      default:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <DashboardTab />
          </Suspense>
        )
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-screen h-dvh bg-background overflow-hidden">
      <aside className="w-full md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-border overflow-auto md:overflow-hidden">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </aside>

      <main className="flex-1 overflow-auto min-h-0">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">{renderContent()}</div>
      </main>

      <Toaster />
    </div>
  )
})

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminContent />
    </ProtectedRoute>
  )
}
