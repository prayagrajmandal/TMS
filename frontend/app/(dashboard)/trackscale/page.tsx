"use client"

import { useMemo, useState } from "react"
import { PageHeader, KpiCard, StatusBadge } from "@/components/tms-ui"
import { useWeighments } from "@/hooks/use-weighments"
import { ArrowDownToLine, ArrowUpFromLine, Plus, Weight } from "lucide-react"

function NewWeighmentModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (payload: { vehicleId: string; type: string; grossWeight: number; tareWeight: number; material: string }) => void }) {
  const [form, setForm] = useState({
    vehicleId: "VH-101",
    type: "Inward",
    grossWeight: "",
    tareWeight: "",
    material: "",
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-card-foreground">New Weighment Entry</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-card-foreground">&times;</button>
        </div>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            onSave({
              vehicleId: form.vehicleId,
              type: form.type,
              grossWeight: Number(form.grossWeight || 0),
              tareWeight: Number(form.tareWeight || 0),
              material: form.material,
            })
            setForm({ vehicleId: "VH-101", type: "Inward", grossWeight: "", tareWeight: "", material: "" })
            onClose()
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">Vehicle ID</label>
              <input value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground">
                <option>Inward</option>
                <option>Outward</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">Gross Weight (kg)</label>
              <input type="number" value={form.grossWeight} onChange={(e) => setForm({ ...form, grossWeight: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">Tare Weight (kg)</label>
              <input type="number" value={form.tareWeight} onChange={(e) => setForm({ ...form, tareWeight: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">Material</label>
            <input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground hover:bg-muted">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Record Weighment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TrackScalePage() {
  const { weighments, createWeighment } = useWeighments()
  const [showModal, setShowModal] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>("All")

  const filteredWeighments = typeFilter === "All" ? weighments : weighments.filter((w) => w.type === typeFilter)
  const todayWeighments = weighments.length
  const totalInward = weighments.filter((item) => item.type === "Inward").reduce((sum, item) => sum + Number(item.netWeight.replace(/[^\d.]/g, "")), 0)
  const totalOutward = weighments.filter((item) => item.type === "Outward").reduce((sum, item) => sum + Number(item.netWeight.replace(/[^\d.]/g, "")), 0)

  const vehiclesInYard = useMemo(
    () => new Set(weighments.filter((item) => item.status !== "Completed").map((item) => item.vehicle)).size,
    [weighments]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Track Scale Dashboard"
        description="Weighbridge operations and vehicle weighment tracking"
        actions={
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Weighment
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Today's Weighments" value={todayWeighments} icon={<Weight className="h-5 w-5" />} />
        <KpiCard label="Total Inward Weight" value={`${totalInward.toLocaleString("en-IN")} kg`} icon={<ArrowDownToLine className="h-5 w-5" />} />
        <KpiCard label="Total Outward Weight" value={`${totalOutward.toLocaleString("en-IN")} kg`} icon={<ArrowUpFromLine className="h-5 w-5" />} />
        <KpiCard label="Vehicles in Yard" value={vehiclesInYard} icon={<Weight className="h-5 w-5" />} />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-foreground">Recent Weighments</h3>
          <div className="flex items-center gap-2">
            {["All", "Inward", "Outward"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  typeFilter === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["ID", "Vehicle", "Type", "Gross Wt", "Tare Wt", "Net Wt", "Material", "Time", "Status"].map((label) => (
                  <th key={label} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredWeighments.map((w) => (
                <tr key={w.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-card-foreground">{w.id}</td>
                  <td className="px-4 py-3 text-card-foreground">{w.vehicle}</td>
                  <td className="px-4 py-3 text-card-foreground">{w.type}</td>
                  <td className="px-4 py-3 text-card-foreground">{w.grossWeight}</td>
                  <td className="px-4 py-3 text-card-foreground">{w.tareWeight}</td>
                  <td className="px-4 py-3 font-semibold text-card-foreground">{w.netWeight}</td>
                  <td className="px-4 py-3 text-card-foreground">{w.material}</td>
                  <td className="px-4 py-3 text-muted-foreground">{w.time}</td>
                  <td className="px-4 py-3"><StatusBadge status={w.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <NewWeighmentModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={(payload) => void createWeighment(payload)}
      />
    </div>
  )
}
