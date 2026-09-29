"use client"

import { useTheme } from "next-themes"
import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react"
import { Toaster } from "sonner"

import type { Dictionary } from "@/i18n"
import type { Locale } from "@/i18n/config"
import { initDemo } from "@/lib/demo/store"

import { WalletPrompt } from "./wallet-prompt"

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

export function AppProvider({ value, children }: { value: AppCopy; children: ReactNode }) {
  const { resolvedTheme } = useTheme()
  const wide = useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches, () => true)
  useEffect(() => {
    initDemo(value.seed, value.locale)
  }, [value.seed, value.locale])

  return (
    <AppContext.Provider value={value}>
      {children}
      <WalletPrompt />
      <Toaster
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        // Desktop: bottom-right, under the sticky budget rail (which sits at
        // the top of the right column), so a toast never covers the milestone
        // being acted on or the budget bar animating its release. Phones:
        // just under the sticky header, away from the action buttons and the
        // inline transaction status, which live mid-page.
        position={wide ? "bottom-right" : "top-center"}
        offset={{ bottom: 24, right: 24 }}
        mobileOffset={{ top: 72, left: 16, right: 16 }}
        toastOptions={{
          classNames: {
            toast: "!rounded-2xl !border !border-border !bg-popover !text-popover-foreground !font-sans !shadow-md",
            description: "!text-muted-foreground",
          },
        }}
      />
    </AppContext.Provider>
  )
}
