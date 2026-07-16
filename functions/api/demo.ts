/**
 * Cloudflare Pages Function — POST /api/demo
 *
 * Receives the demo-request payload from <DemoRequestForm/> and emails it via
 * Resend. Runs server-side, so RESEND_API_KEY never reaches the browser.
 *
 * Required env vars (Cloudflare Pages → Settings → Variables and Secrets):
 *   RESEND_API_KEY   secret  — from resend.com/api-keys
 *   DEMO_TO_EMAIL    plain   — where demo requests land (your inbox)
 *   DEMO_FROM_EMAIL  plain   — e.g. "Kukis <demo@kukis.nl>" (domain must be
 *                              verified in Resend; use onboarding@resend.dev
 *                              to test before kukis.nl is verified)
 */

type Env = {
  RESEND_API_KEY: string;
  DEMO_TO_EMAIL: string;
  DEMO_FROM_EMAIL: string;
};

type DemoPayload = {
  name?: unknown;
  email?: unknown;
  storeUrl?: unknown;
  country?: unknown;
  message?: unknown;
  storeSize?: unknown;
  submittedAt?: unknown;
  source?: unknown;
};

const MAX = { name: 120, email: 200, storeUrl: 300, country: 80, storeSize: 80, message: 4000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** Trim + cap an incoming string field. */
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Collapse CR/LF before interpolating into the subject line. Resend takes JSON
 * and sanitises, so this is defence-in-depth against header injection rather
 * than a live hole — but the subject is the one place raw input reaches a mail
 * header, so don't rely on someone else's escaping.
 */
const oneLine = (s: string) => s.replace(/[\r\n\t]+/g, " ").trim();

/** Escape for safe interpolation into the HTML email body. */
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  );

export const onRequest = async ({
  request,
  env,
}: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed." }, 405);
  }

  if (!env.RESEND_API_KEY || !env.DEMO_TO_EMAIL || !env.DEMO_FROM_EMAIL) {
    return json({ ok: false, error: "Email is not configured." }, 500);
  }

  let body: DemoPayload;
  try {
    body = (await request.json()) as DemoPayload;
  } catch {
    return json({ ok: false, error: "Invalid request body." }, 400);
  }

  const name = str(body.name, MAX.name);
  const email = str(body.email, MAX.email);
  const storeUrl = str(body.storeUrl, MAX.storeUrl);
  const country = str(body.country, MAX.country);
  const message = str(body.message, MAX.message);
  const storeSize = str(body.storeSize, MAX.storeSize) || "Not provided";
  const submittedAt = str(body.submittedAt, 40) || new Date().toISOString();

  if (!name || !email || !storeUrl || !country || !message) {
    return json({ ok: false, error: "Missing required fields." }, 400);
  }
  if (!EMAIL_RE.test(email)) {
    return json({ ok: false, error: "Invalid email address." }, 400);
  }

  const rows: [string, string][] = [
    ["Name", name],
    ["Email", email],
    ["Store URL", storeUrl],
    ["Country", country],
    ["Store size", storeSize],
    ["Submitted", submittedAt],
  ];

  const text = [
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    "Message:",
    message,
  ].join("\n");

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,sans-serif;color:#2e1c10;line-height:1.6">
      <h2 style="margin:0 0 16px">New Kukis demo request</h2>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:4px 16px 4px 0;color:#6f5c48">${esc(k)}</td><td style="padding:4px 0"><strong>${esc(v)}</strong></td></tr>`,
          )
          .join("")}
      </table>
      <div style="padding:12px 16px;background:#fff6e7;border-radius:12px;white-space:pre-wrap">${esc(message)}</div>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.DEMO_FROM_EMAIL,
      to: [env.DEMO_TO_EMAIL],
      reply_to: email, // hitting reply goes straight to the merchant
      subject: oneLine(`Kukis demo request — ${name} (${storeUrl})`),
      text,
      html,
    }),
  });

  if (!res.ok) {
    // Surface nothing sensitive to the client; log for Cloudflare's tail.
    console.error("Resend send failed", res.status, await res.text());
    return json({ ok: false, error: "Could not send the request." }, 502);
  }

  return json({ ok: true });
};
