"use client"

import { useCallback, useEffect, useState } from "react"
import { type DemoUser, USER_DIRECTORY_EVENT_NAME } from "@/lib/auth"

export function useUserDirectory() {
  const [users, setUsers] = useState<DemoUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const syncUsers = useCallback(async () => {
    const response = await fetch("/api/users", { cache: "no-store" })
    const data = (await response.json()) as { users?: DemoUser[] }
    setUsers(data.users ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void syncUsers()
    window.addEventListener(USER_DIRECTORY_EVENT_NAME, syncUsers)

    return () => {
      window.removeEventListener(USER_DIRECTORY_EVENT_NAME, syncUsers)
    }
  }, [syncUsers])

  const saveUsers = useCallback(async (nextUsers: DemoUser[]) => {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ users: nextUsers }),
    })
    const data = (await response.json()) as { users?: DemoUser[] }
    setUsers(data.users ?? [])
    window.dispatchEvent(new Event(USER_DIRECTORY_EVENT_NAME))
  }, [])

  const resetUsers = useCallback(async () => {
    const response = await fetch("/api/users/reset", {
      method: "POST",
    })
    const data = (await response.json()) as { users?: DemoUser[] }
    setUsers(data.users ?? [])
    window.dispatchEvent(new Event(USER_DIRECTORY_EVENT_NAME))
  }, [])

  return {
    users,
    isLoading,
    saveUsers,
    resetUsers,
    refreshUsers: syncUsers,
  }
}
