import { NextResponse } from "next/server"
import type { OrganizationConfig } from "@/lib/auth"
import { getOrganizationsFromDb, saveOrganizationsToDb } from "@/lib/db-auth"

export async function GET() {
  const organizations = await getOrganizationsFromDb()
  return NextResponse.json({ organizations })
}

export async function POST(request: Request) {
  const body = (await request.json()) as { organizations?: OrganizationConfig[] }
  const organizations = Array.isArray(body.organizations) ? body.organizations : []
  const nextOrganizations = await saveOrganizationsToDb(organizations)

  return NextResponse.json({ organizations: nextOrganizations })
}
