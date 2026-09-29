import { CheckIcon } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"

/**
 * INTERNAL STRATEGY REVIEW ONLY. This page is intentionally not linked from
 * anywhere, is excluded from sitemap.xml and is marked noindex/nofollow.
 */
export async function generateMetadata({ params }: PageProps<"/[locale]/pricing">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.pricing
  return { title: m.title, description: m.description, robots: { index: false, follow: false } }
}

export default async function PricingPage({ params }: PageProps<"/[locale]/pricing">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const p = getDictionary(locale).pricing

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
      <p className="eyebrow inline-flex rounded-full border border-dashed px-3 py-1 text-muted-foreground">{p.eyebrow}</p>
      <h1 className="mt-5 text-4xl font-extrabold tracking-display sm:text-5xl">{p.title}</h1>
      <p className="mt-4 max-w-[60ch] text-lg text-muted-foreground">{p.intro}</p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-3xl border-2 border-primary bg-card p-6 sm:p-8" aria-labelledby="plan-title">
          <h2 id="plan-title" className="eyebrow text-primary-ink">
            {p.plan.name}
          </h2>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="text-5xl font-extrabold tracking-display">{p.plan.price}</span>
            <span className="text-muted-foreground">{p.plan.period}</span>
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {p.plan.items.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <CheckIcon className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </section>
        <div className="flex flex-col gap-6">
          <section className="rounded-3xl border bg-card p-6" aria-labelledby="costs-title">
            <h2 id="costs-title" className="text-xl font-bold">
              {p.costsTitle}
            </h2>
            <p className="mt-2 text-muted-foreground">{p.costsBody}</p>
          </section>
          <section className="rounded-3xl border bg-card p-6" aria-labelledby="partner-title">
            <h2 id="partner-title" className="text-xl font-bold">
              {p.partnerTitle}
            </h2>
            <p className="mt-2 text-muted-foreground">{p.partnerBody}</p>
          </section>
        </div>
      </div>

      <section className="mt-10 max-w-3xl" aria-labelledby="why-title">
        <h2 id="why-title" className="text-2xl font-bold">
          {p.whyTitle}
        </h2>
        <ol className="mt-4 flex list-decimal flex-col gap-2 pl-5 text-muted-foreground">
          {p.whyItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>
    </div>
  )
}
