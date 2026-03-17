"use client"

import { useState, useMemo } from "react"
import { PageHeader, DataTable } from "@/components/tms-ui"
import { transportRoutes, routeMapPoints } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Plus,
  MapPinned,
  List,
  Map as MapIcon,
  Navigation,
  CheckCircle,
  X,
  Truck,
  Eye,
  MapPin,
  ArrowRight,
} from "lucide-react"

const vehicleTypeOptions = ["Truck", "Bus", "Pickup", "Drop Car", "Mini Truck"]

interface RouteForm {
  routeName: string
  startLocation: string
  endLocation: string
  viaPoints: string
  vehicleType: string
  distance: string
  estimatedTime: string
}

const emptyForm: RouteForm = {
  routeName: "",
  startLocation: "",
  endLocation: "",
  viaPoints: "",
  vehicleType: "",
  distance: "",
  estimatedTime: "",
}

export default function RouteMapPage() {
  const [activeTab, setActiveTab] = useState<"list" | "create" | "map">("list")
  const [form, setForm] = useState<RouteForm>(emptyForm)
  const [showSuccess, setShowSuccess] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<typeof transportRoutes[0] | null>(null)
  const [showMapModal, setShowMapModal] = useState(false)
  const [visibleLayers, setVisibleLayers] = useState({ routes: true, vehicles: true })
  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSuccess(true)
    setForm(emptyForm)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const toggleLayer = (layer: "routes" | "vehicles") => {
    setVisibleLayers((prev) => ({ ...prev, [layer]: !prev[layer] }))
  }

  // Generate SVG path for a route
  const generatePath = (routeId: string) => {
    const points = routeMapPoints[routeId]
    if (!points || points.length < 2) return ""
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x}% ${p.y}%`).join(" ")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transport Route Map"
        description="Create, manage, and visualize transport routes"
        actions={
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setActiveTab("create")}
          >
            <Plus className="mr-2 h-4 w-4" /> New Route
          </Button>
        }
      />

      {/* Sub-Tab Switcher */}
      <div className="flex gap-1 rounded-lg border border-border bg-card p-1 shadow-sm w-fit">
        <button
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "list"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          onClick={() => setActiveTab("list")}
        >
          <List className="h-4 w-4" />
          Route List
        </button>
        <button
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "create"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          onClick={() => setActiveTab("create")}
        >
          <Plus className="h-4 w-4" />
          Create Route
        </button>
        <button
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "map"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          onClick={() => setActiveTab("map")}
        >
          <MapIcon className="h-4 w-4" />
          Map View
        </button>
      </div>

      {/* ===== ROUTE LIST TAB ===== */}
      {activeTab === "list" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <MapPinned className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Routes</p>
                  <p className="text-2xl font-bold text-card-foreground">{transportRoutes.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#10B981]/10">
                  <Navigation className="h-5 w-5 text-[#10B981]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Distance</p>
                  <p className="text-2xl font-bold text-card-foreground">
                    {transportRoutes.reduce((s, r) => s + r.DistanceKM, 0).toLocaleString("en-IN")} km
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F59E0B]/10">
                  <Truck className="h-5 w-5 text-[#F59E0B]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle Types</p>
                  <p className="text-2xl font-bold text-card-foreground">
                    {new Set(transportRoutes.map((r) => r.VehicleType)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Data Grid */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <List className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">All Transport Routes</h2>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {transportRoutes.length}
              </span>
            </div>
            <DataTable
              columns={["RouteID", "RouteName", "Start", "End", "DistanceKM", "EstTime", "VehicleType"]}
              data={transportRoutes}
              actions={[
                {
                  label: "View on Map",
                  onClick: (row) => {
                    const route = transportRoutes.find((r) => r.RouteID === row.RouteID)
                    if (route) {
                      setSelectedRoute(route)
                      setShowMapModal(true)
                    }
                  },
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* ===== ROUTE MAP MODAL ===== */}
      {showMapModal && selectedRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <MapPinned className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-card-foreground">
                    {selectedRoute.RouteName}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedRoute.Start} to {selectedRoute.End} - {selectedRoute.DistanceKM} km
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMapModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Route Map */}
            <div className="p-6">
              <div className="relative h-[400px] overflow-hidden rounded-xl border border-border bg-muted">
                {/* Grid */}
                <div
                  className="absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage: `linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                  }}
                />

                {/* Route Line */}
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path
                    d={generatePath(selectedRoute.RouteID)}
                    fill="none"
                    stroke={selectedRoute.color}
                    strokeWidth="0.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="1.5 0.8"
                  />
                </svg>

                {/* Stops */}
                {routeMapPoints[selectedRoute.RouteID]?.map((point, i, arr) => (
                  <div
                    key={point.label}
                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                  >
                    <div
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full border-2 shadow-md",
                        i === 0
                          ? "border-[#10B981] bg-[#10B981]/20"
                          : i === arr.length - 1
                          ? "border-destructive bg-destructive/20"
                          : "border-[#F59E0B] bg-[#F59E0B]/20"
                      )}
                      style={{ borderColor: i > 0 && i < arr.length - 1 ? selectedRoute.color : undefined }}
                    >
                      <MapPin
                        className="h-3.5 w-3.5"
                        style={{
                          color:
                            i === 0
                              ? "#10B981"
                              : i === arr.length - 1
                              ? "var(--destructive)"
                              : selectedRoute.color,
                        }}
                      />
                    </div>
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-card px-1.5 py-0.5 text-[10px] font-medium text-card-foreground shadow border border-border">
                      {point.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Route Info Bar */}
              <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/50 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
                  <span className="font-medium text-card-foreground">{selectedRoute.Start}</span>
                </div>
                {selectedRoute.viaPoints.split(", ").map((via) => (
                  <div key={via} className="flex items-center gap-2 text-sm">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{via}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-sm">
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
                  <span className="font-medium text-card-foreground">{selectedRoute.End}</span>
                </div>
                <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{selectedRoute.DistanceKM} km</span>
                  <span>{selectedRoute.EstTime}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{selectedRoute.VehicleType}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== CREATE ROUTE TAB ===== */}
      {activeTab === "create" && (
        <div className="mx-auto max-w-2xl">
          {showSuccess && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-3 text-sm font-medium text-[#059669]">
              <CheckCircle className="h-5 w-5" />
              Transport route created successfully!
              <button onClick={() => setShowSuccess(false)} className="ml-auto">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-1 flex items-center gap-2">
              <MapPinned className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-card-foreground">Add New Transport Route</h2>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Define route details including start, end, via points, vehicle type, and distance.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Route Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-card-foreground">
                  Route Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={form.routeName}
                  onChange={(e) => setForm({ ...form, routeName: e.target.value })}
                  required
                  placeholder="e.g. Mumbai - Delhi Express"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Start / End Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-card-foreground">
                    Start Location <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.startLocation}
                    onChange={(e) => setForm({ ...form, startLocation: e.target.value })}
                    required
                    placeholder="e.g. Mumbai"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-card-foreground">
                    End Location <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.endLocation}
                    onChange={(e) => setForm({ ...form, endLocation: e.target.value })}
                    required
                    placeholder="e.g. Delhi"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Via Points */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-card-foreground">
                  Via Points (comma separated)
                </label>
                <textarea
                  value={form.viaPoints}
                  onChange={(e) => setForm({ ...form, viaPoints: e.target.value })}
                  rows={2}
                  placeholder="e.g. Surat, Ahmedabad, Jaipur"
                  className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Vehicle Type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-card-foreground">
                  Vehicle Type <span className="text-destructive">*</span>
                </label>
                <select
                  value={form.vehicleType}
                  onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select vehicle type</option>
                  {vehicleTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Distance / Est Time Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-card-foreground">
                    Distance (KM) <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.distance}
                    onChange={(e) => setForm({ ...form, distance: e.target.value })}
                    required
                    min={0}
                    placeholder="e.g. 1420"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-card-foreground">
                    Estimated Travel Time <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.estimatedTime}
                    onChange={(e) => setForm({ ...form, estimatedTime: e.target.value })}
                    required
                    placeholder="e.g. 22h 30m"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Create Route
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setForm(emptyForm)
                    setActiveTab("list")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MAP VIEW TAB ===== */}
      {activeTab === "map" && (
        <div className="space-y-4">
          {/* Layer Controls */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">Layers:</span>
            {(["routes", "vehicles"] as const).map((layer) => (
              <button
                key={layer}
                onClick={() => toggleLayer(layer)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  visibleLayers[layer]
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                )}
              >
                {layer === "routes" ? <MapPinned className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                {layer}
              </button>
            ))}

            {/* Route Legend */}
            <div className="ml-auto hidden items-center gap-3 sm:flex">
              {transportRoutes.slice(0, 5).map((r) => (
                <div key={r.RouteID} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="text-[11px] text-muted-foreground">{r.RouteID}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Full Map */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
            <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="relative h-[600px] bg-muted">
                {/* Grid */}
                <div
                  className="absolute inset-0 opacity-[0.05]"
                  style={{
                    backgroundImage: `linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)`,
                    backgroundSize: "30px 30px",
                  }}
                />

                {/* Route Lines */}
                {visibleLayers.routes && (
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {transportRoutes.map((route) => (
                      <path
                        key={route.RouteID}
                        d={generatePath(route.RouteID)}
                        fill="none"
                        stroke={route.color}
                        strokeWidth={hoveredRoute === route.RouteID ? "0.6" : "0.35"}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={hoveredRoute === route.RouteID ? "none" : "1.2 0.6"}
                        opacity={hoveredRoute && hoveredRoute !== route.RouteID ? 0.25 : 1}
                        style={{ transition: "opacity 0.2s, stroke-width 0.2s" }}
                      />
                    ))}
                  </svg>
                )}

                {/* Route Stops */}
                {visibleLayers.routes &&
                  transportRoutes.map((route) =>
                    routeMapPoints[route.RouteID]?.map((point, i, arr) => (
                      <div
                        key={`${route.RouteID}-${point.label}`}
                        className="absolute z-10 -translate-x-1/2 -translate-y-1/2 group"
                        style={{
                          left: `${point.x}%`,
                          top: `${point.y}%`,
                          opacity: hoveredRoute && hoveredRoute !== route.RouteID ? 0.2 : 1,
                          transition: "opacity 0.2s",
                        }}
                        onMouseEnter={() => setHoveredRoute(route.RouteID)}
                        onMouseLeave={() => setHoveredRoute(null)}
                      >
                        <div
                          className="flex h-5 w-5 items-center justify-center rounded-full border-2 shadow-sm"
                          style={{
                            borderColor: route.color,
                            backgroundColor: `${route.color}20`,
                          }}
                        >
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: route.color }}
                          />
                        </div>
                        <span className="pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-card px-1 py-0.5 text-[9px] font-medium text-card-foreground shadow border border-border opacity-0 group-hover:opacity-100 transition-opacity">
                          {point.label}
                        </span>
                      </div>
                    ))
                  )}

                {/* Vehicle Overlay */}
                {visibleLayers.vehicles && (
                  <>
                    {[
                      { id: "VH-101", x: 28, y: 42, route: "RT-001" },
                      { id: "VH-102", x: 32, y: 62, route: "RT-002" },
                      { id: "VH-103", x: 48, y: 32, route: "RT-003" },
                      { id: "VH-104", x: 66, y: 34, route: "RT-004" },
                      { id: "VH-105", x: 40, y: 64, route: "RT-005" },
                    ].map((v) => (
                      <div
                        key={v.id}
                        className="absolute z-20 -translate-x-1/2 -translate-y-1/2 group"
                        style={{ left: `${v.x}%`, top: `${v.y}%` }}
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-primary bg-primary/20 shadow-md animate-pulse">
                          <Truck className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-card px-2 py-0.5 text-[10px] font-semibold text-card-foreground shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity">
                          {v.id}
                        </span>
                      </div>
                    ))}
                  </>
                )}

                {/* Empty state */}
                {!visibleLayers.routes && !visibleLayers.vehicles && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <MapIcon className="h-7 w-7 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-card-foreground">Enable a layer to view on map</p>
                    <p className="text-xs text-muted-foreground">Toggle routes or vehicles above</p>
                  </div>
                )}
              </div>
            </div>

            {/* Route Sidebar List */}
            <div className="space-y-2 overflow-y-auto rounded-xl border border-border bg-card p-3 shadow-sm" style={{ maxHeight: 616 }}>
              <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Routes ({transportRoutes.length})
              </h3>
              {transportRoutes.map((route) => (
                <button
                  key={route.RouteID}
                  onMouseEnter={() => setHoveredRoute(route.RouteID)}
                  onMouseLeave={() => setHoveredRoute(null)}
                  onClick={() => {
                    setSelectedRoute(route)
                    setShowMapModal(true)
                  }}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-all",
                    hoveredRoute === route.RouteID
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: route.color }} />
                    <span className="text-xs font-semibold text-card-foreground">{route.RouteID}</span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-card-foreground truncate">{route.RouteName}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{route.DistanceKM} km</span>
                    <span className="text-border">|</span>
                    <span>{route.EstTime}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
