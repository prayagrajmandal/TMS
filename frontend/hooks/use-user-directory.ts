"use client"

import { useCallback, useEffect, useState } from "react"
import { type DemoUser, USER_DIRECTORY_EVENT_NAME } from "@/lib/auth"
import { apiUrl } from "@/lib/api"

export function useUserDirectory() {
  const [users, setUsers] = useState<DemoUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const syncUsers = useCallback(async () => {
    try {
      setError("")
      const response = await fetch(apiUrl("/api/users"), { cache: "no-store" })
      if (!response.ok) {
        throw new Error(`Failed to load users (${response.status})`)
      }
      const data = (await response.json()) as { users?: DemoUser[] }
      setUsers(data.users ?? [])
    } catch (caughtError) {
      setUsers([])
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void syncUsers()
    window.addEventListener(USER_DIRECTORY_EVENT_NAME, syncUsers)

    return () => {
      window.removeEventListener(USER_DIRECTORY_EVENT_NAME, syncUsers)
    }
  }, [syncUsers])

  const saveUsers = useCallback(async (nextUsers: DemoUser[]) => {
    const response = await fetch(apiUrl("/api/users"), {
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
    const response = await fetch(apiUrl("/api/users/reset"), {
      method: "POST",
    })
    const data = (await response.json()) as { users?: DemoUser[] }
    setUsers(data.users ?? [])
    window.dispatchEvent(new Event(USER_DIRECTORY_EVENT_NAME))
  }, [])

  const deleteUser = useCallback(async (organization: string, userId: string) => {
    const response = await fetch(apiUrl("/api/users"), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ organization, userId }),
    })
    const data = (await response.json()) as { users?: DemoUser[] }
    setUsers(data.users ?? [])
    window.dispatchEvent(new Event(USER_DIRECTORY_EVENT_NAME))
  }, [])

  return {
    users,
    isLoading,
    error,
    saveUsers,
    resetUsers,
    deleteUser,
    refreshUsers: syncUsers,
  }
}
