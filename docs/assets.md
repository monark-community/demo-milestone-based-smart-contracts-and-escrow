# Assets

## Photography

All photos are from Unsplash under the free [Unsplash License](https://unsplash.com/license) (none are Unsplash+; all were downloaded from `images.unsplash.com`). They are resized to at most 1,800 px on the long edge (2,000 px for the portrait one), compressed, and served from `public/images/` with `next/image`. Photographers are credited on `/credits`, linked from the footer.

| File | Unsplash page | Photographer | Profile | Used on |
|-|-|-|-|-|
| `public/images/grants.jpg` | https://unsplash.com/photos/vG2SoCSpPEU | Evan Marvell | https://unsplash.com/@evan_marvell | Home, "Built for work that happens in stages": builder grants; `/credits` |
| `public/images/bounties.jpg` | https://unsplash.com/photos/UcYBL5V0xWQ | Nubelson Fernandes | https://unsplash.com/@nublson | Home, same section: open-source bounties; `/credits` |
| `public/images/contract-work.jpg` | https://unsplash.com/photos/m-yUGdPJOyE | Cohen Berg | https://unsplash.com/@cohenberg | Home, same section: local contract work; `/credits` |

## Monark brand assets

From `lovable-migration/brand-refs/` and the [monark-community/website](https://github.com/monark-community/website) repo, used per `monark-brand-guidelines.md`:

| File | Source | Used for |
|-|-|-|
| `public/brand/monark-mark.svg`, `src/app/icon.svg` | brand-refs `logos/svg/standalone/logo-branded-standalone.svg` | Header brand, favicon, wallet prompt, connect gate, OG image |
| `public/brand/monark-horizontal-{light,dark}.svg` | website `public/vectors/brand/horizontal/` | Footer Monark band |
| `public/brand/monark-vertical-{light,dark}.svg` | brand-refs `logos/svg/vertical/` | 404 page |
| `public/brand/monark-mesh.svg` | website `public/vectors/decorative/monark-mesh.svg` | Home hero only (once per site) |
| `public/brand/socials/*.svg` | website `public/vectors/socials/` | Footer social links (recoloured to `foreground` through a CSS mask) |

## Built in code

- Unlock track (home hero), budget track (dashboard rows and agreement rail), allocation ruler (composer), signature seals, lifecycle diagram (home), milestone state machine (`/how-it-works`): flat orange line art in SVG/JSX. The "locked" hatch is an SVG mask, not a gradient.
- Open Graph image: generated per locale with `next/og` (`src/app/[locale]/opengraph-image.tsx`).
- Icons: [Lucide](https://lucide.dev). Type: Nunito Sans via `next/font/google`.
