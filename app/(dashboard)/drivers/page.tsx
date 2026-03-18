"use client"

import { useState } from "react"
import { PageHeader, DataTable, StatusBadge } from "@/components/tms-ui"
import { useDrivers, type Driver } from "@/hooks/use-drivers"
import { Button } from "@/components/ui/button"
import { Plus, X, Star, Phone, CreditCard, TrendingUp, Loader2 } from "lucide-react"

export default function DriversPage() {
  const { drivers, isLoading } = useDrivers()
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)

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
        actions={
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Add Driver
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={["DriverID", "Name", "Phone", "License", "TripsToday", "Rating", "Status"]}
          data={tableData}
          actions={[
            { label: "Assign Trip", onClick: () => {} },
            { label: "View", onClick: (row) => setSelectedDriver(drivers.find(d => d.id === row.DriverID) || null) },
          ]}
        />
      )}

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
