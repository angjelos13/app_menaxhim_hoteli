"use client"

import { useState } from "react"
import {
  Search,
  Plus,
  BedDouble,
  UtensilsCrossed,
  X,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  reservations as initialReservations,
  rooms,
  tables,
  type Reservation,
  type ReservationStatus,
} from "@/lib/hotel-data"

const statusColor: Record<ReservationStatus, "default" | "secondary" | "outline" | "destructive"> = {
  "confirmed": "secondary",
  "checked-in": "default",
  "checked-out": "outline",
  "cancelled": "destructive",
}

export function ReservationsSection() {
  const [allReservations, setAllReservations] = useState<Reservation[]>(initialReservations)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)

  const [formData, setFormData] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    guestId: "",
    type: "room" as "room" | "table",
    resourceId: "",
    checkIn: "",
    checkOut: "",
  })

  const filteredReservations = allReservations.filter((r) => {
    const matchesSearch =
      r.guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || r.status === filterStatus
    const matchesType = filterType === "all" || r.type === filterType
    return matchesSearch && matchesStatus && matchesType
  })

  const availableRooms = rooms.filter((r) => r.status === "available")
  const availableTables = tables.filter((t) => t.status === "available")

  function resetForm() {
    setFormData({
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      guestId: "",
      type: "room",
      resourceId: "",
      checkIn: "",
      checkOut: "",
    })
    setEditingReservation(null)
  }

  function handleCreateReservation() {
    const newRes: Reservation = {
      id: `res-${String(allReservations.length + 1).padStart(3, "0")}`,
      type: formData.type,
      guest: {
        id: `g-new-${Date.now()}`,
        name: formData.guestName,
        email: formData.guestEmail,
        phone: formData.guestPhone,
        idDocument: formData.guestId,
      },
      roomId: formData.type === "room" ? formData.resourceId : undefined,
      tableId: formData.type === "table" ? formData.resourceId : undefined,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      status: "confirmed",
      services: [],
      totalAmount: 0,
      paymentStatus: "pending",
      createdAt: new Date().toISOString().split("T")[0],
    }
    setAllReservations((prev) => [newRes, ...prev])
    setDialogOpen(false)
    resetForm()
  }

  function handleModifyReservation() {
    if (!editingReservation) return
    setAllReservations((prev) =>
      prev.map((r) =>
        r.id === editingReservation.id
          ? {
              ...r,
              guest: {
                ...r.guest,
                name: formData.guestName,
                email: formData.guestEmail,
                phone: formData.guestPhone,
                idDocument: formData.guestId,
              },
              checkIn: formData.checkIn,
              checkOut: formData.checkOut,
              roomId: formData.type === "room" ? formData.resourceId : undefined,
              tableId: formData.type === "table" ? formData.resourceId : undefined,
            }
          : r
      )
    )
    setDialogOpen(false)
    resetForm()
  }

  function handleCancelReservation(resId: string) {
    setAllReservations((prev) =>
      prev.map((r) =>
        r.id === resId ? { ...r, status: "cancelled" as ReservationStatus } : r
      )
    )
  }

  function openEditDialog(res: Reservation) {
    setEditingReservation(res)
    setFormData({
      guestName: res.guest.name,
      guestEmail: res.guest.email,
      guestPhone: res.guest.phone,
      guestId: res.guest.idDocument,
      type: res.type,
      resourceId: (res.roomId || res.tableId) ?? "",
      checkIn: res.checkIn,
      checkOut: res.checkOut,
    })
    setDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Reservations
          </h1>
          <p className="text-sm text-muted-foreground">
            Create, modify, and manage all room and table reservations
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              New Reservation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingReservation ? "Modify Reservation" : "Create Reservation"}
              </DialogTitle>
              <DialogDescription>
                {editingReservation
                  ? `Editing reservation ${editingReservation.id}`
                  : "Fill in the details to create a new reservation. Availability is checked automatically."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="guestName">Guest Name</Label>
                  <Input
                    id="guestName"
                    value={formData.guestName}
                    onChange={(e) =>
                      setFormData({ ...formData, guestName: e.target.value })
                    }
                    placeholder="Full name"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="guestEmail">Email</Label>
                  <Input
                    id="guestEmail"
                    type="email"
                    value={formData.guestEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, guestEmail: e.target.value })
                    }
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="guestPhone">Phone</Label>
                  <Input
                    id="guestPhone"
                    value={formData.guestPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, guestPhone: e.target.value })
                    }
                    placeholder="+1 234 567 890"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="guestId">ID Document</Label>
                  <Input
                    id="guestId"
                    value={formData.guestId}
                    onChange={(e) =>
                      setFormData({ ...formData, guestId: e.target.value })
                    }
                    placeholder="ID number"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Reservation Type</Label>
                <Tabs
                  value={formData.type}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      type: v as "room" | "table",
                      resourceId: "",
                    })
                  }
                >
                  <TabsList className="w-full">
                    <TabsTrigger value="room" className="flex-1">
                      <BedDouble className="mr-1.5 size-3.5" />
                      Room
                    </TabsTrigger>
                    <TabsTrigger value="table" className="flex-1">
                      <UtensilsCrossed className="mr-1.5 size-3.5" />
                      Table
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="room">
                    <Select
                      value={formData.resourceId}
                      onValueChange={(v) =>
                        setFormData({ ...formData, resourceId: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a room" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            Room {room.number} - {room.type} (${room.pricePerNight}/night)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TabsContent>
                  <TabsContent value="table">
                    <Select
                      value={formData.resourceId}
                      onValueChange={(v) =>
                        setFormData({ ...formData, resourceId: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a table" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTables.map((table) => (
                          <SelectItem key={table.id} value={table.id}>
                            Table {table.number} - {table.seats} seats ({table.location})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TabsContent>
                </Tabs>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="checkIn">
                    {formData.type === "room" ? "Check-in" : "Date"}
                  </Label>
                  <Input
                    id="checkIn"
                    type="date"
                    value={formData.checkIn}
                    onChange={(e) =>
                      setFormData({ ...formData, checkIn: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="checkOut">
                    {formData.type === "room" ? "Check-out" : "Time Slot End"}
                  </Label>
                  <Input
                    id="checkOut"
                    type="date"
                    value={formData.checkOut}
                    onChange={(e) =>
                      setFormData({ ...formData, checkOut: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button
                onClick={
                  editingReservation
                    ? handleModifyReservation
                    : handleCreateReservation
                }
                disabled={!formData.guestName || !formData.resourceId || !formData.checkIn}
              >
                {editingReservation ? "Save Changes" : "Create Reservation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Reservations</CardTitle>
          <CardDescription>
            Search and filter through all reservations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by guest name or reservation ID..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="checked-in">Checked-in</SelectItem>
                <SelectItem value="checked-out">Checked-out</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="room">Room</SelectItem>
                <SelectItem value="table">Table</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No reservations found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReservations.map((res) => (
                    <TableRow key={res.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {res.id}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {res.guest.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {res.guest.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {res.type === "room" ? (
                            <BedDouble className="size-3.5 text-muted-foreground" />
                          ) : (
                            <UtensilsCrossed className="size-3.5 text-muted-foreground" />
                          )}
                          <span className="text-sm capitalize text-foreground">
                            {res.type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {res.checkIn}
                        {res.checkIn !== res.checkOut && (
                          <> to {res.checkOut}</>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColor[res.status]}>
                          {res.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            res.paymentStatus === "paid"
                              ? "default"
                              : res.paymentStatus === "partial"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {res.paymentStatus}
                          {res.totalAmount > 0 && ` ($${res.totalAmount})`}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {res.status !== "cancelled" &&
                            res.status !== "checked-out" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(res)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() =>
                                    handleCancelReservation(res.id)
                                  }
                                >
                                  <X className="size-3.5" />
                                </Button>
                              </>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
