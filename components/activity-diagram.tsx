"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Maximize2, Download } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────

type NodeType =
  | "start"
  | "end"
  | "action"
  | "decision"
  | "merge"
  | "fork"
  | "join"

interface ActivityNode {
  id: string
  type: NodeType
  label: string
  sublabel?: string
  x: number
  y: number
  swimlane: string
}

interface Edge {
  from: string
  to: string
  label?: string
  /** Control points for curved paths */
  via?: { x: number; y: number }[]
}

interface Swimlane {
  id: string
  label: string
  color: string
  xStart: number
  width: number
}

// ── Swimlanes ──────────────────────────────────────────────────────────

const SWIMLANES: Swimlane[] = [
  { id: "guest", label: "Guest", color: "#0284c7", xStart: 40, width: 240 },
  { id: "reception", label: "Receptionist", color: "#2563eb", xStart: 280, width: 280 },
  { id: "system", label: "System", color: "#7c3aed", xStart: 560, width: 260 },
  { id: "operations", label: "Operational Staff", color: "#059669", xStart: 820, width: 240 },
]

// ── Nodes ──────────────────────────────────────────────────────────────

const NODES: ActivityNode[] = [
  // ── Start
  { id: "start", type: "start", label: "", x: 160, y: 60, swimlane: "guest" },

  // ── Reservation Phase
  { id: "request-res", type: "action", label: "Request Room", sublabel: "Reservation", x: 160, y: 140, swimlane: "guest" },
  { id: "receive-req", type: "action", label: "Receive & Enter", sublabel: "Reservation Details", x: 420, y: 140, swimlane: "reception" },
  { id: "check-avail", type: "action", label: "Check Room", sublabel: "Availability", x: 690, y: 140, swimlane: "system" },
  { id: "decision-avail", type: "decision", label: "Available?", x: 690, y: 260, swimlane: "system" },

  // ── No availability branch
  { id: "notify-unavail", type: "action", label: "Notify Guest:", sublabel: "No Availability", x: 420, y: 340, swimlane: "reception" },
  { id: "decision-alt", type: "decision", label: "Try\nAlternative?", x: 160, y: 340, swimlane: "guest" },
  { id: "end-cancel", type: "end", label: "", x: 160, y: 460, swimlane: "guest" },

  // ── Yes availability branch
  { id: "register-res", type: "action", label: "Register", sublabel: "Reservation", x: 690, y: 400, swimlane: "system" },
  { id: "update-reserved", type: "action", label: "Update Room Status", sublabel: "to 'Reserved'", x: 690, y: 490, swimlane: "system" },
  { id: "confirm-res", type: "action", label: "Send Reservation", sublabel: "Confirmation", x: 420, y: 490, swimlane: "reception" },

  // ── Check-in Phase
  { id: "guest-arrives", type: "action", label: "Guest Arrives", sublabel: "on Check-in Day", x: 160, y: 600, swimlane: "guest" },
  { id: "perform-checkin", type: "action", label: "Confirm Reservation", sublabel: "& Perform Check-in", x: 420, y: 600, swimlane: "reception" },
  { id: "update-occupied", type: "action", label: "Update Room Status", sublabel: "to 'Occupied'", x: 690, y: 600, swimlane: "system" },

  // ── During Stay (fork/join for parallel)
  { id: "fork-stay", type: "fork", label: "", x: 420, y: 700, swimlane: "reception" },
  { id: "add-services", type: "action", label: "Add Services", sublabel: "(Minibar, Spa, etc.)", x: 420, y: 790, swimlane: "reception" },
  { id: "record-services", type: "action", label: "Record Services", sublabel: "in System", x: 690, y: 790, swimlane: "system" },
  { id: "guest-stay", type: "action", label: "Guest Enjoys", sublabel: "Stay & Services", x: 160, y: 790, swimlane: "guest" },
  { id: "join-stay", type: "join", label: "", x: 420, y: 880, swimlane: "reception" },

  // ── Check-out Phase
  { id: "request-checkout", type: "action", label: "Request", sublabel: "Check-out", x: 160, y: 960, swimlane: "guest" },
  { id: "perform-checkout", type: "action", label: "Initiate", sublabel: "Check-out", x: 420, y: 960, swimlane: "reception" },
  { id: "calc-total", type: "action", label: "Calculate Total", sublabel: "(Room + Services)", x: 690, y: 960, swimlane: "system" },
  { id: "gen-invoice", type: "action", label: "Generate", sublabel: "Invoice", x: 690, y: 1060, swimlane: "system" },
  { id: "present-invoice", type: "action", label: "Present Invoice", sublabel: "to Guest", x: 420, y: 1060, swimlane: "reception" },
  { id: "record-payment", type: "action", label: "Record Payment", sublabel: "", x: 420, y: 1160, swimlane: "reception" },

  // ── Payment decision
  { id: "decision-payment", type: "decision", label: "Payment\nComplete?", x: 420, y: 1270, swimlane: "reception" },
  { id: "payment-issue", type: "action", label: "Resolve Payment", sublabel: "Issue", x: 160, y: 1270, swimlane: "guest" },

  // ── Post-checkout
  { id: "update-cleaning", type: "action", label: "Update Room Status", sublabel: "to 'Cleaning'", x: 690, y: 1370, swimlane: "system" },
  { id: "clean-room", type: "action", label: "Clean & Inspect", sublabel: "Room", x: 940, y: 1370, swimlane: "operations" },
  { id: "update-available", type: "action", label: "Update Room Status", sublabel: "to 'Available'", x: 690, y: 1470, swimlane: "system" },

  // ── End
  { id: "end-success", type: "end", label: "", x: 690, y: 1560, swimlane: "system" },
]

// ── Edges ──────────────────────────────────────────────────────────────

const EDGES: Edge[] = [
  { from: "start", to: "request-res" },
  { from: "request-res", to: "receive-req" },
  { from: "receive-req", to: "check-avail" },
  { from: "check-avail", to: "decision-avail" },

  // No availability
  { from: "decision-avail", to: "notify-unavail", label: "No" },
  { from: "notify-unavail", to: "decision-alt" },
  { from: "decision-alt", to: "end-cancel", label: "No" },
  { from: "decision-alt", to: "request-res", label: "Yes", via: [{ x: 60, y: 340 }, { x: 60, y: 140 }] },

  // Yes availability
  { from: "decision-avail", to: "register-res", label: "Yes" },
  { from: "register-res", to: "update-reserved" },
  { from: "update-reserved", to: "confirm-res" },
  { from: "confirm-res", to: "guest-arrives", via: [{ x: 160, y: 540 }] },

  // Check-in
  { from: "guest-arrives", to: "perform-checkin" },
  { from: "perform-checkin", to: "update-occupied" },
  { from: "update-occupied", to: "fork-stay", via: [{ x: 690, y: 660 }, { x: 420, y: 660 }] },

  // During stay (fork)
  { from: "fork-stay", to: "add-services" },
  { from: "fork-stay", to: "guest-stay", via: [{ x: 160, y: 750 }] },
  { from: "add-services", to: "record-services" },
  { from: "record-services", to: "join-stay", via: [{ x: 690, y: 850 }, { x: 570, y: 880 }] },
  { from: "guest-stay", to: "join-stay", via: [{ x: 160, y: 880 }, { x: 270, y: 880 }] },

  // Check-out
  { from: "join-stay", to: "request-checkout", via: [{ x: 160, y: 920 }] },
  { from: "request-checkout", to: "perform-checkout" },
  { from: "perform-checkout", to: "calc-total" },
  { from: "calc-total", to: "gen-invoice" },
  { from: "gen-invoice", to: "present-invoice" },
  { from: "present-invoice", to: "record-payment" },
  { from: "record-payment", to: "decision-payment" },

  // Payment decision
  { from: "decision-payment", to: "payment-issue", label: "No" },
  { from: "payment-issue", to: "record-payment", label: "", via: [{ x: 100, y: 1270 }, { x: 100, y: 1160 }, { x: 300, y: 1160 }] },
  { from: "decision-payment", to: "update-cleaning", label: "Yes" },

  // Post-checkout
  { from: "update-cleaning", to: "clean-room" },
  { from: "clean-room", to: "update-available" },
  { from: "update-available", to: "end-success" },
]

// ── Constants ──────────────────────────────────────────────────────────

const SVG_W = 1100
const SVG_H = 1630
const ACTION_W = 170
const ACTION_H = 56
const DECISION_SIZE = 56
const CIRCLE_R_START = 14
const CIRCLE_R_END = 16
const BAR_W = 120
const BAR_H = 6

// ── Helpers ────────────────────────────────────────────────────────────

function getNode(id: string) {
  return NODES.find((n) => n.id === id)!
}

function getSwimlaneColor(lane: string) {
  return SWIMLANES.find((s) => s.id === lane)?.color ?? "#6b7280"
}

/** Get the connection point on a node's border in a given direction */
function getAnchor(node: ActivityNode, dir: "top" | "bottom" | "left" | "right") {
  const { x, y, type } = node
  if (type === "start" || type === "end") {
    const r = type === "start" ? CIRCLE_R_START : CIRCLE_R_END
    switch (dir) {
      case "top": return { x, y: y - r }
      case "bottom": return { x, y: y + r }
      case "left": return { x: x - r, y }
      case "right": return { x: x + r, y }
    }
  }
  if (type === "decision" || type === "merge") {
    const half = DECISION_SIZE / 2
    switch (dir) {
      case "top": return { x, y: y - half }
      case "bottom": return { x, y: y + half }
      case "left": return { x: x - half, y }
      case "right": return { x: x + half, y }
    }
  }
  if (type === "fork" || type === "join") {
    switch (dir) {
      case "top": return { x, y: y - BAR_H / 2 }
      case "bottom": return { x, y: y + BAR_H / 2 }
      case "left": return { x: x - BAR_W / 2, y }
      case "right": return { x: x + BAR_W / 2, y }
    }
  }
  // action
  const hw = ACTION_W / 2, hh = ACTION_H / 2
  switch (dir) {
    case "top": return { x, y: y - hh }
    case "bottom": return { x, y: y + hh }
    case "left": return { x: x - hw, y }
    case "right": return { x: x + hw, y }
  }
}

/** Decide which sides to connect based on relative positions */
function pickAnchors(from: ActivityNode, to: ActivityNode) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (Math.abs(dy) > Math.abs(dx)) {
    return dy > 0
      ? { fromDir: "bottom" as const, toDir: "top" as const }
      : { fromDir: "top" as const, toDir: "bottom" as const }
  }
  return dx > 0
    ? { fromDir: "right" as const, toDir: "left" as const }
    : { fromDir: "left" as const, toDir: "right" as const }
}

// ── Component ──────────────────────────────────────────────────────────

export function ActivityDiagram() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [highlightPhase, setHighlightPhase] = useState<"all" | "reservation" | "checkin" | "stay" | "checkout" | "cleanup">("all")

  const phaseNodes: Record<string, string[]> = {
    reservation: ["start", "request-res", "receive-req", "check-avail", "decision-avail", "notify-unavail", "decision-alt", "end-cancel", "register-res", "update-reserved", "confirm-res"],
    checkin: ["guest-arrives", "perform-checkin", "update-occupied"],
    stay: ["fork-stay", "add-services", "record-services", "guest-stay", "join-stay"],
    checkout: ["request-checkout", "perform-checkout", "calc-total", "gen-invoice", "present-invoice", "record-payment", "decision-payment", "payment-issue"],
    cleanup: ["update-cleaning", "clean-room", "update-available", "end-success"],
  }

  function isNodeInPhase(nodeId: string) {
    if (highlightPhase === "all") return true
    return phaseNodes[highlightPhase]?.includes(nodeId) ?? false
  }

  function isEdgeInPhase(edge: Edge) {
    if (highlightPhase === "all") return true
    return isNodeInPhase(edge.from) && isNodeInPhase(edge.to)
  }

  function fitToContainer() {
    if (!containerRef.current) return
    const cw = containerRef.current.clientWidth
    const ch = containerRef.current.clientHeight
    const s = Math.min(cw / SVG_W, ch / SVG_H, 1) * 0.92
    setScale(s)
    setTranslate({
      x: (cw - SVG_W * s) / 2,
      y: Math.max(10, (ch - SVG_H * s) / 2),
    })
  }

  useEffect(() => { fitToContainer() }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.93 : 1.07
    setScale((s) => Math.max(0.15, Math.min(3, s * delta)))
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    setIsPanning(true)
    setPanStart({ x: e.clientX - translate.x, y: e.clientY - translate.y })
  }, [translate])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning) return
    setTranslate({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
  }, [isPanning, panStart])

  const handlePointerUp = useCallback(() => setIsPanning(false), [])

  const downloadAsPng = useCallback(() => {
    const svgEl = containerRef.current?.querySelector("svg")
    if (!svgEl) return
    const clone = svgEl.cloneNode(true) as SVGSVGElement
    clone.setAttribute("width", String(SVG_W))
    clone.setAttribute("height", String(SVG_H))
    const gEl = clone.querySelector("g[data-main]")
    if (gEl) gEl.setAttribute("transform", "translate(0,0) scale(1)")
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(clone)
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(svgBlob)
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
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
      link.download = "hotel-activity-diagram.png"
      link.href = canvas.toDataURL("image/png")
      link.click()
    }
    img.src = url
  }, [])

  // ── Render helpers ──

  function renderSwimlanes() {
    return SWIMLANES.map((lane) => (
      <g key={lane.id}>
        {/* Lane background */}
        <rect
          x={lane.xStart}
          y={30}
          width={lane.width}
          height={SVG_H - 60}
          fill={`${lane.color}06`}
          stroke={`${lane.color}25`}
          strokeWidth={1.5}
          rx={8}
        />
        {/* Lane header */}
        <rect
          x={lane.xStart}
          y={30}
          width={lane.width}
          height={36}
          fill={`${lane.color}15`}
          rx={8}
        />
        <rect
          x={lane.xStart}
          y={52}
          width={lane.width}
          height={14}
          fill={`${lane.color}15`}
        />
        <text
          x={lane.xStart + lane.width / 2}
          y={54}
          textAnchor="middle"
          fontSize={13}
          fontWeight={700}
          fill={lane.color}
          fontFamily="sans-serif"
        >
          {lane.label}
        </text>
      </g>
    ))
  }

  function renderNode(node: ActivityNode) {
    const { id, type, label, sublabel, x, y, swimlane } = node
    const color = getSwimlaneColor(swimlane)
    const isHovered = hoveredNode === id
    const inPhase = isNodeInPhase(id)
    const opacity = inPhase ? 1 : 0.12

    if (type === "start") {
      return (
        <g key={id} opacity={opacity} style={{ transition: "opacity 0.2s" }}>
          <circle cx={x} cy={y} r={CIRCLE_R_START} fill="#1e293b" />
        </g>
      )
    }

    if (type === "end") {
      return (
        <g key={id} opacity={opacity} style={{ transition: "opacity 0.2s" }}>
          <circle cx={x} cy={y} r={CIRCLE_R_END} fill="none" stroke="#1e293b" strokeWidth={3} />
          <circle cx={x} cy={y} r={CIRCLE_R_END - 5} fill="#1e293b" />
        </g>
      )
    }

    if (type === "decision" || type === "merge") {
      const half = DECISION_SIZE / 2
      const lines = label.split("\n")
      return (
        <g
          key={id}
          onMouseEnter={() => setHoveredNode(id)}
          onMouseLeave={() => setHoveredNode(null)}
          style={{ cursor: "pointer", transition: "opacity 0.2s" }}
          opacity={opacity}
        >
          <polygon
            points={`${x},${y - half} ${x + half},${y} ${x},${y + half} ${x - half},${y}`}
            fill={isHovered ? `${color}18` : "white"}
            stroke={color}
            strokeWidth={isHovered ? 3 : 2.2}
            style={{ transition: "all 0.15s" }}
          />
          {lines.map((line, i) => {
            const offsetY = lines.length === 1 ? 4 : -((lines.length - 1) * 6) + i * 13 + 2
            return (
              <text
                key={i}
                x={x}
                y={y + offsetY}
                textAnchor="middle"
                fontSize={10.5}
                fontWeight={700}
                fill="#1f2937"
                fontFamily="sans-serif"
              >
                {line}
              </text>
            )
          })}
        </g>
      )
    }

    if (type === "fork" || type === "join") {
      return (
        <g key={id} opacity={opacity} style={{ transition: "opacity 0.2s" }}>
          <rect
            x={x - BAR_W / 2}
            y={y - BAR_H / 2}
            width={BAR_W}
            height={BAR_H}
            rx={3}
            fill="#1e293b"
          />
        </g>
      )
    }

    // action
    const hw = ACTION_W / 2, hh = ACTION_H / 2
    return (
      <g
        key={id}
        onMouseEnter={() => setHoveredNode(id)}
        onMouseLeave={() => setHoveredNode(null)}
        style={{ cursor: "pointer", transition: "opacity 0.2s" }}
        opacity={opacity}
      >
        <rect
          x={x - hw + 2}
          y={y - hh + 3}
          width={ACTION_W}
          height={ACTION_H}
          rx={12}
          fill="rgba(0,0,0,0.04)"
        />
        <rect
          x={x - hw}
          y={y - hh}
          width={ACTION_W}
          height={ACTION_H}
          rx={12}
          fill={isHovered ? `${color}12` : "white"}
          stroke={color}
          strokeWidth={isHovered ? 2.8 : 2}
          style={{ transition: "all 0.15s" }}
        />
        <text
          x={x}
          y={sublabel ? y - 5 : y + 4}
          textAnchor="middle"
          fontSize={11.5}
          fontWeight={600}
          fill="#1f2937"
          fontFamily="sans-serif"
        >
          {label}
        </text>
        {sublabel && (
          <text
            x={x}
            y={y + 12}
            textAnchor="middle"
            fontSize={10}
            fontWeight={400}
            fill="#64748b"
            fontFamily="sans-serif"
          >
            {sublabel}
          </text>
        )}
      </g>
    )
  }

  function renderEdges() {
    return EDGES.map((edge, idx) => {
      const fromNode = getNode(edge.from)
      const toNode = getNode(edge.to)
      const inPhase = isEdgeInPhase(edge)
      const opacity = inPhase ? 0.7 : 0.06

      let pathD: string
      let labelPos: { x: number; y: number } | null = null

      if (edge.via && edge.via.length > 0) {
        // Use via points for routing
        const { fromDir } = pickAnchors(fromNode, edge.via[0] as unknown as ActivityNode || toNode)
        const start = getAnchor(fromNode, fromDir)

        const lastVia = edge.via[edge.via.length - 1]
        const virtualEnd = { ...toNode, x: lastVia.x, y: lastVia.y }
        const { toDir } = pickAnchors(virtualEnd as ActivityNode, toNode)
        const end = getAnchor(toNode, toDir)

        const points = [start, ...edge.via, end]
        pathD = `M ${points[0].x} ${points[0].y}`
        for (let i = 1; i < points.length; i++) {
          pathD += ` L ${points[i].x} ${points[i].y}`
        }
        // Label at midpoint of first segment
        if (edge.label) {
          labelPos = { x: (start.x + edge.via[0].x) / 2, y: (start.y + edge.via[0].y) / 2 }
        }
      } else {
        const { fromDir, toDir } = pickAnchors(fromNode, toNode)
        const start = getAnchor(fromNode, fromDir)
        const end = getAnchor(toNode, toDir)

        // Smart routing with one bend
        if (fromDir === "bottom" && toDir === "top" && Math.abs(start.x - end.x) > 5) {
          const midY = (start.y + end.y) / 2
          pathD = `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`
        } else if ((fromDir === "left" || fromDir === "right") && (toDir === "top" || toDir === "bottom")) {
          pathD = `M ${start.x} ${start.y} L ${end.x} ${start.y} L ${end.x} ${end.y}`
        } else {
          pathD = `M ${start.x} ${start.y} L ${end.x} ${end.y}`
        }

        if (edge.label) {
          labelPos = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
        }
      }

      return (
        <g key={`edge-${idx}`} opacity={opacity} style={{ transition: "opacity 0.2s" }}>
          <defs>
            <marker
              id={`arrowhead-${idx}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
            </marker>
          </defs>
          <path
            d={pathD}
            fill="none"
            stroke="#475569"
            strokeWidth={1.8}
            markerEnd={`url(#arrowhead-${idx})`}
          />
          {edge.label && labelPos && (
            <>
              <rect
                x={labelPos.x - 18}
                y={labelPos.y - 10}
                width={36}
                height={20}
                rx={5}
                fill="white"
                stroke="#94a3b8"
                strokeWidth={1}
              />
              <text
                x={labelPos.x}
                y={labelPos.y + 4}
                textAnchor="middle"
                fontSize={10.5}
                fontWeight={700}
                fill="#334155"
                fontFamily="sans-serif"
              >
                {edge.label}
              </text>
            </>
          )}
        </g>
      )
    })
  }

  // ── Legend items ──
  const legendItems = [
    { type: "start", label: "Initial Node (filled circle)" },
    { type: "end", label: "Final Node (bull's eye)" },
    { type: "action", label: "Action / Activity" },
    { type: "decision", label: "Decision Node (diamond)" },
    { type: "fork", label: "Fork / Join Bar" },
    { type: "flow", label: "Control Flow (arrow)" },
    { type: "guard", label: "Guard Condition [Yes/No]" },
  ]

  const phases = [
    { id: "all", label: "All Phases" },
    { id: "reservation", label: "Reservation" },
    { id: "checkin", label: "Check-in" },
    { id: "stay", label: "During Stay" },
    { id: "checkout", label: "Check-out" },
    { id: "cleanup", label: "Cleanup" },
  ] as const

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              UML Activity Diagram
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Reservation &rarr; Check-in &rarr; Stay &rarr; Check-out &rarr; Invoicing &rarr; Cleanup
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {phases.map((phase) => (
              <Badge
                key={phase.id}
                variant={highlightPhase === phase.id ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setHighlightPhase(phase.id)}
              >
                {phase.label}
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
                  {item.type === "start" && (
                    <svg width="20" height="20" viewBox="0 0 20 20" className="shrink-0">
                      <circle cx="10" cy="10" r="7" fill="#1e293b" />
                    </svg>
                  )}
                  {item.type === "end" && (
                    <svg width="20" height="20" viewBox="0 0 20 20" className="shrink-0">
                      <circle cx="10" cy="10" r="8" fill="none" stroke="#1e293b" strokeWidth={2} />
                      <circle cx="10" cy="10" r="4" fill="#1e293b" />
                    </svg>
                  )}
                  {item.type === "action" && (
                    <svg width="32" height="20" viewBox="0 0 32 20" className="shrink-0">
                      <rect x="1" y="2" width="30" height="16" rx="6" fill="none" stroke="#1e293b" strokeWidth={1.5} />
                    </svg>
                  )}
                  {item.type === "decision" && (
                    <svg width="20" height="20" viewBox="0 0 20 20" className="shrink-0">
                      <polygon points="10,1 19,10 10,19 1,10" fill="none" stroke="#1e293b" strokeWidth={1.5} />
                    </svg>
                  )}
                  {item.type === "fork" && (
                    <svg width="32" height="8" viewBox="0 0 32 8" className="shrink-0">
                      <rect x="2" y="2" width="28" height="4" rx="2" fill="#1e293b" />
                    </svg>
                  )}
                  {item.type === "flow" && (
                    <svg width="32" height="10" viewBox="0 0 32 10" className="shrink-0">
                      <line x1="0" y1="5" x2="25" y2="5" stroke="#475569" strokeWidth={1.8} />
                      <polygon points="25,1 32,5 25,9" fill="#475569" />
                    </svg>
                  )}
                  {item.type === "guard" && (
                    <svg width="32" height="16" viewBox="0 0 32 16" className="shrink-0">
                      <rect x="2" y="1" width="28" height="14" rx="4" fill="none" stroke="#94a3b8" strokeWidth={1} />
                      <text x="16" y="11" textAnchor="middle" fontSize="8" fontWeight={700} fill="#334155" fontFamily="sans-serif">Yes</text>
                    </svg>
                  )}
                  <span className="text-xs text-muted-foreground leading-snug">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Swimlanes */}
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Swimlanes
            </h2>
            <div className="flex flex-col gap-2.5">
              {SWIMLANES.map((lane) => (
                <div key={lane.id} className="flex items-center gap-2.5">
                  <span className="block size-3 rounded-full" style={{ background: lane.color }} />
                  <span className="text-sm font-medium text-foreground">{lane.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Decision Nodes */}
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Decision Nodes
            </h2>
            <div className="flex flex-col gap-3">
              <div className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0">
                    <polygon points="7,0 14,7 7,14 0,7" fill="none" stroke="#7c3aed" strokeWidth={1.5} />
                  </svg>
                  <span className="font-semibold text-foreground">Available?</span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  Checks if the requested room is free for the given dates. Yes proceeds to register reservation; No notifies the guest.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0">
                    <polygon points="7,0 14,7 7,14 0,7" fill="none" stroke="#0284c7" strokeWidth={1.5} />
                  </svg>
                  <span className="font-semibold text-foreground">Try Alternative?</span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  Guest decides whether to try different dates/room type or cancel. Yes loops back to request; No ends the process.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0">
                    <polygon points="7,0 14,7 7,14 0,7" fill="none" stroke="#2563eb" strokeWidth={1.5} />
                  </svg>
                  <span className="font-semibold text-foreground">Payment Complete?</span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  Verifies if full payment has been received. Yes proceeds to room cleanup; No requires the guest to resolve the payment issue.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-auto text-[11px] text-muted-foreground leading-relaxed">
            Hover over nodes for details. Use phase filters in the header to isolate flow segments. Pan by dragging, zoom with scroll wheel.
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
            <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
              <g data-main transform={`translate(${translate.x},${translate.y}) scale(${scale})`}>
                {renderSwimlanes()}
                {renderEdges()}
                {NODES.map(renderNode)}
              </g>
            </svg>
          </div>

          {/* Zoom controls + download */}
          <div className="absolute bottom-5 right-5 flex items-center gap-1.5 rounded-xl border border-border bg-card p-1.5 shadow-lg">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setScale((s) => Math.min(3, s * 1.25))} aria-label="Zoom in">
              <ZoomIn className="size-4" />
            </Button>
            <span className="min-w-[3.5ch] text-center text-xs tabular-nums text-muted-foreground">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setScale((s) => Math.max(0.15, s * 0.75))} aria-label="Zoom out">
              <ZoomOut className="size-4" />
            </Button>
            <div className="mx-0.5 h-5 w-px bg-border" />
            <Button variant="ghost" size="icon" className="size-8" onClick={fitToContainer} aria-label="Fit to screen">
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
