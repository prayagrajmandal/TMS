"use client"

import { useEffect, useState } from "react"
import {
  type DemoUser,
  ORGANIZATION_EVENT_NAME,
  USER_DIRECTORY_EVENT_NAME,
  getUserDirectory,
  resetUserDirectory,
  storeUserDirectory,
} from "@/lib/auth"

export function useUserDirectory() {
  const [users, setUsers] = useState<DemoUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const syncUsers = () => {
      setUsers(getUserDirectory())
      setIsLoading(false)
    }

    syncUsers()
    window.addEventListener("storage", syncUsers)
    window.addEventListener(USER_DIRECTORY_EVENT_NAME, syncUsers)
    window.addEventListener(ORGANIZATION_EVENT_NAME, syncUsers)

    return () => {
      window.removeEventListener("storage", syncUsers)
      window.removeEventListener(USER_DIRECTORY_EVENT_NAME, syncUsers)
      window.removeEventListener(ORGANIZATION_EVENT_NAME, syncUsers)
    }
  }, [])

  return {
    users,
    isLoading,
    saveUsers: storeUserDirectory,
    resetUsers: resetUserDirectory,
  }
}
