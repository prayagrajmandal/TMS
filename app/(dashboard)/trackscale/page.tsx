"use client"

import { PageHeader, KpiCard, DataTable, StatusBadge } from "@/components/tms-ui"
import { trackScaleKpi, recentWeighments, hourlyWeighmentData } from "@/lib/mock-data"
import { Weight, ArrowDownToLine, ArrowUpFromLine, ParkingSquare, BarChart3, Plus } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { useState } from "react"

function NewWeighmentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-card-foreground">New Weighment Entry</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-card-foreground">&times;</button>
        </div>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onClose() }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">Vehicle ID</label>
              <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground">
                <option>VH-101</option>
                <option>VH-201</option>
                <option>VH-205</option>
                <option>VH-208</option>
                <option>VH-212</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">Type</label>
              <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground">
                <option>Inward</option>
                <option>Outward</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">Gross Weight (kg)</label>
              <input type="number" placeholder="e.g. 26500" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">Tare Weight (kg)</label>
              <input type="number" placeholder="e.g. 12000" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">Material</label>
            <input type="text" placeholder="e.g. Steel Coils" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground hover:bg-muted">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Record Weighment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TrackScalePage() {
  const [showModal, setShowModal] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>("All")

  const filteredWeighments = typeFilter === "All"
    ? recentWeighments
    : recentWeighments.filter((w) => w.type === typeFilter)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Track Scale Dashboard"
        description="Weighbridge operations and vehicle weighment tracking"
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Weighment
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Today's Weighments"
          value={trackScaleKpi.todayWeighments}
          icon={<Weight className="h-5 w-5" />}
          trend={{ value: "8% vs yesterday", positive: true }}
        />
        <KpiCard
          label="Total Inward Weight"
          value={trackScaleKpi.totalInwardWeight}
          icon={<ArrowDownToLine className="h-5 w-5" />}
          trend={{ value: "15% vs yesterday", positive: true }}
        />
        <KpiCard
          label="Total Outward Weight"
          value={trackScaleKpi.totalOutwardWeight}
          icon={<ArrowUpFromLine className="h-5 w-5" />}
          trend={{ value: "3% vs yesterday", positive: false }}
        />
        <KpiCard
          label="Vehicles in Yard"
          value={trackScaleKpi.vehiclesInYard}
          icon={<ParkingSquare className="h-5 w-5" />}
          trend={{ value: "2 more than avg", positive: true }}
        />
      </div>

      {/* Hourly Weighment Chart */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">Hourly Weighment Activity</h3>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyWeighmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="hour" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "8px",
                  color: "var(--card-foreground)",
                }}
              />
              <Legend />
              <Bar dataKey="inward" name="Inward" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outward" name="Outward" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Weighments Table */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-foreground">Recent Weighments</h3>
          <div className="flex items-center gap-2">
            {["All", "Inward", "Outward"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  typeFilter === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">ID</th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vehicle</th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gross Wt</th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tare Wt</th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Net Wt</th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Material</th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredWeighments.map((w) => (
                <tr key={w.id} className="transition-colors hover:bg-muted/30">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-card-foreground">{w.id}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-card-foreground">{w.vehicle}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${w.type === "Inward" ? "text-[#1A73E8]" : "text-[#059669]"}`}>
                      {w.type === "Inward" ? <ArrowDownToLine className="h-3.5 w-3.5" /> : <ArrowUpFromLine className="h-3.5 w-3.5" />}
                      {w.type}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-card-foreground">{w.grossWeight}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-card-foreground">{w.tareWeight}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-card-foreground">{w.netWeight}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-card-foreground">{w.material}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{w.time}</td>
                  <td className="whitespace-nowrap px-4 py-3"><StatusBadge status={w.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <NewWeighmentModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
