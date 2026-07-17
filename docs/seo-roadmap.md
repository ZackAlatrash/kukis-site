# SEO Action Plan — kukis.nl

Updated 2026-07-17 after audit 2. Ordered by impact ÷ effort.

---

## 1. Deploy what's already built  ← nothing else matters until this happens
**Effort:** merge + push · **Impact:** converts every completed fix into an actual result

`seo-improvements` holds canonical, OG/Twitter, JSON-LD, a real sitemap and prerendering — all verified, none of it live. Cloudflare builds from `main`, so until this merges the site scores exactly as it did before any of the work started.

Watch on the first deploy:
- **Turnstile** — the one surface prerendering could plausibly disturb, unverifiable locally (`VITE_TURNSTILE_SITE_KEY` unset). Check the demo form on the preview URL.
- **Build time** — puppeteer pulls ~200 MB of Chromium in the Pages container. The build fails loudly if prerendering can't run, deliberately: a silent skip would look green and change nothing.

Then: submit `https://kukis.nl/sitemap.xml` in Google Search Console (robots.txt is Cloudflare-managed, so a `Sitemap:` directive isn't available without dropping the AI-crawler rules).

---

## 2. Stop shipping 11.5 MB of hero frames
**Effort:** hours · **Impact:** the largest single fact about this site's performance

96 JPEGs, 11.5 MB, on every visit, phone included. No amount of meta tags competes with this. Mobile-first indexing judges the phone experience, and the audience *is* mobile shoppers.

Two fixes, independent — do (a) regardless:

**(a) Don't fetch frames the user won't see.** Reduced-motion visitors currently download all 11.5 MB and then get the static `<Hero/>`. Resolve the preference before first paint — read `matchMedia` in the `useState` initialiser instead of an effect — so `<Scrub>` never mounts. Add an `AbortController` so an unmounting `Scrub` cancels its in-flight fetches. Cheap, strictly correct, and fixes an accessibility path that currently costs more than it saves.

**(b) Shrink the payload itself.** Options, roughly in order of payoff:
- **Encode as video** (h.264/webm) and scrub via `currentTime` — a 96-frame sequence is a video. Typically an order of magnitude smaller.
- **WebP/AVIF instead of JPEG** — often 30–50% off for free.
- **Fewer frames** — 96 is a lot; 24–36 with interpolation may be indistinguishable.
- **Responsive frames** — phones fetch full-size images and then downscale to 760px at decode. Serve a 760px set.
- **Progressive load** — fetch every 8th frame first so scrubbing works early, backfill after.

Worth deciding deliberately: the scrub hero is the site's signature moment and the code comments show it was a considered choice. This is a real trade-off between craft and reach, not an obvious win — but 11.5 MB is a big price, and (a) is free.

---

## 3. Real 404s
**Effort:** ~30 min · **Impact:** medium

`/anything` returns `200` + your homepage. Concretely, in production today: `/how/product.jpg` and `/favicon.ico` both return `200 text/html`. Google reads infinite phantom 200s as a crawl-budget and quality problem. Configure the Pages SPA fallback to serve a real 404 status for unmatched paths.

---

## 4. Favicon + og:image
**Effort:** ~20 min once art exists · **Impact:** medium (brand/CTR)

No `<link rel="icon">` and no `favicon.ico` at all — browsers request it and get HTML. Needs a 1200×630 `og-card.png` too; when it lands, flip `twitter:card` from `summary` to `summary_large_image` in the same commit.

---

## 5. Image alt attributes
**Effort:** ~30 min · **Impact:** medium (accessibility ≫ SEO)

26 of 27 images lack `alt`. Do **not** blanket-fill:
- **Decorative** (cookie frames, background figures) → `alt=""`. Explicitly empty is correct; filling these is worse than leaving them.
- **Meaningful** (mascot, widget screenshots, figures) → short factual alt.
- The 96-frame hero is one logical image — consider `role="img"` + a single `aria-label` on the container.

---

## 6. Get real Core Web Vitals
**Effort:** minutes · **Impact:** unblocks measurement

PageSpeed has been rate-limited twice; everything performance-related here is localhost lab data. Get a free PageSpeed API key, or just run Lighthouse in Chrome DevTools against the deployed preview. Do this *after* #1 so you're measuring the real thing.

---

## Deliberately not recommended
- **FAQPage / HowTo schema** — restricted/deprecated; no rich result for commercial sites.
- **A real `llms.txt`** — no confirmed adoption by any major engine; not a ranking factor.
- **Framework migration** — one page. Prerendering already solved the crawler problem.
- **Opening up to AI training crawlers** — reviewed and deliberately declined; see the audit.
