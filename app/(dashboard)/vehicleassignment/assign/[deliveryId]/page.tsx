"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/tms-ui"
import { useAuth } from "@/hooks/use-auth"
import { useVehicleAssignments } from "@/hooks/use-vehicle-assignments"
import { orders } from "@/lib/mock-data"
import {
  getAvailableVehiclesForQuantity,
  getRecommendedTruckSize,
  parseCapacityKg,
} from "@/lib/vehicle-assignments"
import { ArrowLeft, Building2 } from "lucide-react"

function parseWeightToKg(weight: string) {
  const digits = weight.replace(/,/g, "").match(/\d+/)
  return digits ? Number(digits[0]) : 0
}

export default function VehicleAssignmentFormPage() {
  const params = useParams<{ deliveryId: string }>()
  const router = useRouter()
  const { session } = useAuth()
  const { assignments, isLoading, saveAssignments } = useVehicleAssignments()
  const [feedback, setFeedback] = useState("")

  const deliveryId = decodeURIComponent(params.deliveryId)
  const order = orders.find((item) => item.id === deliveryId)
  const existingAssignment = assignments.find((assignment) => assignment.deliveryId === deliveryId)

  const [formData, setFormData] = useState(() => ({
    deliveryId: order?.id ?? "",
    customer: order?.customer ?? "",
    source: order?.source ?? "",
    destination: order?.destination ?? "",
    quantityKg: String(existingAssignment?.quantityKg ?? parseWeightToKg(order?.weight ?? "")),
    loadType: existingAssignment?.loadType ?? "",
    vehicleId: existingAssignment?.assignedVehicleId ?? "",
    notes: existingAssignment?.notes ?? "",
  }))

  const canAssignVehicle = Boolean(session && (session.roles.includes("admin") || session.roles.includes("head-office")))
  const quantityKg = Number(formData.quantityKg || 0)
  const recommendedTruckSize = getRecommendedTruckSize(quantityKg || 1)
  const suggestedVehicles = useMemo(
    () => (quantityKg > 0 ? getAvailableVehiclesForQuantity(quantityKg) : []),
    [quantityKg]
  )
  const selectedVehicle =
    suggestedVehicles.find((vehicle) => vehicle.id === formData.vehicleId) ??
    suggestedVehicles[0] ??
    null

  const handleAssignVehicle = () => {
    if (!session || !canAssignVehicle || !order) {
      return
    }

    if (
      !formData.deliveryId.trim() ||
      !formData.customer.trim() ||
      !formData.source.trim() ||
      !formData.destination.trim() ||
      quantityKg <= 0 ||
      !formData.loadType.trim() ||
      !selectedVehicle
    ) {
      setFeedback("Please complete all delivery details before assigning a truck.")
      return
    }

    if (parseCapacityKg(selectedVehicle.capacity) < quantityKg) {
      setFeedback("The selected truck capacity is lower than the delivery quantity.")
      return
    }

    const nextAssignmentId = existingAssignment?.id ?? `VA-${100 + assignments.length + 1}`
    const nextAssignment = {
      id: nextAssignmentId,
      deliveryId: formData.deliveryId.trim().toUpperCase(),
      customer: formData.customer.trim(),
      source: formData.source.trim(),
      destination: formData.destination.trim(),
      quantityKg,
      loadType: formData.loadType.trim(),
      recommendedTruckSize,
      assignedVehicleId: selectedVehicle.id,
      assignedVehicleType: selectedVehicle.type,
      assignedVehicleCapacity: selectedVehicle.capacity,
      assignedBy: session.name,
      assignedByUserId: session.userId,
      organization: session.organization,
      createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      notes: formData.notes.trim() || "Shared with Gate Pass and Head Office for dispatch visibility.",
    }

    const remainingAssignments = assignments.filter((assignment) => assignment.deliveryId !== formData.deliveryId.trim().toUpperCase())
    saveAssignments([nextAssignment, ...remainingAssignments])
    router.push("/vehicleassignment")
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        Loading delivery details...
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Vehicle Assignment"
          description="Delivery not found."
          actions={
            <Button variant="outline" onClick={() => router.push("/vehicleassignment")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicle Assignment"
        description="Assign truck by delivery details"
        actions={
          <Button variant="outline" onClick={() => router.push("/vehicleassignment")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {feedback ? (
        <div className="rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-[#059669]">
          {feedback}
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-card-foreground">Assign Truck By Delivery Details</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-card-foreground">Delivery ID</label>
            <input
              value={formData.deliveryId}
              onChange={(event) => setFormData({ ...formData, deliveryId: event.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-card-foreground">Customer</label>
            <input
              value={formData.customer}
              onChange={(event) => setFormData({ ...formData, customer: event.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-card-foreground">Source</label>
            <input
              value={formData.source}
              onChange={(event) => setFormData({ ...formData, source: event.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-card-foreground">Destination</label>
            <input
              value={formData.destination}
              onChange={(event) => setFormData({ ...formData, destination: event.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-card-foreground">Quantity (kg)</label>
            <input
              type="number"
              min="1"
              value={formData.quantityKg}
              onChange={(event) => setFormData({ ...formData, quantityKg: event.target.value, vehicleId: "" })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-card-foreground">Delivery Type</label>
            <input
              value={formData.loadType}
              onChange={(event) => setFormData({ ...formData, loadType: event.target.value })}
              placeholder="Material / product"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-card-foreground">Suggested Truck Size</label>
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm font-medium text-sky-900">
              {formData.quantityKg ? recommendedTruckSize : "Enter quantity to get suggestion"}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-card-foreground">Assign Truck</label>
            <select
              value={formData.vehicleId}
              onChange={(event) => setFormData({ ...formData, vehicleId: event.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select truck</option>
              {suggestedVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.id} - {vehicle.type} - {vehicle.capacity}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <label className="mb-2 block text-sm font-medium text-card-foreground">Notes For Gate Pass / HO</label>
            <textarea
              value={formData.notes}
              onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
              rows={3}
              placeholder="Add dispatch note, special handling, or gate instruction"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
            <p className="text-sm font-semibold text-sky-950">Recommended truck details</p>
            {selectedVehicle ? (
              <div className="mt-3 space-y-2 text-sm text-sky-900">
                <p><span className="font-medium">Truck:</span> {selectedVehicle.id}</p>
                <p><span className="font-medium">Type:</span> {selectedVehicle.type}</p>
                <p><span className="font-medium">Capacity:</span> {selectedVehicle.capacity}</p>
                <p><span className="font-medium">Location:</span> {selectedVehicle.location}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-sky-900">
                Enter quantity to see the best truck choices for this delivery.
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleAssignVehicle}
            disabled={!canAssignVehicle}
          >
            Assign Truck
          </Button>
        </div>
      </div>
    </div>
  )
}
