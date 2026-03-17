"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable, PageHeader } from "@/components/tms-ui"
import { gatePasses } from "@/lib/mock-data"
import { ArrowLeft } from "lucide-react"

export default function GatePassPendingPage() {
  const router = useRouter()

  const pendingGatePasses = gatePasses
    .filter((gatePass) => gatePass.approvalStatus === "Pending")
    .map((gatePass) => ({
      GatePassID: gatePass.id,
      Vehicle: gatePass.vehicle,
      Driver: gatePass.driver,
      Purpose: gatePass.purpose,
      RequestedBy: gatePass.requestedBy,
      ApprovalStatus: gatePass.approvalStatus,
      Time: gatePass.time,
    }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending Approvals"
        description="Pending gate pass approvals from the Gate Pass dashboard card"
        actions={
          <Button variant="outline" onClick={() => router.push("/gatepass")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      <DataTable
        columns={["GatePassID", "Vehicle", "Driver", "Purpose", "RequestedBy", "ApprovalStatus", "Time"]}
        data={pendingGatePasses}
      />
    </div>
  )
}
