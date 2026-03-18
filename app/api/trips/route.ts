import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function formatDateTime(date: Date | null) {
  if (!date) return "N/A"
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
}

export async function GET() {
  try {
    const dbTrips = await prisma.trips.findMany({
      include: { vehicles: true, drivers: true },
      orderBy: { updated_at: "desc" },
    })

    const activeTrips = []
    const completedTrips = []

    for (const t of dbTrips) {
      const isCompleted = t.trip_status === "completed"
      const base = {
        id: t.trip_number ?? "UNKNOWN",
        vehicle: t.vehicles?.vehicle_number ?? "Unknown",
        driver: t.drivers?.driver_name ?? "Unknown",
      }

      if (isCompleted) {
        completedTrips.push({
          ...base,
          distance: t.distance_km ? `${t.distance_km} km` : "N/A",
          completedAt: formatDateTime(t.actual_end_time) || "Recently"
        })
      } else {
        let statusLabel = "Planned"
        if (t.trip_status === "in transit") statusLabel = "In Transit"
        else if (t.trip_status === "loading") statusLabel = "Loading"
        else if (t.trip_status === "unloading") statusLabel = "Unloading"
        
        activeTrips.push({
          ...base,
          route: `${t.start_location || "Unknown"} → ${t.end_location || "Unknown"}`,
          eta: formatDateTime(t.planned_end_time),
          status: statusLabel
        })
      }
    }

    return NextResponse.json({ activeTrips, completedTrips })
  } catch (error) {
    console.error("Failed to fetch trips from DB:", error)
    return NextResponse.json({ error: "Failed to fetch trips" }, { status: 500 })
  }
}
