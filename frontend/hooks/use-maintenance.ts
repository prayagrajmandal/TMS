"use client"

import { useCallback, useEffect, useState } from "react"

export interface MaintenanceEntry {
  id: string
  vehicleId: string
  vehicleNumber: string
  maintenanceType: string
  serviceDate: string
  nextDueDate: string
  cost: string
  workshop: string
  notes: string
}

export function useMaintenance() {
  const [entries, setEntries] = useState<MaintenanceEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshEntries = useCallback(async () => {
    const response = await fetch("/api/maintenance", { cache: "no-store" })
    const data = (await response.json()) as { entries?: MaintenanceEntry[] }
    setEntries(data.entries ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void refreshEntries()
  }, [refreshEntries])

  const createEntry = useCallback(async (entry: {
    vehicleId: string
    vehicleNumber: string
    maintenanceType: string
    serviceDate: string
    nextDueDate: string
    serviceCost: number
    workshop: string
    notes: string
  }) => {
    const response = await fetch("/api/maintenance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ entry }),
    })
    const data = (await response.json()) as { entries?: MaintenanceEntry[] }
    setEntries(data.entries ?? [])
  }, [])

  return { entries, isLoading, createEntry, refreshEntries }
}
