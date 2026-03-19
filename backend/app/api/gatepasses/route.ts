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
      purpose: gp.remarks || "General Transport",
      requestedBy: gp.security_person_name || "System Default",
      approvalStatus: capitalize(gp.gate_status),
      time: gp.created_at ? gp.created_at.toISOString().slice(0, 16).replace("T", " ") : "N/A",
    }))

    return NextResponse.json({ gatePasses })
  } catch (error) {
    console.error("Failed to fetch gatepasses from DB:", error)
    return NextResponse.json({ error: "Failed to fetch gatepasses" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      gatePass?: {
        vehicleId: string
        driverId: string
        purpose: string
        requestedBy: string
        expectedReturn: string
        approvalStatus: string
      }
      statusUpdate?: {
        id: string
        status: string
      }
    }

    if (body.statusUpdate) {
      const existing = await prisma.gate_passes.findFirst({
        where: { gate_pass_number: body.statusUpdate.id },
      })

      if (!existing) {
        return NextResponse.json({ error: "Gate pass not found" }, { status: 404 })
      }

      await prisma.gate_passes.update({
        where: { id: existing.id },
        data: {
          gate_status: body.statusUpdate.status.toLowerCase(),
        },
      })

      return GET()
    }

    if (!body.gatePass) {
      return NextResponse.json({ error: "Gate pass payload is required" }, { status: 400 })
    }

    const count = await prisma.gate_passes.count()
    const gatePassNumber = `GP-${500 + count + 1}`
    const vehicle = await prisma.vehicles.findFirst({
      where: { vehicle_number: body.gatePass.vehicleId },
      select: { id: true },
    })
    const driver = await prisma.drivers.findFirst({
      where: { driver_code: body.gatePass.driverId },
      select: { id: true },
    })

    if (!vehicle || !driver) {
      return NextResponse.json({ error: "Vehicle or driver not found" }, { status: 400 })
    }

    await prisma.gate_passes.create({
      data: {
        gate_pass_number: gatePassNumber,
        vehicle_id: vehicle.id,
        driver_id: driver.id,
        gate_status: body.gatePass.approvalStatus.toLowerCase(),
        security_person_name: body.gatePass.requestedBy,
        remarks: body.gatePass.purpose,
        exit_time: body.gatePass.expectedReturn ? new Date(body.gatePass.expectedReturn) : null,
      },
    })

    return GET()
  } catch (error) {
    console.error("Failed to persist gate pass:", error)
    return NextResponse.json({ error: "Failed to persist gate pass" }, { status: 500 })
  }
}
