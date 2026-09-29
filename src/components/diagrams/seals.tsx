import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Signature seals for a k-of-n sign-off: one ring per signer, stamped when
 * they sign. The ring that reaches the threshold is what releases the money.
 */
export function Seals({
  signers,
  threshold,
  size = "md",
  label,
  className,
}: {
  signers: { name: string; signed: boolean; fresh?: boolean; sr?: string }[]
  threshold: number
  size?: "sm" | "md"
  label: string
  className?: string
}) {
  const box = size === "sm" ? "size-6" : "size-9"
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ul aria-label={label} className="flex items-center -space-x-1.5">
        {signers.map((s, i) => (
          <li key={`${s.name}-${i}`} title={s.name} className="relative">
            <span
              className={cn(
                "flex items-center justify-center rounded-full border-2 bg-card text-[0.6rem] font-extrabold",
                box,
                s.signed ? "border-primary bg-primary text-primary-foreground" : "border-dashed border-input text-muted-foreground",
                s.fresh && "mm-stamp"
              )}
            >
              {s.signed ? <CheckIcon className={size === "sm" ? "size-3" : "size-4"} strokeWidth={3} aria-hidden="true" /> : initials(s.name)}
            </span>
            <span className="sr-only">{s.sr ?? s.name}</span>
          </li>
        ))}
      </ul>
      <span className="text-xs font-bold tabular-nums text-muted-foreground" aria-hidden="true">
        {signers.filter((s) => s.signed).length}/{threshold}
      </span>
    </div>
  )
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}
