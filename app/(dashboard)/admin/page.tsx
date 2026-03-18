"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/tms-ui"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import { useOrganizations } from "@/hooks/use-organizations"
import { useUserDirectory } from "@/hooks/use-user-directory"
import { accessOptions, countUsersForOrganization, getDefaultAccessForRoles, roleLabels, type AccessRoute, type DemoUser, type UserRole, getRoleLabels } from "@/lib/auth"
import { Plus, RotateCcw, ShieldCheck, Users } from "lucide-react"

const assignableRoles: UserRole[] = ["admin", "head-office", "gate", "maintenance", "vehicle-assignment"]

export default function AdminUsersPage() {
  const { session } = useAuth()
  const { users, isLoading, saveUsers, resetUsers } = useUserDirectory()
  const { organizations } = useOrganizations()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    userId: "",
    name: "",
    email: "",
    department: "",
    role: "maintenance" as UserRole,
  })

  const scopedUsers = session ? users.filter((user) => user.organization === session.organization) : users
  const [selectedUserId, setSelectedUserId] = useState("")

  useEffect(() => {
    if (scopedUsers.length === 0) {
      setSelectedUserId("")
      return
    }

    if (!scopedUsers.some((user) => user.userId === selectedUserId)) {
      setSelectedUserId(scopedUsers[0].userId)
    }
  }, [scopedUsers, selectedUserId])

  const selectedUser = scopedUsers.find((user) => user.userId === selectedUserId) ?? scopedUsers[0] ?? null
  const organizationLimit = session
    ? organizations.find((organization) => organization.name.toLowerCase() === session.organization.toLowerCase()) ?? null
    : null
  const currentUserCount = session ? countUsersForOrganization(users, session.organization) : 0
  const canCreateMoreUsers = session ? currentUserCount < (organizationLimit?.maxUsers ?? 0) : false
  const organizationName = session?.organization ?? "Unknown"
  const isCreateFormValid = newUser.userId.trim().length === 5
    && newUser.name.trim().length > 0
    && newUser.email.trim().length > 0
    && newUser.department.trim().length > 0

  const updateSelectedUser = (updater: (user: DemoUser) => DemoUser) => {
    if (!selectedUser) {
      return
    }

    saveUsers(
      users.map((user) =>
        user.userId === selectedUser.userId && user.organization === selectedUser.organization ? updater(user) : user
      )
    )
  }

  const createUser = () => {
    if (!session) {
      return
    }

    const userId = newUser.userId.trim().toLowerCase()
    const name = newUser.name.trim()
    const email = newUser.email.trim().toLowerCase()
    const department = newUser.department.trim()
    const role = newUser.role

    if (userId.length !== 5 || !name || !email || !department || !canCreateMoreUsers) {
      return
    }

    if (
      users.some(
        (user) =>
          user.organization.toLowerCase() === session.organization.toLowerCase() &&
          user.userId.toLowerCase() === userId
      )
    ) {
      return
    }

    const createdUser: DemoUser = {
      userId,
      name,
      password: "1234",
      email,
      department,
      roles: [role],
      accessRoutes: getDefaultAccessForRoles([role]),
      organization: session.organization,
    }

    saveUsers([...users, createdUser])
    setNewUser({ userId: "", name: "", email: "", department: "", role: "maintenance" })
    setSelectedUserId(createdUser.userId)
    setIsCreateDialogOpen(false)
  }

  const toggleAccess = (route: AccessRoute) => {
    updateSelectedUser((user) => {
      const nextRoutes = user.accessRoutes.includes(route)
        ? user.accessRoutes.filter((item) => item !== route)
        : [...user.accessRoutes, route]

      return {
        ...user,
        accessRoutes: nextRoutes.length > 0 ? nextRoutes : user.accessRoutes,
      }
    })
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        Loading users...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin User Management"
        description="Create users inside your organization quota, then assign page access"
        actions={
          <Button variant="outline" onClick={resetUsers}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Default Roles
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-sm font-medium text-card-foreground">Admin-only page</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Organization: {session?.organization ?? "Unknown"}.
          {" "}You can manage only users from this organization and cannot go above the allowed user count.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setIsCreateDialogOpen(true)}
              disabled={!canCreateMoreUsers}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create User In {organizationName}
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create User In {organizationName}</DialogTitle>
                <DialogDescription>
                  Add a new user under this organization. The default password will be `1234`.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-card-foreground">New User ID</label>
                  <input
                    value={newUser.userId}
                    onChange={(e) => setNewUser({ ...newUser, userId: e.target.value.slice(0, 5) })}
                    placeholder="5 chars"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-card-foreground">New User Name</label>
                  <input
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Enter name"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-card-foreground">Mail ID</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="Enter email"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-card-foreground">Department</label>
                  <input
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    placeholder="Enter department"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-card-foreground">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {assignableRoles.map((role) => (
                      <option key={role} value={role}>
                        {roleLabels[role]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-card-foreground">Organization</label>
                  <input
                    value={organizationName}
                    readOnly
                    className="w-full rounded-lg border border-input bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    setNewUser({ userId: "", name: "", email: "", department: "", role: "maintenance" })
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={createUser}
                  disabled={!canCreateMoreUsers || !isCreateFormValid}
                >
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <p className="text-sm text-muted-foreground">
            {currentUserCount} / {organizationLimit?.maxUsers ?? 0} users used in this organization. Password for new users is `1234`.
          </p>
          {!canCreateMoreUsers ? (
            <p className="text-sm font-medium text-destructive">
              User limit reached for {session?.organization}. Increase the quota from Super Admin or remove/reset a user first.
            </p>
          ) : null}
        </div>
      </div>

      {selectedUser ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">User ID</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {scopedUsers.map((user) => (
                    <option key={user.userId} value={user.userId}>
                      {user.userId} - {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-card-foreground">{selectedUser.name}</p>
                    <p className="text-sm text-muted-foreground">Login ID: {selectedUser.userId}</p>
                  </div>
                  <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {selectedUser.password}
                  </div>
                </div>

                <div className="grid gap-3 text-sm">
                  <div className="rounded-lg bg-background p-3">
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Organization</p>
                    <p className="font-medium text-card-foreground">{selectedUser.organization}</p>
                  </div>
                  <div className="rounded-lg bg-background p-3">
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Mail ID</p>
                    <p className="font-medium text-card-foreground">{selectedUser.email || "Not set"}</p>
                  </div>
                  <div className="rounded-lg bg-background p-3">
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Department</p>
                    <p className="font-medium text-card-foreground">{selectedUser.department || "Not set"}</p>
                  </div>
                  <div className="rounded-lg bg-background p-3">
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Current Role</p>
                    <p className="font-medium text-card-foreground">{getRoleLabels(selectedUser.roles)}</p>
                  </div>
                  <div className="rounded-lg bg-background p-3">
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Access</p>
                    <p className="font-medium text-card-foreground">{selectedUser.accessRoutes.length} pages assigned</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-card-foreground">Assign Multiple Menu Access</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {accessOptions.map((option) => (
                  <label key={option.route} className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={selectedUser.accessRoutes.includes(option.route)}
                      onChange={() => toggleAccess(option.route)}
                      className="h-4 w-4"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <Users className="mb-3 h-5 w-5 text-primary" />
          <p className="text-sm font-semibold text-card-foreground">Organization Quota</p>
          <p className="mt-1 text-sm text-muted-foreground">The user limit includes the admin user inside the same organization.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
          <p className="text-sm font-semibold text-card-foreground">Multiple Access</p>
          <p className="mt-1 text-sm text-muted-foreground">Check more than one option to combine menu access for one user.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <RotateCcw className="mb-3 h-5 w-5 text-primary" />
          <p className="text-sm font-semibold text-card-foreground">Quick Reset</p>
          <p className="mt-1 text-sm text-muted-foreground">Reset restores the default page access for admin, head office, gate, and maintenance users.</p>
        </div>
      </div>
    </div>
  )
}
