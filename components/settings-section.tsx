"use client"

import { useState } from "react"
import {
  Plus,
  Pencil,
  BedDouble,
  UtensilsCrossed,
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
  rooms as initialRooms,
  tables as initialTables,
  availableServices,
  type Room,
  type RestaurantTable,
} from "@/lib/hotel-data"

export function SettingsSection() {
  const [allRooms, setAllRooms] = useState<Room[]>(initialRooms)
  const [allTables, setAllTables] = useState<RestaurantTable[]>(initialTables)
  const [roomDialogOpen, setRoomDialogOpen] = useState(false)
  const [tableDialogOpen, setTableDialogOpen] = useState(false)

  const [newRoom, setNewRoom] = useState({
    number: "",
    type: "single" as Room["type"],
    floor: "1",
    price: "",
    capacity: "1",
  })

  const [newTable, setNewTable] = useState({
    number: "",
    seats: "2",
    location: "indoor" as RestaurantTable["location"],
  })

  function handleAddRoom() {
    const room: Room = {
      id: `r-${Date.now()}`,
      number: newRoom.number,
      type: newRoom.type,
      floor: parseInt(newRoom.floor),
      pricePerNight: parseFloat(newRoom.price),
      status: "available",
      capacity: parseInt(newRoom.capacity),
    }
    setAllRooms((prev) => [...prev, room])
    setRoomDialogOpen(false)
    setNewRoom({ number: "", type: "single", floor: "1", price: "", capacity: "1" })
  }

  function handleAddTable() {
    const table: RestaurantTable = {
      id: `t-${Date.now()}`,
      number: newTable.number,
      seats: parseInt(newTable.seats),
      location: newTable.location,
      status: "available",
    }
    setAllTables((prev) => [...prev, table])
    setTableDialogOpen(false)
    setNewTable({ number: "", seats: "2", location: "indoor" })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage rooms, tables, and price configurations (Administrator)
        </p>
      </div>

      <Tabs defaultValue="rooms">
        <TabsList>
          <TabsTrigger value="rooms">
            <BedDouble className="mr-1.5 size-3.5" />
            Rooms
          </TabsTrigger>
          <TabsTrigger value="tables">
            <UtensilsCrossed className="mr-1.5 size-3.5" />
            Tables
          </TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Room Configuration</CardTitle>
                  <CardDescription>
                    Add or edit rooms in the hotel
                  </CardDescription>
                </div>
                <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-1 size-3.5" />
                      Add Room
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Room</DialogTitle>
                      <DialogDescription>
                        Configure a new room for the hotel
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <Label>Room Number</Label>
                          <Input
                            value={newRoom.number}
                            onChange={(e) =>
                              setNewRoom({ ...newRoom, number: e.target.value })
                            }
                            placeholder="e.g. 401"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Type</Label>
                          <Select
                            value={newRoom.type}
                            onValueChange={(v) =>
                              setNewRoom({
                                ...newRoom,
                                type: v as Room["type"],
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">Single</SelectItem>
                              <SelectItem value="double">Double</SelectItem>
                              <SelectItem value="suite">Suite</SelectItem>
                              <SelectItem value="deluxe">Deluxe</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-2">
                          <Label>Floor</Label>
                          <Input
                            type="number"
                            value={newRoom.floor}
                            onChange={(e) =>
                              setNewRoom({ ...newRoom, floor: e.target.value })
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Price/Night</Label>
                          <Input
                            type="number"
                            value={newRoom.price}
                            onChange={(e) =>
                              setNewRoom({ ...newRoom, price: e.target.value })
                            }
                            placeholder="$"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Capacity</Label>
                          <Input
                            type="number"
                            value={newRoom.capacity}
                            onChange={(e) =>
                              setNewRoom({
                                ...newRoom,
                                capacity: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleAddRoom}
                        disabled={!newRoom.number || !newRoom.price}
                      >
                        Add Room
                      </Button>
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
                    {allRooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium text-foreground">
                          {room.number}
                        </TableCell>
                        <TableCell className="capitalize text-foreground">
                          {room.type}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {room.floor}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {room.capacity}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          ${room.pricePerNight}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {room.status}
                          </Badge>
                        </TableCell>
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
                  <CardTitle className="text-base">
                    Table Configuration
                  </CardTitle>
                  <CardDescription>
                    Add or edit restaurant tables
                  </CardDescription>
                </div>
                <Dialog
                  open={tableDialogOpen}
                  onOpenChange={setTableDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-1 size-3.5" />
                      Add Table
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Table</DialogTitle>
                      <DialogDescription>
                        Configure a new restaurant table
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="flex flex-col gap-2">
                        <Label>Table Number</Label>
                        <Input
                          value={newTable.number}
                          onChange={(e) =>
                            setNewTable({
                              ...newTable,
                              number: e.target.value,
                            })
                          }
                          placeholder="e.g. T9"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <Label>Seats</Label>
                          <Input
                            type="number"
                            value={newTable.seats}
                            onChange={(e) =>
                              setNewTable({
                                ...newTable,
                                seats: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Location</Label>
                          <Select
                            value={newTable.location}
                            onValueChange={(v) =>
                              setNewTable({
                                ...newTable,
                                location: v as RestaurantTable["location"],
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="indoor">Indoor</SelectItem>
                              <SelectItem value="terrace">Terrace</SelectItem>
                              <SelectItem value="private">Private</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleAddTable}
                        disabled={!newTable.number}
                      >
                        Add Table
                      </Button>
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
                    {allTables.map((table) => (
                      <TableRow key={table.id}>
                        <TableCell className="font-medium text-foreground">
                          {table.number}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {table.seats}
                        </TableCell>
                        <TableCell className="capitalize text-foreground">
                          {table.location}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {table.status}
                          </Badge>
                        </TableCell>
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
              <CardDescription>
                Current pricing for additional services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableServices.map((svc) => (
                      <TableRow key={svc.name}>
                        <TableCell className="font-medium text-foreground">
                          {svc.name}
                        </TableCell>
                        <TableCell className="text-right font-medium text-foreground">
                          ${svc.price}
                        </TableCell>
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
