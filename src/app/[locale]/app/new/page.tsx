import type { Metadata } from "next"

import { Composer } from "@/components/demo/composer"
import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { pageMetadata } from "@/lib/metadata"

export async function generateMetadata({ params }: PageProps<"/[locale]/app/new">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.newAgreement
  return pageMetadata(locale, "/app/new", m.title, m.description)
}

export default function NewAgreementPage() {
  return <Composer />
}
