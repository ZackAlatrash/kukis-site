# Accessibility Audit — Kukis Landing Site

**Standard:** WCAG 2.2 Level AA (covers EAA / EN 301 549, ADA, Section 508)
**Scope:** Full single-page marketing site (`src/`) — layout, all sections, UI components, the demo-request modal + form, color system, and motion.
**Method:** 4 parallel domain audits (structure/semantics, forms/keyboard/focus, ARIA/media, color/contrast/motion) against the skill's S/A/K/F/V/D rule set, with hand-computed contrast ratios and a full render-tree trace. Audit only — no code changed.
**Date:** 2026-07-11

---

## Executive summary

The site is, on the whole, **well-built for accessibility**: correct `<html lang>`, a clean single-`h1` heading tree with no skipped levels, semantic landmarks, descriptive link text, every `<img>` alt'd, every icon-only button named, every decorative canvas/SVG `aria-hidden`, valid ARIA roles with their required properties, real `<button>`s everywhere (no div-onClick soup), and genuinely strong `prefers-reduced-motion` coverage.

The problems cluster in **two areas**:

1. **Color contrast** — this is the biggest gap and it's systemic. Three palette tokens (`amber`, `crumb`, `consent`) are used as text on light backgrounds where they fall far below 4.5:1. The `amber` "success/caught" state is effectively invisible (1.8:1), and `crumb` is the site-wide default muted/caption color (3.25:1). This affects dozens of locations.
2. **The demo modal's focus management** — the dialog is announced correctly but never moves focus in, never traps Tab, never returns focus on close, and leaves the page behind it focusable. Keyboard and screen-reader users get stranded.

Everything else is a handful of IMPORTANT/SUGGESTION polish items.

### Scorecard

| Domain | Result |
|---|---|
| Semantic HTML / landmarks / headings | Strong — 1 IMPORTANT (footer landmark), skip link missing |
| ARIA / icons / images / media | Strong — no criticals; minor polish only |
| Forms | Good — labels & error-linking correct; needs error focus + required markers |
| Keyboard & focus | **Modal focus management is the one critical gap** |
| Color & contrast | **Weakest area — systemic failures** |
| Motion / reduced-motion | Excellent — 2 stray `animate-pulse` dots only |

### Count by severity

- **CRITICAL:** 2 themes — (1) color contrast across `amber`/`crumb`/`consent`/white-on-fill; (2) modal focus trap & focus management.
- **IMPORTANT:** 6 — skip link, footer landmark, focus-to-first-error, error live-region, required-field markers, field/checkbox border contrast (1.4.11), fixed-px font sizes (1.4.4).
- **SUGGESTION:** ~8 — anchor-nav focus, `aria-controls`, decorative glyph/emoji, native-vs-ARIA checkbox, two `animate-pulse` dots, redundant alt, narrow-screen figure clipping.

---

## CRITICAL findings

### C1 — Color contrast failures (WCAG 1.4.3 Contrast Minimum)

The single biggest issue. Ratios below were computed with the WCAG relative-luminance formula. Threshold: **4.5:1** normal text, **3:1** large text (≥24px, or ≥18.66px bold) and non-text.

#### Computed contrast table (failing pairings)

| Pairing (fg on bg) | fg | bg | Ratio | Needs | Result | Used in |
|---|---|---|---|---|---|---|
| **amber on cream/milk** | `#E8B04B` | `#FFFBF3` | **1.8–1.9:1** | 4.5 | ❌ critical | success/eyebrow states |
| **crumb on milk** | `#9A8672` | `#FFF6E7` | **3.25:1** | 4.5 | ❌ | default muted/caption text sitewide |
| **crumb on cream** | `#9A8672` | `#FFFBF3` | **3.38:1** | 4.5 | ❌ | card captions |
| **crumb/70, crumb/50** | — | light | **~2.6 / ~2.1:1** | 4.5 | ❌ | `BuiltFor.tsx:164`, `ConsentChip.tsx:15` |
| **consent green text on light** | `#2FA36B` | light | **2.98–3.10:1** | 4.5 | ❌ | ConsentChip "on", BuiltFor fit label |
| **white on consent fill** | `#FFFFFF` | `#2FA36B` | **3.20:1** | 4.5 | ❌ | green "email me" buttons/badges |
| **white on cherry** | `#FFFFFF` | `#E24B3B` | **3.96:1** | 4.5 | ❌ | primary Button hover, BuiltFor CTA |
| **cherry on milk** | `#E24B3B` | `#FFF6E7` | **3.69:1** | 4.5 | ❌ (norm) | ◆ glyph, WhyKukis lost-state |
| blueberry on milk | `#2F6FB0` | `#FFF6E7` | 4.87:1 | 4.5 | ⚠ passes, tight | eyebrows, links, Logo |
| white on cherry-deep | `#FFFFFF` | `#C83A2C` | 5.13:1 | 4.5 | ✅ | primary Button (rest) |
| cocoa on milk | `#2E1C10` | `#FFF6E7` | 15.2:1 | 4.5 | ✅ | body text |
| cocoa-soft on milk | `#5A4636` | `#FFF6E7` | 8.3:1 | 4.5 | ✅ | secondary body text |

Note: amber, consent green, and warm tones all **pass on the dark sections** (InvisibleHalf, pinned HowItWorks, FinalCta, inbox mock) at 5–8.5:1. The failures are specifically **on the light cream/milk backgrounds**.

**C1-a — `amber` text on light (1.8:1).** Worst offender; the "caught/success" state is unreadable.
- `WhyKukis.tsx:56` eyebrow, `:68-69` the `~50%` success stat, `:99`/`:116` amber legend/icons
- `BuiltFor.tsx:56` eyebrow
- `HowItWorks.tsx:69` & `:206` step tags/eyebrow **in the stacked mobile / reduced-motion layout** (light bg)
- **Fix:** introduce a dark "amber-ink" token for text-on-light (≈`#8A5A12`, ≥4.5:1); keep `#E8B04B` for dark backgrounds and fills only.

**C1-b — `crumb` muted text (3.25:1), systemic.** This is the default caption color and it fails everywhere on light bg: `Section.tsx:43`, `Hero.tsx:146`, `BuiltFor.tsx:105/158/165`, `Insight.tsx:89/108/162/211`, `HowItWorks.tsx:242/291/318/328/342/369/374/388`, `WhyKukis.tsx:90`, `ConsentChip.tsx:13-16`, `CookieScrubHero.tsx:182`.
- **Fix (highest leverage):** darken the `--color-crumb` token to ~`#6F5C48` (≈4.6:1 on milk), or switch muted text to the existing `cocoa-soft` (8.3:1). One token change fixes dozens of sites.

**C1-c — `consent` green text (3.0:1) & white-on-green fills (3.2:1).** `ConsentChip.tsx:17`, `BuiltFor.tsx:129`; white-on-green buttons `HowItWorks.tsx:351`, `Insight.tsx:153`.
- **Fix:** darken green for text/fills to ~`#1F7A4F` (white-on-that ≈4.7:1); keep bright `#2FA36B` for icons/meters only.

**C1-d — white-on-cherry (3.7–4.0:1).** `Button.tsx:12` primary **hover** drops from the passing `cherry-deep` to failing `cherry`; `BuiltFor.tsx:143` CTA uses `bg-cherry` persistently.
- **Fix:** don't lighten the button to `cherry` on hover — keep `cherry-deep`; use `cherry-deep` for the BuiltFor CTA.

### C2 — Demo modal: no focus management, no focus trap, background not inert (WCAG 2.1.2, 2.4.3, 4.1.2)

`DemoRequestModal.tsx:34-74`. The dialog is correctly declared (`role="dialog"`, `aria-modal="true"`, `aria-labelledby="demo-request-title"` → the form's `h2`) and Escape + backdrop + close button all dismiss it. But the keyboard/AT journey is broken (independently confirmed by 3 of the 4 audits):

1. **On open, focus is never moved into the dialog.** It stays on the `a[href="#demo"]` trigger now hidden behind the overlay (`App.tsx:31-44` only calls `preventDefault()` + `openDemoRequest()`).
2. **No focus trap.** `aria-modal="true"` is only an AT hint — real `Tab`/`Shift+Tab` walks straight out of the dialog into the still-focusable page behind it. The background is neither `inert` nor `aria-hidden`.
3. **On close, focus is not returned** to the trigger (`App.tsx:23-29`), so after Escape focus lands on `<body>` and the user restarts from the top of the page.

**Fix** — add initial focus + trap + restore (or, cleaner, migrate to a native `<dialog>` opened with `showModal()`, which gives the trap, background inert, and Escape for free):

```tsx
const dialogRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  if (!open) return;
  const previouslyFocused = document.activeElement as HTMLElement | null;
  const node = dialogRef.current;
  const focusables = () => node?.querySelectorAll<HTMLElement>(
    'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])'
  ) ?? [];
  (focusables()[0] ?? node)?.focus();           // 1. initial focus
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") return onClose();
    if (e.key !== "Tab") return;                 // 2. trap
    const items = Array.from(focusables());
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener("keydown", onKey);
  return () => {
    document.removeEventListener("keydown", onKey);
    previouslyFocused?.focus();                   // 3. restore focus
  };
}, [open, onClose]);
```
Add `ref={dialogRef} tabIndex={-1}` to the `role="dialog"` div (line 43), mark the page root `inert` while open, and remove the now-duplicated Escape listener at lines 17-21.

---

## IMPORTANT findings

### I1 — No skip link (WCAG 2.4.1) — `App.tsx:58-76`
First focusable element is the logo; keyboard users must tab through the whole nav on every visit. Add a visually-hidden-until-focused skip link as the first child and give `<main>` an id + `tabIndex={-1}`:
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-cocoa focus:px-4 focus:py-2 focus:text-milk">Skip to content</a>
...
<main id="main-content" tabIndex={-1}>
```

### I2 — Footer is not a `contentinfo` landmark (WCAG 1.3.1) — `Footer.tsx:6` via `FinalCta.tsx:52-55`
`<footer>` only maps to `contentinfo` when its nearest sectioning ancestor is `<body>`. Here it's nested inside `<section id="demo">`, so it exposes no landmark, and the whole `FinalCta` block renders **after** `</main>` (`App.tsx:72-73`) in no landmark at all. **Fix:** hoist `<Footer />` out of `FinalCta` to be a direct sibling of `<main>` in `App.tsx`.

### I3 — No focus-to-first-error / error summary on submit failure (WCAG 3.3.1) — `DemoRequestForm.tsx:90-100`
On validation failure the handler just `return`s; inline errors render but focus stays on the submit button and nothing is surfaced. Inputs correctly get `aria-invalid`/`aria-describedby`, but that error text isn't read until the field is focused. **Fix:** after `setErrors`, focus the first invalid field (`document.getElementById('demo-'+firstErrorField)?.focus()`) and/or render a focusable `role="alert"` error summary.

### I4 — Field validation errors not in a live region (WCAG 4.1.3) — `DemoRequestForm.tsx:195-323`
The submit *result* panel is correctly wrapped in `aria-live="polite"` (line 341), but the per-field `<p id="demo-*-error">` errors mount silently. Pairs with I3 — fix by focusing the invalid field (so its `describedby` is announced) or add `role="alert"` to each error `<p>`.

### I5 — Required fields have no visible required indicator (WCAG 3.3.2) — `DemoRequestForm.tsx:180-312`
All five required fields carry the `required` attribute, but labels have no asterisk/"(required)" and look identical to the one optional field (Store size). **Fix:** add a visible marker (e.g. `*` with a legend "* required") to each required label.

### I6 — Non-text contrast: form field & checkbox borders < 3:1 (WCAG 1.4.11)
- Input borders `border-chip/20` (`DemoRequestForm.tsx:38`) and the global `rgba(90,52,32,0.16)` default (`index.css:34`) render at ~1.3:1 against the field fill.
- Unchecked checkbox border `border-chip/40` (`BuiltFor.tsx:78`) ~2.2:1.
- **Fix:** strengthen input/control borders to ≥3:1 (e.g. `border-chip/45`+). Focus indicator itself is fine (blueberry outline = 5.2:1). Note also `fieldBaseClass`'s `outline-none` (`DemoRequestForm.tsx:30`) suppresses the global `:focus-visible` on the fields (Tailwind v4 utilities layer outranks `@layer base`); the only remaining cue is a faint 12%-opacity ring. Add `focus-visible:outline-2 focus-visible:outline-blueberry focus-visible:outline-offset-2` to the fields.

### I7 — Pervasive fixed-px font sizes (WCAG 1.4.4) — many files
Arbitrary `text-[NNpx]` utilities on content text don't scale under text-only zoom: `Hero.tsx:50/97/130/146`, `Faq.tsx:51`, `WhyKukis.tsx:74/81/90/114/136`, `Insight.tsx:71/76/89/162/211`, `HowItWorks.tsx` (many), `BuiltFor.tsx:56/93/143/158/165`, `DemoRequestForm.tsx:30-32/163/247/328/400`, `CrumblingCrowd.tsx:256-349`. **Fix:** prefer rem-based sizes (`text-sm`/`text-base`/`text-[0.8125rem]`) for body/caption text. (Tailwind's named scale used elsewhere is already rem-based and fine.)

---

## SUGGESTION findings

- **Anchor nav doesn't move focus to target section** (2.4.3) — `Nav.tsx:31-37/59-68`. Hash jumps scroll but leave focus on the link. Add `tabIndex={-1}` to section targets and `.focus()` after the hash change.
- **Missing `aria-controls`** on disclosure toggles — `Nav.tsx:46-53` (mobile menu) and `Faq.tsx:26-41` (accordion) use `aria-expanded` correctly but don't point at the controlled region. Add ids + `aria-controls`.
- **Decorative glyph exposed to AT** — `CookieScrubHero.tsx:159` `◆` announces "black diamond". Add `aria-hidden`.
- **Decorative emoji in copy** — `HowItWorks.tsx:372`, `CrumblingCrowd.tsx:32` bare 🍪 announces "cookie" mid-sentence. Wrap `aria-hidden` or give an intentional `role="img" aria-label`.
- **Native vs ARIA checkbox** — `BuiltFor.tsx:62-98` custom `role="checkbox"` is done correctly but a native `<input type="checkbox">` is more robust; also wrap the four in `role="group" aria-label="Is this you?"`.
- **Two ungated `animate-pulse` dots** (2.3.3) — `CrumblingCrowd.tsx:274` "Live" dot and `HowItWorks.tsx:331` caret keep animating under reduced-motion (Tailwind's `animate-pulse` isn't gated). Add `motion-reduce:animate-none` or a global reduced-motion override.
- **Redundant alt** — `HowItWorks.tsx:279` `alt="Speckled ceramic mug"` duplicates the visible title below; consider `alt=""` for the decorative placeholder.
- **Nav toggle icons not `aria-hidden`** — `Nav.tsx:52` `<Menu>`/`<X>`; harmless (button is labelled) but inconsistent with the rest of the codebase. Add `aria-hidden`.
- **Auto-cycling inbox status not announced** — `CrumblingCrowd.tsx:245-280`. Decorative, so either add `aria-live="polite"` (if meant to be perceived) or `aria-hidden` the whole mock.
- **Narrow-screen clipping** — `CrumblingCrowd.tsx:225` fixed `h-[500px]` figures can crop below 320px (decorative, `aria-hidden`, low impact).

---

## What already passes (verified, no action needed)

- **`<html lang="en">`** (`index.html:2`) and descriptive `<title>` (`index.html:6`). ✅
- **Heading tree:** exactly one `h1`, no skipped levels (full outline below). ✅ (Hero/Scrub are mutually exclusive; both expose the same single `h1`.)
- **Landmarks:** `<nav>`, `<main>` present (footer is the exception — I2). ✅
- **Link text:** all descriptive; no "click here / read more / learn more". ✅
- **No tables, so no table-header issues.** N/A
- **Forms:** every input has a `<label htmlFor>`; errors linked via `aria-invalid` + `aria-describedby`; `autocomplete` set (name/email/url/country-name); JSX uses `htmlFor`; no CAPTCHA / paste-blocking. ✅
- **Keyboard:** every `onClick` is on a real `<button>`/`<a>` (no div-onClick); no positive `tabindex`; mouse-only handlers are purely decorative (spotlight/tilt). ✅
- **ARIA:** no `aria-hidden` on focusable elements; no invalid roles; `role="switch"`/`"checkbox"`/`"dialog"` all have required properties; icon-only buttons (Nav toggle, modal close) are `aria-label`led. ✅
- **Images/SVG:** every `<img>` has alt (decorative ones `alt=""` + `aria-hidden` container); all lucide icons `aria-hidden`; all decorative canvases `aria-hidden`; no raw inline `<svg>`. ✅
- **No `<video>`/`<audio>`** — captions/autoplay N/A. ✅
- **Motion:** `prefers-reduced-motion` correctly gates CrumbCursor, CookieMascot, Reveal, CrumblingCrowd, the Scrub→static-Hero fallback, and all CSS keyframes. Nothing flashes >3×/sec. ✅ (except the two `animate-pulse` dots above.)
- **Reflow:** containers use `max-w-*` and `body { overflow-x: clip }` — largely fine at 320px. ✅

### Document heading outline

```
h1  "The yes cookie tools can't get."        CookieScrubHero.tsx:165 / Hero.tsx:35
  h2  Most of your shoppers leave no trace.   InvisibleHalf (#problem)
  h2  Reject the cookies. Keep the yes.       Insight (#insight)
  h2  Three steps. One clean email.           HowItWorks (#how)
    h3  step.title ×3
  h2  Four small buttons. One way to ask.     Widgets (#widgets)
    h3  w.title ×4
  h2  Built for the shoppers others give up on. WhyKukis (#why)
  h2  Who Kukis is for, and who it isn't.     BuiltFor
  h2  Questions merchants ask.                Faq (#faq)
—— end of <main> ——
  h2  See Kukis on your store.                FinalCta (#demo)  ← orphaned outside <main> (see I2)
—— modal ——
  h2  Request a demo                          DemoRequestForm (in role="dialog")
```

---

## Suggested remediation order

1. **Contrast token pass (C1).** Highest leverage: darken `--color-crumb`, add an `amber-ink` text token, darken `consent` for text/fills, stop the primary button lightening to `cherry` on hover. Fixes the largest number of failures with the fewest edits.
2. **Modal focus management (C2).** Add trap + initial focus + restore + background `inert` (or migrate to native `<dialog>`).
3. **Skip link (I1) + footer landmark (I2).** Small, high-value structural fixes.
4. **Form: focus-first-error + required markers + field focus ring (I3, I4, I5, I6).**
5. **Font-size resize pass (I7)** and the SUGGESTION polish items.

> Once contrast (C1) and the modal (C2) are addressed, the site is close to clean WCAG 2.2 AA.
