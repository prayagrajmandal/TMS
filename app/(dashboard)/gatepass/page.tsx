"use client"

import { useMemo, useState } from "react"
import { PageHeader, KpiCard, DataTable } from "@/components/tms-ui"
import { gatePasses, availableFleet, drivers } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { getRoleLabels } from "@/lib/auth"
import { Shield, Clock, Plus, X } from "lucide-react"

export default function GatePassPage() {
  const { session } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [records, setRecords] = useState(gatePasses)
  const [feedback, setFeedback] = useState("")
  const [formData, setFormData] = useState({
    vehicleId: "",
    driverId: "",
    purpose: "",
    expectedReturn: "",
  })

  const roleLabel = session ? getRoleLabels(session.roles) : "User"
  const canManageGatePasses = session ? session.roles.includes("admin") || session.accessRoutes.includes("/gatepass") : false
  const pendingCount = records.filter((item) => item.approvalStatus === "Pending").length

  const tableData = records.map(gp => ({
    GatePassID: gp.id,
    Vehicle: gp.vehicle,
    Driver: gp.driver,
    Purpose: gp.purpose,
    RequestedBy: gp.requestedBy,
    ApprovalStatus: gp.approvalStatus,
    Time: gp.time,
  }))

  const availableDrivers = useMemo(
    () => drivers.filter(d => d.status === "Available"),
    []
  )

  const handleStatusUpdate = (gatePassId: string, status: "Approved" | "Rejected") => {
    setRecords((current) =>
      current.map((item) =>
        item.id === gatePassId ? { ...item, approvalStatus: status } : item
      )
    )
    setFeedback(`Gate pass ${gatePassId} marked as ${status.toLowerCase()}.`)
  }

  const handleSubmit = () => {
    const selectedVehicle = availableFleet.find((vehicle) => vehicle.id === formData.vehicleId)
    const selectedDriver = drivers.find((driver) => driver.id === formData.driverId)

    if (!selectedVehicle || !selectedDriver || !formData.purpose || !session) {
      setFeedback("Please complete the gate pass form before submitting.")
      return
    }

    const nextId = `GP-${500 + records.length + 1}`
    setRecords((current) => [
      {
        id: nextId,
        vehicle: selectedVehicle.id,
        driver: selectedDriver.name,
        purpose: formData.purpose,
        requestedBy: session.name,
        approvalStatus: session.roles.includes("admin") || session.accessRoutes.includes("/dashboard") ? "Approved" : "Pending",
        time: formData.expectedReturn || new Date().toISOString().slice(0, 16).replace("T", " "),
      },
      ...current,
    ])
    setFormData({ vehicleId: "", driverId: "", purpose: "", expectedReturn: "" })
    setShowForm(false)
    setFeedback(`Gate pass ${nextId} created successfully.`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gate Pass Dashboard"
        description="Manage vehicle gate pass requests and approvals"
        actions={
          canManageGatePasses ? (
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setShowForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Create Gate Pass
            </Button>
          ) : null
        }
      />

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-sm font-medium text-card-foreground">{roleLabel} view</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Gate staff can create and process gate passes. Head office can view every pass and approve pending requests.
        </p>
      </div>

      {feedback ? (
        <div className="rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-[#059669]">
          {feedback}
        </div>
      ) : null}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard
          label="Active Gate Passes"
          value={records.filter((item) => item.approvalStatus === "Approved").length}
          icon={<Shield className="h-5 w-5" />}
        />
        <KpiCard
          label="Pending Approvals"
          value={pendingCount}
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      {/* Data Table */}
      <DataTable
        columns={["GatePassID", "Vehicle", "Driver", "Purpose", "RequestedBy", "ApprovalStatus", "Time"]}
        data={tableData}
        actions={
          canManageGatePasses
            ? [
                {
                  label: "Approve",
                  onClick: (row) => handleStatusUpdate(String(row.GatePassID), "Approved"),
                },
                {
                  label: "Reject",
                  onClick: (row) => handleStatusUpdate(String(row.GatePassID), "Rejected"),
                  variant: "destructive" as const,
                },
              ]
            : undefined
        }
      />

      {/* Create Gate Pass Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-card-foreground">Create Gate Pass</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Vehicle Select */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-card-foreground">Vehicle</label>
                <select
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={formData.vehicleId}
                  onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}
                >
                  <option value="">Select a vehicle</option>
                  {availableFleet.map(v => (
                    <option key={v.id} value={v.id}>{v.id} - {v.type}</option>
                  ))}
                </select>
              </div>

              {/* Driver Select */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-card-foreground">Driver</label>
                <select
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={formData.driverId}
                  onChange={e => setFormData({ ...formData, driverId: e.target.value })}
                >
                  <option value="">Select a driver</option>
                  {availableDrivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Purpose */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-card-foreground">Purpose</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., Delivery - Mumbai to Delhi"
                  value={formData.purpose}
                  onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                />
              </div>

              {/* Expected Return */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-card-foreground">Expected Return</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={formData.expectedReturn}
                  onChange={e => setFormData({ ...formData, expectedReturn: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSubmit}>
                  Submit Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
