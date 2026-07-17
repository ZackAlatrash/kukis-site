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
