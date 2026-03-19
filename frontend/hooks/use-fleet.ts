"use client"

import { useCallback, useEffect, useState } from "react"

export interface FleetVehicle {
  id: string
  registrationNumber?: string
  ownership?: string
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

  const createVehicle = useCallback(async (vehicle: {
    vehicleId?: string
    vehicleType: string
    ownership: string
    vehicleNumber: string
    capacityTon: number
  }) => {
    const response = await fetch("/api/fleet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vehicle }),
    })
    if (!response.ok) throw new Error("Network error creating vehicle")
    const data = await response.json()
    setFleet(data.fleet ?? [])
  }, [])

  const updateVehicle = useCallback(async (vehicle: {
    vehicleId: string
    vehicleType: string
    ownership: string
    vehicleNumber: string
    capacityTon: number
  }) => {
    const response = await fetch("/api/fleet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vehicle }),
    })
    if (!response.ok) throw new Error("Network error updating vehicle")
    const data = await response.json()
    setFleet(data.fleet ?? [])
  }, [])

  const deleteVehicle = useCallback(async (vehicleId: string) => {
    const response = await fetch("/api/fleet", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vehicleId }),
    })
    if (!response.ok) throw new Error("Network error deleting vehicle")
    const data = await response.json()
    setFleet(data.fleet ?? [])
  }, [])

  return { fleet, isLoading, refreshFleet: syncFleet, createVehicle, updateVehicle, deleteVehicle }
}
