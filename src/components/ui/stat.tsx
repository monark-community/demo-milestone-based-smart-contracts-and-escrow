import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ArrowDownRightIcon, ArrowRightIcon, ArrowUpRightIcon } from "lucide-react"
import { cn } from "cn"

/**
 * A row or grid of figures. Renders a `<dl>` so each Stat's label (`<dt>`) and
 * value (`<dd>`) are announced as a pair. Stat parts use dt/dd, so always put
 * them inside a StatGroup (or your own `<dl>`).
 */
function StatGroup({ className, ...props }: React.ComponentProps<"dl">) {
  return (
    <dl
      data-slot="stat-group"
      className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}
      {...props}
    />
  )
}

const statVariants = cva("group/stat flex min-w-0 flex-col gap-1", {
  variants: {
    variant: {
      tile: "rounded-2xl border bg-card p-4 text-card-foreground",
      plain: "",
    },
    tone: {
      default: "",
      primary: "",
      success: "",
      warning: "data-[variant=tile]:border-warning/50",
      destructive: "data-[variant=tile]:border-destructive/50",
    },
  },
  defaultVariants: { variant: "tile", tone: "default" },
})

/**
 * One figure: a small label over a big tabular value, with an optional hint
 * or delta. `tone` colours the value (and the tile border for warning /
 * destructive); colour is a supplement, so say the state in the hint too.
 */
function Stat({
  className,
  variant = "tile",
  tone = "default",
  size = "default",
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof statVariants> & {
    /** Value size: `sm` for dense rows, `lg` for a headline figure. */
    size?: "sm" | "default" | "lg"
  }) {
  return (
    <div
      data-slot="stat"
      data-variant={variant}
      data-tone={tone}
      data-size={size}
      className={cn(statVariants({ variant, tone }), className)}
      {...props}
    />
  )
}

function StatLabel({ className, ...props }: React.ComponentProps<"dt">) {
  return (
    <dt
      data-slot="stat-label"
      className={cn(
        "flex min-h-5 items-center justify-between gap-1 text-xs font-semibold text-muted-foreground [&_[data-slot=info-tip]]:-my-2 [&_[data-slot=info-tip]]:-mr-2",
        className
      )}
      {...props}
    />
  )
}

function StatValue({ className, ...props }: React.ComponentProps<"dd">) {
  return (
    <dd
      data-slot="stat-value"
      className={cn(
        "flex flex-wrap items-center gap-2 text-2xl leading-tight font-extrabold tracking-display tnum transition-colors duration-200 sm:text-[1.75rem]",
        "group-data-[size=sm]/stat:text-base group-data-[size=sm]/stat:font-bold group-data-[size=sm]/stat:sm:text-base",
        "group-data-[size=lg]/stat:text-3xl group-data-[size=lg]/stat:sm:text-4xl",
        "group-data-[tone=primary]/stat:text-primary-ink group-data-[tone=success]/stat:text-success group-data-[tone=warning]/stat:text-warning group-data-[tone=destructive]/stat:text-destructive",
        className
      )}
      {...props}
    />
  )
}

function StatHint({ className, ...props }: React.ComponentProps<"dd">) {
  return (
    <dd
      data-slot="stat-hint"
      className={cn("text-xs text-muted-foreground tnum", className)}
      {...props}
    />
  )
}

const deltaIcon = {
  up: ArrowUpRightIcon,
  down: ArrowDownRightIcon,
  flat: ArrowRightIcon,
} as const

const deltaTone = {
  positive: "text-success",
  negative: "text-destructive",
  neutral: "text-muted-foreground",
} as const

/**
 * Change since a previous period, e.g. "+4.2%". `trend` picks the arrow
 * (decorative); `tone` picks the colour, since "down" is good for some
 * figures (fees, risk). Put the meaning in the text or `srLabel`.
 */
function StatDelta({
  className,
  trend = "up",
  tone,
  srLabel,
  children,
  ...props
}: React.ComponentProps<"dd"> & {
  trend?: keyof typeof deltaIcon
  tone?: keyof typeof deltaTone
  /** Screen-reader prefix such as "Up from last week:". */
  srLabel?: string
}) {
  const Icon = deltaIcon[trend]
  const resolvedTone =
    tone ?? (trend === "up" ? "positive" : trend === "down" ? "negative" : "neutral")
  return (
    <dd
      data-slot="stat-delta"
      data-trend={trend}
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-bold tnum",
        deltaTone[resolvedTone],
        className
      )}
      {...props}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {srLabel ? <span className="sr-only">{srLabel} </span> : null}
      {children}
    </dd>
  )
}

export { Stat, StatDelta, StatGroup, StatHint, StatLabel, StatValue, statVariants }
