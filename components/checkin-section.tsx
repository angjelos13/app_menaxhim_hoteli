"use client"

import { useState } from "react"
import {
  UserCheck,
  LogOut,
  Plus,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  reservations as initialReservations,
  rooms,
  availableServices,
  type Reservation,
  type ReservationStatus,
} from "@/lib/hotel-data"

export function CheckinSection() {
  const [allReservations, setAllReservations] = useState<Reservation[]>(initialReservations)
  const [serviceDialog, setServiceDialog] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState("")

  const confirmedReservations = allReservations.filter(
    (r) => r.status === "confirmed" && r.type === "room"
  )
  const checkedInReservations = allReservations.filter(
    (r) => r.status === "checked-in" && r.type === "room"
  )

  function handleCheckIn(resId: string) {
    setAllReservations((prev) =>
      prev.map((r) =>
        r.id === resId
          ? { ...r, status: "checked-in" as ReservationStatus }
          : r
      )
    )
  }

  function handleCheckOut(resId: string) {
    setAllReservations((prev) =>
      prev.map((r) =>
        r.id === resId
          ? { ...r, status: "checked-out" as ReservationStatus }
          : r
      )
    )
  }

  function handleAddService(resId: string) {
    if (!selectedService) return
    const svc = availableServices.find((s) => s.name === selectedService)
    if (!svc) return
    setAllReservations((prev) =>
      prev.map((r) =>
        r.id === resId
          ? {
              ...r,
              services: [
                ...r.services,
                {
                  id: `s-${Date.now()}`,
                  name: svc.name,
                  price: svc.price,
                  quantity: 1,
                },
              ],
              totalAmount:
                r.totalAmount + svc.price,
            }
          : r
      )
    )
    setSelectedService("")
    setServiceDialog(null)
  }

  function getRoomNumber(roomId?: string) {
    if (!roomId) return "N/A"
    const room = rooms.find((r) => r.id === roomId)
    return room ? room.number : "N/A"
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Check-in / Check-out
        </h1>
        <p className="text-sm text-muted-foreground">
          Process guest arrivals, departures, and add services to their stay
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCheck className="size-4 text-success" />
              Pending Check-ins
            </CardTitle>
            <CardDescription>
              Confirmed reservations ready for check-in
            </CardDescription>
          </CardHeader>
          <CardContent>
            {confirmedReservations.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No pending check-ins.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {confirmedReservations.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {res.guest.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Room {getRoomNumber(res.roomId)} | {res.checkIn} to{" "}
                        {res.checkOut}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {res.id}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => handleCheckIn(res.id)}>
                      <UserCheck className="mr-1.5 size-3.5" />
                      Check-in
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LogOut className="size-4 text-primary" />
              Currently Checked-in
            </CardTitle>
            <CardDescription>
              Guests currently staying at the hotel
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checkedInReservations.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No guests currently checked-in.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {checkedInReservations.map((res) => (
                  <div
                    key={res.id}
                    className="rounded-lg border border-border p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          {res.guest.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Room {getRoomNumber(res.roomId)} | Check-out:{" "}
                          {res.checkOut}
                        </p>
                      </div>
                      <Badge variant="default">Checked-in</Badge>
                    </div>

                    {res.services.length > 0 && (
                      <div className="mb-3 rounded-md bg-muted p-2.5">
                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                          Services:
                        </p>
                        {res.services.map((svc) => (
                          <div
                            key={svc.id}
                            className="flex items-center justify-between text-xs text-foreground"
                          >
                            <span>
                              {svc.name} (x{svc.quantity})
                            </span>
                            <span>${svc.price * svc.quantity}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">
                        Total: ${res.totalAmount}
                      </p>
                      <div className="flex gap-2">
                        <Dialog
                          open={serviceDialog === res.id}
                          onOpenChange={(open) =>
                            setServiceDialog(open ? res.id : null)
                          }
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Plus className="mr-1 size-3" />
                              Service
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Service</DialogTitle>
                              <DialogDescription>
                                Add a service to {res.guest.name}{"'"}s stay
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <Select
                                value={selectedService}
                                onValueChange={setSelectedService}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a service" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableServices.map((svc) => (
                                    <SelectItem
                                      key={svc.name}
                                      value={svc.name}
                                    >
                                      {svc.name} - ${svc.price}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={() => handleAddService(res.id)}
                                disabled={!selectedService}
                              >
                                Add Service
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCheckOut(res.id)}
                        >
                          <LogOut className="mr-1 size-3" />
                          Check-out
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
