# Simplification pass

Owner feedback: *"Generally, products are too loaded. Simplify, reduce text quantity, revise flows so that context is only given only when necessary. Two top bars on homepage is too busy, if you must have the demo banner, have them live only on demos/app pages."*

Binding rules: `monark-brand-guidelines.md` §8 "Restraint", §10 and §11. The method follows the TrustRate pilot (`sites/address-review-system/docs/simplification.md`, §4 checklist).

How the numbers are measured (both scripts are in `scripts/`, run against `pnpm start -p 3143`):

- `node scripts/wordcount.mjs`: words per page, English, at 1440px. *Visible* is the `innerText` of `<main>` (what a visitor reads without opening anything); *total* also counts closed disclosures and FAQ answers; *chrome* is everything outside `<main>` (header and footer). On `/app` pages the app bar is inside `<main>`, and the agreement pages include seeded data (titles, deliverables, notes, addresses).
- `node scripts/dictcount.mjs`: words of UI copy in `src/i18n/dictionaries/{en,fr}.ts`, per section.

## 1. Before

| Page | Visible in main | Total in main (incl. collapsed) | Chrome (header, footer) |
|-|-:|-:|-:|
| Home | 490 | 624 | 80 |
| How it works | 515 | 516 | 80 |
| Credits | 137 | 137 | 80 |
| 404 | 31 | 31 | 80 |
| App: connect gate | 56 | 56 | 80 |
| App: dashboard | 176 | 177 | 82 |
| App: new agreement | 281 | 319 | 82 |
| App: agreement (grant, funder) | 378 | 378 | 82 |
| App: agreement (bounty, builder) | 249 | 249 | 82 |
| **Total** | **2,313** | **2,487** | **728** |

Dictionary copy: **EN 3,259 words** (meta 145 · common 142 · home 645 · how 515 · credits 101 · pricing 164 · app 1,271 · seed 275); **FR 3,513 words**.

### Inventory

**Shell**
- Header already on the standard (butterfly + "MilestoneMint", links, Demo chip, EN/FR, theme, primary action), but the Demo chip used `primary/12` in both themes, and links sat 16px + padding after the brand instead of 28px.
- Footer legal band repeated the testnet line ("Testnet demo · not financial advice · no real funds") on every page. Product line: 17 words.

**Home** (hero + 6 sections, 2 dividers)
- Hero: eyebrow "Escrow module · Monark", H1 (7 words), sub (27 words), 2 buttons, **the testnet line under the buttons**, unlock track.
- Outcomes: H2 + 3 items (title + 15–18-word body). All three restated later sections (escrow → lifecycle step 1, sign-off → rules, receipts → lifecycle step 4).
- Lifecycle: H2 + intro line + 4 steps (11–15 words each) + refund card (22 words).
- Rules: H2 + intro line (18 words) + 3 cards (10–20 words).
- Who: H2 + 3 photo cards (13–15 words) + plan chips.
- FAQ: 6 questions, answers 20–30 words (two were definitions: escrow, oracle).
- Closing: H2 + body line + button.

**How it works**: eyebrow + 40-word intro; 3 role cards (15 words each); diagram intro (17 words) + 22-word caption; 3 rule cards (12–30 words); worked example intro + 30-word note; 3 deadline bullets (up to 40 words); developer intro (33 words) + a 6-row contract table always open; CTA with body line.

**App (`/app/...`)**
- One strip under the header, but carrying three things: network badge, **the testnet line**, Demo controls button.
- Connect gate: H1, 15-word line, 3 feature bullets, button.
- Dashboard: H1 + "Signed in as …" (the header chip already says it), USD note under the stats, "Active" badge on every active agreement.
- Composer: 17-word intro under the H1, visible "Start from" label, milestones intro line, visible "Reviewer n" / "Reviewer n address" labels on every reviewer row, review panel with "Balance after locking" (repeats the budget field's balance) and a per-milestone list (repeats the amounts shown in the share fields), a 25-word note, **the testnet line**.
- Agreement: header with a second network badge, the description (also in Details), "Created" date (also in Details); "Acting as" card with a "You: Funder." line and a 17-word hint; budget card and refund dialog with **the testnet line**; every milestone card with **the testnet line** next to value-moving buttons, a waiting note on every locked card ("Waiting for the builder to submit.", "This milestone is signed off by …", which repeated the rule row just above), deliverable, evidence, note and a submission timestamp even when released.
- Dialogs: submit (17-word description), request changes (15), refund (20).
- Repeated messages: toast + screen for locking (redirect already opens the agreement), submitting (card says "In review"), a signature short of the threshold (seal stamps), a change request (card says "Changes requested"), a refund ("cancelled" banner and refunded segments).
- Two-sentence empty and error states (empty dashboard, history, unknown agreement, check not met, failed transaction).
- Demo controls hints of 7–13 words.

## 2. What changed

No feature or flow was removed. Words and chrome were.

### Shell
- **Demo chip:** `bg-primary/8 dark:bg-primary/15` with `text-primary-ink` (copied from Splitflow's `demo-chip.tsx`); nav links now 28px after the brand, same `nav-links.tsx` as Splitflow; brand link `whitespace-nowrap`.
- **Footer legal band:** testnet line removed; "Demo · simulated data" stays. Product line 17 → 10 words.
- **Marketing pages:** exactly one top bar (the header). The testnet line under the hero buttons is gone.

### Home (hero + 6 sections → hero + 5 sections)
- Hero: no eyebrow; sub 27 → 13 words; secondary CTA "See how it works" → "How it works"; no disclaimer line.
- **Removed "Outcomes"**: its three points now live in the lifecycle (escrow in step 1, receipt in step 4) and the rules section.
- Lifecycle: no intro line, steps 4–8 words, refund card 11 words. Moved onto the card band the outcomes used.
- Rules: no intro line, cards 4–10 words; "oracle" is explained on `/how-it-works`, where the mechanics live.
- Who: heading 7 → 5 words; cards 7–8 words; the bounty chip no longer repeats the card ("100% when PR #412 is merged").
- FAQ: 6 → 4 questions, answers 10–15 words. "What is escrow?" and "What is an oracle?" became the lifecycle step and the `/how-it-works` rule card. This is the only FAQ on the site.
- Closing: heading + button. One section divider instead of two.

### How it works
- No eyebrow; intro 40 → 14 words.
- Roles 6–8 words; diagram intro and caption one short line each; rule cards 6–16 words; example intro and note one line each; deadlines 3 → 2 bullets.
- For developers: 33 → 12-word line; the contract table sits behind "Show the contract interface".
- CTA: heading + button. The divider was removed.

### Credits
- Intro removed (the H1 says it); the photographer profile URL and the "used on" line under each photo removed (the "Photo by …" link stays).

### App (`/app/...`)
- **One bar, one pill.** The strip holds only "● Sepolia testnet", a pill that opens Demo controls. The testnet line and the separate network badge are gone.
- **Testnet line once per transaction:** only in the wallet prompt, when value moves. Removed from the composer, the budget card, the refund dialog and the milestone cards.
- Connect gate: feature bullets removed; line 15 → 5 words.
- Dashboard: "Signed in as …" removed; the USD note moved behind an info icon on "Locked in escrow"; status badge only for completed or cancelled agreements; "1 of 4 released".
- Composer: intro paragraph removed; "Start from" label screen-reader only; milestones "why" behind an info icon; reviewer labels screen-reader only with placeholders ("Reviewer 1", "0x…"); "Balance after locking" and the per-milestone list removed from the review panel (the budget field and share fields already show them); one consequence note kept: "You can only get back what hasn't been released."
- Agreement: second network badge, description and "Created" line removed from the header (all in Details); "Acting as" hint behind an info icon and the "You: …" line removed ("(you)" marks you on the party tiles); budget rows "Released" / "Refunded".
- Milestone cards: waiting notes only on the milestone that is up next; the "signed off by …" hint removed (the rule row says it); released and refunded cards shrink to title, amount, share, date and receipt (deliverable, evidence and note stay in History; the seals stay visible right after the stamp that released the share); share shown as "15%".
- Dialogs: submit "The share stays locked until sign-off.", changes "The money stays locked.", refund "This can't be undone." plus the refunded / stays-paid rows.
- **One message, once:** no toast after locking, submitting, a signature short of the threshold, a change request or a refund. Toasts stay for a release, a reminder (off-chain, nothing else shows it), CSV export and demo reset.
- Empty and error states: one line plus the next action ("No agreements yet." + *New agreement*, "Nothing has happened yet.", "The check didn't pass: {reason}." + *Try again*, "…Nothing changed." + *Try again*).
- Demo controls hints 4–6 words; reset confirmation 5 words.
- New shared component: `src/components/ui/info-tip.tsx` (from the pilot: Radix Popover behind an info icon, opens on click or tap).

French was rewritten to the same brevity in `src/i18n/dictionaries/fr.ts`; unused keys were removed from both dictionaries (typed: French must match the English shape).

## 3. After

| Page | Visible before | Visible after | Change | Total before | Total after | Chrome before | Chrome after |
|-|-:|-:|-:|-:|-:|-:|-:|
| Home | 490 | 279 | −43% | 624 | 329 | 80 | 63 |
| How it works | 515 | 254 | −51% | 516 | 316 | 80 | 63 |
| Credits | 137 | 73 | −47% | 137 | 73 | 80 | 63 |
| 404 | 31 | 19 | −39% | 31 | 19 | 80 | 63 |
| App: connect gate | 56 | 15 | −73% | 56 | 15 | 80 | 63 |
| App: dashboard | 176 | 147 | −16% | 177 | 148 | 82 | 65 |
| App: new agreement | 281 | 190 | −32% | 319 | 228 | 82 | 65 |
| App: agreement (grant, funder) | 378 | 234 | −38% | 378 | 234 | 82 | 65 |
| App: agreement (bounty, builder) | 249 | 166 | −33% | 249 | 166 | 82 | 65 |
| **Total** | **2,313** | **1,377** | **−40%** | **2,487** | **1,528** | **728** | **575** |

Marketing pages alone (home, how it works, credits, 404): 1,173 → 625 visible words (−47%). What remains in the app is mostly data: agreement and milestone titles, deliverables, amounts, dates and addresses.

Dictionary copy: **EN 3,259 → 2,465 words (−24%)**, FR 3,513 → 2,700 (−23%). Per section (EN): meta 145 → 145 · common 142 → 124 · home 645 → 358 · how 515 → 315 · credits 101 → 62 · app 1,271 → 1,021 · pricing 164 → 164 (internal, unlinked page, left as is) · seed 275 → 275 (demo data).

### Screenshots

- Before: `docs/screenshots/before/en-1440-light-page-home.png`, `docs/screenshots/before/en-1440-light-flow2-composer-grant.png`.
- After: `docs/screenshots/en-1440-light-page-home.png`, `docs/screenshots/en-1440-light-flow2-composer-grant.png`, and every other page and flow step in `docs/screenshots/` (EN 390/1440 light/dark, FR 390/1440 light).
