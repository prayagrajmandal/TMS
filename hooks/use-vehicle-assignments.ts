"use client"

import { useEffect, useState } from "react"
import {
  type VehicleAssignment,
  VEHICLE_ASSIGNMENTS_EVENT_NAME,
  getVehicleAssignments,
  storeVehicleAssignments,
} from "@/lib/vehicle-assignments"

export function useVehicleAssignments() {
  const [assignments, setAssignments] = useState<VehicleAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const syncAssignments = () => {
      setAssignments(getVehicleAssignments())
      setIsLoading(false)
    }

    syncAssignments()
    window.addEventListener("storage", syncAssignments)
    window.addEventListener(VEHICLE_ASSIGNMENTS_EVENT_NAME, syncAssignments)

    return () => {
      window.removeEventListener("storage", syncAssignments)
      window.removeEventListener(VEHICLE_ASSIGNMENTS_EVENT_NAME, syncAssignments)
    }
  }, [])

  return {
    assignments,
    isLoading,
    saveAssignments: storeVehicleAssignments,
  }
}
