"use client"

import { useMemo, useState } from "react"
import { PageHeader } from "@/components/tms-ui"
import { Button } from "@/components/ui/button"
import { useOrganizations } from "@/hooks/use-organizations"
import { useUserDirectory } from "@/hooks/use-user-directory"
import { countUsersForOrganization, type OrganizationConfig } from "@/lib/auth"
import { Building2, RotateCcw, ShieldCheck, Users } from "lucide-react"

export default function SuperAdminPage() {
  const { organizations, isLoading, saveOrganizations, resetOrganizations } = useOrganizations()
  const { users, saveUsers } = useUserDirectory()
  const [selectedOrganization, setSelectedOrganization] = useState("Pro")
  const [form, setForm] = useState({ maxUsers: "5" })

  const organizationStats = useMemo(
    () =>
      organizations.map((organization) => ({
        ...organization,
        currentUsers: countUsersForOrganization(users, organization.name),
      })),
    [organizations, users]
  )

  const saveOrganization = () => {
    const normalizedName = selectedOrganization.trim()
    const maxUsers = Number(form.maxUsers)

    if (!normalizedName || maxUsers < 1) {
      return
    }

    const existing = organizations.find((item) => item.name.toLowerCase() === normalizedName.toLowerCase())
    const nextOrganizations: OrganizationConfig[] = existing
      ? organizations.map((item) => (item.name.toLowerCase() === normalizedName.toLowerCase() ? { ...item, maxUsers } : item))
      : [...organizations, { name: normalizedName, maxUsers }]

    saveOrganizations(nextOrganizations)
  }

  const handleOrganizationSelect = (value: string) => {
    setSelectedOrganization(value)

    const organization = organizations.find((item) => item.name === value)
    if (!organization) {
      return
    }

    setForm({
      maxUsers: String(organization.maxUsers),
    })
  }

  const trimUsersToLimit = (organizationName: string, maxUsers: number) => {
    const scopedUsers = users.filter((user) => user.organization === organizationName)
    if (scopedUsers.length <= maxUsers) {
      return
    }

    const protectedUsers = scopedUsers.filter((user) => user.roles.includes("admin"))
    const regularUsers = scopedUsers.filter((user) => !user.roles.includes("admin"))
    const allowedRegularCount = Math.max(maxUsers - protectedUsers.length, 0)
    const keptUserIds = new Set([
      ...protectedUsers.map((user) => user.userId),
      ...regularUsers.slice(0, allowedRegularCount).map((user) => user.userId),
    ])

    saveUsers(
      users.filter((user) => user.organization !== organizationName || keptUserIds.has(user.userId))
    )
  }

  if (isLoading) {
    return <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">Loading organizations...</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin"
        description="Assign organization quota and control how many users each organization can have"
        actions={
          <Button
            variant="outline"
            onClick={() => {
              resetOrganizations()
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Organizations
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">Select Organization</label>
              <select
                value={selectedOrganization}
                onChange={(e) => handleOrganizationSelect(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {organizations.map((organization) => (
                  <option key={organization.name} value={organization.name}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">Total Users Allowed</label>
              <input
                type="number"
                min={1}
                value={form.maxUsers}
                onChange={(e) => setForm({ ...form, maxUsers: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={saveOrganization}>
              Save Organization Quota
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-semibold text-card-foreground">How it works</p>
            <p className="mt-2 text-sm text-muted-foreground">
              If `Pro` gets `5` users, that count includes the organization admin. The Pro admin cannot create more than 5 total users.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {organizationStats.map((organization) => (
          <div key={organization.name} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-base font-semibold text-card-foreground">{organization.name}</p>
                <p className="text-sm text-muted-foreground">{organization.currentUsers} of {organization.maxUsers} users assigned</p>
              </div>
              <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Limit {organization.maxUsers}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg bg-muted/40 p-3">
                <Building2 className="mb-2 h-4 w-4 text-primary" />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Organization</p>
                <p className="text-sm font-medium text-card-foreground">{organization.name}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <Users className="mb-2 h-4 w-4 text-primary" />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Current Users</p>
                <p className="text-sm font-medium text-card-foreground">{organization.currentUsers}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <ShieldCheck className="mb-2 h-4 w-4 text-primary" />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Allowed Users</p>
                <p className="text-sm font-medium text-card-foreground">{organization.maxUsers}</p>
              </div>
            </div>

            {organization.currentUsers > organization.maxUsers ? (
              <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-sm text-destructive">
                  This organization is above its limit. Reduce users automatically to match the quota.
                </p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => trimUsersToLimit(organization.name, organization.maxUsers)}
                >
                  Apply Limit Now
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
