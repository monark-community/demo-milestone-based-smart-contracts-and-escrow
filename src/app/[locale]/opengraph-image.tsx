import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { ImageResponse } from "next/og"

import { isLocale, locales } from "@/i18n/config"
import { getDictionary } from "@/i18n"

export const alt = "MilestoneMint by Monark"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : "en"
  const d = getDictionary(locale)
  const mark = await readFile(join(process.cwd(), "public/brand/monark-mark.svg"), "utf8")
  const markSrc = `data:image/svg+xml;base64,${Buffer.from(mark).toString("base64")}`
  // The budget bar: two milestones released (solid), one in review (outlined), one locked (muted).
  const segs = [
    { w: 150, fill: "#F88D10", border: "#F88D10" },
    { w: 350, fill: "#F88D10", border: "#F88D10" },
    { w: 300, fill: "#F7ECE4", border: "#F88D10" },
    { w: 200, fill: "#F7ECE4", border: "#E9DFD7" },
  ]

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#FFF9F3", color: "#15110E", padding: 72 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={markSrc} width={64} height={64} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>MilestoneMint</span>
            <span style={{ fontSize: 22, color: "#625952", marginTop: 6 }}>{d.common.byMonark}</span>
          </div>
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.06, letterSpacing: -1.5, maxWidth: 900 }}>{d.meta.ogTagline}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {segs.map((s, i) => (
              <div key={i} style={{ width: s.w, height: 44, borderRadius: 14, background: s.fill, border: `4px solid ${s.border}` }} />
            ))}
          </div>
          <div style={{ fontSize: 22, color: "#625952" }}>{d.common.demoBadge}</div>
        </div>
      </div>
    ),
    size
  )
}
