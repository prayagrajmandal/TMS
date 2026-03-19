import { NextResponse } from "next/server"
import { getAppSettings, saveAppSettings } from "@/lib/custom-data"

export async function GET() {
  const settings = await getAppSettings()
  return NextResponse.json({ settings })
}

export async function POST(request: Request) {
  const body = (await request.json()) as { settings?: Awaited<ReturnType<typeof getAppSettings>> }
  const settings = await saveAppSettings(body.settings ?? {
    companyName: "",
    contactEmail: "",
    googleMapsKey: "",
    gpsProvider: "JioGPS",
  })

  return NextResponse.json({ settings })
}
