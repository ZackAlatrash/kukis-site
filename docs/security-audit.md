# Security Audit — kukis.nl

**Date:** 2026-07-16 · **Scope:** live site, `/api/demo` Function, DNS/email, repo, dependencies
**Method:** `npm audit`, ruflo `security scan --depth deep`, plus manual testing of the live attack surface (secret leakage, rate limiting, CORS, headers, DNS/email auth, git history).

> The automated scans returned **0 issues**. That result is not meaningful on its own — neither tool exercises the live endpoint, which is where the real risk is. Findings below come from manual probing.

---

## Verified good ✅

| Check | Result |
|---|---|
| `RESEND_API_KEY` in JS bundle | ✅ absent — server-side only. The Function architecture did its job |
| Secrets in git history | ✅ none (`re_` keys, `.env`, api_key patterns all clean) |
| Source maps exposed | ✅ none (the `.js.map` 200 is just the SPA fallback serving `index.html`) |
| `npm audit` | ✅ 0 vulnerabilities; only 4 prod deps |
| Input validation + length caps | ✅ in the Function |
| HTML escaping in outbound email | ✅ `esc()` — no injection into the email body |
| Recipient hard-coded server-side | ✅ **not an open relay** — attackers cannot send to third parties |
| Cross-origin preflight | ✅ `OPTIONS → 405` blocks browser-based cross-origin POSTs |
| Email auth | ✅ SPF + DKIM + `DMARC p=reject` (strict) |
| TLS | ✅ Cloudflare-managed |

---

## Findings

### 🔴 H1 — No rate limiting on `/api/demo` (lead-flow denial of service)

12 rapid POSTs were all processed; no `429` at any point. Anyone can script valid submissions.

**What it is *not*:** an open spam relay. `DEMO_TO_EMAIL` is fixed server-side, so an attacker can't email third parties. That's the important containment.

**What it *is*:** an attacker can
1. burn your **Resend free quota (100/day)** in a couple of minutes → **real demo requests then silently fail for the rest of the day**, and
2. flood `hello@kukis.nl` with attacker-controlled name/message content.

For a site whose only job is capturing leads from cold outreach, that's the highest-impact issue here.

**Fix:** Cloudflare **WAF rate-limiting rule** on `/api/demo` (free tier includes 1 rule). E.g. 5 requests / 10 min / IP. No code change. **See H2 — the rule must cover both hostnames.**

**Better fix:** **Cloudflare Turnstile** — free, no cookies, GDPR-friendly. Notably on-brand for a consent-first company (unlike reCAPTCHA, which is Google tracking). Requires a small code change on the form + Function.

### 🔴 H2 — `pages.dev` bypasses a WAF rule scoped to `kukis.nl`

`https://kukis-site.pages.dev/api/demo` is live and fully functional. A rate-limit rule matching only `kukis.nl` is trivially bypassed by hitting the `pages.dev` hostname instead.

**Fix:** scope the WAF rule by **path** (`/api/demo`) rather than hostname, or explicitly include both hostnames. Optionally disable/redirect the `pages.dev` alias once the custom domain is stable.

### 🟠 M1 — Missing security headers

| Header | Status |
|---|---|
| `strict-transport-security` (HSTS) | ❌ missing |
| `content-security-policy` | ❌ missing |
| `x-frame-options` / `frame-ancestors` | ❌ missing → **clickjacking possible** |
| `permissions-policy` | ❌ missing |
| `x-content-type-options` | ✅ present |
| `referrer-policy` | ✅ present |

Real-world risk is modest (React escapes output, no `dangerouslySetInnerHTML`, no user-generated content is rendered), but clickjacking and the absent HSTS are worth closing. **Fix:** a `public/_headers` file — Cloudflare Pages supports it natively, no dashboard config.

### 🟠 M2 — DNSSEC still disabled

We turned it off to resolve the outage during the nameserver migration; the DS record is still absent. Without it, DNS responses aren't cryptographically validated.

**Fix:** re-enable **on Cloudflare** (DNS → Settings → DNSSEC → Enable), then publish the DS it gives you at Squarespace. Order matters: enable at the DNS provider **first**, then the registrar. Doing it backwards is exactly what caused the earlier outage.

### 🟡 L1 — Stale GitHub Pages deployment still live

`zackalatrash.github.io/kukis-site/` returns 200 and serves an outdated, broken build (`base` is now `/`). Not a vulnerability, but it's a public, indexable, wrong version of your site.

**Fix:** repo → Settings → Pages → disable.

### 🟡 L2 — Subject-line inputs aren't newline-stripped

The Function builds `subject: Kukis demo request — ${name} (${storeUrl})` from user input. `name` is trimmed and capped but not stripped of CR/LF. Sent as JSON to Resend (which sanitises), so this is defence-in-depth rather than a live vulnerability.

**Fix:** strip `[\r\n]` from any value interpolated into the subject.

---

## Recommended order

1. **H1 + H2** — WAF rate-limit rule on path `/api/demo` (~5 min, no code)
2. **L1** — turn off GitHub Pages (~1 min)
3. **M1** — add `public/_headers` (code, small)
4. **M2** — re-enable DNSSEC, correct order this time
5. **L2** — newline-strip subject inputs (code, small)
6. *Optional:* Turnstile on the form — the strongest anti-abuse fix, and on-brand
