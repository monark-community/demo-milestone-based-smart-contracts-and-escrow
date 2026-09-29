import { TokenAmount } from "@/components/ui/token-amount"
import { intlLocale, type Locale } from "@/i18n/config"
import { TOKENS, usdValue } from "@/lib/demo/tokens"
import type { TokenSymbol } from "@/lib/demo/types"

/** Token amounts always go through the registry's token-amount component. */
export function Amount({
  value,
  token,
  locale,
  usd = false,
  className,
}: {
  value: bigint | string
  token: TokenSymbol
  locale: Locale
  usd?: boolean
  className?: string
}) {
  return (
    <TokenAmount
      value={typeof value === "bigint" ? value : BigInt(value)}
      decimals={TOKENS[token].decimals}
      symbol={token}
      fractionDigits={2}
      locale={intlLocale[locale]}
      usdValue={usd && token === "tETH" ? usdValue(value, token) : undefined}
      className={className}
    />
  )
}
