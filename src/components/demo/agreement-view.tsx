"use client"

import { ArrowLeftIcon, CircleCheckBigIcon, CircleSlashIcon, SearchXIcon, Undo2Icon } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { BudgetTrack, Legend } from "@/components/diagrams/budget-track"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { NetworkBadge } from "@/components/ui/network-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WalletAddress, WalletAvatar } from "@/components/ui/wallet"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { currentMilestone, rolesOf, primaryRole, totalsOf } from "@/lib/demo/agreements"
import { useTx } from "@/lib/demo/chain"
import { cancelAndRefund, refundableAmount } from "@/lib/demo/ops"
import { useDemo } from "@/lib/demo/store"
import { NETWORK_NAME } from "@/lib/demo/tokens"
import type { Agreement, Party, Role } from "@/lib/demo/types"
import { formatDate, formatToken } from "@/lib/format"
import { cn } from "@/lib/utils"

import { Amount } from "./amount"
import { useAppCopy } from "./app-provider"
import { Disclaimer } from "./disclaimer"
import { segmentsOf, trackLabel } from "./helpers"
import { History } from "./history"
import { MilestoneCard } from "./milestone-card"
import { TxFeedback } from "./tx-feedback"

const ROLES: Role[] = ["funder", "builder", "reviewer"]

export function AgreementView({ id, initialRole }: { id: string; initialRole?: string }) {
  const demo = useDemo()
  const { app, locale } = useAppCopy()
  const c = app.agreement
  const agreement = demo?.agreements.find((a) => a.id === id)
  const [role, setRole] = useState<Role | null>(ROLES.includes(initialRole as Role) ? (initialRole as Role) : null)
  const [fresh, setFresh] = useState<string | null>(null)

  // Scroll to a milestone linked from "Needs your attention".
  useEffect(() => {
    if (!agreement) return
    const hash = window.location.hash.slice(1)
    if (hash) document.getElementById(hash)?.scrollIntoView({ block: "start" })
  }, [agreement?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!demo) return null
  if (!agreement) {
    return (
      <section className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center py-16 text-center">
        <SearchXIcon className="size-10 text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-extrabold">{c.notFound.title}</h1>
        <p className="mt-2 text-muted-foreground">{c.notFound.body}</p>
        <Button asChild className="mt-6">
          <Link href={href(locale, "/app")}>{c.notFound.cta}</Link>
        </Button>
      </section>
    )
  }

  const a = agreement
  const acting = role ?? primaryRole(a, demo.wallet.address)
  const mine = rolesOf(a, demo.wallet.address)
  const next = currentMilestone(a)
  const now = new Date()

  return (
    <div className="flex flex-col gap-6">
      <Link href={href(locale, "/app")} className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        {c.back}
      </Link>

      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{app.kinds[a.kind]}</Badge>
          <Badge variant={a.status === "completed" ? "success" : a.status === "cancelled" ? "secondary" : "outline"}>{app.status[a.status]}</Badge>
          <NetworkBadge name={NETWORK_NAME} variant="subtle" icon={<span className="block size-full rounded-full bg-success" />} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-display sm:text-4xl">{a.title}</h1>
        <p className="max-w-[68ch] text-muted-foreground">{a.summary}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <PartyTile label={c.parties.funder} party={a.funder} you={a.funder.address === demo.wallet.address ? c.actingAs.you : undefined} />
          <PartyTile label={c.parties.builder} party={a.builder} you={a.builder.address === demo.wallet.address ? c.actingAs.you : undefined} />
          <div className="rounded-2xl border bg-card p-3">
            <p className="text-xs font-semibold text-muted-foreground">{c.parties.contract}</p>
            <p className="mt-1.5">
              <WalletAddress address={a.address} className="text-sm" />
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {c.parties.created} {formatDate(a.createdAt, locale)}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_21rem] lg:items-start">
        {/* Rail: role switch and budget. First on phones, sticky on the right from lg. */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:order-2">
          <section aria-labelledby="acting-title" className="rounded-3xl border bg-card p-4">
            <h2 id="acting-title" className="text-sm font-bold">
              {c.actingAs.label}
            </h2>
            <div role="radiogroup" aria-labelledby="acting-title" className="mt-3 grid grid-cols-3 gap-1 rounded-full border p-1">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={acting === r}
                  onClick={() => setRole(r)}
                  className={cn(
                    "inline-flex h-9 min-w-0 items-center justify-center rounded-full px-2 text-xs font-bold transition-colors duration-150 sm:text-sm",
                    acting === r ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="truncate">{app.roles[r]}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {mine.length ? `${t(app.dashboard.list.you, { role: mine.map((r) => app.roles[r]).join(", ") })}. ` : ""}
              {c.actingAs.hint}
            </p>
          </section>

          <BudgetCard agreement={a} fresh={fresh} acting={acting} now={now} />
        </aside>

        <div className="flex min-w-0 flex-col gap-4 lg:order-1">
          {a.status === "completed" ? (
            <p className="flex items-start gap-2 rounded-2xl border border-success/40 bg-success/10 p-4 text-sm font-semibold text-success">
              <CircleCheckBigIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {c.banners.completed}
            </p>
          ) : a.status === "cancelled" ? (
            <p className="flex items-start gap-2 rounded-2xl border bg-muted p-4 text-sm font-semibold">
              <CircleSlashIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {c.banners.cancelled}
            </p>
          ) : null}

          <Tabs defaultValue="milestones">
            <TabsList className="max-w-full">
              <TabsTrigger value="milestones">{c.tabs.milestones}</TabsTrigger>
              <TabsTrigger value="history">{c.tabs.history}</TabsTrigger>
              <TabsTrigger value="details">{c.tabs.details}</TabsTrigger>
            </TabsList>
            <TabsContent value="milestones" className="mt-4">
              <ol className="flex flex-col gap-4">
                {a.milestones.map((m, i) => (
                  <MilestoneCard
                    key={m.id}
                    agreement={a}
                    milestone={m}
                    index={i}
                    role={acting}
                    isNext={next?.id === m.id}
                    fresh={fresh === m.id}
                    onReleased={setFresh}
                  />
                ))}
              </ol>
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <History agreement={a} />
            </TabsContent>
            <TabsContent value="details" className="mt-4">
              <Details agreement={a} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function PartyTile({ label, party, you }: { label: string; party: Party; you?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-3">
      <WalletAvatar address={party.address} size={32} />
      <div className="min-w-0 leading-tight">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="truncate font-bold">
          {party.name}
          {you ? <span className="font-semibold text-muted-foreground"> ({you})</span> : null}
        </p>
        <p>
          <WalletAddress address={party.address} className="text-xs text-muted-foreground" />
        </p>
      </div>
    </div>
  )
}

function BudgetCard({ agreement: a, fresh, acting, now }: { agreement: Agreement; fresh: string | null; acting: Role; now: Date }) {
  const demo = useDemo()
  const { app, locale, disclaimer } = useAppCopy()
  const c = app.agreement
  const tx = useTx()
  const [open, setOpen] = useState(false)
  if (!demo) return null
  const totals = totalsOf(a)
  const refundable = refundableAmount(a)
  const inReview = a.milestones.some((m) => m.status === "submitted")
  const canCancel = acting === "funder" && a.status === "active" && refundable > 0n
  const me = demo.wallet.address.toLowerCase()

  async function doRefund() {
    setOpen(false)
    await tx.run(
      {
        title: app.summaries.refund,
        rows: [
          { label: app.summaries.rows.agreement, value: a.title },
          { label: a.funder.address.toLowerCase() === me ? app.summaries.rows.returns : app.summaries.rows.to, value: formatToken(refundable, a.token, locale) },
        ],
        movesValue: true,
        signer: a.funder.address.toLowerCase() === me ? undefined : a.funder,
      },
      (hash) => {
        cancelAndRefund(a.id, a.funder.name, hash)
        toast.success(t(app.toasts.refunded, { amount: formatToken(refundable, a.token, locale), name: a.funder.name }))
      }
    )
  }

  return (
    <section aria-labelledby="budget-title" className="rounded-3xl border bg-card p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="budget-title" className="text-sm font-bold">
          {c.budget.title}
        </h2>
        <Amount value={a.total} token={a.token} locale={locale} className="text-base font-bold" />
      </div>
      <BudgetTrack className="mt-4" size="lg" showLocks segments={segmentsOf(a, now)} fresh={fresh} label={trackLabel(a, app, now)} />
      <Legend
        className="mt-3"
        items={[
          { state: "released", label: app.track.legendReleased },
          { state: "review", label: app.track.legendReview },
          { state: "locked", label: app.track.legendLocked },
        ]}
      />
      <dl className="mt-4 flex flex-col divide-y text-sm">
        <Row label={c.budget.locked} value={formatToken(totals.locked, a.token, locale)} />
        {totals.inReview > 0n ? <Row label={c.budget.inReview} value={formatToken(totals.inReview, a.token, locale)} muted /> : null}
        <Row label={c.budget.released} value={formatToken(totals.released, a.token, locale)} strong />
        {totals.refunded > 0n ? <Row label={c.budget.refunded} value={formatToken(totals.refunded, a.token, locale)} /> : null}
      </dl>

      {canCancel || tx.state.phase !== "idle" ? (
        <div className="mt-4 flex flex-col gap-3 border-t pt-4">
          {canCancel ? (
            <Button variant="destructive" onClick={() => setOpen(true)} disabled={tx.busy}>
              <Undo2Icon aria-hidden="true" />
              {c.actions.cancel}
            </Button>
          ) : null}
          {canCancel ? <Disclaimer text={disclaimer} /> : null}
          <TxFeedback
            state={tx.state}
            pendingLabel={c.pending.refund}
            onRetry={tx.state.phase === "failed" ? () => void doRefund() : undefined}
            onDismiss={tx.state.phase === "failed" || tx.state.phase === "confirmed" ? tx.reset : undefined}
          />
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent closeLabel={app.close} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">{c.refundDialog.title}</DialogTitle>
            <DialogDescription>{c.refundDialog.body}</DialogDescription>
          </DialogHeader>
          <dl className="flex flex-col divide-y rounded-2xl border text-sm">
            <Row label={c.refundDialog.returns} value={formatToken(refundable, a.token, locale)} strong className="px-4" />
            <Row label={c.refundDialog.stays} value={formatToken(totals.released, a.token, locale)} className="px-4" />
          </dl>
          {inReview ? <p className="text-sm font-semibold text-warning">{c.refundDialog.inReview}</p> : null}
          <Disclaimer text={disclaimer} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {c.refundDialog.back}
            </Button>
            <Button variant="destructive" onClick={() => void doRefund()} autoFocus>
              {c.refundDialog.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function Row({ label, value, strong, muted, className }: { label: string; value: string; strong?: boolean; muted?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3 py-2", className)}>
      <dt className={cn("text-muted-foreground", muted && "pl-3 text-xs")}>{label}</dt>
      <dd className={cn("text-right font-mono tabular-nums", strong ? "font-bold text-primary-ink" : "font-semibold", muted && "text-xs")}>{value}</dd>
    </div>
  )
}

function Details({ agreement: a }: { agreement: Agreement }) {
  const { app, locale } = useAppCopy()
  const d = app.agreement.details
  const rows: [string, string][] = [
    [d.summary, a.summary],
    [d.kind, app.kinds[a.kind]],
    [d.token, a.token],
    [d.total, formatToken(a.total, a.token, locale)],
    [d.milestones, String(a.milestones.length)],
    [d.created, formatDate(a.createdAt, locale)],
  ]
  return (
    <dl className="divide-y rounded-3xl border bg-card">
      {rows.map(([k, v]) => (
        <div key={k} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:justify-between sm:gap-6">
          <dt className="text-sm text-muted-foreground">{k}</dt>
          <dd className="font-semibold sm:text-right">{v}</dd>
        </div>
      ))}
      <div className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:justify-between sm:gap-6">
        <dt className="text-sm text-muted-foreground">{d.contract}</dt>
        <dd className="font-mono text-xs break-all sm:text-right">{a.address}</dd>
      </div>
    </dl>
  )
}
