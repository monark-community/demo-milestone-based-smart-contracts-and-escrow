# MilestoneMint by Monark

**Funding that unlocks as the work lands.** MilestoneMint is Monark's staged-escrow module: a funder locks a grant, bounty or contract budget once, splits it into milestones, and each milestone's share is paid to the builder the moment it is signed off, by the funder, by k of n reviewers, or by an automatic (oracle) check. Everything leaves a receipt both sides can check.

This repository is the **demo site**: a Next.js app with a fully simulated wallet, chain and oracle. No real funds, no real signatures, no backend.

- Project page: https://www.monark.io/en/project/milestone-based-smart-contracts-and-escrow
- Live demo: https://milestonemint.monark.io
- Site plan (what shipped and why): [`docs/site-plan.md`](docs/site-plan.md) · asset credits: [`docs/assets.md`](docs/assets.md) · screenshots: [`docs/screenshots/`](docs/screenshots/)

## Run it locally

Requires Node.js 22 and pnpm 10.

```sh
pnpm install
pnpm dev            # http://localhost:3000
```

Checks and production build:

```sh
pnpm lint
pnpm typecheck
pnpm build && pnpm start
```

Screenshots (Playwright, against a running production server):

```sh
pnpm build && pnpm start -p 3143
pnpm screenshots    # BASE_URL defaults to http://localhost:3143; ONLY=en-1440-light to filter
```

No environment variables are needed. `NEXT_PUBLIC_SITE_URL` optionally overrides the canonical URL (default `https://milestonemint.monark.io`).

## What you can do in the demo

1. **Connect** a demo wallet (sign-in prompt; rejecting shows the failure state).
2. **Create an agreement**: pick a template (builder grant, bounty, contract work), set the builder, token and budget, split it into milestones with deadlines, shares (must total exactly 100%) and a sign-off rule, then **lock the funds**.
3. **Deliver and review**: as the builder, submit a milestone with evidence; as the funder, request changes or approve and release.
4. **Multi-signature and oracle checks**: add your signature to a 2-of-3 review (the last signature releases the share in the same transaction), or run an automatic check that can come back "not met".
5. **Deadlines and refunds**: send a reminder on an overdue milestone, then cancel and refund everything not yet released. Every agreement has a filterable history with CSV export.

Demo controls (in the app bar) make the network slow, make the next transaction fail, or reset the demo.

## How the simulation works

All demo logic lives in `src/lib/demo/`, behind a small typed API shaped like an escrow contract, so wagmi/viem could replace it without touching the UI:

| File | Role |
|-|-|
| `types.ts` | Domain model: agreements, milestones, rules (`funder`, `reviewers` k-of-n, `check`), history events. Amounts are base units as strings. |
| `store.ts` | External store (`useSyncExternalStore`) persisted to `localStorage` (every access in try/catch), plus the wallet-prompt channel. |
| `chain.ts` | `useTx()`: wallet prompt → pending with a hash (1.2–2.4 s, 3–6 s on "slow network") → confirmed, reverted, or "check not met". |
| `wallet.ts` | Simulated connect / disconnect. |
| `ops.ts` | One function per contract call: `lockAgreement`, `submitMilestone`, `approveMilestone`, `requestChanges`, `releaseByCheck`, `cancelAndRefund`, plus the off-chain `sendReminder`. |
| `agreements.ts` | Read-side helpers: basis-point splitting, totals, overdue logic, "needs your attention". |
| `seed.ts` | Four believable example agreements, created in the visitor's language, with deadlines relative to today. |
| `tokens.ts` | Testnet tokens (`tUSDC`, `tDAI`, `tETH`) and parsing. |

State changes only after a transaction confirms. The "Acting as" switch on an agreement lets one visitor play the funder, the builder and the reviewers; in a real deployment each would sign from their own wallet.

## Project structure

```
src/
  app/[locale]/          # en + fr routes: home, how-it-works, app (dashboard, new, agreement/[id]), credits, pricing (unlinked), 404
  app/                   # globals.css (Monark tokens), sitemap, robots, icon
  components/site/       # standard Monark header, footer, brand, Demo chip, locale switch, theme toggle
  components/demo/       # the interactive app: dashboard, composer, agreement view, milestone card, history, wallet prompt
  components/diagrams/   # budget track, seals, lifecycle, state machine (flat SVG/JSX)
  components/ui/         # shadcn + @monark/ui registry components
  i18n/                  # typed EN/FR dictionaries
  lib/demo/              # simulated chain, wallet and escrow contract (see above)
  proxy.ts               # redirects / to the visitor's language
scripts/screenshots.mjs  # Playwright visual check of every page and flow
```

Branding follows Monark's guidelines (cream / espresso tokens derived from Monark orange, Nunito Sans, flat orange, standard header and footer). `/pricing` exists for internal review only: it is not linked anywhere, not in the sitemap, and marked `noindex, nofollow`.

## Deploy to Vercel

Import the repository in Vercel and deploy with the framework defaults (Next.js, `pnpm install`, `pnpm build`). No `vercel.json` and no environment variables are required. The Node version is pinned in `package.json` (`engines.node: 22.x`).

## License and credits

Open source by the Monark community. Photos from Unsplash (see [`docs/assets.md`](docs/assets.md) and `/credits`).
