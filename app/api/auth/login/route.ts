import { NextResponse } from "next/server"
import { authenticateUserFromDb } from "@/lib/db-auth"

export async function POST(request: Request) {
  const body = (await request.json()) as {
    organization?: string
    userId?: string
    password?: string
  }

  const result = await authenticateUserFromDb(body.organization ?? "", body.userId ?? "", body.password ?? "")
  if (!result) {
    return NextResponse.json({ error: "Invalid organization, User ID, or Password." }, { status: 401 })
  }

  return NextResponse.json(result)
}
