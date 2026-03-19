import { NextResponse } from "next/server"
import { createMaintenanceEntry, getMaintenanceEntries } from "@/lib/custom-data"

export async function GET() {
  const entries = await getMaintenanceEntries()
  return NextResponse.json({ entries })
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    entry?: {
      vehicleId: string
      vehicleNumber: string
      maintenanceType: string
      serviceDate: string
      nextDueDate: string
      serviceCost: number
      workshop: string
      notes: string
    }
  }

  if (!body.entry) {
    return NextResponse.json({ error: "Entry is required" }, { status: 400 })
  }

  const entries = await createMaintenanceEntry(body.entry)
  return NextResponse.json({ entries })
}
