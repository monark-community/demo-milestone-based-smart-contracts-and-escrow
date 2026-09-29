"use client"

import { CheckIcon, Loader2Icon, WalletIcon, XCircleIcon } from "lucide-react"
import Image from "next/image"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { NetworkBadge } from "@/components/ui/network-badge"
import { useDemo, useStorageOk } from "@/lib/demo/store"
import { NETWORK_NAME } from "@/lib/demo/tokens"
import { connectWallet } from "@/lib/demo/wallet"

import { useAppCopy } from "./app-provider"
import { DemoControls } from "./demo-controls"
import { Disclaimer } from "./disclaimer"

/** App chrome under the site header: network, disclaimer, demo controls; gates on wallet connection. */
export function AppFrame({ children }: { children: ReactNode }) {
  const demo = useDemo()
  const storageOk = useStorageOk()
  const { app, disclaimer } = useAppCopy()

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b bg-secondary/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
          <NetworkBadge name={NETWORK_NAME} variant="outline" icon={<span className="block size-full rounded-full bg-success" />} />
          <Disclaimer text={disclaimer} className="order-last min-w-0 basis-full sm:order-none sm:basis-auto sm:flex-1" />
          <div className="ml-auto sm:ml-0">
            <DemoControls />
          </div>
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

export function AppLoading({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">{label}</span>
      <div className="h-9 w-56 animate-pulse rounded-full bg-muted" />
      <div className="grid gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      <div className="h-40 animate-pulse rounded-2xl bg-muted" />
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
      <Image src="/brand/monark-mark.svg" alt="" width={56} height={56} unoptimized className="size-14" />
      <h1 id="gate-title" className="mt-6 text-3xl font-extrabold tracking-display">
        {g.title}
      </h1>
      <p className="mt-3 text-muted-foreground">{g.body}</p>
      <ul className="mt-6 flex flex-col gap-2 text-left text-sm">
        {g.features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <CheckIcon className="size-4 text-success" aria-hidden="true" />
            {f}
          </li>
        ))}
      </ul>
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
          <p role="alert" className="flex items-start gap-2 text-left text-sm text-destructive">
            <XCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {g.rejected}
          </p>
        ) : null}
      </div>
    </section>
  )
}
