"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { canAccessRoute, getDefaultRouteForSession } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { LogOut } from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { session, isLoading, logout } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("dashboard-theme")
    if (storedTheme === "dark") {
      setDarkMode(true)
      document.documentElement.classList.add("dark")
      document.body.classList.add("dark")
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode)
    document.body.classList.toggle("dark", darkMode)
    window.localStorage.setItem("dashboard-theme", darkMode ? "dark" : "light")
  }, [darkMode])

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
    <div className={cn("flex min-h-screen bg-background text-foreground", darkMode && "dark")}>
      <AppSidebar
        session={session}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        darkMode={darkMode}
        onDarkModeChange={setDarkMode}
      />
      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[280px]"}`}>
        <div className="mx-auto max-w-[1600px] p-4 pt-16 lg:p-8 lg:pt-8">
          <div
            className={cn(
              "mb-6 grid gap-3 rounded-xl border p-4 shadow-sm sm:grid-cols-[1fr_auto_1fr] sm:items-center",
              darkMode
                ? "border-blue-400/30 bg-gradient-to-r from-slate-900 via-blue-950 to-red-950"
                : "border-border bg-card"
            )}
          >
            <div className="text-left">
              <p className="text-base font-bold text-card-foreground">{session.name}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold tracking-wide text-card-foreground">{session.organization}</p>
            </div>
            <div className="flex sm:justify-end">
              <Button
                variant="outline"
                className="border-border bg-background font-semibold text-foreground hover:bg-muted"
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
