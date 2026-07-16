# SEO Audit — https://kukis.nl

Date: 2026-07-16
Method: Agentic-SEO-Skill (`seo` skill) evidence scripts + rendered-DOM comparison
Site type: Vite + React SPA, client-rendered, hosted on Cloudflare Pages

---

## Headline

The site's content is **invisible to any crawler that does not execute JavaScript**.

| Measurement | Value |
|---|---|
| Body text in served HTML (raw fetch) | **0 characters** |
| Body text after JS renders | **4,699 characters** |

The served HTML is a 1,023-byte shell whose `<body>` contains only `<div id="root"></div>`.
Everything else — the h1, nine h2 sections, the FAQ, the pricing framing — exists only after
the React bundle executes.

Google *can* render JS, but does so in a deferred second wave, and it is not guaranteed.
Most AI/answer engines (and social scrapers) do **not** execute JS at all. For those, this
site is a blank page with a title.

---

## Findings

### 🔴 Critical

**1. Zero server-rendered content (SPA shell)**
- Evidence: raw fetch body text = 0 chars; rendered DOM = 4,699 chars, 1×h1, 9×h2.
- Impact: Delayed/unreliable indexing on Google; effectively zero visibility in AI answer
  engines and social unfurls. This is the root cause of several findings below.
- Fix: Prerender to static HTML at build time. For a marketing site with a fixed set of
  routes this is the cheapest correct fix — no server needed, output stays static.
- Confidence: **Confirmed**

**2. `sitemap.xml`, `llms.txt`, `llms-full.txt` do not actually exist**
- Evidence: all three return `HTTP 200` with `content-type: text/html` and the SPA shell as
  the body. So does `/totally-made-up-page-xyz`. The Cloudflare Pages SPA catch-all rewrites
  every unmatched path to `index.html`.
- Impact: Two compounding problems.
  (a) There is no sitemap — search engines get no crawl map.
  (b) **Soft 404s**: every nonexistent URL returns 200 + content. Google treats this as a
      quality signal problem and can waste crawl budget on infinite phantom URLs.
- Note: This is exactly the kind of thing status-code-only tooling gets wrong. The skill's
  own `llms_txt_checker.py` scored this **"✅ Found (HTTP 200)"** — a false positive. It was
  caught by checking content-type and body, not the status code.
- Confidence: **Confirmed**

**3. No canonical URL**
- Evidence: `document.querySelector('link[rel=canonical]')` → `null`.
- Impact: With a 200-returning catch-all, any URL can serve the homepage, so duplicate-URL
  variants are trivially creatable. A canonical is the guardrail.
- Confidence: **Confirmed**

### ⚠️ Warning

**4. No Open Graph or Twitter Card tags — social meta score 0/100**
- Evidence: `social_meta.py` — og:title, og:description, og:image, og:url, og:type all missing;
  twitter:card missing.
- Impact: Every share on LinkedIn/Slack/X/WhatsApp renders as a bare link with no title card
  or image. For a B2B SaaS site that is distributed largely by link-sharing, this is a direct
  top-of-funnel loss — arguably higher near-term ROI than ranking work.
- Confidence: **Confirmed**

**5. 26 of 27 images have no `alt` attribute**
- Evidence: rendered DOM — `imgs: 27`, `imgsNoAlt: 26`.
- Impact: Accessibility failure first, image-SEO loss second. Note many of these are the 96
  cookie animation frames, where `alt=""` (explicitly empty = decorative) is the *correct*
  answer, not descriptive alt text. Content images (mascot, figures, widget shots) need real
  alt.
- Confidence: **Confirmed**

**6. No structured data (JSON-LD)**
- Evidence: zero `script[type="application/ld+json"]` blocks.
- Impact: No `Organization` / `SoftwareApplication` / `WebSite` entity for Google's knowledge
  graph. Reduces eligibility for rich presentation and entity understanding.
- Fix: Add `Organization` + `WebSite` JSON-LD. **Do not add FAQPage schema** despite the FAQ
  section — FAQ rich results were restricted to government/health authority sites in Aug 2023
  and no longer render for commercial sites.
- Confidence: **Confirmed**

**7. No `Sitemap:` directive in robots.txt**
- Evidence: `robots_checker.py` — no Sitemap line. (Moot until a sitemap exists — see #2.)
- Confidence: **Confirmed**

**8. Duplicate h2 text**
- Evidence: `"Three steps. One clean email."` appears twice in the h2 list.
- Impact: Minor. Likely mobile/desktop variants of the same section both in the DOM. Worth
  confirming only one is exposed to assistive tech / crawlers.
- Confidence: **Likely** (cause not verified)

### ℹ️ Info — needs a decision from you, not a fix

**9. robots.txt blocks AI crawlers while the site advertises llms.txt**
- Evidence: Cloudflare-managed robots.txt sets `Content-Signal: search=yes, ai-train=no,
  use=reference` and `Disallow: /` for GPTBot, ClaudeBot, CCBot, Google-Extended,
  Applebot-Extended, Bytespider, Amazonbot, meta-externalagent.
- This is **Cloudflare's managed robots.txt feature**, not a file in your repo (`public/` has
  no robots.txt). It may be on by default rather than by your choice.
- The tension: blocking AI crawlers is a legitimate IP position, but it is the opposite of
  "rank well in AI search". You cannot fully have both. Worth noting:
  - `Google-Extended` blocks Gemini *training* only — it does **not** affect Google Search
    ranking. Blocking it costs you nothing in classic SEO.
  - `GPTBot`/`ClaudeBot` are training crawlers. The *retrieval* bots that fetch pages to
    answer a live user question (`OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`) are
    currently **unmanaged** and inherit `Allow: /`.
  - So today you block training but allow live retrieval — which, if you want AI-search
    visibility without donating training data, is arguably already the right posture.
- Recommendation: **leave as-is unless you want AI-search presence**, in which case decide
  deliberately. Either way, fixing #1 (prerender) is what actually makes the retrieval bots
  able to read you — they don't run JS.
- Confidence: **Confirmed** (facts) / decision is yours

---

## Environment Limitations

- **PageSpeed Insights / Core Web Vitals: not collected.** Google's API rate-limited the
  request (no API key configured). This is a tooling limit, **not** a site finding — no
  conclusion about LCP/INP/CLS should be drawn from its absence. Re-run with a
  `PAGESPEED_API_KEY`, or use the Chrome UX Report / Lighthouse in DevTools.
- Playwright-based visual scripts not run (not installed).

## Not assessed

Single-page audit only. The site is one route, so crawl-depth, internal-link graph, and
orphan-page analysis are not meaningful here.
