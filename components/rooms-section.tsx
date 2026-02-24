"use client"

import { useState, useEffect } from "react"
import { BedDouble, Sparkles, Wrench, CheckCircle2, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { RoomStatus } from "@/lib/hotel-data"
import { apiFetch } from "@/lib/api"

interface RoomRow {
  roomId: number
  roomNumber: string
  type: string
  pricePerNight: number
  status: string
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  Available: { label: "Available", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  Occupied: { label: "Occupied", color: "bg-primary/10 text-primary border-primary/20", icon: BedDouble },
  Cleaning: { label: "Cleaning", color: "bg-warning/10 text-warning-foreground border-warning/20", icon: Sparkles },
  Maintenance: { label: "Maintenance", color: "bg-destructive/10 text-destructive border-destructive/20", icon: Wrench },
}

export function RoomsSection() {
  const [allRooms, setAllRooms] = useState<RoomRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filterFloor, setFilterFloor] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  useEffect(() => {
    apiFetch<RoomRow[]>("/api/rooms").then(({ data }) => {
      if (data) setAllRooms(data)
      setLoading(false)
    })
  }, [])

  const getFloor = (num: string) => Math.floor(parseInt(num) / 100)

  const filteredRooms = allRooms.filter((r) => {
    const matchFloor = filterFloor === "all" || getFloor(r.roomNumber) === Number(filterFloor)
    const matchStatus = filterStatus === "all" || r.status === filterStatus
    return matchFloor && matchStatus
  })

  const floors = [...new Set(allRooms.map((r) => getFloor(r.roomNumber)))].sort()

  async function updateRoomStatus(roomId: number, newStatus: string) {
    const { data } = await apiFetch<RoomRow>("/api/rooms", {
      method: "PATCH",
      body: JSON.stringify({ roomId, status: newStatus }),
    })
    if (data) {
      setAllRooms((prev) => prev.map((r) => (r.roomId === roomId ? { ...r, status: newStatus } : r)))
    }
  }

  const statusCounts = {
    Available: allRooms.filter((r) => r.status === "Available").length,
    Occupied: allRooms.filter((r) => r.status === "Occupied").length,
    Cleaning: allRooms.filter((r) => r.status === "Cleaning").length,
    Maintenance: allRooms.filter((r) => r.status === "Maintenance").length,
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
        <h1 className="text-2xl font-semibold text-foreground">Room Management</h1>
        <p className="text-sm text-muted-foreground">View and update room statuses across all floors</p>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {(Object.entries(statusCounts) as [string, number][]).map(([status, count]) => {
          const config = statusConfig[status]
          if (!config) return null
          const Icon = config.icon
          return (
            <Card key={status} className={`border ${config.color.split(" ")[2]}`}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex size-10 items-center justify-center rounded-lg ${config.color.split(" ").slice(0, 2).join(" ")}`}>
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base">All Rooms</CardTitle>
              <CardDescription>Click the status button to update room status</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filterFloor} onValueChange={setFilterFloor}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Floor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Floors</SelectItem>
                  {floors.map((f) => (
                    <SelectItem key={f} value={String(f)}>Floor {f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Occupied">Occupied</SelectItem>
                  <SelectItem value="Cleaning">Cleaning</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => {
              const config = statusConfig[room.status] || statusConfig["Available"]
              const Icon = config.icon
              return (
                <div key={room.roomId} className="flex flex-col gap-3 rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground">{room.roomNumber}</span>
                      <Badge variant="outline" className="capitalize">{room.type}</Badge>
                    </div>
                    <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.color}`}>
                      <Icon className="size-3" />
                      {config.label}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Floor {getFloor(room.roomNumber)}</span>
                    <span className="font-medium text-foreground">${room.pricePerNight}/night</span>
                  </div>
                  <div className="flex gap-1.5">
                    {["Available", "Cleaning", "Maintenance"]
                      .filter((s) => s !== room.status)
                      .map((s) => (
                        <Button
                          key={s}
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => updateRoomStatus(room.roomId, s)}
                        >
                          {s}
                        </Button>
                      ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
