# Accessibility Re-Check — Kukis Landing Site (post-remediation)

**Standard:** WCAG 2.2 AA · **Date:** 2026-07-12
**Method:** 2 independent code-audit agents (semantics/ARIA/forms/keyboard + color/contrast/motion) re-scanning the current code, plus a live browser walkthrough — screenshots (desktop, mobile, modal, form-error state), a whole-DOM contrast sweep (compositing alpha + gradient backgrounds), landmark/focus/inert DOM assertions, and 320px reflow.

## Verdict

**All 20+ fixes from the prior remediation hold and are correctly implemented** — verified, not just present. Both agents independently confirmed the modal focus-trap logic, the `inert`-before-focus-restore ordering, the footer `contentinfo` landmark, the skip link, the form error-summary flow, every contrast token, px→rem completion, and motion gating. **No CRITICAL issues found.**

The re-check *did* surface **new lower-severity issues, concentrated in the hero components** (`Hero.tsx`, `CookieScrubHero.tsx`) and a few decorative/tinted spots — areas the original audit did not scrutinize deeply. None block AA on the main content; the two MEDIUMs are worth fixing.

---

## Confirmed holding (rendered-value verification)

| Area | Evidence |
|---|---|
| Contrast tokens | amber-ink **5.73:1**, consent-ink **5.14:1**, white-on-consent-ink **5.31:1**, crumb **5.94:1**, white-on-cherry-deep **5.13:1** (all computed on real bg) |
| Modal | Live: focus enters dialog, background `inert`, body scroll locked, Escape closes, **focus restored to trigger**; trap recomputes focusables each keydown; `inert` removed before restore |
| Landmarks | Skip link is first focusable & visible on Tab; `main#main-content[tabindex=-1]`; `footer` = `contentinfo`; single `h1`; no heading gaps |
| Form | Live: empty-submit → focused error summary lists all 5 errors as links; red borders + inline errors; required `*` + legend; `aria-invalid`/`aria-describedby` wired |
| px→rem (1.4.4) | `grep text-[Npx]` → **0** remaining |
| Motion | `animate-pulse` gated with `motion-reduce:animate-none` at both sites; CSS keyframes have reduced-motion blocks |
| Reflow (1.4.10) | No horizontal scroll at 320px or 1280px; no orientation lock (1.3.4) |

---

## New / remaining findings

> **Update (2026-07-12): M1, M2, L1 fixed & verified.** Added `--color-blueberry-ink #245a8f`; eyebrow now **5.86:1** (`Hero.tsx`, `CookieScrubHero.tsx`); `Hero.tsx` `◆` → `cherry-deep` + `aria-hidden`; the `CookieScrubHero` reveal container toggles `inert` with its reveal state (verified: hidden → `inert`, CTA unfocusable; revealed → focusable). Build + tests green, no visual regression. Remaining open: M3, M4, L2–L8.

### MEDIUM

**M1 — Invisible-but-focusable hero CTAs (WCAG 2.4.7 Focus Visible / 2.4.3)** ✅ FIXED
`src/components/sections/CookieScrubHero.tsx:163-179`. The hero reveal container starts `opacity:0` with `pointer-events:none` until scroll progress > 0.6, but contains real focusable controls — "Book a demo" and "See how it works" (`:171-176`) and the `ConsentChip`. `opacity:0` does **not** remove them from the tab order, and because they sit in the first viewport (not off-screen), tabbing to them does **not** scroll/reveal them. A keyboard user can land on completely invisible controls with no visible focus ring. *(Live DOM confirmed 9 focusable controls inside `opacity:0` subtrees; the hero CTAs are the real case — Reveal-wrapped controls further down mostly self-reveal when focus scrolls them into view.)*
Fix: toggle `inert` (or `visibility:hidden`, which removes from tab order) on the reveal container until it's revealed.

**M2 — Blueberry eyebrow on its blueberry-soft pill — 4.26:1 (WCAG 1.4.3)** ✅ FIXED (→ blueberry-ink, 5.86:1)
`src/components/sections/Hero.tsx:30` and `src/components/sections/CookieScrubHero.tsx:158`. `text-blueberry` (12px) on its own `bg-blueberry-soft` tint computes to ~4.26:1 (needs 4.5). The plain-background section eyebrows are fine (4.87); only these two tinted pills fall short. *(Live sweep: 4.28:1.)*
Fix: darken the eyebrow text (e.g. a `blueberry-ink ≈ #245a8f`, ~4.9:1 on the tint) or drop the tinted fill behind it.

**M3 — WhyKukis coverage-grid amber tokens — 1.89:1 (WCAG 1.4.11)**
`src/components/sections/WhyKukis.tsx:99` (the 50-token grid) and `:116` (legend icon). The amber `User` glyphs marking the "caught" half are ~1.9:1 on cream — below the 3:1 graphical-object minimum. The grid itself is `aria-hidden` (decorative, arguably exempt) and a text legend mitigates 1.4.1, but the **legend swatch at `:116` is not `aria-hidden`** and the visualization is hard to perceive for low-vision users. *(This was a consciously-kept item in the prior pass; flagging for reconsideration.)*
Fix: use `amber-ink` for the caught tokens + legend icon, or add a darker stroke.

**M4 — Focus not obscured under sticky nav (WCAG 2.4.11) — needs manual pass**
`src/components/layout/Nav.tsx` is `sticky top-0 z-40` (~70px, opaque when scrolled). `scroll-mt-24` protects section-anchor targets, but an arbitrary control (FAQ trigger, form field) Tabbed to while it sits at the very top of the viewport could be covered by the nav. Recommend a manual keyboard tab-through; if any control lands behind the nav, add `scroll-margin-top` on focusable controls (or `scroll-padding-top` on the root).

### LOW

**L1 — `◆` glyph not fixed in the fallback hero** ✅ FIXED — `src/components/sections/Hero.tsx:32`. `<span className="text-cherry">◆</span>` is bright cherry (3.24:1) and **not** `aria-hidden`. The `CookieScrubHero` twin was fixed (cherry-deep + `aria-hidden`) but this duplicate was missed. Fix: `text-cherry-deep` + `aria-hidden` for parity.

**L2 — StatusPanel success title — 4.43:1** — `src/components/sections/DemoRequestForm.tsx` StatusPanel `text-blueberry` title (14px bold, not WCAG-"large") on `bg-blueberry/10`. Fix: `text-cocoa` (or darker blue) for the title.

**L3 — Ghost-button resting border — cocoa/20 = 1.51:1 (1.4.11)** — `src/components/ui/Button.tsx:14`. The ghost variant ("See how it works", hero secondary) has a 1.5:1 border at rest (hover raises to 4.26). Fix: default to `cocoa/40`+ (~3:1).

**L4 — BuiltFor fit-meter interim fill — 1.89:1** — `src/components/sections/BuiltFor.tsx`. The pre-qualified `bg-amber` meter fill is ~1.9:1 (redundant with the `{count}/4` text). Fix: `bg-amber-ink` for the interim fill.

**L5 — HowItWorks watermark numerals** — `HowItWorks.tsx:66,171`. Decorative "01/02/03" at `white/25` and `white/[0.16]` are sub-threshold as text but redundant. Fix: `aria-hidden` (they're stylistic).

**L6 — Decorative demo buttons + dead "Accept" control (4.1.2)** — `Hero.tsx:108-109` "Accept" is a keyboard-focusable button with no `type` and no handler (a dead control); the HowItWorks device-mockup buttons (`:297,348,379`) and the mock consent banner are illustrative but exposed to AT. Fix: `aria-hidden` the decorative mock subtrees; give "Accept" `tabIndex={-1}` + `type="button"` (or a real handler).

**L7 — Missing `type="button"`** — `Hero.tsx:102,108,136` default to `type="submit"` (harmless — no enclosing form — but add for consistency).

**L8 — `animate-bounce` not motion-gated (advisory)** — `CookieScrubHero.tsx:185`. Not reduced-motion-gated in CSS, but the component swaps to the static `<Hero/>` for reduced-motion users so it never renders. Add `motion-reduce:animate-none` for defense-in-depth.

---

## Where these live (why the original audit missed them)

Almost every new finding is in the **hero** (`Hero.tsx` fallback + `CookieScrubHero.tsx` scrub) or **decorative** elements — the original audit judged the hero "OK (single h1, descriptive title)" and didn't trace the reveal/opacity focus behavior, the tinted-pill contrast, or the fallback-hero duplicate glyph. The main content sections, forms, modal, and navigation are clean.

## Suggested fix order (all quick)
1. **M1** hero CTA `inert`-until-revealed (the only real keyboard barrier).
2. **M2 + L1** hero eyebrow blueberry + `◆` (both hero files).
3. **M3** WhyKukis amber tokens → amber-ink.
4. **L2–L8** decorative/polish sweep.
5. **M4** manual keyboard pass for focus-obscured.
