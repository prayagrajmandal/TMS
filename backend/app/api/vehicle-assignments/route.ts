import { NextResponse } from "next/server"
import { getVehicleAssignments, saveVehicleAssignments, type VehicleAssignmentRecord } from "@/lib/custom-data"

export async function GET() {
  const assignments = await getVehicleAssignments()
  return NextResponse.json({ assignments })
}

export async function POST(request: Request) {
  const body = (await request.json()) as { assignments?: VehicleAssignmentRecord[] }
  const assignments = await saveVehicleAssignments(Array.isArray(body.assignments) ? body.assignments : [])
  return NextResponse.json({ assignments })
}
