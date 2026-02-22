"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Maximize2, Download } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────

interface Attr {
  name: string
  type: string
  pk?: boolean
  fk?: boolean
}

interface Entity {
  id: string
  name: string
  attributes: Attr[]
  x: number
  y: number
  color: string
  category: string
}

interface Rel {
  id: string
  from: string
  to: string
  fromCard: string
  toCard: string
  label: string
  note?: string
  via?: { x: number; y: number }[]
}

// ── Data ───────────────────────────────────────────────────────────────

const ENTITY_W = 240
const ATTR_H = 22
const HEADER_H = 44
const PAD_BOTTOM = 10

function entityH(e: Entity) {
  return HEADER_H + e.attributes.length * ATTR_H + PAD_BOTTOM
}

const ENTITIES: Entity[] = [
  {
    id: "User",
    name: "User",
    attributes: [
      { name: "userId", type: "INT", pk: true },
      { name: "username", type: "VARCHAR" },
      { name: "passwordHash", type: "VARCHAR" },
      { name: "role", type: "ENUM" },
      { name: "isActive", type: "BOOLEAN" },
    ],
    x: 60, y: 40,
    color: "#2563eb",
    category: "People & Auth",
  },
  {
    id: "Customer",
    name: "Customer",
    attributes: [
      { name: "customerId", type: "INT", pk: true },
      { name: "fullName", type: "VARCHAR" },
      { name: "phone", type: "VARCHAR" },
      { name: "email", type: "VARCHAR" },
      { name: "idCardNo", type: "VARCHAR?" },
    ],
    x: 60, y: 310,
    color: "#2563eb",
    category: "People & Auth",
  },
  {
    id: "Room",
    name: "Room",
    attributes: [
      { name: "roomId", type: "INT", pk: true },
      { name: "roomNumber", type: "VARCHAR" },
      { name: "type", type: "ENUM" },
      { name: "pricePerNight", type: "DECIMAL" },
      { name: "status", type: "ENUM" },
    ],
    x: 420, y: 40,
    color: "#059669",
    category: "Hotel Assets",
  },
  {
    id: "Table",
    name: "Table",
    attributes: [
      { name: "tableId", type: "INT", pk: true },
      { name: "tableNumber", type: "VARCHAR" },
      { name: "capacity", type: "INT" },
      { name: "status", type: "ENUM" },
    ],
    x: 420, y: 310,
    color: "#059669",
    category: "Hotel Assets",
  },
  {
    id: "Reservation",
    name: "Reservation",
    attributes: [
      { name: "reservationId", type: "INT", pk: true },
      { name: "customerId", type: "INT", fk: true },
      { name: "roomId", type: "INT?", fk: true },
      { name: "tableId", type: "INT?", fk: true },
      { name: "startDate", type: "DATE" },
      { name: "endDate", type: "DATE" },
      { name: "reservationType", type: "ENUM" },
      { name: "status", type: "ENUM" },
      { name: "createdBy", type: "INT", fk: true },
      { name: "createdAt", type: "DATETIME" },
    ],
    x: 780, y: 40,
    color: "#d97706",
    category: "Reservations",
  },
  {
    id: "Service",
    name: "Service",
    attributes: [
      { name: "serviceId", type: "INT", pk: true },
      { name: "name", type: "VARCHAR" },
      { name: "unitPrice", type: "DECIMAL" },
      { name: "category", type: "VARCHAR" },
    ],
    x: 780, y: 440,
    color: "#7c3aed",
    category: "Services",
  },
  {
    id: "ServiceUsage",
    name: "ServiceUsage",
    attributes: [
      { name: "usageId", type: "INT", pk: true },
      { name: "invoiceId", type: "INT", fk: true },
      { name: "serviceId", type: "INT", fk: true },
      { name: "quantity", type: "INT" },
      { name: "dateTime", type: "DATETIME" },
      { name: "totalPrice", type: "DECIMAL" },
    ],
    x: 780, y: 680,
    color: "#7c3aed",
    category: "Services",
  },
  {
    id: "Invoice",
    name: "Invoice",
    attributes: [
      { name: "invoiceId", type: "INT", pk: true },
      { name: "reservationId", type: "INT", fk: true },
      { name: "invoiceDate", type: "DATE" },
      { name: "subtotal", type: "DECIMAL" },
      { name: "tax", type: "DECIMAL" },
      { name: "total", type: "DECIMAL" },
      { name: "status", type: "ENUM" },
    ],
    x: 1180, y: 40,
    color: "#dc2626",
    category: "Billing",
  },
  {
    id: "Payment",
    name: "Payment",
    attributes: [
      { name: "paymentId", type: "INT", pk: true },
      { name: "invoiceId", type: "INT", fk: true },
      { name: "amount", type: "DECIMAL" },
      { name: "method", type: "ENUM" },
      { name: "paidAt", type: "DATETIME" },
      { name: "status", type: "ENUM" },
    ],
    x: 1180, y: 390,
    color: "#dc2626",
    category: "Billing",
  },
  {
    id: "InventoryItem",
    name: "InventoryItem",
    attributes: [
      { name: "itemId", type: "INT", pk: true },
      { name: "name", type: "VARCHAR" },
      { name: "unit", type: "VARCHAR" },
      { name: "quantityOnHand", type: "INT" },
      { name: "minThreshold", type: "INT" },
    ],
    x: 1540, y: 40,
    color: "#0891b2",
    category: "Inventory",
  },
  {
    id: "InventoryTransaction",
    name: "InventoryTransaction",
    attributes: [
      { name: "transactionId", type: "INT", pk: true },
      { name: "itemId", type: "INT", fk: true },
      { name: "recordedBy", type: "INT", fk: true },
      { name: "type", type: "ENUM" },
      { name: "quantity", type: "INT" },
      { name: "dateTime", type: "DATETIME" },
      { name: "notes", type: "TEXT?" },
    ],
    x: 1540, y: 340,
    color: "#0891b2",
    category: "Inventory",
  },
]

const RELATIONSHIPS: Rel[] = [
  {
    id: "r1",
    from: "Customer",
    to: "Reservation",
    fromCard: "1",
    toCard: "*",
    label: "makes",
  },
  {
    id: "r2",
    from: "Reservation",
    to: "Room",
    fromCard: "*",
    toCard: "0..1",
    label: "books",
    note: "if reservationType = Room",
  },
  {
    id: "r3",
    from: "Reservation",
    to: "Table",
    fromCard: "*",
    toCard: "0..1",
    label: "reserves",
    note: "if reservationType = Table",
    via: [{ x: 690, y: 230 }, { x: 660, y: 380 }],
  },
  {
    id: "r4",
    from: "Reservation",
    to: "Invoice",
    fromCard: "1",
    toCard: "0..1",
    label: "generates",
  },
  {
    id: "r5",
    from: "Invoice",
    to: "ServiceUsage",
    fromCard: "1",
    toCard: "*",
    label: "contains",
    via: [{ x: 1140, y: 400 }, { x: 1040, y: 700 }],
  },
  {
    id: "r6",
    from: "Service",
    to: "ServiceUsage",
    fromCard: "1",
    toCard: "*",
    label: "used in",
  },
  {
    id: "r7",
    from: "Invoice",
    to: "Payment",
    fromCard: "1",
    toCard: "0..*",
    label: "paid via",
  },
  {
    id: "r8",
    from: "InventoryItem",
    to: "InventoryTransaction",
    fromCard: "1",
    toCard: "*",
    label: "tracks",
  },
  {
    id: "r9",
    from: "User",
    to: "Reservation",
    fromCard: "1",
    toCard: "*",
    label: "createdBy",
    via: [{ x: 350, y: 80 }, { x: 560, y: 60 }, { x: 780, y: 80 }],
  },
  {
    id: "r10",
    from: "User",
    to: "InventoryTransaction",
    fromCard: "1",
    toCard: "*",
    label: "recordedBy",
    via: [{ x: 200, y: 580 }, { x: 400, y: 850 }, { x: 1200, y: 850 }, { x: 1540, y: 600 }],
  },
]

const CATEGORIES = [...new Set(ENTITIES.map((e) => e.category))]

const SVG_W = 1900
const SVG_H = 960

const catColors: Record<string, string> = {
  "People & Auth": "#2563eb",
  "Hotel Assets": "#059669",
  Reservations: "#d97706",
  Services: "#7c3aed",
  Billing: "#dc2626",
  Inventory: "#0891b2",
}

// ── Component ─────────────────────────────────────────────────────────

export default function ERDiagram() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(0.85)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string | null>(null)

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.08 : 0.08
    setZoom((z) => Math.max(0.2, Math.min(3, z + delta)))
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
    setZoom(0.85)
    setPan({ x: 0, y: 0 })
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

  // ── Helpers ──

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

  function getCenter(id: string): { x: number; y: number } {
    const e = ENTITIES.find((ent) => ent.id === id)!
    return { x: e.x + ENTITY_W / 2, y: e.y + entityH(e) / 2 }
  }

  function borderPoint(e: Entity, target: { x: number; y: number }) {
    const h = entityH(e)
    const cx = e.x + ENTITY_W / 2
    const cy = e.y + h / 2
    const dx = target.x - cx
    const dy = target.y - cy
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    const scaleX = ENTITY_W / 2 / (absDx || 1)
    const scaleY = h / 2 / (absDy || 1)
    const scale = Math.min(scaleX, scaleY)
    return { x: cx + dx * scale, y: cy + dy * scale }
  }

  function edgePath(rel: Rel): string {
    const fromE = ENTITIES.find((e) => e.id === rel.from)!
    const toE = ENTITIES.find((e) => e.id === rel.to)!
    if (rel.via && rel.via.length > 0) {
      const startPt = borderPoint(fromE, rel.via[0])
      const endPt = borderPoint(toE, rel.via[rel.via.length - 1])
      let d = `M ${startPt.x} ${startPt.y}`
      for (const pt of rel.via) d += ` L ${pt.x} ${pt.y}`
      d += ` L ${endPt.x} ${endPt.y}`
      return d
    }
    const fromCenter = getCenter(rel.from)
    const toCenter = getCenter(rel.to)
    const start = borderPoint(fromE, toCenter)
    const end = borderPoint(toE, fromCenter)
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
  }

  function labelPos(rel: Rel): { x: number; y: number } {
    if (rel.via && rel.via.length > 0) {
      const mid = Math.floor(rel.via.length / 2)
      return { x: rel.via[mid].x, y: rel.via[mid].y - 12 }
    }
    const a = getCenter(rel.from)
    const b = getCenter(rel.to)
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 12 }
  }

  function cardPos(rel: Rel, end: "from" | "to"): { x: number; y: number } {
    const fromE = ENTITIES.find((e) => e.id === rel.from)!
    const toE = ENTITIES.find((e) => e.id === rel.to)!
    if (end === "from") {
      const target = rel.via && rel.via.length > 0 ? rel.via[0] : getCenter(rel.to)
      const pt = borderPoint(fromE, target)
      const dx = target.x - pt.x
      const dy = target.y - pt.y
      const len = Math.sqrt(dx * dx + dy * dy) || 1
      return { x: pt.x + (dx / len) * 20 + 10, y: pt.y + (dy / len) * 20 - 8 }
    } else {
      const target = rel.via && rel.via.length > 0 ? rel.via[rel.via.length - 1] : getCenter(rel.from)
      const pt = borderPoint(toE, target)
      const dx = target.x - pt.x
      const dy = target.y - pt.y
      const len = Math.sqrt(dx * dx + dy * dy) || 1
      return { x: pt.x + (dx / len) * 20 + 10, y: pt.y + (dy / len) * 20 - 8 }
    }
  }

  // ── Crow's foot markers ──

  function crowFoot(card: string): string {
    // "1" = single line, "*" / "0..*" = crow's foot, "0..1" = single + circle
    if (card === "1") return "one"
    if (card === "0..1") return "zero-one"
    return "many" // *, 0..*, 1..*
  }

  return (
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden">
      {/* ── Legend Sidebar ── */}
      <div className="w-72 shrink-0 border-r border-border bg-card overflow-y-auto">
        <div className="p-5">
          <h2 className="text-lg font-bold text-foreground mb-1">ER Diagram</h2>
          <p className="text-xs text-muted-foreground mb-5">
            Entity-Relationship Diagram -- Hotel Management System entities, attributes, and cardinalities.
          </p>

          {/* Notation */}
          <div className="mb-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Notation
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 w-5 h-4 rounded border-2 border-foreground/30 bg-card" />
                <div>
                  <span className="font-medium text-foreground">Entity</span>
                  <p className="text-muted-foreground leading-snug">Table in the database with columns</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <svg width="20" height="14" className="mt-0.5 shrink-0">
                  <line x1="0" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <div>
                  <span className="font-medium text-foreground">Relationship</span>
                  <p className="text-muted-foreground leading-snug">Foreign key reference between entities</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <svg width="24" height="16" className="mt-0.5 shrink-0">
                  <line x1="0" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="2" />
                  <line x1="12" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="2" />
                  <line x1="12" y1="2" x2="12" y2="14" stroke="currentColor" strokeWidth="2" />
                </svg>
                <div>
                  <span className="font-medium text-foreground">One (1)</span>
                  <p className="text-muted-foreground leading-snug">Exactly one instance</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <svg width="24" height="16" className="mt-0.5 shrink-0">
                  <line x1="0" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="14" y1="8" x2="22" y2="2" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="14" y1="8" x2="22" y2="14" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="14" y1="8" x2="22" y2="8" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <div>
                  <span className="font-medium text-foreground">{"Many (*)"}</span>
                  <p className="text-muted-foreground leading-snug">Zero or more instances (crow's foot)</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <svg width="24" height="16" className="mt-0.5 shrink-0">
                  <line x1="0" y1="8" x2="10" y2="8" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="16" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="20" y1="3" x2="20" y2="13" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <div>
                  <span className="font-medium text-foreground">Zero or One (0..1)</span>
                  <p className="text-muted-foreground leading-snug">Optional single instance</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0 rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] font-mono font-medium">
                  PK
                </div>
                <div>
                  <span className="font-medium text-foreground">Primary Key</span>
                  <p className="text-muted-foreground leading-snug">Unique identifier</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0 rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] font-mono font-medium">
                  FK
                </div>
                <div>
                  <span className="font-medium text-foreground">Foreign Key</span>
                  <p className="text-muted-foreground leading-snug">Reference to another table</p>
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
                  <span
                    className="inline-block size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: catColors[cat] }}
                  />
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
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-medium">{rel.from}</span>
                    <span className="font-mono text-[10px] opacity-50">{rel.fromCard}</span>
                    <span className="text-[10px] opacity-40">---</span>
                    <span className="font-mono text-[10px] opacity-50">{rel.toCard}</span>
                    <span className="font-medium">{rel.to}</span>
                  </div>
                  <span className="ml-auto text-[10px] italic opacity-50 shrink-0">{rel.label}</span>
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

        {/* SVG */}
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
              {/* Arrow */}
              <marker id="er-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
              </marker>
              {/* Crow's foot (many) */}
              <marker id="er-many" viewBox="0 0 16 16" refX="16" refY="8" markerWidth="12" markerHeight="12" orient="auto">
                <line x1="16" y1="2" x2="4" y2="8" stroke="#64748b" strokeWidth="1.5" />
                <line x1="16" y1="14" x2="4" y2="8" stroke="#64748b" strokeWidth="1.5" />
                <line x1="16" y1="8" x2="4" y2="8" stroke="#64748b" strokeWidth="1.5" />
              </marker>
              {/* One */}
              <marker id="er-one" viewBox="0 0 10 16" refX="10" refY="8" markerWidth="8" markerHeight="12" orient="auto">
                <line x1="8" y1="2" x2="8" y2="14" stroke="#64748b" strokeWidth="2" />
              </marker>
              {/* Zero-one */}
              <marker id="er-zero-one" viewBox="0 0 20 16" refX="20" refY="8" markerWidth="16" markerHeight="12" orient="auto">
                <circle cx="8" cy="8" r="4" fill="white" stroke="#64748b" strokeWidth="1.5" />
                <line x1="16" y1="2" x2="16" y2="14" stroke="#64748b" strokeWidth="2" />
              </marker>
              {/* Shadow */}
              <filter id="er-shadow" x="-4%" y="-4%" width="108%" height="112%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.08" />
              </filter>
            </defs>

            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
              {/* Relationship edges */}
              {RELATIONSHIPS.filter(isRelVisible).map((rel) => {
                const isHl = highlighted === rel.id
                const opacity = highlighted && !isHl ? 0.15 : 1
                const lbl = labelPos(rel)
                const fromP = cardPos(rel, "from")
                const toP = cardPos(rel, "to")
                const fromFoot = crowFoot(rel.fromCard)
                const toFoot = crowFoot(rel.toCard)

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
                      markerStart={`url(#er-${fromFoot})`}
                      markerEnd={`url(#er-${toFoot})`}
                    />
                    {/* Label on edge */}
                    <rect
                      x={lbl.x - 30}
                      y={lbl.y - 10}
                      width={60}
                      height={16}
                      rx={4}
                      fill="white"
                      opacity={0.9}
                    />
                    <text
                      x={lbl.x}
                      y={lbl.y + 1}
                      textAnchor="middle"
                      fill={isHl ? "#2563eb" : "#475569"}
                      fontSize="10"
                      fontStyle="italic"
                      fontFamily="sans-serif"
                    >
                      {rel.label}
                    </text>
                    {/* Note */}
                    {rel.note && (
                      <text
                        x={lbl.x}
                        y={lbl.y + 14}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="8"
                        fontStyle="italic"
                        fontFamily="sans-serif"
                      >
                        {rel.note}
                      </text>
                    )}
                    {/* Cardinality labels */}
                    <text x={fromP.x} y={fromP.y} fill={isHl ? "#2563eb" : "#475569"} fontSize="11" fontWeight="700" fontFamily="monospace">
                      {rel.fromCard}
                    </text>
                    <text x={toP.x} y={toP.y} fill={isHl ? "#2563eb" : "#475569"} fontSize="11" fontWeight="700" fontFamily="monospace">
                      {rel.toCard}
                    </text>
                  </g>
                )
              })}

              {/* Entity boxes */}
              {ENTITIES.filter(isEntityVisible).map((ent) => {
                const h = entityH(ent)
                const isHl =
                  highlighted &&
                  RELATIONSHIPS.find((r) => r.id === highlighted && (r.from === ent.id || r.to === ent.id))
                const dimmed = highlighted && !isHl

                return (
                  <g key={ent.id} className="transition-opacity duration-200" opacity={dimmed ? 0.25 : 1}>
                    {/* Shadow */}
                    <rect x={ent.x} y={ent.y} width={ENTITY_W} height={h} rx={6} fill="white" filter="url(#er-shadow)" />
                    {/* Border */}
                    <rect
                      x={ent.x}
                      y={ent.y}
                      width={ENTITY_W}
                      height={h}
                      rx={6}
                      fill="white"
                      stroke={ent.color}
                      strokeWidth={isHl ? 2.5 : 1.5}
                    />
                    {/* Header */}
                    <rect x={ent.x} y={ent.y} width={ENTITY_W} height={HEADER_H} rx={6} fill={ent.color} />
                    <rect x={ent.x} y={ent.y + HEADER_H - 8} width={ENTITY_W} height={8} fill={ent.color} />
                    {/* Entity name */}
                    <text
                      x={ent.x + ENTITY_W / 2}
                      y={ent.y + 28}
                      textAnchor="middle"
                      fill="white"
                      fontSize="14"
                      fontWeight="700"
                      fontFamily="sans-serif"
                    >
                      {ent.name}
                    </text>
                    {/* Divider */}
                    <line
                      x1={ent.x}
                      y1={ent.y + HEADER_H}
                      x2={ent.x + ENTITY_W}
                      y2={ent.y + HEADER_H}
                      stroke={ent.color}
                      strokeWidth="1"
                      opacity={0.3}
                    />
                    {/* Attributes */}
                    {ent.attributes.map((attr, i) => {
                      const ay = ent.y + HEADER_H + 16 + i * ATTR_H
                      return (
                        <g key={attr.name}>
                          {i % 2 === 1 && (
                            <rect
                              x={ent.x + 1}
                              y={ay - 12}
                              width={ENTITY_W - 2}
                              height={ATTR_H}
                              fill="#f8fafc"
                            />
                          )}
                          {/* PK underline indicator */}
                          {attr.pk && (
                            <line
                              x1={ent.x + 28}
                              y1={ay + 2}
                              x2={ent.x + 28 + attr.name.length * 7}
                              y2={ay + 2}
                              stroke={ent.color}
                              strokeWidth="1"
                              opacity={0.5}
                            />
                          )}
                          <text x={ent.x + 12} y={ay} fill="#334155" fontSize="11.5" fontFamily="monospace">
                            {attr.name}
                            <tspan fill="#94a3b8">{` : ${attr.type}`}</tspan>
                          </text>
                          {attr.pk && (
                            <g>
                              <rect x={ent.x + ENTITY_W - 52} y={ay - 10} width={22} height={14} rx={3} fill="#2563eb" opacity={0.15} />
                              <text x={ent.x + ENTITY_W - 41} y={ay} textAnchor="middle" fill="#2563eb" fontSize="8" fontWeight="700" fontFamily="monospace">
                                PK
                              </text>
                            </g>
                          )}
                          {attr.fk && (
                            <g>
                              <rect x={ent.x + ENTITY_W - (attr.pk ? 80 : 52)} y={ay - 10} width={22} height={14} rx={3} fill="#d97706" opacity={0.15} />
                              <text x={ent.x + ENTITY_W - (attr.pk ? 69 : 41)} y={ay} textAnchor="middle" fill="#d97706" fontSize="8" fontWeight="700" fontFamily="monospace">
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

          {/* Controls */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-sm">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setZoom((z) => Math.min(3, z + 0.2))}>
              <ZoomIn className="size-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-12 text-center tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setZoom((z) => Math.max(0.2, z - 0.2))}>
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
