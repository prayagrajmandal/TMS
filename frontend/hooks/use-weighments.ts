"use client"

import { useCallback, useEffect, useState } from "react"

export interface Weighment {
  id: string
  vehicle: string
  type: string
  grossWeight: string
  tareWeight: string
  netWeight: string
  material: string
  time: string
  status: string
}

export function useWeighments() {
  const [weighments, setWeighments] = useState<Weighment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshWeighments = useCallback(async () => {
    const response = await fetch("/api/weighments", { cache: "no-store" })
    const data = (await response.json()) as { weighments?: Weighment[] }
    setWeighments(data.weighments ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void refreshWeighments()
  }, [refreshWeighments])

  const createWeighment = useCallback(async (weighment: {
    vehicleId: string
    type: string
    grossWeight: number
    tareWeight: number
    material: string
  }) => {
    const response = await fetch("/api/weighments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ weighment }),
    })
    const data = (await response.json()) as { weighments?: Weighment[] }
    setWeighments(data.weighments ?? [])
  }, [])

  return { weighments, isLoading, createWeighment, refreshWeighments }
}
