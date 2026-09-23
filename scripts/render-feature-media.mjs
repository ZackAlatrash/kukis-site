/* Renders scripts/feature-media.html to a 1600x900 PNG for the listing's
 * feature media slot. Same trick as the screenshots: a real browser, at the
 * exact size the form wants, so nothing is scaled or guessed. */
import { resolve } from "node:path";
import { mkdir } from "node:fs/promises";
import puppeteer from "puppeteer";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const OUT = resolve(process.cwd(), "shots");
await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 2 });
await page.goto(`file://${resolve(process.cwd(), "scripts/feature-media.html")}`, {
  waitUntil: "networkidle0",
});
// Web fonts finish after networkidle on a cold cache; without this the shot
// can land in the fallback face.
await page.evaluateHandle("document.fonts.ready");
await new Promise((r) => setTimeout(r, 600));
await page.screenshot({ path: `${OUT}/0-feature-media.png` });
await browser.close();

// Shot at 2x for sharpness, delivered at the 1600x900 the listing requires.
// Leaving the downscale to a separate command is how a 3200x1800 file got
// left behind after the last re-theme.
await promisify(execFile)("magick", [
  `${OUT}/0-feature-media.png`, "-resize", "1600x900", "-strip",
  `${OUT}/0-feature-media.png`,
]);
console.log(`${OUT}/0-feature-media.png`);
