"use client"

import { useEffect, useMemo, useState } from "react"
import { PageHeader } from "@/components/tms-ui"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useOrganizations } from "@/hooks/use-organizations"
import { useUserDirectory } from "@/hooks/use-user-directory"
import { countUsersForOrganization, type OrganizationConfig } from "@/lib/auth"
import { Building2, Plus, RotateCcw, ShieldCheck, Users } from "lucide-react"

export default function SuperAdminPage() {
  const { organizations, isLoading, saveOrganizations, resetOrganizations, deleteOrganization } = useOrganizations()
  const { users, saveUsers } = useUserDirectory()
  const [selectedOrganization, setSelectedOrganization] = useState("")
  const [form, setForm] = useState({
    maxUsers: "5",
    address: "",
    phone: "",
    country: "",
    email: "",
    pan: "",
  })
  const [isCreateOrgDialogOpen, setIsCreateOrgDialogOpen] = useState(false)
  const [newOrganization, setNewOrganization] = useState({
    name: "",
    maxUsers: "5",
    address: "",
    phone: "",
    country: "",
    email: "",
    pan: "",
  })

  const organizationStats = useMemo(
    () =>
      organizations.map((organization) => ({
        ...organization,
        currentUsers: countUsersForOrganization(users, organization.name),
      })),
    [organizations, users]
  )

  useEffect(() => {
    if (organizations.length === 0) {
      setSelectedOrganization("")
      return
    }

    if (!selectedOrganization) {
      setForm({
        maxUsers: "5",
        address: "",
        phone: "",
        country: "",
        email: "",
        pan: "",
      })
      return
    }

    const currentOrganization = organizations.find((organization) => organization.name === selectedOrganization)
    if (!currentOrganization) {
      setSelectedOrganization("")
      setForm({
        maxUsers: "5",
        address: "",
        phone: "",
        country: "",
        email: "",
        pan: "",
      })
      return
    }

    setForm({
      maxUsers: String(currentOrganization.maxUsers),
      address: currentOrganization.address,
      phone: currentOrganization.phone,
      country: currentOrganization.country,
      email: currentOrganization.email,
      pan: currentOrganization.pan,
    })
  }, [organizations, selectedOrganization])

  const saveOrganization = () => {
    const normalizedName = selectedOrganization.trim()
    const maxUsers = Number(form.maxUsers)

    if (!normalizedName || maxUsers < 1) {
      return
    }

    const existing = organizations.find((item) => item.name.toLowerCase() === normalizedName.toLowerCase())
    const nextOrganizations: OrganizationConfig[] = existing
      ? organizations.map((item) => (
          item.name.toLowerCase() === normalizedName.toLowerCase()
            ? {
                ...item,
                maxUsers,
                address: form.address.trim(),
                phone: form.phone.trim(),
                country: form.country.trim(),
                email: form.email.trim(),
                pan: form.pan.trim(),
              }
            : item
        ))
      : [
          ...organizations,
          {
            name: normalizedName,
            maxUsers,
            address: form.address.trim(),
            phone: form.phone.trim(),
            country: form.country.trim(),
            email: form.email.trim(),
            pan: form.pan.trim(),
          },
        ]

    saveOrganizations(nextOrganizations)
  }

  const handleOrganizationSelect = (value: string) => {
    if (selectedOrganization === value) {
      setSelectedOrganization("")
      setForm({
        maxUsers: "5",
        address: "",
        phone: "",
        country: "",
        email: "",
        pan: "",
      })
      return
    }

    setSelectedOrganization(value)

    const organization = organizations.find((item) => item.name === value)
    if (!organization) {
      return
    }

    setForm({
      maxUsers: String(organization.maxUsers),
      address: organization.address,
      phone: organization.phone,
      country: organization.country,
      email: organization.email,
      pan: organization.pan,
    })
  }

  const createOrganization = () => {
    const normalizedName = newOrganization.name.trim()
    const maxUsers = Number(newOrganization.maxUsers)

    if (!normalizedName || maxUsers < 1) {
      return
    }

    const alreadyExists = organizations.some(
      (organization) => organization.name.toLowerCase() === normalizedName.toLowerCase()
    )

    if (alreadyExists) {
      return
    }

    const createdOrganization: OrganizationConfig = {
      name: normalizedName,
      maxUsers,
      address: newOrganization.address.trim(),
      phone: newOrganization.phone.trim(),
      country: newOrganization.country.trim(),
      email: newOrganization.email.trim(),
      pan: newOrganization.pan.trim(),
    }
    saveOrganizations([...organizations, createdOrganization])
    setSelectedOrganization(normalizedName)
    setForm({
      maxUsers: String(maxUsers),
      address: createdOrganization.address,
      phone: createdOrganization.phone,
      country: createdOrganization.country,
      email: createdOrganization.email,
      pan: createdOrganization.pan,
    })
    setNewOrganization({ name: "", maxUsers: "5", address: "", phone: "", country: "", email: "", pan: "" })
    setIsCreateOrgDialogOpen(false)
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
          <div className="flex flex-wrap gap-2">
            <Dialog open={isCreateOrgDialogOpen} onOpenChange={setIsCreateOrgDialogOpen}>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setIsCreateOrgDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Org
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Organization</DialogTitle>
                  <DialogDescription>
                    Add a new organization and set its starting user quota.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">Organization Name</label>
                    <input
                      value={newOrganization.name}
                      onChange={(e) => setNewOrganization({ ...newOrganization, name: e.target.value })}
                      placeholder="Enter organization name"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">Total Users Allowed</label>
                    <input
                      type="number"
                      min={1}
                      value={newOrganization.maxUsers}
                      onChange={(e) => setNewOrganization({ ...newOrganization, maxUsers: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">Company Email</label>
                    <input
                      type="email"
                      value={newOrganization.email}
                      onChange={(e) => setNewOrganization({ ...newOrganization, email: e.target.value })}
                      placeholder="Enter company email"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">Phone Number</label>
                    <input
                      value={newOrganization.phone}
                      onChange={(e) => setNewOrganization({ ...newOrganization, phone: e.target.value })}
                      placeholder="Enter phone number"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">Country</label>
                    <input
                      value={newOrganization.country}
                      onChange={(e) => setNewOrganization({ ...newOrganization, country: e.target.value })}
                      placeholder="Enter country"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">PAN</label>
                    <input
                      value={newOrganization.pan}
                      onChange={(e) => setNewOrganization({ ...newOrganization, pan: e.target.value })}
                      placeholder="Enter PAN"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">Address</label>
                    <textarea
                      value={newOrganization.address}
                      onChange={(e) => setNewOrganization({ ...newOrganization, address: e.target.value })}
                      placeholder="Enter company address"
                      rows={3}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateOrgDialogOpen(false)
                      setNewOrganization({ name: "", maxUsers: "5", address: "", phone: "", country: "", email: "", pan: "" })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={createOrganization}
                    disabled={!newOrganization.name.trim() || Number(newOrganization.maxUsers) < 1}
                  >
                    Create Organization
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              onClick={() => {
                resetOrganizations()
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Organizations
            </Button>
          </div>
        }
      />

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-base font-semibold text-card-foreground">Organizations</p>
          <p className="mt-1 text-sm text-muted-foreground">Click any organization to view and edit its details. Click it again to close.</p>
        </div>

        <div className="space-y-3">
          {organizationStats.map((organization) => {
            const isActive = organization.name === selectedOrganization

            return (
              <div key={organization.name} className="rounded-xl border border-border bg-muted/20">
                <button
                  type="button"
                  onClick={() => handleOrganizationSelect(organization.name)}
                  className={`w-full rounded-xl p-4 text-left transition-colors ${
                    isActive
                      ? "border-primary bg-primary/10"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">{organization.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {organization.currentUsers} of {organization.maxUsers} users assigned
                      </p>
                    </div>
                    <div className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      Limit {organization.maxUsers}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                    <p>Email: {organization.email || "Not set"}</p>
                    <p>Country: {organization.country || "Not set"}</p>
                    <p>Phone: {organization.phone || "Not set"}</p>
                  </div>
                </button>

                {isActive ? (
                  <div className="border-t border-border px-4 pb-4">
                    <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
                      <div className="space-y-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-card-foreground">Selected Organization</label>
                          <div className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-medium text-foreground">
                            {selectedOrganization}
                          </div>
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
                        <div>
                          <label className="mb-2 block text-sm font-medium text-card-foreground">Company Email</label>
                          <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-card-foreground">Phone Number</label>
                            <input
                              value={form.phone}
                              onChange={(e) => setForm({ ...form, phone: e.target.value })}
                              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-card-foreground">Country</label>
                            <input
                              value={form.country}
                              onChange={(e) => setForm({ ...form, country: e.target.value })}
                              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-card-foreground">PAN</label>
                          <input
                            value={form.pan}
                            onChange={(e) => setForm({ ...form, pan: e.target.value })}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-card-foreground">Address</label>
                          <textarea
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            rows={3}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                      </div>
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={saveOrganization}>
                          Save Organization Quota
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleOrganizationSelect(selectedOrganization)}
                        >
                          Edit Organization
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            if (window.confirm(`Delete organization ${selectedOrganization}? This will remove its related records too.`)) {
                              void deleteOrganization(selectedOrganization)
                              setSelectedOrganization("")
                            }
                          }}
                        >
                          Delete Organization
                        </Button>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/30 p-4">
                        <p className="text-sm font-semibold text-card-foreground">How it works</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          If `{selectedOrganization}` gets `5` users, that count includes the organization admin. The org admin cannot create more than the total users allowed.
                        </p>
                        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                          <p>Company Email: {organization.email || "Not set"}</p>
                          <p>Phone: {organization.phone || "Not set"}</p>
                          <p>Country: {organization.country || "Not set"}</p>
                          <p>PAN: {organization.pan || "Not set"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
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

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Company Email</p>
                <p className="text-sm font-medium text-card-foreground">{organization.email || "Not set"}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
                <p className="text-sm font-medium text-card-foreground">{organization.phone || "Not set"}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Country</p>
                <p className="text-sm font-medium text-card-foreground">{organization.country || "Not set"}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">PAN</p>
                <p className="text-sm font-medium text-card-foreground">{organization.pan || "Not set"}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 md:col-span-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Address</p>
                <p className="text-sm font-medium text-card-foreground">{organization.address || "Not set"}</p>
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
            <Button
              variant="outline"
              className="mt-4 mr-2"
              onClick={() => handleOrganizationSelect(organization.name)}
            >
              Edit Organization
            </Button>
            {organization.name !== "Platform" ? (
              <Button
                variant="destructive"
                className="mt-4"
                onClick={() => {
                  if (window.confirm(`Delete organization ${organization.name}? This will remove its related records too.`)) {
                    void deleteOrganization(organization.name)
                  }
                }}
              >
                Delete Organization
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
