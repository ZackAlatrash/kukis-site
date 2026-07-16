# SEO Action Plan — kukis.nl

Ordered by (impact ÷ effort). Items 1–3 are worth doing; the rest is polish.

---

## 1. Add OG + Twitter Card tags  ← do this first
**Effort:** ~15 min · **Impact:** high, immediate

Not the biggest *SEO* issue, but the biggest *business* issue and the cheapest fix. Every
time kukis.nl is shared in a Slack, a LinkedIn post, or a DM to a merchant, it currently
renders as a naked URL. You already have the copy and the mascot art to make a good card.

Static tags in `index.html` — no prerendering needed, works today:
```html
<link rel="canonical" href="https://kukis.nl/" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://kukis.nl/" />
<meta property="og:site_name" content="Kukis" />
<meta property="og:title" content="Kukis — The yes cookie tools can't get" />
<meta property="og:description" content="Kukis captures email and marketing consent from EU Shopify shoppers who decline your cookies — the roughly half that cookie-based tools can't reach. No popups, no cookies." />
<meta property="og:image" content="https://kukis.nl/og-card.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Kukis — The yes cookie tools can't get" />
<meta name="twitter:description" content="Consent capture for EU Shopify shoppers who decline cookies." />
<meta name="twitter:image" content="https://kukis.nl/og-card.png" />
```
Needs a 1200×630 `public/og-card.png`. Ships with the canonical fix (#3 in the report) for free.

Verify: paste the URL into LinkedIn Post Inspector and Slack after deploying.

---

## 2. Prerender to static HTML
**Effort:** ~1–2 hrs · **Impact:** high, compounding · **Root cause of most findings**

Turns 0 rendered chars into 4,699 for every crawler, JS or not. For a single-route marketing
site this is a build step, not an architecture change — output stays static on Cloudflare Pages.

Options, cheapest first:
- **`vite-plugin-prerender` / `puppeteer` post-build step** — renders each route to real HTML
  at build time. Minimal change to your existing Vite setup.
- **`vite-react-ssg`** — a bit more integrated, still static output.
- Migrating to Astro/Next is *not* warranted for one page.

Because your CSP is strict (`script-src 'self' https://challenges.cloudflare.com`), verify the
prerendered output still hydrates and that Turnstile still loads after this change.

---

## 3. Ship a real sitemap.xml + fix the soft-404 catch-all
**Effort:** ~30 min · **Impact:** medium-high

Two parts, same root cause:

**(a) Real sitemap.** Drop a literal `public/sitemap.xml` (one URL, it's one page):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://kukis.nl/</loc><lastmod>2026-07-16</lastmod></url>
</urlset>
```
Files in `public/` are served as real static assets and win over the SPA catch-all.
Then confirm `curl -I https://kukis.nl/sitemap.xml` returns `content-type: application/xml`,
**not** `text/html` — that's the test that it actually took.

**(b) Real 404s.** Right now `/anything-at-all` returns `200` + the shell. Configure a proper
404 so nonexistent paths return a 404 status. On Cloudflare Pages this is a `_routes.json` /
`404.html` concern. Since you deploy via Cloudflare Pages with `functions/`, check how the SPA
fallback is configured there.

**(c)** Once (a) is live, add `Sitemap: https://kukis.nl/sitemap.xml` to robots.txt — but note
robots.txt is currently **Cloudflare-managed**, so you'll need to either disable that feature
and ship your own `public/robots.txt`, or add the directive through the Cloudflare dashboard.

---

## 4. Fix image alt attributes
**Effort:** ~30 min · **Impact:** medium (accessibility ≫ SEO here)

26 of 27 images lack `alt`. Do **not** blanket-fill with descriptive text:
- **Decorative** (the 96 cookie animation frames, background figures) → `alt=""`. Explicitly
  empty is correct and tells screen readers to skip them. Filling these with text is worse
  than leaving them empty.
- **Meaningful** (mascot, widget screenshots, diagram figures) → short, factual alt describing
  what it shows.

The 96-frame hero is one logical image; consider `role="img"` + a single `aria-label` on the
container rather than alt on each frame.

---

## 5. Add Organization + WebSite JSON-LD
**Effort:** ~20 min · **Impact:** low-medium

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Kukis",
  "url": "https://kukis.nl/",
  "logo": "https://kukis.nl/mascot/<logo>.png",
  "description": "Consent capture for EU Shopify shoppers who decline cookies.",
  "email": "hello@kukis.nl"
}
</script>
```

**Do not add FAQPage schema** even though you have an FAQ section — FAQ rich results have been
restricted to government/health authority sites since Aug 2023 and won't render for you.
Likewise avoid HowTo (deprecated Sept 2023).

---

## 6. Decide your AI-crawler posture — a choice, not a bug
**Effort:** a decision · **Impact:** depends entirely on strategy

See finding #9 in the audit. Your current Cloudflare-managed robots.txt blocks AI *training*
crawlers while allowing *retrieval* bots. That's a coherent position and plausibly the one you
want. Don't let an SEO tool talk you out of it just because it scores "AI readiness" low —
`llms.txt` is not a Google ranking factor and has no confirmed adoption by any major engine.

The thing that actually gates AI visibility is #2 (prerender): retrieval bots don't run JS.

---

## Deliberately not recommended
- **FAQPage / HowTo schema** — restricted/deprecated, no rich result for commercial sites.
- **A real `llms.txt`** — low/no confirmed payoff; skip until an engine commits to it.
- **Framework migration** — one page doesn't justify it. Prerender instead.

## Still unmeasured
Core Web Vitals — PageSpeed API rate-limited. Re-run with an API key, or just use Lighthouse
in Chrome DevTools. Given a fonts-from-Google + framer-motion + 96-frame animation hero, LCP
and CLS are genuinely worth measuring before assuming they're fine.
