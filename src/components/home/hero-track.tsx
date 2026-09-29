"use client"

import { CheckCircle2Icon, EyeIcon, PenLineIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { BudgetTrack, type Segment } from "@/components/diagrams/budget-track"
import { Seals } from "@/components/diagrams/seals"
import type { Dictionary } from "@/i18n"
import { intlLocale, type Locale } from "@/i18n/config"
import { t } from "@/i18n/t"
import { cn } from "@/lib/utils"

type Phase = 0 | 1 | 2

/**
 * The unlock track: a real agreement whose second milestone is signed off and
 * released on a calm loop. Under prefers-reduced-motion it shows the final state.
 */
export function HeroTrack({ copy, locale }: { copy: Dictionary["home"]["track"]; locale: Locale }) {
  const [phase, setPhase] = useState<Phase>(0)
  const [loop, setLoop] = useState(0)

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      const id = window.setTimeout(() => setPhase(2), 0)
      return () => window.clearTimeout(id)
    }
    const timers = [
      window.setTimeout(() => setPhase(1), 1800),
      window.setTimeout(() => setPhase(2), 3000),
      window.setTimeout(() => {
        setPhase(0)
        setLoop((n) => n + 1)
      }, 7500),
    ]
    return () => timers.forEach((x) => window.clearTimeout(x))
  }, [loop])

  const nf = new Intl.NumberFormat(intlLocale[locale])
  const released = phase === 2 ? 3000 : 900
  const locked = 6000 - released
  const segs: Segment[] = [
    { id: "s1", bps: 1500, state: "released" },
    { id: "s2", bps: 3500, state: phase === 2 ? "released" : "review" },
    { id: "s3", bps: 3000, state: "locked" },
    { id: "s4", bps: 2000, state: "locked" },
  ]
  const signers = [
    { name: "Karim Haddad", signed: true },
    { name: "Camille Roy", signed: phase >= 1, fresh: phase === 1 },
    { name: "Inès Ferreira", signed: false },
  ]

  return (
    <figure aria-label={copy.label} className="relative w-full rounded-3xl border bg-card p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold">{copy.title}</p>
          <p className="text-sm text-muted-foreground">{copy.meta}</p>
        </div>
        <p className="shrink-0 text-right font-mono text-sm font-bold tabular-nums">{nf.format(6000)} tUSDC</p>
      </div>

      <div aria-hidden="true" className="mt-6">
        <BudgetTrack segments={segs} label="" size="lg" showLocks fresh={phase === 2 ? "s2" : null} />
        <div className="mt-2 flex gap-1 text-[0.7rem] font-semibold text-muted-foreground sm:text-xs">
          {copy.milestones.map((m, i) => (
            <span key={m} style={{ flexGrow: segs[i]?.bps ?? 1, flexBasis: 0 }} className={cn("min-w-0 truncate", i === 1 && "text-foreground")}>
              {m}
            </span>
          ))}
        </div>
      </div>

      <div aria-hidden="true" className="mt-6 flex flex-col gap-4 rounded-2xl border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
              phase === 2 ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
            )}
          >
            {phase === 0 ? <EyeIcon className="size-4" /> : phase === 1 ? <PenLineIcon className="size-4" /> : <CheckCircle2Icon className="size-4" />}
          </span>
          <div className="leading-tight">
            <p className="font-bold">{copy.milestones[1]} · {nf.format(2100)} tUSDC</p>
            <p className={cn("text-sm", phase === 2 ? "font-semibold text-success" : "text-muted-foreground")}>
              {phase === 0 ? copy.states.review : phase === 1 ? t(copy.states.signing, { n: 2 }) : copy.states.released}
            </p>
          </div>
        </div>
        <Seals signers={signers} threshold={2} label="" />
      </div>

      <dl aria-hidden="true" className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-muted/60 p-3">
          <dt className="text-xs font-semibold text-muted-foreground">{copy.locked}</dt>
          <dd className="mt-0.5 font-mono text-lg font-bold tabular-nums">{nf.format(locked)}</dd>
        </div>
        <div className="rounded-2xl bg-muted/60 p-3">
          <dt className="text-xs font-semibold text-muted-foreground">{copy.released}</dt>
          <dd className={cn("mt-0.5 font-mono text-lg font-bold tabular-nums transition-colors", phase === 2 && "text-primary-ink")}>{nf.format(released)}</dd>
        </div>
      </dl>
    </figure>
  )
}
