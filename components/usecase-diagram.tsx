"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Maximize2, Download } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────

interface UseCaseNode {
  id: string
  label: string
  x: number
  y: number
  actor?: string
}

interface Relationship {
  from: string
  to: string
  type: "include" | "extend"
  meaning: string
}

interface ActorDef {
  id: string
  label: string
  x: number
  y: number
  color: string
}

// ── Data ───────────────────────────────────────────────────────────────

const ACTORS: ActorDef[] = [
  { id: "receptionist", label: "Receptionist", x: 90, y: 380, color: "#2563eb" },
  { id: "operations", label: "Operational Staff", x: 90, y: 820, color: "#059669" },
  { id: "admin", label: "Administrator", x: 1160, y: 820, color: "#d97706" },
]

const USE_CASES: UseCaseNode[] = [
  // ── Receptionist use cases (left-center column)
  { id: "create-res", label: "Create Reservation\n(Room / Table)", x: 440, y: 120, actor: "receptionist" },
  { id: "modify-res", label: "Modify Reservation", x: 440, y: 220, actor: "receptionist" },
  { id: "cancel-res", label: "Cancel Reservation", x: 440, y: 320, actor: "receptionist" },
  { id: "checkin", label: "Check-in Guest", x: 440, y: 420, actor: "receptionist" },
  { id: "checkout", label: "Check-out Guest", x: 440, y: 520, actor: "receptionist" },
  { id: "gen-invoice", label: "Generate Invoice", x: 440, y: 620, actor: "receptionist" },
  { id: "view-res", label: "View / Search\nReservation List", x: 440, y: 720, actor: "receptionist" },

  // ── Shared / include-extend targets (center-right)
  { id: "check-avail", label: "Check Availability", x: 760, y: 120, actor: "receptionist" },
  { id: "add-services", label: "Add Services\nto Stay", x: 760, y: 520, actor: "receptionist" },
  { id: "record-pay", label: "Record Payment", x: 760, y: 620, actor: "receptionist" },

  // ── Operations use cases (left-center, below)
  { id: "update-room", label: "Update Room Status\n(Cleaning / Available)", x: 440, y: 860, actor: "operations" },
  { id: "reg-inventory", label: "Register Inventory\nUsage (Outflow)", x: 440, y: 960, actor: "operations" },
  { id: "view-inventory", label: "View Inventory\nLevels", x: 440, y: 1060, actor: "operations" },

  // ── Admin use cases (right column)
  { id: "manage-users", label: "Manage Users\n(Create / Edit / Deactivate)", x: 860, y: 760, actor: "admin" },
  { id: "assign-roles", label: "Assign Roles /\nPermissions", x: 860, y: 860, actor: "admin" },
  { id: "manage-rooms", label: "Manage Rooms\n& Tables (Add / Edit)", x: 860, y: 960, actor: "admin" },
  { id: "manage-prices", label: "Manage Price List", x: 860, y: 1060, actor: "admin" },
  { id: "view-reports", label: "View Reports", x: 860, y: 1150, actor: "admin" },
]

const RELATIONSHIPS: Relationship[] = [
  {
    from: "create-res",
    to: "check-avail",
    type: "include",
    meaning: "Creating a reservation always requires checking availability first.",
  },
  {
    from: "checkin",
    to: "create-res",
    type: "extend",
    meaning: "A walk-in guest may trigger a new reservation during check-in.",
  },
  {
    from: "gen-invoice",
    to: "add-services",
    type: "include",
    meaning: "Invoice generation always pulls in services added to the stay.",
  },
  {
    from: "record-pay",
    to: "gen-invoice",
    type: "extend",
    meaning: "Payment recording optionally extends the invoicing flow.",
  },
]

// ── Helpers ────────────────────────────────────────────────────────────

const ELLIPSE_RX = 130
const ELLIPSE_RY = 38

const SVG_W = 1260
const SVG_H = 1230

function getActorColor(actorId: string | undefined) {
  return ACTORS.find((a) => a.id === actorId)?.color ?? "#6b7280"
}

function getEllipseCenter(uc: UseCaseNode) {
  return { cx: uc.x, cy: uc.y }
}

function ellipseBorderPoint(cx: number, cy: number, angle: number) {
  const cosA = Math.cos(angle)
  const sinA = Math.sin(angle)
  const denom = Math.sqrt(
    (ELLIPSE_RY * cosA) ** 2 + (ELLIPSE_RX * sinA) ** 2
  )
  return {
    x: cx + (ELLIPSE_RX * ELLIPSE_RY * cosA) / denom,
    y: cy + (ELLIPSE_RX * ELLIPSE_RY * sinA) / denom,
  }
}

// ── Component ──────────────────────────────────────────────────────────

export function UseCaseDiagram() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [selectedRelType, setSelectedRelType] = useState<"all" | "include" | "extend">("all")

  function fitToContainer() {
    if (!containerRef.current) return
    const cw = containerRef.current.clientWidth
    const ch = containerRef.current.clientHeight
    const s = Math.min(cw / SVG_W, ch / SVG_H, 1) * 0.95
    setScale(s)
    setTranslate({
      x: (cw - SVG_W * s) / 2,
      y: Math.max(10, (ch - SVG_H * s) / 2),
    })
  }

  useEffect(() => {
    fitToContainer()
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.93 : 1.07
    setScale((s) => Math.max(0.2, Math.min(3, s * delta)))
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      setIsPanning(true)
      setPanStart({ x: e.clientX - translate.x, y: e.clientY - translate.y })
    },
    [translate]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning) return
      setTranslate({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      })
    },
    [isPanning, panStart]
  )

  const handlePointerUp = useCallback(() => setIsPanning(false), [])

  const downloadAsPng = useCallback(() => {
    const svgEl = containerRef.current?.querySelector("svg")
    if (!svgEl) return

    // Clone the SVG so we can set fixed dimensions for export
    const clone = svgEl.cloneNode(true) as SVGSVGElement
    clone.setAttribute("width", String(SVG_W))
    clone.setAttribute("height", String(SVG_H))

    // Reset the transform to show the full diagram
    const gEl = clone.querySelector("g")
    if (gEl) {
      gEl.setAttribute("transform", "translate(0,0) scale(1)")
    }

    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(clone)
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      // Render at 2x for crisp export
      const exportScale = 2
      const canvas = document.createElement("canvas")
      canvas.width = SVG_W * exportScale
      canvas.height = SVG_H * exportScale
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.scale(exportScale, exportScale)
      ctx.drawImage(img, 0, 0, SVG_W, SVG_H)

      URL.revokeObjectURL(url)

      const link = document.createElement("a")
      link.download = "hotel-usecase-diagram.png"
      link.href = canvas.toDataURL("image/png")
      link.click()
    }
    img.src = url
  }, [])

  const downloadAsSvg = useCallback(() => {
    const svgEl = containerRef.current?.querySelector("svg")
    if (!svgEl) return

    const clone = svgEl.cloneNode(true) as SVGSVGElement
    clone.setAttribute("width", String(SVG_W))
    clone.setAttribute("height", String(SVG_H))
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")

    const gEl = clone.querySelector("g")
    if (gEl) {
      gEl.setAttribute("transform", "translate(0,0) scale(1)")
    }

    const serializer = new XMLSerializer()
    const svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(clone)
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.download = "hotel-usecase-diagram.svg"
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }, [])

  function isRelHighlighted(rel: Relationship) {
    if (selectedRelType !== "all" && rel.type !== selectedRelType) return false
    if (hoveredNode) return rel.from === hoveredNode || rel.to === hoveredNode
    return true
  }

  function isNodeHighlighted(ucId: string) {
    if (!hoveredNode) return true
    if (ucId === hoveredNode) return true
    return RELATIONSHIPS.some(
      (r) =>
        (r.from === hoveredNode && r.to === ucId) ||
        (r.to === hoveredNode && r.from === ucId)
    )
  }

  // ── Render helpers ────

  function renderStickFigure(actor: ActorDef) {
    const { x, y, label, color } = actor
    return (
      <g key={actor.id}>
        <circle cx={x} cy={y - 44} r={16} fill="none" stroke={color} strokeWidth={2.5} />
        <line x1={x} y1={y - 28} x2={x} y2={y + 12} stroke={color} strokeWidth={2.5} />
        <line x1={x - 24} y1={y - 10} x2={x + 24} y2={y - 10} stroke={color} strokeWidth={2.5} />
        <line x1={x} y1={y + 12} x2={x - 18} y2={y + 42} stroke={color} strokeWidth={2.5} />
        <line x1={x} y1={y + 12} x2={x + 18} y2={y + 42} stroke={color} strokeWidth={2.5} />
        <text
          x={x}
          y={y + 64}
          textAnchor="middle"
          fill={color}
          fontSize={14}
          fontWeight={700}
          fontFamily="sans-serif"
        >
          {label}
        </text>
      </g>
    )
  }

  function renderAssociationLines() {
    return USE_CASES.map((uc) => {
      const actor = ACTORS.find((a) => a.id === uc.actor)
      if (!actor) return null
      const { cx, cy } = getEllipseCenter(uc)
      const angle = Math.atan2(actor.y - cy, actor.x - cx)
      const border = ellipseBorderPoint(cx, cy, angle)
      const dimmed = hoveredNode && !isNodeHighlighted(uc.id)
      return (
        <line
          key={`assoc-${actor.id}-${uc.id}`}
          x1={actor.x}
          y1={actor.y}
          x2={border.x}
          y2={border.y}
          stroke={getActorColor(uc.actor)}
          strokeWidth={1.5}
          opacity={dimmed ? 0.08 : 0.3}
          style={{ transition: "opacity 0.2s ease" }}
        />
      )
    })
  }

  function renderRelationships() {
    return RELATIONSHIPS.map((rel) => {
      const fromUC = USE_CASES.find((u) => u.id === rel.from)!
      const toUC = USE_CASES.find((u) => u.id === rel.to)!
      const fc = getEllipseCenter(fromUC)
      const tc = getEllipseCenter(toUC)
      const angle = Math.atan2(tc.cy - fc.cy, tc.cx - fc.cx)
      const reverseAngle = angle + Math.PI
      const start = ellipseBorderPoint(fc.cx, fc.cy, angle)
      const end = ellipseBorderPoint(tc.cx, tc.cy, reverseAngle)

      const highlighted = isRelHighlighted(rel)
      const isInclude = rel.type === "include"
      const color = isInclude ? "#2563eb" : "#d97706"

      const mx = (start.x + end.x) / 2
      const my = (start.y + end.y) / 2

      return (
        <g key={`${rel.from}-${rel.to}`} opacity={highlighted ? 1 : 0.1} style={{ transition: "opacity 0.2s ease" }}>
          <defs>
            <marker
              id={`arrow-${rel.from}-${rel.to}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
            </marker>
          </defs>
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={color}
            strokeWidth={2}
            strokeDasharray="8 5"
            markerEnd={`url(#arrow-${rel.from}-${rel.to})`}
          />
          <rect
            x={mx - 48}
            y={my - 13}
            width={96}
            height={26}
            rx={5}
            fill="white"
            stroke={color}
            strokeWidth={1.2}
          />
          <text
            x={mx}
            y={my + 4}
            textAnchor="middle"
            fontSize={11}
            fontWeight={700}
            fill={color}
            fontFamily="sans-serif"
          >
            {isInclude ? "<<include>>" : "<<extend>>"}
          </text>
        </g>
      )
    })
  }

  function renderEllipses() {
    return USE_CASES.map((uc) => {
      const { cx, cy } = getEllipseCenter(uc)
      const color = getActorColor(uc.actor)
      const isHovered = hoveredNode === uc.id
      const dimmed = hoveredNode && !isNodeHighlighted(uc.id)
      const lines = uc.label.split("\n")

      return (
        <g
          key={uc.id}
          onMouseEnter={() => setHoveredNode(uc.id)}
          onMouseLeave={() => setHoveredNode(null)}
          style={{ cursor: "pointer", transition: "opacity 0.2s ease" }}
          opacity={dimmed ? 0.15 : 1}
        >
          {/* shadow */}
          <ellipse
            cx={cx + 2}
            cy={cy + 3}
            rx={ELLIPSE_RX}
            ry={ELLIPSE_RY}
            fill="rgba(0,0,0,0.04)"
          />
          <ellipse
            cx={cx}
            cy={cy}
            rx={ELLIPSE_RX}
            ry={ELLIPSE_RY}
            fill={isHovered ? `${color}12` : "white"}
            stroke={color}
            strokeWidth={isHovered ? 3 : 2}
            style={{ transition: "all 0.15s ease" }}
          />
          {lines.map((line, i) => {
            const offsetY =
              lines.length === 1
                ? 5
                : -((lines.length - 1) * 7) + i * 15 + 2
            return (
              <text
                key={i}
                x={cx}
                y={cy + offsetY}
                textAnchor="middle"
                fontSize={11.5}
                fontWeight={500}
                fill="#1f2937"
                fontFamily="sans-serif"
              >
                {line}
              </text>
            )
          })}
        </g>
      )
    })
  }

  function renderSystemBoundary() {
    return (
      <g>
        <rect
          x={290}
          y={50}
          width={700}
          height={1150}
          rx={20}
          fill="rgba(37, 99, 235, 0.02)"
          stroke="#cbd5e1"
          strokeWidth={2.5}
          strokeDasharray="12 6"
        />
        <rect
          x={440}
          y={34}
          width={300}
          height={34}
          rx={8}
          fill="white"
          stroke="#cbd5e1"
          strokeWidth={1.5}
        />
        <text
          x={590}
          y={57}
          textAnchor="middle"
          fontSize={15}
          fontWeight={700}
          fill="#1e293b"
          fontFamily="sans-serif"
          letterSpacing={0.5}
        >
          Hotel Management System
        </text>
      </g>
    )
  }

  // ── Legend items ──
  const legendItems = [
    { type: "actor", label: "Actor (stick figure)" },
    { type: "usecase", label: "Use Case (ellipse)" },
    { type: "association", label: "Association (solid line)" },
    { type: "include", label: "<<include>> -- mandatory step" },
    { type: "extend", label: "<<extend>> -- optional behavior" },
  ]

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              UML Use-Case Diagram
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Hotel Management System -- Actors, Use Cases, Includes & Extends
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(["all", "include", "extend"] as const).map((type) => (
              <Badge
                key={type}
                variant={selectedRelType === type ? "default" : "outline"}
                className="cursor-pointer capitalize"
                onClick={() => setSelectedRelType(type)}
              >
                {type === "all" ? "All Relations" : `<<${type}>>`}
              </Badge>
            ))}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar legend */}
        <aside className="hidden w-72 shrink-0 flex-col gap-5 overflow-y-auto border-r border-border bg-card p-5 lg:flex">
          {/* Legend */}
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Legend
            </h2>
            <div className="flex flex-col gap-3">
              {legendItems.map((item) => (
                <div key={item.type} className="flex items-center gap-3">
                  {item.type === "actor" && (
                    <svg width="20" height="30" viewBox="0 0 20 30" className="shrink-0">
                      <circle cx="10" cy="5" r="4" fill="none" stroke="#1e293b" strokeWidth={1.5} />
                      <line x1="10" y1="9" x2="10" y2="18" stroke="#1e293b" strokeWidth={1.5} />
                      <line x1="3" y1="13" x2="17" y2="13" stroke="#1e293b" strokeWidth={1.5} />
                      <line x1="10" y1="18" x2="4" y2="27" stroke="#1e293b" strokeWidth={1.5} />
                      <line x1="10" y1="18" x2="16" y2="27" stroke="#1e293b" strokeWidth={1.5} />
                    </svg>
                  )}
                  {item.type === "usecase" && (
                    <svg width="32" height="18" viewBox="0 0 32 18" className="shrink-0">
                      <ellipse cx="16" cy="9" rx="14" ry="7" fill="none" stroke="#1e293b" strokeWidth={1.5} />
                    </svg>
                  )}
                  {item.type === "association" && (
                    <svg width="32" height="6" viewBox="0 0 32 6" className="shrink-0">
                      <line x1="0" y1="3" x2="32" y2="3" stroke="#64748b" strokeWidth={1.5} />
                    </svg>
                  )}
                  {item.type === "include" && (
                    <svg width="32" height="10" viewBox="0 0 32 10" className="shrink-0">
                      <line x1="0" y1="5" x2="26" y2="5" stroke="#2563eb" strokeWidth={1.8} strokeDasharray="5 3" />
                      <polygon points="26,1 32,5 26,9" fill="#2563eb" />
                    </svg>
                  )}
                  {item.type === "extend" && (
                    <svg width="32" height="10" viewBox="0 0 32 10" className="shrink-0">
                      <line x1="0" y1="5" x2="26" y2="5" stroke="#d97706" strokeWidth={1.8} strokeDasharray="5 3" />
                      <polygon points="26,1 32,5 26,9" fill="#d97706" />
                    </svg>
                  )}
                  <span className="text-xs text-muted-foreground leading-snug">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actor colors */}
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Actors
            </h2>
            <div className="flex flex-col gap-2.5">
              {ACTORS.map((a) => (
                <div key={a.id} className="flex items-center gap-2.5">
                  <span className="block size-3 rounded-full" style={{ background: a.color }} />
                  <span className="text-sm font-medium text-foreground">{a.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Relationship summary */}
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Relationships
            </h2>
            <div className="flex flex-col gap-3">
              {RELATIONSHIPS.map((rel, i) => {
                const fromLabel = USE_CASES.find((u) => u.id === rel.from)!.label.replace("\n", " ")
                const toLabel = USE_CASES.find((u) => u.id === rel.to)!.label.replace("\n", " ")
                const isInclude = rel.type === "include"
                return (
                  <div key={i} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-semibold text-foreground">{fromLabel}</span>
                      <Badge
                        variant={isInclude ? "default" : "outline"}
                        className="text-[9px] px-1.5 py-0"
                      >
                        {isInclude ? "<<include>>" : "<<extend>>"}
                      </Badge>
                      <span className="font-semibold text-foreground">{toLabel}</span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                      {rel.meaning}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <p className="mt-auto text-[11px] text-muted-foreground leading-relaxed">
            Hover over any use case to highlight its relationships. Pan by dragging, zoom with scroll wheel.
          </p>
        </aside>

        {/* Diagram canvas */}
        <div className="relative flex-1">
          <div
            ref={containerRef}
            className="size-full overflow-hidden"
            style={{ cursor: isPanning ? "grabbing" : "grab" }}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <svg
              width="100%"
              height="100%"
              style={{ position: "absolute", top: 0, left: 0 }}
            >
              <g transform={`translate(${translate.x},${translate.y}) scale(${scale})`}>
                {renderSystemBoundary()}
                {renderAssociationLines()}
                {renderRelationships()}
                {renderEllipses()}
                {ACTORS.map(renderStickFigure)}
              </g>
            </svg>
          </div>

          {/* Zoom controls */}
          <div className="absolute bottom-5 right-5 flex items-center gap-1.5 rounded-xl border border-border bg-card p-1.5 shadow-lg">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setScale((s) => Math.min(3, s * 1.25))}
              aria-label="Zoom in"
            >
              <ZoomIn className="size-4" />
            </Button>
            <span className="min-w-[3.5ch] text-center text-xs tabular-nums text-muted-foreground">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setScale((s) => Math.max(0.2, s * 0.75))}
              aria-label="Zoom out"
            >
              <ZoomOut className="size-4" />
            </Button>
            <div className="mx-0.5 h-5 w-px bg-border" />
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={fitToContainer}
              aria-label="Fit to screen"
            >
              <Maximize2 className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
