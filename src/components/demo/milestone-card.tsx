"use client"

import {
  BellRingIcon,
  CheckIcon,
  CircleDashedIcon,
  LinkIcon,
  MessageSquareWarningIcon,
  PenLineIcon,
  ScanSearchIcon,
  SendIcon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react"
import { useState, type ReactNode } from "react"
import { toast } from "sonner"

import { Seals } from "@/components/diagrams/seals"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TxStatus } from "@/components/ui/tx-status"
import { t } from "@/i18n/t"
import { daysUntil, isOverdue, threshold } from "@/lib/demo/agreements"
import { useTx } from "@/lib/demo/chain"
import {
  approveMilestone,
  checkWillPass,
  recordCheckFailed,
  releaseByCheck,
  requestChanges,
  sendReminder,
  submitMilestone,
} from "@/lib/demo/ops"
import { useDemo } from "@/lib/demo/store"
import type { Agreement, Milestone, Party, Role, TxSummary } from "@/lib/demo/types"
import { formatDate, formatDateTime, formatPercent, formatToken } from "@/lib/format"
import { cn } from "@/lib/utils"

import { Amount } from "./amount"
import { useAppCopy } from "./app-provider"
import { Disclaimer } from "./disclaimer"
import { ruleLabel, statusKey } from "./helpers"
import { TxFeedback } from "./tx-feedback"

type Action = "submit" | "approve" | "changes" | "check" | "ask"

export function MilestoneCard({
  agreement: a,
  milestone: m,
  index,
  role,
  isNext,
  fresh,
  onReleased,
}: {
  agreement: Agreement
  milestone: Milestone
  index: number
  role: Role
  isNext: boolean
  fresh: boolean
  onReleased: (milestoneId: string) => void
}) {
  const demo = useDemo()
  const { app, locale, disclaimer } = useAppCopy()
  const c = app.agreement
  const mc = c.milestone
  const tx = useTx()
  const [action, setAction] = useState<Action | null>(null)
  const [dialog, setDialog] = useState<"submit" | "changes" | null>(null)
  const [freshSigner, setFreshSigner] = useState<string | null>(null)
  if (!demo) return null

  const me = demo.wallet.address.toLowerCase()
  const now = new Date()
  const overdue = isOverdue(m, now)
  const days = daysUntil(m.deadline, now)
  const status = statusKey(m, now)
  const active = a.status === "active"
  const amountText = formatToken(m.amount, a.token, locale)
  const k = threshold(m)
  const reviewers = m.rule.kind === "reviewers" ? m.rule.reviewers : []
  const signedBy = (p: Party) => m.approvals.some((x) => x.toLowerCase() === p.address.toLowerCase())
  const nextSigner = reviewers.find((r) => r.address.toLowerCase() === me && !signedBy(r)) ?? reviewers.find((r) => !signedBy(r))
  const youAreReviewer = reviewers.some((r) => r.address.toLowerCase() === me)
  const youSigned = youAreReviewer && m.approvals.some((x) => x.toLowerCase() === me)
  // A co-reviewer who signs from their own wallet (simulated, no prompt for you).
  const askTarget = youSigned
    ? reviewers.find((r) => !signedBy(r))
    : reviewers.find((r) => !signedBy(r) && r.address !== nextSigner?.address && r.address.toLowerCase() !== me)

  const party = (r: Role): Party | undefined => (r === "funder" ? a.funder : r === "builder" ? a.builder : nextSigner)
  const signerFor = (p?: Party) => (p && p.address.toLowerCase() !== me ? p : undefined)
  const rows = (extra: TxSummary["rows"] = []) => [{ label: app.summaries.rows.agreement, value: a.title }, { label: app.summaries.rows.milestone, value: m.title }, ...extra]

  const busy = tx.busy

  function releaseToast() {
    toast.success(t(app.toasts.released, { amount: amountText, name: a.builder.name }))
    onReleased(m.id)
  }

  async function doSubmit(link: string, note: string) {
    setDialog(null)
    setAction("submit")
    const actor = a.builder
    await tx.run(
      { title: app.summaries.submit, rows: rows(), signer: signerFor(actor) },
      (hash) => {
        submitMilestone(a.id, m.id, { link, note }, actor.name, hash)
        toast.success(app.toasts.submitted)
      }
    )
  }

  async function doApprove(signer: Party, skipPrompt = false) {
    setAction(skipPrompt ? "ask" : "approve")
    const willRelease = m.approvals.length + 1 >= k
    await tx.run(
      {
        title: app.summaries.approve,
        rows: rows([
          ...(m.rule.kind === "reviewers" ? [{ label: app.summaries.rows.signatures, value: `${m.approvals.length + 1}/${k}` }] : []),
          ...(willRelease ? [{ label: app.summaries.rows.releases, value: `${amountText} → ${a.builder.name}` }] : []),
        ]),
        movesValue: willRelease,
        signer: signerFor(signer),
      },
      (hash) => {
        approveMilestone(a.id, m.id, signer, hash)
        setFreshSigner(signer.address)
        if (willRelease) releaseToast()
        else toast.success(t(app.toasts.signed, { n: m.approvals.length + 1, k }))
      },
      { skipPrompt }
    )
  }

  async function doChanges(note: string) {
    setDialog(null)
    setAction("changes")
    const actor = party(role) ?? a.funder
    await tx.run({ title: app.summaries.changes, rows: rows(), signer: signerFor(actor) }, (hash) => {
      requestChanges(a.id, m.id, note, actor.name, hash)
      toast.success(app.toasts.changes)
    })
  }

  async function doCheck() {
    setAction("check")
    const actor = party(role) ?? a.funder
    const condition = m.rule.kind === "check" ? m.rule.condition : ""
    const reason = m.rule.kind === "check" ? (m.rule.failFirst ?? "") : ""
    await tx.run(
      {
        title: app.summaries.check,
        rows: rows([
          { label: app.summaries.rows.condition, value: condition },
          { label: app.summaries.rows.releases, value: `${amountText} → ${a.builder.name}` },
        ]),
        movesValue: true,
        signer: signerFor(actor),
      },
      (hash) => {
        releaseByCheck(a.id, m.id, hash)
        releaseToast()
      },
      {
        check: () => checkWillPass(a, m.id),
        onCheckFail: (hash) => recordCheckFailed(a.id, m.id, reason, hash),
      }
    )
  }

  function doRemind() {
    sendReminder(a.id, m.id, a.funder.name)
    toast.success(t(app.toasts.reminder, { name: a.builder.name }))
  }

  const retry = () => {
    if (action === "approve" && nextSigner) void doApprove(nextSigner)
    else if (action === "ask" && askTarget) void doApprove(askTarget, true)
    else if (action === "check") void doCheck()
    else if (action === "submit") setDialog("submit")
    else if (action === "changes") setDialog("changes")
  }

  /* ---------------------------------------------------------------- actions per role */
  const buttons: ReactNode[] = []
  let hint: string | null = null
  if (active) {
    if (role === "builder") {
      if (m.status === "locked" || m.status === "changes") {
        buttons.push(
          <Button key="submit" onClick={() => setDialog("submit")} disabled={busy}>
            <SendIcon aria-hidden="true" />
            {m.status === "changes" ? c.actions.resubmit : c.actions.submit}
          </Button>
        )
      } else if (m.status === "submitted") hint = m.rule.kind === "check" ? mc.waitingCheck : mc.waitingReview
    }
    if (role === "funder") {
      if (m.status === "submitted" && m.rule.kind === "funder") {
        buttons.push(
          <Button key="approve" onClick={() => void doApprove(a.funder)} disabled={busy}>
            <CheckIcon aria-hidden="true" />
            {c.actions.approve}
          </Button>
        )
      }
      if (m.status === "submitted" && m.rule.kind !== "check") {
        buttons.push(
          <Button key="changes" variant="outline" onClick={() => setDialog("changes")} disabled={busy}>
            <MessageSquareWarningIcon aria-hidden="true" />
            {c.actions.requestChanges}
          </Button>
        )
      }
      if (overdue) {
        buttons.push(
          <Button key="remind" variant="outline" onClick={doRemind} disabled={busy}>
            <BellRingIcon aria-hidden="true" />
            {c.actions.remind}
          </Button>
        )
      }
      if (m.status === "submitted" && m.rule.kind === "reviewers") hint = t(mc.notSigner, { who: ruleLabel(m.rule, app.rules) })
      if ((m.status === "locked" || m.status === "changes") && !overdue) hint = mc.waitingBuilder
    }
    if (role === "reviewer") {
      if (m.status === "submitted" && m.rule.kind === "reviewers") {
        const releases = m.approvals.length + 1 >= k
        if (youSigned) hint = c.actions.signedAlready
        else if (nextSigner) {
          buttons.push(
            <Button key="sign" onClick={() => void doApprove(nextSigner)} disabled={busy}>
              <PenLineIcon aria-hidden="true" />
              {releases ? c.actions.approve : c.actions.sign}
            </Button>
          )
        }
        if (askTarget) {
          buttons.push(
            <Button key="ask" variant={youSigned ? "default" : "outline"} onClick={() => void doApprove(askTarget, true)} disabled={busy}>
              <UserCheckIcon aria-hidden="true" />
              {t(c.actions.askSign, { name: askTarget.name.split(" ")[0] ?? askTarget.name })}
            </Button>
          )
        }
        buttons.push(
          <Button key="changes" variant="outline" onClick={() => setDialog("changes")} disabled={busy}>
            <MessageSquareWarningIcon aria-hidden="true" />
            {c.actions.requestChanges}
          </Button>
        )
      } else if (m.rule.kind !== "reviewers" && m.status !== "released" && m.status !== "refunded" && m.rule.kind !== "check") {
        hint = t(mc.notSigner, { who: ruleLabel(m.rule, app.rules) })
      } else if (m.status === "locked" || m.status === "changes") hint = mc.waitingBuilder
    }
    if (m.status === "submitted" && m.rule.kind === "check") {
      buttons.push(
        <Button key="check" onClick={() => void doCheck()} disabled={busy}>
          <ScanSearchIcon aria-hidden="true" />
          {c.actions.runCheck}
        </Button>
      )
      hint = null
    }
  }
  // Approving, co-signing and running the check can all release money.
  const valueMoving = active && m.status === "submitted" && buttons.length > 0

  return (
    <li id={m.id} className={cn("scroll-mt-24 rounded-3xl border bg-card p-5 sm:p-6", isNext && active && "border-primary/60", m.status === "refunded" && "opacity-80")}>
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-extrabold",
            m.status === "released" ? "border-primary bg-primary text-primary-foreground" : "border-input text-muted-foreground",
            m.status === "submitted" && "border-primary text-foreground"
          )}
        >
          {m.status === "released" ? <CheckIcon className={cn("size-4", fresh && "mm-stamp")} strokeWidth={3} /> : index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {isNext && active ? <span className="eyebrow text-primary-ink">{mc.next}</span> : null}
            <Badge
              variant={
                status === "released" ? "success" : status === "overdue" || status === "changes" ? "warning" : status === "submitted" ? "default" : "secondary"
              }
            >
              {app.msStatus[status]}
            </Badge>
          </div>
          <h3 className="mt-1.5 text-lg font-bold">{m.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{m.deliverable}</p>
        </div>
        <div className="shrink-0 text-right">
          <Amount value={m.amount} token={a.token} locale={locale} className="items-end text-base font-bold" />
          <p className="mt-0.5 text-xs text-muted-foreground">{t(mc.share, { pct: formatPercent(m.bps / 10_000, locale) })}</p>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold text-muted-foreground">{t(mc.due, { date: formatDate(m.deadline, locale) })}</dt>
          <dd className={cn("font-semibold", overdue && "text-warning")}>
            {m.status === "released" && m.releasedAt
              ? t(mc.releasedOn, { date: formatDate(m.releasedAt, locale) })
              : m.status === "refunded"
                ? mc.refunded
                : overdue
                  ? t(mc.overdueBy, { n: -days })
                  : days === 0
                    ? mc.dueToday
                    : days === 1
                      ? mc.dueTomorrow
                      : days > 0
                        ? t(mc.dueIn, { n: days })
                        : formatDate(m.deadline, locale)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-muted-foreground">{ruleTitle(app)}</dt>
          <dd className="flex flex-wrap items-center gap-2 font-semibold">
            {m.rule.kind === "funder" ? <UserCheckIcon className="size-4 text-primary" aria-hidden="true" /> : m.rule.kind === "reviewers" ? <UsersIcon className="size-4 text-primary" aria-hidden="true" /> : <ScanSearchIcon className="size-4 text-primary" aria-hidden="true" />}
            {ruleLabel(m.rule, app.rules)}
          </dd>
        </div>
      </dl>

      {m.rule.kind === "reviewers" && (m.status === "submitted" || m.status === "released") ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/50 px-4 py-3">
          <Seals
            label={t(mc.signatures, { n: m.approvals.length, k })}
            threshold={k}
            signers={m.rule.reviewers.map((r) => ({
              name: r.name,
              signed: signedBy(r),
              fresh: freshSigner === r.address,
              sr: `${r.name}: ${signedBy(r) ? mc.signed : mc.notSigned}`,
            }))}
          />
          <p className="text-xs font-semibold text-muted-foreground">
            {m.rule.reviewers.map((r) => `${r.name.split(" ")[0]}${signedBy(r) ? " ✓" : ""}`).join(" · ")}
          </p>
        </div>
      ) : null}

      {m.rule.kind === "check" ? (
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-muted/50 px-4 py-3 text-sm">
          <CircleDashedIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span>
            <span className="font-semibold">{mc.condition}: </span>
            <span className="font-mono text-xs">{m.rule.condition}</span>
          </span>
        </p>
      ) : null}

      {m.submission && m.status !== "locked" ? (
        <div className="mt-4 flex flex-col gap-1 text-sm">
          <p className="flex min-w-0 items-center gap-2">
            <LinkIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="font-semibold">{mc.evidence}:</span>
            <span className="truncate font-mono text-xs text-muted-foreground" title={m.submission.link}>
              {m.submission.link.replace(/^https?:\/\//, "")}
            </span>
          </p>
          {m.submission.note ? (
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">{mc.note}: </span>
              {m.submission.note}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">{formatDateTime(m.submission.at, locale)}</p>
        </div>
      ) : null}

      {m.status === "changes" && m.changesNote ? (
        <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/5 p-4 text-sm">
          <p className="flex items-center gap-2 font-bold text-warning">
            <MessageSquareWarningIcon className="size-4" aria-hidden="true" />
            {mc.changesNote}
          </p>
          <p className="mt-1">{m.changesNote}</p>
        </div>
      ) : null}

      {m.status === "released" && m.releaseHash ? (
        <TxStatus status="confirmed" hash={m.releaseHash} label={mc.receipt} className="mt-4" />
      ) : null}

      {buttons.length || hint ? (
        <div className="mt-5 flex flex-col gap-3 border-t pt-4">
          {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
          {buttons.length ? <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">{buttons}</div> : null}
          {valueMoving ? <Disclaimer text={disclaimer} /> : null}
        </div>
      ) : null}

      <TxFeedback
        className="mt-4"
        state={tx.state}
        pendingLabel={
          action === "submit" ? c.pending.submit : action === "changes" ? c.pending.changes : action === "check" ? c.pending.check : c.pending.approve
        }
        checkText={t(c.checkFailed, { reason: m.rule.kind === "check" ? lastCheckReason(a, m.id) : "" })}
        onRetry={tx.state.phase === "failed" ? retry : undefined}
        onDismiss={tx.state.phase === "failed" || tx.state.phase === "confirmed" ? tx.reset : undefined}
      />

      <SubmitDialog
        open={dialog === "submit"}
        milestone={m}
        initialLink={m.submission?.link ?? ""}
        onClose={() => setDialog(null)}
        onSubmit={(link, note) => void doSubmit(link, note)}
      />
      <ChangesDialog open={dialog === "changes"} milestone={m} onClose={() => setDialog(null)} onSubmit={(note) => void doChanges(note)} />
    </li>
  )
}

function ruleTitle(app: ReturnType<typeof useAppCopy>["app"]): string {
  return app.composer.milestones.rule
}

function lastCheckReason(a: Agreement, milestoneId: string): string {
  return a.history.find((e) => e.type === "check_failed" && e.milestoneId === milestoneId)?.note ?? ""
}

function SubmitDialog({
  open,
  milestone,
  initialLink,
  onClose,
  onSubmit,
}: {
  open: boolean
  milestone: Milestone
  initialLink: string
  onClose: () => void
  onSubmit: (link: string, note: string) => void
}) {
  const { app } = useAppCopy()
  const s = app.agreement.submitDialog
  const [link, setLink] = useState(initialLink)
  const [note, setNote] = useState("")
  const [error, setError] = useState(false)
  const id = `sub-${milestone.id}`
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent closeLabel={app.close} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">{t(s.title, { milestone: milestone.title })}</DialogTitle>
          <DialogDescription>{s.body}</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!/^https:\/\/\S+\.\S+/.test(link.trim())) {
              setError(true)
              return
            }
            onSubmit(link.trim(), note.trim())
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-link`}>{s.link}</Label>
            <Input
              id={`${id}-link`}
              type="url"
              inputMode="url"
              value={link}
              placeholder={s.linkPh}
              aria-invalid={error || undefined}
              aria-describedby={error ? `${id}-err` : undefined}
              onChange={(e) => {
                setLink(e.target.value)
                setError(false)
              }}
            />
            {error ? (
              <p id={`${id}-err`} className="text-sm text-destructive">
                {s.errLink}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-note`}>{s.note}</Label>
            <Textarea id={`${id}-note`} value={note} placeholder={s.notePh} onChange={(e) => setNote(e.target.value)} className="bg-card" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {s.cancel}
            </Button>
            <Button type="submit">
              <SendIcon aria-hidden="true" />
              {s.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ChangesDialog({ open, milestone, onClose, onSubmit }: { open: boolean; milestone: Milestone; onClose: () => void; onSubmit: (note: string) => void }) {
  const { app } = useAppCopy()
  const s = app.agreement.changesDialog
  const [note, setNote] = useState("")
  const [error, setError] = useState(false)
  const id = `chg-${milestone.id}`
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent closeLabel={app.close} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">{t(s.title, { milestone: milestone.title })}</DialogTitle>
          <DialogDescription>{s.body}</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (note.trim().length < 10) {
              setError(true)
              return
            }
            onSubmit(note.trim())
            setNote("")
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-note`}>{s.note}</Label>
            <Textarea
              id={`${id}-note`}
              value={note}
              placeholder={s.notePh}
              aria-invalid={error || undefined}
              aria-describedby={error ? `${id}-err` : undefined}
              onChange={(e) => {
                setNote(e.target.value)
                setError(false)
              }}
              className="min-h-24 bg-card"
            />
            {error ? (
              <p id={`${id}-err`} className="text-sm text-destructive">
                {s.errNote}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {s.cancel}
            </Button>
            <Button type="submit">{s.send}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
