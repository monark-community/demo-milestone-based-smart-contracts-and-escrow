# MilestoneMint by Monark: site plan

Status: shipped on `develop`. This plan describes what the site does and is kept in sync with the code. A simplification pass (less text, context on demand) was applied on 2026-09-29: see `docs/simplification.md`.

- Product: **MilestoneMint**, Monark's staged-escrow module: funds are locked up front and released milestone by milestone as the work is validated.
- Authoritative description: https://www.monark.io/en/project/milestone-based-smart-contracts-and-escrow (source: `content/en/project/milestone-based-smart-contracts-and-escrow/` in the monark.io repo, milestones A–G).
- Branding: **Monark-branded** (`true`). `lovable-migration/monark-brand-guidelines.md` is binding.
- Stack: Next.js 16 (App Router, `src/`, TypeScript strict), pnpm, Tailwind CSS v4, shadcn/ui on the Monark UI registry, `lucide-react`.

---

## 1. Product brief

**Target user.** Anyone in the Monark community who pays for work that arrives in stages, and the people doing that work:

- **Funders:** the Monark builders' grant committee, a student association funding a workshop series, a local co-op hiring a carpenter, a guild posting a documentation bounty.
- **Builders:** the developer, student team, translator or contractor who delivers the work and wants to know the money is really there.
- **Reviewers:** the project lead, mentor or committee member who signs off on a deliverable, sometimes as one of several signers.
- **Students and developers** learning how conditional, role-based fund release works on-chain (Monark's education mission; the documentation frames MilestoneMint as a learning project in payout scheduling, permissions and multi-sig).

**Core job to be done.** *"When I fund work that happens in stages, put the whole budget aside where the builder can see it, and pay each part only when it is delivered and signed off, without either side having to trust the other or a middleman."*

**Domain concepts** (each is explained in plain words the first time the site uses it):

| Concept | Meaning in MilestoneMint |
|-|-|
| Agreement | A small smart contract (a program on the blockchain) between a funder and a builder. It holds the budget and the milestone plan. |
| Escrow | The budget locked inside the agreement. Neither side can take it out alone; it can only be released or refunded by the rules. |
| Milestone | One stage of the work: title, deliverable, deadline, share of the budget (percent) and who validates it. |
| Validation rule | Who can approve a milestone: **the funder**, **reviewers** (k of n signatures, the multi-sig case) or an **automatic check** (an oracle that reads a public fact, such as "pull request merged"). |
| Submission | The builder marks a milestone as delivered, with a link to the evidence and a note. |
| Release | The transaction that pays a milestone's share to the builder. It happens automatically when the rule is satisfied. |
| Changes requested | The validator sends the milestone back with a note. The money stays locked; the builder can resubmit. |
| Refund | The funder cancels what is left: every milestone not yet released goes back to the funder. Released money is never clawed back. |
| Overdue | A milestone past its deadline and not yet submitted. It triggers a reminder and lets the funder cancel the rest. |
| History | Every event (locked, submitted, approved, changes requested, released, refunded) with time, actor and transaction hash, exportable to CSV. |

**What the Lovable version got wrong or left out.**

- A generic blue dashboard with a dollar-sign logo: nothing Monark about it and nothing that explained escrow to a newcomer.
- Nothing worked. "New project" validated percentages and then only logged to the console; "Approve & release funds" showed a toast and changed nothing; the wallet was hard-wired as connected to "JohnDoe".
- No money was ever actually *locked*: amounts were in USD with no token, no deposit step and no visible escrow balance, which is the whole point of the product.
- Only one validator per milestone and no multi-signature approval or automatic (oracle) check, though both are in the documentation.
- No builder side: no way to submit a deliverable, attach evidence or answer a change request.
- No deadlines logic beyond a red "Overdue" badge, no refunds or cancellation, no history, no pending, confirmed or failed transaction states.
- English only, no disclaimers, nothing persisted, 2024 dates, and a demo banner that covered content.

## 2. Value proposition

**MilestoneMint lets Monark communities fund work in stages: the whole budget is locked where the builder can see it, and each part is paid the moment its milestone is signed off, so funders only pay for delivered work and builders never chase an invoice.**

Supporting benefits, as outcomes:

1. **Builders start work knowing the money is there.** The full budget sits in escrow from day one, visible to both sides.
2. **Funders only pay for what was delivered.** Each share unlocks on sign-off by the people you chose: you, a panel of reviewers, or an automatic check.
3. **Nobody argues about what happened.** Every submission, approval, release and refund leaves a timestamped receipt anyone can check and export.

## 3. Hero

- **Headline** (7 words): *Funding that unlocks as the work lands.*
  FR: *Des fonds qui se débloquent au fil du travail livré.*
- **Subheadline:** *Lock the budget once. Each stage is paid the moment it's signed off.*
  FR: *Bloquez le budget une seule fois. Chaque étape est versée dès qu'elle est validée.*
- No eyebrow and no disclaimer line under the buttons (the testnet notice lives in the wallet prompt only).
- **Primary CTA:** "Launch the demo" / « Lancer la démo » → `/{locale}/app`.
- **Secondary CTA:** "How it works" / « Fonctionnement » → `/{locale}/how-it-works`.
- **Visual:** the **unlock track**, built in code (SVG + React): a real agreement card ("Wiki module: offline mode · 6,000 tUSDC") whose budget is one horizontal bar split into four milestone segments sized by their share. Locked segments are hatched with a small padlock; the active one moves *Submitted → 2 of 3 signatures → Released*: its signature seals fill one by one, the padlock opens, and the segment turns solid orange while the "Locked / Released" counters tick. It loops calmly (about every 7 s) and renders its final state under `prefers-reduced-motion`. Product UI over a photo, because the segmented, unlocking budget *is* the idea. The mesh butterfly sits large and cropped behind it.

## 4. Page map

All routes live under `/{locale}` (`en`, `fr`). `/` and any locale-less path redirect to the visitor's preferred language (fallback English) via `src/proxy.ts`.

| Route | Purpose | Sections, in order |
|-|-|-|
| `/{locale}` | Home: explain staged escrow in 30 seconds and send people into the demo. | Hero with the unlock track · "How an agreement moves" (lock → deliver → sign off → release, with the refund branch; carries what the old "three outcomes" said) · "Choose who signs off" (funder, reviewers, automatic check) · "Built for work in stages" (3 photo cards: grants, bounties, contract work) · FAQ (4 questions) · Closing call to action (heading + button) |
| `/{locale}/app` | The interactive demo: your agreements. | Connect gate (when disconnected) · Summary strip (locked in escrow, released, waiting on you, overdue; the USD note behind an info icon) · Needs your attention (reviews to sign, submissions due, overdue) · Agreements list (filter: all, funding, building, reviewing) with segmented budget bars |
| `/{locale}/app/new` | Create an agreement and lock the budget. | Templates (grant, bounty, contract work) · Basics (title, builder, token, budget) · Milestones (title, deliverable, deadline, share with its live amount, validation rule; the "why" behind an info icon) with the live allocation ruler · Review panel (total to lock, one consequence note) · Lock funds |
| `/{locale}/app/agreement/[id]` | One agreement from any side. | Header (title, status when not active, parties, contract address) · "Acting as" switch (funder, builder, reviewer; demo-only, explained behind an info icon) · Budget track (locked / in review / released / refunded) · Milestones (cards with rule, seals, evidence and actions for the current role; released cards shrink to title, amount, date and receipt) · History tab (timeline + CSV) · Agreement details tab (description, created date, full contract address) |
| `/{locale}/how-it-works` | For students, developers and careful funders: the mechanics. Justified because the documentation presents MilestoneMint as a learning project (payout scheduling, role permissions, multi-sig, conditional release), and Monark's audience includes students. | One-line intro · Three roles · Life of a milestone (state diagram) · Validation rules (funder, k-of-n, oracle, defined here) · Worked example (6,000 tUSDC, 15/35/30/20) · Deadlines and refunds · For developers (one line; the contract interface behind a "Show the contract interface" disclosure) · Call to action (heading + button) |
| `/{locale}/credits` | Photo, type, icon and brand-asset credits (asset rules). | Photos · Type and icons · Monark brand assets |
| `/{locale}/pricing` | **Internal strategy review only.** Never linked, excluded from the sitemap, `noindex, nofollow`. | "Free, part of Monark" card · What it costs to use (gas only, 0% fee on releases) · Supported deployments for partners · Reasoning |
| 404 | Friendly not-found with the vertical Monark logo and links home and to the demo. | |

**Header** (standard Monark navbar, guidelines §2 and §10 as updated 2026-09-29): butterfly mark + "MilestoneMint" on one line (no "by Monark" in the header; aria-label "MilestoneMint, by Monark: home") → 28px → links *Overview*, *How it works*, *Demo* left-aligned (active in `foreground`) · right: Demo chip · EN/FR switch · 36px theme toggle · primary *Launch demo*. Inside `/app` the primary action becomes the `connect-wallet` component. Below `lg`: brand + menu button only; the sheet holds the links, Demo chip, EN/FR, theme toggle and the action. Demo chip tint: `primary` at 8% in light mode, 15% in dark.

**App bar** (inside `/app` only, the one bar under the header): a single pill, "● Sepolia testnet", that opens the demo controls (slow network, fail the next transaction, reset). No testnet strip.

**Footer** (three bands): product line + links (Overview, How it works, Demo, Credits) · "MilestoneMint is built by Monark", Monark logo + tagline, links to the project page on monark.io and the GitHub repo, social icons · "© {year} Monark · Open source", "Demo · simulated data", photo credits link. The testnet line is not in the footer.

## 5. Feature highlights

| Feature | User benefit | Where it appears | Proven by flow |
|-|-|-|-|
| Budget locked up front | Builders start knowing the money is there | Hero track; composer "Lock funds"; agreement budget track | Flow 2 |
| Milestones with shares, deadlines and rules | The plan both sides agreed on is the one that pays | Composer ruler; `/how-it-works` worked example | Flow 2 |
| Submit with evidence, request changes | Clear hand-offs instead of email threads | Agreement milestone cards (builder and funder views) | Flow 3 |
| Multi-signature and automatic checks | No single person releases money alone, or no person needed at all | Home "three ways to validate"; seals on the agreement page | Flow 4 |
| Deadlines, reminders and refunds | Stalled work doesn't trap the budget | Dashboard "Needs your attention"; agreement actions | Flow 5 |
| History with receipts and CSV | Anyone can check every payment later | Agreement History tab | Flows 3–5 |

## 6. Key flows

All transactions go through a simulated wallet prompt ("Confirm in your wallet": action summary, estimated network fee, the testnet disclaimer, which appears only here and only when value moves, *Confirm* / *Reject*), then a pending state with a transaction hash (1.2–2.4 s; 3–6 s with "slow network"), then confirmed or failed. Demo controls let the visitor make the next transaction fail on-chain; rejecting in the wallet prompt always produces the "rejected" failure. Nothing changes state until a transaction confirms.

1. **Connect a wallet.** `/app` → *Connect demo wallet* → prompt "Sign in to MilestoneMint" → *pending* ("Waiting for signature…") → *connected*: the header shows the `connect-wallet` chip (Jazzicon + `0x4C1d…e82B`). *Failed*: rejecting shows "You declined the sign-in request. Nothing was shared." with *Try again*.
2. **Create an agreement and lock the budget.** `/app/new` → template (grant, bounty, contract work) or blank → title, builder (name + address validated as `0x` + 40 hex), token (tUSDC, tDAI, tETH), budget → milestones (title, deliverable, deadline after today and in order, share %, rule: funder / k-of-n reviewers with their addresses / automatic check with its condition) → the allocation ruler shows unallocated budget hatched until the shares total exactly 100% → review panel lists each milestone's amount → *Lock 6,000 tUSDC* → wallet prompt → *pending* ("Locking funds in escrow…", hash) → *confirmed*: redirect to the new agreement (no toast: the page is the confirmation). *Failed*: "Locking failed on the simulated network. No funds left your wallet." with *Try again*; the form stays filled. Insufficient demo balance is a validation error before any prompt.
3. **Deliver, get changes requested, resubmit.** Agreement → act as *Builder* → *Submit for review* on the current milestone → evidence link + note → wallet prompt → *pending* → *confirmed*: milestone shows "In review". Act as *Funder* → *Request changes* with a note → *confirmed*: milestone shows "Changes requested" with the note, money still locked. Builder resubmits → back to "In review". *Failed* at any step: "The transaction failed. Nothing changed; the milestone is exactly as it was." with *Retry*.
4. **Sign off with several reviewers or an automatic check, and release.** On the grant (rule: 2 of 3 reviewers) → act as *Reviewer* → *Approve* → *pending* → *confirmed*: a seal fills ("2 of 3 signatures"), and because the threshold is met the same transaction releases the share: the segment's padlock opens, it turns solid, "Released 2,100 tUSDC to Léa Tremblay" with a receipt in History. With one signature short, the milestone waits as "1 of 3 signatures" and *Ask Karim to sign (simulated)* lets a co-reviewer approve. On a milestone with an automatic check → *Run check* → *pending* ("Asking the oracle…") → *passed*: release follows; *not met*: "The check didn't pass: pull request #412 is still open." Money stays locked.
5. **Handle an overdue milestone: remind, then cancel and refund.** Dashboard "Needs your attention" shows the overdue workshop → agreement → *Send reminder* (off-chain; toast "Reminder sent to Concordia Blockchain Club") → *Cancel and refund the rest* → confirm dialog listing what goes back and what stays paid → wallet prompt → *pending* → *confirmed*: unreleased segments turn to "Refunded", agreement status "Cancelled", funder balance goes up. *Failed*: "Refund failed. The funds are still locked in the agreement." History tab → *Export CSV*.

## 7. Content (EN / FR)

The shipped copy lives in `src/i18n/dictionaries/en.ts` and `fr.ts` (typed: French must satisfy the English shape). Draft copy for the main sections:

### Home

| Slot | English | Français |
|-|-|-|
| H1 | Funding that unlocks as the work lands. | Des fonds qui se débloquent au fil du travail livré. |
| Sub | Lock the budget once. Each stage is paid the moment it's signed off. | Bloquez le budget une seule fois. Chaque étape est versée dès qu'elle est validée. |
| CTAs | Launch the demo · How it works | Lancer la démo · Fonctionnement |
| Lifecycle H2 | How an agreement moves | Le parcours d'une entente |
| Steps | Lock the budget (it sits in escrow, held by the contract) · Deliver a milestone · Sign it off (or send it back with a note) · Release the share (paid to the builder, with a receipt). If the work stalls: the funder can cancel and get back what isn't released. | Bloquer le budget · Livrer un jalon · Le valider · Verser la part. Si le travail s'enlise : le financeur peut annuler et récupérer ce qui n'est pas versé. |
| Rules H2 | Choose who signs off | Choisissez qui valide |
| Rules | **The funder.** Quick, for small bounties. · **A panel of reviewers.** 2 of 3 must agree. No one releases money alone. · **An automatic check.** An oracle confirms a public fact, like a merged pull request. | **Le financeur.** Rapide, pour les petites primes. · **Un comité de valideurs.** 2 sur 3 doivent être d'accord. Personne ne verse seul. · **Une vérification automatique.** Un oracle confirme un fait public, comme une pull request fusionnée. |
| Who H2 | Built for work in stages | Pensé pour le travail par étapes |
| Cards | **Builder grants.** Fund a module in stages, signed off by mentors. · **Open-source bounties.** Paid the moment the pull request is merged. · **Local contract work.** A co-op pays its carpenter stage by stage. | **Subventions aux bâtisseurs.** Financez un module par étapes, validées par des mentors. · **Primes open source.** Versée dès que la pull request est fusionnée. · **Travaux locaux.** Une coop paie son menuisier étape par étape. |
| Closing | Lock your first budget in two minutes. / Launch the demo | Bloquez votre premier budget en deux minutes. / Lancer la démo |

**FAQ** (the only FAQ on the site; "What is escrow?" and "What is an oracle?" moved into the lifecycle step and the sign-off rules, where the terms first appear)

1. *Is this real money?* No. It's a testnet demo: simulated funds, and nothing leaves your browser. / *Est-ce de l'argent réel ?* Non. C'est une démo sur testnet : fonds simulés, et rien ne quitte votre navigateur.
2. *What if the funder never approves?* Pick reviewers or an automatic check instead, and set deadlines. / *Et si le financeur ne valide jamais ?* Choisissez plutôt des valideurs ou une vérification automatique, et fixez des échéances.
3. *Can the funder take the money back?* Only what hasn't been released. Released shares are the builder's for good. / *Le financeur peut-il reprendre l'argent ?* Seulement ce qui n'a pas été versé. Les parts versées restent au prestataire.
4. *Does MilestoneMint take a cut?* No. The builder gets 100% of each share; the only cost is the network fee (gas). / *MilestoneMint prend-il une commission ?* Non. Le prestataire reçoit 100 % de chaque part ; seul coût : les frais de réseau (gas).

### App: key strings

| Slot | English | Français |
|-|-|-|
| Connect gate | Connect to see your agreements · Nothing is signed for real. | Connectez-vous pour voir vos ententes · Rien n'est signé pour de vrai. |
| Summary | Locked in escrow · Released · Waiting on you · Overdue | Bloqué en séquestre · Versé · En attente de vous · En retard |
| Empty dashboard | No agreements yet. + *New agreement* | Aucune entente pour l'instant. + *Nouvelle entente* |
| Attention empty | Nothing is waiting on you. | Rien ne vous attend. |
| Acting as | Acting as · Funder · Builder · Reviewer; info icon: In the real app, each person signs from their own wallet. | Vous agissez comme · Financeur · Prestataire · Valideur ; icône d'info : Dans l'app réelle, chacun signe depuis son propre portefeuille. |
| Milestone states | Locked · In review · Changes requested · Released · Refunded · Overdue | Bloqué · En revue · Modifications demandées · Versé · Remboursé · En retard |
| Wallet prompt | Confirm in your wallet · Estimated network fee · Confirm · Reject | Confirmez dans votre portefeuille · Frais de réseau estimés · Confirmer · Refuser |
| Disclaimer (wallet prompt only, when value moves) | Testnet demo · not financial advice · no real funds | Démo sur testnet · ceci n'est pas un conseil financier · aucun fonds réel |
| Pending | Waiting for the network… | En attente du réseau… |
| Released | Released {amount} to {name} | {amount} versés à {name} |
| Failed | The transaction failed on the simulated network. Nothing changed. | La transaction a échoué sur le réseau simulé. Rien n'a changé. |
| Rejected | You rejected the request in your wallet. Nothing was sent. | Vous avez refusé la demande dans votre portefeuille. Rien n'a été envoyé. |
| Check not met | The check didn't pass: {reason}. + *Try again* | La vérification n'a pas abouti : {reason}. + *Réessayer* |
| History empty | Nothing has happened yet. | Rien ne s'est encore passé. |
| Unknown agreement | We couldn't find this agreement. A demo reset may have removed it. + *Back to your agreements* | Cette entente est introuvable. Une réinitialisation de la démo l'a peut-être supprimée. + *Retour à vos ententes* |
| Storage error | Your browser blocked local storage, so the demo will forget changes when you leave. | Votre navigateur bloque le stockage local : la démo oubliera vos changements à la fermeture. |

The complete list (form validation, demo controls, tabs, toasts, how-it-works and credits copy) is in the dictionaries.

## 8. Aesthetics (within the Monark guidelines)

Colour, type, logo, header and footer are fixed by the guidelines: cream / espresso tokens derived from `#f88d10` with `--surface-tint: 1` (§3 token block pasted over `theme.json`, since `theme-2026` won't be published), Nunito Sans 400/600/700/800, pill actions, 1rem cards, borders not shadows, flat orange only. Status colours are muted green (released) and amber (in review / overdue), always with a text label.

- **Layout and rhythm.** Home alternates statement bands and dense bands: asymmetric hero (copy left, unlock track right; stacked on mobile) → a full-width horizontal lifecycle diagram on a card band → three rule cards, each with a tiny seal diagram → three photo cards → FAQ in one 68ch column → closing band. The branded section divider appears once, before the closing. The app is a working tool: dense two-column agreement page on desktop (milestones + a sticky budget/role rail), single column on mobile with generous touch targets.
- **Hero visual.** The unlock track (see §3).
- **Mesh butterfly.** Used once, on the home hero, large and cropped off the right edge at low opacity behind the track. Nowhere else.
- **Illustrations.** No reused Monark decorative illustrations beyond the mesh butterfly. The site draws its own flat orange line art: the lifecycle diagram (home and `/how-it-works`), the milestone state machine and the seal diagrams. No gradients, no glows.
- **Photography direction.** Warm, natural-light photos of people doing the kind of work that gets funded in stages: students demoing projects at a showcase, a developer at a quiet desk, two people shaping timber for a community build. Used only in the "who it's for" section, each paired with a line of copy and a sample milestone plan.
- **Signature moments.**
  1. **The padlock opening.** When a milestone is released, its segment of the budget bar un-hatches, the padlock icon opens, and the "Released" counter ticks up. Hero, and live on the agreement page.
  2. **Signature seals.** A k-of-n milestone shows k empty seal rings; each approval stamps one (150 ms), and the last stamp triggers the release in the same beat.
  3. **The allocation ruler.** In the composer, the budget bar shows unallocated budget as hatched; as the shares reach exactly 100% the hatch closes and the label settles to "Ready to lock".
- All motion 150–250 ms ease-out (the hero loop is slower and explanatory), and everything respects `prefers-reduced-motion`.

## 9. Assets

| Asset | Purpose | Placement |
|-|-|-|
| `public/images/grants.jpg` (Unsplash, Evan Marvell) | Builder grants use case | Home "who it's for" |
| `public/images/bounties.jpg` (Unsplash, Nubelson Fernandes) | Open-source bounties use case | Home "who it's for" |
| `public/images/contract-work.jpg` (Unsplash, Cohen Berg) | Local contract work use case | Home "who it's for" |
| `public/brand/*` Monark logos (standalone, horizontal light/dark, vertical) | Header pairing, footer, 404, favicon | Shell |
| `public/brand/monark-mesh.svg` | Home hero decoration | Home hero only |
| `public/brand/socials/*.svg` | Footer social icons | Footer |
| Open Graph image | Generated with `next/og` per locale | Metadata |

Icons: Lucide only. Diagrams built in JSX/SVG: unlock track, budget track, lifecycle, milestone state machine, seals. Full credits in `docs/assets.md` and on `/credits`.

## 10. Pricing strategy

MilestoneMint is **free, included in the Monark bundle**. Reasons: it is how Monark itself releases funding to its builders, so charging for it would tax the community it exists to fund; a fee skimmed off escrowed grants would undercut the trust promise ("the builder gets 100% of each share"); and it is open source. On a real network the only cost is gas. Partners who need a supported deployment (their own chain, custom oracle checks, onboarding a grant committee) go through Monark's partnership programme rather than a price list.

A designed `/{locale}/pricing` page exists **for internal review only**: not linked anywhere, excluded from `sitemap.xml`, `robots: { index: false, follow: false }`. No other page mentions prices.

## 11. Out of scope

- Real wallets, chains, signing, tokens or oracles (no wagmi/viem; the data layer in `src/lib/demo/` is shaped so it could be swapped in).
- Disputes and arbitration beyond "request changes" and "cancel and refund"; partial milestone payments; changing the plan after funds are locked.
- Email or push notifications: reminders are simulated in-app (toast + history entry).
- Accounts, profiles, multi-currency budgets, fiat on/off-ramps, invoicing and tax documents.
- A `/brand` page, a blog, or any backend.

## 12. Implementation notes (as shipped)

- `theme.json` from ui.monark.io was installed and the guidelines' §3 token block pasted over it in `src/app/globals.css`, plus muted `--success` / `--warning` status colours (always paired with a label). Registry components (`token-amount`, `network-badge`, `tx-status`, `wallet`, `connect-wallet`) are restyled to pills with localizable labels; `connect-wallet` was copied from its registry JSON because its bare `wallet` dependency doesn't resolve through the CLI.
- Dependencies beyond the stack: `next-themes` (theme toggle without a flash), `sonner` (toasts), `react-jazzicon` (required by the registry `wallet`), `radix-ui` / `class-variance-authority` / `tw-animate-css` (shadcn); `playwright` as a dev dependency for `pnpm screenshots`. No recharts: every chart-like element is drawn in code.
- The "Acting as" switch (funder / builder / reviewer) is a demo device: in the real product each role signs from its own wallet. When the visitor plays someone else, the wallet prompt shows that person as the signer. "Ask Karim to sign (simulated)" is a co-signer approving from their own wallet, so it skips the visitor's prompt.
- The simulated oracle reports "not met" once on the seeded bounty's API-reference milestone (to show the state), then passes.
- Toasts only when nothing else on screen confirms the result: a release ("Released {amount} to {name}"), a reminder (off-chain), a CSV export and a demo reset. Locking opens the new agreement; a submission, a signature short of the threshold, a change request and a refund show in the card, the seals or the "cancelled" banner, so they get no toast. Placement: bottom-right on desktop (under the sticky budget rail, away from the milestone being acted on), top of the screen under the header on phones (away from the action buttons and inline transaction status).
- Seeded data is created in the visitor's language on first load and on "Reset demo"; deadlines are relative to today so "overdue" and "due soon" always make sense.
- Context on demand: `src/components/ui/info-tip.tsx` (an info icon opening a Radix popover on click or tap) holds the "why" lines: the summary's USD note, the milestones rule and "Acting as". Waiting notes ("Waiting for the builder to submit.") show only on the milestone that is up next.
- Screenshots live in `docs/screenshots/`: every page and flow at 390 and 1440 px, light and dark, in English; home, dashboard, a multi-signature release and the composer in French. The script also checks every capture for horizontal overflow.
