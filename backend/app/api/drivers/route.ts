import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function capitalizeStatus(status: string | null) {
  if (!status) return "Available"
  const s = status.toLowerCase()
  if (s === "on trip") return "On Trip"
  if (s === "on break") return "On Break"
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export async function GET() {
  try {
    const dbDrivers = await prisma.drivers.findMany({
      orderBy: { driver_code: "asc" },
    })

    const drivers = dbDrivers.map(d => ({
      id: d.driver_code || "Unknown",
      name: d.driver_name || "Unknown Driver",
      phone: d.phone || "N/A",
      license: d.license_number || "N/A",
      tripsToday: 0, // Placeholder until schema supports trip counting
      rating: 5.0, // Placeholder
      status: capitalizeStatus(d.status),
    }))

    return NextResponse.json({ drivers })
  } catch (error) {
    console.error("Failed to fetch drivers from DB:", error)
    return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      driver?: {
        driverId?: string
        name: string
        phone: string
        license: string
        email?: string
        status?: string
        organization?: string
      }
    }

    if (!body.driver) {
      return NextResponse.json({ error: "Driver is required" }, { status: 400 })
    }

    const organization = body.driver.organization
      ? await prisma.organizations.findFirst({
          where: {
            name: {
              equals: body.driver.organization,
              mode: "insensitive",
            },
          },
          select: { id: true },
        })
      : null

    if (body.driver.driverId) {
      const existing = await prisma.drivers.findFirst({
        where: {
          driver_code: body.driver.driverId,
        },
        select: { id: true, organization_id: true },
      })

      if (!existing) {
        return NextResponse.json({ error: "Driver not found" }, { status: 404 })
      }

      await prisma.drivers.update({
        where: { id: existing.id },
        data: {
          organization_id: organization?.id ?? existing.organization_id ?? null,
          driver_name: body.driver.name,
          phone: body.driver.phone,
          email: body.driver.email || null,
          license_number: body.driver.license,
          status: (body.driver.status || "available").toLowerCase(),
        },
      })
    } else {
      const count = await prisma.drivers.count()
      const driverCode = `DRV-${401 + count}`

      await prisma.drivers.create({
        data: {
          organization_id: organization?.id ?? null,
          driver_code: driverCode,
          driver_name: body.driver.name,
          phone: body.driver.phone,
          email: body.driver.email || null,
          license_number: body.driver.license,
          status: (body.driver.status || "available").toLowerCase(),
        },
      })
    }

    return GET()
  } catch (error) {
    console.error("Failed to save driver:", error)
    return NextResponse.json({ error: "Failed to save driver" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as {
      driverId?: string
    }

    if (!body.driverId) {
      return NextResponse.json({ error: "Driver ID is required" }, { status: 400 })
    }

    const existing = await prisma.drivers.findFirst({
      where: {
        driver_code: body.driverId,
      },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 })
    }

    await prisma.drivers.delete({
      where: { id: existing.id },
    })

    return GET()
  } catch (error) {
    console.error("Failed to delete driver:", error)
    return NextResponse.json({ error: "Failed to delete driver" }, { status: 500 })
  }
}
