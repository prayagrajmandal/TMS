import { NextResponse } from "next/server"
import { getSessionFromToken } from "@/lib/db-auth"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get("token") ?? ""
  const session = await getSessionFromToken(token)

  if (!session) {
    return NextResponse.json({ session: null }, { status: 401 })
  }

  return NextResponse.json({ session })
}
