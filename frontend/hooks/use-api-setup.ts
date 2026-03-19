"use client"

import { useCallback, useEffect, useState } from "react"

export interface ApiSetup {
  provider: string
  baseUrl: string
  authType: string
  clientId: string
  clientSecret: string
  orderEndpoint: string
  syncMethod: string
  orderIdField: string
  customerField: string
  sourceField: string
  destinationField: string
  weightField: string
  volumeField: string
  status: "Draft" | "Connected"
}

const defaultSetup: ApiSetup = {
  provider: "SAP S/4HANA",
  baseUrl: "https://sap-pro.company.com/api",
  authType: "Bearer Token",
  clientId: "nextgen-tms",
  clientSecret: "",
  orderEndpoint: "/orders/open",
  syncMethod: "Pull every 15 minutes",
  orderIdField: "VBELN",
  customerField: "KUNNR",
  sourceField: "WERKS_FROM",
  destinationField: "WERKS_TO",
  weightField: "BRGEW",
  volumeField: "VOLUM",
  status: "Draft",
}

export function useApiSetup() {
  const [setup, setSetup] = useState<ApiSetup>(defaultSetup)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSetup = useCallback(async () => {
    const response = await fetch("/api/api-setup", { cache: "no-store" })
    const data = (await response.json()) as { setup?: ApiSetup }
    setSetup(data.setup ?? defaultSetup)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void refreshSetup()
  }, [refreshSetup])

  const saveSetup = useCallback(async (nextSetup: ApiSetup) => {
    const response = await fetch("/api/api-setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ setup: nextSetup }),
    })
    const data = (await response.json()) as { setup?: ApiSetup }
    setSetup(data.setup ?? defaultSetup)
  }, [])

  return { setup, isLoading, saveSetup, refreshSetup }
}
