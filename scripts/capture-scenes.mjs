/* Records the shopper half of the App Store screencast, and the listing
 * screenshots, straight from the live demo store. No filming required.
 *
 * The password comes from .env.local (gitignored), so runs are unattended:
 *
 *   cd kukis-site
 *   node --env-file-if-exists=.env.local scripts/capture-scenes.mjs
 *
 * Or pass it for a one-off, without the file:
 *
 *   read -s "STORE_PASSWORD?Storefront password: " && export STORE_PASSWORD \
 *     && node scripts/capture-scenes.mjs
 *
 * Output:
 *   kukis-site/shots/*.png     1600x900 listing screenshots
 *   kukis-site/scenes/*.webm   1920x1080 video, one file per scene
 *
 * Each scene deliberately holds still at its key moment. Those pauses are the
 * room the captions and the voiceover need; without them the cut feels rushed
 * and there is nowhere to put a sentence.
 */
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import puppeteer from "puppeteer";

const STORE = process.env.STORE || "https://kukis-dev-ha9loo40.myshopify.com";
const PASSWORD = process.env.STORE_PASSWORD;
const DEMO_EMAIL = process.env.DEMO_EMAIL || "main+demo@kukis.nl";
const SHOTS = resolve(process.cwd(), "shots");
const SCENES = resolve(process.cwd(), "scenes");

/** Video is 1080p; the listing wants 1600x900, so shots are taken separately. */
const VIDEO = { width: 1920, height: 1080 };

/**
 * Stills are captured at three times the listing size. The listing images crop
 * into a single feature and enlarge it — a modal, a prompt — so a capture at
 * 1600x900 runs out of pixels the moment it is magnified, and the result looks
 * soft. At 4800x2700 a 3x crop is still rendering real pixels.
 */
const SHOT = { width: 1600, height: 900, deviceScaleFactor: 3 };

if (!PASSWORD) {
  console.error(
    "STORE_PASSWORD is empty.\n" +
      "Put the storefront password in kukis-site/.env.local, or export it for one run.\n" +
      "Find it in Online Store > Preferences > Password protection.",
  );
  process.exit(1);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** A fresh context per scene, so one scene's cookie choice never leaks into the next. */
const openStore = async (browser, viewport) => {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport(viewport);
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

/**
 * Clicks the first button or link whose text matches, crossing shadow roots.
 *
 * The cookie banner renders inside a shadow root, so a plain
 * document.querySelectorAll finds nothing and the decline scene records a page
 * that was never declined — which reads as the feature being broken rather
 * than the script.
 */
const clickByText = async (page, pattern) => {
  for (const frame of page.frames()) {
    const clicked = await frame
      .evaluate((source) => {
        const re = new RegExp(source, "i");
        const walk = (root, depth) => {
          if (depth > 6) return null;
          for (const el of root.querySelectorAll("*")) {
            if (el.shadowRoot) {
              const deeper = walk(el.shadowRoot, depth + 1);
              if (deeper) return deeper;
            }
            if (/^(BUTTON|A)$/.test(el.tagName) && re.test((el.textContent || "").trim())) {
              return el;
            }
          }
          return null;
        };
        const el = walk(document, 0);
        if (!el) return false;
        el.click();
        return true;
      }, pattern)
      .catch(() => false);
    if (clicked) return true;
  }
  return false;
};

const acceptCookies = async (page) => {
  const ok = await clickByText(page, "^(accept|accept all|allow all)$");
  if (ok) await wait(1200);
  return ok;
};

const declineCookies = async (page) => {
  const ok = await clickByText(page, "^(decline|reject|reject all|deny)$");
  if (!ok) console.warn("  ! no decline button — is the banner set to all regions?");
  return ok;
};

/**
 * The first element matching `selector` that is actually rendered.
 *
 * Every Kukis widget on a page carries the same data attributes, and the ones
 * belonging to closed modals are present but hidden — so document.querySelector
 * reliably returns the wrong one.
 */
const visibleElement = async (page, selector, timeout = 10000) => {
  const handle = await page.waitForFunction(
    (sel) => {
      const el = [...document.querySelectorAll(sel)].find(
        (node) => node.offsetWidth > 0 || node.offsetHeight > 0,
      );
      return el || null;
    },
    { timeout },
    selector,
  );
  return handle.asElement();
};

/** Types at a readable speed: instant text looks like a glitch on video. */
const typeSlowly = async (page, selector, text) => {
  // Wait for it to be genuinely visible. The modal animates open, so the field
  // exists in the DOM before it can be clicked — which is what broke the first run.
  const handle = await page.waitForSelector(selector, { visible: true, timeout: 10000 });
  await handle.click();
  await page.type(selector, text, { delay: 90 });
};

/**
 * A product page carries more than one Kukis widget — the wishlist renders
 * before save-for-later — so every interaction is scoped to its surface.
 * An unscoped query clicks "Add to wishlist" and the modal never opens.
 */
const surface = (name, inner = "") =>
  `[data-consented-widget][data-consented-surface="${name}"]${inner ? ` ${inner}` : ""}`;

/** Opens one widget's modal by its own button, and waits for the dialog. */
const openWidgetModal = async (page, name) => {
  const opened = await page.evaluate((selector) => {
    const button = document.querySelector(selector);
    if (!button) return false;
    button.click();
    return true;
  }, surface(name, "[data-consented-widget-open]"));
  if (!opened) return false;
  await page
    .waitForSelector(surface(name, "[data-consented-widget-dialog]"), {
      visible: true,
      timeout: 10000,
    })
    .catch(() => {});
  return true;
};

/**
 * One failed scene must not cost the whole run: each is isolated, reported,
 * and the rest carry on. A partial set is still worth having.
 */
const scene = async (browser, name, body) => {
  const { context, page } = await openStore(browser, VIDEO);
  const recorder = await page.screencast({ path: `${SCENES}/${name}.webm` });
  let failure = null;
  try {
    await wait(1200); // A still head, so the cut has something to trim into.
    await body(page);
    await wait(1500); // And a still tail.
  } catch (error) {
    failure = error;
  } finally {
    await recorder.stop();
    await context.close();
  }
  console.log(failure ? `  scene ${name}.webm  (PARTIAL: ${failure.message})` : `  scene ${name}.webm`);
};

const shotSafe = async (browser, name, body) => {
  try {
    await shot(browser, name, body);
  } catch (error) {
    console.log(`  shot  ${name}.png  FAILED: ${error.message}`);
  }
};

const shot = async (browser, name, body) => {
  const { context, page } = await openStore(browser, SHOT);
  await body(page);
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
  await context.close();
  console.log(`  shot  ${name}.png`);
};

const openSaveForLater = async (page) => {
  await page.goto(`${STORE}/products/everyday-hoodie`, { waitUntil: "networkidle2" });
  await acceptCookies(page);
  if (!(await openWidgetModal(page, "save_for_later"))) {
    await clickByText(page, "save this for later");
    await wait(1200);
  }
  await wait(1500);
};

const addWishlistItems = async (page, handles) => {
  for (const handle of handles) {
    await page.goto(`${STORE}/products/${handle}`, { waitUntil: "networkidle2" });
    await acceptCookies(page);
    await clickByText(page, "add to wishlist");
    await wait(1100);
  }
};

const browser = await puppeteer.launch({ headless: "new", args: ["--lang=en-GB"] });
await mkdir(SHOTS, { recursive: true });
await mkdir(SCENES, { recursive: true });

try {
  console.log("Scenes (1920x1080 video)");

  // 01 — the product page, and the two things a shopper can do on it.
  await scene(browser, "01-intro", async (page) => {
    await page.goto(`${STORE}/products/everyday-hoodie`, { waitUntil: "networkidle2" });
    await acceptCookies(page);
    await wait(3500);
  });

  // 02 — save for later. The long hold is on the unticked marketing box: it is
  // the compliance claim, and the single most important frame in the video.
  await scene(browser, "02-save-for-later", async (page) => {
    await openSaveForLater(page);
    await wait(4000); // The hold on the unticked marketing box.

    // Whichever dialog is actually on screen owns these fields. Scoping by
    // surface name guessed wrong, and a bare selector matches the wishlist
    // widget's hidden copy first, so neither is reliable here.
    const emailField = await visibleElement(page, "[data-consented-email]");
    await emailField.click();
    await page.keyboard.type(DEMO_EMAIL, { delay: 90 });
    await wait(900);

    const marketingBox = await visibleElement(page, "[data-consented-marketing]");
    await marketingBox.click();
    await wait(1400);

    const submit = await visibleElement(page, "[data-consented-submit]");
    await submit.click();
    await wait(4500);
  });

  // 03 — the cookie decline, and the prompt only someone who declined ever sees.
  await scene(browser, "03-cookie-decline", async (page) => {
    await page.goto(`${STORE}/products/light-puffer-jacket`, { waitUntil: "networkidle2" });
    await wait(1800);
    if (await declineCookies(page)) await wait(5500);
    await clickByText(page, "save it by email|email it to me|save this");
    await wait(3000);
  });

  // 04 — the wishlist, and the reload that proves the list survives.
  await scene(browser, "04-wishlist", async (page) => {
    await addWishlistItems(page, ["cashmere-beanie", "canvas-sneakers", "white-leather-sneakers"]);
    await page.reload({ waitUntil: "networkidle2" });
    await wait(2500);
    await page.goto(`${STORE}/apps/kukis/wishlist`, { waitUntil: "networkidle2" });
    await wait(4000);
  });

  // 05 — the cart page, where the Save cart block lives.
  await scene(browser, "05-cart", async (page) => {
    await page.goto(`${STORE}/products/light-puffer-jacket`, { waitUntil: "networkidle2" });
    await acceptCookies(page);
    const variantId = await page.evaluate(() => {
      const input = document.querySelector('form[action*="/cart/add"] [name="id"]');
      return input?.value || null;
    });
    if (variantId) await page.goto(`${STORE}/cart/${variantId}:1`, { waitUntil: "networkidle2" });
    await page.goto(`${STORE}/cart`, { waitUntil: "networkidle2" });
    await wait(4500);
  });

  console.log("\nShots (1600x900 stills)");

  await shotSafe(browser, "1-save-for-later", openSaveForLater);

  await shotSafe(browser, "2-cookie-decline-prompt", async (page) => {
    await page.goto(`${STORE}/products/light-puffer-jacket`, { waitUntil: "networkidle2" });
    await wait(1500);
    if (await declineCookies(page)) await wait(4000);
  });

  await shotSafe(browser, "3-wishlist", async (page) => {
    await addWishlistItems(page, ["cashmere-beanie", "canvas-sneakers", "white-leather-sneakers"]);
    await page.goto(`${STORE}/apps/kukis/wishlist`, { waitUntil: "networkidle2" });
    await wait(1500);
  });

  await shotSafe(browser, "4-save-cart", async (page) => {
    await page.goto(`${STORE}/products/light-puffer-jacket`, { waitUntil: "networkidle2" });
    await acceptCookies(page);
    const variantId = await page.evaluate(() => {
      const input = document.querySelector('form[action*="/cart/add"] [name="id"]');
      return input?.value || null;
    });
    if (variantId) await page.goto(`${STORE}/cart/${variantId}:1`, { waitUntil: "networkidle2" });
    await page.goto(`${STORE}/cart`, { waitUntil: "networkidle2" });
    await wait(1500);
  });
} finally {
  await browser.close();
}

console.log(`\nDone.\n  ${SHOTS}\n  ${SCENES}`);
console.log("Tell Claude when this finishes — it stitches, captions and times the cut.");
