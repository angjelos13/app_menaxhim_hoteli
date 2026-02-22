"use client"

import {
  BedDouble,
  CalendarDays,
  DollarSign,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  UtensilsCrossed,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { rooms, tables, reservations, inventoryItems } from "@/lib/hotel-data"

export function DashboardOverview() {
  const occupiedRooms = rooms.filter((r) => r.status === "occupied").length
  const availableRooms = rooms.filter((r) => r.status === "available").length
  const todayCheckins = reservations.filter(
    (r) => r.checkIn === "2026-02-22" && r.type === "room"
  ).length
  const totalRevenue = reservations
    .filter((r) => r.paymentStatus === "paid")
    .reduce((sum, r) => sum + r.totalAmount, 0)
  const pendingPayments = reservations
    .filter((r) => r.paymentStatus === "pending" || r.paymentStatus === "partial")
    .reduce((sum, r) => sum + r.totalAmount, 0)
  const activeGuests = reservations.filter((r) => r.status === "checked-in").length
  const tablesAvailable = tables.filter((t) => t.status === "available").length
  const lowStockItems = inventoryItems.filter(
    (i) => i.currentStock < i.minStock
  )

  const recentReservations = [...reservations]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

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
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Room Occupancy
            </CardTitle>
            <BedDouble className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {occupiedRooms}/{rooms.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {availableRooms} rooms available
            </p>
            <div className="mt-2 h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${(occupiedRooms / rooms.length) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Guests
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {activeGuests}
            </div>
            <div className="flex items-center gap-1 text-xs text-success">
              <ArrowUpRight className="size-3" />
              {todayCheckins} check-ins today
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue (Paid)
            </CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-warning">
              <ArrowDownRight className="size-3" />$
              {pendingPayments.toLocaleString()} pending
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Restaurant Tables
            </CardTitle>
            <UtensilsCrossed className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {tablesAvailable}/{tables.length}
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
              {recentReservations.map((res) => (
                <div
                  key={res.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      {res.type === "room" ? (
                        <BedDouble className="size-4 text-muted-foreground" />
                      ) : (
                        <UtensilsCrossed className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {res.guest.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {res.id} - {res.type === "room" ? `Room` : `Table`} -{" "}
                        {res.checkIn}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      res.status === "checked-in"
                        ? "default"
                        : res.status === "confirmed"
                          ? "secondary"
                          : res.status === "checked-out"
                            ? "outline"
                            : "destructive"
                    }
                  >
                    {res.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="size-4 text-warning" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>
              Items below minimum stock level
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All inventory levels are healthy.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-destructive">
                        {item.currentStock} {item.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        min: {item.minStock}
                      </p>
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
          <CardDescription>Check-ins and check-outs for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-medium text-foreground">
                Arriving Today
              </h4>
              {reservations.filter(
                (r) => r.checkIn === "2026-02-22" && r.status === "confirmed"
              ).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No arrivals scheduled.
                </p>
              ) : (
                reservations
                  .filter(
                    (r) =>
                      r.checkIn === "2026-02-22" && r.status === "confirmed"
                  )
                  .map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <span className="text-sm text-foreground">
                        {r.guest.name}
                      </span>
                      <Badge variant="secondary">
                        {r.type === "room" ? `Room` : `Table`}
                      </Badge>
                    </div>
                  ))
              )}
            </div>
            <div>
              <h4 className="mb-2 text-sm font-medium text-foreground">
                Departing Today
              </h4>
              {reservations.filter(
                (r) => r.checkOut === "2026-02-22" && r.status === "checked-in"
              ).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No departures scheduled.
                </p>
              ) : (
                reservations
                  .filter(
                    (r) =>
                      r.checkOut === "2026-02-22" && r.status === "checked-in"
                  )
                  .map((r) => (
                    <div
                      key={r.id}
                      className="mb-2 flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <span className="text-sm text-foreground">
                        {r.guest.name}
                      </span>
                      <Badge variant="outline">Check-out</Badge>
                    </div>
                  ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
