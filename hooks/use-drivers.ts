"use client"

import { useCallback, useEffect, useState } from "react"

export interface Driver {
  id: string
  name: string
  phone: string
  license: string
  tripsToday: number
  rating: number
  status: string
}

export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const syncDrivers = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/drivers", { cache: "no-store" })
      if (!response.ok) throw new Error("Network error fetching drivers")
      const data = await response.json()
      setDrivers(data.drivers ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void syncDrivers()
  }, [syncDrivers])

  return { drivers, isLoading, refreshDrivers: syncDrivers }
}
