import { NextResponse } from "next/server"
import type { DemoUser } from "@/lib/auth"
import { getUsersFromDb, saveUsersToDb } from "@/lib/db-auth"

export async function GET() {
  const users = await getUsersFromDb()
  return NextResponse.json({ users })
}

export async function POST(request: Request) {
  const body = (await request.json()) as { users?: DemoUser[] }
  const users = Array.isArray(body.users) ? body.users : []
  const nextUsers = await saveUsersToDb(users)

  return NextResponse.json({ users: nextUsers })
}
