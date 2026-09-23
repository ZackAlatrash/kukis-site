/* Renders scripts/thumbnail.html to shots/youtube-thumbnail.jpg at 1600x900,
 * as a JPEG so it stays well under the 2 MB cap. The page is laid out at
 * 1280x720 and captured at a 1.25 scale factor, so the browser draws the
 * larger size natively and every proportion (mascot, pupils, type) holds. */
import { resolve } from "node:path";
import { mkdir, stat } from "node:fs/promises";
import puppeteer from "puppeteer";

const OUT = resolve(process.cwd(), "shots");
const FILE = `${OUT}/youtube-thumbnail.jpg`;
await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1.25 });
await page.goto(`file://${resolve(process.cwd(), "scripts/thumbnail.html")}`, {
  waitUntil: "networkidle0",
});
// Web fonts finish after networkidle on a cold cache; without this the shot
// can land in the fallback face.
await page.evaluateHandle("document.fonts.ready");
await new Promise((r) => setTimeout(r, 600));

// The headline must not spill past the frame or clip at its right edge.
const overflow = await page.evaluate(() => {
  const r = document.querySelector("h1").getBoundingClientRect();
  const lines = [...document.querySelectorAll("h1 span")].map((s) => s.getBoundingClientRect().right);
  return { right: Math.max(r.right, ...lines), bottom: document.querySelector(".copy").getBoundingClientRect().bottom };
});
if (overflow.right > 1280 - 24 || overflow.bottom > 720) {
  throw new Error(`headline overflows the frame: ${JSON.stringify(overflow)}`);
}

await page.screenshot({ path: FILE, type: "jpeg", quality: 90 });
await browser.close();

const { size } = await stat(FILE);
if (size >= 2 * 1024 * 1024) throw new Error(`${FILE} is ${size} bytes, over YouTube's 2 MB limit`);
console.log(`${FILE} (${(size / 1024).toFixed(0)} KB)`);
