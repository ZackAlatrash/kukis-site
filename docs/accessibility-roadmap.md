# Accessibility Remediation Roadmap — Kukis Landing Site

**Source:** [docs/accessibility-audit.md](./accessibility-audit.md) (WCAG 2.2 AA, 2026-07-11)
**Status:** ✅ Implemented & verified (all 7 phases). See "Implementation log" at the bottom.
**Goal:** Close every CRITICAL, IMPORTANT, and SUGGESTION finding, in dependency order, grouped so related edits land in one pass.

This roadmap is grounded in verified repo facts (see "Verified context" below). Where the audit proposes specific hex values or an approach, they are carried as **proposals to confirm**, not decisions — flagged inline.

---

## Verified context (drives the ordering)

| Fact | Source | Impact on plan |
|---|---|---|
| Palette is Tailwind v4 `@theme` tokens in `src/index.css:4-16`; utilities like `text-crumb`/`bg-consent` derive from them | `index.css` | Changing a token propagates site-wide — cheap fixes, but risky for reused tokens |
| `amber` & `consent` are reused on **dark** sections where they **pass** (5–8.5:1) | audit table + token usage | Cannot globally darken them; must add **new** text-on-light tokens |
| `crumb` is only used as muted text on **light** backgrounds (×51 usages) | grep | Safe to darken the `--color-crumb` token globally |
| `bg-cherry` (failing) appears at `Button.tsx:12` (hover), `DemoRequestForm.tsx:334/404` (hover), `BuiltFor.tsx:143` (persistent) | grep | Small, enumerable edit set |
| `<FinalCta>` (nesting `<Footer>`) sits **outside** `<main>` but inside `<div className="relative z-[2]">`; modal is a **sibling** of that wrapper (`App.tsx:73-75`) | `App.tsx` | That wrapper is the clean `inert` target; footer hoist must stay inside it |
| Demo modal opens via **global click-delegation** on `a[href="#demo"]` — no stable trigger element | `App.tsx:31-44` | Focus-restore must capture `document.activeElement` at open, not a ref |
| Commands: `npm run build` = `tsc && vite build` (typecheck), `npm run test` = `vitest run` | `package.json` | Verification uses typecheck + existing unit tests + browser preview |
| Only test is `src/lib/demoRequest.test.ts` (form logic); **no a11y test harness, no lint script** | repo | Behavioral a11y fixes verified manually in preview; automated a11y tooling is optional, not assumed |

**Open decisions to confirm before/into implementation (no assumptions made here):**
1. Replacement colors — audit proposes `amber-ink ≈ #8A5A12`, `consent-ink ≈ #1F7A4F`, `crumb → #6F5C48`. These must be **recomputed against final backgrounds** and confirmed as a design call.
2. Whether darkening muted text is done by (a) darkening the `crumb` token, or (b) switching muted text to the existing `cocoa-soft`. Design choice.
3. Modal: keep the custom `role="dialog"` + hand-rolled trap, **or** migrate to native `<dialog>`/`showModal()`. Engineering choice (both satisfy WCAG).
4. Whether to add automated a11y checks (e.g. `vitest-axe`) as part of Phase 7, or verify manually only.

---

## Workstreams & dependency graph

```
P1 Color/contrast tokens ──┐ (independent, start first)
P2 Modal focus ────────────┼─ coordinate on inert wrapper ── P3 Landmarks
P3 Landmarks/skip-link ────┘
P4 Form a11y ── shares DemoRequestForm.tsx with P1f (do together)
P5 Text resize (px→rem) ─── independent, any time
P6 SUGGESTION polish ────── independent, small
P7 Verification/regression ─ after each phase + final gate
```

Parallelizable: **P1, P2, P5, P6** touch mostly disjoint files and can proceed independently.
Coordination points: **P2↔P3** (inert wrapper must also cover the hoisted footer); **P1f↔P4** (both edit `DemoRequestForm.tsx` — batch them).

---

## Phase 1 — Color & contrast system  *(CRITICAL C1, + non-text-contrast half of I6)*

The highest-leverage phase; foundational because it touches `index.css` tokens plus many components. **No dependency — do first.**

Order within the phase: **define tokens (1a/1b) before swapping usages (1c/1d)**, because the usage swaps reference the new tokens.

| ID | Task | Files | Depends on |
|---|---|---|---|
| 1a | Add text-on-light tokens: `--color-amber-ink` and a darker green (e.g. `--color-consent-ink`). Do **not** alter existing `--color-amber`/`--color-consent` (they pass on dark sections). | `index.css:4-16` | — |
| 1b | Darken muted text: either darken `--color-crumb` token, or migrate muted usages to `cocoa-soft` (decision #2). | `index.css:14` (+ usages if migrating) | — |
| 1c | Swap amber-on-light text sites to `amber-ink` | `WhyKukis.tsx:56,68-69,99,116`, `BuiltFor.tsx:56`, `HowItWorks.tsx:69,206` | 1a |
| 1d | Swap consent text + white-on-green fills to `consent-ink` | `ConsentChip.tsx:17`, `BuiltFor.tsx:129`, `HowItWorks.tsx:351`, `Insight.tsx:153` | 1a |
| 1e | Stop primary CTA lightening to failing `cherry`: keep `cherry-deep` on hover; use `cherry-deep` for persistent CTA | `Button.tsx:12`, `DemoRequestForm.tsx:334,404`, `BuiltFor.tsx:143` | — |
| 1f | Strengthen non-text contrast of input/checkbox borders to ≥3:1 | `DemoRequestForm.tsx:38`, `index.css:34` (global default), `BuiltFor.tsx:78` | — (edit with P4) |

**Risk / regression:** darkening the `crumb` token changes muted text sitewide (light sections) — visually review. Confirm dark sections are **unchanged** (they use amber/consent, which are untouched).
**Verify:** recompute ratios for every changed pairing ≥ 4.5:1 (normal) / ≥3:1 (large/non-text); visual pass in browser preview on both light and dark sections.

---

## Phase 2 — Demo modal focus management  *(CRITICAL C2 — WCAG 2.1.2 / 2.4.3 / 4.1.2)*

Self-contained behavioral change. **No dependency**, but coordinate the `inert` target with Phase 3.

| ID | Task | Files |
|---|---|---|
| 2a | On open: move focus into dialog; trap Tab/Shift+Tab; restore focus to `document.activeElement`-at-open on close; consolidate the existing Escape handler | `DemoRequestModal.tsx:13-30,43` |
| 2b | Mark background wrapper `inert` while open (the `div.relative.z-[2]`, which is a sibling of the modal so the modal stays interactive) | `App.tsx:61-74` (+ prop or effect) |

**Decision #3** applies (custom trap vs native `<dialog>`). If native `<dialog>`, 2a/2b collapse (trap + background inert + Escape come free) but the open/close wiring in `App.tsx` changes.
**Verify:** keyboard walkthrough in preview — open → focus lands in dialog → Tab cycles within → Escape closes → focus returns to trigger; confirm background not reachable by Tab. Screen-reader check if available.

---

## Phase 3 — Structural landmarks & bypass  *(IMPORTANT I1, I2)*

Small, high-value edits in `App.tsx` / `FinalCta.tsx` / `Footer.tsx`. **Coordinate with 2b** (the hoisted footer must remain inside the wrapper that gets `inert`).

| ID | Task | Files | Depends on |
|---|---|---|---|
| 3a | Add skip link as first focusable element; give `<main>` `id="main-content"` + `tabIndex={-1}` | `App.tsx:58-76` (+ `.sr-only`/`focus:not-sr-only` utility, confirm present in `index.css`) | — |
| 3b | Hoist `<Footer/>` out of `FinalCta` to a sibling of `<main>` (still inside `div.z-[2]` so P2's `inert` covers it) | `FinalCta.tsx:52-55`, `App.tsx:73-74`, `Footer.tsx` | coordinate w/ 2b |

**Verify:** landmark tree exposes `banner`/`main`/`contentinfo`; skip link appears on first Tab and jumps focus to `<main>`.

---

## Phase 4 — Form accessibility  *(IMPORTANT I3, I4, I5 + focus-ring half of I6)*

All within `DemoRequestForm.tsx`. **Batch with 1f** (same file). Independent of other phases.

| ID | Task | Location |
|---|---|---|
| 4a | On validation failure, focus the first invalid field | `handleSubmit`, `DemoRequestForm.tsx:95-100` |
| 4b | Announce errors to AT: `role="alert"` on each error `<p>` and/or a focusable error summary (pairs with 4a) | `DemoRequestForm.tsx:195-323` |
| 4c | Add visible required markers to the 5 required labels + a "* required" legend | `DemoRequestForm.tsx:180-312` |
| 4d | Replace `outline-none` in `fieldBaseClass` with a real `focus-visible` ring (Tailwind v4 utilities layer currently defeats the global `:focus-visible`) | `DemoRequestForm.tsx:30` |

**Verify:** submit empty form → focus lands on first invalid field, error announced; required fields visibly marked; keyboard focus ring visible on every field. Run `npm run test` (existing `demoRequest.test.ts` guards validation logic — ensure still green).

---

## Phase 5 — Text resize  *(IMPORTANT I7 — WCAG 1.4.4)*

Mechanical conversion of content `text-[Npx]` → rem-based sizing. **64 occurrences** across `Hero`, `Faq`, `WhyKukis`, `Insight`, `HowItWorks`, `BuiltFor`, `DemoRequestForm`, `CrumblingCrowd`. Independent, larger surface, lower risk. Sequenced after the criticals since it's high-volume/low-severity.

**Approach:** map each `text-[Npx]` to the nearest Tailwind rem step (`text-sm`/`text-base`/…) or `text-[Nrem]`; leave root/base px alone. Do file-by-file to keep diffs reviewable.
**Verify:** browser text-only zoom to 200% — no clipping/overlap; visual diff acceptable.

---

## Phase 6 — SUGGESTION polish  *(low severity, each independent)*

Group as one sweep; none block anything.

| Task | Files |
|---|---|
| Move focus to section on anchor nav (`tabIndex={-1}` on targets + `.focus()`) | `Nav.tsx:31-37,59-68` + section wrappers |
| Add `aria-controls` (+ ids) to disclosure toggles | `Nav.tsx:46-53`, `Faq.tsx:26-41` |
| `aria-hidden` decorative glyph `◆` | `CookieScrubHero.tsx:159` |
| Handle decorative emoji 🍪 (`aria-hidden` or `role="img"`) | `HowItWorks.tsx:372`, `CrumblingCrowd.tsx:32` |
| Prefer native checkbox + wrap in `role="group"` | `BuiltFor.tsx:62-98` |
| Gate `animate-pulse` under reduced motion (`motion-reduce:animate-none` or global CSS rule) | `CrumblingCrowd.tsx:274`, `HowItWorks.tsx:331` (or `index.css`) |
| `alt=""` on redundant placeholder image | `HowItWorks.tsx:279` |
| `aria-hidden` nav toggle icons (consistency) | `Nav.tsx:52` |
| `aria-live` or `aria-hidden` the auto-cycling inbox mock | `CrumblingCrowd.tsx:245-280` |
| Address narrow-screen figure clipping | `CrumblingCrowd.tsx:225` |

**Verify:** targeted preview checks per item; reduced-motion check with OS setting on.

---

## Phase 7 — Verification & regression (cross-cutting)

Run after each phase, and as a final gate:

1. `npm run build` — TypeScript typecheck + production build must pass.
2. `npm run test` — `vitest run` (guards `demoRequest` logic; keep green through P4).
3. Browser preview manual pass: keyboard-only journey (skip link → nav → sections → modal open/trap/restore → form errors), reduced-motion, 200% zoom, 320px reflow.
4. Recompute contrast ratios for all P1 changes.
5. **Decision #4:** optionally add automated a11y checks (e.g. `vitest-axe`) — not currently in the repo; adding is a scope choice, not assumed.

---

## Suggested execution sequence

1. **P1** (contrast tokens) — biggest impact, foundational.
2. **P2 + P3** together (share the `inert` wrapper / footer coordination).
3. **P4 + P1f** together (same file).
4. **P5** (px→rem sweep).
5. **P6** (polish sweep).
6. **P7** gate throughout + final.

**Effort shape (relative):** P2, P3 small; P1, P4 medium; P5 high-volume/low-risk; P6 many-small. Criticals (P1, P2) deliver the most coverage first; after them the site is close to clean WCAG 2.2 AA.

---

## Implementation log (completed)

All phases implemented and verified. Gate after every phase: `npm run build` (tsc typecheck + vite build) and `npm run test` (vitest) — green throughout; final browser verification via the dev server.

### Open decisions — as resolved
1. **Replacement colors (confirmed against real backgrounds):** `--color-crumb` `#9a8672 → #6f5c48` (~5.9:1 on milk, verified 5.73:1 rendered on cream for the sibling amber case); new `--color-amber-ink #8a5a12` (5.5–5.7:1 on light); new `--color-consent-ink #1f7a4f` (green text ~5.1:1, white-on-it ~5.3:1). Amber/consent originals kept for dark sections + decorative fills where they pass.
2. **Muted text:** chose **(a) darken the `--color-crumb` token** over switching to `cocoa-soft`, so a distinct muted tier is preserved (crumb ~5.9:1 vs cocoa-soft 8.3:1 vs cocoa 15:1). One token change fixed ~51 usages.
3. **Modal:** chose the **custom `role="dialog"` + hand-rolled focus trap** over native `<dialog>`, to avoid rewiring `App.tsx`'s state-driven open/close and the custom blurred backdrop. Focus-in + Tab-trap + focus-restore + background `inert` all live in `DemoRequestModal`, with `inert` removed before focus restore (verified end-to-end in the browser).
4. **Automated a11y tests:** chose **not** to add `vitest-axe`. The suite is pure-logic vitest with no DOM env (no jsdom/testing-library); adding axe means new infra the roadmap flagged as optional. Verification is typecheck + unit tests + browser pass.

### Corrections made after verifying repo context (audit was imprecise)
- **HowItWorks amber (audit C1-a: `:69`/`:206`):** the audit said these render on a light bg. The code shows the entire `HowItWorks` section (incl. the stacked mobile/reduced-motion layout) sits on `DARK_BG`, where amber passes (~8.5:1). **No change needed** — amber-ink was applied only to the genuine light-bg cases (`WhyKukis`, `BuiltFor`).
- **Global `*` border (audit I6):** did **not** strengthen `index.css` `*{border-color}` — that governs decorative card hairlines (exempt from 1.4.11). Strengthened only the interactive control borders (form inputs `border-chip/60`, error border alpha `0.9`, checkbox `border-chip/60`).
- **CrumblingCrowd (audit SUGGESTIONs: auto-cycling status, 🍪 subject, narrow clipping):** resolved all three by marking the whole decorative illustration stage `aria-hidden` (it has no interactive children). The section's meaning is carried by its real heading/copy. 320px reflow was already satisfied by `body{overflow-x:clip}` (verified: no horizontal scroll at 320px).
- **WhyKukis coverage grid (`:99`/`:116`):** the 50-token grid is `aria-hidden` decorative data-art with a text legend; kept bright amber (1.4.1 satisfied via adjacent text; decorative graphics exempt from 1.4.11). Real text (`:56` eyebrow, `:69` stat) moved to amber-ink.

### Browser verification results (dev server)
- Landmarks: skip link is first focusable and visible on Tab; `main#main-content[tabindex=-1]`; `footer` now exposes `contentinfo` (parent is a `div`, not a section); single `h1`.
- Modal: focus moves into dialog on open; background `inert`; body scroll locked; Escape closes; **focus returns to the "Book a demo" trigger**; `aria-modal` + `aria-labelledby` intact.
- Form: submit-empty shows a focusable error summary listing all 5 field errors as links; required `*` markers + legend render; `aria-invalid`/`aria-describedby` wired; submit/CTA stay `cherry-deep` (no failing hover).
- Contrast: amber-ink 5.73:1 rendered; crumb token darkened to `#6f5c48`.
- Reflow: no horizontal scroll at 320px or 1280px. No console errors.

### Note on Phase 5 scope
The px→rem sweep converted **91** `text-[Npx]` occurrences (more than the audit's estimate of 64 — it covered every file). `clamp()` display headings were intentionally left (they scale via `vw`).
