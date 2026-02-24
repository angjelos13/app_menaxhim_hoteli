"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  BedDouble,
  UtensilsCrossed,
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

interface RoomRow { roomId: number; roomNumber: string; type: string; floor: number; pricePerNight: number; status: string; capacity: number }
interface TableRow2 { tableId: number; tableNumber: string; capacity: number; status: string; location: string }
interface ServiceRow { serviceId: number; name: string; unitPrice: number; category: string }

export function SettingsSection() {
  const [rooms, setRooms] = useState<RoomRow[]>([])
  const [tables, setTables] = useState<TableRow2[]>([])
  const [services, setServices] = useState<ServiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [roomDialogOpen, setRoomDialogOpen] = useState(false)
  const [tableDialogOpen, setTableDialogOpen] = useState(false)

  const [newRoom, setNewRoom] = useState({ roomNumber: "", type: "Single", floor: "1", pricePerNight: "", capacity: "1" })
  const [newTable, setNewTable] = useState({ tableNumber: "", capacity: "2", location: "Indoor" })

  async function load() {
    setLoading(true)
    try {
      const [r, t, s] = await Promise.all([
        apiFetch("/api/rooms"),
        apiFetch("/api/tables"),
        apiFetch("/api/services"),
      ])
      setRooms(r)
      setTables(t)
      setServices(s)
    } catch { /* empty */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAddRoom() {
    try {
      await apiFetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomNumber: newRoom.roomNumber,
          type: newRoom.type,
          floor: parseInt(newRoom.floor),
          pricePerNight: parseFloat(newRoom.pricePerNight),
          capacity: parseInt(newRoom.capacity),
        }),
      })
      await load()
      setRoomDialogOpen(false)
      setNewRoom({ roomNumber: "", type: "Single", floor: "1", pricePerNight: "", capacity: "1" })
    } catch { /* empty */ }
  }

  async function handleAddTable() {
    try {
      await apiFetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: newTable.tableNumber,
          capacity: parseInt(newTable.capacity),
          location: newTable.location,
        }),
      })
      await load()
      setTableDialogOpen(false)
      setNewTable({ tableNumber: "", capacity: "2", location: "Indoor" })
    } catch { /* empty */ }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage rooms, tables, and price configurations (Administrator)</p>
      </div>

      <Tabs defaultValue="rooms">
        <TabsList>
          <TabsTrigger value="rooms"><BedDouble className="mr-1.5 size-3.5" />Rooms</TabsTrigger>
          <TabsTrigger value="tables"><UtensilsCrossed className="mr-1.5 size-3.5" />Tables</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Room Configuration</CardTitle>
                  <CardDescription>Add or edit rooms in the hotel</CardDescription>
                </div>
                <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="mr-1 size-3.5" />Add Room</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Room</DialogTitle>
                      <DialogDescription>Configure a new room for the hotel</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <Label>Room Number</Label>
                          <Input value={newRoom.roomNumber} onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })} placeholder="e.g. 401" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Type</Label>
                          <Select value={newRoom.type} onValueChange={(v) => setNewRoom({ ...newRoom, type: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Single">Single</SelectItem>
                              <SelectItem value="Double">Double</SelectItem>
                              <SelectItem value="Suite">Suite</SelectItem>
                              <SelectItem value="Deluxe">Deluxe</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-2">
                          <Label>Floor</Label>
                          <Input type="number" value={newRoom.floor} onChange={(e) => setNewRoom({ ...newRoom, floor: e.target.value })} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Price/Night</Label>
                          <Input type="number" value={newRoom.pricePerNight} onChange={(e) => setNewRoom({ ...newRoom, pricePerNight: e.target.value })} placeholder="$" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Capacity</Label>
                          <Input type="number" value={newRoom.capacity} onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })} />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddRoom} disabled={!newRoom.roomNumber || !newRoom.pricePerNight}>Add Room</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Floor</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Price/Night</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow key={room.roomId}>
                        <TableCell className="font-medium text-foreground">{room.roomNumber}</TableCell>
                        <TableCell className="capitalize text-foreground">{room.type}</TableCell>
                        <TableCell className="text-foreground">{room.floor}</TableCell>
                        <TableCell className="text-foreground">{room.capacity}</TableCell>
                        <TableCell className="font-medium text-foreground">${room.pricePerNight}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{room.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Table Configuration</CardTitle>
                  <CardDescription>Add or edit restaurant tables</CardDescription>
                </div>
                <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="mr-1 size-3.5" />Add Table</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Table</DialogTitle>
                      <DialogDescription>Configure a new restaurant table</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="flex flex-col gap-2">
                        <Label>Table Number</Label>
                        <Input value={newTable.tableNumber} onChange={(e) => setNewTable({ ...newTable, tableNumber: e.target.value })} placeholder="e.g. T9" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <Label>Seats</Label>
                          <Input type="number" value={newTable.capacity} onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Location</Label>
                          <Select value={newTable.location} onValueChange={(v) => setNewTable({ ...newTable, location: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Indoor">Indoor</SelectItem>
                              <SelectItem value="Terrace">Terrace</SelectItem>
                              <SelectItem value="Private">Private</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddTable} disabled={!newTable.tableNumber}>Add Table</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Number</TableHead>
                      <TableHead>Seats</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tables.map((table) => (
                      <TableRow key={table.tableId}>
                        <TableCell className="font-medium text-foreground">{table.tableNumber}</TableCell>
                        <TableCell className="text-foreground">{table.capacity}</TableCell>
                        <TableCell className="capitalize text-foreground">{table.location}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{table.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Service Price List</CardTitle>
              <CardDescription>Current pricing for additional services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((svc) => (
                      <TableRow key={svc.serviceId}>
                        <TableCell className="font-medium text-foreground">{svc.name}</TableCell>
                        <TableCell className="capitalize text-muted-foreground">{svc.category}</TableCell>
                        <TableCell className="text-right font-medium text-foreground">${svc.unitPrice}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
