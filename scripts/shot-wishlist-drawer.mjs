/* The wishlist drawer, which is the surface a shopper actually uses — and the
 * one the theme extension styles. The standalone /apps/kukis/wishlist page is
 * still unstyled, so it is a poor advert for the feature. */
import puppeteer from "puppeteer";
const STORE = "https://kukis-dev-ha9loo40.myshopify.com";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ headless: "new", args: ["--lang=en-GB"] });
const ctx = await b.createBrowserContext();
const p = await ctx.newPage();
await p.setViewport({ width: 1600, height: 900 });
await p.goto(`${STORE}/password`, { waitUntil: "domcontentloaded" });
const f = await p.$('input[type="password"]');
if (f) { await f.type(process.env.STORE_PASSWORD); await Promise.all([p.waitForNavigation().catch(()=>{}), p.keyboard.press("Enter")]); }

const clickText = (page, re) => page.evaluate((src) => {
  const rx = new RegExp(src, "i");
  const walk = (root, d) => { if (d > 6) return null;
    for (const el of root.querySelectorAll("*")) {
      if (el.shadowRoot) { const x = walk(el.shadowRoot, d + 1); if (x) return x; }
      if (/^(BUTTON|A)$/.test(el.tagName) && rx.test((el.textContent || "").trim())) return el;
    } return null; };
  const el = walk(document, 0); if (!el) return false; el.click(); return true;
}, re);

for (const handle of ["cashmere-beanie", "canvas-sneakers", "white-leather-sneakers"]) {
  await p.goto(`${STORE}/products/${handle}`, { waitUntil: "networkidle2" });
  await clickText(p, "^(accept|accept all|allow all)$");
  await wait(900);
  await clickText(p, "add to wishlist");
  await wait(1200);
}
// Open the drawer from the header heart.
await p.evaluate(() => document.querySelector(".consented-wishlist-icon__link")?.click());
await wait(2500);
await p.screenshot({ path: "shots/3-wishlist.png" });
await b.close();
console.log("shots/3-wishlist.png");
