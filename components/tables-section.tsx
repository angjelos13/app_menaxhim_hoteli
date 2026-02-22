"use client"

import { useState } from "react"
import { UtensilsCrossed, Users, MapPin } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { tables as initialTables, type RestaurantTable } from "@/lib/hotel-data"

const tableStatusColor: Record<string, string> = {
  available: "bg-success/10 text-success border-success/20",
  reserved: "bg-warning/10 text-warning-foreground border-warning/20",
  occupied: "bg-primary/10 text-primary border-primary/20",
}

export function TablesSection() {
  const [allTables] = useState<RestaurantTable[]>(initialTables)
  const [filterLocation, setFilterLocation] = useState("all")

  const filteredTables = allTables.filter(
    (t) => filterLocation === "all" || t.location === filterLocation
  )

  const statusCounts = {
    available: allTables.filter((t) => t.status === "available").length,
    reserved: allTables.filter((t) => t.status === "reserved").length,
    occupied: allTables.filter((t) => t.status === "occupied").length,
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Restaurant Tables
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage table availability and seating arrangements
        </p>
      </div>

      <div className="grid gap-3 grid-cols-3">
        {(
          Object.entries(statusCounts) as [string, number][]
        ).map(([status, count]) => (
          <Card key={status}>
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className={`flex size-10 items-center justify-center rounded-lg ${tableStatusColor[status].split(" ").slice(0, 2).join(" ")}`}
              >
                <UtensilsCrossed className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{count}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {status}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base">Table Layout</CardTitle>
              <CardDescription>
                View restaurant tables by location
              </CardDescription>
            </div>
            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="indoor">Indoor</SelectItem>
                <SelectItem value="terrace">Terrace</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {filteredTables.map((table) => (
              <div
                key={table.id}
                className={`flex flex-col items-center gap-3 rounded-xl border p-5 ${tableStatusColor[table.status]}`}
              >
                <div className="flex size-14 items-center justify-center rounded-full border-2 border-current/20 bg-background">
                  <span className="text-lg font-bold text-foreground">
                    {table.number}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Users className="size-3.5" />
                  {table.seats} seats
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <MapPin className="size-3" />
                  <span className="capitalize">{table.location}</span>
                </div>
                <Badge
                  variant="outline"
                  className="capitalize"
                >
                  {table.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
