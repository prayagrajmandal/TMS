import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function capitalizeStatus(status: string | null) {
  if (!status) return "Available"
  const s = status.toLowerCase()
  if (s === "on trip") return "On Trip"
  if (s === "on break") return "On Break"
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export async function GET() {
  try {
    const dbDrivers = await prisma.drivers.findMany({
      orderBy: { driver_code: "asc" },
    })

    const drivers = dbDrivers.map(d => ({
      id: d.driver_code || "Unknown",
      name: d.driver_name || "Unknown Driver",
      phone: d.phone || "N/A",
      license: d.license_number || "N/A",
      tripsToday: 0, // Placeholder until schema supports trip counting
      rating: 5.0, // Placeholder
      status: capitalizeStatus(d.status),
    }))

    return NextResponse.json({ drivers })
  } catch (error) {
    console.error("Failed to fetch drivers from DB:", error)
    return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 })
  }
}
