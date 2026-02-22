"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
  { id: "receptionist", label: "Receptionist", x: 80, y: 340, color: "var(--primary)" },
  { id: "operations", label: "Operational Staff", x: 80, y: 760, color: "var(--chart-2)" },
  { id: "admin", label: "Administrator", x: 1120, y: 600, color: "var(--chart-3)" },
]

const USE_CASES: UseCaseNode[] = [
  // Receptionist
  { id: "create-res", label: "Create Reservation\n(Room / Table)", x: 420, y: 100, actor: "receptionist" },
  { id: "modify-res", label: "Modify Reservation", x: 420, y: 190, actor: "receptionist" },
  { id: "cancel-res", label: "Cancel Reservation", x: 420, y: 280, actor: "receptionist" },
  { id: "check-avail", label: "Check Availability", x: 700, y: 100, actor: "receptionist" },
  { id: "checkin", label: "Check-in Guest", x: 420, y: 370, actor: "receptionist" },
  { id: "checkout", label: "Check-out Guest", x: 420, y: 460, actor: "receptionist" },
  { id: "add-services", label: "Add Services\nto Stay", x: 700, y: 500, actor: "receptionist" },
  { id: "gen-invoice", label: "Generate Invoice", x: 420, y: 550, actor: "receptionist" },
  { id: "record-pay", label: "Record Payment", x: 700, y: 610, actor: "receptionist" },
  { id: "view-res", label: "View / Search\nReservation List", x: 420, y: 640, actor: "receptionist" },
  // Operations
  { id: "update-room", label: "Update Room Status\n(Cleaning / Available)", x: 420, y: 760, actor: "operations" },
  { id: "reg-inventory", label: "Register Inventory\nUsage (Outflow)", x: 420, y: 860, actor: "operations" },
  { id: "view-inventory", label: "View Inventory\nLevels", x: 420, y: 950, actor: "operations" },
  // Admin
  { id: "manage-users", label: "Manage Users\n(Create / Edit / Deactivate)", x: 780, y: 760, actor: "admin" },
  { id: "assign-roles", label: "Assign Roles /\nPermissions", x: 780, y: 860, actor: "admin" },
  { id: "manage-rooms", label: "Manage Rooms\n& Tables (Add / Edit)", x: 780, y: 950, actor: "admin" },
  { id: "manage-prices", label: "Manage Price List", x: 780, y: 1040, actor: "admin" },
  { id: "view-reports", label: "View Reports", x: 780, y: 1130, actor: "admin" },
]

const RELATIONSHIPS: Relationship[] = [
  { from: "create-res", to: "check-avail", type: "include" },
  { from: "checkin", to: "create-res", type: "extend" },
  { from: "gen-invoice", to: "add-services", type: "include" },
  { from: "record-pay", to: "gen-invoice", type: "extend" },
]

// ── Helpers ────────────────────────────────────────────────────────────

const ELLIPSE_RX = 120
const ELLIPSE_RY = 35

function getActorColor(actorId: string | undefined) {
  return ACTORS.find((a) => a.id === actorId)?.color ?? "var(--muted-foreground)"
}

function getEllipseCenter(uc: UseCaseNode) {
  return { cx: uc.x, cy: uc.y }
}

/** Return point on the ellipse boundary in direction of the angle */
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
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [selectedRelType, setSelectedRelType] = useState<
    "all" | "include" | "extend"
  >("all")

  // auto-fit to container on mount
  useEffect(() => {
    if (!containerRef.current) return
    const cw = containerRef.current.clientWidth
    const ch = containerRef.current.clientHeight
    const svgW = 1250
    const svgH = 1200
    const s = Math.min(cw / svgW, ch / svgH, 1)
    setScale(s)
    setTranslate({
      x: (cw - svgW * s) / 2,
      y: (ch - svgH * s) / 2,
    })
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.95 : 1.05
      setScale((s) => Math.max(0.3, Math.min(2.5, s * delta)))
    },
    []
  )

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
        {/* head */}
        <circle cx={x} cy={y - 40} r={14} fill="none" stroke={color} strokeWidth={2} />
        {/* body */}
        <line x1={x} y1={y - 26} x2={x} y2={y + 10} stroke={color} strokeWidth={2} />
        {/* arms */}
        <line x1={x - 20} y1={y - 12} x2={x + 20} y2={y - 12} stroke={color} strokeWidth={2} />
        {/* left leg */}
        <line x1={x} y1={y + 10} x2={x - 16} y2={y + 36} stroke={color} strokeWidth={2} />
        {/* right leg */}
        <line x1={x} y1={y + 10} x2={x + 16} y2={y + 36} stroke={color} strokeWidth={2} />
        {/* label */}
        <text
          x={x}
          y={y + 56}
          textAnchor="middle"
          fill={color}
          fontSize={13}
          fontWeight={600}
          fontFamily="var(--font-sans)"
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
          opacity={dimmed ? 0.12 : 0.35}
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
      const color = isInclude ? "var(--primary)" : "var(--chart-3)"

      // midpoint for label
      const mx = (start.x + end.x) / 2
      const my = (start.y + end.y) / 2

      return (
        <g key={`${rel.from}-${rel.to}`} opacity={highlighted ? 1 : 0.12}>
          <defs>
            <marker
              id={`arrow-${rel.from}-${rel.to}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
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
            strokeWidth={1.8}
            strokeDasharray="7 4"
            markerEnd={`url(#arrow-${rel.from}-${rel.to})`}
          />
          {/* label background */}
          <rect
            x={mx - 42}
            y={my - 11}
            width={84}
            height={22}
            rx={4}
            fill="var(--card)"
            stroke={color}
            strokeWidth={1}
          />
          <text
            x={mx}
            y={my + 4}
            textAnchor="middle"
            fontSize={10.5}
            fontWeight={600}
            fill={color}
            fontFamily="var(--font-sans)"
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
          style={{ cursor: "pointer" }}
          opacity={dimmed ? 0.18 : 1}
        >
          <ellipse
            cx={cx}
            cy={cy}
            rx={ELLIPSE_RX}
            ry={ELLIPSE_RY}
            fill={isHovered ? color : "var(--card)"}
            fillOpacity={isHovered ? 0.12 : 1}
            stroke={color}
            strokeWidth={isHovered ? 2.5 : 1.5}
            style={{ transition: "all 0.15s ease" }}
          />
          {lines.map((line, i) => {
            const offsetY =
              lines.length === 1
                ? 4
                : -((lines.length - 1) * 7) + i * 14 + 1
            return (
              <text
                key={i}
                x={cx}
                y={cy + offsetY}
                textAnchor="middle"
                fontSize={11}
                fontWeight={500}
                fill="var(--foreground)"
                fontFamily="var(--font-sans)"
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
          x={280}
          y={40}
          width={660}
          height={1130}
          rx={16}
          fill="none"
          stroke="var(--border)"
          strokeWidth={2}
          strokeDasharray="8 4"
        />
        <text
          x={610}
          y={72}
          textAnchor="middle"
          fontSize={16}
          fontWeight={700}
          fill="var(--foreground)"
          fontFamily="var(--font-sans)"
        >
          Hotel Management System
        </text>
      </g>
    )
  }

  // Legend data
  const legendItems = [
    {
      type: "actor",
      label: "Actor (stick figure)",
    },
    {
      type: "usecase",
      label: "Use Case (ellipse)",
    },
    {
      type: "include",
      label: '<<include>> (mandatory dependency)',
    },
    {
      type: "extend",
      label: '<<extend>> (optional behavior)',
    },
    {
      type: "association",
      label: "Association (actor-to-use-case)",
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Legend card */}
        <Card className="shrink-0 lg:w-72">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">UML Use-Case Diagram Legend</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-xs">
            {legendItems.map((item) => (
              <div key={item.type} className="flex items-start gap-2.5">
                {item.type === "actor" && (
                  <svg width="24" height="28" viewBox="0 0 24 28" className="shrink-0 mt-0.5">
                    <circle cx="12" cy="5" r="4" fill="none" stroke="var(--primary)" strokeWidth={1.5} />
                    <line x1="12" y1="9" x2="12" y2="18" stroke="var(--primary)" strokeWidth={1.5} />
                    <line x1="4" y1="13" x2="20" y2="13" stroke="var(--primary)" strokeWidth={1.5} />
                    <line x1="12" y1="18" x2="6" y2="26" stroke="var(--primary)" strokeWidth={1.5} />
                    <line x1="12" y1="18" x2="18" y2="26" stroke="var(--primary)" strokeWidth={1.5} />
                  </svg>
                )}
                {item.type === "usecase" && (
                  <svg width="36" height="20" viewBox="0 0 36 20" className="shrink-0 mt-0.5">
                    <ellipse
                      cx="18"
                      cy="10"
                      rx="16"
                      ry="8"
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth={1.5}
                    />
                  </svg>
                )}
                {item.type === "include" && (
                  <svg width="36" height="10" viewBox="0 0 36 10" className="shrink-0 mt-1.5">
                    <line
                      x1="0"
                      y1="5"
                      x2="30"
                      y2="5"
                      stroke="var(--primary)"
                      strokeWidth={1.5}
                      strokeDasharray="5 3"
                    />
                    <polygon points="30,1 36,5 30,9" fill="var(--primary)" />
                  </svg>
                )}
                {item.type === "extend" && (
                  <svg width="36" height="10" viewBox="0 0 36 10" className="shrink-0 mt-1.5">
                    <line
                      x1="0"
                      y1="5"
                      x2="30"
                      y2="5"
                      stroke="var(--chart-3)"
                      strokeWidth={1.5}
                      strokeDasharray="5 3"
                    />
                    <polygon points="30,1 36,5 30,9" fill="var(--chart-3)" />
                  </svg>
                )}
                {item.type === "association" && (
                  <svg width="36" height="10" viewBox="0 0 36 10" className="shrink-0 mt-1.5">
                    <line
                      x1="0"
                      y1="5"
                      x2="36"
                      y2="5"
                      stroke="var(--muted-foreground)"
                      strokeWidth={1.5}
                    />
                  </svg>
                )}
                <span className="text-muted-foreground leading-snug">{item.label}</span>
              </div>
            ))}

            <div className="mt-1 flex flex-col gap-1.5">
              <span className="font-medium text-foreground">Actors</span>
              {ACTORS.map((a) => (
                <div key={a.id} className="flex items-center gap-2">
                  <span
                    className="block size-2.5 rounded-full"
                    style={{ background: a.color }}
                  />
                  <span className="text-muted-foreground">{a.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-2 flex flex-col gap-1.5">
              <span className="font-medium text-foreground">Filter relationships</span>
              <div className="flex flex-wrap gap-1.5">
                {(["all", "include", "extend"] as const).map((type) => (
                  <Badge
                    key={type}
                    variant={selectedRelType === type ? "default" : "outline"}
                    className="cursor-pointer text-[10px] capitalize"
                    onClick={() => setSelectedRelType(type)}
                  >
                    {type === "all" ? "Show All" : `<<${type}>>`}
                  </Badge>
                ))}
              </div>
            </div>

            <p className="mt-2 text-muted-foreground leading-snug">
              Hover over any use case to highlight its relationships. Pan by dragging, zoom with scroll wheel.
            </p>
          </CardContent>
        </Card>

        {/* Diagram canvas */}
        <Card className="min-h-[600px] flex-1 overflow-hidden">
          <CardContent className="p-0">
            <div
              ref={containerRef}
              className="relative h-[700px] w-full overflow-hidden"
              style={{ cursor: isPanning ? "grabbing" : "grab" }}
              onWheel={handleWheel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <svg
                ref={svgRef}
                width="100%"
                height="100%"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
              >
                <g
                  transform={`translate(${translate.x},${translate.y}) scale(${scale})`}
                >
                  {renderSystemBoundary()}
                  {renderAssociationLines()}
                  {renderRelationships()}
                  {renderEllipses()}
                  {ACTORS.map(renderStickFigure)}
                </g>
              </svg>

              {/* Zoom controls */}
              <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-sm">
                <button
                  type="button"
                  className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                  onClick={() => setScale((s) => Math.min(2.5, s * 1.2))}
                  aria-label="Zoom in"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <line
                      x1="7"
                      y1="2"
                      x2="7"
                      y2="12"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    />
                    <line
                      x1="2"
                      y1="7"
                      x2="12"
                      y2="7"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    />
                  </svg>
                </button>
                <span className="px-1.5 text-[10px] text-muted-foreground tabular-nums">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                  onClick={() => setScale((s) => Math.max(0.3, s * 0.8))}
                  aria-label="Zoom out"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <line
                      x1="2"
                      y1="7"
                      x2="12"
                      y2="7"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    />
                  </svg>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relationships table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Relationship Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 text-left font-medium text-muted-foreground">
                    From
                  </th>
                  <th className="py-2 pr-4 text-left font-medium text-muted-foreground">
                    Relationship
                  </th>
                  <th className="py-2 text-left font-medium text-muted-foreground">
                    To
                  </th>
                  <th className="py-2 pl-4 text-left font-medium text-muted-foreground">
                    Meaning
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    from: "Create Reservation",
                    rel: "<<include>>",
                    to: "Check Availability",
                    meaning:
                      "Creating a reservation always requires checking availability first.",
                    type: "include" as const,
                  },
                  {
                    from: "Check-in Guest",
                    rel: "<<extend>>",
                    to: "Create Reservation",
                    meaning:
                      "A walk-in guest may trigger a new reservation during check-in.",
                    type: "extend" as const,
                  },
                  {
                    from: "Generate Invoice",
                    rel: "<<include>>",
                    to: "Add Services to Stay",
                    meaning:
                      "Invoice generation always pulls in services added to the stay.",
                    type: "include" as const,
                  },
                  {
                    from: "Record Payment",
                    rel: "<<extend>>",
                    to: "Generate Invoice",
                    meaning:
                      "Payment recording optionally extends the invoicing flow.",
                    type: "extend" as const,
                  },
                ].map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-2.5 pr-4 font-medium text-foreground">
                      {row.from}
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge
                        variant={row.type === "include" ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {row.rel}
                      </Badge>
                    </td>
                    <td className="py-2.5 font-medium text-foreground">
                      {row.to}
                    </td>
                    <td className="py-2.5 pl-4 text-muted-foreground">
                      {row.meaning}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
