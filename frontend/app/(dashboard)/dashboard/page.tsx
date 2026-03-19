"use client"

import { useRouter } from "next/navigation"
import { PageHeader, KpiCard } from "@/components/tms-ui"
import { kpiData, monthlyTripsData, fleetUtilData } from "@/lib/mock-data"
import { Truck, Box, Car, MapPin, TrendingUp, BarChart3 } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

export default function DashboardPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your transport operations"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard/active-trips")}
          className="rounded-xl text-left transition-transform hover:-translate-y-0.5"
        >
          <KpiCard
            label="Active Trips"
            value={kpiData.activeTrips}
            icon={<Truck className="h-5 w-5" />}
            trend={{ value: "12% vs last week", positive: true }}
            className="cursor-pointer border-sky-200 hover:border-sky-300"
          />
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/pending-orders")}
          className="rounded-xl text-left transition-transform hover:-translate-y-0.5"
        >
          <KpiCard
            label="Pending Orders"
            value={kpiData.pendingOrders}
            icon={<Box className="h-5 w-5" />}
            trend={{ value: "5% vs last week", positive: false }}
            className="cursor-pointer border-sky-200 hover:border-sky-300"
          />
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/vehicles-available")}
          className="rounded-xl text-left transition-transform hover:-translate-y-0.5"
        >
          <KpiCard
            label="Vehicles Available"
            value={kpiData.vehiclesAvailable}
            icon={<Car className="h-5 w-5" />}
            trend={{ value: "3 more than yesterday", positive: true }}
            className="cursor-pointer border-sky-200 hover:border-sky-300"
          />
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Trips Completed Monthly */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-card-foreground">Trips Completed (Monthly)</h3>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTripsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    color: "var(--card-foreground)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="trips"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  dot={{ fill: "var(--primary)", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fleet Utilization */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-card-foreground">Fleet Utilization %</h3>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fleetUtilData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="type" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    color: "var(--card-foreground)",
                  }}
                />
                <Bar dataKey="utilization" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Vehicles Map placeholder */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">Live Vehicle Positions</h3>
        </div>
        <div className="relative flex h-[320px] items-center justify-center overflow-hidden rounded-lg bg-muted">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `
              linear-gradient(var(--primary) 1px, transparent 1px),
              linear-gradient(90deg, var(--primary) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px"
          }} />
          <div className="relative z-10 flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <MapPin className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-card-foreground">Live GPS Tracking</p>
              <p className="mt-1 text-sm text-muted-foreground">47 vehicles currently tracked across routes</p>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success" />
                In Transit: 32
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-warning" />
                Stopped: 10
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-destructive" />
                Delayed: 5
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
