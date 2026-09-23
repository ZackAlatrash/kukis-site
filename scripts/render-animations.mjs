/* Records each explainer animation to 1080p video.
 *
 *   cd kukis-site && node scripts/render-animations.mjs
 *
 * These replace screen recordings of the admin. A development store's
 * dashboard honestly reads "$0 recovered", which undersells the feature it is
 * meant to demonstrate, and a real cursor is harder to follow than a
 * deliberate reveal. Output lands in scenes/, beside the storefront captures.
 */
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import puppeteer from "puppeteer";

const OUT = resolve(process.cwd(), "scenes");
const DIR = resolve(process.cwd(), "scripts/animations");

/** Seconds to film each page. Long enough for its last element to settle. */
/**
 * Lengths are set from the narration each one carries, so the animation is
 * still moving while it is being described. Filming a 7s animation under a 12s
 * line left five seconds of frozen frame — the same dead air the storefront
 * scenes were cut to remove.
 */
const PAGES = [
  { file: "title.html", out: "anim-title.webm", seconds: 6.0 },
  { file: "dashboard.html", out: "anim-dashboard.webm", seconds: 10.0 },
  { file: "rejected-yes.html", out: "anim-rejected-yes.webm", seconds: 13.5 },
  { file: "consent-log.html", out: "anim-consent-log.webm", seconds: 14.0 },
  { file: "exports.html", out: "anim-exports.webm", seconds: 13.0 },
  { file: "sending-domain.html", out: "anim-sending-domain.webm", seconds: 12.0 },
  { file: "shopify-sync.html", out: "anim-shopify-sync.webm", seconds: 12.5 },
  { file: "price-drop.html", out: "anim-price-drop.webm", seconds: 11.5 },
  { file: "privacy.html", out: "anim-privacy.webm", seconds: 12.0 },
  { file: "outro.html", out: "anim-outro.webm", seconds: 9.5 },
];

await mkdir(OUT, { recursive: true });
const browser = await puppeteer.launch({ headless: "new" });

try {
  for (const page of PAGES) {
    const tab = await browser.newPage();
    await tab.setViewport({ width: 1920, height: 1080 });
    // `domcontentloaded`, not `networkidle`: the CSS animations start on load,
    // so waiting for the network to settle would film them already finished.
    await tab.goto(`file://${DIR}/${page.file}`, { waitUntil: "domcontentloaded" });
    await tab.evaluateHandle("document.fonts.ready");

    // Restart every animation together, so the recording starts at frame one.
    await tab.evaluate(() => {
      document.querySelectorAll("*").forEach((el) => {
        const name = getComputedStyle(el).animationName;
        if (name && name !== "none") {
          el.style.animation = "none";
          void el.offsetWidth;
          el.style.animation = "";
        }
      });
    });

    const recorder = await tab.screencast({ path: `${OUT}/${page.out}` });
    await new Promise((r) => setTimeout(r, page.seconds * 1000));
    await recorder.stop();
    await tab.close();
    console.log(`  ${page.out}  ${page.seconds}s`);
  }
} finally {
  await browser.close();
}
