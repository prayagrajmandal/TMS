"use client"

import { useState } from "react"
import { PageHeader, StatusBadge } from "@/components/tms-ui"
import { activeTrips } from "@/lib/mock-data"
import { MapPin, Navigation, Clock, Truck, Signal, Layers } from "lucide-react"

const vehiclePositions = [
  { id: "VH-101", driver: "Rajesh Kumar", lat: 24.56, lng: 74.82, speed: "72 km/h", heading: "NE", route: "Mumbai - Delhi", status: "Moving", lastUpdate: "2 min ago" },
  { id: "VH-102", driver: "Sunil Patil", lat: 18.52, lng: 73.86, speed: "0 km/h", heading: "-", route: "Pune - Chennai", status: "Stopped", lastUpdate: "1 min ago" },
  { id: "VH-103", driver: "Manoj Singh", lat: 27.18, lng: 80.35, speed: "65 km/h", heading: "SE", route: "Delhi - Lucknow", status: "Moving", lastUpdate: "30 sec ago" },
  { id: "VH-104", driver: "Vikram Yadav", lat: 24.81, lng: 89.37, speed: "58 km/h", heading: "E", route: "Kolkata - Guwahati", status: "Moving", lastUpdate: "1 min ago" },
  { id: "VH-105", driver: "Amit Sharma", lat: 15.36, lng: 78.47, speed: "0 km/h", heading: "-", route: "Bangalore - Hyderabad", status: "Stopped", lastUpdate: "5 min ago" },
]

export default function TrackingPage() {
  const [selectedVehicle, setSelectedVehicle] = useState<typeof vehiclePositions[0] | null>(null)
  const [activeLayer, setActiveLayer] = useState<"vehicles" | "stops" | "routes">("vehicles")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live GPS Tracking"
        description="Real-time vehicle tracking and route monitoring"
        actions={
          <div className="flex items-center gap-2">
            <Signal className="h-4 w-4 animate-pulse text-success" />
            <span className="text-sm font-medium text-success">Live</span>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
        {/* Vehicle List Panel */}
        <div className="space-y-3">
          {/* Layer Toggles */}
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            {(["vehicles", "stops", "routes"] as const).map(layer => (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer)}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  activeLayer === layer
                    ? "bg-card text-card-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {layer}
              </button>
            ))}
          </div>

          {/* Vehicle Cards */}
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
            {vehiclePositions.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicle(v)}
                className={`w-full rounded-xl border p-4 text-left transition-all ${
                  selectedVehicle?.id === v.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-card-foreground">{v.id}</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                    v.status === "Moving" ? "text-success" : "text-warning"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      v.status === "Moving" ? "bg-success" : "bg-warning"
                    }`} />
                    {v.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{v.driver}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{v.route}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Navigation className="h-3 w-3" /> {v.speed}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {v.lastUpdate}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Map Area */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="relative flex h-[600px] items-center justify-center bg-muted">
            {/* Grid background */}
            <div className="absolute inset-0 opacity-[0.07]" style={{
              backgroundImage: `
                linear-gradient(var(--primary) 1px, transparent 1px),
                linear-gradient(90deg, var(--primary) 1px, transparent 1px)
              `,
              backgroundSize: "30px 30px"
            }} />

            {/* Simulated vehicle dots */}
            {vehiclePositions.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicle(v)}
                className={`absolute z-10 group ${
                  selectedVehicle?.id === v.id ? "scale-125" : ""
                }`}
                style={{
                  top: `${15 + i * 15}%`,
                  left: `${15 + i * 16}%`,
                }}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-md transition-transform ${
                  v.status === "Moving"
                    ? "border-success bg-success/20"
                    : "border-warning bg-warning/20"
                }`}>
                  <Truck className={`h-4 w-4 ${
                    v.status === "Moving" ? "text-success" : "text-warning"
                  }`} />
                </div>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-card px-2 py-1 text-xs font-medium text-card-foreground shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity">
                  {v.id}
                </div>
              </button>
            ))}

            {/* Selected vehicle info */}
            {selectedVehicle && (
              <div className="absolute bottom-4 left-4 right-4 z-20 rounded-xl border border-border bg-card p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-card-foreground">{selectedVehicle.id}</h4>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        selectedVehicle.status === "Moving"
                          ? "bg-success/10 text-[#059669]"
                          : "bg-warning/10 text-[#D97706]"
                      }`}>
                        {selectedVehicle.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{selectedVehicle.driver} - {selectedVehicle.route}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="text-center">
                      <p className="font-semibold text-card-foreground">{selectedVehicle.speed}</p>
                      <p>Speed</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-card-foreground">{selectedVehicle.heading}</p>
                      <p>Heading</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-card-foreground">{selectedVehicle.lastUpdate}</p>
                      <p>Updated</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!selectedVehicle && (
              <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-card-foreground">Satellite Map View</p>
                  <p className="mt-1 text-sm text-muted-foreground">Select a vehicle from the panel to track its position</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
