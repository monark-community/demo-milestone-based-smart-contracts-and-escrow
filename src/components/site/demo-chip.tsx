import { cn } from "@/lib/utils"

/**
 * The header's Demo chip (brand guidelines §10): marks the whole site as a
 * simulated demo. Tint: primary at 8% in light mode (15% fails AA for 12px
 * bold primary-ink), 15% in dark. Drop it once the product is live.
 */
export function DemoChip({ label, title, className }: { label: string; title?: string; className?: string }) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/8 px-2.5 py-1 text-xs font-bold whitespace-nowrap text-primary-ink dark:bg-primary/15",
        className
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
