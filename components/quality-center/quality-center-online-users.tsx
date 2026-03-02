"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { User } from "@/lib/types"

interface QualityCenterOnlineUsersProps {
  users: User[]
}

export function QualityCenterOnlineUsers({ users }: QualityCenterOnlineUsersProps) {
  return (
    <Card className="bg-white border-slate-200 shadow-sm sticky top-24">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-900">Online Agora</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {users.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum usuario online</p>
        ) : (
          users.slice(0, 10).map((user) => {
            const initials = user.fullName
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "U"

            return (
              <div key={user.id} className="flex items-center gap-3">
                <div className="relative">
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white" />
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-slate-100 text-slate-600 text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-sm text-slate-700">{user.fullName}</span>
              </div>
            )
          })
        )}
        {users.length > 10 && (
          <p className="text-xs text-slate-500">+{users.length - 10} mais online</p>
        )}
      </CardContent>
    </Card>
  )
}
