"use client"

import { FULL_BPS, splitByBps, threshold } from "./agreements"
import { randomAddress, randomId } from "./ids"
import { update } from "./store"
import type {
  Agreement,
  AgreementKind,
  DemoState,
  HistoryEvent,
  HistoryType,
  Milestone,
  Party,
  Rule,
  Submission,
  TokenSymbol,
} from "./types"

/**
 * State transitions, one per contract function. Each runs only after its
 * simulated transaction has confirmed (see useTx in chain.ts).
 */

const nowIso = () => new Date().toISOString()

/** History actor for the automatic check; the UI shows a localized name. */
export const ORACLE_ACTOR = "@oracle"

function event(type: HistoryType, actor: string, extra: Partial<HistoryEvent> = {}): HistoryEvent {
  return { id: randomId("ev"), at: nowIso(), type, actor, ...extra }
}

function withAgreement(id: string, fn: (a: Agreement, s: DemoState) => { agreement: Agreement; balances?: DemoState["balances"] }) {
  update((s) => {
    const current = s.agreements.find((a) => a.id === id)
    if (!current) return s
    const { agreement, balances } = fn(current, s)
    return {
      ...s,
      balances: balances ?? s.balances,
      agreements: s.agreements.map((a) => (a.id === id ? agreement : a)),
    }
  })
}

function patchMilestone(a: Agreement, milestoneId: string, fn: (m: Milestone) => Milestone): Agreement {
  return { ...a, milestones: a.milestones.map((m) => (m.id === milestoneId ? fn(m) : m)) }
}

function settle(a: Agreement): Agreement {
  if (a.status === "active" && a.milestones.every((m) => m.status === "released")) return { ...a, status: "completed" }
  return a
}

function credit(s: DemoState, to: Party, token: TokenSymbol, amount: bigint): DemoState["balances"] {
  if (to.address.toLowerCase() !== s.wallet.address.toLowerCase()) return s.balances
  return { ...s.balances, [token]: (BigInt(s.balances[token]) + amount).toString() }
}

/* ------------------------------------------------------------------ create */

export interface MilestoneDraft {
  title: string
  deliverable: string
  deadline: string
  bps: number
  rule: Rule
}

export interface AgreementDraft {
  kind: AgreementKind
  title: string
  summary: string
  token: TokenSymbol
  total: bigint
  builder: Party
  milestones: MilestoneDraft[]
}

/** lockFunds(): deploys the agreement and moves the whole budget from the funder into escrow. Returns the new id. */
export function lockAgreement(draft: AgreementDraft, hash: string): string {
  const id = randomId("ag")
  update((s) => {
    const funder: Party = { name: s.wallet.name, address: s.wallet.address }
    const amounts = splitByBps(draft.total, draft.milestones.map((m) => m.bps))
    const agreement: Agreement = {
      id,
      kind: draft.kind,
      title: draft.title,
      summary: draft.summary,
      token: draft.token,
      total: draft.total.toString(),
      address: randomAddress(),
      funder,
      builder: draft.builder,
      status: "active",
      createdAt: nowIso(),
      milestones: draft.milestones.map((m, i) => ({
        id: randomId("ms"),
        title: m.title,
        deliverable: m.deliverable,
        deadline: m.deadline,
        bps: m.bps,
        amount: (amounts[i] ?? 0n).toString(),
        rule: m.rule,
        status: "locked",
        approvals: [],
      })),
      history: [event("locked", funder.name, { amount: draft.total.toString(), hash })],
    }
    return {
      ...s,
      balances: { ...s.balances, [draft.token]: (BigInt(s.balances[draft.token]) - draft.total).toString() },
      agreements: [agreement, ...s.agreements],
    }
  })
  return id
}

export function sumBps(milestones: { bps: number }[]): number {
  return milestones.reduce((a, m) => a + m.bps, 0)
}

export const isFullyAllocated = (milestones: { bps: number }[]) => sumBps(milestones) === FULL_BPS

/* ------------------------------------------------------------------ builder */

/** submit(): the builder marks a milestone delivered, with evidence. Clears any earlier signatures. */
export function submitMilestone(agreementId: string, milestoneId: string, submission: Omit<Submission, "at">, actor: string, hash: string) {
  withAgreement(agreementId, (a) => ({
    agreement: {
      ...patchMilestone(a, milestoneId, (m) => ({
        ...m,
        status: "submitted",
        approvals: [],
        changesNote: undefined,
        submission: { ...submission, at: nowIso() },
      })),
      history: [event("submitted", actor, { milestoneId, hash, note: submission.link }), ...a.history],
    },
  }))
}

/* ------------------------------------------------------------------ validators */

/**
 * approve(): one signature. When the milestone's rule is satisfied, the same
 * transaction releases its share to the builder.
 */
export function approveMilestone(agreementId: string, milestoneId: string, signer: Party, hash: string) {
  withAgreement(agreementId, (a, s) => {
    const m = a.milestones.find((x) => x.id === milestoneId)
    if (!m || m.status !== "submitted") return { agreement: a }
    const approvals = m.approvals.some((x) => x.toLowerCase() === signer.address.toLowerCase())
      ? m.approvals
      : [...m.approvals, signer.address]
    const releases = approvals.length >= threshold(m)
    const history = [event("approved", signer.name, { milestoneId, hash }), ...a.history]
    if (!releases) {
      return { agreement: { ...patchMilestone(a, milestoneId, (x) => ({ ...x, approvals })), history } }
    }
    const released = patchMilestone(a, milestoneId, (x) => ({
      ...x,
      approvals,
      status: "released",
      releasedAt: nowIso(),
      releaseHash: hash,
    }))
    return {
      agreement: settle({
        ...released,
        history: [event("released", a.builder.name, { milestoneId, hash, amount: m.amount }), ...history],
      }),
      balances: credit(s, a.builder, a.token, BigInt(m.amount)),
    }
  })
}

/** requestChanges(): sends the milestone back. The share stays locked. */
export function requestChanges(agreementId: string, milestoneId: string, note: string, actor: string, hash: string) {
  withAgreement(agreementId, (a) => ({
    agreement: {
      ...patchMilestone(a, milestoneId, (m) => ({ ...m, status: "changes", approvals: [], changesNote: note })),
      history: [event("changes", actor, { milestoneId, hash, note }), ...a.history],
    },
  }))
}

/** The oracle's answer to checkAndRelease(): met releases the share, not met leaves it locked. */
export function checkWillPass(a: Agreement, milestoneId: string): boolean {
  const m = a.milestones.find((x) => x.id === milestoneId)
  return !(m?.rule.kind === "check" && m.rule.failFirst)
}

export function releaseByCheck(agreementId: string, milestoneId: string, hash: string) {
  withAgreement(agreementId, (a, s) => {
    const m = a.milestones.find((x) => x.id === milestoneId)
    if (!m || m.status !== "submitted") return { agreement: a }
    const released = patchMilestone(a, milestoneId, (x) => ({ ...x, status: "released", releasedAt: nowIso(), releaseHash: hash }))
    return {
      agreement: settle({
        ...released,
        history: [
          event("released", a.builder.name, { milestoneId, hash, amount: m.amount }),
          event("approved", ORACLE_ACTOR, { milestoneId, hash }),
          ...a.history,
        ],
      }),
      balances: credit(s, a.builder, a.token, BigInt(m.amount)),
    }
  })
}

export function recordCheckFailed(agreementId: string, milestoneId: string, reason: string, hash: string) {
  withAgreement(agreementId, (a) => ({
    agreement: {
      // The simulated oracle only says "not met" once; the next run passes.
      ...patchMilestone(a, milestoneId, (m) => (m.rule.kind === "check" ? { ...m, rule: { ...m.rule, failFirst: undefined } } : m)),
      history: [event("check_failed", ORACLE_ACTOR, { milestoneId, hash, note: reason }), ...a.history],
    },
  }))
}

/* ------------------------------------------------------------------ funder */

/** Off-chain reminder: recorded in the history, no transaction. */
export function sendReminder(agreementId: string, milestoneId: string, actor: string) {
  withAgreement(agreementId, (a) => ({
    agreement: { ...a, history: [event("reminder", actor, { milestoneId }), ...a.history] },
  }))
}

export function refundableAmount(a: Agreement): bigint {
  return a.milestones.filter((m) => m.status !== "released" && m.status !== "refunded").reduce((t, m) => t + BigInt(m.amount), 0n)
}

/** cancel(): every milestone not yet released goes back to the funder. Released shares are never clawed back. */
export function cancelAndRefund(agreementId: string, actor: string, hash: string) {
  withAgreement(agreementId, (a, s) => {
    const amount = refundableAmount(a)
    return {
      agreement: {
        ...a,
        status: "cancelled",
        milestones: a.milestones.map((m) => (m.status === "released" ? m : { ...m, status: "refunded", approvals: [] })),
        history: [event("refunded", actor, { hash, amount: amount.toString() }), ...a.history],
      },
      balances: credit(s, a.funder, a.token, amount),
    }
  })
}
