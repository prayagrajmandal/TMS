"use client"

import { useCallback, useEffect, useState } from "react"

export interface GatePass {
  id: string
  vehicle: string
  driver: string
  purpose: string
  requestedBy: string
  approvalStatus: string
  time: string
}

export function useGatePasses() {
  const [gatePasses, setGatePasses] = useState<GatePass[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const syncGatePasses = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/gatepasses", { cache: "no-store" })
      if (!response.ok) throw new Error("Network error fetching gatepasses")
      const data = await response.json()
      setGatePasses(data.gatePasses ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void syncGatePasses()
  }, [syncGatePasses])

  return { gatePasses, isLoading, refreshGatePasses: syncGatePasses }
}
