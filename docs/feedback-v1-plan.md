# Feedback V1 — Implementation Plan

**Source:** `Feedback Kukis V1.docx` (AIDA restructure + copy edits)
**Branch:** `feedback/v1-restructure`
**Goal:** Fix the page's AIDA arc — reorder 6 sections, ~12 copy edits, fix the Step-02 consent modal, add pricing.

---

## Verified code context (drives the plan)

| Fact | Impact |
|---|---|
| `App.tsx` order: `CookieScrubHero → InvisibleHalf → Insight → HowItWorks → Widgets → WhyKukis → BuiltFor → Faq` then `FinalCta`, `Footer` | The reorder is mostly a re-sequence in one file |
| **The "Story" is NOT its own component** — it's the bottom of `InvisibleHalf.tsx:43-51` (`<CrumblingCrowd/>` + the "Everyone else loses them…" hook) | Moving it down (pos 3 → 6) requires **splitting `InvisibleHalf` into two components** — the single biggest task |
| Copy lives in `src/data/site.ts` (hero, `stats`, `steps`, `faqs`, `finalCta`, `nav`) | Stat reorder = reorder an array; FAQ edits = edit strings |
| Widget card blurbs live in `Widgets.tsx` `CARDS[].blurb` (:36,44,52,60) — **not** `site.ts`; section heading is inline in `Widgets.tsx:76-80` | Feedback quotes these; edit in the component |
| The "blue dots" = `HowItWorks.tsx:149-159` — station dots on the scroll-progress spine (decorative, unlabelled) | Feedback is right: they read as a bug |
| Step-02 modal = `HowItWorks.tsx` `DeviceBody` stage 1 — one combined consent callout | This is a **mock** in the marketing site, not the real app |
| `site.ts` header: *"real facts only, nothing invented. No fabricated testimonials, logos, or metrics."* | Constrains what I can add — see blockers |

---

## ✅ Phase 0 — Blockers (RESOLVED by owner, 2026-07-12)

1. **Pricing (€50/mo · 30-day trial · No contracts)** → **Do not show for now.** Hero + CTA pricing lines dropped from scope.
2. **🚩 Integrations (Klaviyo/Mailchimp/Omnisend + API key + CSV)** → **Do not mention.** So: FAQ answer 1 is **left exactly as-is** (any rewrite of that answer risks *implying* an integration), and the proposed 6th FAQ ("Which email platforms does Kukis connect to?") is **dropped**. This deliberately departs from the feedback doc — the doc's rewrite asserts capabilities the product doesn't advertise, and `site.ts` requires "real facts only, nothing invented."
3. **Calendly** → **Not used.** Booking stays as the existing demo-request modal (`DemoRequestModal`), which already works. *(The feedback's premise that the button "goes nowhere" was mistaken.)*
4. **"Now in private beta with Dutch Shopify merchants."** → **Confirmed true.** Added as a trust line at the closing CTA (`finalCta.beta`), rendered in amber on the dark canvas (~8.5:1 contrast).

---

## Phase 1 — Step-02 consent modal (feedback urgency #1, "legally wrong")

`HowItWorks.tsx` (DeviceBody, stage 1) + `site.ts`

1. Split the single combined consent callout into **two checkboxes**:
   - ☑ **Email me my cart** (pre-ticked, transactional)
   - ☐ **Yes to occasional offers from this store** (unticked, marketing)
2. `site.ts` `steps[1].title`: `"Email + one tickbox"` → **`"Email + one optional tickbox"`**
3. Keep them decorative (the device is a mock — `tabIndex={-1}`, consistent with the a11y pass).

*Note: this changes the marketing site's depiction only. If the real app combines them, that's a separate app-side fix.*

---

## Phase 2 — Structural reorder (the core change)

**2a. Split `InvisibleHalf.tsx`** → keep the Problem (header + lead + stats); extract lines 43–51 into a new `CrumbStory.tsx` (the `CrumblingCrowd` scene + "Everyone else loses them. Kukis catches the crumbs."), with its own dark section wrapper matching the current gradient so it reads identically.

**2b. Re-sequence `App.tsx` `<main>`:**

| # | Component | Change |
|---|---|---|
| 1 | `CookieScrubHero` | — |
| 2 | `InvisibleHalf` (Problem) | — |
| 3 | `Insight` | **moved up** |
| 4 | `Widgets` | **moved up** |
| 5 | `HowItWorks` | moved down |
| 6 | `CrumbStory` | **moved down** (new) |
| 7 | `WhyKukis` | — |
| 8 | `BuiltFor` | — |
| 9 | `Faq` | — |

**2c.** Update `site.ts` `nav` order so it matches the new visual order (**Widgets before How it works**).
**2d.** Verify: section ids/anchors (`#problem`, `#insight`, `#widgets`, `#how`, `#why`, `#faq`) still resolve, `scroll-mt-24` intact, dark/light section rhythm still alternates sensibly, and the a11y landmark/heading order still holds.

---

## Phase 3 — Problem section copy

1. **Rewrite the lead paragraph** (`InvisibleHalf.tsx:21-25`) to lead with cookie rejection, not cart abandonment (exact text from the doc).
2. **Reorder `stats`** in `site.ts`: `~50% reject` → `~70% abandoned` → `2 ≠ 1`.

---

## Phase 4 — Widgets section

1. `Widgets.tsx:78` title → **"Four surfaces. One consent model."**
2. `Widgets.tsx:79` sub → the longer anti-popup / cookieless subheading (exact text from the doc).
3. `Widgets.tsx:44` `later.blurb` → **"One product, one email, one link back. No sequence."**
4. Keep the other three blurbs and all four images (doc says don't touch).

---

## Phase 5 — Insight copy tweak

`Insight.tsx:76-79`: *"Kukis never needed cookies in the first place."* → **"Kukis never needed one."**

---

## Phase 6 — The blue dots

`HowItWorks.tsx:149-159`. Add visible **01 / 02 / 03** labels beside each spine dot (preferred — keeps the progress affordance and kills the "looks broken" read). Fallback: `aria-hidden` + remove.

---

## Phase 7 — FAQ (`site.ts` `faqs`)

1. **Answer 2 (GDPR/AVG)** → stronger version incl. the **AP audit** reference. ✅ DONE
2. **Answer 1 (email platform)** → ❌ **dropped** (owner: don't mention integrations). Left as-is.
3. **6th Q** "Which email platforms does Kukis connect to?" → ❌ **dropped** (same reason).

---

## Phase 8 — CTA

1. Hero pricing line → ❌ **dropped** (owner: no pricing for now).
2. `FinalCta` pricing line → ❌ **dropped** (same).
3. Calendly wiring → ❌ **dropped**; booking stays as the existing demo-request modal.
4. Private-beta trust line → ✅ **DONE** — `finalCta.beta` rendered above the note in `FinalCta.tsx`.

---

## Phase 9 — Deferred / out of scope for this branch

- **`kukis.nl` domain** → infra, not code.
- **`/pricing` page** → needs routing (site is a single page today); do after pricing is confirmed.
- **Shopify App Store "Install free" secondary CTA** → after approval.
- **Dutch language toggle** → month 2.
- **Social proof quotes** → when real ones exist.
- **`WhyKukis` headline** → *"The half everyone else gives up on. Yours now."* Optional; doc says keep current if it fits brand voice better. My call: **keep current** unless you want the swap.

---

## Phase 10 — Verify

`npm run build` (typecheck) + `npm run test` after each phase; browser pass at the end for the new order, the two-checkbox modal, pricing lines, and the dots. Re-check contrast/a11y on anything new (the pricing line and new checkbox labels) so the WCAG 2.2 AA work isn't regressed.

---

## Execution order (by urgency, per the doc)

1. **Phase 1** — Step-02 modal (legal)
2. **Phase 2** — reorder (incl. the `InvisibleHalf` split)
3. **Phase 3** — problem lead + stat order
4. **Phase 4/5/6** — widgets, insight, dots
5. **Phase 7** — FAQ (answer 2 now; 1 + 6th when unblocked)
6. **Phase 8** — pricing + Calendly (when unblocked)
