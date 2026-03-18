import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function capitalize(s: string | null) {
  if (!s) return "Unknown"
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

export async function GET() {
  try {
    const dbInvoices = await prisma.invoices.findMany({
      include: { customers: true },
      orderBy: { created_at: "desc" },
    })

    const invoices = dbInvoices.map(inv => ({
      id: inv.invoice_number || "Unknown",
      tripId: "N/A", // DB lacks explicit trip linking
      customer: inv.customers?.customer_name || "Unknown Customer",
      amount: inv.total_amount ? Number(inv.total_amount) : 0,
      status: capitalize(inv.payment_status || "draft"),
      createdAt: inv.created_at ? inv.created_at.toISOString().split("T")[0] : "1970-01-01",
    }))

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error("Failed to fetch invoices from DB:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}
