# Kukis — Website

Marketing site for **Kukis** — consent after cookies. Built from the project's own docs:
[`context.md`](../context.md) (facts), [`brand-guidelines-final.md`](../brand-guidelines-final.md) (brand), [`design.md`](../design.md) (system).

Live site: https://zackalatrash.github.io/kukis-site/

## Stack
- **Vite + React 18 + TypeScript**
- **Tailwind CSS v4** (design tokens = Milk & Cookie palette, in `src/index.css` `@theme`)
- **Framer Motion** (scroll reveals + interactions, reduced-motion aware)
- **Lucide** (SVG icons — no emoji as structural icons)

## Commands
```bash
npm install     # install deps
npm run dev      # local dev server → http://localhost:5185
npm run test     # run unit tests
npm run build    # typecheck + production build
npm run preview  # preview the production build
```

## Structure
```
src/
  data/site.ts              # all copy (facts from context.md — nothing invented)
  index.css                 # Tailwind + Milk & Cookie design tokens (@theme)
  lib/                      # cn(), usePrefersReducedMotion()
  components/
    ui/                     # Button, Section, Reveal, ConsentChip, Logo, CrumbCursor
    layout/                 # Nav, Footer
    sections/               # one file per landing-page section (redesign these individually)
  App.tsx                   # composes the sections in order
```

## Sections (in order) — redesign one at a time
1. `Hero` — interactive "decline the cookie banner → still captured"
2. `InvisibleHalf` — the three core stats
3. `Insight` — cookie consent ≠ marketing consent
4. `HowItWorks` — 3 steps
5. `Widgets` — the four capture surfaces
6. `WhyKukis` — vs Klaviyo comparison
7. `ConsentByDesign` — trust band
8. `BuiltFor` — for / not-for
9. `Faq` — accordion
10. `FinalCta` — book a demo

## Demo request form
The "Book a demo" CTAs open a request-demo form in a modal.

By default, if `VITE_DEMO_FORM_ENDPOINT` is empty, submissions open a pre-filled
email to the fallback address in `src/data/site.ts`.

For a hosted form backend, create a free static-form endpoint and set
`VITE_DEMO_FORM_ENDPOINT` to it. The code POSTs JSON and treats any `2xx`
response as success, so several services are drop-in:

```bash
# Formspree (free 50/mo, dashboard + spam filtering)
VITE_DEMO_FORM_ENDPOINT=https://formspree.io/f/xabc1234

# FormSubmit (free, unlimited) — the address receives the submissions
VITE_DEMO_FORM_ENDPOINT=https://formsubmit.co/ajax/demos@yourdomain.com
```

Set this as a build environment variable in your host's dashboard
(e.g. Cloudflare Pages → Settings → Environment variables) before building.

## Deploying
`base` in `vite.config.ts` is `/`, which is correct for serving at the root of
a custom domain (Cloudflare Pages, or GitHub Pages with a custom domain).
Build command: `npm run build`. Output directory: `dist`.
Use `base: "/kukis-site/"` only if serving from the `*.github.io/kukis-site/`
project URL without a custom domain.

## Notes
- No fabricated testimonials, logos, metrics, or legal-review/DPA/hosting claims — per `context.md`.
