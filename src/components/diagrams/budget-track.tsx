import { LockIcon, LockOpenIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export type SegmentState = "locked" | "review" | "changes" | "released" | "refunded" | "overdue"

export interface Segment {
  id: string
  bps: number
  state: SegmentState
  label?: string
}

/**
 * The budget as one bar, split into milestone segments sized by their share.
 * Locked money is hatched (still in escrow), released money is solid orange,
 * refunded money is a flat neutral. `fresh` marks a segment that was just
 * released, so it fills in from the left and its padlock opens.
 */
export function BudgetTrack({
  segments,
  label,
  size = "md",
  fresh,
  showLocks = false,
  className,
}: {
  segments: Segment[]
  label: string
  size?: "sm" | "md" | "lg"
  fresh?: string | null
  showLocks?: boolean
  className?: string
}) {
  const h = size === "sm" ? "h-2.5" : size === "md" ? "h-4" : "h-10"
  return (
    <div role="img" aria-label={label} className={cn("flex w-full gap-1", h, className)}>
      {segments.map((s) => (
        <div
          key={s.id}
          style={{ flexGrow: s.bps, flexBasis: 0 }}
          className={cn(
            "relative min-w-2 overflow-hidden rounded-full",
            size === "lg" && "rounded-xl",
            s.state === "released" && "bg-primary/25",
            s.state === "refunded" && "bg-foreground/12 ring-1 ring-foreground/30 ring-inset",
            (s.state === "locked" || s.state === "changes") && "bg-muted text-muted-foreground",
            s.state === "overdue" && "bg-muted text-warning ring-2 ring-warning ring-inset",
            s.state === "review" && "bg-muted text-primary ring-2 ring-primary ring-inset"
          )}
        >
          {s.state !== "released" && s.state !== "refunded" ? <span aria-hidden="true" className="hatch absolute inset-0" /> : null}
          {s.state === "released" ? (
            <span aria-hidden="true" className={cn("absolute inset-0 bg-primary", fresh === s.id && "mm-fill")} />
          ) : null}
          {showLocks && size === "lg" ? (
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
              {s.state === "released" ? (
                <LockOpenIcon className={cn("size-4 text-primary-foreground", fresh === s.id && "mm-stamp")} />
              ) : s.state === "refunded" ? null : (
                <span className="flex size-6 items-center justify-center rounded-full bg-card">
                  <LockIcon className={cn("size-3.5", s.state === "review" ? "text-primary-ink" : "text-muted-foreground")} />
                </span>
              )}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export function Legend({ items, className }: { items: { state: SegmentState; label: string }[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}>
      {items.map((i) => (
        <li key={i.state} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={cn(
              "relative inline-block h-2.5 w-4 overflow-hidden rounded-full",
              i.state === "released" && "bg-primary",
              i.state === "refunded" && "bg-foreground/10",
              i.state === "locked" && "bg-muted text-muted-foreground",
              i.state === "review" && "bg-muted text-primary ring-1 ring-primary ring-inset"
            )}
          >
            {i.state === "locked" || i.state === "review" ? <span className="hatch absolute inset-0" /> : null}
          </span>
          {i.label}
        </li>
      ))}
    </ul>
  )
}
