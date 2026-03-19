"use client"

import { useCallback, useEffect, useState } from "react"

export interface AppSettings {
  companyName: string
  contactEmail: string
  googleMapsKey: string
  gpsProvider: string
}

const defaultSettings: AppSettings = {
  companyName: "NextGen Logistics Pvt. Ltd.",
  contactEmail: "ops@nextgenlogistics.in",
  googleMapsKey: "",
  gpsProvider: "JioGPS",
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSettings = useCallback(async () => {
    const response = await fetch("/api/settings", { cache: "no-store" })
    const data = (await response.json()) as { settings?: AppSettings }
    setSettings(data.settings ?? defaultSettings)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void refreshSettings()
  }, [refreshSettings])

  const saveSettings = useCallback(async (nextSettings: AppSettings) => {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ settings: nextSettings }),
    })
    const data = (await response.json()) as { settings?: AppSettings }
    setSettings(data.settings ?? defaultSettings)
  }, [])

  return { settings, isLoading, saveSettings, refreshSettings }
}
