"use client"

import { useState, useEffect } from "react"
import { Package, AlertTriangle, Minus, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { apiFetch } from "@/lib/api"

interface InventoryRow {
  itemId: number
  name: string
  unit: string
  quantityOnHand: number
  minThreshold: number
  category: string
}

export function InventorySection() {
  const [items, setItems] = useState<InventoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState("all")
  const [outflowDialog, setOutflowDialog] = useState<number | null>(null)
  const [outflowAmount, setOutflowAmount] = useState("")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setErrorMsg(null)

    try {
      const { data } = await apiFetch<any>("/api/inventory")

      const list: InventoryRow[] =
        Array.isArray(data) ? data :
        Array.isArray(data?.items) ? data.items :
        Array.isArray(data?.recordset) ? data.recordset :
        []

      setItems(list)
    } catch (e: any) {
      console.error("Inventory load failed:", e)
      setItems([])
      setErrorMsg(e?.message ?? "Failed to load inventory")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const safeItems = Array.isArray(items) ? items : []

  const filteredItems = safeItems.filter(
    (i) => filterCategory === "all" || i.category === filterCategory
  )
  const lowStockCount = safeItems.filter((i) => i.quantityOnHand < i.minThreshold).length
  const healthyCount = safeItems.filter((i) => i.quantityOnHand >= i.minThreshold).length
  const categories = [...new Set(safeItems.map((i) => i.category).filter(Boolean))]

  async function handleOutflow(itemId: number) {
    const amount = parseInt(outflowAmount, 10)
    if (isNaN(amount) || amount <= 0) return

    try {
      await apiFetch("/api/inventory/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, type: "Outflow", quantity: amount, notes: "Manual outflow" }),
      })
      await load()
    } catch (e) {
      console.error("Outflow failed:", e)
    } finally {
      setOutflowAmount("")
      setOutflowDialog(null)
    }
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
        <h1 className="text-2xl font-semibold text-foreground">Inventory Management</h1>
        <p className="text-sm text-muted-foreground">Track inventory levels and register usage (Operational Staff)</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{safeItems.length}</p>
              <p className="text-xs text-muted-foreground">Total Items</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-success/10">
              <Package className="size-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{healthyCount}</p>
              <p className="text-xs text-muted-foreground">Healthy Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{lowStockCount}</p>
              <p className="text-xs text-muted-foreground">Low Stock</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base">Inventory Items</CardTitle>
              <CardDescription>View stock levels and register usage outflows</CardDescription>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    <span className="capitalize">{c}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {filteredItems.map((item) => {
              const percentage = Math.min(100, (item.quantityOnHand / (item.minThreshold * 2)) * 100)
              const isLow = item.quantityOnHand < item.minThreshold
              return (
                <div
                  key={item.itemId}
                  className={`rounded-lg border p-4 ${isLow ? "border-destructive/30 bg-destructive/5" : "border-border"}`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{item.name}</span>
                      <Badge variant="outline" className="capitalize text-xs">{item.category || "General"}</Badge>
                      {isLow && <Badge variant="destructive" className="text-xs">Low Stock</Badge>}
                    </div>

                    <Dialog
                      open={outflowDialog === item.itemId}
                      onOpenChange={(open) => setOutflowDialog(open ? item.itemId : null)}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Minus className="mr-1 size-3" />Register Outflow
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Register Inventory Usage</DialogTitle>
                          <DialogDescription>
                            Record an outflow for {item.name}. Current stock: {item.quantityOnHand} {item.unit}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Label htmlFor="outflowAmount">Amount ({item.unit})</Label>
                          <Input
                            id="outflowAmount"
                            type="number"
                            min="1"
                            max={item.quantityOnHand}
                            value={outflowAmount}
                            onChange={(e) => setOutflowAmount(e.target.value)}
                            placeholder={`Max: ${item.quantityOnHand}`}
                          />
                        </div>
                        <DialogFooter>
                          <Button onClick={() => handleOutflow(item.itemId)}>Confirm Outflow</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="flex items-center gap-4">
                    <Progress value={percentage} className="flex-1" />
                    <span className="min-w-24 text-right text-sm font-medium text-foreground">
                      {item.quantityOnHand} / {item.minThreshold * 2} {item.unit}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Minimum required: {item.minThreshold} {item.unit}
                  </p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}