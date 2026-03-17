"use client"

import { useState } from "react"
import { PageHeader, DataTable } from "@/components/tms-ui"
import { vehicleDriverVehicles } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Plus, Car, X, CheckCircle } from "lucide-react"

const vehicleTypeOptions = ["Truck", "Bus", "Office Pickup", "Drop Car", "Mini Truck", "Container"]
const ownershipOptions = ["Own Vehicle", "3rd Party Vehicle"]

interface FormData {
  vehicleType: string
  ownership: string
  vehicleNumber: string
  capacity: string
}

const emptyForm: FormData = {
  vehicleType: "",
  ownership: "",
  vehicleNumber: "",
  capacity: "",
}

export default function VehicleDriverPage() {
  const [activeTab, setActiveTab] = useState<"input" | "display">("display")
  const [form, setForm] = useState<FormData>(emptyForm)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSuccess(true)
    setForm(emptyForm)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicle"
        description="Manage vehicle master data"
        actions={
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setActiveTab("input")}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Button>
        }
      />

      {/* Sub-Tab Switcher */}
      <div className="flex gap-1 rounded-lg border border-border bg-card p-1 shadow-sm w-fit">
        <button
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "display"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          onClick={() => setActiveTab("display")}
        >
          <Car className="h-4 w-4" />
          Display
        </button>
        <button
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "input"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          onClick={() => setActiveTab("input")}
        >
          <Plus className="h-4 w-4" />
          Data Input
        </button>
      </div>

      {/* Display Tab */}
      {activeTab === "display" && (
        <div className="space-y-6">
          {/* Vehicle List */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Vehicle List</h2>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {vehicleDriverVehicles.length}
              </span>
            </div>
            <DataTable
              columns={["VehicleID", "VehicleNumber", "VehicleType", "Ownership", "Capacity", "Status"]}
              data={vehicleDriverVehicles}
              actions={[
                { label: "Edit", onClick: () => {} },
              ]}
            />
          </div>

        </div>
      )}

      {/* Data Input Tab */}
      {activeTab === "input" && (
        <div className="mx-auto max-w-2xl">
          {/* Success Toast */}
          {showSuccess && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-[#059669]">
              <CheckCircle className="h-5 w-5" />
              Vehicle details submitted successfully!
              <button onClick={() => setShowSuccess(false)} className="ml-auto">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-semibold text-card-foreground">
              Add Vehicle Details
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Fill in the details below to register a new vehicle.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Vehicle Type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-card-foreground">
                  Vehicle Type <span className="text-destructive">*</span>
                </label>
                <select
                  value={form.vehicleType}
                  onChange={e => setForm({ ...form, vehicleType: e.target.value })}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select vehicle type</option>
                  {vehicleTypeOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Ownership Type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-card-foreground">
                  Ownership Type <span className="text-destructive">*</span>
                </label>
                <select
                  value={form.ownership}
                  onChange={e => setForm({ ...form, ownership: e.target.value })}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select ownership type</option>
                  {ownershipOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Vehicle Number */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-card-foreground">
                  Vehicle Number <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={form.vehicleNumber}
                  onChange={e => setForm({ ...form, vehicleNumber: e.target.value })}
                  required
                  placeholder="e.g. MH-04-AB-1234"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Vehicle Capacity */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-card-foreground">
                  Vehicle Capacity (Ton) <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  value={form.capacity}
                  onChange={e => setForm({ ...form, capacity: e.target.value })}
                  required
                  min={0}
                  step={0.5}
                  placeholder="e.g. 15"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Submit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setForm(emptyForm)
                    setActiveTab("display")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
