"use client"

import { useCallback, useEffect, useState } from "react"

export interface FleetVehicle {
  id: string
  type: string
  capacity: string
  location: string
  lastService: string
  status: string
}

export function useFleet() {
  const [fleet, setFleet] = useState<FleetVehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const syncFleet = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/fleet", { cache: "no-store" })
      if (!response.ok) throw new Error("Network error fetching fleet")
      const data = await response.json()
      setFleet(data.fleet ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void syncFleet()
  }, [syncFleet])

  return { fleet, isLoading, refreshFleet: syncFleet }
}
