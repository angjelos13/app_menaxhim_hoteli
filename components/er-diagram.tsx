"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Maximize2, Download } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────

interface Attr {
  name: string
  pk?: boolean
  fk?: boolean
}

type AttrSide = "left" | "right" | "top" | "bottom"

interface Entity {
  id: string
  name: string
  attrs: Attr[]
  x: number
  y: number
  w: number
  h: number
  fill: string
  stroke: string
  category: string
  attrSide: AttrSide // which side the ovals spread from
}

interface Rel {
  id: string
  from: string
  to: string
  name: string
  fromCard: string
  toCard: string
  diamondX: number
  diamondY: number
  note?: string
}

// ── Constants ──────────────────────────────────────────────────────────

const SVG_W = 5800
const SVG_H = 4400

const DIAMOND_SIZE = 72

// Careful manual placement for a clean, spread-out Chen-notation diagram
// Row 1: USER (top-left), ROOM (top-center), TABLE (top-right), SERVICE (far right)
// Row 2: CUSTOMER (left), RESERVATION (center), INVOICE (right-center), SERVICE_USAGE (right)
// Row 3: nothing on left, PAYMENT (center-right), INV_ITEM (far right), INV_TXN (far right bottom)

const ENTITIES: Entity[] = [
  // ── People & Auth ──
  {
    id: "User", name: "USER",
    attrs: [
      { name: "userId", pk: true },
      { name: "username" },
      { name: "passwordHash" },
      { name: "role" },
      { name: "isActive" },
    ],
    x: 200, y: 300, w: 280, h: 100,
    fill: "#dcfce7", stroke: "#16a34a",
    category: "People & Auth",
    attrSide: "left",
  },
  {
    id: "Customer", name: "CUSTOMER",
    attrs: [
      { name: "customerId", pk: true },
      { name: "fullName" },
      { name: "phone" },
      { name: "email" },
      { name: "idCardNo" },
    ],
    x: 200, y: 1650, w: 300, h: 100,
    fill: "#fef9c3", stroke: "#ca8a04",
    category: "People & Auth",
    attrSide: "left",
  },

  // ── Hotel Assets ──
  {
    id: "Room", name: "ROOM",
    attrs: [
      { name: "roomId", pk: true },
      { name: "roomNumber" },
      { name: "type" },
      { name: "pricePerNight" },
      { name: "status" },
    ],
    x: 1650, y: 200, w: 260, h: 100,
    fill: "#dcfce7", stroke: "#16a34a",
    category: "Hotel Assets",
    attrSide: "top",
  },
  {
    id: "Table", name: "TABLE",
    attrs: [
      { name: "tableId", pk: true },
      { name: "tableNumber" },
      { name: "capacity" },
      { name: "status" },
    ],
    x: 1650, y: 2950, w: 260, h: 100,
    fill: "#dcfce7", stroke: "#16a34a",
    category: "Hotel Assets",
    attrSide: "bottom",
  },

  // ── Reservations ──
  {
    id: "Reservation", name: "RESERVATION",
    attrs: [
      { name: "reservationId", pk: true },
      { name: "customerId", fk: true },
      { name: "roomId", fk: true },
      { name: "tableId", fk: true },
      { name: "startDate" },
      { name: "endDate" },
      { name: "reservationType" },
      { name: "status" },
      { name: "createdBy", fk: true },
      { name: "createdAt" },
    ],
    x: 1580, y: 1580, w: 360, h: 100,
    fill: "#dbeafe", stroke: "#2563eb",
    category: "Reservations",
    attrSide: "bottom",
  },

  // ── Billing ──
  {
    id: "Invoice", name: "INVOICE",
    attrs: [
      { name: "invoiceId", pk: true },
      { name: "reservationId", fk: true },
      { name: "invoiceDate" },
      { name: "subtotal" },
      { name: "tax" },
      { name: "total" },
      { name: "status" },
    ],
    x: 3200, y: 1580, w: 290, h: 100,
    fill: "#fee2e2", stroke: "#dc2626",
    category: "Billing",
    attrSide: "top",
  },
  {
    id: "Payment", name: "PAYMENT",
    attrs: [
      { name: "paymentId", pk: true },
      { name: "invoiceId", fk: true },
      { name: "amount" },
      { name: "method" },
      { name: "paidAt" },
      { name: "status" },
    ],
    x: 3200, y: 2950, w: 290, h: 100,
    fill: "#fce7f3", stroke: "#db2777",
    category: "Billing",
    attrSide: "bottom",
  },

  // ── Services ──
  {
    id: "Service", name: "SERVICE",
    attrs: [
      { name: "serviceId", pk: true },
      { name: "name" },
      { name: "unitPrice" },
      { name: "category" },
    ],
    x: 4600, y: 200, w: 270, h: 100,
    fill: "#ede9fe", stroke: "#7c3aed",
    category: "Services",
    attrSide: "right",
  },
  {
    id: "ServiceUsage", name: "SERVICE_USAGE",
    attrs: [
      { name: "usageId", pk: true },
      { name: "invoiceId", fk: true },
      { name: "serviceId", fk: true },
      { name: "quantity" },
      { name: "dateTime" },
      { name: "totalPrice" },
    ],
    x: 4550, y: 1580, w: 360, h: 100,
    fill: "#ede9fe", stroke: "#7c3aed",
    category: "Services",
    attrSide: "right",
  },

  // ── Inventory ──
  {
    id: "InventoryItem", name: "INVENTORY_ITEM",
    attrs: [
      { name: "itemId", pk: true },
      { name: "name" },
      { name: "unit" },
      { name: "quantityOnHand" },
      { name: "minThreshold" },
    ],
    x: 4550, y: 2950, w: 360, h: 100,
    fill: "#cffafe", stroke: "#0891b2",
    category: "Inventory",
    attrSide: "right",
  },
  {
    id: "InventoryTransaction", name: "INVENTORY_TXN",
    attrs: [
      { name: "transactionId", pk: true },
      { name: "itemId", fk: true },
      { name: "recordedBy", fk: true },
      { name: "type" },
      { name: "quantity" },
      { name: "dateTime" },
      { name: "notes" },
    ],
    x: 4550, y: 3850, w: 360, h: 100,
    fill: "#cffafe", stroke: "#0891b2",
    category: "Inventory",
    attrSide: "right",
  },
]

const RELATIONSHIPS: Rel[] = [
  {
    id: "r1", from: "Customer", to: "Reservation",
    name: "MAKES",
    fromCard: "(1, 1)", toCard: "(0, N)",
    diamondX: 980, diamondY: 1630,
  },
  {
    id: "r2", from: "Reservation", to: "Room",
    name: "BOOKS",
    fromCard: "(0, N)", toCard: "(0, 1)",
    diamondX: 1780, diamondY: 920,
    note: "if type = Room",
  },
  {
    id: "r3", from: "Reservation", to: "Table",
    name: "RESERVES",
    fromCard: "(0, N)", toCard: "(0, 1)",
    diamondX: 1780, diamondY: 2340,
    note: "if type = Table",
  },
  {
    id: "r4", from: "User", to: "Reservation",
    name: "CREATES",
    fromCard: "(1, 1)", toCard: "(0, N)",
    diamondX: 980, diamondY: 920,
  },
  {
    id: "r5", from: "Reservation", to: "Invoice",
    name: "GENERATES",
    fromCard: "(1, 1)", toCard: "(0, 1)",
    diamondX: 2530, diamondY: 1630,
  },
  {
    id: "r6", from: "Invoice", to: "Payment",
    name: "PAID_VIA",
    fromCard: "(1, 1)", toCard: "(0, N)",
    diamondX: 3345, diamondY: 2340,
  },
  {
    id: "r7", from: "Invoice", to: "ServiceUsage",
    name: "CONTAINS",
    fromCard: "(1, 1)", toCard: "(0, N)",
    diamondX: 4050, diamondY: 1630,
  },
  {
    id: "r8", from: "Service", to: "ServiceUsage",
    name: "USED_IN",
    fromCard: "(1, 1)", toCard: "(0, N)",
    diamondX: 4735, diamondY: 920,
  },
  {
    id: "r9", from: "InventoryItem", to: "InventoryTransaction",
    name: "TRACKS",
    fromCard: "(1, 1)", toCard: "(0, N)",
    diamondX: 4730, diamondY: 3440,
  },
  {
    id: "r10", from: "User", to: "InventoryTransaction",
    name: "RECORDS",
    fromCard: "(1, 1)", toCard: "(0, N)",
    diamondX: 850, diamondY: 3900,
  },
]

const CATEGORIES = [...new Set(ENTITIES.map((e) => e.category))]
const catColors: Record<string, string> = {
  "People & Auth": "#ca8a04",
  "Hotel Assets": "#16a34a",
  Reservations: "#2563eb",
  Billing: "#dc2626",
  Services: "#7c3aed",
  Inventory: "#0891b2",
}

// ── Helpers ────────────────────────────────────────────────────────────

/** Lay out attribute ovals on a given side of the entity */
function attrOvalPositions(ent: Entity): { x: number; y: number; attr: Attr }[] {
  const { attrs, x, y, w, h, attrSide } = ent
  const cx = x + w / 2
  const cy = y + h / 2
  const count = attrs.length
  const results: { x: number; y: number; attr: Attr }[] = []

  const spacing = 62

  if (attrSide === "left") {
    const totalH = (count - 1) * spacing
    const startY = cy - totalH / 2
    for (let i = 0; i < count; i++) {
      results.push({ x: x - 210, y: startY + i * spacing, attr: attrs[i] })
    }
  } else if (attrSide === "right") {
    const totalH = (count - 1) * spacing
    const startY = cy - totalH / 2
    for (let i = 0; i < count; i++) {
      results.push({ x: x + w + 210, y: startY + i * spacing, attr: attrs[i] })
    }
  } else if (attrSide === "top") {
    const totalW = (count - 1) * 200
    const startX = cx - totalW / 2
    for (let i = 0; i < count; i++) {
      results.push({ x: startX + i * 200, y: y - 110, attr: attrs[i] })
    }
  } else {
    // bottom
    const totalW = (count - 1) * 200
    const startX = cx - totalW / 2
    for (let i = 0; i < count; i++) {
      results.push({ x: startX + i * 200, y: y + h + 110, attr: attrs[i] })
    }
  }

  return results
}

/** Get connection point on entity edge closest to a target */
function entEdge(ent: Entity, tx: number, ty: number) {
  const cx = ent.x + ent.w / 2
  const cy = ent.y + ent.h / 2
  const dx = tx - cx
  const dy = ty - cy
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  const sx = (ent.w / 2) / (ax || 1)
  const sy = (ent.h / 2) / (ay || 1)
  const s = Math.min(sx, sy)
  return { x: cx + dx * s, y: cy + dy * s }
}

/** Get connection point on diamond edge */
function diamondEdge(dx: number, dy: number, tx: number, ty: number) {
  const ddx = tx - dx
  const ddy = ty - dy
  const adx = Math.abs(ddx)
  const ady = Math.abs(ddy)
  if (adx + ady === 0) return { x: dx, y: dy }
  const scale = DIAMOND_SIZE / (adx + ady)
  return { x: dx + ddx * scale, y: dy + ddy * scale }
}

// ── Component ─────────────────────────────────────────────────────────

export default function ERDiagram() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(0.28)
  const [pan, setPan] = useState({ x: 30, y: 15 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string | null>(null)

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    setZoom((z) => Math.max(0.12, Math.min(3, z + delta)))
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      setDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    },
    [pan]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    },
    [dragging, dragStart]
  )

  const handleMouseUp = useCallback(() => setDragging(false), [])

  useEffect(() => {
    const handler = () => setDragging(false)
    window.addEventListener("mouseup", handler)
    return () => window.removeEventListener("mouseup", handler)
  }, [])

  const resetView = useCallback(() => {
    setZoom(0.28)
    setPan({ x: 30, y: 15 })
  }, [])

  // ── Download PNG ──
  const downloadAsPng = useCallback(() => {
    const svgEl = containerRef.current?.querySelector("svg")
    if (!svgEl) return
    const clone = svgEl.cloneNode(true) as SVGSVGElement
    clone.setAttribute("width", String(SVG_W))
    clone.setAttribute("height", String(SVG_H))
    const gEl = clone.querySelector("g")
    if (gEl) gEl.setAttribute("transform", "translate(0,0) scale(1)")
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(clone)
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(svgBlob)
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const scale = 2
      const canvas = document.createElement("canvas")
      canvas.width = SVG_W * scale
      canvas.height = SVG_H * scale
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0, SVG_W, SVG_H)
      URL.revokeObjectURL(url)
      const link = document.createElement("a")
      link.download = "hotel-er-diagram.png"
      link.href = canvas.toDataURL("image/png")
      link.click()
    }
    img.src = url
  }, [])

  // ── Visibility ──
  function isEntityVisible(e: Entity) {
    if (!filterCat) return true
    return e.category === filterCat
  }

  function isRelVisible(r: Rel) {
    const fe = ENTITIES.find((e) => e.id === r.from)
    const te = ENTITIES.find((e) => e.id === r.to)
    if (!fe || !te) return false
    if (filterCat && fe.category !== filterCat && te.category !== filterCat) return false
    return true
  }

  // ── Render ──
  return (
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden">
      {/* ── Legend Sidebar ── */}
      <div className="w-72 shrink-0 border-r border-border bg-card overflow-y-auto">
        <div className="p-5">
          <h2 className="text-lg font-bold text-foreground mb-1">ER Diagram</h2>
          <p className="text-xs text-muted-foreground mb-5">
            Chen-notation Entity-Relationship Diagram for the Hotel Management System.
          </p>

          {/* Notation */}
          <div className="mb-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Notation
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 w-6 h-4 rounded-sm border-2 bg-emerald-100 border-emerald-600 shrink-0" />
                <div>
                  <span className="font-medium text-foreground">Entity</span>
                  <p className="text-muted-foreground leading-snug">Colored rectangle representing a table</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <svg width="22" height="18" className="mt-0.5 shrink-0">
                  <ellipse cx="11" cy="9" rx="10" ry="7" fill="none" stroke="currentColor" strokeWidth="1.2" />
                </svg>
                <div>
                  <span className="font-medium text-foreground">Attribute</span>
                  <p className="text-muted-foreground leading-snug">Oval connected to its entity by a line</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <svg width="22" height="18" className="mt-0.5 shrink-0">
                  <ellipse cx="11" cy="9" rx="10" ry="7" fill="none" stroke="currentColor" strokeWidth="1.2" />
                  <line x1="4" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
                </svg>
                <div>
                  <span className="font-medium text-foreground">{"PK Attribute"}</span>
                  <p className="text-muted-foreground leading-snug">Dashed underline on the name</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <svg width="22" height="22" className="mt-0.5 shrink-0">
                  <g transform="translate(11,11)">
                    <rect x="-8" y="-8" width="16" height="16" transform="rotate(45)" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <rect x="-6" y="-6" width="12" height="12" transform="rotate(45)" fill="none" stroke="currentColor" strokeWidth="0.8" />
                  </g>
                </svg>
                <div>
                  <span className="font-medium text-foreground">Relationship</span>
                  <p className="text-muted-foreground leading-snug">Double-bordered diamond between entities</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="mt-1 shrink-0 font-mono text-[10px] text-foreground bg-foreground/5 rounded px-1.5 py-0.5">
                  (0, N)
                </div>
                <div>
                  <span className="font-medium text-foreground">Cardinality</span>
                  <p className="text-muted-foreground leading-snug">(min, max) notation on each side</p>
                </div>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="mb-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Categories
            </h3>
            <div className="space-y-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCat(filterCat === cat ? null : cat)}
                  className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                    filterCat === cat
                      ? "bg-foreground/10 font-semibold text-foreground"
                      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                  }`}
                >
                  <span className="inline-block size-2.5 rounded-full shrink-0" style={{ backgroundColor: catColors[cat] }} />
                  {cat}
                  <span className="ml-auto text-[10px] opacity-60">
                    {ENTITIES.filter((e) => e.category === cat).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Relationships */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Relationships ({RELATIONSHIPS.length})
            </h3>
            <div className="space-y-1.5">
              {RELATIONSHIPS.map((rel) => (
                <button
                  key={rel.id}
                  onMouseEnter={() => setHighlighted(rel.id)}
                  onMouseLeave={() => setHighlighted(null)}
                  className={`flex w-full items-start gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                    highlighted === rel.id
                      ? "bg-foreground/10 text-foreground"
                      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{rel.from}</span>
                    <span className="font-mono text-[10px] opacity-50">{rel.fromCard}</span>
                    <span className="text-[10px] opacity-40">--</span>
                    <span className="font-mono text-[10px] opacity-50">{rel.toCard}</span>
                    <span className="font-medium">{rel.to}</span>
                  </div>
                  <span className="ml-auto text-[10px] italic opacity-50 shrink-0">{rel.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Diagram Canvas ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-card px-5 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-foreground">Entity-Relationship Diagram</h1>
            <span className="text-xs text-muted-foreground">
              {ENTITIES.length} entities &middot; {RELATIONSHIPS.length} relationships
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat}
                variant={filterCat === cat ? "default" : "outline"}
                className="cursor-pointer text-[10px] px-2 py-0.5"
                onClick={() => setFilterCat(filterCat === cat ? null : cat)}
              >
                <span className="inline-block size-1.5 rounded-full mr-1" style={{ backgroundColor: catColors[cat] }} />
                {cat}
              </Badge>
            ))}
            {filterCat && (
              <Badge variant="secondary" className="cursor-pointer text-[10px] px-2 py-0.5" onClick={() => setFilterCat(null)}>
                Show All
              </Badge>
            )}
          </div>
        </div>

        {/* SVG canvas */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <svg width="100%" height="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="select-none">
            <defs>
              <filter id="chen-shadow" x="-4%" y="-4%" width="108%" height="112%">
                <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.06" />
              </filter>
            </defs>

            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>

              {/* ── Relationship lines + diamonds ── */}
              {RELATIONSHIPS.filter(isRelVisible).map((rel) => {
                const fromE = ENTITIES.find((e) => e.id === rel.from)!
                const toE = ENTITIES.find((e) => e.id === rel.to)!
                const dx = rel.diamondX
                const dy = rel.diamondY

                const fromPt = entEdge(fromE, dx, dy)
                const toPt = entEdge(toE, dx, dy)
                const dFromPt = diamondEdge(dx, dy, fromPt.x, fromPt.y)
                const dToPt = diamondEdge(dx, dy, toPt.x, toPt.y)

                const isHl = highlighted === rel.id
                const dimmed = highlighted && !isHl

                // Cardinality label positions -- near the entity side
                const fromMidX = fromPt.x + (dFromPt.x - fromPt.x) * 0.3
                const fromMidY = fromPt.y + (dFromPt.y - fromPt.y) * 0.3
                const toMidX = toPt.x + (dToPt.x - toPt.x) * 0.3
                const toMidY = toPt.y + (dToPt.y - toPt.y) * 0.3

                // Offset cardinality labels perpendicular to line
                const fAngle = Math.atan2(dFromPt.y - fromPt.y, dFromPt.x - fromPt.x)
                const tAngle = Math.atan2(dToPt.y - toPt.y, dToPt.x - toPt.x)
                const off = 28

                return (
                  <g
                    key={rel.id}
                    opacity={dimmed ? 0.1 : 1}
                    onMouseEnter={() => setHighlighted(rel.id)}
                    onMouseLeave={() => setHighlighted(null)}
                    className="transition-opacity duration-200"
                    style={{ cursor: "pointer" }}
                  >
                    {/* Line from entity to diamond */}
                    <line
                      x1={fromPt.x} y1={fromPt.y} x2={dFromPt.x} y2={dFromPt.y}
                      stroke={isHl ? "#2563eb" : "#64748b"} strokeWidth={isHl ? 3 : 2}
                    />
                    {/* Line from diamond to entity */}
                    <line
                      x1={dToPt.x} y1={dToPt.y} x2={toPt.x} y2={toPt.y}
                      stroke={isHl ? "#2563eb" : "#64748b"} strokeWidth={isHl ? 3 : 2}
                    />

                    {/* Diamond (double border) */}
                    <g transform={`translate(${dx},${dy})`}>
                      <rect
                        x={-DIAMOND_SIZE} y={-DIAMOND_SIZE}
                        width={DIAMOND_SIZE * 2} height={DIAMOND_SIZE * 2}
                        transform="rotate(45)"
                        fill="white" stroke={isHl ? "#2563eb" : "#475569"} strokeWidth={isHl ? 2.5 : 1.5}
                      />
                      <rect
                        x={-DIAMOND_SIZE + 6} y={-DIAMOND_SIZE + 6}
                        width={(DIAMOND_SIZE - 6) * 2} height={(DIAMOND_SIZE - 6) * 2}
                        transform="rotate(45)"
                        fill="white" stroke={isHl ? "#2563eb" : "#475569"} strokeWidth={isHl ? 1.5 : 0.8}
                      />
                      <text
                        x={0} y={7}
                        textAnchor="middle"
                        fill={isHl ? "#2563eb" : "#1e293b"}
                        fontSize="18"
                        fontWeight="700"
                        fontFamily="sans-serif"
                      >
                        {rel.name}
                      </text>
                    </g>

                    {/* Cardinality labels */}
                    <text
                      x={fromMidX + Math.sin(fAngle) * off}
                      y={fromMidY - Math.cos(fAngle) * off + 5}
                      textAnchor="middle"
                      fill={isHl ? "#2563eb" : "#1e293b"}
                      fontSize="20"
                      fontWeight="700"
                      fontFamily="sans-serif"
                    >
                      {rel.fromCard}
                    </text>
                    <text
                      x={toMidX + Math.sin(tAngle) * off}
                      y={toMidY - Math.cos(tAngle) * off + 6}
                      textAnchor="middle"
                      fill={isHl ? "#2563eb" : "#1e293b"}
                      fontSize="20"
                      fontWeight="700"
                      fontFamily="sans-serif"
                    >
                      {rel.toCard}
                    </text>

                    {/* Note (if present) */}
                    {rel.note && (
                      <text
                        x={dx} y={dy + DIAMOND_SIZE + 30}
                        textAnchor="middle" fill="#94a3b8" fontSize="16" fontStyle="italic" fontFamily="sans-serif"
                      >
                        {rel.note}
                      </text>
                    )}
                  </g>
                )
              })}

              {/* ── Entities + attribute ovals ── */}
              {ENTITIES.filter(isEntityVisible).map((ent) => {
                const isHl =
                  highlighted &&
                  RELATIONSHIPS.find((r) => r.id === highlighted && (r.from === ent.id || r.to === ent.id))
                const dimmed = highlighted && !isHl
                const ovals = attrOvalPositions(ent)
                const cx = ent.x + ent.w / 2
                const cy = ent.y + ent.h / 2

                return (
                  <g key={ent.id} className="transition-opacity duration-200" opacity={dimmed ? 0.1 : 1}>
                    {/* Attribute lines + ovals */}
                    {ovals.map(({ x, y, attr }, i) => (
                      <g key={`${ent.id}-attr-${i}`}>
                        {/* Line from entity to oval */}
                        <line
                          x1={cx} y1={cy} x2={x} y2={y}
                          stroke="#94a3b8" strokeWidth="1.5"
                        />
                        {/* Oval background */}
                        <ellipse
                          cx={x} cy={y}
                          rx={Math.max(attr.name.length * 8, 75)}
                          ry={26}
                          fill="white"
                          stroke={attr.pk ? ent.stroke : "#94a3b8"}
                          strokeWidth={attr.pk ? 2.5 : 1.5}
                          filter="url(#chen-shadow)"
                        />
                        {/* Attribute text */}
                        <text
                          x={x} y={y + 6}
                          textAnchor="middle"
                          fill="#1e293b"
                          fontSize="18"
                          fontFamily="sans-serif"
                          fontWeight={attr.pk || attr.fk ? "700" : "400"}
                        >
                          {attr.name}
                        </text>
                        {/* PK dashed underline */}
                        {attr.pk && (
                          <line
                            x1={x - attr.name.length * 5}
                            y1={y + 15}
                            x2={x + attr.name.length * 5}
                            y2={y + 15}
                            stroke={ent.stroke}
                            strokeWidth="2"
                            strokeDasharray="6 3"
                          />
                        )}
                        {/* FK indicator */}
                        {attr.fk && !attr.pk && (
                          <text
                            x={x + Math.max(attr.name.length * 8, 75) + 12}
                            y={y + 6}
                            fill="#94a3b8"
                            fontSize="14"
                            fontFamily="sans-serif"
                            fontWeight="700"
                          >
                            FK
                          </text>
                        )}
                      </g>
                    ))}

                    {/* Entity rectangle */}
                    <rect
                      x={ent.x} y={ent.y}
                      width={ent.w} height={ent.h}
                      rx={4}
                      fill={ent.fill}
                      stroke={ent.stroke}
                      strokeWidth={isHl ? 4.5 : 3}
                      filter="url(#chen-shadow)"
                    />
                    {/* Entity name */}
                    <text
                      x={cx} y={cy + 9}
                      textAnchor="middle"
                      fill={ent.stroke}
                      fontSize="26"
                      fontWeight="800"
                      fontFamily="sans-serif"
                      letterSpacing="1"
                    >
                      {ent.name}
                    </text>
                  </g>
                )
              })}
            </g>
          </svg>

          {/* Controls */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-sm">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setZoom((z) => Math.min(3, z + 0.1))}>
              <ZoomIn className="size-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-12 text-center tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setZoom((z) => Math.max(0.12, z - 0.1))}>
              <ZoomOut className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8" onClick={resetView}>
              <Maximize2 className="size-4" />
            </Button>
            <div className="mx-0.5 h-5 w-px bg-border" />
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={downloadAsPng} aria-label="Download as PNG">
              <Download className="size-4" />
              PNG
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
