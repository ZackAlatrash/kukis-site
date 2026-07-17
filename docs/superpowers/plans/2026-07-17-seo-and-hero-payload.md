# SEO Audit Closeout + Hero Payload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the media-query-in-effect root cause behind the hero's 11.5 MB download and ~512 MB bitmap RAM, serve responsive WebP frames, add real 404s and image alt text, then deploy the whole SEO branch to production.

**Architecture:** One hook (`useMediaQuery`) resolves media queries in the `useState` initialiser so first render already knows the answers — this is what makes reduced-motion skip the fetch entirely and lets `Scrub` pick the right frame set. Frame paths move to a pure module with unit tests. A committed encode script generates two WebP sets (760/1600) from the source JPEGs; output is committed, encoding is not part of the build.

**Tech Stack:** Vite 6, React 18, TypeScript, vitest (node env, pure-logic tests only), puppeteer (verification + prerender), cwebp, Cloudflare Pages.

**Spec:** [2026-07-17-seo-and-hero-payload-design.md](../specs/2026-07-17-seo-and-hero-payload-design.md)

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/useMediaQuery.ts` | **Create.** Single hook resolving a media query synchronously at init + subscribing. |
| `src/lib/useReducedMotion.ts` | **Modify.** Becomes a one-line wrapper; call sites unchanged. |
| `src/lib/cookieFrames.ts` | **Create.** Pure: `FRAMES`, `framePath(i, mobile)`. Unit-tested. |
| `src/lib/cookieFrames.test.ts` | **Create.** Unit tests for frame paths. |
| `src/components/sections/CookieScrubHero.tsx` | **Modify.** Use the hooks, abort in-flight fetches, use responsive paths. |
| `scripts/encode-frames.mjs` | **Create.** One-shot: JPEG → `cookie/760/*.webp` + `cookie/1600/*.webp`. |
| `scripts/verify-hero.mjs` | **Create.** Repeatable puppeteer check: request counts + decode sizes. |
| `public/404.html` | **Create.** Static 404 so Pages stops answering 200 for unmatched paths. |
| `public/cookie/760/`, `public/cookie/1600/` | **Create** (generated). Replace `public/cookie/f_*.jpg`. |

---

## Task 1: `useMediaQuery` hook

**Files:**
- Create: `src/lib/useMediaQuery.ts`
- Modify: `src/lib/useReducedMotion.ts`

- [ ] **Step 1: Create the hook**

```ts
import { useEffect, useState } from "react";

/**
 * Tracks a media query, resolved on the first render rather than in an effect.
 *
 * The initialiser matters more than it looks: an effect-resolved preference is
 * false for one render, and anything a child does on mount — mounting, fetching —
 * has already happened by the time it flips. React runs child effects before
 * parent ones, so the child never sees the corrected value in time.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
```

- [ ] **Step 2: Rewrite `useReducedMotion.ts` over it**

```ts
import { useMediaQuery } from "./useMediaQuery";

/** Tracks the user's prefers-reduced-motion setting, reactively. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/useMediaQuery.ts src/lib/useReducedMotion.ts
git commit -m "Resolve media queries on first render, not in an effect"
```

---

## Task 2: Pure frame-path module (TDD)

**Files:**
- Create: `src/lib/cookieFrames.test.ts`
- Create: `src/lib/cookieFrames.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";

import { FRAMES, framePath } from "./cookieFrames";

describe("framePath", () => {
  it("serves the 760px set to phones", () => {
    expect(framePath(0, true)).toBe("/cookie/760/f_001.webp");
  });

  it("serves the 1600px set to desktop", () => {
    expect(framePath(0, false)).toBe("/cookie/1600/f_001.webp");
  });

  it("pads the frame index to three digits", () => {
    expect(framePath(95, false)).toBe("/cookie/1600/f_096.webp");
    expect(framePath(9, false)).toBe("/cookie/1600/f_010.webp");
  });

  it("covers exactly the frames on disk", () => {
    expect(FRAMES).toBe(96);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/lib/cookieFrames.test.ts`
Expected: FAIL — cannot resolve `./cookieFrames`.

- [ ] **Step 3: Implement**

```ts
import { publicAsset } from "./publicAsset";

export const FRAMES = 96;

/**
 * Phones decode at 760px, so shipping them the 1600px set was 4x the pixels for
 * an identical picture. The set is chosen from the same flag that drives decode.
 */
export function framePath(i: number, mobile: boolean): string {
  const n = String(i + 1).padStart(3, "0");
  return publicAsset(`cookie/${mobile ? 760 : 1600}/f_${n}.webp`);
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/cookieFrames.test.ts`
Expected: PASS (4 tests). `publicAsset` prefixes `import.meta.env.BASE_URL`, which is `/` (set by `base: "/"` in `vite.config.ts`), so these paths are exact.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cookieFrames.ts src/lib/cookieFrames.test.ts
git commit -m "Pick the frame set from the same flag that drives decode"
```

---

## Task 3: Encode the WebP sets

**Files:**
- Create: `scripts/encode-frames.mjs`
- Create (generated): `public/cookie/760/*.webp`, `public/cookie/1600/*.webp`
- Delete: `public/cookie/f_*.jpg`

- [ ] **Step 1: Write the encode script**

```js
/* Regenerates the hero frame sets from the source JPEGs.
   Run by hand, output committed — the build already pays for Chromium and has
   no business shelling out to cwebp on every deploy.

   Two sets because the decode path already downscales to 760 on phones: the
   1600 set was 4x the pixels for a picture the phone throws away.

   Usage: node scripts/encode-frames.mjs <src-dir-of-jpgs> */
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const src = resolve(process.argv[2] ?? "");
const out = resolve("public/cookie");
const QUALITY = 78;
const SETS = [
  { dir: "760", width: 760 },
  { dir: "1600", width: 1600 },
];

const frames = readdirSync(src).filter((f) => /^f_\d{3}\.jpg$/.test(f)).sort();
if (frames.length === 0) throw new Error(`no f_###.jpg frames in ${src}`);

for (const { dir, width } of SETS) {
  const target = join(out, dir);
  mkdirSync(target, { recursive: true });
  for (const f of frames) {
    execFileSync("cwebp", [
      "-q", String(QUALITY),
      "-resize", String(width), "0",
      "-quiet",
      join(src, f),
      "-o", join(target, f.replace(/\.jpg$/, ".webp")),
    ]);
  }
  console.log(`${dir}: ${frames.length} frames`);
}
```

- [ ] **Step 2: Stash the source JPEGs outside the repo, then encode**

The JPEGs are the source art and must not be lost — copy them somewhere safe before deleting.

```bash
mkdir -p ~/kukis-frame-source && cp public/cookie/f_*.jpg ~/kukis-frame-source/
node scripts/encode-frames.mjs ~/kukis-frame-source
```

Expected: `760: 96 frames` then `1600: 96 frames`.

- [ ] **Step 3: Verify sizes and drop the JPEGs**

```bash
du -sh public/cookie/760 public/cookie/1600
rm public/cookie/f_*.jpg
```

Expected: roughly `2.5M` and `7.6M`. If either is wildly off, stop — the quality setting or resize argument is wrong.

- [ ] **Step 4: Commit**

```bash
git add scripts/encode-frames.mjs public/cookie
git commit -m "Encode hero frames as responsive WebP"
```

---

## Task 4: Wire the hero to the hooks and abort in-flight fetches

**Files:**
- Modify: `src/components/sections/CookieScrubHero.tsx`

- [ ] **Step 1: Replace the local `FRAMES`/`framePath` with the module**

Delete the local `const FRAMES = 96;` (line ~11) and `const framePath = ...` (line ~19). Add to the imports:

```ts
import { FRAMES, framePath } from "../../lib/cookieFrames";
import { useMediaQuery } from "../../lib/useMediaQuery";
```

- [ ] **Step 2: Resolve `isSmall` at init instead of in an effect**

Replace the `isSmall` `useState` + `useEffect` block in `CookieScrubHero` (lines ~81-92) with:

```ts
export function CookieScrubHero() {
  const reduced = usePrefersReducedMotion();
  const isSmall = useMediaQuery("(max-width: 820px)");

  if (reduced) return <Hero />;
  return <Scrub mobile={isSmall} />;
}
```

Remove the now-unused `useState`/`useEffect` imports from this component if nothing else uses them.

- [ ] **Step 3: Abort in-flight decodes and use the responsive path**

In `Scrub`'s effect, replace the decode block (lines ~211-230) with:

```ts
    // decode every frame off-thread, once; draw each as it lands. Phones decode
    // at a smaller width to keep the total bitmap memory reasonable.
    const abort = new AbortController();
    if (!startedRef.current) {
      startedRef.current = true;
      const decodeOpts = mobileRef.current
        ? ({ resizeWidth: 760, resizeQuality: "high" } as ImageBitmapOptions)
        : undefined;
      for (let i = 0; i < FRAMES; i++) {
        fetch(framePath(i, mobileRef.current), { signal: abort.signal })
          .then((res) => res.blob())
          .then((blob) =>
            decodeOpts
              ? createImageBitmap(blob, decodeOpts).catch(() => createImageBitmap(blob))
              : createImageBitmap(blob)
          )
          .then((bmp) => {
            bitmaps[i] = bmp;
            const cur = Math.round(progressRef.current * (FRAMES - 1));
            if (i === cur || i === 0) lastDrawn.current = -1; // force redraw
          })
          .catch(() => {});
      }
    } else {
      lastDrawn.current = -1; // already loaded (remount) → redraw current frame
    }
```

And add the abort to the effect's cleanup (line ~243):

```ts
    return () => {
      abort.abort();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", sizeCanvas);
    };
```

- [ ] **Step 4: Typecheck and test**

Run: `npx tsc --noEmit && npm test`
Expected: no type errors; 11 tests pass (7 existing + 4 new).

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/CookieScrubHero.tsx
git commit -m "Stop fetching hero frames nobody asked for"
```

---

## Task 5: Verify the hero fix by measurement

**Files:**
- Create: `scripts/verify-hero.mjs`

This is the test for Tasks 1-4. It must be run against a **built** site (`npm run build`).

- [ ] **Step 1: Write the verification script**

```js
/* Measures what the hero actually costs a visitor. The bugs it guards against
   were all invisible to type checks and unit tests: an effect-resolved media
   query still renders once with the wrong answer, and the only proof is
   counting the requests and decodes that result.

   Usage: npm run build && node scripts/verify-hero.mjs */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import puppeteer from "puppeteer";

const DIST = resolve("dist");
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".webp": "image/webp", ".png": "image/png",
  ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".xml": "application/xml",
};

const server = createServer(async (req, res) => {
  const path = new URL(req.url, "http://x").pathname;
  const file = path === "/" ? "/index.html" : path;
  try {
    const body = await readFile(join(DIST, file));
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;

async function probe({ mobile, reduced }) {
  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.setViewport(
      mobile ? { width: 412, height: 915, isMobile: true, hasTouch: true }
             : { width: 1280, height: 800 }
    );
    if (reduced) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await page.evaluateOnNewDocument(() => {
      window.__decodes = { withOpts: 0, withoutOpts: 0, sizes: new Set() };
      const orig = window.createImageBitmap;
      window.createImageBitmap = function (blob, opts) {
        if (opts?.resizeWidth) window.__decodes.withOpts++; else window.__decodes.withoutOpts++;
        return orig.apply(this, arguments).then((b) => {
          window.__decodes.sizes.add(`${b.width}x${b.height}`); return b;
        });
      };
    });
    const urls = [];
    page.on("response", (r) => { if (r.url().includes("/cookie/")) urls.push(r.url()); });
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 8000));
    const d = await page.evaluate(() => ({ ...window.__decodes, sizes: [...window.__decodes.sizes] }));
    const bytes = await page.evaluate(() =>
      performance.getEntriesByType("resource")
        .filter((r) => r.name.includes("/cookie/"))
        .reduce((a, r) => a + r.transferSize, 0));
    return { requests: urls.length, mb: +(bytes / 1048576).toFixed(2), urls, ...d };
  } finally { await browser.close(); }
}

const fail = [];
const expect = (cond, msg) => { console.log(`${cond ? "  ok  " : " FAIL "} ${msg}`); if (!cond) fail.push(msg); };

const rm = await probe({ mobile: true, reduced: true });
console.log(`\nreduced-motion phone: ${rm.requests} frame requests, ${rm.mb} MB`);
expect(rm.requests === 0, "reduced motion fetches no frames");

const phone = await probe({ mobile: true, reduced: false });
console.log(`\nphone: ${phone.requests} requests, ${phone.mb} MB, decoded ${phone.sizes.join(",")}`);
expect(phone.requests === 96, "phone fetches all 96 frames");
expect(phone.urls.every((u) => u.includes("/cookie/760/")), "phone fetches only the 760 set");
expect(phone.mb < 3, `phone frame payload under 3 MB (got ${phone.mb})`);
expect(phone.withOpts === 96 && phone.withoutOpts === 0, "phone decodes every frame with resizeWidth");

const desk = await probe({ mobile: false, reduced: false });
console.log(`\ndesktop: ${desk.requests} requests, ${desk.mb} MB, decoded ${desk.sizes.join(",")}`);
expect(desk.urls.every((u) => u.includes("/cookie/1600/")), "desktop fetches only the 1600 set");
expect(desk.mb < 9, `desktop frame payload under 9 MB (got ${desk.mb})`);

server.closeAllConnections(); server.close();
if (fail.length) { console.error(`\n${fail.length} check(s) failed`); process.exit(1); }
console.log("\nall hero checks passed");
```

- [ ] **Step 2: Build and run it**

Run: `npm run build && node scripts/verify-hero.mjs`
Expected: `all hero checks passed`. The phone payload should land near **2.5 MB** (was 11.5) and decode at **760x415** (was 1600x873).

- [ ] **Step 3: Commit**

```bash
git add scripts/verify-hero.mjs
git commit -m "Guard the hero's payload with a check that counts bytes"
```

---

## Task 6: Visual parity of the scrub

**Files:** none (verification only)

WebP q78 is lossy at a different point than the source JPEG. Confirm the hero still looks right before trusting the byte savings.

- [ ] **Step 1: Screenshot the scrub at several progress points**

Start a server on `dist/`, then in the browser scroll the hero to ~0%, ~40%, ~80% of its track and screenshot each. Compare against the same points from `git stash`-ing the frame change, or against the live site.

- [ ] **Step 2: Judge**

Expected: no visible banding, no colour shift on the chocolate, edges of the breaking pieces still crisp. If any frame looks degraded, re-run Task 3 with `QUALITY = 85` and re-measure — 85 costs roughly 25% more bytes and is still far under the JPEG baseline.

- [ ] **Step 3: Record the outcome in the audit doc** (no commit yet; folded into Task 9)

---

## Task 7: Real 404s

**Files:**
- Create: `public/404.html`

- [ ] **Step 1: Create the 404 page**

Static, not React — it has to work as a plain document.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Not found — Kukis</title>
    <meta name="robots" content="noindex" />
    <style>
      body { margin: 0; min-height: 100dvh; display: grid; place-items: center;
             background: #FFF6E7; color: #3D2B1F; text-align: center;
             font-family: Inter, system-ui, sans-serif; padding: 2rem; }
      h1 { font-size: 1.5rem; margin: 0 0 .5rem; }
      p { margin: 0 0 1.5rem; color: #6B5744; }
      a { color: #2F6FB0; font-weight: 600; }
    </style>
  </head>
  <body>
    <main>
      <h1>That page doesn't exist</h1>
      <p>The crumb trail went cold.</p>
      <a href="/">Back to Kukis</a>
    </main>
  </body>
</html>
```

- [ ] **Step 2: Build and check the status code locally**

```bash
npm run build
npx serve dist -p 8123 &
sleep 2
curl -s -o /dev/null -w "root: %{http_code}\n" http://127.0.0.1:8123/
curl -s -o /dev/null -w "missing: %{http_code}\n" http://127.0.0.1:8123/nope-not-a-page
kill %1
```

Expected: `root: 200`, `missing: 404`. Note this only proves the file exists and is served — Cloudflare Pages' fallback behaviour is the real test, deferred to Task 10.

- [ ] **Step 3: Commit**

```bash
git add public/404.html
git commit -m "Answer 404 for pages that do not exist"
```

---

## Task 8: Image alt attributes

**Files:**
- Modify: `src/components/ui/CookieCrumbBackdrop.tsx`
- Modify: `src/components/ui/CrumbCursor.tsx`
- Modify: `src/components/ui/CookieMascot.tsx`
- Modify: `src/components/sections/CrumblingCrowd.tsx`
- Modify: `src/components/sections/Widgets.tsx`

- [ ] **Step 1: List every `<img>` and its current alt**

```bash
grep -rn '<img' src/ -A 6 | grep -nE '<img|alt=|src=' | head -40
```

- [ ] **Step 2: Apply the rule, image by image**

Decorative → `alt=""` (explicitly empty; this is correct and is **not** the same as omitting the attribute). Applies to: crumb particles (`CookieCrumbBackdrop`, `CrumbCursor`, `CrumblingCrowd` crumbs), background figures.

Meaningful → short factual alt. Applies to:
- `CookieMascot` mascot image → `alt="The Kukis cookie mascot"` (only if the mascot isn't already `aria-hidden` with the bubble carrying the text — check first; if the bubble is the message, the image is decorative and takes `alt=""`).
- `Widgets` screenshots → describe the widget, e.g. `alt="Cart-save widget asking for an email before checkout"`.
- `CrumblingCrowd` figures → if they're purely illustrative of "shoppers leaving", `alt=""` is right; the heading carries the meaning.

Do **not** add descriptive alt to anything decorative. A screen reader announcing 23 crumb particles is worse than silence.

- [ ] **Step 3: Verify none are missed**

```bash
npm run build
node -e "
const {readFileSync}=require('fs');
const h=readFileSync('dist/index.html','utf8');
const imgs=[...h.matchAll(/<img[^>]*>/g)].map(m=>m[0]);
const missing=imgs.filter(t=>!/\salt=/.test(t));
console.log('imgs:',imgs.length,'missing alt:',missing.length);
missing.slice(0,5).forEach(t=>console.log(' ',t.slice(0,110)));
process.exit(missing.length?1:0);
"
```

Expected: `missing alt: 0`. Note the prerendered HTML only contains images present at snapshot time; the hero canvas is `aria-hidden` and has no `<img>`.

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "Give every image an alt, empty where that is the honest answer"
```

---

## Task 9: Update the audit docs

**Files:**
- Modify: `docs/seo-audit.md`
- Modify: `docs/seo-roadmap.md`

- [ ] **Step 1: Update the audit**

Move the two 🔴 hero findings to fixed, with the measured after-numbers from Task 5 (phone payload, decode size, bitmap RAM). Add the `resizeWidth`-never-ran finding as a third, now-fixed item — it was discovered during this work and is not in the audit yet. Record the Task 6 visual-parity outcome and the WebP quality used.

- [ ] **Step 2: Update the roadmap**

Tick items 2, 3, 5. Leave 4 (art) and 6 (PageSpeed key) open and marked as owned by the user. Item 1 (deploy) is closed by Task 10.

- [ ] **Step 3: Commit**

```bash
git add docs/seo-audit.md docs/seo-roadmap.md
git commit -m "Record what the hero actually costs now"
```

---

## Task 10: Deploy

**Files:** none

- [ ] **Step 1: Full green check before merging**

```bash
npx tsc --noEmit && npm test && npm run build && node scripts/verify-hero.mjs
```

Expected: no type errors, 11 tests pass, prerender reports >5,000 chars, all hero checks pass.

- [ ] **Step 2: Merge and push**

```bash
git checkout main
git merge --no-ff seo-improvements
git push origin main
```

- [ ] **Step 3: Watch the Pages build**

The first build pulls ~200 MB of Chromium for puppeteer. If it fails there, do **not** silently disable prerendering — the fallback is reverting the `build` script line and shipping the rest, which is still most of the value.

- [ ] **Step 4: Verify production**

```bash
sleep 60
curl -s https://kukis.nl/ | wc -c                                        # expect ~91000, not ~1000
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" https://kukis.nl/sitemap.xml   # expect 200 application/xml
curl -s -o /dev/null -w "%{http_code}\n" https://kukis.nl/nope-not-a-page                # expect 404
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" https://kukis.nl/cookie/760/f_001.webp  # expect 200 image/webp
```

- [ ] **Step 5: Verify Turnstile on the real site — the one thing never tested locally**

Open https://kukis.nl, click **Book a demo**, confirm the Turnstile widget mounts (an iframe from `challenges.cloudflare.com`), complete the form and submit. Confirm a real success response, not the mailto fallback.

If Turnstile does not mount, check the browser console for a CSP violation and Pages → Settings for `VITE_TURNSTILE_SITE_KEY`. This is the most likely rollback trigger.

- [ ] **Step 6: Submit the sitemap**

In Google Search Console, submit `https://kukis.nl/sitemap.xml`. robots.txt is Cloudflare-managed, so a `Sitemap:` directive would mean dropping the AI-crawler rules — Search Console achieves the same with no tradeoff.

---

## Out of scope

`og:image` and favicon (user is making the art — when it lands, add the files and flip `twitter:card` from `summary` to `summary_large_image` in the same commit); PageSpeed API key (user is getting one); `llms.txt`; FAQPage/HowTo schema; framework migration; AI-crawler posture.
