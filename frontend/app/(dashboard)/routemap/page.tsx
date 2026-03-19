"use client"

import { useMemo, useState } from "react"
import { PageHeader, DataTable } from "@/components/tms-ui"
import { Button } from "@/components/ui/button"
import { useRouteMaps } from "@/hooks/use-route-maps"
import { List, MapPinned } from "lucide-react"

const emptyForm = {
  routeName: "",
  start: "",
  end: "",
  viaPoints: "",
  vehicleType: "",
  distanceKm: "",
  estTime: "",
}

export default function RouteMapPage() {
  const { routes, createRoute, isLoading } = useRouteMaps()
  const [activeTab, setActiveTab] = useState<"list" | "create">("list")
  const [form, setForm] = useState(emptyForm)

  const tableData = useMemo(
    () =>
      routes.map((route) => ({
        RouteID: route.id,
        RouteName: route.routeName,
        Start: route.start,
        End: route.end,
        DistanceKM: route.distanceKm,
        EstTime: route.estTime,
        VehicleType: route.vehicleType,
      })),
    [routes]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void createRoute({
      routeName: form.routeName,
      start: form.start,
      end: form.end,
      viaPoints: form.viaPoints,
      vehicleType: form.vehicleType,
      distanceKm: Number(form.distanceKm || 0),
      estTime: form.estTime,
    })
    setForm(emptyForm)
    setActiveTab("list")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transport Route Map"
        description="Create and manage transport routes"
      />

      <div className="flex gap-2">
        <Button variant={activeTab === "list" ? "default" : "outline"} onClick={() => setActiveTab("list")}>
          <List className="mr-2 h-4 w-4" /> Route List
        </Button>
        <Button variant={activeTab === "create" ? "default" : "outline"} onClick={() => setActiveTab("create")}>
          <MapPinned className="mr-2 h-4 w-4" /> Create Route
        </Button>
      </div>

      {activeTab === "list" ? (
        isLoading ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
            Loading routes...
          </div>
        ) : (
          <DataTable
            columns={["RouteID", "RouteName", "Start", "End", "DistanceKM", "EstTime", "VehicleType"]}
            data={tableData}
          />
        )
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">Route Name</label>
              <input value={form.routeName} onChange={(e) => setForm({ ...form, routeName: e.target.value })} required className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Start</label>
                <input value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} required className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">End</label>
                <input value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} required className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">Via Points</label>
              <textarea value={form.viaPoints} onChange={(e) => setForm({ ...form, viaPoints: e.target.value })} rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Vehicle Type</label>
                <input value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} required className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Distance KM</label>
                <input type="number" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} required className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Estimated Time</label>
                <input value={form.estTime} onChange={(e) => setForm({ ...form, estTime: e.target.value })} required className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Create Route
              </Button>
              <Button type="button" variant="outline" onClick={() => setActiveTab("list")}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
