"use client"

import { useState } from "react"
import { PageHeader, DataTable, StatusBadge } from "@/components/tms-ui"
import { useDrivers, type Driver } from "@/hooks/use-drivers"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Plus, X, Star, Phone, CreditCard, TrendingUp, Loader2, Truck, CheckCircle } from "lucide-react"

export default function DriversPage() {
  const { session } = useAuth()
  const { drivers, isLoading, createDriver, updateDriver, deleteDriver } = useDrivers()
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [activeTab, setActiveTab] = useState<"display" | "input">("display")
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [form, setForm] = useState({
    name: "",
    phone: "",
    license: "",
    email: "",
    status: "available",
  })

  const tableData = drivers.map(d => ({
    DriverID: d.id,
    Name: d.name,
    Phone: d.phone,
    License: d.license,
    TripsToday: d.tripsToday,
    Rating: d.rating,
    Status: d.status,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drivers"
        description="Manage driver roster and assignments"
      />

      <div className="flex w-fit gap-1 rounded-lg border border-border bg-card p-1 shadow-sm">
        <button
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "display"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          onClick={() => setActiveTab("display")}
        >
          <Truck className="h-4 w-4" />
          Display
        </button>
        <button
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "input"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          onClick={() => setActiveTab("input")}
        >
          <Plus className="h-4 w-4" />
          Add Driver
        </button>
      </div>

      {activeTab === "display" && isLoading ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : null}

      {activeTab === "display" && !isLoading ? (
        <DataTable
          columns={["DriverID", "Name", "Phone", "License", "TripsToday", "Rating", "Status"]}
          data={tableData}
          actions={[
            { label: "Assign Trip", onClick: () => {} },
            {
              label: "Edit",
              onClick: (row) => {
                const driver = drivers.find((d) => d.id === row.DriverID)
                if (!driver) {
                  return
                }

                setEditingDriverId(driver.id)
                setForm({
                  name: driver.name,
                  phone: driver.phone,
                  license: driver.license,
                  email: "",
                  status: driver.status.toLowerCase(),
                })
                setActiveTab("input")
              },
            },
            { label: "View", onClick: (row) => setSelectedDriver(drivers.find(d => d.id === row.DriverID) || null) },
            {
              label: "Delete",
              variant: "destructive",
              onClick: (row) => {
                const driverId = String(row.DriverID)
                if (window.confirm(`Delete driver ${driverId}?`)) {
                  void deleteDriver(driverId)
                }
              },
            },
          ]}
        />
      ) : null}

      {activeTab === "input" ? (
        <div className="mx-auto max-w-2xl">
          {showSuccess ? (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-[#059669]">
              <CheckCircle className="h-5 w-5" />
              {editingDriverId ? "Driver details updated successfully!" : "Driver details submitted successfully!"}
              <button onClick={() => setShowSuccess(false)} className="ml-auto">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-semibold text-card-foreground">
              {editingDriverId ? `Edit Driver ${editingDriverId}` : "Add Driver Details"}
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              {editingDriverId ? "Update the selected driver details." : "Fill in the details below to register a new driver."}
            </p>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                const isEditing = Boolean(editingDriverId)

                if (editingDriverId) {
                  void updateDriver({
                    driverId: editingDriverId,
                    ...form,
                    organization: session?.organization,
                  })
                } else {
                  void createDriver({
                    ...form,
                    organization: session?.organization,
                  })
                }

                setForm({
                  name: "",
                  phone: "",
                  license: "",
                  email: "",
                  status: "available",
                })
                setEditingDriverId(null)
                setShowSuccess(true)
                setTimeout(() => setShowSuccess(false), 3000)
                if (isEditing) {
                  setActiveTab("display")
                }
              }}
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Driver Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">License Number</label>
                <input
                  value={form.license}
                  onChange={(e) => setForm({ ...form, license: e.target.value })}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
                >
                  <option value="available">Available</option>
                  <option value="active">Active</option>
                  <option value="on break">On Break</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {editingDriverId ? "Save Changes" : "Save Driver"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingDriverId(null)
                    setForm({
                      name: "",
                      phone: "",
                      license: "",
                      email: "",
                      status: "available",
                    })
                    setActiveTab("display")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Driver Profile Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={() => setSelectedDriver(null)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-card-foreground">Driver Profile</h2>
              <button onClick={() => setSelectedDriver(null)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Header */}
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                {selectedDriver.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">{selectedDriver.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedDriver.id}</p>
                <StatusBadge status={selectedDriver.status} />
              </div>
            </div>

            {/* Info Grid */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium text-card-foreground">{selectedDriver.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">License</p>
                  <p className="text-sm font-medium text-card-foreground">{selectedDriver.license.substring(0, 12)}...</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Star className="h-4 w-4 text-warning" />
                <div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <p className="text-sm font-medium text-card-foreground">{selectedDriver.rating} / 5.0</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Trips Today</p>
                  <p className="text-sm font-medium text-card-foreground">{selectedDriver.tripsToday}</p>
                </div>
              </div>
            </div>

            {/* Performance Chart Placeholder */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Performance (Last 30 Days)</p>
              <div className="flex items-end gap-1.5">
                {[65, 72, 58, 80, 90, 85, 78, 92, 88, 95, 82, 76].map((val, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-primary/70"
                    style={{ height: `${val * 0.6}px` }}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>4 weeks ago</span>
                <span>This week</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedDriver(null)}>Close</Button>
              <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">Assign Trip</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
