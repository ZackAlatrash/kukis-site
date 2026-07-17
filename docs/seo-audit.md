# SEO Audit — kukis.nl

Audit 1: 2026-07-16 · Audit 2: 2026-07-17 (this document supersedes audit 1)
Method: Agentic SEO skill evidence scripts + puppeteer measurement under production CSP
Site: Vite + React SPA, single route, Cloudflare Pages

---

## Standing position

Two different answers, and the distinction is the whole story.

| | Live kukis.nl | Built from `seo-improvements` |
|---|---|---|
| Raw HTML | 1,019 bytes | 91,342 bytes |
| Body text without JS | **0 chars** | **5,556 chars** |
| canonical | ✗ | ✓ |
| OG / Twitter | 0 tags (0/100) | ✓ |
| JSON-LD | ✗ | Organization + WebSite |
| sitemap.xml | SPA shell, 200 text/html | real, application/xml |

**Nothing is deployed.** The live site is byte-identical to audit 1 — Cloudflare builds from `main`, and the work sits on an unpushed branch. Every audit-1 finding is still live and still true today.

So the crawler-visibility problems are *solved but not shipped*. Deploying is the single action that converts audit 1's work into results.

---

## New findings (audit 2)

Invisible in audit 1 because the PageSpeed API was rate-limited — the exact gap flagged there as an environment limitation. Measured directly with puppeteer instead.

### 🔴 Critical — the hero downloads 11.5 MB on every visit

- Evidence: 96 requests to `/cookie/f_*.jpg`, **11.5 MB of frames, 15.8 MB page total**, measured identically at desktop 1280px and mobile 412px. `dist/cookie/` is 15 MB on disk; frames average ~128 KB.
- Cause: `CookieScrubHero` fetches all 96 frames eagerly in one loop (`for (let i = 0; i < FRAMES; i++) fetch(framePath(i))`) — by design, so scrubbing is jank-free.
- Impact: This dominates every other performance consideration on the site. On a typical 4G connection 11.5 MB is roughly 10+ seconds of transfer, and on a metered plan it is 11.5 MB per visit. Mobile-first indexing means Google assesses the phone experience. The product's own audience is EU Shopify *mobile* shoppers.
- Note: `resizeWidth: 760` on mobile reduces **decode memory**, not bytes downloaded — the code comment says exactly this and is accurate. Phones still download full-size frames.
- Confidence: **Confirmed**

### 🔴 Critical — reduced-motion users pay the 11.5 MB for an animation they never see

- Evidence: with `prefers-reduced-motion: reduce` emulated, all 96 frames still download (11.5 MB) even though the static `<Hero/>` renders and `Scrub` is never on screen.
- Cause: `usePrefersReducedMotion` initialises to `false` and only flips in an effect. First render therefore mounts `<Scrub>`, whose effect fires all 96 fetches; the hook then resolves, `<Hero/>` swaps in and `Scrub` unmounts — with the fetches already in flight and uncancelled.
- Impact: The accessibility path costs *more* than it saves. Users who asked for less motion get the full payload and none of the benefit.
- Confidence: **Confirmed**

### ✅ Pass — layout stability

- CLS **0** prerendered (vs 0.0002 plain), FCP ~320 ms local. Prerendering introduces no layout shift; settled DOM and screenshots are byte-identical to the plain build.
- Confidence: **Confirmed** (lab, localhost — see limitations)

---

## Carried over from audit 1 — fixed on branch, not live

| Finding | Status |
|---|---|
| Zero server-rendered content | Fixed on branch (prerender) — **not deployed** |
| No canonical | Fixed on branch — **not deployed** |
| No OG/Twitter (0/100) | Fixed on branch (minus `og:image`) — **not deployed** |
| sitemap.xml was the SPA shell | Fixed on branch — **not deployed** |
| No JSON-LD | Fixed on branch — **not deployed** |

## Carried over — still open everywhere

| Finding | Notes |
|---|---|
| 26 of 27 images have no `alt` | Decorative frames want `alt=""`; content images want real alt |
| Soft 404s | `/anything` returns 200 + HTML. Demonstrated: `/how/product.jpg` and `/favicon.ico` both return `200 text/html` in production |
| No favicon | No `<link rel="icon">`, no `favicon.ico` |
| No `og:image` | Tags ship without it; `twitter:card` stays `summary` until art exists |
| No `Sitemap:` in robots.txt | robots.txt is Cloudflare-managed; use Search Console instead |

## Decided, not a defect

**AI crawler posture.** Cloudflare-managed robots.txt blocks training crawlers (GPTBot, ClaudeBot, CCBot, Google-Extended…) while retrieval bots (OAI-SearchBot, ChatGPT-User, PerplexityBot) inherit `Allow: /`. Reviewed and deliberately kept. `Google-Extended` blocks Gemini training only and costs nothing in Google Search.

---

## Environment Limitations

- **PageSpeed Insights / CrUX field data: still unavailable.** Rate-limited on two separate attempts, no API key configured. CWV numbers here are **lab data from localhost** — no network latency, no real-device CPU. Treat FCP/LCP as directional only. The 11.5 MB figure is a byte count and does not depend on that caveat; it is exact.
- LCP produced no entry under mobile emulation (likely the canvas hero); not chased.
- Turnstile unverified — `VITE_TURNSTILE_SITE_KEY` unset locally, so the widget never mounts.
