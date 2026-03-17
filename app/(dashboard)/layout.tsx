"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { canAccessRoute, getDefaultRouteForSession } from "@/lib/auth"
import { LogOut } from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { session, isLoading, logout } = useAuth()

  useEffect(() => {
    if (isLoading) {
      return
    }

    if (!session) {
      router.replace("/login")
      return
    }

    if (!canAccessRoute(session, pathname)) {
      router.replace(getDefaultRouteForSession(session))
    }
  }, [isLoading, pathname, router, session])

  if (isLoading || !session || !canAccessRoute(session, pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-xl border border-border bg-card px-6 py-4 text-sm text-muted-foreground shadow-sm">
          Loading your workspace...
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar session={session} />
      <main className="flex-1 transition-all duration-300 lg:ml-[280px]">
        <div className="mx-auto max-w-[1600px] p-4 pt-16 lg:p-8 lg:pt-8">
          <div className="mb-6 grid gap-3 rounded-xl border border-sky-200 bg-sky-100 p-4 shadow-sm sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div className="text-left">
              <p className="text-base font-bold text-card-foreground">{session.name}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold tracking-wide text-sky-950">{session.organization}</p>
            </div>
            <div className="flex sm:justify-end">
              <Button
                variant="outline"
                className="border-pink-200 bg-pink-100 font-semibold text-pink-950 hover:bg-pink-200"
                onClick={() => {
                  logout()
                  router.push("/login")
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
