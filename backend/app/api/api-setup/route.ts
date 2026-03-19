import { NextResponse } from "next/server"
import { getApiSetup, saveApiSetup } from "@/lib/custom-data"

export async function GET() {
  const setup = await getApiSetup()
  return NextResponse.json({ setup })
}

export async function POST(request: Request) {
  const body = (await request.json()) as { setup?: Awaited<ReturnType<typeof getApiSetup>> }
  const setup = await saveApiSetup(body.setup ?? {
    provider: "SAP S/4HANA",
    baseUrl: "",
    authType: "Bearer Token",
    clientId: "",
    clientSecret: "",
    orderEndpoint: "",
    syncMethod: "Pull every 15 minutes",
    orderIdField: "VBELN",
    customerField: "KUNNR",
    sourceField: "WERKS_FROM",
    destinationField: "WERKS_TO",
    weightField: "BRGEW",
    volumeField: "VOLUM",
    status: "Draft",
  })

  return NextResponse.json({ setup })
}
