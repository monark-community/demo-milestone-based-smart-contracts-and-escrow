import { ArrowRightIcon, GitMergeIcon, HandshakeIcon, LockKeyholeIcon, ReceiptTextIcon, ScanSearchIcon } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Lifecycle } from "@/components/diagrams/lifecycle"
import { Seals } from "@/components/diagrams/seals"
import { HeroTrack } from "@/components/home/hero-track"
import { SectionDivider } from "@/components/site/section-divider"
import { Button } from "@/components/ui/button"
import { href, isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { pageMetadata } from "@/lib/metadata"
import { PHOTOS } from "@/lib/photos"

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  return pageMetadata(locale, "/", null, getDictionary(locale).meta.description)
}

const OUTCOME_ICONS = [LockKeyholeIcon, HandshakeIcon, ReceiptTextIcon]

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const d = getDictionary(locale)
  const h = d.home

  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden">
        <Image
          src="/brand/monark-mesh.svg"
          alt=""
          width={900}
          height={900}
          unoptimized
          priority
          className="pointer-events-none absolute -top-24 -right-64 w-[760px] max-w-none opacity-[0.18] select-none sm:-right-48 lg:-top-32 lg:-right-40 lg:w-[900px] dark:opacity-[0.14]"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-14 sm:px-6 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-20 lg:pb-24">
          <div>
            <p className="eyebrow text-primary-ink">{h.eyebrow}</p>
            <h1 id="hero-title" className="mt-4 text-[2.25rem] leading-[1.05] font-extrabold tracking-display sm:text-5xl lg:text-[3.6rem]">
              {h.title}
            </h1>
            <p className="mt-5 max-w-[46ch] text-lg text-muted-foreground sm:text-xl">{h.sub}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href={href(locale, "/app")}>
                  {h.ctaPrimary}
                  <ArrowRightIcon aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={href(locale, "/how-it-works")}>{h.ctaSecondary}</Link>
              </Button>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">{d.common.disclaimer}</p>
          </div>
          <HeroTrack copy={h.track} locale={locale} />
        </div>
      </section>

      {/* Outcomes */}
      <section aria-labelledby="outcomes-title" className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <h2 id="outcomes-title" className="max-w-[24ch] text-3xl font-bold tracking-display sm:text-[2rem]">
            {h.outcomes.title}
          </h2>
          <ul className="mt-10 grid gap-8 md:grid-cols-3">
            {h.outcomes.items.map((o, i) => {
              const Icon = OUTCOME_ICONS[i] ?? LockKeyholeIcon
              return (
                <li key={o.title}>
                  <Icon className="size-7 text-primary" strokeWidth={1.75} aria-hidden="true" />
                  <h3 className="mt-4 text-xl font-bold">{o.title}</h3>
                  <p className="mt-2 text-muted-foreground">{o.body}</p>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* Lifecycle */}
      <section aria-labelledby="life-title" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="md:text-center">
          <h2 id="life-title" className="text-3xl font-bold tracking-display sm:text-[2rem]">
            {h.lifecycle.title}
          </h2>
          <p className="mt-3 text-muted-foreground">{h.lifecycle.intro}</p>
        </div>
        <div className="mt-12">
          <Lifecycle steps={h.lifecycle.steps} refund={h.lifecycle.refund} />
        </div>
      </section>

      <SectionDivider />

      {/* Rules */}
      <section aria-labelledby="rules-title" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <h2 id="rules-title" className="text-3xl font-bold tracking-display sm:text-[2rem]">
          {h.rules.title}
        </h2>
        <p className="mt-3 max-w-[60ch] text-muted-foreground">{h.rules.intro}</p>
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {h.rules.items.map((r, i) => (
            <li key={r.title} className="flex flex-col rounded-3xl border bg-card p-6">
              <div aria-hidden="true" className="flex h-12 items-center justify-between rounded-2xl bg-muted/60 px-4">
                {i === 0 ? (
                  <Seals signers={[{ name: "Monark Docs Guild", signed: true }]} threshold={1} label="" />
                ) : i === 1 ? (
                  <Seals
                    signers={[
                      { name: "Karim Haddad", signed: true },
                      { name: "Camille Roy", signed: true },
                      { name: "Inès Ferreira", signed: false },
                    ]}
                    threshold={2}
                    label=""
                  />
                ) : (
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <ScanSearchIcon className="size-5 text-primary" />
                    <GitMergeIcon className="size-4 text-muted-foreground" />
                    <span className="font-mono text-xs">#412</span>
                  </span>
                )}
                <span className="rounded-full border px-2.5 py-0.5 text-xs font-bold">{r.seal}</span>
              </div>
              <h3 className="mt-5 text-xl font-bold">{r.title}</h3>
              <p className="mt-2 text-muted-foreground">{r.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Who */}
      <section aria-labelledby="who-title" className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <h2 id="who-title" className="max-w-[26ch] text-3xl font-bold tracking-display sm:text-[2rem]">
            {h.who.title}
          </h2>
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {h.who.items.map((w, i) => {
              const photo = PHOTOS[i]
              return (
                <li key={w.title} className="flex flex-col overflow-hidden rounded-3xl border bg-background">
                  {photo ? (
                    <div className="relative aspect-[4/3]">
                      <Image src={photo.file} alt={w.alt} fill sizes="(min-width: 768px) 32vw, 100vw" className="object-cover" />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-xl font-bold">{w.title}</h3>
                    <p className="mt-2 text-muted-foreground">{w.body}</p>
                    <p className="mt-4 rounded-xl bg-muted/70 px-3 py-2 font-mono text-xs text-foreground">{w.plan}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-title" className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
        <h2 id="faq-title" className="text-3xl font-bold tracking-display sm:text-[2rem]">
          {h.faq.title}
        </h2>
        <div className="mt-8 divide-y rounded-3xl border bg-card">
          {h.faq.items.map((f) => (
            <details key={f.q} className="group px-5 py-1 sm:px-6">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-bold [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden="true" className="text-xl leading-none text-primary-ink transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-5 text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <SectionDivider />

      {/* Closing */}
      <section aria-labelledby="closing-title" className="mx-auto w-full max-w-6xl px-4 py-14 text-center sm:px-6 lg:py-20">
        <h2 id="closing-title" className="text-3xl font-extrabold tracking-display sm:text-4xl">
          {h.closing.title}
        </h2>
        <p className="mx-auto mt-3 max-w-[48ch] text-muted-foreground">{h.closing.body}</p>
        <Button asChild size="lg" className="mt-8">
          <Link href={href(locale, "/app")}>
            {h.closing.cta}
            <ArrowRightIcon aria-hidden="true" />
          </Link>
        </Button>
      </section>
    </>
  )
}
