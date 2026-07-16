# Hosting + demo-form email — setup guide

**Stack:** Cloudflare Pages (static hosting + serverless Function) → Resend (email) → your inbox.
**Cost:** €0. Cloudflare Pages free (unlimited bandwidth, 500 builds/mo, Functions on the Workers free tier at 100k req/day). Resend free (3,000 emails/mo, 100/day, 1 domain).
**Domain:** `kukis.nl`, registered at Squarespace.

---

## What's already done in the repo

| Change | File |
|---|---|
| Serverless email endpoint (`POST /api/demo`) | `functions/api/demo.ts` |
| `base` switched to `/` for a root domain | `vite.config.ts` |
| GitHub Pages workflow removed (Cloudflare builds from the repo) | `.github/workflows/deploy.yml` *(deleted)* |
| Env vars documented | `.env.example` |

The form needed **no changes** — it already POSTs JSON to `VITE_DEMO_FORM_ENDPOINT`, and the Function accepts exactly that payload. With the var unset (local dev) it still falls back to `mailto:`.

> ⚠️ These changes are on the `feedback/v1-restructure` branch. **Cloudflare builds from `main`, so merge this branch first.**

---

## 1. Resend — get a key and verify the domain

1. Sign up at [resend.com](https://resend.com) (or use your existing Consented Cart account).
2. **API Keys → Create** → scope *Sending access*. Copy the `re_...` key (shown once).
3. **Domains → Add Domain** → `kukis.nl`. Pick region **eu-west-1 (Ireland)** — closest to your merchants.
4. Resend shows the exact DNS records to add (an `MX` + SPF `TXT` on a send subdomain, and a DKIM `TXT`). Keep that tab open for step 3.

> **Testing before DNS is ready:** set `DEMO_FROM_EMAIL` to `Kukis <onboarding@resend.dev>`. Resend allows this without verification, but it will **only deliver to your own account email**. Swap to `demo@kukis.nl` once verified.

> **Data-residency note:** the region controls where mail is *sent from*. Resend stores account data, logs and email metadata in the **US** regardless. That makes Resend a US subprocessor — worth listing in your GDPR records. You already use Resend in Consented Cart, so this adds no new processor.

---

## 2. Cloudflare — add the site

1. Sign up at [cloudflare.com](https://cloudflare.com) → **Add a site** → `kukis.nl` → Free plan.
2. Cloudflare gives you **two nameservers** (e.g. `xxx.ns.cloudflare.com`). Copy them.

## 3. Squarespace — point the nameservers at Cloudflare

You keep the registration at Squarespace; only DNS moves. (This is required: Squarespace DNS can't CNAME-flatten the apex `kukis.nl`, which Pages needs. Cloudflare does it automatically.)

1. Squarespace → **Domains** → `kukis.nl` → **DNS** → **Nameservers**.
2. Switch from Squarespace defaults to **Custom nameservers** → paste Cloudflare's two.
3. Save. Propagation is usually minutes, up to 24h. Cloudflare emails you when active.
4. Once active, in **Cloudflare → DNS**, add the **Resend records** from step 1. Leave them **DNS only (grey cloud)** — never proxy MX/TXT.
5. Back in Resend → **Verify**.

## 4. Cloudflare Pages — deploy

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Pick `ZackAlatrash/kukis-site`, production branch **`main`**.
3. Build settings:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Deploy. You get a `*.pages.dev` URL — the site should be live.

## 5. Environment variables

Pages → your project → **Settings → Variables and Secrets**. Add for **Production** *(and Preview if you want previews to send)*:

| Name | Type | Value |
|---|---|---|
| `VITE_DEMO_FORM_ENDPOINT` | Variable | `/api/demo` |
| `RESEND_API_KEY` | **Secret** | `re_...` |
| `DEMO_TO_EMAIL` | Variable | your inbox |
| `DEMO_FROM_EMAIL` | Variable | `Kukis <demo@kukis.nl>` |

> `VITE_*` is a **build-time** var baked into the JS bundle — you must **redeploy** after adding it. The other three are read server-side by the Function at request time and never reach the browser.

## 6. Custom domain

Pages → **Custom domains → Set up a domain** → `kukis.nl`, then repeat for `www.kukis.nl`. Since DNS is on Cloudflare, records are added automatically and TLS is issued for free.

## 7. Test

1. Open `kukis.nl`, click **Book a demo**, submit the form.
2. Expect the green **"Request sent."** panel and an email in `DEMO_TO_EMAIL`. Hitting **reply** goes straight to the merchant (the Function sets `reply_to`).
3. If it fails, the form shows the error panel + the mailto fallback link. Debug via **Pages → Deployment → Functions → Real-time logs** (the Function logs Resend failures).

---

## Notes / gotchas

- **Merge to `main` first** — Cloudflare builds `main`, and these changes are on a branch.
- **`base: "/"` breaks the old GitHub Pages URL.** `github.io/kukis-site/` will serve broken assets. That's expected; the Pages workflow was removed. Turn Pages off in the repo settings to avoid confusion.
- **Spam:** the endpoint is public (any form endpoint is). Validation + length caps are in the Function. If you start getting junk, add a Cloudflare **WAF rate-limit rule** on `/api/demo` (free tier allows one) or a honeypot field — no code change needed for the WAF route.
- **Limits:** 100 emails/day on Resend free. Demo requests won't come close; if outreach spikes, Resend Pro is $20/mo.
