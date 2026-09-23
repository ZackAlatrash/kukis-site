/* Composes the App Store listing screenshots.
 *
 *   cd kukis-site && node scripts/compose-screenshots.mjs
 *
 * Every delivered file is exactly 1600x900, which is what the listing form
 * requires. Inside that frame each image is the real capture, cropped to the
 * one thing it is about and enlarged, on the brand's milk field with a line
 * saying what you are looking at — Shopify asks for a single focal point on a
 * solid, high-contrast background.
 *
 * Nothing here is a mockup: "focus" only chooses which rectangle of the
 * genuine capture to show. It is expressed as fractions of the source, so the
 * same numbers work for the storefront captures (4800x2700, taken at 3x) and
 * the admin ones (1474x812, captured with the page zoomed).
 *
 * Output: shots/listing/NN-name.png
 */
import { mkdir, writeFile, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
import puppeteer from "puppeteer";

const run = promisify(execFile);
const SHOTS = resolve(process.cwd(), "shots");
const OUT = resolve(SHOTS, "listing");

const WIDTH = 1600;
const HEIGHT = 900;

const SHEETS = [
  {
    out: "01-save-for-later.png",
    source: "1-save-for-later.png",
    focus: { x: 0.3125, y: 0.2911, w: 0.3813, h: 0.4 },
    headline: "The marketing box starts <em>unticked</em>",
    sub: "A shopper asks for the email. Nothing is pre-selected for them.",
  },
  {
    out: "02-cookie-decline.png",
    source: "2-cookie-decline-prompt.png",
    focus: { x: 0.793, y: 0.77, w: 0.198, h: 0.193 },
    headline: "Declining cookies isn’t a <em>dead end</em>",
    sub: "A prompt only shown to someone who just said no — and it never covers the page.",
  },
  {
    out: "03-wishlist.png",
    source: "3-wishlist.png",
    focus: { x: 0.6813, y: 0.3867, w: 0.3125, h: 0.4244 },
    headline: "A wishlist that needs <em>no account</em>",
    sub: "Saved without a login, still there on the next visit, emailed only if they ask.",
  },
  {
    out: "04-save-cart.png",
    source: "4-save-cart.png",
    focus: { x: 0.0375, y: 0.3911, w: 0.3875, h: 0.1867 },
    headline: "Send yourself the cart, <em>come back later</em>",
    sub: "On the cart page, in your theme, with no code to add.",
  },
  {
    out: "05-dashboard.png",
    source: "5-dashboard.png",
    focus: { x: 0.215, y: 0.4, w: 0.5, h: 0.29 },
    headline: "See who you can email, and <em>what they saved</em>",
    sub: "Unique contacts with marketing consent, and everything shoppers saved.",
  },
  {
    out: "06-consent-log.png",
    source: "6-consent-log.png",
    focus: { x: 0.245, y: 0.462, w: 0.48, h: 0.408 },
    headline: "Proof of every yes, and every <em>no</em>",
    sub: "The exact wording, its version and language, the time, and their cookie choice.",
  },
];

const page = ({ source, focus, headline, sub }, size) => {
  // The frame takes the focus rectangle's own shape, fitted into the space
  // below the text. A fixed frame cropped anything that did not share its
  // aspect, which is how the save-for-later modal once lost its buttons.
  const MAX = { w: 1340, h: 560 };
  const rect = {
    x: focus.x * size.width,
    y: focus.y * size.height,
    w: focus.w * size.width,
    h: focus.h * size.height,
  };
  const aspect = rect.w / rect.h;
  const frame =
    MAX.w / MAX.h > aspect
      ? { w: Math.round(MAX.h * aspect), h: MAX.h }
      : { w: MAX.w, h: Math.round(MAX.w / aspect) };

  const scale = Math.max(frame.w / rect.w, frame.h / rect.h);
  const imgW = size.width * scale;
  const imgH = size.height * scale;
  const left = -(rect.x * scale) - (rect.w * scale - frame.w) / 2;
  const top = -(rect.y * scale) - (rect.h * scale - frame.h) / 2;

  return [
    "<!doctype html>",
    '<html lang="en"><head><meta charset="utf-8" />',
    '<link href="https://fonts.googleapis.com/css2?family=Gabarito:wght@600;700;800&family=Inter:wght@400;500&display=swap" rel="stylesheet" />',
    "<style>",
    "  * { margin: 0; padding: 0; box-sizing: border-box; }",
    `  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }`,
    "  body {",
    "    background: #fff6e7; color: #2e1c10;",
    "    font-family: Inter, system-ui, sans-serif;",
    "    display: flex; flex-direction: column; align-items: center;",
    "    justify-content: center; padding: 56px 90px 96px; position: relative;",
    "  }",
    '  body::before { content: ""; position: absolute; inset: 0;',
    "    background: radial-gradient(ellipse at 50% 26%, rgba(47,111,176,0.07) 0%, transparent 62%); }",
    "  h1 { font-family: Gabarito, system-ui, sans-serif; font-weight: 700;",
    "    font-size: 54px; line-height: 1.1; letter-spacing: -0.02em;",
    "    text-align: center; position: relative; z-index: 1; }",
    "  h1 em { font-style: normal; color: #2f6fb0; }",
    "  p.sub { margin-top: 16px; font-size: 24px; color: #6f5c48;",
    "    text-align: center; max-width: 60ch; position: relative; z-index: 1; }",
    `  .frame { margin-top: 42px; width: ${frame.w}px; height: ${frame.h}px; flex: none;`,
    "    border-radius: 18px; overflow: hidden; position: relative; z-index: 1;",
    "    border: 1px solid rgba(46,28,16,0.14);",
    "    box-shadow: 0 26px 54px rgba(46,28,16,0.16); background: #fff; }",
    `  .frame img { position: absolute; width: ${imgW}px; height: ${imgH}px;`,
    `    left: ${left}px; top: ${top}px; }`,
    "  .mark { position: absolute; left: 90px; bottom: 34px; z-index: 1; }",
    "  .mark img { height: 40px; display: block; }",
    "</style></head>",
    "<body>",
    `  <h1>${headline}</h1>`,
    `  <p class="sub">${sub}</p>`,
    `  <div class="frame"><img src="../${source}" alt="" /></div>`,
    '  <div class="mark"><img src="../../scripts/animations/assets/wordmark-transparent.svg" alt="Kukis" /></div>',
    "</body></html>",
  ].join("\n");
};

/** The source's real pixel size, so the crop maths never assumes one. */
const sizeOf = async (file) => {
  const { stdout } = await run("magick", ["identify", "-format", "%w %h", file]);
  const [width, height] = stdout.trim().split(" ").map(Number);
  return { width, height };
};

await mkdir(OUT, { recursive: true });
const browser = await puppeteer.launch({ headless: "new" });

try {
  for (const sheet of SHEETS) {
    const size = await sizeOf(`${SHOTS}/${sheet.source}`);
    const html = `${OUT}/.compose-${sheet.out}.html`;
    await writeFile(html, page(sheet, size), "utf8");

    const tab = await browser.newPage();
    // Rendered at 2x and delivered at 1600x900, so the type stays crisp.
    await tab.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });
    await tab.goto(`file://${html}`, { waitUntil: "networkidle0" });
    await tab.evaluateHandle("document.fonts.ready");
    await new Promise((r) => setTimeout(r, 400));

    // Fail loudly rather than ship an empty frame.
    const loaded = await tab.evaluate(() =>
      [...document.images].every((img) => img.complete && img.naturalWidth > 0),
    );
    if (!loaded) throw new Error(`${sheet.out}: an image failed to load`);

    await tab.screenshot({ path: `${OUT}/${sheet.out}` });
    await tab.close();
    await rm(html, { force: true });

    // The downscale belongs here, not in a follow-up command that can be
    // forgotten — that is how an oversized feature-media file once shipped.
    await run("magick", [
      `${OUT}/${sheet.out}`, "-resize", `${WIDTH}x${HEIGHT}`, "-strip",
      `${OUT}/${sheet.out}`,
    ]);

    const { stdout } = await run("magick", [
      "identify", "-format", "%wx%h", `${OUT}/${sheet.out}`,
    ]);
    if (stdout.trim() !== `${WIDTH}x${HEIGHT}`) {
      throw new Error(`${sheet.out}: delivered ${stdout.trim()}, expected ${WIDTH}x${HEIGHT}`);
    }
    console.log(`  ${sheet.out}  ${stdout.trim()}`);
  }
} finally {
  await browser.close();
}
