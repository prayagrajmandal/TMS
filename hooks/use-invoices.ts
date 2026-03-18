"use client"

import { useCallback, useEffect, useState } from "react"

export interface Invoice {
  id: string
  tripId: string
  customer: string
  amount: number
  status: string
  createdAt: string
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const syncInvoices = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/invoices", { cache: "no-store" })
      if (!response.ok) throw new Error("Network error fetching invoices")
      const data = await response.json()
      setInvoices(data.invoices ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void syncInvoices()
  }, [syncInvoices])

  return { invoices, isLoading, refreshInvoices: syncInvoices }
}
