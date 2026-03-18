import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function capitalizeStatus(status: string | null) {
  if (!status) return "Available"
  const s = status.toLowerCase()
  if (s === "on trip") return "On Trip"
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export async function GET() {
  try {
    const dbVehicles = await prisma.vehicles.findMany({
      orderBy: { vehicle_number: "asc" },
    })

    const fleet = dbVehicles.map(v => {
      let location = "Depot"
      if (v.status === "on trip" || v.status === "loading") {
        location = "On Route"
      } else if (v.status === "maintenance") {
        location = "Workshop"
      }

      return {
        id: v.vehicle_number || "Unknown",
        type: v.vehicle_type || "Standard",
        capacity: v.capacity ? `${v.capacity} ${v.capacity_unit || "kg"}` : "N/A",
        location,
        lastService: v.updated_at ? v.updated_at.toISOString().split("T")[0] : "Unknown",
        status: capitalizeStatus(v.status),
      }
    })

    return NextResponse.json({ fleet })
  } catch (error) {
    console.error("Failed to fetch fleet from DB:", error)
    return NextResponse.json({ error: "Failed to fetch fleet" }, { status: 500 })
  }
}
