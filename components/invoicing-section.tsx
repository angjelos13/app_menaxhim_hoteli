"use client"

import { useState, useEffect } from "react"
import {
  FileText,
  CreditCard,
  Printer,
  Loader2,
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
import { apiFetch } from "@/lib/api"

interface InvoiceRow {
  invoiceId: number
  reservationId: number
  guestName: string
  roomNumber: string
  roomType: string
  checkIn: string
  checkOut: string
  nights: number
  pricePerNight: number
  roomTotal: number
  servicesTotal: number
  subtotal: number
  tax: number
  total: number
  invoiceStatus: string
  paymentStatus: string
  services: { name: string; quantity: number; unitPrice: number; totalPrice: number }[]
}

export function InvoicingSection() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const nights = Number(invoices.nights ?? 0)
  const pricePerNight = Number(invoices.pricePerNight ?? 0)
  const roomTotal = Number(invoices.roomTotal ?? (nights * pricePerNight))


  async function load() {
    setLoading(true)
    setErrorMsg(null)

    try {
      const { data } = await apiFetch<any>("/api/invoices")

      const list: InvoiceRow[] =
        Array.isArray(data) ? data :
        Array.isArray(data?.invoices) ? data.invoices :
        Array.isArray(data?.recordset) ? data.recordset :
        []

      setInvoices(list)
    } catch (e: any) {
      console.error("Invoices load failed:", e)
      setInvoices([])
      setErrorMsg(e?.message ?? "Failed to load invoices")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const totalPaid = invoices
    .filter((i) => i.paymentStatus === "Paid")
    .reduce((s, i) => s + i.total, 0)

  const totalPending = invoices
    .filter((i) => i.paymentStatus === "Pending" || i.paymentStatus === "Issued")
    .reduce((s, i) => s + i.total, 0)

  const totalPartial = invoices
    .filter((i) => i.paymentStatus === "Partial")
    .reduce((s, i) => s + i.total, 0)

  async function recordPayment(invoiceId: number) {
    try {
      await apiFetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          amount: invoices.find((i) => i.invoiceId === invoiceId)?.total ?? 0,
          method: "Cash",
        }),
      })
      await load()
      setSelectedInvoice(null)
    } catch { /* empty */ }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (errorMsg) {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-destructive">
      {errorMsg}
    </div>
  )
}

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Invoicing & Payments</h1>
        <p className="text-sm text-muted-foreground">Generate invoices and record payments for guest stays</p>
      </div>

      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Paid</p>
            <p className="text-2xl font-bold text-success">${totalPaid.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-warning-foreground">${totalPending.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Partial</p>
            <p className="text-2xl font-bold text-primary">${totalPartial.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoices</CardTitle>
          <CardDescription>All generated invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Stay</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No invoices found.</TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.invoiceId}>
                      <TableCell className="font-mono text-xs text-muted-foreground">INV-{inv.invoiceId}</TableCell>
                      <TableCell className="font-medium text-foreground">{inv.guestName}</TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">{inv.roomNumber}</span>
                        <span className="ml-1 text-xs text-muted-foreground capitalize">({inv.roomType})</span>
                      </TableCell>
                      <TableCell className="text-sm text-foreground">{inv.nights} night{inv.nights > 1 ? "s" : ""}</TableCell>
                      <TableCell className="font-semibold text-foreground">${inv.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={inv.paymentStatus === "Paid" ? "default" : inv.paymentStatus === "Partial" ? "secondary" : "outline"}>
                          {inv.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(inv)}>
                            <FileText className="mr-1 size-3.5" />Invoice
                          </Button>
                          {inv.paymentStatus !== "Paid" && (
                            <Button
                              size="sm"
                              type="button"
                              onClick={() => {
                                console.log("PAY CLICK", inv.invoiceId, inv)
                                recordPayment(inv.invoiceId)
                              }}
                            >
                              <CreditCard className="mr-1 size-3.5" />Pay
                            </Button>
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

      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        {selectedInvoice && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                Invoice INV-{selectedInvoice.invoiceId}
              </DialogTitle>
              <DialogDescription>Generated for {selectedInvoice.guestName}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="mb-4 rounded-lg bg-muted p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Guest:</span>
                    <p className="font-medium text-foreground">{selectedInvoice.guestName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Room:</span>
                    <p className="font-medium text-foreground">{selectedInvoice.roomNumber}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Check-in:</span>
                    <p className="font-medium text-foreground">{new Date(selectedInvoice.checkIn).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Check-out:</span>
                    <p className="font-medium text-foreground">{new Date(selectedInvoice.checkOut).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Room ({selectedInvoice.nights} nights x ${selectedInvoice.pricePerNight})</span>
                  <span className="text-foreground">
                      ${Number(
                        selectedInvoice.roomTotal ??
                        (Number(selectedInvoice.nights) * Number(selectedInvoice.pricePerNight))
                      ).toFixed(2)}
                    </span>
                </div>
                {(selectedInvoice.services ?? []).map((svc, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{svc.name} (x{svc.quantity})</span>
                    <span className="text-foreground">${svc.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">${selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="text-foreground">${selectedInvoice.tax.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">${selectedInvoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="mr-1 size-3.5" />Print
              </Button>
              {selectedInvoice.paymentStatus !== "Paid" && (
                <Button size="sm" onClick={() => recordPayment(selectedInvoice.invoiceId)}>
                  <CreditCard className="mr-1 size-3.5" />Record Payment
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
