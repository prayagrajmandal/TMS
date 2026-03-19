"use client"

import { useCallback, useEffect, useState } from "react"
import { ORGANIZATION_EVENT_NAME, type OrganizationConfig } from "@/lib/auth"

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<OrganizationConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const syncOrganizations = useCallback(async () => {
    const response = await fetch("/api/organizations", { cache: "no-store" })
    const data = (await response.json()) as { organizations?: OrganizationConfig[] }
    setOrganizations(data.organizations ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void syncOrganizations()
    window.addEventListener(ORGANIZATION_EVENT_NAME, syncOrganizations)

    return () => {
      window.removeEventListener(ORGANIZATION_EVENT_NAME, syncOrganizations)
    }
  }, [syncOrganizations])

  const saveOrganizations = useCallback(async (nextOrganizations: OrganizationConfig[]) => {
    const response = await fetch("/api/organizations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ organizations: nextOrganizations }),
    })
    const data = (await response.json()) as { organizations?: OrganizationConfig[] }
    setOrganizations(data.organizations ?? [])
    window.dispatchEvent(new Event(ORGANIZATION_EVENT_NAME))
  }, [])

  const resetOrganizations = useCallback(async () => {
    const response = await fetch("/api/organizations/reset", {
      method: "POST",
    })
    const data = (await response.json()) as { organizations?: OrganizationConfig[] }
    setOrganizations(data.organizations ?? [])
    window.dispatchEvent(new Event(ORGANIZATION_EVENT_NAME))
  }, [])

  const deleteOrganization = useCallback(async (organizationName: string) => {
    const response = await fetch("/api/organizations", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ organizationName }),
    })
    const data = (await response.json()) as { organizations?: OrganizationConfig[] }
    setOrganizations(data.organizations ?? [])
    window.dispatchEvent(new Event(ORGANIZATION_EVENT_NAME))
  }, [])

  return {
    organizations,
    isLoading,
    saveOrganizations,
    resetOrganizations,
    deleteOrganization,
    refreshOrganizations: syncOrganizations,
  }
}
