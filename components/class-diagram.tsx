"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Maximize2, Download } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────

interface Attribute {
  visibility: "+" | "-" | "#" | "~"
  name: string
  type: string
  pk?: boolean
  fk?: boolean
}

interface UMLClass {
  id: string
  name: string
  stereotype?: string
  attributes: Attribute[]
  x: number
  y: number
  color: string
  category: string
}

type RelType = "association" | "composition" | "aggregation"

interface Relationship {
  id: string
  from: string
  to: string
  type: RelType
  fromLabel: string
  toLabel: string
  label?: string
  /** Optional waypoints for routing edges */
  via?: { x: number; y: number }[]
}

// ── Class data ────────────────────────────────────────────────────────

const BOX_W = 230
const ATTR_H = 22
const HEADER_H = 50
const PADDING_BOTTOM = 10

function boxH(c: UMLClass) {
  return HEADER_H + c.attributes.length * ATTR_H + PADDING_BOTTOM
}

const CLASSES: UMLClass[] = [
  // ── People & Auth ──
  {
    id: "User",
    name: "User",
    stereotype: "entity",
    attributes: [
      { visibility: "-", name: "userId", type: "int", pk: true },
      { visibility: "-", name: "username", type: "string" },
      { visibility: "-", name: "passwordHash", type: "string" },
      { visibility: "+", name: "role", type: "Role" },
      { visibility: "+", name: "isActive", type: "boolean" },
    ],
    x: 60,
    y: 60,
    color: "#2563eb",
    category: "People & Auth",
  },
  {
    id: "Customer",
    name: "Customer",
    stereotype: "entity",
    attributes: [
      { visibility: "-", name: "customerId", type: "int", pk: true },
      { visibility: "+", name: "fullName", type: "string" },
      { visibility: "+", name: "phone", type: "string" },
      { visibility: "+", name: "email", type: "string" },
      { visibility: "+", name: "idCardNo", type: "string?" },
    ],
    x: 60,
    y: 310,
    color: "#2563eb",
    category: "People & Auth",
  },

  // ── Hotel Assets ──
  {
    id: "Room",
    name: "Room",
    stereotype: "entity",
    attributes: [
      { visibility: "-", name: "roomId", type: "int", pk: true },
      { visibility: "+", name: "roomNumber", type: "string" },
      { visibility: "+", name: "type", type: "RoomType" },
      { visibility: "+", name: "pricePerNight", type: "decimal" },
      { visibility: "+", name: "status", type: "RoomStatus" },
    ],
    x: 400,
    y: 60,
    color: "#059669",
    category: "Hotel Assets",
  },
  {
    id: "Table",
    name: "Table",
    stereotype: "entity",
    attributes: [
      { visibility: "-", name: "tableId", type: "int", pk: true },
      { visibility: "+", name: "tableNumber", type: "string" },
      { visibility: "+", name: "capacity", type: "int" },
      { visibility: "+", name: "status", type: "TableStatus" },
    ],
    x: 400,
    y: 310,
    color: "#059669",
    category: "Hotel Assets",
  },

  // ── Reservations ──
  {
    id: "Reservation",
    name: "Reservation",
    stereotype: "entity",
    attributes: [
      { visibility: "-", name: "reservationId", type: "int", pk: true },
      { visibility: "+", name: "customerId", type: "int", fk: true },
      { visibility: "+", name: "roomId", type: "int?", fk: true },
      { visibility: "+", name: "tableId", type: "int?", fk: true },
      { visibility: "+", name: "startDate", type: "date" },
      { visibility: "+", name: "endDate", type: "date" },
      { visibility: "+", name: "reservationType", type: "ResType" },
      { visibility: "+", name: "status", type: "ResStatus" },
      { visibility: "+", name: "createdAt", type: "datetime" },
    ],
    x: 740,
    y: 60,
    color: "#d97706",
    category: "Reservations",
  },

  // ── Services ──
  {
    id: "Service",
    name: "Service",
    stereotype: "entity",
    attributes: [
      { visibility: "-", name: "serviceId", type: "int", pk: true },
      { visibility: "+", name: "name", type: "string" },
      { visibility: "+", name: "unitPrice", type: "decimal" },
      { visibility: "+", name: "category", type: "string" },
    ],
    x: 740,
    y: 400,
    color: "#7c3aed",
    category: "Services",
  },
  {
    id: "ServiceUsage",
    name: "ServiceUsage",
    stereotype: "entity",
    attributes: [
      { visibility: "-", name: "usageId", type: "int", pk: true },
      { visibility: "+", name: "reservationId", type: "int", fk: true },
      { visibility: "+", name: "serviceId", type: "int", fk: true },
      { visibility: "+", name: "quantity", type: "int" },
      { visibility: "+", name: "dateTime", type: "datetime" },
      { visibility: "+", name: "totalPrice", type: "decimal" },
    ],
    x: 1080,
    y: 400,
    color: "#7c3aed",
    category: "Services",
  },

  // ── Billing ──
  {
    id: "Invoice",
    name: "Invoice",
    stereotype: "entity",
    attributes: [
      { visibility: "-", name: "invoiceId", type: "int", pk: true },
      { visibility: "+", name: "reservationId", type: "int", fk: true },
      { visibility: "+", name: "invoiceDate", type: "date" },
      { visibility: "+", name: "subtotal", type: "decimal" },
      { visibility: "+", name: "tax", type: "decimal" },
      { visibility: "+", name: "total", type: "decimal" },
      { visibility: "+", name: "status", type: "InvoiceStatus" },
    ],
    x: 1080,
    y: 60,
    color: "#dc2626",
    category: "Billing",
  },
  {
    id: "Payment",
    name: "Payment",
    stereotype: "entity",
    attributes: [
      { visibility: "-", name: "paymentId", type: "int", pk: true },
      { visibility: "+", name: "invoiceId", type: "int", fk: true },
      { visibility: "+", name: "amount", type: "decimal" },
      { visibility: "+", name: "method", type: "PayMethod" },
      { visibility: "+", name: "paidAt", type: "datetime" },
      { visibility: "+", name: "status", type: "PayStatus" },
    ],
    x: 1420,
    y: 60,
    color: "#dc2626",
    category: "Billing",
  },

  // ── Inventory ──
  {
    id: "InventoryItem",
    name: "InventoryItem",
    stereotype: "entity",
    attributes: [
      { visibility: "-", name: "itemId", type: "int", pk: true },
      { visibility: "+", name: "name", type: "string" },
      { visibility: "+", name: "unit", type: "string" },
      { visibility: "+", name: "quantityOnHand", type: "int" },
      { visibility: "+", name: "minThreshold", type: "int" },
    ],
    x: 1420,
    y: 400,
    color: "#0891b2",
    category: "Inventory",
  },
  {
    id: "InventoryTransaction",
    name: "InventoryTransaction",
    stereotype: "entity",
    attributes: [
      { visibility: "-", name: "transactionId", type: "int", pk: true },
      { visibility: "+", name: "itemId", type: "int", fk: true },
      { visibility: "+", name: "type", type: "TxnType" },
      { visibility: "+", name: "quantity", type: "int" },
      { visibility: "+", name: "dateTime", type: "datetime" },
      { visibility: "+", name: "notes", type: "string?" },
    ],
    x: 1420,
    y: 650,
    color: "#0891b2",
    category: "Inventory",
  },
]

// ── Relationships ──────────────────────────────────────────────────────

const RELATIONSHIPS: Relationship[] = [
  // Customer → Reservation  (1 customer has many reservations)
  {
    id: "r1",
    from: "Customer",
    to: "Reservation",
    type: "association",
    fromLabel: "1",
    toLabel: "0..*",
    label: "makes",
  },
  // Room → Reservation  (1 room can have many reservations)
  {
    id: "r2",
    from: "Room",
    to: "Reservation",
    type: "association",
    fromLabel: "1",
    toLabel: "0..*",
    label: "booked for",
  },
  // Table → Reservation  (1 table can have many reservations)
  {
    id: "r3",
    from: "Table",
    to: "Reservation",
    type: "association",
    fromLabel: "1",
    toLabel: "0..*",
    label: "reserved at",
    via: [{ x: 630, y: 420 }, { x: 660, y: 290 }],
  },
  // Reservation → ServiceUsage  (1 reservation has many service usages)
  {
    id: "r4",
    from: "Reservation",
    to: "ServiceUsage",
    type: "composition",
    fromLabel: "1",
    toLabel: "0..*",
    label: "incurs",
    via: [{ x: 1020, y: 300 }, { x: 1080, y: 420 }],
  },
  // Service → ServiceUsage  (1 service used in many usages)
  {
    id: "r5",
    from: "Service",
    to: "ServiceUsage",
    type: "association",
    fromLabel: "1",
    toLabel: "0..*",
    label: "used in",
  },
  // Reservation → Invoice  (1 reservation generates 1 invoice)
  {
    id: "r6",
    from: "Reservation",
    to: "Invoice",
    type: "composition",
    fromLabel: "1",
    toLabel: "1",
    label: "generates",
  },
  // Invoice → Payment  (1 invoice has 1..* payments)
  {
    id: "r7",
    from: "Invoice",
    to: "Payment",
    type: "composition",
    fromLabel: "1",
    toLabel: "1..*",
    label: "paid via",
  },
  // User → Reservation  (user/receptionist creates reservations)
  {
    id: "r8",
    from: "User",
    to: "Reservation",
    type: "association",
    fromLabel: "1",
    toLabel: "0..*",
    label: "creates",
    via: [{ x: 340, y: 100 }, { x: 530, y: 80 }, { x: 740, y: 100 }],
  },
  // InventoryItem → InventoryTransaction (1 item has many transactions)
  {
    id: "r9",
    from: "InventoryItem",
    to: "InventoryTransaction",
    type: "composition",
    fromLabel: "1",
    toLabel: "0..*",
    label: "tracks",
  },
]

const CATEGORIES = [...new Set(CLASSES.map((c) => c.category))]

// ── SVG dimensions ────────────────────────────────────────────────────

const SVG_W = 1780
const SVG_H = 920

// ── Component ─────────────────────────────────────────────────────────

export default function ClassDiagram() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string | null>(null)

  // ── Pan & Zoom handlers ──

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.08 : 0.08
      setZoom((z) => Math.max(0.3, Math.min(3, z + delta)))
    },
    []
  )

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
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  // ── Download ──

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
      link.download = "hotel-class-diagram.png"
      link.href = canvas.toDataURL("image/png")
      link.click()
    }
    img.src = url
  }, [])

  // ── Helpers ──

  function isClassVisible(c: UMLClass) {
    if (!filterCat) return true
    return c.category === filterCat
  }

  function isRelVisible(r: Relationship) {
    const fromClass = CLASSES.find((c) => c.id === r.from)
    const toClass = CLASSES.find((c) => c.id === r.to)
    if (!fromClass || !toClass) return false
    if (filterCat && fromClass.category !== filterCat && toClass.category !== filterCat) return false
    return true
  }

  function getClassCenter(id: string): { x: number; y: number } {
    const c = CLASSES.find((cl) => cl.id === id)!
    return { x: c.x + BOX_W / 2, y: c.y + boxH(c) / 2 }
  }

  // ── Render edge path ──

  function edgePath(rel: Relationship): string {
    const fromC = CLASSES.find((c) => c.id === rel.from)!
    const toC = CLASSES.find((c) => c.id === rel.to)!
    const fromH = boxH(fromC)
    const toH = boxH(toC)

    if (rel.via && rel.via.length > 0) {
      const startPt = closestBorderPoint(fromC, rel.via[0])
      const endPt = closestBorderPoint(toC, rel.via[rel.via.length - 1])
      let d = `M ${startPt.x} ${startPt.y}`
      for (const pt of rel.via) {
        d += ` L ${pt.x} ${pt.y}`
      }
      d += ` L ${endPt.x} ${endPt.y}`
      return d
    }

    const fromCenter = { x: fromC.x + BOX_W / 2, y: fromC.y + fromH / 2 }
    const toCenter = { x: toC.x + BOX_W / 2, y: toC.y + toH / 2 }
    const start = closestBorderPoint(fromC, toCenter)
    const end = closestBorderPoint(toC, fromCenter)
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
  }

  function closestBorderPoint(c: UMLClass, target: { x: number; y: number }) {
    const h = boxH(c)
    const cx = c.x + BOX_W / 2
    const cy = c.y + h / 2
    const dx = target.x - cx
    const dy = target.y - cy
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    const scaleX = BOX_W / 2 / (absDx || 1)
    const scaleY = h / 2 / (absDy || 1)
    const scale = Math.min(scaleX, scaleY)
    return { x: cx + dx * scale, y: cy + dy * scale }
  }

  function edgeLabelPos(rel: Relationship): { x: number; y: number } {
    if (rel.via && rel.via.length > 0) {
      const mid = Math.floor(rel.via.length / 2)
      return { x: rel.via[mid].x, y: rel.via[mid].y - 10 }
    }
    const a = getClassCenter(rel.from)
    const b = getClassCenter(rel.to)
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 10 }
  }

  function multiplicityPos(rel: Relationship, end: "from" | "to"): { x: number; y: number } {
    const fromC = CLASSES.find((c) => c.id === rel.from)!
    const toC = CLASSES.find((c) => c.id === rel.to)!
    if (end === "from") {
      const target = rel.via && rel.via.length > 0 ? rel.via[0] : getClassCenter(rel.to)
      const pt = closestBorderPoint(fromC, target)
      const dx = target.x - pt.x
      const dy = target.y - pt.y
      const len = Math.sqrt(dx * dx + dy * dy) || 1
      return { x: pt.x + (dx / len) * 18 + 8, y: pt.y + (dy / len) * 18 - 6 }
    } else {
      const target =
        rel.via && rel.via.length > 0 ? rel.via[rel.via.length - 1] : getClassCenter(rel.from)
      const pt = closestBorderPoint(toC, target)
      const dx = target.x - pt.x
      const dy = target.y - pt.y
      const len = Math.sqrt(dx * dx + dy * dy) || 1
      return { x: pt.x + (dx / len) * 18 + 8, y: pt.y + (dy / len) * 18 - 6 }
    }
  }

  // ── Marker IDs ──

  function markerId(rel: Relationship) {
    if (rel.type === "composition") return "diamond-filled"
    if (rel.type === "aggregation") return "diamond-open"
    return "arrow"
  }

  // ── Category colors ──

  const catColors: Record<string, string> = {
    "People & Auth": "#2563eb",
    "Hotel Assets": "#059669",
    Reservations: "#d97706",
    Services: "#7c3aed",
    Billing: "#dc2626",
    Inventory: "#0891b2",
  }

  return (
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden">
      {/* ── Legend Sidebar ── */}
      <div className="w-72 shrink-0 border-r border-border bg-card overflow-y-auto">
        <div className="p-5">
          <h2 className="text-lg font-bold text-foreground mb-1">Class Diagram</h2>
          <p className="text-xs text-muted-foreground mb-5">
            Hotel Management System -- entities, attributes, and relationships.
          </p>

          {/* Symbol Legend */}
          <div className="mb-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Notation
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 w-5 h-5 rounded border-2 border-foreground/30 bg-card flex items-center justify-center text-[9px] font-bold">
                  C
                </div>
                <div>
                  <span className="font-medium text-foreground">Class Box</span>
                  <p className="text-muted-foreground leading-snug">
                    Name, stereotype, attributes with visibility (+public, -private)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <svg width="20" height="14" className="mt-0.5 shrink-0">
                  <line x1="0" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="1.5" />
                  <polygon points="20,7 14,3 14,11" fill="currentColor" />
                </svg>
                <div>
                  <span className="font-medium text-foreground">Association</span>
                  <p className="text-muted-foreground leading-snug">Simple relationship between classes</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <svg width="20" height="14" className="mt-0.5 shrink-0">
                  <line x1="8" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="1.5" />
                  <polygon points="0,7 4,3 8,7 4,11" fill="currentColor" />
                </svg>
                <div>
                  <span className="font-medium text-foreground">Composition</span>
                  <p className="text-muted-foreground leading-snug">
                    Strong ownership -- part cannot exist without the whole
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0 rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] font-mono font-medium">
                  PK
                </div>
                <div>
                  <span className="font-medium text-foreground">Primary Key</span>
                  <p className="text-muted-foreground leading-snug">Unique identifier for each record</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0 rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] font-mono font-medium">
                  FK
                </div>
                <div>
                  <span className="font-medium text-foreground">Foreign Key</span>
                  <p className="text-muted-foreground leading-snug">Reference to another entity's PK</p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Legend */}
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
                  <span
                    className="inline-block size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: catColors[cat] }}
                  />
                  {cat}
                  <span className="ml-auto text-[10px] opacity-60">
                    {CLASSES.filter((c) => c.category === cat).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Relationships list */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Relationships
            </h3>
            <div className="space-y-1.5">
              {RELATIONSHIPS.map((rel) => (
                <button
                  key={rel.id}
                  onMouseEnter={() => setHighlighted(rel.id)}
                  onMouseLeave={() => setHighlighted(null)}
                  className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                    highlighted === rel.id
                      ? "bg-foreground/10 text-foreground"
                      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                  }`}
                >
                  <span className="font-medium">{rel.from}</span>
                  <span className="text-[10px] opacity-50">
                    {rel.type === "composition" ? "&#9670;" : "&#8594;"}
                  </span>
                  <span className="font-medium">{rel.to}</span>
                  {rel.label && (
                    <span className="ml-auto text-[10px] italic opacity-50">{rel.label}</span>
                  )}
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
            <h1 className="text-base font-bold text-foreground">UML Class Diagram</h1>
            <span className="text-xs text-muted-foreground">
              {CLASSES.length} classes &middot; {RELATIONSHIPS.length} relationships
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
                <span
                  className="inline-block size-1.5 rounded-full mr-1"
                  style={{ backgroundColor: catColors[cat] }}
                />
                {cat}
              </Badge>
            ))}
            {filterCat && (
              <Badge
                variant="secondary"
                className="cursor-pointer text-[10px] px-2 py-0.5"
                onClick={() => setFilterCat(null)}
              >
                Show All
              </Badge>
            )}
          </div>
        </div>

        {/* SVG Area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="select-none"
          >
            <defs>
              {/* Arrow marker */}
              <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
              </marker>
              {/* Filled diamond */}
              <marker id="diamond-filled" viewBox="0 0 12 8" refX="0" refY="4" markerWidth="10" markerHeight="8" orient="auto-start-reverse">
                <path d="M 0 4 L 6 0 L 12 4 L 6 8 z" fill="#64748b" />
              </marker>
              {/* Open diamond */}
              <marker id="diamond-open" viewBox="0 0 12 8" refX="0" refY="4" markerWidth="10" markerHeight="8" orient="auto-start-reverse">
                <path d="M 0 4 L 6 0 L 12 4 L 6 8 z" fill="white" stroke="#64748b" strokeWidth="1.5" />
              </marker>
              {/* Drop shadow */}
              <filter id="shadow" x="-4%" y="-4%" width="108%" height="112%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.08" />
              </filter>
            </defs>

            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
              {/* ── Relationship edges ── */}
              {RELATIONSHIPS.filter(isRelVisible).map((rel) => {
                const isHl = highlighted === rel.id
                const opacity = highlighted && !isHl ? 0.15 : 1
                const lbl = edgeLabelPos(rel)
                const fromMult = multiplicityPos(rel, "from")
                const toMult = multiplicityPos(rel, "to")

                return (
                  <g
                    key={rel.id}
                    opacity={opacity}
                    onMouseEnter={() => setHighlighted(rel.id)}
                    onMouseLeave={() => setHighlighted(null)}
                    className="transition-opacity duration-200"
                  >
                    <path
                      d={edgePath(rel)}
                      fill="none"
                      stroke={isHl ? "#2563eb" : "#94a3b8"}
                      strokeWidth={isHl ? 2.5 : 1.5}
                      strokeDasharray={rel.type === "association" ? "none" : "none"}
                      markerStart={rel.type !== "association" ? `url(#${markerId(rel)})` : undefined}
                      markerEnd="url(#arrow)"
                    />
                    {/* Relationship label */}
                    {rel.label && (
                      <text
                        x={lbl.x}
                        y={lbl.y}
                        textAnchor="middle"
                        fill={isHl ? "#2563eb" : "#64748b"}
                        fontSize="10"
                        fontStyle="italic"
                        fontFamily="sans-serif"
                      >
                        {rel.label}
                      </text>
                    )}
                    {/* Multiplicity labels */}
                    <text x={fromMult.x} y={fromMult.y} fill={isHl ? "#2563eb" : "#475569"} fontSize="10" fontWeight="600" fontFamily="monospace">
                      {rel.fromLabel}
                    </text>
                    <text x={toMult.x} y={toMult.y} fill={isHl ? "#2563eb" : "#475569"} fontSize="10" fontWeight="600" fontFamily="monospace">
                      {rel.toLabel}
                    </text>
                  </g>
                )
              })}

              {/* ── Class boxes ── */}
              {CLASSES.filter(isClassVisible).map((cls) => {
                const h = boxH(cls)
                const isHl = highlighted && RELATIONSHIPS.find(
                  (r) => r.id === highlighted && (r.from === cls.id || r.to === cls.id)
                )
                const dimmed = highlighted && !isHl

                return (
                  <g
                    key={cls.id}
                    className="transition-opacity duration-200"
                    opacity={dimmed ? 0.25 : 1}
                  >
                    {/* Shadow rect */}
                    <rect
                      x={cls.x}
                      y={cls.y}
                      width={BOX_W}
                      height={h}
                      rx={6}
                      fill="white"
                      filter="url(#shadow)"
                    />
                    {/* Border */}
                    <rect
                      x={cls.x}
                      y={cls.y}
                      width={BOX_W}
                      height={h}
                      rx={6}
                      fill="white"
                      stroke={cls.color}
                      strokeWidth={isHl ? 2.5 : 1.5}
                    />
                    {/* Header bg */}
                    <rect
                      x={cls.x}
                      y={cls.y}
                      width={BOX_W}
                      height={HEADER_H}
                      rx={6}
                      fill={cls.color}
                    />
                    {/* Fix bottom corners of header */}
                    <rect
                      x={cls.x}
                      y={cls.y + HEADER_H - 8}
                      width={BOX_W}
                      height={8}
                      fill={cls.color}
                    />
                    {/* Stereotype */}
                    {cls.stereotype && (
                      <text
                        x={cls.x + BOX_W / 2}
                        y={cls.y + 18}
                        textAnchor="middle"
                        fill="white"
                        fontSize="9"
                        fontFamily="monospace"
                        opacity={0.8}
                      >
                        {`\u00AB${cls.stereotype}\u00BB`}
                      </text>
                    )}
                    {/* Class name */}
                    <text
                      x={cls.x + BOX_W / 2}
                      y={cls.y + (cls.stereotype ? 38 : 32)}
                      textAnchor="middle"
                      fill="white"
                      fontSize="14"
                      fontWeight="700"
                      fontFamily="sans-serif"
                    >
                      {cls.name}
                    </text>
                    {/* Divider line */}
                    <line
                      x1={cls.x}
                      y1={cls.y + HEADER_H}
                      x2={cls.x + BOX_W}
                      y2={cls.y + HEADER_H}
                      stroke={cls.color}
                      strokeWidth="1"
                      opacity={0.3}
                    />
                    {/* Attributes */}
                    {cls.attributes.map((attr, i) => {
                      const ay = cls.y + HEADER_H + 16 + i * ATTR_H
                      return (
                        <g key={attr.name}>
                          {/* Alternating row bg */}
                          {i % 2 === 1 && (
                            <rect
                              x={cls.x + 1}
                              y={ay - 12}
                              width={BOX_W - 2}
                              height={ATTR_H}
                              fill="#f8fafc"
                              rx={0}
                            />
                          )}
                          {/* Visibility + name */}
                          <text
                            x={cls.x + 12}
                            y={ay}
                            fill="#334155"
                            fontSize="11.5"
                            fontFamily="monospace"
                          >
                            <tspan fill={attr.visibility === "+" ? "#059669" : attr.visibility === "-" ? "#dc2626" : "#d97706"}>
                              {attr.visibility}
                            </tspan>
                            {" "}
                            {attr.name}
                            <tspan fill="#94a3b8">{` : ${attr.type}`}</tspan>
                          </text>
                          {/* PK / FK badges */}
                          {attr.pk && (
                            <g>
                              <rect x={cls.x + BOX_W - 52} y={ay - 10} width={22} height={14} rx={3} fill="#2563eb" opacity={0.15} />
                              <text x={cls.x + BOX_W - 41} y={ay} textAnchor="middle" fill="#2563eb" fontSize="8" fontWeight="700" fontFamily="monospace">
                                PK
                              </text>
                            </g>
                          )}
                          {attr.fk && (
                            <g>
                              <rect x={cls.x + BOX_W - (attr.pk ? 80 : 52)} y={ay - 10} width={22} height={14} rx={3} fill="#d97706" opacity={0.15} />
                              <text x={cls.x + BOX_W - (attr.pk ? 69 : 41)} y={ay} textAnchor="middle" fill="#d97706" fontSize="8" fontWeight="700" fontFamily="monospace">
                                FK
                              </text>
                            </g>
                          )}
                        </g>
                      )
                    })}
                  </g>
                )
              })}
            </g>
          </svg>

          {/* Zoom / Download controls */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-sm">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setZoom((z) => Math.min(3, z + 0.2))}>
              <ZoomIn className="size-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-12 text-center tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))}>
              <ZoomOut className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8" onClick={resetView}>
              <Maximize2 className="size-4" />
            </Button>
            <div className="mx-0.5 h-5 w-px bg-border" />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={downloadAsPng}
              aria-label="Download as PNG"
            >
              <Download className="size-4" />
              PNG
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
