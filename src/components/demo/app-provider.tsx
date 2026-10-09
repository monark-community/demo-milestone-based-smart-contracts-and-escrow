"use client"

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react"

import { MonarkMark } from "@/components/ui/site-brand"
import { Toaster } from "@/components/ui/sonner"
import { WalletPrompt } from "@/components/ui/wallet-prompt"
import type { Dictionary } from "@/i18n"
import type { Locale } from "@/i18n/config"
import { estimateFee } from "@/lib/demo/chain"
import { initDemo, useDemo, usePrompt } from "@/lib/demo/store"
import { NETWORK_NAME } from "@/lib/demo/tokens"

export interface AppCopy {
  locale: Locale
  app: Dictionary["app"]
  seed: Dictionary["seed"]
  disclaimer: string
  demoBadge: string
}

const AppContext = createContext<AppCopy | null>(null)

const WIDE = "(min-width: 1024px)"
function subscribeWide(cb: () => void) {
  const mq = window.matchMedia(WIDE)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

export function useAppCopy(): AppCopy {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useAppCopy must be used inside <AppProvider>")
  return ctx
}

/** The translated labels every TxFeedback shares. */
export function useTxLabels() {
  const tx = useAppCopy().app.tx
  return {
    signingLabel: tx.signing,
    pendingLabel: tx.pending,
    pendingStatusLabel: tx.pending,
    confirmedLabel: tx.confirmed,
    failedLabel: tx.failed,
    retryLabel: tx.retry,
    dismissLabel: tx.dismiss,
  }
}

export function AppProvider({ value, children }: { value: AppCopy; children: ReactNode }) {
  const wide = useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches, () => true)
  useEffect(() => {
    initDemo(value.seed, value.locale)
  }, [value.seed, value.locale])

  return (
    <AppContext.Provider value={value}>
      {children}
      <DemoWalletPrompt />
      <Toaster
        // Desktop: bottom-right, under the sticky budget rail (which sits at
        // the top of the right column), so a toast never covers the milestone
        // being acted on or the budget bar animating its release. Phones:
        // just under the sticky header, away from the action buttons and the
        // inline transaction status, which live mid-page.
        position={wide ? "bottom-right" : "top-center"}
        offset={{ bottom: 24, right: 24 }}
        mobileOffset={{ top: 72, left: 16, right: 16 }}
      />
    </AppContext.Provider>
  )
}

/** The simulated wallet's confirmation sheet, driven by the demo store. Closing it counts as a rejection. */
function DemoWalletPrompt() {
  const prompt = usePrompt()
  const demo = useDemo()
  const { app, disclaimer, locale } = useAppCopy()
  const p = app.prompt
  const summary = prompt?.summary
  const signer = summary?.signer
  // A fresh fee estimate per request.
  const fee = useMemo(() => (prompt ? estimateFee() : ""), [prompt])
  const feeText = fee ? `${Number(fee).toLocaleString(locale === "fr" ? "fr-CA" : "en-CA", { maximumFractionDigits: 5 })} tETH` : ""

  return (
    <WalletPrompt
      open={!!prompt}
      onReject={() => prompt?.resolve(false)}
      onConfirm={() => prompt?.resolve(true)}
      site={
        <>
          <MonarkMark />
          {p.site}
        </>
      }
      title={summary?.title ?? p.title}
      description={p.title}
      account={demo ? { name: signer?.name ?? demo.wallet.name, address: signer?.address ?? demo.wallet.address } : undefined}
      accountLabel={p.signingAs}
      rows={summary?.rows ?? []}
      network={NETWORK_NAME}
      networkLabel={p.network}
      fee={summary?.noFee ? undefined : feeText}
      feeLabel={p.fee}
      disclaimer={summary?.movesValue ? disclaimer : p.simulated}
      warning={!!summary?.movesValue}
      confirmLabel={p.confirm}
      rejectLabel={p.reject}
      closeLabel={app.close}
    />
  )
}
