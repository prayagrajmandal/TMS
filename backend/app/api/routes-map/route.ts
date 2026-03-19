import { NextResponse } from "next/server"
import { createTransportRoute, getTransportRoutes } from "@/lib/custom-data"

export async function GET() {
  const routes = await getTransportRoutes()
  return NextResponse.json({ routes })
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    route?: {
      routeName: string
      start: string
      end: string
      viaPoints: string
      vehicleType: string
      distanceKm: number
      estTime: string
    }
  }

  if (!body.route) {
    return NextResponse.json({ error: "Route is required" }, { status: 400 })
  }

  const routes = await createTransportRoute(body.route)
  return NextResponse.json({ routes })
}
