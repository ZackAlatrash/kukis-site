/* Snapshots the built app to static HTML so crawlers that don't run JS get the
   page instead of an empty <div id="root">.

   Why a real browser and not renderToString: <Reveal> hides its children behind
   `initial={{ opacity: 0 }}` until they scroll into view, and only drops the
   animation when usePrefersReducedMotion says to — which resolves in useEffect,
   i.e. never on the server. SSR would emit the whole page at opacity:0, which is
   worse than emitting nothing. A browser with reduced-motion emulated runs that
   effect, so every Reveal collapses to a plain div and the snapshot is static.

   Nothing here needs to survive hydration: main.tsx mounts with createRoot, not
   hydrateRoot, so React discards this DOM and rebuilds it on load. The snapshot
   is for crawlers only, and real users get the animations as before. */

import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import puppeteer from "puppeteer";

const DIST = resolve(process.cwd(), "dist");
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".xml": "application/xml",
  ".json": "application/json",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  // Resolve to the file first and type *that*: extname("/") is "", so typing the
  // request path serves index.html as octet-stream, and Chrome aborts the
  // navigation rather than rendering a download.
  const file = path === "/" ? "/index.html" : path;
  try {
    const body = await readFile(join(DIST, file));
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await puppeteer.launch({
  args: ["--no-sandbox"],
  protocolTimeout: 60_000,
});

try {
  const page = await browser.newPage();

  page.on("pageerror", (err) => console.error("  [page error]", err.message));

  // Tall enough that whileInView fires for every section in one pass — a
  // viewport-height window would leave everything below the fold unrevealed.
  // Reduced motion should already have removed the reveals; this covers any
  // motion component that doesn't consult the hook.
  await page.setViewport({ width: 1280, height: 4000 });
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);

  // domcontentloaded, not networkidle: a network-quiet heuristic is a guess at
  // "is it ready", and waiting on one here hung the build indefinitely. The
  // waits below name the conditions we actually require, so the load event has
  // nothing left to tell us.
  await page.goto(origin, { waitUntil: "domcontentloaded", timeout: 30_000 });

  // The real signal: React has mounted and the reduced-motion effect has run.
  await page.waitForFunction(
    () => document.querySelector("#root")?.children.length > 0,
    { timeout: 30_000 }
  );
  await page.waitForFunction(
    () => document.body.innerText.trim().length > 500,
    { timeout: 30_000 }
  );

  // Reduced motion drops the scroll reveals, but the hero still plays an
  // entrance animation, and a snapshot taken mid-flight freezes its text at a
  // partial opacity. Wait for the text to actually be visible.
  //
  // Only text-bearing nodes count: the hero also holds empty decorative
  // overlays that are *meant* to rest at opacity:0, and they never settle.
  const hiddenText = () =>
    [...document.querySelectorAll("#root *")]
      .filter((el) => el.style.opacity === "0" && el.innerText?.trim())
      .map((el) => `<${el.tagName.toLowerCase()}> ${el.innerText.trim().slice(0, 40)}`);

  await page.waitForFunction(
    `(${hiddenText.toString()})().length === 0`,
    { timeout: 15_000, polling: 250 }
  ).catch(async () => {
    const stuck = await page.evaluate(hiddenText);
    throw new Error(
      `text still at opacity:0 after the animations should have settled, so crawlers would see it hidden:\n  ${stuck.join("\n  ")}`
    );
  });

  const html = await page.content();

  // The whole point of the exercise; a snapshot of an empty shell would deploy
  // green and silently change nothing.
  const text = await page.evaluate(() => document.body.innerText.trim().length);
  if (text < 500) {
    throw new Error(`prerendered body has only ${text} chars of text — expected the full page`);
  }

  await writeFile(join(DIST, "index.html"), html);
  console.log(`prerendered dist/index.html — ${text} chars of body text`);
} finally {
  await browser.close();
  // close() alone only stops new connections and then waits on Chromium's
  // keep-alive sockets forever, which turns any failure above into a hang that
  // never prints its own error.
  server.closeAllConnections();
  server.close();
}
