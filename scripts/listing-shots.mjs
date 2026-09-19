/* Captures the App Store listing screenshots from the live demo store.
 *
 * Run it yourself (the password is read from the environment, never stored):
 *
 *   cd kukis-site
 *   STORE_PASSWORD='your storefront password' node scripts/listing-shots.mjs
 *
 * Output: kukis-site/shots/*.png at exactly 1600x900, which is what the
 * listing form wants. Each shot is a real page on the live store, not a mockup.
 */
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import puppeteer from "puppeteer";

const STORE = process.env.STORE || "https://kukis-dev-ha9loo40.myshopify.com";
const PASSWORD = process.env.STORE_PASSWORD;
const OUT = resolve(process.cwd(), "shots");
const WIDTH = 1600;
const HEIGHT = 900;

if (!PASSWORD) {
  console.error("Set STORE_PASSWORD first. Find it in Online Store > Preferences > Password protection.");
  process.exit(1);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** A fresh context each time, so cookie choices from an earlier shot don't leak into the next. */
const openStore = async (browser) => {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT });
  await page.goto(`${STORE}/password`, { waitUntil: "domcontentloaded" });
  const field = await page.$('input[type="password"]');
  if (field) {
    await field.type(PASSWORD);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => {}),
      page.keyboard.press("Enter"),
    ]);
  }
  return { context, page };
};

const shoot = async (page, name) => {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`  ${name}.png`);
};

/** Dismiss the cookie banner by accepting, for shots where it would be in the way. */
const acceptCookies = async (page) => {
  const accepted = await page.evaluate(() => {
    const button = [...document.querySelectorAll("button, a")].find((el) =>
      /^(accept|accept all|allow all)$/i.test((el.textContent || "").trim()),
    );
    if (!button) return false;
    button.click();
    return true;
  });
  if (accepted) await wait(1200);
};

const declineCookies = async (page) => {
  const declined = await page.evaluate(() => {
    const button = [...document.querySelectorAll("button, a")].find((el) =>
      /^(decline|reject|reject all|deny)$/i.test((el.textContent || "").trim()),
    );
    if (!button) return false;
    button.click();
    return true;
  });
  if (!declined) console.warn("  ! no decline button found — is a cookie banner active?");
  return declined;
};

const browser = await puppeteer.launch({ headless: "new", args: ["--lang=en-GB"] });
await mkdir(OUT, { recursive: true });

try {
  // 1. Save for later, with the marketing box unticked — the heart of the product.
  {
    const { context, page } = await openStore(browser);
    await page.goto(`${STORE}/products/everyday-hoodie`, { waitUntil: "networkidle2" });
    await acceptCookies(page);
    await page.evaluate(() => {
      const trigger = [...document.querySelectorAll("button, a")].find((el) =>
        /save this for later/i.test(el.textContent || ""),
      );
      trigger?.click();
    });
    await wait(1500);
    await shoot(page, "1-save-for-later");
    await context.close();
  }

  // 2. The cookie-decline prompt. Needs a brand-new visitor, hence the fresh context.
  {
    const { context, page } = await openStore(browser);
    await page.goto(`${STORE}/products/light-puffer-jacket`, { waitUntil: "networkidle2" });
    await wait(1500);
    if (await declineCookies(page)) await wait(4000);
    await shoot(page, "2-cookie-decline-prompt");
    await context.close();
  }

  // 3. The wishlist page, with a few items on it.
  {
    const { context, page } = await openStore(browser);
    for (const handle of ["cashmere-beanie", "canvas-sneakers", "white-leather-sneakers"]) {
      await page.goto(`${STORE}/products/${handle}`, { waitUntil: "networkidle2" });
      await acceptCookies(page);
      await page.evaluate(() => {
        const trigger = [...document.querySelectorAll("button, a")].find((el) =>
          /add to wishlist/i.test(el.textContent || ""),
        );
        trigger?.click();
      });
      await wait(1200);
    }
    await page.goto(`${STORE}/apps/kukis/wishlist`, { waitUntil: "networkidle2" });
    await wait(1200);
    await shoot(page, "3-wishlist");
    await context.close();
  }

  // 4. Save cart on the cart page.
  {
    const { context, page } = await openStore(browser);
    await page.goto(`${STORE}/products/light-puffer-jacket`, { waitUntil: "networkidle2" });
    await acceptCookies(page);
    const variantId = await page.evaluate(() => {
      const input = document.querySelector('form[action*="/cart/add"] [name="id"]');
      return input?.value || null;
    });
    if (variantId) await page.goto(`${STORE}/cart/${variantId}:1`, { waitUntil: "networkidle2" });
    await page.goto(`${STORE}/cart`, { waitUntil: "networkidle2" });
    await wait(1200);
    await shoot(page, "4-save-cart");
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(`\nDone. ${OUT}`);
console.log("Check each one before uploading: the cookie banner should not cover the widget.");
