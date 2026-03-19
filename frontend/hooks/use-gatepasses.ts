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

  const createGatePass = useCallback(async (gatePass: {
    vehicleId: string
    driverId: string
    purpose: string
    requestedBy: string
    expectedReturn: string
    approvalStatus: string
  }) => {
    const response = await fetch("/api/gatepasses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gatePass }),
    })
    if (!response.ok) throw new Error("Network error creating gate pass")
    const data = await response.json()
    setGatePasses(data.gatePasses ?? [])
  }, [])

  const updateGatePassStatus = useCallback(async (id: string, status: "Approved" | "Rejected") => {
    const response = await fetch("/api/gatepasses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        statusUpdate: {
          id,
          status,
        },
      }),
    })
    if (!response.ok) throw new Error("Network error updating gate pass")
    const data = await response.json()
    setGatePasses(data.gatePasses ?? [])
  }, [])

  return { gatePasses, isLoading, refreshGatePasses: syncGatePasses, createGatePass, updateGatePassStatus }
}
