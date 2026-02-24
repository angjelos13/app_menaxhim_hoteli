"use client"

import { useState, useEffect } from "react"
import { UtensilsCrossed, Users, MapPin, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiFetch } from "@/lib/api"

interface TableRow {
  tableId: number
  tableNumber: string
  capacity: number
  status: string
}

const tableStatusColor: Record<string, string> = {
  Available: "bg-success/10 text-success border-success/20",
  Reserved: "bg-warning/10 text-warning-foreground border-warning/20",
  Occupied: "bg-primary/10 text-primary border-primary/20",
}

export function TablesSection() {
  const [allTables, setAllTables] = useState<TableRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filterLocation, setFilterLocation] = useState("all")

  useEffect(() => {
    apiFetch<TableRow[]>("/api/tables").then(({ data }) => {
      if (data) setAllTables(data)
      setLoading(false)
    })
  }, [])

  const statusCounts = {
    Available: allTables.filter((t) => t.status === "Available").length,
    Reserved: allTables.filter((t) => t.status === "Reserved").length,
    Occupied: allTables.filter((t) => t.status === "Occupied").length,
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Restaurant Tables</h1>
        <p className="text-sm text-muted-foreground">Manage table availability and seating arrangements</p>
      </div>

      <div className="grid gap-3 grid-cols-3">
        {(Object.entries(statusCounts) as [string, number][]).map(([status, count]) => (
          <Card key={status}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex size-10 items-center justify-center rounded-lg ${(tableStatusColor[status] || "").split(" ").slice(0, 2).join(" ")}`}>
                <UtensilsCrossed className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{count}</p>
                <p className="text-xs text-muted-foreground">{status}</p>
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
              <CardDescription>View restaurant tables</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {allTables.map((table) => (
              <div
                key={table.tableId}
                className={`flex flex-col items-center gap-3 rounded-xl border p-5 ${tableStatusColor[table.status] || "border-border"}`}
              >
                <div className="flex size-14 items-center justify-center rounded-full border-2 border-current/20 bg-background">
                  <span className="text-lg font-bold text-foreground">{table.tableNumber}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Users className="size-3.5" />
                  {table.capacity} seats
                </div>
                <Badge variant="outline">{table.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
