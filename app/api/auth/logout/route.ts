import { NextResponse } from "next/server"
import { clearSessionToken } from "@/lib/db-auth"

export async function POST(request: Request) {
  const body = (await request.json()) as { token?: string }
  await clearSessionToken(body.token ?? "")
  return NextResponse.json({ ok: true })
}
