"use client"

import { useState } from "react"
import { PageHeader, DataTable } from "@/components/tms-ui"
import { unplannedOrders, availableFleet } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react"

export default function PlanningPage() {
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set())
  const [planned, setPlanned] = useState(false)

  const toggleOrder = (id: string) => {
    setSelectedOrders(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleVehicle = (id: string) => {
    setSelectedVehicles(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transport Planning"
        description="Plan trips by assigning orders to available fleet"
      />

      {planned && (
        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <p className="text-sm font-medium text-[#059669]">
            AI has successfully planned {selectedOrders.size} orders across {selectedVehicles.size} vehicles. Trip creation is pending dispatcher approval.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Unplanned Orders */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Unplanned Orders</h3>
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">OrderID</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Route</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {unplannedOrders.map(o => (
                  <tr
                    key={o.id}
                    className={`cursor-pointer transition-colors ${selectedOrders.has(o.id) ? "bg-primary/5" : "hover:bg-muted/30"}`}
                    onClick={() => toggleOrder(o.id)}
                  >
                    <td className="px-4 py-3">
                      <div className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors ${
                        selectedOrders.has(o.id) ? "border-primary bg-primary" : "border-border"
                      }`}>
                        {selectedOrders.has(o.id) && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-card-foreground">{o.id}</td>
                    <td className="px-4 py-3 text-card-foreground">{o.customer}</td>
                    <td className="px-4 py-3 text-card-foreground">{o.source} → {o.destination}</td>
                    <td className="px-4 py-3 text-card-foreground">{o.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Available Fleet */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Available Fleet</h3>
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">VehicleID</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Capacity</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {availableFleet.map(v => (
                  <tr
                    key={v.id}
                    className={`cursor-pointer transition-colors ${selectedVehicles.has(v.id) ? "bg-primary/5" : "hover:bg-muted/30"}`}
                    onClick={() => toggleVehicle(v.id)}
                  >
                    <td className="px-4 py-3">
                      <div className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors ${
                        selectedVehicles.has(v.id) ? "border-primary bg-primary" : "border-border"
                      }`}>
                        {selectedVehicles.has(v.id) && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-card-foreground">{v.id}</td>
                    <td className="px-4 py-3 text-card-foreground">{v.type}</td>
                    <td className="px-4 py-3 text-card-foreground">{v.capacity}</td>
                    <td className="px-4 py-3 text-card-foreground">{v.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="text-sm text-muted-foreground">
          {selectedOrders.size} orders and {selectedVehicles.size} vehicles selected
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={selectedOrders.size === 0 || selectedVehicles.size === 0}
          onClick={() => setPlanned(true)}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Auto-Plan (AI)
        </Button>
      </div>
    </div>
  )
}
