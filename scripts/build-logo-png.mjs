/**
 * Rasterise the logo SVGs (see build-logo.py) with headless Chrome, which is
 * already a dev dependency here and renders SVG masks correctly.
 *
 *   node scripts/build-logo-png.mjs [--out <dir>]
 */
import puppeteer from "puppeteer";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const flag = process.argv.indexOf("--out");
const OUT = flag === -1
  ? resolve(dirname(fileURLToPath(import.meta.url)), "..", "public", "logo")
  : resolve(process.argv[flag + 1]);

// Square carries the favicon/app-icon sizes; the wordmark is for headers and docs.
const jobs = [
  ...[1024, 512, 256, 180, 64, 32].map((n) => ["kukis-logo.svg", `kukis-logo-${n}.png`, n, n]),
  ...[2400, 1200, 600].map((w) => ["kukis-wordmark.svg", `kukis-wordmark-${w}.png`, w, Math.round((w * 1511) / 2971)]),
];

const browser = await puppeteer.launch();
const page = await browser.newPage();
for (const [src, out, w, h] of jobs) {
  const data = "data:image/svg+xml;base64," + readFileSync(join(OUT, src)).toString("base64");
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.setContent(
    `<style>html,body{margin:0}img{display:block;width:${w}px;height:${h}px}</style><img src="${data}">`,
    { waitUntil: "load" }
  );
  writeFileSync(join(OUT, out), await page.screenshot({ type: "png" }));
  console.log(out, `${w}x${h}`);
}
await browser.close();
