import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function capitalize(s: string | null) {
  if (!s) return "Pending"
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

export async function GET() {
  try {
    const dbGatePasses = await prisma.gate_passes.findMany({
      include: { vehicles: true, drivers: true },
      orderBy: { created_at: "desc" },
    })

    const gatePasses = dbGatePasses.map(gp => ({
      id: gp.gate_pass_number || "Unknown",
      vehicle: gp.vehicles?.vehicle_number || "Unknown",
      driver: gp.drivers?.driver_name || "Unknown",
      purpose: "General Transport", // Schema independent
      requestedBy: "System Default", // Schema independent
      approvalStatus: capitalize(gp.gate_status),
      time: gp.created_at ? gp.created_at.toISOString().slice(0, 16).replace("T", " ") : "N/A",
    }))

    return NextResponse.json({ gatePasses })
  } catch (error) {
    console.error("Failed to fetch gatepasses from DB:", error)
    return NextResponse.json({ error: "Failed to fetch gatepasses" }, { status: 500 })
  }
}
