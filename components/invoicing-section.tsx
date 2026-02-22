"use client"

import { useState } from "react"
import {
  FileText,
  CreditCard,
  Printer,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
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
  type Reservation,
  type PaymentStatus,
} from "@/lib/hotel-data"

export function InvoicingSection() {
  const [allReservations, setAllReservations] = useState<Reservation[]>(initialReservations)
  const [selectedInvoice, setSelectedInvoice] = useState<Reservation | null>(null)

  const billableReservations = allReservations.filter(
    (r) => r.type === "room" && (r.status === "checked-in" || r.status === "checked-out")
  )

  function getRoomInfo(roomId?: string) {
    if (!roomId) return { number: "N/A", pricePerNight: 0, type: "N/A" }
    const room = rooms.find((r) => r.id === roomId)
    return room
      ? { number: room.number, pricePerNight: room.pricePerNight, type: room.type }
      : { number: "N/A", pricePerNight: 0, type: "N/A" }
  }

  function calculateNights(checkIn: string, checkOut: string) {
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
  }

  function recordPayment(resId: string) {
    setAllReservations((prev) =>
      prev.map((r) =>
        r.id === resId
          ? { ...r, paymentStatus: "paid" as PaymentStatus }
          : r
      )
    )
    setSelectedInvoice(null)
  }

  const totalPaid = allReservations
    .filter((r) => r.paymentStatus === "paid")
    .reduce((sum, r) => sum + r.totalAmount, 0)
  const totalPending = allReservations
    .filter((r) => r.paymentStatus === "pending")
    .reduce((sum, r) => sum + r.totalAmount, 0)
  const totalPartial = allReservations
    .filter((r) => r.paymentStatus === "partial")
    .reduce((sum, r) => sum + r.totalAmount, 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Invoicing & Payments
        </h1>
        <p className="text-sm text-muted-foreground">
          Generate invoices and record payments for guest stays
        </p>
      </div>

      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Paid</p>
            <p className="text-2xl font-bold text-success">
              ${totalPaid.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-warning-foreground">
              ${totalPending.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Partial</p>
            <p className="text-2xl font-bold text-primary">
              ${totalPartial.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Billable Stays</CardTitle>
          <CardDescription>
            Guests with active or completed stays requiring invoicing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reservation</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Stay</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billableReservations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No billable reservations.
                    </TableCell>
                  </TableRow>
                ) : (
                  billableReservations.map((res) => {
                    const roomInfo = getRoomInfo(res.roomId)
                    const nights = calculateNights(res.checkIn, res.checkOut)
                    return (
                      <TableRow key={res.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {res.id}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {res.guest.name}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-foreground">
                            {roomInfo.number}
                          </span>
                          <span className="ml-1 text-xs text-muted-foreground capitalize">
                            ({roomInfo.type})
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-foreground">
                          {nights} night{nights > 1 ? "s" : ""}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          ${res.totalAmount}
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
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedInvoice(res)}
                            >
                              <FileText className="mr-1 size-3.5" />
                              Invoice
                            </Button>
                            {res.paymentStatus !== "paid" && (
                              <Button
                                size="sm"
                                onClick={() => recordPayment(res.id)}
                              >
                                <CreditCard className="mr-1 size-3.5" />
                                Pay
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedInvoice}
        onOpenChange={(open) => !open && setSelectedInvoice(null)}
      >
        {selectedInvoice && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                Invoice {selectedInvoice.id}
              </DialogTitle>
              <DialogDescription>
                Generated for {selectedInvoice.guest.name}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="mb-4 rounded-lg bg-muted p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Guest:</span>
                    <p className="font-medium text-foreground">
                      {selectedInvoice.guest.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Room:</span>
                    <p className="font-medium text-foreground">
                      {getRoomInfo(selectedInvoice.roomId).number}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Check-in:</span>
                    <p className="font-medium text-foreground">
                      {selectedInvoice.checkIn}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Check-out:</span>
                    <p className="font-medium text-foreground">
                      {selectedInvoice.checkOut}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Room (
                    {calculateNights(
                      selectedInvoice.checkIn,
                      selectedInvoice.checkOut
                    )}{" "}
                    nights x ${getRoomInfo(selectedInvoice.roomId).pricePerNight})
                  </span>
                  <span className="text-foreground">
                    $
                    {calculateNights(
                      selectedInvoice.checkIn,
                      selectedInvoice.checkOut
                    ) * getRoomInfo(selectedInvoice.roomId).pricePerNight}
                  </span>
                </div>
                {selectedInvoice.services.map((svc) => (
                  <div
                    key={svc.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">
                      {svc.name} (x{svc.quantity})
                    </span>
                    <span className="text-foreground">
                      ${svc.price * svc.quantity}
                    </span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">
                    ${selectedInvoice.totalAmount}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer className="mr-1 size-3.5" />
                Print
              </Button>
              {selectedInvoice.paymentStatus !== "paid" && (
                <Button
                  size="sm"
                  onClick={() => recordPayment(selectedInvoice.id)}
                >
                  <CreditCard className="mr-1 size-3.5" />
                  Record Payment
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
