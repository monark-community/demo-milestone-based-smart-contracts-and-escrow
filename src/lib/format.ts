import { intlLocale, type Locale } from "@/i18n/config"
import { TOKENS, toNumber } from "@/lib/demo/tokens"
import type { TokenSymbol } from "@/lib/demo/types"

/** Locale-aware decimal formatting of base units, exact (no float rounding of the whole part). */
export function formatUnits(value: bigint | string, decimals: number, locale: Locale, maxFrac = 2): string {
  const raw = typeof value === "bigint" ? value : BigInt(value)
  const negative = raw < 0n
  const abs = negative ? -raw : raw
  const base = 10n ** BigInt(decimals)
  const whole = abs / base
  const frac = abs % base
  const nf = new Intl.NumberFormat(intlLocale[locale])
  const wholeStr = nf.format(whole)
  let fracStr = frac.toString().padStart(decimals, "0").slice(0, maxFrac).replace(/0+$/, "")
  // Tiny non-zero amounts (rounding dust) keep enough digits to be visible.
  if (!fracStr && frac > 0n && whole === 0n) {
    fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "")
  }
  const sep = nf.formatToParts(1.5).find((p) => p.type === "decimal")?.value ?? "."
  return `${negative ? "-" : ""}${wholeStr}${fracStr ? sep + fracStr : ""}`
}

export function formatToken(value: bigint | string, symbol: TokenSymbol, locale: Locale, maxFrac = 2): string {
  return `${formatUnits(value, TOKENS[symbol].decimals, locale, maxFrac)} ${symbol}`
}

export function formatUsd(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatPercent(fraction: number, locale: Locale, maxFrac = 2): string {
  return new Intl.NumberFormat(intlLocale[locale], { style: "percent", maximumFractionDigits: maxFrac }).format(fraction)
}

export function formatNumber(n: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: 2 }).format(n)
}

/** Plain dates (yyyy-mm-dd, e.g. deadlines) are local calendar days, not UTC midnight. */
function toDate(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso)
}

export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], { dateStyle: "medium" }).format(toDate(iso))
}

export function formatDateTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso))
}

export function tokenToNumber(value: bigint | string, symbol: TokenSymbol): number {
  return toNumber(value, TOKENS[symbol].decimals)
}

export function shortHash(hash: string, start = 8, end = 6): string {
  return hash.length > start + end + 1 ? `${hash.slice(0, start)}…${hash.slice(-end)}` : hash
}

export function shortAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address
}
