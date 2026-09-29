"use client"

import { ArrowLeftIcon, LockIcon, PlusIcon, Trash2Icon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type ReactNode } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { addDaysIso, FULL_BPS, splitByBps, todayIso } from "@/lib/demo/agreements"
import { useTx } from "@/lib/demo/chain"
import { isAddress, randomId, seededAddress } from "@/lib/demo/ids"
import { lockAgreement, type AgreementDraft } from "@/lib/demo/ops"
import { YOU } from "@/lib/demo/seed"
import { useDemo } from "@/lib/demo/store"
import { parseUnits, TOKEN_LIST, TOKENS } from "@/lib/demo/tokens"
import type { AgreementKind, Party, Rule, TokenSymbol } from "@/lib/demo/types"
import { formatPercent, formatToken } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"
import { Disclaimer } from "./disclaimer"
import { TxFeedback } from "./tx-feedback"

type RuleKind = Rule["kind"]

interface MsForm {
  key: string
  title: string
  deliverable: string
  deadline: string
  share: string
  rule: RuleKind
  threshold: number
  reviewers: Party[]
  condition: string
}

interface Form {
  kind: AgreementKind
  title: string
  summary: string
  builderName: string
  builderAddress: string
  token: TokenSymbol
  budget: string
  milestones: MsForm[]
}

const INES: Party = { name: "Inès Ferreira", address: seededAddress("Inès Ferreira") }
const KARIM: Party = { name: "Karim Haddad", address: seededAddress("Karim Haddad") }

function ms(partial: Partial<MsForm> = {}): MsForm {
  return {
    key: randomId("f"),
    title: "",
    deliverable: "",
    deadline: addDaysIso(30),
    share: "100",
    rule: "funder",
    threshold: 2,
    reviewers: [{ ...YOU }, { ...INES }, { ...KARIM }],
    condition: "",
    ...partial,
  }
}

type Template = "grant" | "bounty" | "contract" | "blank"

export function Composer() {
  const demo = useDemo()
  const router = useRouter()
  const { app, locale, disclaimer } = useAppCopy()
  const c = app.composer
  const tx = useTx()
  const [template, setTemplate] = useState<Template>("grant")
  const [form, setForm] = useState<Form>(() => fromTemplate("grant"))
  const [showErrors, setShowErrors] = useState(false)

  function fromTemplate(tpl: Template): Form {
    const p = c.presets
    if (tpl === "grant") {
      const shares = ["20", "45", "35"]
      const days = [14, 35, 60]
      return {
        kind: "grant",
        title: p.grant.title,
        summary: p.grant.summary,
        builderName: p.grant.builder,
        builderAddress: seededAddress(p.grant.builder),
        token: "tUSDC",
        budget: "4500",
        milestones: p.grant.milestones.map(([title, deliverable], i) =>
          ms({
            title,
            deliverable,
            share: shares[i] ?? "0",
            deadline: addDaysIso(days[i] ?? 30),
            rule: i === p.grant.milestones.length - 1 ? "check" : "reviewers",
            condition: i === p.grant.milestones.length - 1 ? p.grant.check : "",
          })
        ),
      }
    }
    if (tpl === "bounty") {
      return {
        kind: "bounty",
        title: p.bounty.title,
        summary: p.bounty.summary,
        builderName: p.bounty.builder,
        builderAddress: seededAddress(p.bounty.builder),
        token: "tUSDC",
        budget: "600",
        milestones: p.bounty.milestones.map(([title, deliverable]) => ms({ title, deliverable, share: "100", deadline: addDaysIso(21), rule: "check", condition: p.bounty.check })),
      }
    }
    if (tpl === "contract") {
      const shares = ["40", "40", "20"]
      const days = [10, 24, 38]
      return {
        kind: "contract",
        title: p.contract.title,
        summary: p.contract.summary,
        builderName: p.contract.builder,
        builderAddress: seededAddress(p.contract.builder),
        token: "tDAI",
        budget: "7200",
        milestones: p.contract.milestones.map(([title, deliverable], i) => ms({ title, deliverable, share: shares[i] ?? "0", deadline: addDaysIso(days[i] ?? 30) })),
      }
    }
    return { kind: "grant", title: "", summary: "", builderName: "", builderAddress: "", token: "tUSDC", budget: "", milestones: [ms()] }
  }

  if (!demo) return null

  const decimals = TOKENS[form.token].decimals
  const total = parseUnits(form.budget, decimals)
  const balance = BigInt(demo.balances[form.token])
  const shares = form.milestones.map((m) => Math.round(Number(m.share.replace(",", ".")) * 100))
  const bpsTotal = shares.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0)
  const amounts = total && total > 0n && bpsTotal === FULL_BPS ? splitByBps(total, shares) : null

  /* ------------------------------------------------------------ validation */
  const errors: Record<string, string> = {}
  const e = c.errors
  if (!form.title.trim()) errors.title = e.title
  if (!form.builderName.trim()) errors.builderName = e.builderName
  if (!isAddress(form.builderAddress)) errors.builderAddress = e.address
  else if (form.builderAddress.toLowerCase() === demo.wallet.address.toLowerCase()) errors.builderAddress = e.ownAddress
  if (!total || total <= 0n) errors.budget = e.budget
  else if (total > balance) errors.budget = t(e.balance, { amount: formatToken(balance, form.token, locale) })
  const today = todayIso()
  form.milestones.forEach((m, i) => {
    if (!m.title.trim()) errors[`${m.key}-title`] = e.msTitle
    if (!m.deadline || m.deadline <= today) errors[`${m.key}-deadline`] = e.deadline
    else if (i > 0 && form.milestones[i - 1]?.deadline && m.deadline < (form.milestones[i - 1]?.deadline ?? "")) errors[`${m.key}-deadline`] = e.order
    const s = shares[i] ?? 0
    if (!Number.isFinite(s) || s < 100 || s > FULL_BPS) errors[`${m.key}-share`] = e.share
    if (m.rule === "reviewers") {
      const valid = m.reviewers.filter((r) => r.name.trim() && isAddress(r.address))
      if (valid.length < m.threshold || valid.length !== m.reviewers.length) errors[`${m.key}-reviewers`] = t(e.reviewers, { n: m.threshold })
    }
    if (m.rule === "check" && m.condition.trim().length < 6) errors[`${m.key}-condition`] = e.condition
  })
  if (bpsTotal !== FULL_BPS) errors.total = t(e.total, { pct: formatPercent(bpsTotal / FULL_BPS, locale) })
  const valid = Object.keys(errors).length === 0
  const err = (k: string) => (showErrors ? errors[k] : undefined)

  const setField = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))
  const setMs = (key: string, patch: Partial<MsForm>) =>
    setForm((f) => ({ ...f, milestones: f.milestones.map((m) => (m.key === key ? { ...m, ...patch } : m)) }))

  async function submit() {
    if (!valid || !total || !demo) {
      setShowErrors(true)
      const first = document.querySelector<HTMLElement>("[aria-invalid='true']")
      first?.focus()
      return
    }
    const draft: AgreementDraft = {
      kind: form.kind,
      title: form.title.trim(),
      summary: form.summary.trim(),
      token: form.token,
      total,
      builder: { name: form.builderName.trim(), address: form.builderAddress.trim() },
      milestones: form.milestones.map((m, i) => ({
        title: m.title.trim(),
        deliverable: m.deliverable.trim(),
        deadline: m.deadline,
        bps: shares[i] ?? 0,
        rule:
          m.rule === "funder"
            ? { kind: "funder" }
            : m.rule === "reviewers"
              ? { kind: "reviewers", threshold: m.threshold, reviewers: m.reviewers.map((r) => ({ name: r.name.trim(), address: r.address.trim() })) }
              : { kind: "check", condition: m.condition.trim() },
      })),
    }
    let newId = ""
    const ok = await tx.run(
      {
        title: app.summaries.lock,
        rows: [
          { label: app.summaries.rows.agreement, value: draft.title },
          { label: app.summaries.rows.to, value: draft.builder.name },
          { label: app.summaries.rows.budget, value: formatToken(total, form.token, locale) },
        ],
        movesValue: true,
      },
      (hash) => {
        newId = lockAgreement(draft, hash)
      }
    )
    if (ok && newId) {
      toast.success(app.toasts.locked)
      router.push(href(locale, `/app/agreement/${newId}`))
    }
  }

  const lockLabel = t(c.review.lock, { amount: total && total > 0n ? formatToken(total, form.token, locale) : form.token })

  return (
    <div className="flex flex-col gap-6">
      <Link href={href(locale, "/app")} className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        {c.back}
      </Link>
      <div>
        <h1 className="text-3xl font-extrabold tracking-display sm:text-4xl">{c.title}</h1>
        <p className="mt-2 max-w-[60ch] text-muted-foreground">{c.intro}</p>
      </div>

      <div role="group" aria-label={c.templates.title} className="flex flex-col gap-2">
        <p className="text-sm font-bold">{c.templates.title}</p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {(["grant", "bounty", "contract", "blank"] as const).map((tpl) => (
            <button
              key={tpl}
              type="button"
              aria-pressed={template === tpl}
              onClick={() => {
                setTemplate(tpl)
                setForm(fromTemplate(tpl))
                setShowErrors(false)
                tx.reset()
              }}
              className={cn(
                "inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-colors duration-150",
                template === tpl ? "border-foreground bg-foreground text-background" : "border-input hover:bg-muted"
              )}
            >
              {c.templates[tpl]}
            </button>
          ))}
        </div>
      </div>

      <form
        noValidate
        onSubmit={(ev) => {
          ev.preventDefault()
          void submit()
        }}
        className="grid gap-6 lg:grid-cols-[1fr_21rem] lg:items-start"
      >
        <div className="flex min-w-0 flex-col gap-6">
          {/* Basics */}
          <fieldset className="rounded-3xl border bg-card p-5 sm:p-6">
            <legend className="float-left mb-4 w-full text-lg font-bold">{c.basics.title}</legend>
            <div className="clear-both grid gap-4 sm:grid-cols-2">
              <Field id="f-title" label={c.basics.name} error={err("title")} className="sm:col-span-2">
                <Input id="f-title" value={form.title} placeholder={c.basics.namePh} onChange={(ev) => setField("title", ev.target.value)} {...invalid(err("title"), "f-title")} />
              </Field>
              <Field id="f-summary" label={c.basics.summary} className="sm:col-span-2">
                <Textarea id="f-summary" value={form.summary} placeholder={c.basics.summaryPh} onChange={(ev) => setField("summary", ev.target.value)} className="min-h-16 bg-card" />
              </Field>
              <Field id="f-builder" label={c.basics.builderName} error={err("builderName")}>
                <Input id="f-builder" value={form.builderName} placeholder={c.basics.builderNamePh} onChange={(ev) => setField("builderName", ev.target.value)} {...invalid(err("builderName"), "f-builder")} />
              </Field>
              <Field id="f-addr" label={c.basics.builderAddress} error={err("builderAddress")}>
                <Input
                  id="f-addr"
                  value={form.builderAddress}
                  placeholder="0x…"
                  spellCheck={false}
                  autoComplete="off"
                  className="font-mono text-sm"
                  onChange={(ev) => setField("builderAddress", ev.target.value)}
                  {...invalid(err("builderAddress"), "f-addr")}
                />
              </Field>
              <Field id="f-token" label={c.basics.token}>
                <div id="f-token" role="radiogroup" aria-label={c.basics.token} className="grid grid-cols-3 gap-1 rounded-full border p-1">
                  {TOKEN_LIST.map((tk) => (
                    <button
                      key={tk}
                      type="button"
                      role="radio"
                      aria-checked={form.token === tk}
                      onClick={() => setField("token", tk)}
                      className={cn(
                        "h-8 rounded-full text-sm font-bold transition-colors",
                        form.token === tk ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tk}
                    </button>
                  ))}
                </div>
              </Field>
              <Field id="f-budget" label={c.basics.budget} error={err("budget")} hint={t(c.basics.balance, { amount: formatToken(balance, form.token, locale) })}>
                <div className="relative">
                  <Input
                    id="f-budget"
                    inputMode="decimal"
                    value={form.budget}
                    onChange={(ev) => setField("budget", ev.target.value)}
                    className="pr-16 font-mono"
                    {...invalid(err("budget"), "f-budget")}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-muted-foreground">{form.token}</span>
                </div>
              </Field>
            </div>
          </fieldset>

          {/* Milestones */}
          <section aria-labelledby="ms-title" className="flex flex-col gap-4">
            <div>
              <h2 id="ms-title" className="text-lg font-bold">
                {c.milestones.title}
              </h2>
              <p className="text-sm text-muted-foreground">{c.milestones.intro}</p>
            </div>

            <Ruler shares={shares} bpsTotal={bpsTotal} error={err("total")} />

            <ol className="flex flex-col gap-4">
              {form.milestones.map((m, i) => (
                <li key={m.key}>
                  <fieldset className="rounded-3xl border bg-card p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <legend className="text-base font-bold">{t(c.milestones.n, { n: i + 1 })}</legend>
                      {form.milestones.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t(c.milestones.remove, { n: i + 1 })}
                          onClick={() => setForm((f) => ({ ...f, milestones: f.milestones.filter((x) => x.key !== m.key) }))}
                        >
                          <Trash2Icon aria-hidden="true" />
                        </Button>
                      ) : null}
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-6">
                      <Field id={`${m.key}-title`} label={c.milestones.titleLabel} error={err(`${m.key}-title`)} className="sm:col-span-6">
                        <Input id={`${m.key}-title`} value={m.title} placeholder={c.milestones.titlePh} onChange={(ev) => setMs(m.key, { title: ev.target.value })} {...invalid(err(`${m.key}-title`), `${m.key}-title`)} />
                      </Field>
                      <Field id={`${m.key}-del`} label={c.milestones.deliverable} className="sm:col-span-6">
                        <Textarea id={`${m.key}-del`} value={m.deliverable} placeholder={c.milestones.deliverablePh} onChange={(ev) => setMs(m.key, { deliverable: ev.target.value })} className="min-h-14 bg-card" />
                      </Field>
                      <Field id={`${m.key}-deadline`} label={c.milestones.deadline} error={err(`${m.key}-deadline`)} className="sm:col-span-3">
                        <Input id={`${m.key}-deadline`} type="date" min={addDaysIso(1)} value={m.deadline} onChange={(ev) => setMs(m.key, { deadline: ev.target.value })} {...invalid(err(`${m.key}-deadline`), `${m.key}-deadline`)} />
                      </Field>
                      <Field id={`${m.key}-share`} label={c.milestones.share} error={err(`${m.key}-share`)} className="sm:col-span-3">
                        <div className="relative">
                          <Input
                            id={`${m.key}-share`}
                            inputMode="decimal"
                            value={m.share}
                            onChange={(ev) => setMs(m.key, { share: ev.target.value })}
                            className="pr-24 font-mono"
                            {...invalid(err(`${m.key}-share`), `${m.key}-share`)}
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-xs text-muted-foreground">
                            {amounts ? formatToken(amounts[i] ?? 0n, form.token, locale) : "%"}
                          </span>
                        </div>
                      </Field>
                      <div className="flex flex-col gap-2 sm:col-span-6">
                        <p id={`${m.key}-rule-l`} className="text-sm font-semibold">
                          {c.milestones.rule}
                        </p>
                        <div role="radiogroup" aria-labelledby={`${m.key}-rule-l`} className="flex flex-col gap-1 rounded-3xl border p-1 sm:flex-row sm:rounded-full">
                          {(["funder", "reviewers", "check"] as const).map((r) => (
                            <button
                              key={r}
                              type="button"
                              role="radio"
                              aria-checked={m.rule === r}
                              onClick={() => setMs(m.key, { rule: r })}
                              className={cn(
                                "h-9 flex-1 rounded-full px-3 text-sm font-bold transition-colors",
                                m.rule === r ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {r === "funder" ? c.milestones.ruleFunder : r === "reviewers" ? c.milestones.ruleReviewers : c.milestones.ruleCheck}
                            </button>
                          ))}
                        </div>
                      </div>
                      {m.rule === "reviewers" ? (
                        <ReviewersEditor
                          m={m}
                          error={err(`${m.key}-reviewers`)}
                          onChange={(patch) => setMs(m.key, patch)}
                        />
                      ) : null}
                      {m.rule === "check" ? (
                        <Field id={`${m.key}-condition`} label={c.milestones.condition} error={err(`${m.key}-condition`)} className="sm:col-span-6">
                          <Input
                            id={`${m.key}-condition`}
                            value={m.condition}
                            placeholder={c.milestones.conditionPh}
                            onChange={(ev) => setMs(m.key, { condition: ev.target.value })}
                            {...invalid(err(`${m.key}-condition`), `${m.key}-condition`)}
                          />
                        </Field>
                      ) : null}
                    </div>
                  </fieldset>
                </li>
              ))}
            </ol>
            <Button
              type="button"
              variant="outline"
              className="self-start"
              disabled={form.milestones.length >= 8}
              onClick={() => {
                const last = form.milestones[form.milestones.length - 1]
                const remaining = Math.max(0, FULL_BPS - bpsTotal)
                setForm((f) => ({
                  ...f,
                  milestones: [...f.milestones, ms({ share: String(remaining / 100), deadline: last ? shiftIso(last.deadline, 21) : addDaysIso(30) })],
                }))
              }}
            >
              <PlusIcon aria-hidden="true" />
              {c.milestones.add}
            </Button>
          </section>
        </div>

        {/* Review */}
        <aside aria-labelledby="review-title" className="flex flex-col gap-4 rounded-3xl border bg-card p-5 lg:sticky lg:top-24">
          <h2 id="review-title" className="text-lg font-bold">
            {c.review.title}
          </h2>
          <dl className="flex flex-col divide-y text-sm">
            <div className="flex justify-between gap-3 py-2">
              <dt className="text-muted-foreground">{c.review.total}</dt>
              <dd className="font-mono font-bold">{total && total > 0n ? formatToken(total, form.token, locale) : "—"}</dd>
            </div>
            <div className="flex justify-between gap-3 py-2">
              <dt className="text-muted-foreground">{c.review.after}</dt>
              <dd className="font-mono">{total && total > 0n && total <= balance ? formatToken(balance - total, form.token, locale) : "—"}</dd>
            </div>
          </dl>
          <div>
            <p className="text-xs font-bold text-muted-foreground">{c.review.each}</p>
            <ol className="mt-2 flex flex-col gap-1.5 text-sm">
              {form.milestones.map((m, i) => (
                <li key={m.key} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">
                    {i + 1}. {m.title || t(c.milestones.n, { n: i + 1 })}
                  </span>
                  <span className="shrink-0 font-mono text-xs">{amounts ? formatToken(amounts[i] ?? 0n, form.token, locale) : "—"}</span>
                </li>
              ))}
            </ol>
          </div>
          <p className="text-xs text-muted-foreground">{c.review.note}</p>
          {showErrors && !valid ? (
            <p role="alert" className="text-sm font-semibold text-destructive">
              {e.summary}
            </p>
          ) : null}
          <Button type="submit" size="lg" disabled={tx.busy}>
            <LockIcon aria-hidden="true" />
            {lockLabel}
          </Button>
          <Disclaimer text={disclaimer} />
          <TxFeedback
            state={tx.state}
            pendingLabel={c.pending}
            failedText={c.failed}
            onRetry={tx.state.phase === "failed" ? () => void submit() : undefined}
            onDismiss={tx.state.phase === "failed" ? tx.reset : undefined}
          />
        </aside>
      </form>
    </div>
  )
}

function shiftIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number)
  return todayIso(new Date(y ?? 2026, (m ?? 1) - 1, (d ?? 1) + days))
}

function invalid(error: string | undefined, id: string) {
  return error ? { "aria-invalid": true as const, "aria-describedby": `${id}-err` } : {}
}

function Field({ id, label, error, hint, className, children }: { id: string; label: string; error?: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-err`} className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

/** The allocation ruler: each milestone's share on one bar, with the unallocated rest hatched. */
function Ruler({ shares, bpsTotal, error }: { shares: number[]; bpsTotal: number; error?: string }) {
  const { app, locale } = useAppCopy()
  const r = app.composer.ruler
  const clean = shares.map((s) => (Number.isFinite(s) && s > 0 ? s : 0))
  const scale = Math.max(bpsTotal, FULL_BPS)
  const ready = bpsTotal === FULL_BPS
  const status = ready
    ? r.ready
    : bpsTotal < FULL_BPS
      ? t(r.unallocated, { pct: formatPercent((FULL_BPS - bpsTotal) / FULL_BPS, locale) })
      : t(r.over, { pct: formatPercent((bpsTotal - FULL_BPS) / FULL_BPS, locale) })
  return (
    <div className="rounded-3xl border bg-card p-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-bold">{r.label}</span>
        <span aria-live="polite" className={cn("font-semibold", ready ? "text-success" : bpsTotal > FULL_BPS ? "text-destructive" : "text-muted-foreground")}>
          {formatPercent(bpsTotal / FULL_BPS, locale)} · {status}
        </span>
      </div>
      <div aria-hidden="true" className="mt-3 flex h-4 w-full gap-1">
        {clean.map((s, i) => (
          <span
            key={i}
            style={{ flexGrow: s, flexBasis: 0 }}
            className={cn("min-w-1 rounded-full transition-[flex-grow] duration-200 ease-out", bpsTotal > FULL_BPS ? "bg-destructive/70" : i % 2 ? "bg-primary/60" : "bg-primary")}
          />
        ))}
        {bpsTotal < FULL_BPS ? (
          <span style={{ flexGrow: scale - bpsTotal, flexBasis: 0 }} className="relative overflow-hidden rounded-full bg-muted text-muted-foreground transition-[flex-grow] duration-200 ease-out">
            <span className="hatch absolute inset-0" />
          </span>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

function ReviewersEditor({ m, error, onChange }: { m: MsForm; error?: string; onChange: (patch: Partial<MsForm>) => void }) {
  const { app } = useAppCopy()
  const c = app.composer.milestones
  const setReviewer = (i: number, patch: Partial<Party>) => onChange({ reviewers: m.reviewers.map((r, j) => (j === i ? { ...r, ...patch } : r)) })
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-muted/50 p-4 sm:col-span-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Label htmlFor={`${m.key}-k`}>{c.threshold}</Label>
        <select
          id={`${m.key}-k`}
          value={m.threshold}
          onChange={(ev) => onChange({ threshold: Number(ev.target.value) })}
          className="h-9 rounded-full border border-input bg-card px-3 text-sm font-semibold"
        >
          {m.reviewers.map((_, i) => (
            <option key={i} value={i + 1}>
              {t(c.thresholdValue, { k: i + 1, n: m.reviewers.length })}
            </option>
          ))}
        </select>
      </div>
      <ul className="flex flex-col gap-3">
        {m.reviewers.map((r, i) => (
          <li key={i} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
            <div className="flex flex-col gap-1">
              <Label htmlFor={`${m.key}-rn-${i}`} className="text-xs">
                {t(c.reviewerName, { n: i + 1 })}
              </Label>
              <Input id={`${m.key}-rn-${i}`} value={r.name} onChange={(ev) => setReviewer(i, { name: ev.target.value })} aria-invalid={error && !r.name.trim() ? true : undefined} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`${m.key}-ra-${i}`} className="text-xs">
                {t(c.reviewerAddress, { n: i + 1 })}
              </Label>
              <Input
                id={`${m.key}-ra-${i}`}
                value={r.address}
                spellCheck={false}
                className="font-mono text-xs"
                onChange={(ev) => setReviewer(i, { address: ev.target.value })}
                aria-invalid={error && !isAddress(r.address) ? true : undefined}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t(c.removeReviewer, { n: i + 1 })}
              disabled={m.reviewers.length <= 1}
              onClick={() => {
                const reviewers = m.reviewers.filter((_, j) => j !== i)
                onChange({ reviewers, threshold: Math.min(m.threshold, reviewers.length) })
              }}
            >
              <Trash2Icon aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={m.reviewers.length >= 7}
        onClick={() => onChange({ reviewers: [...m.reviewers, { name: "", address: "" }] })}
      >
        <PlusIcon aria-hidden="true" />
        {c.addReviewer}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
