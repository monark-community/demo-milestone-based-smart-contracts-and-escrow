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
import { Empty, EmptyContent, EmptyDescription, EmptyMedia } from "@/components/ui/empty"
import { InfoTip } from "@/components/ui/info-tip"
import { Stat, StatGroup, StatLabel, StatValue } from "@/components/ui/stat"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-extrabold tracking-display sm:text-4xl">{d.title}</h1>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href={href(locale, "/app/new")}>
            <PlusIcon aria-hidden="true" />
            {d.create}
          </Link>
        </Button>
      </div>

      <section aria-label={d.summary.label}>
        <StatGroup className="grid-cols-2">
          <Stat>
            <StatLabel>
              {d.summary.locked}
              <InfoTip label={d.summary.usdInfo}>{d.summary.usdNote}</InfoTip>
            </StatLabel>
            <StatValue>{formatUsd(stats.locked, locale)}</StatValue>
          </Stat>
          <Stat tone="primary">
            <StatLabel>{d.summary.released}</StatLabel>
            <StatValue>{formatUsd(stats.released, locale)}</StatValue>
          </Stat>
          <Stat>
            <StatLabel>{d.summary.waiting}</StatLabel>
            <StatValue>{stats.waiting}</StatValue>
          </Stat>
          <Stat tone={stats.overdue > 0 ? "warning" : "default"}>
            <StatLabel>{d.summary.overdue}</StatLabel>
            <StatValue>{stats.overdue}</StatValue>
          </Stat>
        </StatGroup>
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
            <ToggleGroup
              type="single"
              variant="chip"
              size="sm"
              aria-label={d.list.filterLabel}
              value={filter}
              onValueChange={(v) => v && setFilter(v as Filter)}
              className="-mx-1 max-w-full flex-nowrap overflow-x-auto px-1 py-1"
            >
              {(["all", "funder", "builder", "reviewer"] as const).map((f) => (
                <ToggleGroupItem key={f} value={f}>
                  {d.list.filters[f]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
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
            <Empty className="mt-6">
              <EmptyMedia>
                <InboxIcon />
              </EmptyMedia>
              <EmptyDescription className="max-w-[40ch]">{d.list.empty}</EmptyDescription>
              <EmptyContent>
                <Button asChild>
                  <Link href={href(locale, "/app/new")}>
                    <PlusIcon aria-hidden="true" />
                    {d.create}
                  </Link>
                </Button>
              </EmptyContent>
            </Empty>
          ) : shown.length === 0 ? (
            <Empty size="sm" role="status" className="mt-6">
              <EmptyDescription>{d.list.emptyFilter}</EmptyDescription>
            </Empty>
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
          {a.status !== "active" ? <Badge variant={a.status === "completed" ? "success" : "secondary"}>{app.status[a.status]}</Badge> : null}
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
