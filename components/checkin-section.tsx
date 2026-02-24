"use client"

import { useState, useEffect } from "react"
import { UserCheck, LogOut, Plus, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { apiFetch } from "@/lib/api"

interface ResRow {
  reservationId: number
  status: string
  reservationType: string
  startDate: string
  endDate: string
  guestName: string
  guestEmail: string
  roomNumber?: string
  tableNumber?: string
  roomId?: number
  tableId?: number
}

interface ServiceOption {
  serviceId: number
  name: string
  unitPrice: number
  category: string
}

export function CheckinSection() {
  const [reservations, setReservations] = useState<ResRow[]>([])
  const [services, setServices] = useState<ServiceOption[]>([])
  const [loading, setLoading] = useState(true)
  const [serviceDialog, setServiceDialog] = useState<number | null>(null)
  const [selectedService, setSelectedService] = useState("")

  useEffect(() => {
    Promise.all([
      apiFetch<ResRow[]>("/api/reservations"),
      apiFetch<ServiceOption[]>("/api/services"),
    ]).then(([resResult, svcResult]) => {
      if (resResult.data) setReservations(resResult.data)
      if (svcResult.data) setServices(svcResult.data)
      setLoading(false)
    })
  }, [])

  const confirmedReservations = reservations.filter((r) => r.status === "Confirmed" && r.reservationType === "Room")
  const checkedInReservations = reservations.filter((r) => r.status === "CheckedIn" && r.reservationType === "Room")

  async function handleCheckIn(resId: number) {
    const { data } = await apiFetch("/api/reservations/checkin", {
      method: "POST",
      body: JSON.stringify({ reservationId: resId }),
    })
    if (data) {
      setReservations((prev) => prev.map((r) => (r.reservationId === resId ? { ...r, status: "CheckedIn" } : r)))
    }
  }

  async function handleCheckOut(resId: number) {
    const { data } = await apiFetch("/api/reservations/checkout", {
      method: "POST",
      body: JSON.stringify({ reservationId: resId }),
    })
    if (data) {
      setReservations((prev) => prev.map((r) => (r.reservationId === resId ? { ...r, status: "CheckedOut" } : r)))
    }
  }

  async function handleAddService(resId: number) {
    if (!selectedService) return
    // Service usage requires an invoice -- simplified for now
    setSelectedService("")
    setServiceDialog(null)
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
        <h1 className="text-2xl font-semibold text-foreground">Check-in / Check-out</h1>
        <p className="text-sm text-muted-foreground">Process guest arrivals, departures, and add services to their stay</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCheck className="size-4 text-success" />
              Pending Check-ins
            </CardTitle>
            <CardDescription>Confirmed reservations ready for check-in</CardDescription>
          </CardHeader>
          <CardContent>
            {confirmedReservations.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No pending check-ins.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {confirmedReservations.map((res) => (
                  <div key={res.reservationId} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="font-medium text-foreground">{res.guestName}</p>
                      <p className="text-xs text-muted-foreground">Room {res.roomNumber || "N/A"} | {res.startDate?.split("T")[0]} to {res.endDate?.split("T")[0]}</p>
                      <p className="text-xs text-muted-foreground">#{res.reservationId}</p>
                    </div>
                    <Button size="sm" onClick={() => handleCheckIn(res.reservationId)}>
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
            <CardDescription>Guests currently staying at the hotel</CardDescription>
          </CardHeader>
          <CardContent>
            {checkedInReservations.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No guests currently checked-in.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {checkedInReservations.map((res) => (
                  <div key={res.reservationId} className="rounded-lg border border-border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{res.guestName}</p>
                        <p className="text-xs text-muted-foreground">Room {res.roomNumber || "N/A"} | Check-out: {res.endDate?.split("T")[0]}</p>
                      </div>
                      <Badge variant="default">Checked-in</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">#{res.reservationId}</p>
                      <div className="flex gap-2">
                        <Dialog open={serviceDialog === res.reservationId} onOpenChange={(open) => setServiceDialog(open ? res.reservationId : null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm"><Plus className="mr-1 size-3" />Service</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Service</DialogTitle>
                              <DialogDescription>Add a service to {res.guestName}{"'"}s stay</DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <Select value={selectedService} onValueChange={setSelectedService}>
                                <SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger>
                                <SelectContent>
                                  {services.map((svc) => (
                                    <SelectItem key={svc.serviceId} value={String(svc.serviceId)}>
                                      {svc.name} - ${svc.unitPrice}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <DialogFooter>
                              <Button onClick={() => handleAddService(res.reservationId)} disabled={!selectedService}>Add Service</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button size="sm" variant="outline" onClick={() => handleCheckOut(res.reservationId)}>
                          <LogOut className="mr-1 size-3" />Check-out
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
