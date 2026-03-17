"use client"

import { useEffect, useState } from "react"
import {
  ORGANIZATION_EVENT_NAME,
  type OrganizationConfig,
  getOrganizations,
  resetOrganizations,
  storeOrganizations,
} from "@/lib/auth"

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<OrganizationConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const syncOrganizations = () => {
      setOrganizations(getOrganizations())
      setIsLoading(false)
    }

    syncOrganizations()
    window.addEventListener("storage", syncOrganizations)
    window.addEventListener(ORGANIZATION_EVENT_NAME, syncOrganizations)

    return () => {
      window.removeEventListener("storage", syncOrganizations)
      window.removeEventListener(ORGANIZATION_EVENT_NAME, syncOrganizations)
    }
  }, [])

  return {
    organizations,
    isLoading,
    saveOrganizations: storeOrganizations,
    resetOrganizations,
  }
}
