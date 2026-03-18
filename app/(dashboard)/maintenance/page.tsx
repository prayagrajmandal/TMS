"use client"

import { useMemo, useState } from "react"
import { PageHeader, KpiCard, DataTable } from "@/components/tms-ui"
import {
  maintenanceRecords,
  maintenanceCostByVehicle,
  upcomingMaintenanceDueCount,
  vehicleDriverVehicles,
} from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { getRoleLabels } from "@/lib/auth"
import {
  Plus,
  ClipboardList,
  Wrench,
  AlertTriangle,
  IndianRupee,
  CheckCircle,
  X,
  Calendar,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

const maintenanceTypeOptions = [
  "Routine Service",
  "Oil Change",
  "Tyre Change",
  "Brake Repair",
  "Engine Repair",
  "Accident Repair",
  "Cleaning & Wash",
  "Battery Replacement",
  "Other Repair",
]

interface MaintenanceForm {
  vehicleId: string
  maintenanceType: string
  serviceDate: string
  nextDueDate: string
  serviceCost: string
  workshopName: string
  notes: string
}

const emptyForm: MaintenanceForm = {
  vehicleId: "",
  maintenanceType: "",
  serviceDate: "",
  nextDueDate: "",
  serviceCost: "",
  workshopName: "",
  notes: "",
}

// Calculate total maintenance cost
const totalCost = maintenanceCostByVehicle.reduce((sum, item) => sum + item.cost, 0)

// Bar colors
const barColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
]

export default function MaintenancePage() {
  const { session } = useAuth()
  const [activeTab, setActiveTab] = useState<"records" | "add">("records")
  const [form, setForm] = useState<MaintenanceForm>(emptyForm)
  const [showSuccess, setShowSuccess] = useState(false)
  const [records, setRecords] = useState(maintenanceRecords)
  const maintenanceOnlyView = Boolean(
    session &&
    !session.roles.includes("admin") &&
    !session.accessRoutes.includes("/dashboard") &&
    session.accessRoutes.includes("/maintenance")
  )

  const vehiclesNeedingAttention = useMemo(() => {
    const today = new Date("2026-03-16")
    const thirtyDaysFromNow = new Date(today)
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const dueVehicles = new Set(
      records
        .filter((record) => {
          if (record.NextDueDate === "—") {
            return false
          }

          const dueDate = new Date(record.NextDueDate)
          return dueDate <= thirtyDaysFromNow
        })
        .map((record) => record.VehicleNumber)
    )

    vehicleDriverVehicles
      .filter((vehicle) => vehicle.Status === "Maintenance")
      .forEach((vehicle) => dueVehicles.add(vehicle.VehicleNumber))

    return dueVehicles
  }, [records])

  const visibleRecords = useMemo(() => {
    if (maintenanceOnlyView) {
      return records.filter((record) => vehiclesNeedingAttention.has(record.VehicleNumber))
    }

    return records
  }, [maintenanceOnlyView, records, vehiclesNeedingAttention])

  const selectableVehicles = useMemo(() => {
    if (maintenanceOnlyView) {
      return vehicleDriverVehicles.filter((vehicle) => vehiclesNeedingAttention.has(vehicle.VehicleNumber))
    }

    return vehicleDriverVehicles
  }, [maintenanceOnlyView, vehiclesNeedingAttention])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const selectedVehicle = vehicleDriverVehicles.find((vehicle) => vehicle.VehicleID === form.vehicleId)
    if (!selectedVehicle) {
      return
    }

    const nextId = `MNT-${800 + records.length + 1}`
    setRecords((current) => [
      {
        MaintenanceID: nextId,
        VehicleNumber: selectedVehicle.VehicleNumber,
        MaintenanceType: form.maintenanceType,
        ServiceDate: form.serviceDate,
        NextDueDate: form.nextDueDate || "—",
        Cost: `Rs. ${Number(form.serviceCost || 0).toLocaleString("en-IN")}`,
        Workshop: form.workshopName,
        Notes: form.notes || "Recorded by maintenance team",
      },
      ...current,
    ])
    setShowSuccess(true)
    setForm(emptyForm)
    setTimeout(() => setShowSuccess(false), 3000)
    setActiveTab("records")
  }

  const roleLabel = session ? getRoleLabels(session.roles) : "User"
  const summaryCount = maintenanceOnlyView ? visibleRecords.length : upcomingMaintenanceDueCount

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance"
        description="Record and track vehicle maintenance history"
        actions={
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setActiveTab("add")}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Entry
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-sm font-medium text-card-foreground">{roleLabel} view</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Maintenance staff see only vehicles currently in maintenance or due soon. Head office can review the full maintenance history.
        </p>
      </div>

      {/* Sub-Tab Switcher */}
      <div className="flex gap-1 rounded-lg border border-border bg-card p-1 shadow-sm w-fit">
        <button
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "records"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          onClick={() => setActiveTab("records")}
        >
          <ClipboardList className="h-4 w-4" />
          Maintenance Records
        </button>
        <button
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "add"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          onClick={() => setActiveTab("add")}
        >
          <Plus className="h-4 w-4" />
          Add Maintenance Entry
        </button>
      </div>

      {/* Maintenance Records Tab */}
      {activeTab === "records" && (
        <div className="space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard
              label={maintenanceOnlyView ? "Vehicles Needing Attention" : "Total Records"}
              value={visibleRecords.length}
              icon={<ClipboardList className="h-5 w-5" />}
            />
            <KpiCard
              label="Total Maintenance Cost"
              value={`Rs. ${totalCost.toLocaleString("en-IN")}`}
              icon={<IndianRupee className="h-5 w-5" />}
            />
            <KpiCard
              label={maintenanceOnlyView ? "Records In Your Queue" : "Upcoming Maintenance Due"}
              value={summaryCount}
              icon={<AlertTriangle className="h-5 w-5" />}
              trend={{ value: "Due in next 30 days", positive: false }}
            />
          </div>

          {/* Bar Chart - Maintenance Cost by Vehicle */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-card-foreground">Maintenance Cost by Vehicle</h2>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maintenanceCostByVehicle} margin={{ top: 5, right: 20, left: 10, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="vehicle"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "13px",
                      color: "var(--card-foreground)",
                    }}
                    formatter={(value: number) => [`Rs. ${value.toLocaleString("en-IN")}`, "Cost"]}
                  />
                  <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                    {maintenanceCostByVehicle.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data Grid */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">All Maintenance Entries</h2>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {visibleRecords.length}
              </span>
            </div>
            <DataTable
              columns={[
                "MaintenanceID",
                "VehicleNumber",
                "MaintenanceType",
                "ServiceDate",
                "NextDueDate",
                "Cost",
                "Workshop",
                "Notes",
              ]}
              data={visibleRecords}
              actions={[{ label: "View", onClick: () => {} }]}
            />
          </div>
        </div>
      )}

      {/* Add Maintenance Entry Tab */}
      {activeTab === "add" && (
        <div className="mx-auto max-w-2xl">
          {/* Success Toast */}
          {showSuccess && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-[#059669]">
              <CheckCircle className="h-5 w-5" />
              Maintenance entry recorded successfully!
              <button onClick={() => setShowSuccess(false)} className="ml-auto">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-1 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-card-foreground">Record Vehicle Maintenance</h2>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Fill in the details below to log a maintenance entry for a vehicle.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Select Vehicle */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-card-foreground">
                  Select Vehicle <span className="text-destructive">*</span>
                </label>
                <select
                  value={form.vehicleId}
                  onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Choose a vehicle</option>
                  {selectableVehicles.map((v) => (
                    <option key={v.VehicleID} value={v.VehicleID}>
                      {v.VehicleNumber} ({v.VehicleID})
                    </option>
                  ))}
                </select>
              </div>

              {/* Maintenance Type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-card-foreground">
                  Maintenance Type <span className="text-destructive">*</span>
                </label>
                <select
                  value={form.maintenanceType}
                  onChange={(e) => setForm({ ...form, maintenanceType: e.target.value })}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select maintenance type</option>
                  {maintenanceTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-card-foreground">
                    Service Date <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="date"
                      value={form.serviceDate}
                      onChange={(e) => setForm({ ...form, serviceDate: e.target.value })}
                      required
                      className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-card-foreground">
                    Next Due Date
                  </label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="date"
                      value={form.nextDueDate}
                      onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              {/* Cost + Workshop Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-card-foreground">
                    Service Cost (Rs.) <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="number"
                      value={form.serviceCost}
                      onChange={(e) => setForm({ ...form, serviceCost: e.target.value })}
                      required
                      min={0}
                      placeholder="e.g. 12500"
                      className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-card-foreground">
                    Workshop Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.workshopName}
                    onChange={(e) => setForm({ ...form, workshopName: e.target.value })}
                    required
                    placeholder="e.g. AutoCare Hub, Mumbai"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-card-foreground">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Add any relevant notes about the maintenance..."
                  className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Save Entry
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setForm(emptyForm)
                    setActiveTab("records")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
