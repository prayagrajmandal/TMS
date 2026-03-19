"use client"

import { useCallback, useEffect, useState } from "react"

export interface TransportRoute {
  id: string
  routeName: string
  start: string
  end: string
  distanceKm: number
  estTime: string
  vehicleType: string
  viaPoints: string
  color: string
}

export function useRouteMaps() {
  const [routes, setRoutes] = useState<TransportRoute[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshRoutes = useCallback(async () => {
    const response = await fetch("/api/routes-map", { cache: "no-store" })
    const data = (await response.json()) as { routes?: TransportRoute[] }
    setRoutes(data.routes ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void refreshRoutes()
  }, [refreshRoutes])

  const createRoute = useCallback(async (route: Omit<TransportRoute, "id" | "color">) => {
    const response = await fetch("/api/routes-map", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ route }),
    })
    const data = (await response.json()) as { routes?: TransportRoute[] }
    setRoutes(data.routes ?? [])
  }, [])

  return { routes, isLoading, createRoute, refreshRoutes }
}
