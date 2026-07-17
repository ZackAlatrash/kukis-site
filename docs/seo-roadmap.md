# SEO Action Plan — kukis.nl

Updated 2026-07-17. Items 2, 3 and 5 are done on the `seo-improvements` branch; item 1 is the only thing standing between the work and any result. Items 4 and 6 are with you.

**Deployed 2026-07-17.** Live and verified: raw HTML 92,760 bytes / 5,354 chars of text (was 1,019 / 0), sitemap `application/xml`, unmatched paths 404, phone page weight 6.39 MB (was 15.8), Turnstile issuing tokens.

| # | Item | Status |
|---|---|---|
| 1 | Deploy the branch | ✅ done — merged to `main`, built, verified in production |
| 2 | Hero payload | ✅ done — phone 11.5 MB → 2.38 MB, decode 512 MB → 116 MB |
| 3 | Real 404s | ✅ done — `public/404.html`, verifies after deploy |
| 4 | Favicon + `og:image` | open — **you're making the art** |
| 5 | Image `alt` | ✅ no work needed — the finding was a measurement bug, see the audit |
| 6 | Real Core Web Vitals | open — **you're getting a PageSpeed key** |

---

## 1. Deploy — ✅ done 2026-07-17

Merged to `main` and built in under a minute; the Chromium download was a non-event in the Pages container.

Verified in production:

| check | result |
|---|---|
| raw HTML | 92,760 bytes, 5,354 chars of text (was 1,019 / 0) |
| h1, JSON-LD, canonical, OG | all present without JS |
| `sitemap.xml` | 200 `application/xml` |
| unmatched path | 404 (cache-bust to see it — the CDN holds old 200s) |
| phone page weight | 6.39 MB (was 15.8) |
| **Turnstile** | mounts and issues a real 794-char token |

Turnstile was the rollback trigger and it survived prerendering.

**Still to do — yours:** submit `https://kukis.nl/sitemap.xml` in Google Search Console. robots.txt is Cloudflare-managed, so a `Sitemap:` directive would mean dropping the AI-crawler rules; Search Console does the same job with no tradeoff.

---

## 2. Stop shipping 11.5 MB of hero frames — ✅ done

All three symptoms shared one cause: `prefers-reduced-motion` and `isSmall` resolved in effects, and React runs child effects first, so `Scrub`'s one-shot decode loop always read the wrong answer.

| | before | after |
|---|---|---|
| reduced-motion visitor | 96 requests, 11.5 MB | **0 requests** |
| phone payload | 11.5 MB | **2.38 MB** (−79%) |
| phone decode | 1600×873, ~512 MB RAM | **760×415, ~116 MB** (−77%) |
| desktop payload | 11.5 MB | **7.51 MB** (−35%) |

Responsive WebP (`cookie/760/`, `cookie/1600/`) rather than video: phones already downscaled to 760, so the 760 set is the picture they were seeing anyway. SSIM 0.982–0.989 vs source. Video would have saved another 1.3 MB and put `currentTime` scrubbing on iOS Safari in the critical path — the thing the ImageBitmap design exists to avoid.

No `AbortController`, despite the earlier plan: `startedRef` exists so StrictMode's double mount doesn't refetch, so aborting the first mount's requests would leave the second with nothing to draw. The reduced-motion case it was meant to fix is handled by not mounting `Scrub` at all.

Re-measure any time with `npm run build && node scripts/verify-hero.mjs`. Regenerate the frames from source art with `node scripts/encode-frames.mjs <dir-of-jpgs>`.

---

## 3. Real 404s — ✅ done, verifies on deploy

`public/404.html` added. Cloudflare Pages serves it with a real 404 status once it exists, instead of falling back to `index.html` with 200. Safe because the site is one route with same-document hash navigation — nothing needed the catch-all. Locally `/nope-not-a-page` returns 404 and `/` returns 200; the Pages behaviour itself can only be confirmed after deploy.

---

## 4. Favicon + og:image
**Effort:** ~20 min once art exists · **Impact:** medium (brand/CTR)

No `<link rel="icon">` and no `favicon.ico` at all — browsers request it and get HTML. Needs a 1200×630 `og-card.png` too; when it lands, flip `twitter:card` from `summary` to `summary_large_image` in the same commit.

---

## 5. Image alt attributes — ✅ nothing to do

The "26 of 27 images lack alt" finding was **wrong**: the audit filtered with `!getAttribute('alt')`, and `alt=""` is falsy, so correctly-marked-up decorative images were counted as missing. Re-measured: 0 images lack the attribute. 25 decorative carry `alt=""` (most also `aria-hidden`), the mascot carries a real alt. Already correct; no change made.

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
