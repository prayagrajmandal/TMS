"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable, PageHeader } from "@/components/tms-ui"
import { orders } from "@/lib/mock-data"
import { ArrowLeft } from "lucide-react"

export default function VehicleAssignmentDeliveriesPage() {
  const router = useRouter()

  const deliveryTableData = orders.map((order) => ({
    DeliveryID: order.id,
    Customer: order.customer,
    Route: `${order.source} -> ${order.destination}`,
    Quantity: order.weight,
    Status: order.status,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Total Deliveries"
        description="All delivery records from the Vehicle Assignment dashboard card."
        actions={
          <Button variant="outline" onClick={() => router.push("/vehicleassignment")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      <DataTable
        columns={["DeliveryID", "Customer", "Route", "Quantity", "Status"]}
        data={deliveryTableData}
      />
    </div>
  )
}
