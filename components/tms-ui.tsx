"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

interface KpiCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: { value: string; positive: boolean }
  className?: string
}

export function KpiCard({ label, value, icon, trend, className }: KpiCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-6 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <p className="mt-2 text-3xl font-bold text-card-foreground">{value}</p>
      {trend && (
        <p className={cn("mt-1 text-xs font-medium", trend.positive ? "text-success" : "text-destructive")}>
          {trend.positive ? "+" : ""}{trend.value}
        </p>
      )}
    </div>
  )
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorMap: Record<string, string> = {
    "Pending": "bg-warning/10 text-[#D97706] border-warning/20",
    "Planned": "bg-primary/10 text-primary border-primary/20",
    "Dispatched": "bg-success/10 text-[#059669] border-success/20",
    "In Transit": "bg-primary/10 text-primary border-primary/20",
    "Loading": "bg-warning/10 text-[#D97706] border-warning/20",
    "Unloading": "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20",
    "Available": "bg-success/10 text-[#059669] border-success/20",
    "On Trip": "bg-primary/10 text-primary border-primary/20",
    "On Break": "bg-warning/10 text-[#D97706] border-warning/20",
    "Maintenance": "bg-destructive/10 text-destructive border-destructive/20",
    "Approved": "bg-success/10 text-[#059669] border-success/20",
    "Rejected": "bg-destructive/10 text-destructive border-destructive/20",
    "Completed": "bg-success/10 text-[#059669] border-success/20",
    "In Progress": "bg-primary/10 text-primary border-primary/20",
    "Paid": "bg-success/10 text-[#059669] border-success/20",
    "Overdue": "bg-destructive/10 text-destructive border-destructive/20",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        colorMap[status] || "bg-secondary text-secondary-foreground border-border",
        className
      )}
    >
      {status}
    </span>
  )
}

interface DataTableProps {
  columns: string[]
  data: Record<string, unknown>[]
  actions?: { label: string; onClick: (row: Record<string, unknown>) => void; variant?: "default" | "destructive" }[]
}

export function DataTable({ columns, data, actions }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {columns.map((col) => (
              <th key={col} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {col}
              </th>
            ))}
            {actions && (
              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row, i) => (
            <tr key={i} className="transition-colors hover:bg-muted/30">
              {columns.map((col) => {
                const key = col.replace(/\s+/g, "")
                const value = row[key] ?? row[col] ?? row[col.toLowerCase()] ?? ""
                const isStatus = key.toLowerCase().includes("status") || key === "ApprovalStatus"
                return (
                  <td key={col} className="whitespace-nowrap px-4 py-3 text-card-foreground">
                    {isStatus ? <StatusBadge status={String(value)} /> : String(value)}
                  </td>
                )
              })}
              {actions && (
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-2">
                    {actions.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => action.onClick(row)}
                        className={cn(
                          "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                          action.variant === "destructive"
                            ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                            : "bg-primary/10 text-primary hover:bg-primary/20"
                        )}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
