"use client"

import { Loader2Icon, WalletIcon, XCircleIcon } from "lucide-react"
import type { ReactNode } from "react"
import { toast } from "sonner"

import { AppLoading } from "@/components/ui/app-loading"
import { Button } from "@/components/ui/button"
import { DemoControls } from "@/components/ui/demo-controls"
import { FieldError } from "@/components/ui/field-error"
import { MonarkMark } from "@/components/ui/site-brand"
import { resetDemo, setSettings, useDemo, useStorageOk } from "@/lib/demo/store"
import { NETWORK_NAME } from "@/lib/demo/tokens"
import { connectWallet } from "@/lib/demo/wallet"

import { useAppCopy } from "./app-provider"

/** App chrome under the site header: one compact bar (network + demo controls); gates on wallet connection. */
export function AppFrame({ children }: { children: ReactNode }) {
  const demo = useDemo()
  const storageOk = useStorageOk()
  const { app, seed, locale } = useAppCopy()
  const c = app.controls

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b bg-secondary/40">
        <div className="mx-auto flex max-w-6xl items-center justify-end px-4 py-2 sm:px-6">
          {demo ? (
            <DemoControls
              networkName={NETWORK_NAME}
              slow={demo.settings.slow}
              onSlowChange={(slow) => setSettings({ slow })}
              failNext={demo.settings.failNext}
              onFailNextChange={(failNext) => setSettings({ failNext })}
              onReset={() => {
                resetDemo(seed, locale)
                toast.success(c.resetDone)
              }}
              title={c.title}
              openLabel={c.open}
              slowLabel={c.slow}
              slowHint={c.slowHint}
              failNextLabel={c.failNext}
              failNextHint={c.failNextHint}
              resetLabel={c.reset}
              resetHint={c.resetHint}
              resetConfirmTitle={c.resetConfirm}
              resetConfirmBody={c.resetConfirmBody}
              resetConfirmLabel={c.resetDo}
              cancelLabel={c.cancel}
              closeLabel={app.close}
            />
          ) : null}
        </div>
      </div>
      {!storageOk ? (
        <p role="alert" className="mx-auto mt-4 w-full max-w-6xl px-4 text-sm text-warning sm:px-6">
          {app.storageError}
        </p>
      ) : null}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 lg:py-10">
        {!demo ? <AppLoading label={app.loading} /> : demo.wallet.status !== "connected" ? <ConnectGate /> : children}
      </div>
    </div>
  )
}

function ConnectGate() {
  const demo = useDemo()
  const { app } = useAppCopy()
  const g = app.gate
  const connecting = demo?.wallet.status === "connecting"
  const rejected = demo?.wallet.lastError === "rejected"

  return (
    <section aria-labelledby="gate-title" className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center py-8 text-center">
      <MonarkMark className="size-14" />
      <h1 id="gate-title" className="mt-6 text-3xl font-extrabold tracking-display">
        {g.title}
      </h1>
      <p className="mt-3 text-muted-foreground">{g.body}</p>
      <Button
        size="lg"
        className="mt-8 w-full sm:w-auto"
        disabled={connecting}
        onClick={() =>
          void connectWallet({
            title: app.summaries.signIn,
            rows: [{ label: app.summaries.signInRow, value: app.summaries.signInValue }],
            movesValue: false,
            noFee: true,
          })
        }
      >
        {connecting ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <WalletIcon aria-hidden="true" />}
        {connecting ? app.wallet.connecting : g.connect}
      </Button>
      <div aria-live="polite" className="mt-4 min-h-6">
        {rejected ? (
          <FieldError icon={<XCircleIcon />} className="text-left">
            {g.rejected}
          </FieldError>
        ) : null}
      </div>
    </section>
  )
}
