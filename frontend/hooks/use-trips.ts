"use client"

import { useCallback, useEffect, useState } from "react"

export interface ActiveTrip {
  id: string
  vehicle: string
  driver: string
  route: string
  eta: string
  status: string
}

export interface CompletedTrip {
  id: string
  vehicle: string
  driver: string
  distance: string
  completedAt: string
}

export function useTrips() {
  const [activeTrips, setActiveTrips] = useState<ActiveTrip[]>([])
  const [completedTrips, setCompletedTrips] = useState<CompletedTrip[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const syncTrips = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/trips", { cache: "no-store" })
      if (!response.ok) throw new Error("Network response was not ok")
      const data = await response.json()
      setActiveTrips(data.activeTrips ?? [])
      setCompletedTrips(data.completedTrips ?? [])
    } catch (e) {
      console.error("Failed to fetch trips:", e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void syncTrips()
  }, [syncTrips])

  return { activeTrips, completedTrips, isLoading, refreshTrips: syncTrips }
}
