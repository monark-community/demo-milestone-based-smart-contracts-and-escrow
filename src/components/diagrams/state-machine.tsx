type Key = "locked" | "submitted" | "changes" | "released" | "refunded"

interface Labels {
  locked: string
  submitted: string
  changes: string
  released: string
  refunded: string
  submit: string
  approve: string
  request: string
  resubmit: string
  cancel: string
}

interface Node {
  key: Key
  x: number
  y: number
  w: number
}

interface Edge {
  d: string
  label: keyof Labels
  lx: number
  ly: number
  anchor?: "start" | "middle" | "end"
  money?: boolean
  dashed?: boolean
}

const H = 44

function Diagram({ id, labels, nodes, edges, width, height, title }: { id: string; labels: Labels; nodes: Node[]; edges: Edge[]; width: number; height: number; title: string }) {
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title} className="h-auto w-full" fontFamily="inherit">
      <defs>
        <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--primary)" />
        </marker>
        <marker id={`${id}-arrow-fg`} viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="13" markerHeight="13" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--foreground)" />
        </marker>
      </defs>
      {edges.map((e) => (
        <g key={e.label}>
          <path
            d={e.d}
            fill="none"
            stroke={e.money ? (e.label === "cancel" ? "var(--foreground)" : "var(--primary)") : "var(--primary)"}
            strokeWidth={e.money ? 4 : 1.75}
            strokeLinecap="round"
            strokeDasharray={e.dashed ? "6 6" : undefined}
            markerEnd={e.money && e.label === "cancel" ? `url(#${id}-arrow-fg)` : `url(#${id}-arrow)`}
          />
          <text x={e.lx} y={e.ly} textAnchor={e.anchor ?? "middle"} fontSize="12" fontWeight="600" fill="var(--muted-foreground)">
            {labels[e.label]}
          </text>
        </g>
      ))}
      {nodes.map((n) => {
        const released = n.key === "released"
        const refunded = n.key === "refunded"
        return (
          <g key={n.key}>
            <rect
              x={n.x}
              y={n.y}
              width={n.w}
              height={H}
              rx={22}
              fill={released ? "var(--primary)" : "var(--card)"}
              stroke={released ? "var(--primary)" : refunded ? "var(--input)" : "var(--primary)"}
              strokeWidth={1.75}
              strokeDasharray={refunded ? "5 5" : undefined}
            />
            <text
              x={n.x + n.w / 2}
              y={n.y + H / 2 + 4.5}
              textAnchor="middle"
              fontSize="13"
              fontWeight="800"
              fill={released ? "var(--primary-foreground)" : "var(--foreground)"}
            >
              {labels[n.key]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** The life of a milestone as a state diagram. Money moves only on the two thick arrows. */
export function StateMachine({ labels, title }: { labels: Labels; title: string }) {
  const wide: Node[] = [
    { key: "locked", x: 10, y: 40, w: 150 },
    { key: "submitted", x: 300, y: 40, w: 160 },
    { key: "released", x: 600, y: 40, w: 150 },
    { key: "changes", x: 270, y: 200, w: 220 },
    { key: "refunded", x: 10, y: 200, w: 150 },
  ]
  const wideEdges: Edge[] = [
    { d: "M 162 62 L 294 62", label: "submit", lx: 228, ly: 52 },
    { d: "M 462 62 L 594 62", label: "approve", lx: 528, ly: 50, money: true },
    { d: "M 360 86 L 360 194", label: "request", lx: 352, ly: 146, anchor: "end" },
    { d: "M 400 196 L 400 90", label: "resubmit", lx: 408, ly: 146, anchor: "start" },
    { d: "M 85 86 L 85 194", label: "cancel", lx: 95, ly: 146, anchor: "start", money: true, dashed: true },
  ]
  const tall: Node[] = [
    { key: "locked", x: 10, y: 20, w: 150 },
    { key: "refunded", x: 190, y: 20, w: 150 },
    { key: "submitted", x: 10, y: 170, w: 150 },
    { key: "changes", x: 170, y: 290, w: 170 },
    { key: "released", x: 10, y: 390, w: 150 },
  ]
  const tallEdges: Edge[] = [
    { d: "M 162 42 L 184 42", label: "cancel", lx: 265, ly: 84, money: true, dashed: true },
    { d: "M 85 66 L 85 164", label: "submit", lx: 93, ly: 120, anchor: "start" },
    { d: "M 150 216 L 230 284", label: "request", lx: 200, ly: 232, anchor: "start" },
    { d: "M 280 286 L 190 202", label: "resubmit", lx: 290, ly: 262, anchor: "start" },
    { d: "M 85 216 L 85 384", label: "approve", lx: 93, ly: 350, anchor: "start", money: true },
  ]
  return (
    <>
      <div className="hidden md:block">
        <Diagram id="sm-wide" labels={labels} nodes={wide} edges={wideEdges} width={760} height={260} title={title} />
      </div>
      <div className="md:hidden">
        <Diagram id="sm-tall" labels={labels} nodes={tall} edges={tallEdges} width={350} height={450} title={title} />
      </div>
    </>
  )
}
