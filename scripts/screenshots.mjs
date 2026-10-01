// Visual check of every page and key flow with Playwright.
// Usage: pnpm build && pnpm start -p 3143   (in another terminal)
//        pnpm screenshots                  (BASE_URL defaults to http://localhost:3143)
// Output: docs/screenshots/<locale>-<width>-<theme>-<name>.png
import { mkdir } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const BASE = process.env.BASE_URL ?? "http://localhost:3143"
const OUT = fileURLToPath(new URL("../docs/screenshots/", import.meta.url))
const ONLY = process.env.ONLY // optional filter on the variant tag
const KEY = "milestonemint-demo-v1"

const widths = { 390: { width: 390, height: 844 }, 1440: { width: 1440, height: 900 } }
const variants = []
for (const w of [390, 1440]) for (const theme of ["light", "dark"]) variants.push({ locale: "en", w, theme })
// French: home page and one key flow, both widths, light.
for (const w of [390, 1440]) variants.push({ locale: "fr", w, theme: "light" })

async function newPage(browser, { locale, w, theme }) {
  const context = await browser.newContext({
    viewport: widths[w],
    colorScheme: theme,
    locale: locale === "fr" ? "fr-CA" : "en-CA",
    reducedMotion: "no-preference",
    acceptDownloads: true,
  })
  await context.addInitScript((t) => {
    try {
      window.localStorage.setItem("theme", t)
    } catch {}
  }, theme)
  const page = await context.newPage()
  return { context, page }
}

const shot = async (page, v, name, fullPage = false) => {
  const file = `${OUT}${v.locale}-${v.w}-${v.theme}-${name}.png`
  if (fullPage) {
    // Walk the page so lazy images load, then return to the top.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 40))
      }
      window.scrollTo(0, 0)
    })
    await page.waitForLoadState("networkidle")
  }
  await page.waitForTimeout(300)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  if (overflow > 0) console.log("  ! horizontal overflow", overflow, "px on", name)
  await page.screenshot({ path: file, fullPage })
  console.log("  ✓", `${v.locale}-${v.w}-${v.theme}-${name}`)
}

const isMobile = (v) => v.w < 768
const L = (v, en, fr) => (v.locale === "fr" ? fr : en)
const confirm = (page, v) => page.getByRole("dialog").getByRole("button", { name: L(v, "Confirm", "Confirmer"), exact: true }).click()
const card = (page, id) => page.locator(`li#${id}`)
const settle = (page, ms = 900) => page.waitForTimeout(ms)

async function connect(page, v, capture) {
  await page.goto(`${BASE}/${v.locale}/app`, { waitUntil: "networkidle" })
  const btn = page.getByRole("main").getByRole("button", { name: L(v, "Connect demo wallet", "Connecter le portefeuille de démo") })
  await btn.waitFor()
  if (capture) await shot(page, v, "app-01-gate", true)
  await btn.click()
  await page.getByRole("dialog").waitFor()
  if (capture) await shot(page, v, "flow1-connect-prompt")
  await confirm(page, v)
  await page.getByRole("heading", { level: 1, name: L(v, "Your agreements", "Vos ententes"), exact: true }).waitFor({ timeout: 10000 })
}

async function marketing(page, v) {
  for (const [name, path] of [
    ["home", ""],
    ["how-it-works", "/how-it-works"],
    ["credits", "/credits"],
    ["pricing", "/pricing"],
    ["404", "/this-page-does-not-exist"],
  ]) {
    await page.goto(`${BASE}/${v.locale}${path}`, { waitUntil: "networkidle" })
    await page.waitForTimeout(500)
    await shot(page, v, `page-${name}`, true)
  }
  if (isMobile(v)) {
    await page.goto(`${BASE}/${v.locale}`, { waitUntil: "networkidle" })
    await page.getByRole("button", { name: "Open menu" }).click()
    await page.getByRole("dialog").waitFor()
    await shot(page, v, "page-mobile-menu")
  }
}

async function openAgreement(page, v, id, as) {
  await page.goto(`${BASE}/${v.locale}/app/agreement/${id}${as ? `?as=${as}` : ""}`, { waitUntil: "networkidle" })
  await page.getByRole("heading", { level: 1 }).waitFor()
  await settle(page, 300)
}

async function appFlows(page, v) {
  /* Flow 1: connect, including the rejected state. */
  await connect(page, v, true)
  await shot(page, v, "app-02-dashboard", true)
  await page.evaluate((key) => {
    const s = JSON.parse(localStorage.getItem(key))
    s.wallet.status = "disconnected"
    localStorage.setItem(key, JSON.stringify(s))
  }, KEY)
  await page.reload({ waitUntil: "networkidle" })
  await page.getByRole("main").getByRole("button", { name: "Connect demo wallet" }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Reject" }).click()
  await page.getByText("You declined the sign-in request").waitFor()
  await shot(page, v, "flow1-connect-rejected")
  await page.getByRole("main").getByRole("button", { name: "Connect demo wallet" }).click()
  await confirm(page, v)
  await page.getByRole("heading", { level: 1, name: "Your agreements", exact: true }).waitFor({ timeout: 10000 })

  /* Flow 2: create an agreement and lock the budget (fails once, then succeeds). */
  await page.goto(`${BASE}/${v.locale}/app/new`, { waitUntil: "networkidle" })
  await page.getByRole("heading", { level: 1 }).waitFor()
  await shot(page, v, "flow2-composer-grant", true)
  await page.getByRole("button", { name: "Blank", exact: true }).click()
  await page.getByRole("button", { name: /^Lock/ }).click()
  await settle(page, 200)
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(page, v, "flow2-composer-errors", true)
  await page.getByRole("button", { name: "Builder grant", exact: true }).click()
  await page.getByLabel("Share of budget (%)").first().fill("30")
  await settle(page, 300)
  await page.getByText(/not allocated yet|over the budget/).first().scrollIntoViewIfNeeded()
  await shot(page, v, "flow2-ruler-unbalanced")
  await page.getByLabel("Share of budget (%)").first().fill("20")
  await page.getByRole("button", { name: "Demo controls" }).click()
  await page.getByLabel("Fail the next transaction").click()
  await page.keyboard.press("Escape")
  await page.getByRole("button", { name: /^Lock/ }).click()
  await page.getByRole("dialog").waitFor()
  await shot(page, v, "flow2-lock-prompt")
  await confirm(page, v)
  await page.getByText("Locking funds in escrow…").first().waitFor()
  await page.getByText("Locking funds in escrow…").first().scrollIntoViewIfNeeded()
  await shot(page, v, "flow2-lock-pending")
  await page.getByText("Locking failed on the simulated network").waitFor({ timeout: 10000 })
  await page.getByText("Locking failed on the simulated network").scrollIntoViewIfNeeded()
  await shot(page, v, "flow2-lock-failed")
  await page.getByRole("button", { name: "Try again" }).click()
  await confirm(page, v)
  await page.waitForURL(/\/app\/agreement\//, { timeout: 15000 })
  await page.getByRole("heading", { level: 1, name: "Kanban module: mobile board" }).waitFor()
  await settle(page)
  await shot(page, v, "flow2-locked", true)

  /* Flow 3: builder resubmits after a change request; the funder approves and releases. */
  await openAgreement(page, v, "docs-fr")
  await card(page, "docs-fr-m2").scrollIntoViewIfNeeded()
  await shot(page, v, "flow3-changes-requested")
  await card(page, "docs-fr-m2").getByRole("button", { name: "Resubmit" }).click()
  await page.getByRole("dialog").waitFor()
  await page.getByLabel("Note for the reviewers (optional)").fill("Section 3 now uses \"portefeuille\" everywhere, matching the glossary.")
  await shot(page, v, "flow3-submit-dialog")
  await page.getByRole("dialog").getByRole("button", { name: "Submit", exact: true }).click()
  await confirm(page, v)
  await card(page, "docs-fr-m2").getByText("In review", { exact: true }).waitFor({ timeout: 10000 })
  await card(page, "docs-fr-m2").scrollIntoViewIfNeeded()
  await shot(page, v, "flow3-in-review")
  await page.getByRole("radio", { name: "Funder" }).click()
  await card(page, "docs-fr-m2").getByRole("button", { name: "Request changes" }).click()
  await page.getByRole("dialog").waitFor()
  await page.getByLabel("What needs to change").fill("Looks great. One typo left on page 4: \"cle\" should be \"clé\".")
  await shot(page, v, "flow3-changes-dialog")
  await page.keyboard.press("Escape")
  await card(page, "docs-fr-m2").getByRole("button", { name: "Approve and release" }).click()
  await page.getByRole("dialog").waitFor()
  await shot(page, v, "flow3-approve-prompt")
  await confirm(page, v)
  await card(page, "docs-fr-m2").getByText("Released", { exact: true }).waitFor({ timeout: 10000 })
  await settle(page)
  await card(page, "docs-fr-m2").scrollIntoViewIfNeeded()
  await shot(page, v, "flow3-released")

  /* Flow 4a: multi-signature. Your signature is the second of 2-of-3, so it releases. */
  await openAgreement(page, v, "wiki-offline", "reviewer")
  await card(page, "wiki-offline-m2").scrollIntoViewIfNeeded()
  await shot(page, v, "flow4-needs-signature")
  await card(page, "wiki-offline-m2").getByRole("button", { name: "Approve and release" }).click()
  await page.getByRole("dialog").waitFor()
  await shot(page, v, "flow4-sign-prompt")
  await confirm(page, v)
  await page.getByText("Recording your signature…").first().waitFor()
  await shot(page, v, "flow4-sign-pending")
  await card(page, "wiki-offline-m2").getByText("Released", { exact: true }).waitFor({ timeout: 10000 })
  await settle(page, 400)
  if (isMobile(v)) await page.getByRole("heading", { name: "Budget" }).scrollIntoViewIfNeeded()
  await shot(page, v, "flow4-released-padlock")
  await settle(page, 600)
  await card(page, "wiki-offline-m2").scrollIntoViewIfNeeded()
  await shot(page, v, "flow4-released")

  /* Flow 4b: automatic check. Not met the first time, then met. */
  await openAgreement(page, v, "docs-fr", "builder")
  await card(page, "docs-fr-m3").getByRole("button", { name: "Submit for review" }).click()
  await page.getByLabel("Link to the evidence").fill("https://github.com/monark-community/docs/pull/412")
  await page.getByRole("dialog").getByRole("button", { name: "Submit", exact: true }).click()
  await confirm(page, v)
  await card(page, "docs-fr-m3").getByRole("button", { name: "Run the check" }).waitFor({ timeout: 10000 })
  await card(page, "docs-fr-m3").getByRole("button", { name: "Run the check" }).click()
  await confirm(page, v)
  await page.getByText(/The check didn't pass/).waitFor({ timeout: 10000 })
  await card(page, "docs-fr-m3").scrollIntoViewIfNeeded()
  await shot(page, v, "flow4-check-not-met")
  await card(page, "docs-fr-m3").getByRole("button", { name: "Try again" }).click()
  await confirm(page, v)
  await card(page, "docs-fr-m3").getByText("Released", { exact: true }).waitFor({ timeout: 10000 })
  await settle(page)
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(page, v, "flow4-check-released", true)

  /* Flow 5: overdue milestone: remind, then cancel and refund; history + CSV. */
  await page.goto(`${BASE}/${v.locale}/app`, { waitUntil: "networkidle" })
  await page.getByRole("heading", { name: "Needs your attention" }).scrollIntoViewIfNeeded()
  await shot(page, v, "flow5-attention")
  await openAgreement(page, v, "workshops")
  await card(page, "workshops-m2").scrollIntoViewIfNeeded()
  await card(page, "workshops-m2").getByRole("button", { name: "Send a reminder" }).click()
  await settle(page, 400)
  await shot(page, v, "flow5-overdue-reminder")
  await page.getByRole("button", { name: "Cancel and refund the rest" }).click()
  await page.getByRole("dialog").waitFor()
  await shot(page, v, "flow5-refund-dialog")
  await page.getByRole("dialog").getByRole("button", { name: "Cancel and refund", exact: true }).click()
  await page.getByRole("dialog").waitFor()
  await shot(page, v, "flow5-refund-prompt")
  await confirm(page, v)
  await page.getByText("This agreement was cancelled").waitFor({ timeout: 10000 })
  await settle(page)
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(page, v, "flow5-cancelled", true)
  await page.getByRole("tab", { name: "History" }).click()
  await page.getByRole("tab", { name: "History" }).scrollIntoViewIfNeeded()
  await shot(page, v, "flow5-history")

  // A failed release: the agreement stays exactly as it was.
  await openAgreement(page, v, "wiki-offline", "builder")
  await page.getByRole("button", { name: "Demo controls" }).click()
  await page.getByLabel("Fail the next transaction").click()
  await page.keyboard.press("Escape")
  await card(page, "wiki-offline-m3").getByRole("button", { name: "Submit for review" }).click()
  await page.getByLabel("Link to the evidence").fill("https://github.com/monark-community/app/pull/431")
  await page.getByRole("dialog").getByRole("button", { name: "Submit", exact: true }).click()
  await confirm(page, v)
  await page.getByText(/The transaction failed on the simulated network/).waitFor({ timeout: 10000 })
  await card(page, "wiki-offline-m3").scrollIntoViewIfNeeded()
  await shot(page, v, "flow3-submit-failed")

  // Demo controls and reset.
  await page.getByRole("button", { name: "Demo controls" }).click()
  await page.getByRole("dialog").waitFor()
  await shot(page, v, "app-03-demo-controls")
  await page.getByRole("dialog").getByRole("button", { name: "Reset demo" }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Reset demo" }).click()
  await settle(page, 400)
}

async function frenchFlow(page, v) {
  await page.goto(`${BASE}/fr`, { waitUntil: "networkidle" })
  await page.waitForTimeout(500)
  await shot(page, v, "page-home", true)
  await connect(page, v, true)
  await shot(page, v, "app-02-dashboard", true)
  await page.goto(`${BASE}/fr/app/agreement/wiki-offline?as=reviewer`, { waitUntil: "networkidle" })
  await page.getByRole("heading", { level: 1 }).waitFor()
  await card(page, "wiki-offline-m2").getByRole("button", { name: "Approuver et verser" }).click()
  await page.getByRole("dialog").waitFor()
  await shot(page, v, "flow4-sign-prompt")
  await confirm(page, v)
  await card(page, "wiki-offline-m2").getByText("Versé", { exact: true }).waitFor({ timeout: 10000 })
  await settle(page)
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(page, v, "flow4-released", true)
  await page.goto(`${BASE}/fr/app/new`, { waitUntil: "networkidle" })
  await page.getByRole("button", { name: "Travaux", exact: true }).click()
  await shot(page, v, "flow2-composer-contract", true)
}

const browser = await chromium.launch()
await mkdir(OUT, { recursive: true })
for (const v of variants) {
  const tag = `${v.locale}-${v.w}-${v.theme}`
  if (ONLY && !tag.includes(ONLY)) continue
  console.log(tag)
  const { context, page } = await newPage(browser, v)
  try {
    if (v.locale === "fr") await frenchFlow(page, v)
    else {
      if (!process.env.SKIP_MARKETING) await marketing(page, v)
      await appFlows(page, v)
    }
  } catch (e) {
    console.error("  ✗", tag, e.message)
    await page.screenshot({ path: `${OUT}_error-${tag}.png` }).catch(() => {})
    process.exitCode = 1
  }
  await context.close()
}
await browser.close()
