"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable, KpiCard, PageHeader } from "@/components/tms-ui"
import { useAuth } from "@/hooks/use-auth"
import { useVehicleAssignments } from "@/hooks/use-vehicle-assignments"
import { orders } from "@/lib/mock-data"
import { ClipboardList, ShieldCheck, Truck } from "lucide-react"

export default function VehicleAssignmentPage() {
  const router = useRouter()
  const { session } = useAuth()
  const { assignments, isLoading } = useVehicleAssignments()

  const canAssignVehicle = Boolean(
    session &&
    (
      session.roles.includes("admin") ||
      session.roles.includes("head-office") ||
      session.roles.includes("vehicle-assignment")
    )
  )
  const scopedAssignments = session
    ? assignments.filter((assignment) => assignment.organization === session.organization)
    : assignments

  const deliveryTableData = orders.map((order) => {
    const assignedRecord = scopedAssignments.find((assignment) => assignment.deliveryId === order.id)

    return {
      DeliveryID: order.id,
      Customer: order.customer,
      Route: `${order.source} -> ${order.destination}`,
      Quantity: order.weight,
      Status: order.status,
      TruckStatus: assignedRecord ? `${assignedRecord.assignedVehicleId} assigned` : "Not Assigned",
      ActionLabel: assignedRecord ? "Reassign Truck" : "Assign Truck",
    }
  })

  const assignedTableData = scopedAssignments.map((assignment) => ({
    DeliveryID: assignment.deliveryId,
    Customer: assignment.customer,
    Route: `${assignment.source} -> ${assignment.destination}`,
    Quantity: `${assignment.quantityKg.toLocaleString()} kg`,
    AssignedTruck: `${assignment.assignedVehicleId} (${assignment.assignedVehicleType})`,
    AssignedBy: assignment.assignedBy,
  }))

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        Loading vehicle assignments...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicle Assignment"
        description="See all deliveries first. Click Assign Truck in the last column to open the truck assignment screen."
      />

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-sm font-medium text-card-foreground">
          {canAssignVehicle ? "Transport Manager access" : "Viewer access"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {canAssignVehicle
            ? "Open any delivery and assign a truck based on quantity and route details."
            : "Gate Pass and other viewers can check which truck is already assigned for each delivery."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <button
          type="button"
          onClick={() => router.push("/vehicleassignment/deliveries")}
          className="rounded-xl text-left transition-transform hover:-translate-y-0.5"
        >
          <KpiCard
            label="Total Deliveries"
            value={orders.length}
            icon={<ClipboardList className="h-5 w-5" />}
            className="cursor-pointer border-sky-200 hover:border-sky-300"
          />
        </button>
        <button
          type="button"
          onClick={() => router.push("/vehicleassignment/assigned")}
          className="rounded-xl text-left transition-transform hover:-translate-y-0.5"
        >
          <KpiCard
            label="Assigned Deliveries"
            value={scopedAssignments.length}
            icon={<Truck className="h-5 w-5" />}
            className="cursor-pointer border-sky-200 hover:border-sky-300"
          />
        </button>
        <button
          type="button"
          onClick={() => router.push("/vehicleassignment/gate-view")}
          className="rounded-xl text-left transition-transform hover:-translate-y-0.5"
        >
          <KpiCard
            label="Visible To Gate/HO"
            value={scopedAssignments.length}
            icon={<ShieldCheck className="h-5 w-5" />}
            className="cursor-pointer border-sky-200 hover:border-sky-300"
          />
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-card-foreground">Delivery List</h2>
          <p className="text-sm text-muted-foreground">
            Use the last column button to open the assign truck screen for that delivery.
          </p>
        </div>

        <DataTable
          columns={["DeliveryID", "Customer", "Route", "Quantity", "Status", "TruckStatus"]}
          data={deliveryTableData}
          actions={
            canAssignVehicle
              ? [
                  {
                    label: "Assign Truck",
                    onClick: (row) => router.push(`/vehicleassignment/assign/${String(row.DeliveryID)}`),
                  },
                ]
              : undefined
          }
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">Assigned Truck Details</h2>
            <p className="text-sm text-muted-foreground">
              Gate Pass and Head Office can see which truck is assigned for each delivery.
            </p>
          </div>
        </div>

        <DataTable
          columns={["DeliveryID", "Customer", "Route", "Quantity", "AssignedTruck", "AssignedBy"]}
          data={assignedTableData}
        />
      </div>
    </div>
  )
}
