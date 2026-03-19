import { NextResponse } from "next/server"
import type { DemoUser } from "@/lib/auth"
import { deleteUserInDb, getUsersFromDb, saveUsersToDb } from "@/lib/db-auth"

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

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { organization?: string; userId?: string }
    const users = await deleteUserInDb(body.organization ?? "", body.userId ?? "")
    return NextResponse.json({ users })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete user" }, { status: 400 })
  }
}
