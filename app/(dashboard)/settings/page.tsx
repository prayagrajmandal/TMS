"use client"

import { useState } from "react"
import { PageHeader } from "@/components/tms-ui"
import { Button } from "@/components/ui/button"
import { Save, Building2, Mail, MapPin, Key } from "lucide-react"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    companyName: "NextGen Logistics Pvt. Ltd.",
    contactEmail: "ops@nextgenlogistics.in",
    googleMapsKey: "",
    gpsProvider: "JioGPS",
  })

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure your TMS preferences and integrations"
        actions={
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        }
      />

      <div className="max-w-2xl space-y-8">
        {/* General Section */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-card-foreground">General</h3>
              <p className="text-xs text-muted-foreground">Basic company information</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Company Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  className="w-full rounded-lg border border-input bg-background py-2.5 pr-3 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={settings.companyName}
                  onChange={e => updateSetting("companyName", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Contact Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  className="w-full rounded-lg border border-input bg-background py-2.5 pr-3 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={settings.contactEmail}
                  onChange={e => updateSetting("contactEmail", e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Maps & GPS Section */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-card-foreground">Maps & GPS</h3>
              <p className="text-xs text-muted-foreground">Configure map and GPS provider settings</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Google Maps API Key</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  className="w-full rounded-lg border border-input bg-background py-2.5 pr-3 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter your Google Maps API key"
                  value={settings.googleMapsKey}
                  onChange={e => updateSetting("googleMapsKey", e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Required for live vehicle tracking maps</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">GPS Provider</label>
              <select
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={settings.gpsProvider}
                onChange={e => updateSetting("gpsProvider", e.target.value)}
              >
                <option value="JioGPS">JioGPS</option>
                <option value="LocoNav">LocoNav</option>
                <option value="Teltonika">Teltonika</option>
              </select>
              <p className="mt-1 text-xs text-muted-foreground">Select your vehicle GPS hardware provider</p>
            </div>
          </div>
        </section>

        {/* Roles Info */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-card-foreground">Roles & Permissions</h3>
          <p className="mb-4 text-xs text-muted-foreground">System roles configured for this TMS instance</p>
          <div className="flex flex-wrap gap-2">
            {["Admin", "Planner", "Dispatcher", "Driver", "Billing", "Security"].map(role => (
              <span
                key={role}
                className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {role}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
