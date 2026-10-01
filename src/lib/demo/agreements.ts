import { usdValue } from "./tokens"
import type { Agreement, DemoState, Milestone, Party, Role } from "./types"

/**
 * Pure read-side helpers: what a contract's view functions would return.
 * No state is changed here.
 */

export const FULL_BPS = 10_000

/** Divide a total by basis-point shares. Rounding leftovers go to the last milestone, so the parts always add up. */
export function splitByBps(total: bigint, bps: number[]): bigint[] {
  const parts = bps.map((b) => (total * BigInt(b)) / BigInt(FULL_BPS))
  const sum = parts.reduce((a, b) => a + b, 0n)
  if (parts.length) parts[parts.length - 1] = (parts[parts.length - 1] ?? 0n) + (total - sum)
  return parts
}

/** Today as yyyy-mm-dd in local time. */
export function todayIso(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function addDaysIso(days: number, now = new Date()): string {
  const d = new Date(now)
  d.setDate(d.getDate() + days)
  return todayIso(d)
}

/** Whole days from today to the deadline (negative when past). */
export function daysUntil(deadline: string, now = new Date()): number {
  const [y, m, d] = deadline.split("-").map(Number)
  const due = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((due.getTime() - today.getTime()) / 86_400_000)
}

export function isOpen(m: Milestone): boolean {
  return m.status !== "released" && m.status !== "refunded"
}

/** Not yet delivered and past its deadline (a submission under review is never overdue). */
export function isOverdue(m: Milestone, now = new Date()): boolean {
  return (m.status === "locked" || m.status === "changes") && daysUntil(m.deadline, now) < 0
}

export function threshold(m: Milestone): number {
  return m.rule.kind === "reviewers" ? m.rule.threshold : 1
}

/** Everyone who may sign this milestone off (the check rule has no human signer). */
export function signers(a: Agreement, m: Milestone): Party[] {
  if (m.rule.kind === "funder") return [a.funder]
  if (m.rule.kind === "reviewers") return m.rule.reviewers
  return []
}

export function rolesOf(a: Agreement, address: string): Role[] {
  const me = address.toLowerCase()
  const roles: Role[] = []
  if (a.funder.address.toLowerCase() === me) roles.push("funder")
  if (a.builder.address.toLowerCase() === me) roles.push("builder")
  if (a.milestones.some((m) => m.rule.kind === "reviewers" && m.rule.reviewers.some((r) => r.address.toLowerCase() === me))) {
    roles.push("reviewer")
  }
  return roles
}

export function primaryRole(a: Agreement, address: string): Role {
  return rolesOf(a, address)[0] ?? "funder"
}

export interface Totals {
  locked: bigint
  inReview: bigint
  released: bigint
  refunded: bigint
}

export function totalsOf(a: Agreement): Totals {
  const t: Totals = { locked: 0n, inReview: 0n, released: 0n, refunded: 0n }
  for (const m of a.milestones) {
    const v = BigInt(m.amount)
    if (m.status === "released") t.released += v
    else if (m.status === "refunded") t.refunded += v
    else {
      t.locked += v
      if (m.status === "submitted") t.inReview += v
    }
  }
  return t
}

export function currentMilestone(a: Agreement): Milestone | undefined {
  return a.milestones.find(isOpen)
}

export type AttentionKind = "review" | "sign" | "check" | "changes" | "overdue" | "dueSoon"

export interface AttentionItem {
  kind: AttentionKind
  agreement: Agreement
  milestone: Milestone
  role: Role
}

/** What is waiting on the connected wallet, most urgent first. */
export function attentionFor(state: DemoState, now = new Date()): AttentionItem[] {
  const me = state.wallet.address.toLowerCase()
  const items: AttentionItem[] = []
  for (const a of state.agreements) {
    if (a.status !== "active") continue
    const isFunder = a.funder.address.toLowerCase() === me
    const isBuilder = a.builder.address.toLowerCase() === me
    for (const m of a.milestones) {
      if (m.status === "submitted") {
        if (m.rule.kind === "funder" && isFunder) items.push({ kind: "review", agreement: a, milestone: m, role: "funder" })
        if (
          m.rule.kind === "reviewers" &&
          m.rule.reviewers.some((r) => r.address.toLowerCase() === me) &&
          !m.approvals.some((x) => x.toLowerCase() === me)
        ) {
          items.push({ kind: "sign", agreement: a, milestone: m, role: "reviewer" })
        }
        if (m.rule.kind === "check" && (isFunder || isBuilder)) {
          items.push({ kind: "check", agreement: a, milestone: m, role: isBuilder ? "builder" : "funder" })
        }
      }
      if (m.status === "changes" && isBuilder) items.push({ kind: "changes", agreement: a, milestone: m, role: "builder" })
      if (isOverdue(m, now) && isFunder) items.push({ kind: "overdue", agreement: a, milestone: m, role: "funder" })
      if (m.status === "locked" && isBuilder && !isOverdue(m, now) && daysUntil(m.deadline, now) <= 7) {
        items.push({ kind: "dueSoon", agreement: a, milestone: m, role: "builder" })
      }
    }
  }
  const order: AttentionKind[] = ["overdue", "sign", "review", "check", "changes", "dueSoon"]
  return items.sort((x, y) => order.indexOf(x.kind) - order.indexOf(y.kind))
}

/** Dashboard summary in USD-equivalent (reference prices), across every agreement you are part of. */
export function portfolio(state: DemoState, now = new Date()) {
  let locked = 0
  let released = 0
  let overdue = 0
  for (const a of state.agreements) {
    if (rolesOf(a, state.wallet.address).length === 0) continue
    const t = totalsOf(a)
    locked += usdValue(t.locked, a.token)
    released += usdValue(t.released, a.token)
    overdue += a.milestones.filter((m) => isOverdue(m, now)).length
  }
  return { locked, released, overdue, waiting: attentionFor(state, now).length }
}
