"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { type AuthSession, type AccessRoute, getRoleLabels } from "@/lib/auth"
import {
  Home,
  Box,
  Route,
  Truck,
  Map,
  User,
  Car,
  Shield,
  Wallet,
  Settings,
  ChevronLeft,
  Menu,
  Weight,
  Users,
  Wrench,
  MapPinned,
  UserCog,
  Crown,
  Moon,
  Sun,
} from "lucide-react"

const navItems = [
  { label: "Super Admin", icon: Crown, route: "/superadmin", superAdminOnly: true },
  { label: "Admin Users", icon: UserCog, route: "/admin", adminOnly: true },
  { label: "Dashboard", icon: Home, route: "/dashboard" },
  { label: "Orders", icon: Box, route: "/orders" },
  { label: "Planning", icon: Route, route: "/planning" },
  { label: "Vehicle Assignment", icon: Truck, route: "/vehicleassignment" },
  { label: "Trips", icon: Truck, route: "/trips" },
  { label: "Tracking", icon: Map, route: "/tracking" },
  { label: "Route Map", icon: MapPinned, route: "/routemap" },
  { label: "Drivers", icon: User, route: "/drivers" },
  { label: "Fleet", icon: Car, route: "/fleet" },
  { label: "Vehicle", icon: Users, route: "/vehicledriver" },
  { label: "Maintenance", icon: Wrench, route: "/maintenance" },
  { label: "Track Scale", icon: Weight, route: "/trackscale" },
  { label: "Gate Pass", icon: Shield, route: "/gatepass" },
  { label: "Billing", icon: Wallet, route: "/billing" },
  { label: "Settings", icon: Settings, route: "/settings" },
]

export function AppSidebar({
  session,
  collapsed,
  onCollapsedChange,
  darkMode,
  onDarkModeChange,
}: {
  session: AuthSession
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  darkMode: boolean
  onDarkModeChange: (darkMode: boolean) => void
}) {
  const pathname = usePathname()
  const visibleNavItems = navItems.filter((item) => {
    if (item.superAdminOnly) {
      return session.roles.includes("super-admin")
    }
    if (item.adminOnly) {
      return session.roles.includes("admin")
    }

    return session.accessRoutes.includes(item.route as AccessRoute)
  })

  return (
    <>
      {/* Mobile overlay */}
      <button
        className="fixed top-4 left-4 z-50 flex items-center justify-center rounded-lg bg-sidebar p-2 text-sidebar-foreground lg:hidden"
        onClick={() => onCollapsedChange(!collapsed)}
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col overflow-visible bg-sidebar text-sidebar-foreground transition-all duration-300",
          collapsed ? "w-[72px]" : "w-[280px]",
          "max-lg:-translate-x-full max-lg:data-[open=true]:translate-x-0"
        )}
        data-open={collapsed ? undefined : "true"}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
            <Truck className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-primary-foreground">NextGen</span>
              <span className="text-xs text-sidebar-foreground/60">{getRoleLabels(session.roles)} workspace</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-visible px-3 py-4">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.route || pathname.startsWith(item.route + "/")
            return (
              <Link
                key={item.route}
                href={item.route}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
                {collapsed && (
                  <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-[60] -translate-y-1/2 translate-x-[-6px] whitespace-nowrap opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100">
                    <span className="absolute right-full top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b border-l border-blue-200 bg-blue-600 shadow-md shadow-red-950/20" />
                    <span className="relative block rounded-md border border-blue-200 bg-gradient-to-r from-blue-600 via-blue-500 to-red-500 px-3 py-1.5 text-sm font-bold tracking-wide text-white shadow-lg shadow-red-950/30">
                      {item.label}
                    </span>
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Collapse button (desktop only) */}
        <div className="hidden border-t border-sidebar-border p-3 lg:block">
          <button
            onClick={() => onDarkModeChange(!darkMode)}
            className="group relative mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {darkMode ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
            {!collapsed && <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>}
            {collapsed && (
              <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-[60] -translate-y-1/2 translate-x-[-6px] whitespace-nowrap opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100">
                <span className="absolute right-full top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b border-l border-blue-200 bg-blue-600 shadow-md shadow-red-950/20" />
                <span className="relative block rounded-md border border-blue-200 bg-gradient-to-r from-blue-600 via-blue-500 to-red-500 px-3 py-1.5 text-sm font-bold tracking-wide text-white shadow-lg shadow-red-950/30">
                  {darkMode ? "Light Mode" : "Dark Mode"}
                </span>
              </span>
            )}
          </button>
          <button
            onClick={() => onCollapsedChange(!collapsed)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <ChevronLeft className={cn("h-5 w-5 shrink-0 transition-transform", collapsed && "rotate-180")} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
