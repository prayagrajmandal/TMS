"use client"

import { useCallback, useEffect, useState } from "react"

export interface Order {
  id: string
  customer: string
  source: string
  destination: string
  weight: string
  volume: string
  status: string
  createdAt: string
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const syncOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/orders", { cache: "no-store" })
      if (!response.ok) throw new Error("Network response was not ok")
      const data = await response.json()
      setOrders(data.orders ?? [])
    } catch (e) {
      console.error("Failed to fetch orders:", e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void syncOrders()
  }, [syncOrders])

  return { orders, isLoading, refreshOrders: syncOrders }
}
