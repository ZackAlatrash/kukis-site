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
The final CTA renders a static request-demo form.

By default, if `VITE_DEMO_FORM_ENDPOINT` is empty, submissions open a pre-filled
email to the fallback address in `src/data/site.ts`.

For a hosted form backend, create a static form endpoint such as Formspree and set:

```bash
VITE_DEMO_FORM_ENDPOINT=https://formspree.io/f/xabc1234
```

For GitHub Pages, add the value as a repository secret or workflow environment
value before building.

## Notes
- No fabricated testimonials, logos, metrics, or legal-review/DPA/hosting claims — per `context.md`.
