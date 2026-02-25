"use client"

import { useEffect, useState } from "react"
import {
  BedDouble,
  CalendarDays,
  DollarSign,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  UtensilsCrossed,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiFetch } from "@/lib/api"

interface DashboardData {
  rooms: {
    totalRooms: number
    occupiedRooms: number
    availableRooms: number
    cleaningRooms: number
    maintenanceRooms: number
  }
  tables: {
    totalTables: number
    availableTables: number
    reservedTables: number
    occupiedTables: number
  }
  activeGuests: number
  todayArrivals: number
  todayDepartures: number
  revenue: number
  lowStockItems: { name: string; quantityOnHand: number; minThreshold: number; unit: string }[]
  recentReservations: {
    reservationId: number
    reservationType: string
    status: string
    startDate: string
    endDate: string
    guestName: string
    roomNumber?: string
    tableNumber?: string
  }[]
}

export function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
  let cancelled = false

  async function load() {
    try {
      setLoading(true)
      setErrorMsg(null)

      const d = await apiFetch<DashboardData>("/api/dashboard") // ose fetch direkt
      if (!cancelled) setData(d)
    } catch (e: any) {
      console.error("Dashboard fetch failed:", e)
      if (!cancelled) {
        setData(null)
        setErrorMsg(e?.message ?? "Failed to load dashboard")
      }
    } finally {
      if (!cancelled) setLoading(false)
    }
  }

  load()
  return () => { cancelled = true }
}, [])

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (errorMsg) {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-destructive">
      {errorMsg}
    </div>
  )
}

if (!data) {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
      No dashboard data.
    </div>
  )
}

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your hotel operations for today
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Room Occupancy</CardTitle>
            <BedDouble className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {data.rooms.occupiedRooms}/{data.rooms.totalRooms}
            </div>
            <p className="text-xs text-muted-foreground">{data.rooms.availableRooms} rooms available</p>
            <div className="mt-2 h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${(data.rooms.occupiedRooms / data.rooms.totalRooms) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Guests</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.activeGuests}</div>
            <div className="flex items-center gap-1 text-xs text-success">
              <ArrowUpRight className="size-3" />
              {data.todayArrivals} check-ins today
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue (Paid)</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${Number(data.revenue).toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-warning">
              <ArrowDownRight className="size-3" />
              {data.todayDepartures} departures today
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Restaurant Tables</CardTitle>
            <UtensilsCrossed className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {data.tables.availableTables}/{data.tables.totalTables}
            </div>
            <p className="text-xs text-muted-foreground">tables available</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Reservations</CardTitle>
            <CardDescription>Latest booking activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {data.recentReservations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent reservations.</p>
              ) : (
                data.recentReservations.map((res) => (
                  <div
                    key={res.reservationId}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                        {res.reservationType === "Room" ? (
                          <BedDouble className="size-4 text-muted-foreground" />
                        ) : (
                          <UtensilsCrossed className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{res.guestName}</p>
                        <p className="text-xs text-muted-foreground">
                          #{res.reservationId} - {res.reservationType} - {res.startDate?.split("T")[0]}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        res.status === "CheckedIn"
                          ? "default"
                          : res.status === "Confirmed"
                            ? "secondary"
                            : res.status === "CheckedOut"
                              ? "outline"
                              : "destructive"
                      }
                    >
                      {res.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="size-4 text-warning" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>Items below minimum stock level</CardDescription>
          </CardHeader>
          <CardContent>
            {data.lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">All inventory levels are healthy.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {data.lowStockItems.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-destructive">
                        {item.quantityOnHand} {item.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">min: {item.minThreshold}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            {"Today's Schedule"}
          </CardTitle>
          <CardDescription>Arrivals: {data.todayArrivals} | Departures: {data.todayDepartures}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-medium text-foreground">Arriving Today</h4>
              {data.todayArrivals === 0 ? (
                <p className="text-sm text-muted-foreground">No arrivals scheduled.</p>
              ) : (
                <p className="text-sm text-foreground">{data.todayArrivals} guest(s) expected</p>
              )}
            </div>
            <div>
              <h4 className="mb-2 text-sm font-medium text-foreground">Departing Today</h4>
              {data.todayDepartures === 0 ? (
                <p className="text-sm text-muted-foreground">No departures scheduled.</p>
              ) : (
                <p className="text-sm text-foreground">{data.todayDepartures} guest(s) departing</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
