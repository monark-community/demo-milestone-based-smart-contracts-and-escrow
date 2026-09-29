"use client"

import {
  AlarmClockIcon,
  ArrowRightIcon,
  CalendarClockIcon,
  FileSearchIcon,
  InboxIcon,
  MessageSquareWarningIcon,
  PenLineIcon,
  PlusIcon,
  ScanSearchIcon,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { BudgetTrack, Legend } from "@/components/diagrams/budget-track"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { attentionFor, currentMilestone, daysUntil, portfolio, primaryRole, rolesOf, type AttentionKind } from "@/lib/demo/agreements"
import { useDemo } from "@/lib/demo/store"
import type { Agreement, Role } from "@/lib/demo/types"
import { formatDate, formatToken, formatUsd } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"
import { segmentsOf, trackLabel } from "./helpers"

const ATTENTION_ICONS: Record<AttentionKind, typeof InboxIcon> = {
  review: FileSearchIcon,
  sign: PenLineIcon,
  check: ScanSearchIcon,
  changes: MessageSquareWarningIcon,
  overdue: AlarmClockIcon,
  dueSoon: CalendarClockIcon,
}

type Filter = "all" | Role

export function Dashboard() {
  const demo = useDemo()
  const { app, locale } = useAppCopy()
  const [filter, setFilter] = useState<Filter>("all")
  if (!demo) return null
  const d = app.dashboard
  const now = new Date()
  const stats = portfolio(demo, now)
  const attention = attentionFor(demo, now)
  const mine = demo.agreements.filter((a) => rolesOf(a, demo.wallet.address).length > 0)
  const shown = filter === "all" ? mine : mine.filter((a) => rolesOf(a, demo.wallet.address).includes(filter))

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-display sm:text-4xl">{d.title}</h1>
          <p className="mt-1 text-muted-foreground">{t(d.greeting, { name: demo.wallet.name })}</p>
        </div>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href={href(locale, "/app/new")}>
            <PlusIcon aria-hidden="true" />
            {d.create}
          </Link>
        </Button>
      </div>

      <section aria-label={d.summary.label}>
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label={d.summary.locked} value={formatUsd(stats.locked, locale)} />
          <Stat label={d.summary.released} value={formatUsd(stats.released, locale)} accent />
          <Stat label={d.summary.waiting} value={String(stats.waiting)} />
          <Stat label={d.summary.overdue} value={String(stats.overdue)} warn={stats.overdue > 0} />
        </dl>
        <p className="mt-2 text-xs text-muted-foreground">{d.summary.usdNote}</p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
        <section aria-labelledby="attention-title" className="min-w-0 rounded-3xl border bg-card p-5 lg:order-2">
          <h2 id="attention-title" className="text-lg font-bold">
            {d.attention.title}
            {attention.length ? (
              <span className="ml-2 inline-flex size-6 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground">
                {attention.length}
              </span>
            ) : null}
          </h2>
          {attention.length === 0 ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <InboxIcon className="size-4" aria-hidden="true" />
              {d.attention.empty}
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {attention.map((item) => {
                const Icon = ATTENTION_ICONS[item.kind]
                const days = daysUntil(item.milestone.deadline, now)
                const detail =
                  item.kind === "overdue"
                    ? t(app.agreement.milestone.overdueBy, { n: -days })
                    : item.kind === "dueSoon"
                      ? `${t(app.agreement.milestone.due, { date: formatDate(item.milestone.deadline, locale) })}`
                      : item.agreement.title
                return (
                  <li key={`${item.kind}-${item.milestone.id}`}>
                    <Link
                      href={`${href(locale, `/app/agreement/${item.agreement.id}`)}?as=${item.role}#${item.milestone.id}`}
                      className="group flex items-start gap-3 rounded-2xl border border-transparent p-3 transition-colors hover:border-border hover:bg-muted/50"
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                          item.kind === "overdue" ? "bg-warning/15 text-warning" : "bg-secondary text-foreground"
                        )}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-xs font-bold", item.kind === "overdue" ? "text-warning" : "text-primary-ink")}>
                          {d.attention.kinds[item.kind]}
                        </span>
                        <span className="block truncate font-semibold">{item.milestone.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{detail}</span>
                      </span>
                      <ArrowRightIcon className="mt-2 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="list-title" className="min-w-0 lg:order-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="list-title" className="text-xl font-bold">
              {d.list.title}
            </h2>
            <div role="group" aria-label={d.list.filterLabel} className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
              {(["all", "funder", "builder", "reviewer"] as const).map((f) => (
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
                  {d.list.filters[f]}
                </button>
              ))}
            </div>
          </div>
          <Legend
            className="mt-3"
            items={[
              { state: "released", label: app.track.legendReleased },
              { state: "review", label: app.track.legendReview },
              { state: "locked", label: app.track.legendLocked },
              { state: "refunded", label: app.track.legendRefunded },
            ]}
          />

          {mine.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed p-8 text-center">
              <InboxIcon className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
              <p className="mx-auto mt-3 max-w-[40ch] text-muted-foreground">{d.list.empty}</p>
              <Button asChild className="mt-5">
                <Link href={href(locale, "/app/new")}>
                  <PlusIcon aria-hidden="true" />
                  {d.create}
                </Link>
              </Button>
            </div>
          ) : shown.length === 0 ? (
            <p className="mt-6 rounded-3xl border border-dashed p-6 text-center text-muted-foreground">{d.list.emptyFilter}</p>
          ) : (
            <ul className="mt-5 flex flex-col gap-3">
              {shown.map((a) => (
                <AgreementRow key={a.id} agreement={a} address={demo.wallet.address} now={now} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function Stat({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className={cn("rounded-2xl border bg-card p-4", warn && "border-warning/50")}>
      <dt className="text-xs font-semibold text-muted-foreground sm:text-sm">{label}</dt>
      <dd className={cn("mt-1 font-mono text-xl font-bold tabular-nums sm:text-2xl", accent && "text-primary-ink", warn && "text-warning")}>{value}</dd>
    </div>
  )
}

function AgreementRow({ agreement: a, address, now }: { agreement: Agreement; address: string; now: Date }) {
  const { app, locale } = useAppCopy()
  const d = app.dashboard.list
  const role = primaryRole(a, address)
  const done = a.milestones.filter((m) => m.status === "released").length
  const next = currentMilestone(a)
  return (
    <li>
      <Link
        href={href(locale, `/app/agreement/${a.id}`)}
        aria-label={`${d.open}: ${a.title}`}
        className="group block rounded-3xl border bg-card p-5 transition-colors hover:border-input"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{app.kinds[a.kind]}</Badge>
          <Badge variant={a.status === "completed" ? "success" : a.status === "cancelled" ? "secondary" : "outline"}>{app.status[a.status]}</Badge>
          <span className="ml-auto text-xs font-semibold text-muted-foreground">{t(d.you, { role: app.roles[role] })}</span>
        </div>
        <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <h3 className="text-lg font-bold group-hover:underline group-hover:underline-offset-4">{a.title}</h3>
          <p className="shrink-0 font-mono text-sm font-bold tabular-nums">{formatToken(a.total, a.token, locale)}</p>
        </div>
        <BudgetTrack className="mt-4" segments={segmentsOf(a, now)} label={trackLabel(a, app, now)} />
        <div className="mt-3 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <span>{t(d.progress, { done, n: a.milestones.length })}</span>
          {next && a.status === "active" ? (
            <span className="truncate">
              {t(d.next, { title: next.title })} · {formatDate(next.deadline, locale)}
            </span>
          ) : null}
        </div>
      </Link>
    </li>
  )
}
