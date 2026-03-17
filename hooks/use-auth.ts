"use client"

import { useEffect, useState } from "react"
import {
  AUTH_EVENT_NAME,
  ORGANIZATION_EVENT_NAME,
  USER_DIRECTORY_EVENT_NAME,
  type AuthSession,
  clearStoredSession,
  getStoredSession,
  getUserDirectory,
  storeSession,
} from "@/lib/auth"

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const syncSession = () => {
      const currentSession = getStoredSession()
      if (currentSession) {
        const matchingUser = getUserDirectory().find((user) => user.userId === currentSession.userId)
        if (matchingUser) {
          const nextSession = {
            userId: matchingUser.userId,
            name: matchingUser.name,
            roles: matchingUser.roles,
            accessRoutes: matchingUser.accessRoutes,
            organization: matchingUser.organization,
          }
          storeSession(nextSession)
          setSession(nextSession)
        } else {
          setSession(currentSession)
        }
      } else {
        setSession(null)
      }
      setIsLoading(false)
    }

    syncSession()
    window.addEventListener("storage", syncSession)
    window.addEventListener(AUTH_EVENT_NAME, syncSession)
    window.addEventListener(USER_DIRECTORY_EVENT_NAME, syncSession)
    window.addEventListener(ORGANIZATION_EVENT_NAME, syncSession)

    return () => {
      window.removeEventListener("storage", syncSession)
      window.removeEventListener(AUTH_EVENT_NAME, syncSession)
      window.removeEventListener(USER_DIRECTORY_EVENT_NAME, syncSession)
      window.removeEventListener(ORGANIZATION_EVENT_NAME, syncSession)
    }
  }, [])

  return {
    session,
    isLoading,
    logout: clearStoredSession,
  }
}
