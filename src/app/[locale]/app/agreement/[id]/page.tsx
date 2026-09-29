import type { Metadata } from "next"

import { AgreementView } from "@/components/demo/agreement-view"
import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"

export async function generateMetadata({ params }: PageProps<"/[locale]/app/agreement/[id]">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.agreement
  // Agreements live in the visitor's browser: nothing here to index.
  return { title: m.title, description: m.description, robots: { index: false, follow: true } }
}

export default async function AgreementPage({ params, searchParams }: PageProps<"/[locale]/app/agreement/[id]">) {
  const { id } = await params
  const sp = await searchParams
  const as = typeof sp.as === "string" ? sp.as : undefined
  return <AgreementView key={`${id}-${as ?? ""}`} id={id} initialRole={as} />
}
