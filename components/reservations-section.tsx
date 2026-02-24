"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Plus,
  BedDouble,
  UtensilsCrossed,
  X,
  Loader2,
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
import { apiFetch } from "@/lib/api"

interface ResRow {
  reservationId: number
  customerId: number
  roomId?: number
  tableId?: number
  startDate: string
  endDate: string
  reservationType: string
  status: string
  guestName: string
  guestEmail: string
  guestPhone: string
  idCardNo: string
  roomNumber?: string
  tableNumber?: string
}

interface RoomOption { roomId: number; roomNumber: string; type: string; pricePerNight: number; status: string }
interface TableOption { tableId: number; tableNumber: string; capacity: number; status: string }

const statusColor: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Confirmed: "secondary",
  CheckedIn: "default",
  CheckedOut: "outline",
  Cancelled: "destructive",
}

export function ReservationsSection() {
  const [allReservations, setAllReservations] = useState<ResRow[]>([])
  const [rooms, setRooms] = useState<RoomOption[]>([])
  const [tables, setTables] = useState<TableOption[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRes, setEditingRes] = useState<ResRow | null>(null)

  const [formData, setFormData] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    guestId: "",
    type: "Room" as "Room" | "Table",
    resourceId: "",
    checkIn: "",
    checkOut: "",
  })

  useEffect(() => {
    Promise.all([
      apiFetch<ResRow[]>("/api/reservations"),
      apiFetch<RoomOption[]>("/api/rooms"),
      apiFetch<TableOption[]>("/api/tables"),
    ]).then(([resResult, roomResult, tableResult]) => {
      if (resResult.data) setAllReservations(resResult.data)
      if (roomResult.data) setRooms(roomResult.data)
      if (tableResult.data) setTables(tableResult.data)
      setLoading(false)
    })
  }, [])

  const filteredReservations = allReservations.filter((r) => {
    const matchesSearch =
      r.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(r.reservationId).includes(searchQuery)
    const matchesStatus = filterStatus === "all" || r.status === filterStatus
    const matchesType = filterType === "all" || r.reservationType === filterType
    return matchesSearch && matchesStatus && matchesType
  })

  const availableRooms = rooms.filter((r) => r.status === "Available")
  const availableTables = tables.filter((t) => t.status === "Available")

  function resetForm() {
    setFormData({ guestName: "", guestEmail: "", guestPhone: "", guestId: "", type: "Room", resourceId: "", checkIn: "", checkOut: "" })
    setEditingRes(null)
  }

  async function handleCreateReservation() {
    // First create/find customer
    const custResult = await apiFetch<{ customerId: number }>("/api/customers", {
      method: "POST",
      body: JSON.stringify({
        fullName: formData.guestName,
        email: formData.guestEmail,
        phone: formData.guestPhone,
        idCardNo: formData.guestId,
      }),
    })
    if (!custResult.data) return

    const { data } = await apiFetch<ResRow>("/api/reservations", {
      method: "POST",
      body: JSON.stringify({
        customerId: custResult.data.customerId,
        roomId: formData.type === "Room" ? parseInt(formData.resourceId) : null,
        tableId: formData.type === "Table" ? parseInt(formData.resourceId) : null,
        startDate: formData.checkIn,
        endDate: formData.checkOut,
        reservationType: formData.type,
      }),
    })
    if (data) {
      // Refetch reservations to get the joined data
      const fresh = await apiFetch<ResRow[]>("/api/reservations")
      if (fresh.data) setAllReservations(fresh.data)
    }
    setDialogOpen(false)
    resetForm()
  }

  async function handleModifyReservation() {
    if (!editingRes) return
    await apiFetch("/api/reservations", {
      method: "PATCH",
      body: JSON.stringify({
        reservationId: editingRes.reservationId,
        startDate: formData.checkIn,
        endDate: formData.checkOut,
      }),
    })
    const fresh = await apiFetch<ResRow[]>("/api/reservations")
    if (fresh.data) setAllReservations(fresh.data)
    setDialogOpen(false)
    resetForm()
  }

  async function handleCancelReservation(resId: number) {
    await apiFetch("/api/reservations", {
      method: "PATCH",
      body: JSON.stringify({ reservationId: resId, status: "Cancelled" }),
    })
    setAllReservations((prev) => prev.map((r) => (r.reservationId === resId ? { ...r, status: "Cancelled" } : r)))
  }

  function openEditDialog(res: ResRow) {
    setEditingRes(res)
    setFormData({
      guestName: res.guestName,
      guestEmail: res.guestEmail || "",
      guestPhone: res.guestPhone || "",
      guestId: res.idCardNo || "",
      type: res.reservationType as "Room" | "Table",
      resourceId: String(res.roomId || res.tableId || ""),
      checkIn: res.startDate?.split("T")[0] || "",
      checkOut: res.endDate?.split("T")[0] || "",
    })
    setDialogOpen(true)
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reservations</h1>
          <p className="text-sm text-muted-foreground">Create, modify, and manage all room and table reservations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 size-4" />New Reservation</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingRes ? "Modify Reservation" : "Create Reservation"}</DialogTitle>
              <DialogDescription>
                {editingRes ? `Editing reservation #${editingRes.reservationId}` : "Fill in the details to create a new reservation."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="guestName">Guest Name</Label>
                  <Input id="guestName" value={formData.guestName} onChange={(e) => setFormData({ ...formData, guestName: e.target.value })} placeholder="Full name" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="guestEmail">Email</Label>
                  <Input id="guestEmail" type="email" value={formData.guestEmail} onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })} placeholder="email@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="guestPhone">Phone</Label>
                  <Input id="guestPhone" value={formData.guestPhone} onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })} placeholder="+1 234 567 890" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="guestId">ID Document</Label>
                  <Input id="guestId" value={formData.guestId} onChange={(e) => setFormData({ ...formData, guestId: e.target.value })} placeholder="ID number" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Reservation Type</Label>
                <Tabs value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as "Room" | "Table", resourceId: "" })}>
                  <TabsList className="w-full">
                    <TabsTrigger value="Room" className="flex-1"><BedDouble className="mr-1.5 size-3.5" />Room</TabsTrigger>
                    <TabsTrigger value="Table" className="flex-1"><UtensilsCrossed className="mr-1.5 size-3.5" />Table</TabsTrigger>
                  </TabsList>
                  <TabsContent value="Room">
                    <Select value={formData.resourceId} onValueChange={(v) => setFormData({ ...formData, resourceId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select a room" /></SelectTrigger>
                      <SelectContent>
                        {availableRooms.map((room) => (
                          <SelectItem key={room.roomId} value={String(room.roomId)}>
                            Room {room.roomNumber} - {room.type} (${room.pricePerNight}/night)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TabsContent>
                  <TabsContent value="Table">
                    <Select value={formData.resourceId} onValueChange={(v) => setFormData({ ...formData, resourceId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select a table" /></SelectTrigger>
                      <SelectContent>
                        {availableTables.map((table) => (
                          <SelectItem key={table.tableId} value={String(table.tableId)}>
                            Table {table.tableNumber} - {table.capacity} seats
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TabsContent>
                </Tabs>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="checkIn">{formData.type === "Room" ? "Check-in" : "Date"}</Label>
                  <Input id="checkIn" type="date" value={formData.checkIn} onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="checkOut">{formData.type === "Room" ? "Check-out" : "Time Slot End"}</Label>
                  <Input id="checkOut" type="date" value={formData.checkOut} onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={editingRes ? handleModifyReservation : handleCreateReservation} disabled={!formData.guestName || !formData.resourceId || !formData.checkIn}>
                {editingRes ? "Save Changes" : "Create Reservation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Reservations</CardTitle>
          <CardDescription>Search and filter through all reservations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by guest name or reservation ID..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="CheckedIn">Checked-in</SelectItem>
                <SelectItem value="CheckedOut">Checked-out</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Room">Room</SelectItem>
                <SelectItem value="Table">Table</SelectItem>
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No reservations found.</TableCell>
                  </TableRow>
                ) : (
                  filteredReservations.map((res) => (
                    <TableRow key={res.reservationId}>
                      <TableCell className="font-mono text-xs text-muted-foreground">#{res.reservationId}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-foreground">{res.guestName}</p>
                          <p className="text-xs text-muted-foreground">{res.guestEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {res.reservationType === "Room" ? <BedDouble className="size-3.5 text-muted-foreground" /> : <UtensilsCrossed className="size-3.5 text-muted-foreground" />}
                          <span className="text-sm text-foreground">{res.reservationType}</span>
                          {res.roomNumber && <span className="text-xs text-muted-foreground">({res.roomNumber})</span>}
                          {res.tableNumber && <span className="text-xs text-muted-foreground">({res.tableNumber})</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {res.startDate?.split("T")[0]}
                        {res.startDate?.split("T")[0] !== res.endDate?.split("T")[0] && <> to {res.endDate?.split("T")[0]}</>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColor[res.status] || "outline"}>{res.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {res.status !== "Cancelled" && res.status !== "CheckedOut" && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(res)}>Edit</Button>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleCancelReservation(res.reservationId)}>
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
