/**
 * MilestoneMint's domain model. It mirrors what an escrow contract would
 * store on-chain (amounts in base units as decimal strings), so a wagmi/viem
 * implementation could replace src/lib/demo without touching the UI.
 */

export type TokenSymbol = "tUSDC" | "tDAI" | "tETH"

export interface Token {
  symbol: TokenSymbol
  decimals: number
  usd: number
}

export interface Party {
  name: string
  address: string
}

export type Role = "funder" | "builder" | "reviewer"

export type AgreementKind = "grant" | "bounty" | "contract"

/** Who can approve a milestone. */
export type Rule =
  | { kind: "funder" }
  | { kind: "reviewers"; threshold: number; reviewers: Party[] }
  | { kind: "check"; condition: string; /** Simulation only: the oracle reports "not met" the first time, with this reason. */ failFirst?: string }

export type MilestoneStatus = "locked" | "submitted" | "changes" | "released" | "refunded"

export interface Submission {
  link: string
  note: string
  at: string
}

export interface Milestone {
  id: string
  title: string
  deliverable: string
  /** ISO date (yyyy-mm-dd). */
  deadline: string
  /** Share of the budget in basis points (10,000 = 100%). */
  bps: number
  /** Base units. */
  amount: string
  rule: Rule
  status: MilestoneStatus
  /** Addresses of reviewers who signed the current submission. */
  approvals: string[]
  submission?: Submission
  changesNote?: string
  releasedAt?: string
  releaseHash?: string
}

export type AgreementStatus = "active" | "completed" | "cancelled"

export type HistoryType =
  | "locked"
  | "submitted"
  | "approved"
  | "changes"
  | "released"
  | "check_failed"
  | "reminder"
  | "refunded"

export interface HistoryEvent {
  id: string
  at: string
  type: HistoryType
  actor: string
  milestoneId?: string
  amount?: string
  hash?: string
  note?: string
}

export interface Agreement {
  id: string
  kind: AgreementKind
  title: string
  summary: string
  token: TokenSymbol
  /** Total locked at creation, base units. */
  total: string
  /** The agreement's contract address. */
  address: string
  funder: Party
  builder: Party
  milestones: Milestone[]
  status: AgreementStatus
  createdAt: string
  history: HistoryEvent[]
}

export interface WalletState {
  status: "disconnected" | "connecting" | "connected"
  address: string
  name: string
  lastError: "rejected" | null
}

export interface DemoSettings {
  slow: boolean
  failNext: boolean
}

export interface DemoState {
  version: 1
  wallet: WalletState
  /** The connected wallet's token balances, base units. */
  balances: Record<TokenSymbol, string>
  agreements: Agreement[]
  settings: DemoSettings
}

export interface TxSummary {
  title: string
  rows?: { label: string; value: string }[]
  /** Shows the testnet / not-financial-advice notice in the prompt. */
  movesValue?: boolean
  noFee?: boolean
  /** Who signs, when the visitor is playing another party's role. */
  signer?: Party
}

export interface TxState {
  phase: "idle" | "signing" | "pending" | "confirmed" | "failed"
  hash?: string
  error?: "rejected" | "reverted" | "check"
}
