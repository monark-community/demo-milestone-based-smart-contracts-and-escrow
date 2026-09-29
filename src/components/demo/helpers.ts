import type { Segment, SegmentState } from "@/components/diagrams/budget-track"
import type { Dictionary } from "@/i18n"
import { t } from "@/i18n/t"
import { isOverdue } from "@/lib/demo/agreements"
import type { Agreement, Milestone, Rule } from "@/lib/demo/types"

export function segmentState(m: Milestone, now = new Date()): SegmentState {
  if (m.status === "released") return "released"
  if (m.status === "refunded") return "refunded"
  if (m.status === "submitted") return "review"
  if (isOverdue(m, now)) return "overdue"
  return m.status === "changes" ? "changes" : "locked"
}

export function segmentsOf(a: Agreement, now = new Date()): Segment[] {
  return a.milestones.map((m) => ({ id: m.id, bps: m.bps, state: segmentState(m, now), label: m.title }))
}

export type StatusKey = keyof Dictionary["app"]["msStatus"]

export function statusKey(m: Milestone, now = new Date()): StatusKey {
  return isOverdue(m, now) ? "overdue" : m.status
}

export function ruleLabel(rule: Rule, copy: Dictionary["app"]["rules"]): string {
  if (rule.kind === "funder") return copy.funder
  if (rule.kind === "reviewers") return t(copy.reviewers, { k: rule.threshold, n: rule.reviewers.length })
  return copy.check
}

/** "Released 3 of 4 · 15%, 35%…" style accessible summary of the budget bar. */
export function trackLabel(a: Agreement, app: Dictionary["app"], now = new Date()): string {
  const parts = a.milestones.map((m) => `${m.title}: ${(m.bps / 100).toLocaleString()}%, ${app.msStatus[statusKey(m, now)]}`)
  return `${app.track.label}. ${parts.join("; ")}`
}
