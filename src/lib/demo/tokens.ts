import type { Token, TokenSymbol } from "./types"

/** Testnet tokens and reference prices shared with the Monark DeFi demos. */
export const TOKENS: Record<TokenSymbol, Token> = {
  tUSDC: { symbol: "tUSDC", decimals: 6, usd: 1 },
  tDAI: { symbol: "tDAI", decimals: 18, usd: 1 },
  tETH: { symbol: "tETH", decimals: 18, usd: 3200 },
}

export const TOKEN_LIST: TokenSymbol[] = ["tUSDC", "tDAI", "tETH"]

export const NETWORK_NAME = "Sepolia testnet"

/** Parse a user-typed decimal ("1 250,5", "1250.50") into base units. Returns null if invalid. */
export function parseUnits(input: string, decimals: number): bigint | null {
  const cleaned = input.replace(/[\s  _]/g, "").replace(",", ".")
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(cleaned)) return null
  const [whole = "0", frac = ""] = cleaned.split(".")
  if (frac.length > decimals) return null
  const base = 10n ** BigInt(decimals)
  return BigInt(whole || "0") * base + BigInt((frac + "0".repeat(decimals)).slice(0, decimals) || "0")
}

/** Base units to a plain JS number (for USD estimates and bar widths only). */
export function toNumber(value: bigint | string, decimals: number): number {
  const v = typeof value === "bigint" ? value : BigInt(value)
  const base = 10n ** BigInt(decimals)
  return Number(v / base) + Number(v % base) / Number(base)
}

export function units(amount: number, symbol: TokenSymbol): string {
  const { decimals } = TOKENS[symbol]
  const [w, f = ""] = amount.toFixed(Math.min(decimals, 6)).split(".")
  return (BigInt(w) * 10n ** BigInt(decimals) + BigInt((f + "0".repeat(decimals)).slice(0, decimals))).toString()
}

export function usdValue(value: bigint | string, symbol: TokenSymbol): number {
  const t = TOKENS[symbol]
  return toNumber(value, t.decimals) * t.usd
}
