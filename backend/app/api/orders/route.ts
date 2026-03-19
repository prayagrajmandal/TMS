import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function capitalizeStatus(status: string | null) {
  if (!status) return "Pending"
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

export async function GET() {
  try {
    const dbOrders = await prisma.orders.findMany({
      include: { customers: true },
      orderBy: { order_date: "asc" }, // Original seed order seems sequential
    })

    const mappedOrders = dbOrders.map((o) => ({
      id: o.order_number ?? "UNKNOWN",
      customer: o.customers?.customer_name ?? "Unknown Customer",
      source: o.pickup_address ?? "Unknown",
      destination: o.drop_address ?? "Unknown",
      weight: o.total_weight ? `${o.total_weight.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ${o.unit || "kg"}` : "0 kg",
      volume: "Standard CBM", // Placeholder since DB schema lacks explicit volume right now
      status: capitalizeStatus(o.status),
      createdAt: o.order_date ? o.order_date.toISOString().split("T")[0] : "",
    }))

    return NextResponse.json({ orders: mappedOrders })
  } catch (error) {
    console.error("Failed to fetch orders from DB:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
