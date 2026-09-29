import { ArrowRightIcon, HardHatIcon, ScanSearchIcon, UserCheckIcon, UsersIcon, WalletIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { StateMachine } from "@/components/diagrams/state-machine"
import { SectionDivider } from "@/components/site/section-divider"
import { Button } from "@/components/ui/button"
import { href, isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { pageMetadata } from "@/lib/metadata"

export async function generateMetadata({ params }: PageProps<"/[locale]/how-it-works">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.how
  return pageMetadata(locale, "/how-it-works", m.title, m.description)
}

const ROLE_ICONS = [WalletIcon, HardHatIcon, UsersIcon]
const RULE_ICONS = [UserCheckIcon, UsersIcon, ScanSearchIcon]

export default async function HowItWorksPage({ params }: PageProps<"/[locale]/how-it-works">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const h = getDictionary(locale).how

  return (
    <div className="flex flex-col">
      <section className="mx-auto w-full max-w-6xl px-4 pt-12 pb-10 sm:px-6 lg:pt-16">
        <p className="eyebrow text-primary-ink">{h.eyebrow}</p>
        <h1 className="mt-3 max-w-[20ch] text-4xl font-extrabold tracking-display sm:text-5xl">{h.title}</h1>
        <p className="mt-5 max-w-[68ch] text-lg text-muted-foreground">{h.intro}</p>
      </section>

      <section aria-labelledby="roles-title" className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6">
        <h2 id="roles-title" className="text-2xl font-bold sm:text-[2rem]">
          {h.roles.title}
        </h2>
        <ul className="mt-6 grid gap-5 md:grid-cols-3">
          {h.roles.items.map((r, i) => {
            const Icon = ROLE_ICONS[i] ?? WalletIcon
            return (
              <li key={r.title} className="rounded-3xl border bg-card p-6">
                <Icon className="size-7 text-primary" strokeWidth={1.75} aria-hidden="true" />
                <h3 className="mt-4 text-xl font-bold">{r.title}</h3>
                <p className="mt-2 text-muted-foreground">{r.body}</p>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="states-title" className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 id="states-title" className="text-2xl font-bold sm:text-[2rem]">
            {h.states.title}
          </h2>
          <p className="mt-2 max-w-[68ch] text-muted-foreground">{h.states.intro}</p>
          <div className="mx-auto mt-8 max-w-3xl">
            <StateMachine labels={h.states.labels} title={h.states.title} />
          </div>
          <p className="mx-auto mt-6 max-w-[68ch] text-center text-sm text-muted-foreground">{h.states.caption}</p>
        </div>
      </section>

      <section aria-labelledby="rules-title" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <h2 id="rules-title" className="text-2xl font-bold sm:text-[2rem]">
          {h.rules.title}
        </h2>
        <ul className="mt-6 grid gap-5 md:grid-cols-3">
          {h.rules.items.map((r, i) => {
            const Icon = RULE_ICONS[i] ?? UserCheckIcon
            return (
              <li key={r.title} className="rounded-3xl border bg-card p-6">
                <Icon className="size-7 text-primary" strokeWidth={1.75} aria-hidden="true" />
                <h3 className="mt-4 text-xl font-bold">{r.title}</h3>
                <p className="mt-2 text-muted-foreground">{r.body}</p>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="example-title" className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6">
        <h2 id="example-title" className="text-2xl font-bold sm:text-[2rem]">
          {h.example.title}
        </h2>
        <p className="mt-2 max-w-[68ch] text-muted-foreground">{h.example.intro}</p>
        <div className="mt-6 overflow-hidden rounded-3xl border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-xs text-muted-foreground">
              <tr>
                {h.example.headers.map((th, i) => (
                  <th key={th} scope="col" className={i === 0 ? "px-4 py-3 font-bold" : i === 3 ? "hidden px-4 py-3 font-bold sm:table-cell" : "px-4 py-3 text-right font-bold"}>
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {h.example.rows.map((row) => (
                <tr key={row[0]}>
                  <th scope="row" className="px-4 py-3 font-semibold">
                    {row[0]}
                    <span className="block text-xs font-normal text-muted-foreground sm:hidden">{row[3]}</span>
                  </th>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{row[1]}</td>
                  <td className="px-4 py-3 text-right font-mono whitespace-nowrap tabular-nums">{row[2]}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-[68ch] text-sm text-muted-foreground">{h.example.note}</p>
      </section>

      <SectionDivider />

      <section aria-labelledby="deadlines-title" className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
        <h2 id="deadlines-title" className="text-2xl font-bold sm:text-[2rem]">
          {h.deadlines.title}
        </h2>
        <ul className="mt-5 flex flex-col gap-3">
          {h.deadlines.items.map((item) => (
            <li key={item} className="flex gap-3">
              <span aria-hidden="true" className="mt-2.5 size-2 shrink-0 rounded-full border-2 border-primary" />
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="dev-title" className="border-t bg-card">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 id="dev-title" className="text-2xl font-bold sm:text-[2rem]">
            {h.dev.title}
          </h2>
          <p className="mt-2 max-w-[68ch] text-muted-foreground">{h.dev.intro}</p>
          <div className="mt-6 overflow-x-auto rounded-3xl border bg-background">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="bg-muted/60 text-xs text-muted-foreground">
                <tr>
                  {h.dev.headers.map((th) => (
                    <th key={th} scope="col" className="px-4 py-3 font-bold">
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {h.dev.mapping.map(([fn, what, demo]) => (
                  <tr key={fn}>
                    <th scope="row" className="px-4 py-3 font-mono text-sm font-bold text-primary-ink">
                      {fn}()
                    </th>
                    <td className="px-4 py-3">{what}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{demo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section aria-labelledby="cta-title" className="mx-auto w-full max-w-6xl px-4 py-14 text-center sm:px-6">
        <h2 id="cta-title" className="text-3xl font-extrabold tracking-display">
          {h.cta.title}
        </h2>
        <p className="mt-2 text-muted-foreground">{h.cta.body}</p>
        <Button asChild size="lg" className="mt-6">
          <Link href={href(locale, "/app")}>
            {h.cta.button}
            <ArrowRightIcon aria-hidden="true" />
          </Link>
        </Button>
      </section>
    </div>
  )
}
