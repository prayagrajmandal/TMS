import { NextResponse } from "next/server"
import { resetUsersInDb } from "@/lib/db-auth"

export async function POST() {
  const users = await resetUsersInDb()
  return NextResponse.json({ users })
}
