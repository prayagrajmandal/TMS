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
        registrationNumber: v.registration_number || "",
        ownership: v.remarks?.replace(/^Ownership:\s*/i, "") || "Own Vehicle",
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      vehicle?: {
        vehicleId?: string
        vehicleType: string
        ownership: string
        vehicleNumber: string
        capacityTon: number
      }
    }

    if (!body.vehicle) {
      return NextResponse.json({ error: "Vehicle is required" }, { status: 400 })
    }

    if (body.vehicle.vehicleId) {
      const existing = await prisma.vehicles.findFirst({
        where: { vehicle_number: body.vehicle.vehicleId },
        select: { id: true, status: true },
      })

      if (!existing) {
        return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
      }

      await prisma.vehicles.update({
        where: { id: existing.id },
        data: {
          vehicle_type: body.vehicle.vehicleType,
          registration_number: body.vehicle.vehicleNumber,
          capacity: body.vehicle.capacityTon * 1000,
          capacity_unit: "kg",
          status: existing.status ?? "available",
          remarks: `Ownership: ${body.vehicle.ownership}`,
        },
      })
    } else {
      const count = await prisma.vehicles.count()
      const vehicleId = `VH-${200 + count + 1}`

      await prisma.vehicles.create({
        data: {
          vehicle_number: vehicleId,
          vehicle_type: body.vehicle.vehicleType,
          registration_number: body.vehicle.vehicleNumber,
          capacity: body.vehicle.capacityTon * 1000,
          capacity_unit: "kg",
          status: "available",
          remarks: `Ownership: ${body.vehicle.ownership}`,
        },
      })
    }

    return GET()
  } catch (error) {
    console.error("Failed to create vehicle:", error)
    return NextResponse.json({ error: "Failed to create vehicle" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { vehicleId?: string }

    if (!body.vehicleId) {
      return NextResponse.json({ error: "Vehicle ID is required" }, { status: 400 })
    }

    const vehicle = await prisma.vehicles.findFirst({
      where: {
        vehicle_number: body.vehicleId,
      },
      select: { id: true },
    })

    if (!vehicle) {
      return GET()
    }

    await prisma.gate_passes.deleteMany({ where: { vehicle_id: vehicle.id } })
    await prisma.trips.deleteMany({ where: { vehicle_id: vehicle.id } })
    await prisma.vehicles.delete({ where: { id: vehicle.id } })

    return GET()
  } catch (error) {
    console.error("Failed to delete vehicle:", error)
    return NextResponse.json({ error: "Failed to delete vehicle" }, { status: 500 })
  }
}
