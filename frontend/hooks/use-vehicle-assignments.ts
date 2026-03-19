"use client"

import { useCallback, useEffect, useState } from "react"
import { type VehicleAssignment } from "@/lib/vehicle-assignments"

export function useVehicleAssignments() {
  const [assignments, setAssignments] = useState<VehicleAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const syncAssignments = useCallback(async () => {
    const response = await fetch("/api/vehicle-assignments", { cache: "no-store" })
    const data = (await response.json()) as { assignments?: VehicleAssignment[] }
    setAssignments(data.assignments ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void syncAssignments()
  }, [syncAssignments])

  const saveAssignments = useCallback(async (nextAssignments: VehicleAssignment[]) => {
    const response = await fetch("/api/vehicle-assignments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ assignments: nextAssignments }),
    })
    const data = (await response.json()) as { assignments?: VehicleAssignment[] }
    setAssignments(data.assignments ?? [])
    setIsLoading(false)
  }, [])

  return {
    assignments,
    isLoading,
    saveAssignments,
    refreshAssignments: syncAssignments,
  }
}
