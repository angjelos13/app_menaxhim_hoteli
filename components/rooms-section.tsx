"use client"

import { useState } from "react"
import { BedDouble, Sparkles, Wrench, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { rooms as initialRooms, type Room, type RoomStatus } from "@/lib/hotel-data"

const statusConfig: Record<RoomStatus, { label: string; color: string; icon: React.ElementType }> = {
  available: { label: "Available", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  occupied: { label: "Occupied", color: "bg-primary/10 text-primary border-primary/20", icon: BedDouble },
  cleaning: { label: "Cleaning", color: "bg-warning/10 text-warning-foreground border-warning/20", icon: Sparkles },
  maintenance: { label: "Maintenance", color: "bg-destructive/10 text-destructive border-destructive/20", icon: Wrench },
}

export function RoomsSection() {
  const [allRooms, setAllRooms] = useState<Room[]>(initialRooms)
  const [filterFloor, setFilterFloor] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const filteredRooms = allRooms.filter((r) => {
    const matchFloor = filterFloor === "all" || r.floor === Number(filterFloor)
    const matchStatus = filterStatus === "all" || r.status === filterStatus
    return matchFloor && matchStatus
  })

  const floors = [...new Set(allRooms.map((r) => r.floor))].sort()

  function updateRoomStatus(roomId: string, newStatus: RoomStatus) {
    setAllRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r))
    )
  }

  const statusCounts = {
    available: allRooms.filter((r) => r.status === "available").length,
    occupied: allRooms.filter((r) => r.status === "occupied").length,
    cleaning: allRooms.filter((r) => r.status === "cleaning").length,
    maintenance: allRooms.filter((r) => r.status === "maintenance").length,
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Room Management
        </h1>
        <p className="text-sm text-muted-foreground">
          View and update room statuses across all floors
        </p>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {(Object.entries(statusCounts) as [RoomStatus, number][]).map(
          ([status, count]) => {
            const config = statusConfig[status]
            const Icon = config.icon
            return (
              <Card key={status} className={`border ${config.color.split(" ")[2]}`}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`flex size-10 items-center justify-center rounded-lg ${config.color.split(" ").slice(0, 2).join(" ")}`}>
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {config.label}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          }
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base">All Rooms</CardTitle>
              <CardDescription>
                Click the status button to update room status (Operational Staff)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filterFloor} onValueChange={setFilterFloor}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Floor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Floors</SelectItem>
                  {floors.map((f) => (
                    <SelectItem key={f} value={String(f)}>
                      Floor {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => {
              const config = statusConfig[room.status]
              const Icon = config.icon
              return (
                <div
                  key={room.id}
                  className="flex flex-col gap-3 rounded-xl border border-border p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground">
                        {room.number}
                      </span>
                      <Badge variant="outline" className="capitalize">
                        {room.type}
                      </Badge>
                    </div>
                    <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.color}`}>
                      <Icon className="size-3" />
                      {config.label}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Floor {room.floor}</span>
                    <span>
                      {room.capacity} {room.capacity === 1 ? "guest" : "guests"}
                    </span>
                    <span className="font-medium text-foreground">
                      ${room.pricePerNight}/night
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {(["available", "cleaning", "maintenance"] as RoomStatus[])
                      .filter((s) => s !== room.status)
                      .map((s) => (
                        <Button
                          key={s}
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs capitalize"
                          onClick={() => updateRoomStatus(room.id, s)}
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
