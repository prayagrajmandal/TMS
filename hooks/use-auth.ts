"use client"

import { useCallback, useEffect, useState } from "react"
import {
  AUTH_EVENT_NAME,
  clearStoredSessionToken,
  getStoredSessionToken,
  type AuthSession,
} from "@/lib/auth"

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const syncSession = useCallback(async () => {
    const token = getStoredSessionToken()
    if (!token) {
      setSession(null)
      setIsLoading(false)
      return
    }

    const response = await fetch(`/api/auth/session?token=${encodeURIComponent(token)}`, {
      cache: "no-store",
    })

    if (!response.ok) {
      clearStoredSessionToken()
      setSession(null)
      setIsLoading(false)
      return
    }

    const data = (await response.json()) as { session?: AuthSession | null }
    setSession(data.session ?? null)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void syncSession()
    window.addEventListener(AUTH_EVENT_NAME, syncSession)

    return () => {
      window.removeEventListener(AUTH_EVENT_NAME, syncSession)
    }
  }, [syncSession])

  const logout = useCallback(() => {
    const token = getStoredSessionToken()
    clearStoredSessionToken()
    setSession(null)
    setIsLoading(false)

    if (token) {
      void fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })
    }
  }, [])

  return {
    session,
    isLoading,
    logout,
    refreshSession: syncSession,
  }
}
