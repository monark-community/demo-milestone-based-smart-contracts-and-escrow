import type { Metadata, Viewport } from "next"
import { Nunito_Sans } from "next/font/google"
import { notFound } from "next/navigation"

import "../globals.css"

import Link from "next/link"

import { SiteHeader } from "@/components/site/header"
import { MONARK_SOCIALS, SiteFooter } from "@/components/ui/site-footer"
import { ThemeProvider } from "@/components/ui/theme-toggle"
import { href, isLocale, locales, PROJECT_ID, REPO_URL, SITE_URL } from "@/i18n/config"
import { getDictionary } from "@/i18n"

const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
})

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale)
  const d = dict.meta
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: d.title, template: d.titleTemplate },
    description: d.description,
    applicationName: "MilestoneMint",
    openGraph: {
      type: "website",
      siteName: `MilestoneMint ${dict.common.byMonark}`,
      title: d.title,
      description: d.description,
      locale: locale === "fr" ? "fr_CA" : "en_CA",
      url: `/${locale}`,
    },
    twitter: { card: "summary_large_image", title: d.title, description: d.description },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff9f3" },
    { media: "(prefers-color-scheme: dark)", color: "#1a0b02" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const c = dict.common
  const f = c.footer

  return (
    <html lang={locale} className={nunito.variable} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col">
        <ThemeProvider>
          <a
            href="#main"
            className="sr-only z-50 rounded-full bg-primary px-4 py-2 font-bold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            {dict.common.skip}
          </a>
          <SiteHeader
            locale={locale}
            common={c}
            wallet={{
              connect: dict.app.wallet.connect,
              connecting: dict.app.wallet.connecting,
              disconnect: dict.app.wallet.disconnect,
              signIn: dict.app.summaries.signIn,
              signInRow: dict.app.summaries.signInRow,
              signInValue: dict.app.summaries.signInValue,
            }}
          />
          <main id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none">
            {children}
          </main>
          <SiteFooter
            product={c.product}
            description={f.product}
            links={[
              { href: href(locale), label: c.nav.overview },
              { href: href(locale, "/how-it-works"), label: c.nav.how },
              { href: href(locale, "/app"), label: c.nav.demo },
              { href: href(locale, "/credits"), label: c.nav.credits },
            ]}
            resources={[
              { href: `https://www.monark.io/${locale}/project/${PROJECT_ID}`, label: f.projectPage },
              { href: REPO_URL, label: f.repo },
            ]}
            socials={MONARK_SOCIALS.map((s) => ({ ...s, label: f.social[s.key as keyof typeof f.social] }))}
            copyright={`© ${new Date().getFullYear()} ${f.legal}`}
            demoNotice={c.demoBadge}
            legalLinks={[{ href: href(locale, "/credits"), label: f.photos }]}
            LinkComponent={Link}
            labels={{ productNav: f.productNav, builtBy: f.builtBy, monarkHome: f.monarkHome, tagline: f.tagline, socials: f.socialLabel }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
