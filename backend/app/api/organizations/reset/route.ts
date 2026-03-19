import { NextResponse } from "next/server"
import { resetOrganizationsInDb } from "@/lib/db-auth"

export async function POST() {
  const organizations = await resetOrganizationsInDb()
  return NextResponse.json({ organizations })
}
