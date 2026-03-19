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

  const createDriver = useCallback(async (driver: {
    name: string
    phone: string
    license: string
    email?: string
    status?: string
    organization?: string
  }) => {
    const response = await fetch("/api/drivers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ driver }),
    })
    if (!response.ok) throw new Error("Network error creating driver")
    const data = await response.json()
    setDrivers(data.drivers ?? [])
  }, [])

  const updateDriver = useCallback(async (driver: {
    driverId: string
    name: string
    phone: string
    license: string
    email?: string
    status?: string
    organization?: string
  }) => {
    const response = await fetch("/api/drivers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ driver }),
    })
    if (!response.ok) throw new Error("Network error updating driver")
    const data = await response.json()
    setDrivers(data.drivers ?? [])
  }, [])

  const deleteDriver = useCallback(async (driverId: string) => {
    const response = await fetch("/api/drivers", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ driverId }),
    })
    if (!response.ok) throw new Error("Network error deleting driver")
    const data = await response.json()
    setDrivers(data.drivers ?? [])
  }, [])

  return { drivers, isLoading, refreshDrivers: syncDrivers, createDriver, updateDriver, deleteDriver }
}
