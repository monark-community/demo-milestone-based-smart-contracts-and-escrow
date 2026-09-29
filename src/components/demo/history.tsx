"use client"

import {
  BadgeCheckIcon,
  BellRingIcon,
  CircleSlashIcon,
  DownloadIcon,
  HandCoinsIcon,
  LockIcon,
  MessageSquareWarningIcon,
  SendIcon,
  Undo2Icon,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { t } from "@/i18n/t"
import { ORACLE_ACTOR } from "@/lib/demo/ops"
import { TOKENS } from "@/lib/demo/tokens"
import type { Agreement, HistoryEvent, HistoryType } from "@/lib/demo/types"
import { formatDateTime, formatToken, formatUnits, shortHash } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"

const ICONS: Record<HistoryType, typeof LockIcon> = {
  locked: LockIcon,
  submitted: SendIcon,
  approved: BadgeCheckIcon,
  changes: MessageSquareWarningIcon,
  released: HandCoinsIcon,
  check_failed: CircleSlashIcon,
  reminder: BellRingIcon,
  refunded: Undo2Icon,
}

type Filter = "all" | "money" | "reviews" | "other"
const GROUPS: Record<Exclude<Filter, "all">, HistoryType[]> = {
  money: ["locked", "released", "refunded"],
  reviews: ["submitted", "approved", "changes", "check_failed"],
  other: ["reminder"],
}

export function History({ agreement: a }: { agreement: Agreement }) {
  const { app, locale } = useAppCopy()
  const h = app.history
  const [filter, setFilter] = useState<Filter>("all")
  const events = filter === "all" ? a.history : a.history.filter((e) => GROUPS[filter].includes(e.type))

  const describe = (e: HistoryEvent) => {
    const milestone = a.milestones.find((m) => m.id === e.milestoneId)?.title ?? ""
    const amount = e.amount ? formatToken(e.amount, a.token, locale) : ""
    return t(h.types[e.type], { milestone, amount })
  }
  const actor = (e: HistoryEvent) => (e.actor === ORACLE_ACTOR ? h.oracle : e.actor)

  function exportCsv() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
    const header = [h.csv.time, h.csv.event, h.csv.actor, h.csv.milestone, h.csv.amount, h.csv.token, h.csv.tx, h.csv.note]
    const lines = a.history.map((e) =>
      [
        e.at,
        e.type,
        actor(e),
        a.milestones.find((m) => m.id === e.milestoneId)?.title ?? "",
        e.amount ? formatUnits(e.amount, TOKENS[a.token].decimals, "en", 6).replace(/,/g, "") : "",
        e.amount ? a.token : "",
        e.hash ?? "",
        e.note ?? "",
      ]
        .map(esc)
        .join(",")
    )
    const blob = new Blob([[header.map(esc).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${h.filename}-${a.id}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast.success(app.toasts.csv)
  }

  return (
    <section aria-labelledby="history-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="history-title" className="sr-only">
          {h.title}
        </h2>
        <div role="group" aria-label={h.filterLabel} className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {(["all", "money", "reviews", "other"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-sm font-semibold transition-colors duration-150",
                filter === f ? "border-foreground bg-foreground text-background" : "border-input text-muted-foreground hover:text-foreground"
              )}
            >
              {h.filters[f]}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={a.history.length === 0}>
          <DownloadIcon aria-hidden="true" />
          {h.export}
        </Button>
      </div>

      {events.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-dashed p-6 text-center text-muted-foreground">{h.empty}</p>
      ) : (
        <ol className="relative mt-6 flex flex-col gap-0">
          <span aria-hidden="true" className="absolute top-3 bottom-3 left-[17px] w-px bg-border" />
          {events.map((e) => {
            const Icon = ICONS[e.type]
            const money = e.type === "released" || e.type === "locked" || e.type === "refunded"
            return (
              <li key={e.id} className="relative flex gap-4 py-3">
                <span
                  className={cn(
                    "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border bg-card",
                    e.type === "released" && "border-primary bg-primary text-primary-foreground",
                    e.type === "check_failed" && "border-warning text-warning"
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <p className={cn("font-semibold", money && "font-bold")}>{describe(e)}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(h.by, { actor: actor(e) })} · <time dateTime={e.at}>{formatDateTime(e.at, locale)}</time>
                  </p>
                  {e.note && e.type !== "submitted" ? <p className="mt-1 text-sm text-muted-foreground">“{e.note}”</p> : null}
                  {e.hash ? (
                    <p className="mt-1 font-mono text-xs text-muted-foreground" title={e.hash}>
                      tx {shortHash(e.hash)}
                    </p>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
