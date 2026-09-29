import { addDaysIso, splitByBps } from "./agreements"
import { seededAddress, seededHash } from "./ids"
import { units } from "./tokens"
import type { Agreement, AgreementKind, DemoState, HistoryEvent, Milestone, MilestoneStatus, Party, Rule, TokenSymbol } from "./types"

/** Localized text for the seeded examples (names of people stay as they are). */
export interface SeedCopy {
  docsGuild: string
  commons: string
  workshopClub: string
  carpenter: string
  agreements: {
    wiki: { title: string; summary: string; milestones: [string, string][]; check: string }
    docs: { title: string; summary: string; milestones: [string, string][]; check: string; checkFail: string; changesNote: string; evidence: string }
    workshops: { title: string; summary: string; milestones: [string, string][] }
    shed: { title: string; summary: string; milestones: [string, string][] }
  }
}

/** The visitor's demo wallet. */
export const YOU: Party = { name: "Camille Roy", address: "0x4C1d7a93F0b25e6D8c11A4e07B3f9C52d8a6e82B" }

const person = (name: string): Party => ({ name, address: seededAddress(name) })

const LEA = person("Léa Tremblay")
const INES = person("Inès Ferreira")
const KARIM = person("Karim Haddad")
const SAMUEL = person("Samuel Okafor")
const JULIE = person("Julie Gagnon")

const daysAgo = (d: number, hour = 14) => {
  const t = new Date()
  t.setDate(t.getDate() - d)
  t.setHours(hour, (d * 17) % 60, 0, 0)
  return t.toISOString()
}

interface MsSpec {
  bps: number
  deadline: number
  rule: Rule
  status: MilestoneStatus
  approvals?: Party[]
  releasedDaysAgo?: number
  submittedDaysAgo?: number
  link?: string
  note?: string
  changesNote?: string
}

function build(
  id: string,
  kind: AgreementKind,
  copy: { title: string; summary: string; milestones: [string, string][] },
  token: TokenSymbol,
  total: number,
  funder: Party,
  builder: Party,
  createdDaysAgo: number,
  specs: MsSpec[]
): Agreement {
  const totalUnits = BigInt(units(total, token))
  const amounts = splitByBps(totalUnits, specs.map((s) => s.bps))
  const history: HistoryEvent[] = [
    { id: `${id}-ev-lock`, at: daysAgo(createdDaysAgo, 10), type: "locked", actor: funder.name, amount: totalUnits.toString(), hash: seededHash(`${id}-lock`) },
  ]
  const milestones: Milestone[] = specs.map((s, i) => {
    const mid = `${id}-m${i + 1}`
    const [title = "", deliverable = ""] = copy.milestones[i] ?? []
    const m: Milestone = {
      id: mid,
      title,
      deliverable,
      deadline: addDaysIso(s.deadline),
      bps: s.bps,
      amount: (amounts[i] ?? 0n).toString(),
      rule: s.rule,
      status: s.status,
      approvals: (s.approvals ?? []).map((p) => p.address),
    }
    if (s.submittedDaysAgo !== undefined) {
      m.submission = { link: s.link ?? "", note: s.note ?? "", at: daysAgo(s.submittedDaysAgo, 11) }
      history.push({ id: `${mid}-sub`, at: m.submission.at, type: "submitted", actor: builder.name, milestoneId: mid, hash: seededHash(`${mid}-sub`), note: s.link })
    }
    if (s.changesNote) {
      m.changesNote = s.changesNote
      const at = daysAgo((s.submittedDaysAgo ?? 3) - 1, 16)
      history.push({ id: `${mid}-chg`, at, type: "changes", actor: funder.name, milestoneId: mid, hash: seededHash(`${mid}-chg`), note: s.changesNote })
    }
    ;(s.approvals ?? []).forEach((p, k) => {
      const at = daysAgo((s.releasedDaysAgo ?? s.submittedDaysAgo ?? 1) + (s.approvals!.length - 1 - k) * 0.2, 15 + k)
      history.push({ id: `${mid}-ap${k}`, at, type: "approved", actor: p.name, milestoneId: mid, hash: seededHash(`${mid}-ap${k}`) })
    })
    if (s.status === "released" && s.releasedDaysAgo !== undefined) {
      m.releasedAt = daysAgo(s.releasedDaysAgo, 17)
      m.releaseHash = seededHash(`${mid}-rel`)
      if (s.rule.kind === "funder") {
        history.push({ id: `${mid}-apf`, at: daysAgo(s.releasedDaysAgo, 16), type: "approved", actor: funder.name, milestoneId: mid, hash: m.releaseHash })
      }
      history.push({ id: `${mid}-rel`, at: m.releasedAt, type: "released", actor: builder.name, milestoneId: mid, amount: m.amount, hash: m.releaseHash })
    }
    return m
  })
  history.sort((a, b) => b.at.localeCompare(a.at))
  const done = milestones.every((m) => m.status === "released")
  return {
    id,
    kind,
    title: copy.title,
    summary: copy.summary,
    token,
    total: totalUnits.toString(),
    address: seededAddress(`contract-${id}`),
    funder,
    builder,
    milestones,
    status: done ? "completed" : "active",
    createdAt: daysAgo(createdDaysAgo, 10),
    history,
  }
}

/** Believable starting data, created in the visitor's language on first load and on "Reset demo". */
export function createSeed(copy: SeedCopy, _locale: "en" | "fr"): DemoState {
  void _locale
  const a = copy.agreements
  const docsGuild = person(copy.docsGuild)
  const commons = person(copy.commons)
  const club = person(copy.workshopClub)
  const carpenter = person(copy.carpenter)
  const panel: Rule = { kind: "reviewers", threshold: 2, reviewers: [YOU, INES, KARIM] }
  const shedPanel: Rule = { kind: "reviewers", threshold: 2, reviewers: [YOU, SAMUEL, JULIE] }

  const wiki = build("wiki-offline", "grant", a.wiki, "tUSDC", 6000, YOU, LEA, 38, [
    { bps: 1500, deadline: -29, rule: panel, status: "released", approvals: [KARIM, YOU], submittedDaysAgo: 32, releasedDaysAgo: 30, link: "https://github.com/monark-community/app/discussions/318" },
    { bps: 3500, deadline: 3, rule: panel, status: "submitted", approvals: [KARIM], submittedDaysAgo: 1, link: "https://github.com/monark-community/app/pull/402", note: "Sync engine merged behind the wiki.offline flag; test plan in the PR." },
    { bps: 3000, deadline: 24, rule: panel, status: "locked" },
    { bps: 2000, deadline: 45, rule: { kind: "check", condition: a.wiki.check }, status: "locked" },
  ])

  const docs = build("docs-fr", "bounty", a.docs, "tUSDC", 900, docsGuild, YOU, 21, [
    { bps: 2000, deadline: -12, rule: { kind: "funder" }, status: "released", submittedDaysAgo: 15, releasedDaysAgo: 14, link: "https://github.com/monark-community/docs/pull/398" },
    { bps: 4000, deadline: 5, rule: { kind: "funder" }, status: "changes", submittedDaysAgo: 3, link: a.docs.evidence, changesNote: a.docs.changesNote },
    { bps: 4000, deadline: 20, rule: { kind: "check", condition: a.docs.check, failFirst: a.docs.checkFail }, status: "locked" },
  ])

  const workshops = build("workshops", "grant", a.workshops, "tDAI", 3000, YOU, club, 45, [
    { bps: 3000, deadline: -24, rule: { kind: "funder" }, status: "released", submittedDaysAgo: 25, releasedDaysAgo: 23, link: "https://concordia-blockchain.club/workshops/1-recap" },
    { bps: 3500, deadline: -4, rule: { kind: "funder" }, status: "locked" },
    { bps: 3500, deadline: 25, rule: { kind: "funder" }, status: "locked" },
  ])

  const shed = build("tool-shed", "contract", a.shed, "tDAI", 4800, commons, carpenter, 70, [
    { bps: 4000, deadline: -55, rule: shedPanel, status: "released", approvals: [SAMUEL, YOU], submittedDaysAgo: 57, releasedDaysAgo: 56, link: "https://photos.milestonemint.demo/shed/frame" },
    { bps: 4000, deadline: -34, rule: shedPanel, status: "released", approvals: [JULIE, YOU], submittedDaysAgo: 36, releasedDaysAgo: 35, link: "https://photos.milestonemint.demo/shed/roof" },
    { bps: 2000, deadline: -20, rule: shedPanel, status: "released", approvals: [SAMUEL, JULIE], submittedDaysAgo: 22, releasedDaysAgo: 21, link: "https://photos.milestonemint.demo/shed/handover" },
  ])

  return {
    version: 1,
    wallet: { status: "disconnected", address: YOU.address, name: YOU.name, lastError: null },
    balances: { tUSDC: units(24500, "tUSDC"), tDAI: units(7250, "tDAI"), tETH: units(3.4, "tETH") },
    agreements: [wiki, docs, workshops, shed],
    settings: { slow: false, failNext: false },
  }
}
