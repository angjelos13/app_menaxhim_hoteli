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
}

interface Rel {
  id: string
  from: string
  to: string
  name: string
  fromCard: string // e.g. "(1,1)" or "(0,N)"
  toCard: string
  diamondX: number
  diamondY: number
  note?: string
}

// ── Constants ──────────────────────────────────────────────────────────

const SVG_W = 2600
const SVG_H = 2100

const DIAMOND_SIZE = 36

const ENTITIES: Entity[] = [
  {
    id: "User",
    name: "USER",
    attrs: [
      { name: "userId (PK)", pk: true },
      { name: "username" },
      { name: "passwordHash" },
      { name: "role" },
      { name: "isActive" },
    ],
    x: 120, y: 80, w: 140, h: 50,
    fill: "#d1fae5", stroke: "#059669",
    category: "People & Auth",
  },
  {
    id: "Customer",
    name: "CUSTOMER",
    attrs: [
      { name: "customerId (PK)", pk: true },
      { name: "fullName" },
      { name: "phone" },
      { name: "email" },
      { name: "idCardNo" },
    ],
    x: 120, y: 580, w: 160, h: 50,
    fill: "#fef3c7", stroke: "#d97706",
    category: "People & Auth",
  },
  {
    id: "Reservation",
    name: "RESERVATION",
    attrs: [
      { name: "reservationId (PK)", pk: true },
      { name: "customerId (FK)", fk: true },
      { name: "roomId (FK)", fk: true },
      { name: "tableId (FK)", fk: true },
      { name: "startDate" },
      { name: "endDate" },
      { name: "reservationType" },
      { name: "status" },
      { name: "createdBy (FK)", fk: true },
      { name: "createdAt" },
    ],
    x: 680, y: 300, w: 180, h: 50,
    fill: "#dbeafe", stroke: "#2563eb",
    category: "Reservations",
  },
  {
    id: "Room",
    name: "ROOM",
    attrs: [
      { name: "roomId (PK)", pk: true },
      { name: "roomNumber" },
      { name: "type" },
      { name: "pricePerNight" },
      { name: "status" },
    ],
    x: 680, y: 80, w: 130, h: 50,
    fill: "#d1fae5", stroke: "#059669",
    category: "Hotel Assets",
  },
  {
    id: "Table",
    name: "TABLE",
    attrs: [
      { name: "tableId (PK)", pk: true },
      { name: "tableNumber" },
      { name: "capacity" },
      { name: "status" },
    ],
    x: 680, y: 580, w: 130, h: 50,
    fill: "#d1fae5", stroke: "#059669",
    category: "Hotel Assets",
  },
  {
    id: "Invoice",
    name: "INVOICE",
    attrs: [
      { name: "invoiceId (PK)", pk: true },
      { name: "reservationId (FK)", fk: true },
      { name: "invoiceDate" },
      { name: "subtotal" },
      { name: "tax" },
      { name: "total" },
      { name: "status" },
    ],
    x: 1220, y: 300, w: 150, h: 50,
    fill: "#fee2e2", stroke: "#dc2626",
    category: "Billing",
  },
  {
    id: "Payment",
    name: "PAYMENT",
    attrs: [
      { name: "paymentId (PK)", pk: true },
      { name: "invoiceId (FK)", fk: true },
      { name: "amount" },
      { name: "method" },
      { name: "paidAt" },
      { name: "status" },
    ],
    x: 1220, y: 580, w: 150, h: 50,
    fill: "#fce7f3", stroke: "#db2777",
    category: "Billing",
  },
  {
    id: "Service",
    name: "SERVICE",
    attrs: [
      { name: "serviceId (PK)", pk: true },
      { name: "name" },
      { name: "unitPrice" },
      { name: "category" },
    ],
    x: 1750, y: 80, w: 140, h: 50,
    fill: "#ede9fe", stroke: "#7c3aed",
    category: "Services",
  },
  {
    id: "ServiceUsage",
    name: "SERVICE_USAGE",
    attrs: [
      { name: "usageId (PK)", pk: true },
      { name: "invoiceId (FK)", fk: true },
      { name: "serviceId (FK)", fk: true },
      { name: "quantity" },
      { name: "dateTime" },
      { name: "totalPrice" },
    ],
    x: 1750, y: 350, w: 190, h: 50,
    fill: "#ede9fe", stroke: "#7c3aed",
    category: "Services",
  },
  {
    id: "InventoryItem",
    name: "INVENTORY_ITEM",
    attrs: [
      { name: "itemId (PK)", pk: true },
      { name: "name" },
      { name: "unit" },
      { name: "quantityOnHand" },
      { name: "minThreshold" },
    ],
    x: 2050, y: 580, w: 190, h: 50,
    fill: "#cffafe", stroke: "#0891b2",
    category: "Inventory",
  },
  {
    id: "InventoryTransaction",
    name: "INVENTORY_TXN",
    attrs: [
      { name: "transactionId (PK)", pk: true },
      { name: "itemId (FK)", fk: true },
      { name: "recordedBy (FK)", fk: true },
      { name: "type" },
      { name: "quantity" },
      { name: "dateTime" },
      { name: "notes" },
    ],
    x: 2050, y: 980, w: 190, h: 50,
    fill: "#cffafe", stroke: "#0891b2",
    category: "Inventory",
  },
]

const RELATIONSHIPS: Rel[] = [
  {
    id: "r1", from: "Customer", to: "Reservation",
    name: "MAKES",
    fromCard: "(1, 1)", toCard: "(0, N)",
    diamondX: 440, diamondY: 440,
  },
  {
    id: "r2", from: "Reservation", to: "Room",
    name: "BOOKS",
    fromCard: "(0, N)", toCard: "(0, 1)",
    diamondX: 770, diamondY: 190,
    note: "if reservationType = Room",
  },
  {
    id: "r3", from: "Reservation", to: "Table",
    name: "RESERVES",
    fromCard: "(0, N)", toCard: "(0, 1)",
    diamondX: 770, diamondY: 480,
    note: "if reservationType = Table",
  },
  {
    id: "r4", from: "User", to: "Reservation",
    name: "CREATES",
    fromCard: "(1, 1)", toCard: "(0, N)",
    diamondX: 440, diamondY: 190,
  },
  {
    id: "r5", from: "Reservation", to: "Invoice",
    name: "GENERATES",
    fromCard: "(1, 1)", toCard: "(0, 1)",
    diamondX: 1010, diamondY: 325,
  },
  {
    id: "r6", from: "Invoice", to: "Payment",
    name: "PAID_VIA",
    fromCard: "(1, 1)", toCard: "(0, N)",
    diamondX: 1295, diamondY: 480,
  },
  {
    id: "r7", from: "Invoice", to: "ServiceUsage",
    name: "CONTAINS",
    fromCard: "(1, 1)", toCard: "(0, N)",
    diamondX: 1540, diamondY: 375,
  },
  {
    id: "r8", from: "Service", to: "ServiceUsage",
    name: "USED_IN",
    fromCard: "(1, 1)", toCard: "(0, N)",
    diamondX: 1845, diamondY: 220,
  },
  {
    id: "r9", from: "InventoryItem", to: "InventoryTransaction",
    name: "TRACKS",
    fromCard: "(1, 1)", toCard: "(0, N)",
    diamondX: 2145, diamondY: 800,
  },
  {
    id: "r10", from: "User", to: "InventoryTransaction",
    name: "RECORDS",
    fromCard: "(1, 1)", toCard: "(0, N)",
    diamondX: 440, diamondY: 1050,
  },
]

const CATEGORIES = [...new Set(ENTITIES.map((e) => e.category))]
const catColors: Record<string, string> = {
  "People & Auth": "#d97706",
  "Hotel Assets": "#059669",
  Reservations: "#2563eb",
  Billing: "#dc2626",
  Services: "#7c3aed",
  Inventory: "#0891b2",
}

// ── Helpers ────────────────────────────────────────────────────────────

/** Lay out ovals for attributes around entity */
function attrOvalPositions(ent: Entity): { x: number; y: number; attr: Attr }[] {
  const { attrs, x, y, w, h } = ent
  const cx = x + w / 2
  const cy = y + h / 2
  const results: { x: number; y: number; attr: Attr }[] = []

  const count = attrs.length
  // spread attributes to the left of the entity
  const startAngle = Math.PI * 0.65
  const endAngle = Math.PI * 1.35
  const radiusX = w * 0.5 + 120
  const radiusY = Math.max(count * 22, h + 60)

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const angle = startAngle + t * (endAngle - startAngle)
    results.push({
      x: cx + Math.cos(angle) * radiusX,
      y: cy + Math.sin(angle) * radiusY * 0.45,
      attr: attrs[i],
    })
  }
  return results
}

/** Center of an entity box */
function entCenter(ent: Entity) {
  return { x: ent.x + ent.w / 2, y: ent.y + ent.h / 2 }
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
  const [zoom, setZoom] = useState(0.55)
  const [pan, setPan] = useState({ x: 40, y: 20 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string | null>(null)

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.06 : 0.06
    setZoom((z) => Math.max(0.15, Math.min(3, z + delta)))
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
    setZoom(0.55)
    setPan({ x: 40, y: 20 })
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
                  <ellipse cx="11" cy="9" rx="10" ry="7" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" />
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
                const fc = entCenter(fromE)
                const tc = entCenter(toE)
                const dx = rel.diamondX
                const dy = rel.diamondY

                // Edge points
                const fromPt = entEdge(fromE, dx, dy)
                const toPt = entEdge(toE, dx, dy)
                const dFromPt = diamondEdge(dx, dy, fromPt.x, fromPt.y)
                const dToPt = diamondEdge(dx, dy, toPt.x, toPt.y)

                const isHl = highlighted === rel.id
                const dimmed = highlighted && !isHl

                // Cardinality label positions (near the entity side)
                const fromCardX = fromPt.x + (dFromPt.x - fromPt.x) * 0.25
                const fromCardY = fromPt.y + (dFromPt.y - fromPt.y) * 0.25 - 10
                const toCardX = toPt.x + (dToPt.x - toPt.x) * 0.25
                const toCardY = toPt.y + (dToPt.y - toPt.y) * 0.25 - 10

                return (
                  <g
                    key={rel.id}
                    opacity={dimmed ? 0.12 : 1}
                    onMouseEnter={() => setHighlighted(rel.id)}
                    onMouseLeave={() => setHighlighted(null)}
                    className="transition-opacity duration-200"
                  >
                    {/* Line from entity to diamond */}
                    <line
                      x1={fromPt.x} y1={fromPt.y} x2={dFromPt.x} y2={dFromPt.y}
                      stroke={isHl ? "#2563eb" : "#475569"} strokeWidth={isHl ? 2 : 1.3}
                    />
                    {/* Line from diamond to entity */}
                    <line
                      x1={dToPt.x} y1={dToPt.y} x2={toPt.x} y2={toPt.y}
                      stroke={isHl ? "#2563eb" : "#475569"} strokeWidth={isHl ? 2 : 1.3}
                    />

                    {/* Diamond (double border) */}
                    <g transform={`translate(${dx},${dy})`}>
                      <rect
                        x={-DIAMOND_SIZE} y={-DIAMOND_SIZE}
                        width={DIAMOND_SIZE * 2} height={DIAMOND_SIZE * 2}
                        transform="rotate(45)"
                        fill="white" stroke={isHl ? "#2563eb" : "#475569"} strokeWidth={isHl ? 2 : 1.3}
                      />
                      <rect
                        x={-DIAMOND_SIZE + 5} y={-DIAMOND_SIZE + 5}
                        width={(DIAMOND_SIZE - 5) * 2} height={(DIAMOND_SIZE - 5) * 2}
                        transform="rotate(45)"
                        fill="white" stroke={isHl ? "#2563eb" : "#475569"} strokeWidth={isHl ? 1.5 : 0.8}
                      />
                      <text
                        x={0} y={4}
                        textAnchor="middle"
                        fill={isHl ? "#2563eb" : "#334155"}
                        fontSize="10"
                        fontWeight="700"
                        fontFamily="sans-serif"
                      >
                        {rel.name}
                      </text>
                    </g>

                    {/* Cardinality labels */}
                    <text x={fromCardX} y={fromCardY} textAnchor="middle" fill={isHl ? "#2563eb" : "#334155"} fontSize="12" fontWeight="600" fontFamily="sans-serif">
                      {rel.fromCard}
                    </text>
                    <text x={toCardX} y={toCardY} textAnchor="middle" fill={isHl ? "#2563eb" : "#334155"} fontSize="12" fontWeight="600" fontFamily="sans-serif">
                      {rel.toCard}
                    </text>

                    {/* Note (if present) */}
                    {rel.note && (
                      <text
                        x={dx} y={dy + DIAMOND_SIZE + 16}
                        textAnchor="middle" fill="#94a3b8" fontSize="9" fontStyle="italic" fontFamily="sans-serif"
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
                  <g key={ent.id} className="transition-opacity duration-200" opacity={dimmed ? 0.15 : 1}>
                    {/* Attribute lines + ovals */}
                    {ovals.map(({ x, y, attr }, i) => (
                      <g key={`${ent.id}-attr-${i}`}>
                        {/* Line from entity center to oval */}
                        <line
                          x1={cx} y1={cy} x2={x} y2={y}
                          stroke="#94a3b8" strokeWidth="1"
                        />
                        {/* Oval background */}
                        <ellipse
                          cx={x} cy={y}
                          rx={Math.max(attr.name.length * 4.2, 40)}
                          ry={14}
                          fill="white"
                          stroke={attr.pk ? ent.stroke : "#94a3b8"}
                          strokeWidth={attr.pk ? 1.3 : 1}
                          strokeDasharray={attr.pk ? "none" : "none"}
                          filter="url(#chen-shadow)"
                        />
                        {/* Attribute text */}
                        <text
                          x={x} y={y + 4}
                          textAnchor="middle"
                          fill="#334155"
                          fontSize="10"
                          fontFamily="sans-serif"
                          fontWeight={attr.pk ? "600" : "400"}
                          textDecoration={attr.pk ? "underline" : "none"}
                          style={attr.pk ? { textDecorationStyle: "dashed" as const } : {}}
                        >
                          {attr.name}
                        </text>
                      </g>
                    ))}

                    {/* Entity rectangle */}
                    <rect
                      x={ent.x} y={ent.y}
                      width={ent.w} height={ent.h}
                      rx={2}
                      fill={ent.fill}
                      stroke={ent.stroke}
                      strokeWidth={isHl ? 3 : 2}
                      filter="url(#chen-shadow)"
                    />
                    {/* Entity name */}
                    <text
                      x={cx} y={cy + 5}
                      textAnchor="middle"
                      fill={ent.stroke}
                      fontSize="14"
                      fontWeight="800"
                      fontFamily="sans-serif"
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
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setZoom((z) => Math.min(3, z + 0.15))}>
              <ZoomIn className="size-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-12 text-center tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setZoom((z) => Math.max(0.15, z - 0.15))}>
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
