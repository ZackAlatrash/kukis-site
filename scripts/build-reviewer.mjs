/* Builds the App Store **reviewer** screencast — the "Screencast URL" on the
 * listing, which asks for onboarding plus core functionality, both the
 * merchant and the customer flow, in three to eight minutes.
 *
 *   cd kukis-site && node scripts/build-reviewer.mjs
 *
 * This is a different film from the promo (build-screencast.mjs). The promo
 * sells; this one demonstrates. So nothing here is an illustration: every
 * merchant frame is a real screenshot of the live admin on the demo store, and
 * every shopper scene is a real recording of the live storefront.
 *
 * Output: screencast/kukis-reviewer-demo.mp4
 */
import { execFile } from "node:child_process";
import { mkdir, rm, access } from "node:fs/promises";
import { promisify } from "node:util";
import { resolve } from "node:path";

const run = promisify(execFile);
const SCENES = resolve(process.cwd(), "scenes");
const ADMIN = resolve(process.cwd(), "admin-shots");
const WORK = resolve(process.cwd(), ".reviewer-build");
const OUT = resolve(process.cwd(), "screencast");

const FONT = "/System/Library/Fonts/Supplemental/Arial.ttf";
const FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf";

const VOICE = process.env.VO_VOICE || "af_heart";
const VOICE_SPEED = process.env.VO_SPEED || "1.0";
const KOKORO_PY = resolve(process.cwd(), ".venv-tts/bin/python");

const BARK = "#2C1E14";
const CREAM = "#E4D6C6";
const AMBER = "#DEA255";

const LEAD_IN = 0.5;
const TAIL = 0.8;

/**
 * A reviewer is checking behaviour, not watching a trailer, so footage runs
 * much closer to real time than the promo's 3x. Above about 1.6x a form being
 * filled in stops looking like a form being filled in.
 */
const MAX_SPEED = 1.6;

/** Seconds the admin stills take to finish their push-in, before holding still. */
const PUSH_IN = 3.5;

/**
 * Chapter cards, so a reviewer can see the structure without a timeline.
 * `chapter` renders one before the segment it sits on.
 */
const SEGMENTS = [
  {
    id: "00-title",
    card: { top: "Kukis", bottom: "Merchant setup and shopper flow, end to end" },
    accentTop: true,
    say: "Kukis is a consent capture app for Shopify. Shoppers email themselves a cart, a product or a wishlist, and every consent they give is recorded with the exact wording they saw. This walkthrough shows both sides: what a merchant sets up, and what a shopper does.",
  },

  // ---- Merchant: onboarding -------------------------------------------------
  {
    id: "01-chapter-setup",
    card: { top: "1. Onboarding", bottom: "The five-step setup guide, straight after install" },
    say: "After install, Kukis opens a five step setup guide.",
  },
  {
    id: "02-step1-sender",
    image: "a1-step1-sender.png",
    caption: "Step 1 — sender identity, prefilled from Shopify",
    say: "Step one is the sender identity: the store name shoppers will see, a reply-to address, and the domain the email is sent from. All three are prefilled from the merchant's own Shopify settings, so usually they are only confirmed. This step is also where the data processing agreement is accepted. Until it is, Kukis refuses to capture anything at all.",
  },
  {
    id: "03-step2-banner",
    image: "a2-step2-banner.png",
    caption: "Step 2 — connect the cookie banner",
    say: "Step two connects the cookie banner. Kukis reads the shopper's cookie choice from Shopify's Customer Privacy API, whichever banner collected it, and keeps that choice with the consent record. The step also hands the merchant the one storage entry they need to declare, because the wishlist keeps a single strictly necessary identifier.",
  },
  {
    id: "04-step3-discount",
    image: "a3-step3-discount.png",
    caption: "Step 3 — optional discount code for recovery emails",
    say: "Step three is optional: a discount code to include in recovery emails. Kukis never creates or changes discount codes. The merchant makes one in Shopify and pastes it here.",
  },
  {
    id: "05-step4-widgets",
    image: "a4-step4-widgets.png",
    caption: "Step 4 — activate the widgets in the theme editor",
    say: "Step four activates the widgets. Every widget is a Shopify app block, added in the theme editor, so nothing changes on the storefront until the merchant saves it there themselves.",
  },
  {
    id: "06-step5-plan",
    image: "a5-step5-plan.png",
    caption: "Step 5 — plan, on Shopify managed pricing",
    say: "Step five is the plan. Billing runs through Shopify's managed pricing, with a thirty day trial, and it stays free on development stores.",
  },
  {
    id: "07-widgets",
    image: "b1-widgets.png",
    caption: "One switch per widget, independent of the theme",
    say: "After setup, the Widgets page is a single switch for each one. Turning a widget off here hides it everywhere at once, without touching the theme.",
  },

  // ---- Customer flow --------------------------------------------------------
  {
    id: "08-chapter-shopper",
    card: { top: "2. The shopper", bottom: "Recorded on the live demo storefront" },
    say: "Now the shopper's side, recorded on the live storefront.",
  },
  {
    id: "09-save-for-later",
    file: "r1-save-for-later.webm",
    caption: "Save for later — the marketing box starts unticked",
    say: "On a product page, Save for later. The shopper is the one who asks, so there is no popup and no tracking cookie. The form opens with the marketing box unticked, every time. Here the shopper types their address, deliberately ticks marketing, and submits.",
  },
  {
    id: "10-unticked",
    file: "r2-unticked.webm",
    caption: "Left unticked: the email still goes, and the no is recorded",
    say: "The same widget again, but this time the marketing box is left alone. The email still goes out, because that is the request the shopper made. And Kukis writes a marketing record anyway, with consent set to no. A refusal on the record is proof of a refusal, not a gap in the log.",
  },
  {
    id: "11-cart-save",
    file: "r3-cart-save.webm",
    caption: "Save cart — a link back to this exact basket",
    say: "On the cart page, the Save cart block does the same thing for a whole basket. The shopper adds a jacket, opens the cart, and asks for it by email. What comes back is a link that rebuilds this exact cart, so nothing has to be found again. Kukis records the click on that link, and if an order follows it, it is counted as recovered on the dashboard.",
  },
  {
    id: "12-rejection-recovery",
    file: "r4-rejection-recovery.webm",
    caption: "Declined cookies — Rejection Recovery offers the cookie-free ask",
    say: "This is the case Kukis exists for. The shopper declines cookies. A couple of seconds later a small note offers the one thing that still works without them: an email they ask for. It never covers the page, it shows at most once, and it stores nothing in the browser.",
  },
  {
    id: "13-wishlist",
    file: "r5-wishlist.webm",
    caption: "Wishlist — no account, and it survives a reload",
    say: "The wishlist needs no account and no login. Hearts add products from any product page, and the count in the header follows along. Watch the reload here: the list is still there afterwards, and it will still be there on the next visit. No email has been asked for at any point, and nothing is stored beyond one strictly necessary identifier in local storage.",
  },
  {
    id: "14-wishlist-claim",
    file: "r6-wishlist-claim.webm",
    caption: "Price-drop alerts — a separate consent from marketing",
    say: "The only place the wishlist asks for an email is price drop alerts, and it asks with two separate checkboxes. The alert consent is required for alerts. Marketing is not, and it is a different yes.",
  },

  // ---- Merchant: what lands in the admin ------------------------------------
  {
    id: "15-chapter-admin",
    card: { top: "3. Back in the admin", bottom: "What those captures look like to the merchant" },
    say: "Back in the admin, this is what those captures look like to the merchant.",
  },
  {
    id: "16-dashboard",
    image: "c1-dashboard-top.png",
    caption: "Home — contacts you may email, and your own setup at a glance",
    say: "The dashboard opens with how many shoppers can be emailed, what they saved, and the merchant's own configuration at a glance.",
  },
  {
    id: "17-rejected-yes",
    image: "c2-rejected-yes.png",
    caption: "Shoppers who declined cookies and still left an email",
    say: "This panel counts shoppers who declined marketing cookies and still chose to leave an email: the captures, the marketing yeses, and any orders that followed. It is the measure of what the cookie free ask recovered.",
  },
  {
    id: "18-metrics",
    image: "c3-all-metrics.png",
    pan: "bottom",
    caption: "Saved, delivered, and what came back as orders",
    say: "Below it, the full set. What shoppers saved, what the email provider confirmed as delivered, and what came back as orders.",
  },
  {
    id: "19-consent-log",
    image: "d1-consent-log.png",
    caption: "Consent log — filterable, paged, CSV export",
    say: "The consent log is the evidence. Filter by address, widget, consent type, send status or date, page through with a cursor, and export the result as a streaming C S V. The addresses are blurred in this video only, because it is published publicly — the merchant sees them in full.",
  },
  {
    id: "20-consent-log-table",
    image: "d2-consent-log-table.png",
    pan: "bottom",
    caption: "Every row: time, consent, widget, cookie choice, delivery",
    say: "Each row carries the time in U T C, the address, which consent it was, whether it was given, the widget, what opened it, the shopper's cookie choice at that moment, the wording version, and the delivery status of the email.",
  },
  {
    id: "21-proof",
    image: "d3-proof.png",
    caption: "Per-contact proof — the exact wording the shopper saw",
    say: "Opening one contact gives a single page of proof. The exact wording that shopper was shown, its version and its language, the widget, what opened it, their cookie choice, and their I P as a network only, never the full address.",
  },
  {
    id: "22-proof-emails",
    image: "d4-proof-emails.png",
    pan: "bottom",
    caption: "Emails sent, delivery events, and Shopify customer writes",
    say: "Underneath, every email sent to that contact with its delivery events, and anything written to Shopify customers on their behalf. The page prints to P D F, which is what a data request usually needs.",
  },
  {
    id: "23-exports",
    image: "e1-exports.png",
    caption: "Exports — only contacts you may still email",
    say: "Exports give the contacts a merchant may still email. Anyone who unsubscribed, bounced, complained, was blocked, or asked to be erased is left out, so the file can go straight into an email tool.",
  },
  {
    id: "24-sending-domain",
    image: "f1-sending-domain.png",
    caption: "Sends from the merchant's own verified domain",
    say: "Email sends from the merchant's own verified domain rather than a shared one, so the sending reputation they build belongs to them.",
  },
  {
    id: "25-dns",
    image: "f2-dns-verified.png",
    pan: "bottom",
    caption: "The exact DNS records, re-checked automatically",
    say: "Kukis shows the exact D N S records to add, re-checks them on its own, and holds outgoing mail until they verify.",
  },
  {
    id: "26-cookies",
    image: "f3-cookie-banner.png",
    pan: "bottom",
    caption: "No cookies — one strictly-necessary storage entry, declared",
    say: "Settings restates exactly what Kukis stores on a shopper's device: no cookies at all, and one strictly necessary local storage entry for the wishlist, with the declaration text ready to paste into a banner's list.",
  },
  {
    id: "27-rejection-settings",
    image: "f4-rejection-preview.png",
    pan: "bottom",
    caption: "Rejection Recovery — switchable, previewed per language",
    say: "Rejection Recovery can be switched off from here, and previewed in each language it ships in.",
  },
  {
    id: "28-integrations",
    image: "g1-integrations.png",
    caption: "Webhooks — signed, with an idempotency key",
    say: "For merchants with their own systems, captures can be posted to a webhook, signed with an H M A C over the raw body and carrying a stable idempotency key.",
  },
  {
    id: "29-privacy",
    image: "h1-privacy-requests.png",
    caption: "Shopify's three privacy webhooks, answered and logged",
    say: "Shopify's three mandatory privacy webhooks are answered by Kukis itself and logged here. Redaction removes the address, the I P, the cart and the wishlist, and keeps the hashed address, the wording and its timestamp, so proof that consent was obtained survives the erasure.",
  },
  {
    id: "30-outro",
    file: "anim-outro.webm",
    animation: true,
    say: "Shoppers get what they asked for. Merchants get a contactable customer, and the consent behind it on record. That is Kukis.",
  },
];

const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const duration = async (path) => {
  const { stdout } = await run("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path,
  ]);
  return Number.parseFloat(stdout.trim());
};

/** Captions are PNG overlays: this ffmpeg has no libfreetype, so no drawtext. */
const captionOverlay = async (text, path) =>
  run("magick", [
    "-size", "1920x1080", "xc:none",
    "-fill", "rgba(20,14,10,0.78)",
    "-draw", "roundrectangle 130,918 1790,1022 14,14",
    "-font", FONT, "-pointsize", "40", "-fill", CREAM,
    "-gravity", "north", "-annotate", "+0+940", text,
    path,
  ]);

const cardImage = async ({ top, bottom }, path, accentTop) =>
  run("magick", [
    "-size", "1920x1080", `xc:${BARK}`,
    "-font", FONT_BOLD, "-pointsize", "84",
    "-fill", accentTop ? AMBER : CREAM,
    "-gravity", "center", "-annotate", "+0-60", top,
    "-font", FONT, "-pointsize", "40", "-fill", CREAM,
    "-gravity", "center", "-annotate", "+0+50", bottom,
    path,
  ]);

const narration = async (segment) => {
  const raw = `${WORK}/vo-${segment.id}-raw.wav`;
  const out = `${WORK}/vo-${segment.id}.wav`;
  await run(KOKORO_PY, ["scripts/say-kokoro.py", VOICE, VOICE_SPEED, raw, segment.say]);
  await run("ffmpeg", ["-y", "-loglevel", "error", "-i", raw, "-ar", "48000", "-ac", "2", out]);
  return out;
};

await rm(WORK, { recursive: true, force: true });
await mkdir(WORK, { recursive: true });
await mkdir(OUT, { recursive: true });

const segmentFiles = [];
const missing = [];

for (const segment of SEGMENTS) {
  const voPath = await narration(segment);
  const voSeconds = await duration(voPath);
  const spoken = LEAD_IN + voSeconds + TAIL;

  const videoSource = segment.file ? `${SCENES}/${segment.file}` : null;
  const imageSource = segment.image ? `${ADMIN}/${segment.image}` : null;

  for (const source of [videoSource, imageSource]) {
    if (source && !(await exists(source))) {
      missing.push(`${segment.id}: ${source}`);
    }
  }
  if (missing.some((m) => m.startsWith(`${segment.id}:`))) {
    console.log(`  ${segment.id.padEnd(22)} SKIPPED — source missing`);
    continue;
  }

  let footageSeconds = 0;
  if (videoSource) {
    // Normalise, then drop frames identical to their predecessor: that is
    // where a browser recording's dead air lives — a page mid-load changes
    // nothing on screen for seconds at a time.
    await run("ffmpeg", [
      "-y", "-loglevel", "error", "-i", videoSource,
      "-vf", [
        "scale=1920:1080:force_original_aspect_ratio=decrease",
        "pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
        "fps=30",
        // Deliberately no mpdecimate. The promo strips still frames because a
        // trailer cannot afford them; here the stills ARE the demonstration —
        // a form sitting open with the box unticked is the thing being shown.
        // Decimating collapsed a 35-second journey into three seconds and then
        // froze on the last frame for the rest of the narration.
        "format=yuv420p",
      ].join(","),
      "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
      `${WORK}/base-${segment.id}.mp4`,
    ]);
    footageSeconds = await duration(`${WORK}/base-${segment.id}.mp4`);
  } else if (!imageSource) {
    await cardImage(segment.card, `${WORK}/card-${segment.id}.png`, segment.accentTop);
  }

  let target = spoken;
  let speed = 1;
  if (segment.animation) {
    target = Math.max(footageSeconds, spoken);
  } else if (videoSource && footageSeconds > spoken) {
    // Every frame of a shopper journey is kept. When the footage outruns its
    // narration it is played faster, never cut short: a reviewer who cannot
    // see the end of a flow has not been shown the flow.
    speed = Math.min(footageSeconds / spoken, MAX_SPEED);
    target = footageSeconds / speed;
  } else if (videoSource) {
    target = Math.max(footageSeconds, spoken);
  }

  const videoArgs = videoSource
    ? [
        "-i", `${WORK}/base-${segment.id}.mp4`,
        "-vf", [
          `setpts=PTS/${speed.toFixed(4)}`,
          `tpad=stop_mode=clone:stop_duration=${Math.max(0, target - footageSeconds / speed).toFixed(3)}`,
          `trim=0:${target.toFixed(3)}`,
          "setpts=PTS-STARTPTS",
          "fps=30",
        ].join(","),
      ]
    : imageSource
      ? [
          // -framerate matters: without it the looped still comes in at 25fps
          // and zoompan's fps option relabels it as 30, which silently made
          // every admin shot 17% shorter than its own narration.
          "-loop", "1", "-framerate", "30", "-t", target.toFixed(3), "-i", imageSource,
          // An admin screenshot is one whole browser viewport, so it is shown
          // whole. Cropping it to 16:9 ate the left navigation, which is how a
          // reviewer knows which page they are looking at; instead it is fitted
          // by width and letterboxed by eleven pixels. The slow 5% push-in is
          // only there so a fifteen-second shot does not look like a freeze.
          "-vf", [
            "scale=2880:-1:flags=lanczos",
            "unsharp=5:5:0.7:5:5:0.0",
            // The move settles OUT, not in, and then holds. Pushing in cropped
            // the left navigation labels down to "es channels", and the frame a
            // reviewer actually reads is the one it rests on — so that frame is
            // the complete viewport at zoom 1, and the motion is the four
            // percent before it. Holding after PUSH_IN also keeps the file
            // small: a zoom running the whole shot changes every frame.
            `zoompan=z='max(1.04-0.04*on/${Math.round(30 * PUSH_IN)},1.0)':d=1` +
              ":x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1058:fps=30",
            `pad=1920:1080:0:11:color=${BARK}`,
            "format=yuv420p",
          ].join(","),
        ]
      : [
          "-loop", "1", "-t", target.toFixed(3), "-i", `${WORK}/card-${segment.id}.png`,
          "-vf", "fps=30,format=yuv420p",
        ];

  await run("ffmpeg", [
    "-y", "-loglevel", "error",
    ...videoArgs,
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-an",
    `${WORK}/sized-${segment.id}.mp4`,
  ]);

  let visual = `${WORK}/sized-${segment.id}.mp4`;
  if (segment.caption) {
    await captionOverlay(segment.caption, `${WORK}/cap-${segment.id}.png`);
    await run("ffmpeg", [
      "-y", "-loglevel", "error",
      "-i", visual, "-i", `${WORK}/cap-${segment.id}.png`,
      "-filter_complex", "[0:v][1:v]overlay=0:0[out]",
      "-map", "[out]", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-an",
      `${WORK}/capped-${segment.id}.mp4`,
    ]);
    visual = `${WORK}/capped-${segment.id}.mp4`;
  }

  await run("ffmpeg", [
    "-y", "-loglevel", "error", "-i", voPath,
    "-af", `adelay=${Math.round(LEAD_IN * 1000)}|${Math.round(LEAD_IN * 1000)},apad,atrim=0:${target.toFixed(3)}`,
    "-ar", "48000", "-ac", "2", `${WORK}/voice-${segment.id}.wav`,
  ]);

  await run("ffmpeg", [
    "-y", "-loglevel", "error",
    "-i", visual, "-i", `${WORK}/voice-${segment.id}.wav`,
    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest",
    `${WORK}/segment-${segment.id}.mp4`,
  ]);

  segmentFiles.push(`${WORK}/segment-${segment.id}.mp4`);
  console.log(
    `  ${segment.id.padEnd(22)} ${target.toFixed(1)}s  voice ${voSeconds.toFixed(1)}s` +
      (speed > 1.01 ? `  footage ${footageSeconds.toFixed(1)}s at ${speed.toFixed(2)}x` : ""),
  );
}

if (missing.length) {
  // A reviewer video with a silent gap where a feature should be is worse than
  // no video, so this is loud rather than a warning buried in the log.
  throw new Error(`Missing sources:\n  ${missing.join("\n  ")}`);
}

const listFile = `${WORK}/concat.txt`;
await run("bash", [
  "-c",
  `printf "file '%s'\\n" ${segmentFiles.map((f) => `'${f}'`).join(" ")} > '${listFile}'`,
]);

await run("ffmpeg", [
  "-y", "-loglevel", "error",
  "-f", "concat", "-safe", "0", "-i", listFile,
  "-c", "copy", `${WORK}/cut.mp4`,
]);

const total = await duration(`${WORK}/cut.mp4`);
console.log(`\nCut: ${(total / 60).toFixed(1)} min`);

// The same original four-chord bed as the promo, generated to this length. It
// sits well under the voice here: this film is meant to be listened to.
await run(KOKORO_PY, ["scripts/make-music.py", total.toFixed(2), `${WORK}/music.wav`]);

const finalPath = `${OUT}/kukis-reviewer-demo.mp4`;

/** Mixes the bed under the narration and writes one deliverable. */
const master = async (path, { scale, crf, audioKbps }) =>
  run("ffmpeg", [
    "-y", "-loglevel", "error",
    "-i", `${WORK}/cut.mp4`, "-i", `${WORK}/music.wav`,
    "-filter_complex",
    "[1:a]volume=0.5[bed];" +
      "[bed][0:a]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=450[duck];" +
      "[0:a][duck]amix=inputs=2:normalize=0:duration=first[mixed];" +
      "[mixed]loudnorm=I=-16:TP=-1.5:LRA=11[a]",
    "-map", "0:v", "-map", "[a]",
    ...(scale ? ["-vf", `scale=${scale}:flags=lanczos`] : []),
    "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-g", "60", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", `${audioKbps}k`, "-movflags", "+faststart",
    path,
  ]);

const bytes = async (path) => {
  const { stdout } = await run("ffprobe", [
    "-v", "error", "-show_entries", "format=size", "-of", "csv=p=0", path,
  ]);
  return Number.parseInt(stdout.trim(), 10);
};

console.log("\nMaster (1080p)");
await master(finalPath, { scale: null, crf: 21, audioKbps: 160 });
console.log(`  ${(await bytes(finalPath) / 1048576).toFixed(1)} MB`);

/**
 * A second, smaller copy for hosting.
 *
 * Cloudflare Pages refuses any single file over 25 MiB, and the listing's
 * Screencast URL has to point at something that actually serves. Rather than
 * guess a quality setting, this walks up the CRF ladder and keeps the best
 * one that fits under the budget, so the limit is respected by construction
 * instead of by hoping.
 */
const WEB_BUDGET = 24 * 1024 * 1024; // 24 MiB, leaving Pages some headroom.
const webPath = `${OUT}/kukis-reviewer-demo-web.mp4`;
console.log("\nWeb copy (1600x900, must fit Cloudflare Pages)");
let webFits = false;
for (const crf of [24, 26, 28, 30, 32]) {
  await master(webPath, { scale: "1600:900", crf, audioKbps: 96 });
  const size = await bytes(webPath);
  console.log(`  crf ${crf}: ${(size / 1048576).toFixed(1)} MB${size <= WEB_BUDGET ? "  <- kept" : ""}`);
  if (size <= WEB_BUDGET) {
    webFits = true;
    break;
  }
}
if (!webFits) throw new Error(`Could not get the web copy under ${WEB_BUDGET / 1048576} MiB.`);

for (const path of [finalPath, webPath]) {
  const { stdout } = await run("ffprobe", [
    "-v", "error", "-show_entries", "format=duration,size",
    "-show_entries", "stream=codec_name,width,height", "-of", "default=nw=1", path,
  ]);
  console.log(`\n${path}\n${stdout.trim()}`);
}
