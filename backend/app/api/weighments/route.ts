import { NextResponse } from "next/server"
import { createWeighment, getWeighments } from "@/lib/custom-data"

export async function GET() {
  const weighments = await getWeighments()
  return NextResponse.json({ weighments })
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    weighment?: {
      vehicleId: string
      type: string
      grossWeight: number
      tareWeight: number
      material: string
      status?: string
    }
  }

  if (!body.weighment) {
    return NextResponse.json({ error: "Weighment is required" }, { status: 400 })
  }

  const weighments = await createWeighment(body.weighment)
  return NextResponse.json({ weighments })
}
