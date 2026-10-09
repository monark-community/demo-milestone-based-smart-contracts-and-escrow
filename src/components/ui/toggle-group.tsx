"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { toggleVariants } from "@/components/ui/toggle"

// `variant="pill"` is a segmented control: one muted pill track whose active
// item lifts to bg-card, like the tabs list. `variant="chip"` is a row of
// separate outlined pills whose active item takes the primary tint, the
// filter / option chips the Monark sites hand-roll with aria-pressed.
type ToggleGroupVariant = "default" | "outline" | "pill" | "chip"
type ToggleGroupSize = VariantProps<typeof toggleVariants>["size"]

const segmentItemVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border text-sm whitespace-nowrap transition-colors outline-none focus-visible:z-10 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        pill: "h-full border-transparent px-3.5 font-bold text-foreground/60 after:absolute after:inset-x-0 after:-inset-y-1.5 group-data-vertical/toggle-group:h-9 hover:text-foreground focus-visible:border-ring data-[state=on]:bg-card data-[state=on]:text-foreground group-data-vertical/toggle-group:w-full group-data-vertical/toggle-group:justify-start dark:text-muted-foreground dark:data-[state=on]:border-input dark:data-[state=on]:bg-input/30",
        chip: "border-input bg-card px-4 font-semibold text-foreground hover:bg-muted focus-visible:border-ring data-[state=on]:border-primary/40 data-[state=on]:bg-primary/10 data-[state=on]:text-primary-ink dark:bg-input/30 dark:data-[state=on]:bg-primary/10",
      },
      size: {
        sm: "",
        default: "",
        lg: "",
      },
    },
    compoundVariants: [
      { variant: "chip", size: "sm", className: "h-9 px-3.5 after:absolute after:inset-x-0 after:-inset-y-1" },
      { variant: "chip", size: "default", className: "h-10 after:absolute after:inset-x-0 after:-inset-y-0.5" },
      { variant: "chip", size: "lg", className: "h-11" },
      { variant: "pill", size: "sm", className: "px-3" },
    ],
    defaultVariants: {
      variant: "chip",
      size: "default",
    },
  }
)

const segmentGroupVariants = cva("", {
  variants: {
    variant: {
      pill: "gap-1 rounded-full border bg-muted p-1 data-vertical:h-auto data-vertical:rounded-3xl",
      chip: "flex-wrap gap-2",
    },
    size: {
      sm: "",
      default: "",
      lg: "",
    },
  },
  compoundVariants: [
    { variant: "pill", size: "sm", className: "h-9" },
    { variant: "pill", size: "default", className: "h-10" },
    { variant: "pill", size: "lg", className: "h-11" },
  ],
})

const isSegment = (v?: ToggleGroupVariant | null): v is "pill" | "chip" =>
  v === "pill" || v === "chip"

const ToggleGroupContext = React.createContext<{
  variant?: ToggleGroupVariant | null
  size?: ToggleGroupSize
  spacing?: number
  orientation?: "horizontal" | "vertical"
}>({
  size: "default",
  variant: "default",
  spacing: 2,
  orientation: "horizontal",
})

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 2,
  orientation = "horizontal",
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> & {
  variant?: ToggleGroupVariant | null
  size?: ToggleGroupSize
  spacing?: number
  orientation?: "horizontal" | "vertical"
}) {
  const segment = isSegment(variant)
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={segment ? undefined : spacing}
      data-orientation={orientation}
      orientation={orientation}
      style={
        segment ? undefined : ({ "--gap": spacing } as React.CSSProperties)
      }
      className={cn(
        "group/toggle-group flex w-fit flex-row items-center data-vertical:flex-col data-vertical:items-stretch",
        segment
          ? segmentGroupVariants({ variant, size: size ?? "default" })
          : "gap-[--spacing(var(--gap))] rounded-lg data-[size=sm]:rounded-[min(var(--radius-md),10px)]",
        className
      )}
      {...props}
    >
      <ToggleGroupContext.Provider
        value={{ variant, size, spacing, orientation }}
      >
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> & {
  variant?: ToggleGroupVariant | null
  size?: ToggleGroupSize
}) {
  const context = React.useContext(ToggleGroupContext)
  const v = context.variant || variant
  const s = context.size || size

  if (isSegment(v)) {
    return (
      <ToggleGroupPrimitive.Item
        data-slot="toggle-group-item"
        data-variant={v}
        data-size={s}
        className={cn(segmentItemVariants({ variant: v, size: s ?? "default" }), className)}
        {...props}
      >
        {children}
      </ToggleGroupPrimitive.Item>
    )
  }

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={v}
      data-size={s}
      data-spacing={context.spacing}
      className={cn(
        "shrink-0 group-data-[spacing=0]/toggle-group:rounded-none group-data-[spacing=0]/toggle-group:px-2 focus:z-10 focus-visible:z-10 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-end]:pr-1.5 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-start]:pl-1.5 group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-l-lg group-data-vertical/toggle-group:data-[spacing=0]:first:rounded-t-lg group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-r-lg group-data-vertical/toggle-group:data-[spacing=0]:last:rounded-b-lg group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:border-l-0 group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:border-t-0 group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-l group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-t",
        toggleVariants({
          variant: v as "default" | "outline" | null,
          size: s,
        }),
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem, type ToggleGroupVariant }
