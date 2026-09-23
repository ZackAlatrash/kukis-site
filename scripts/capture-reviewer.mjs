/* Records the shopper half of the App Store REVIEWER screencast.
 *
 *   cd kukis-site
 *   node --env-file-if-exists=.env.local scripts/capture-reviewer.mjs [r1 r2 ...]
 *
 * The listing promo (capture-scenes.mjs) shows each feature for a few seconds.
 * A reviewer needs the opposite: one unbroken run per widget, from an empty
 * page to the confirmation, at a speed a person can follow. So every scene
 * here plays the whole journey, and the pauses are longer.
 *
 * Output: kukis-site/scenes/r*.webm at 1920x1080.
 */
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import puppeteer from "puppeteer";

const STORE = process.env.STORE || "https://kukis-dev-ha9loo40.myshopify.com";
const PASSWORD = process.env.STORE_PASSWORD;
const DEMO_EMAIL = process.env.DEMO_EMAIL || "main+demo@kukis.nl";
const SCENES = resolve(process.cwd(), "scenes");
const VIDEO = { width: 1920, height: 1080 };

if (!PASSWORD) {
  console.error("STORE_PASSWORD is empty. Put it in kukis-site/.env.local.");
  process.exit(1);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const openStore = async (browser) => {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport(VIDEO);
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

/** Clicks the first button or link whose text matches, crossing shadow roots. */
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
            if (/^(BUTTON|A)$/.test(el.tagName) && re.test((el.textContent || "").trim())) return el;
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
  if (await clickByText(page, "^(accept|accept all|allow all)$")) await wait(1200);
};

const declineCookies = async (page) => {
  const ok = await clickByText(page, "^(decline|reject|reject all|deny)$");
  if (!ok) console.warn("  ! no decline button found");
  return ok;
};

/** The first element matching `selector` that is actually rendered. */
const visibleElement = async (page, selector, timeout = 12000) => {
  const handle = await page.waitForFunction(
    (sel) =>
      [...document.querySelectorAll(sel)].find((n) => n.offsetWidth > 0 || n.offsetHeight > 0) || null,
    { timeout },
    selector,
  );
  return handle.asElement();
};

const surface = (name, inner = "") =>
  `[data-consented-widget][data-consented-surface="${name}"]${inner ? ` ${inner}` : ""}`;

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
      timeout: 12000,
    })
    .catch(() => {});
  return true;
};

/**
 * Fills whichever Kukis widget form is on screen and submits it.
 *
 * `tickMarketing` is the point of the scene, not a detail: the box is rendered
 * unticked every time, so a run that leaves it alone and a run that ticks it
 * are two different compliance stories, and a reviewer should see both.
 */
const fillAndSubmit = async (page, { tickMarketing }) => {
  const email = await visibleElement(page, "[data-consented-email]");
  await email.click();
  await page.keyboard.type(DEMO_EMAIL, { delay: 95 });
  await wait(1200);

  if (tickMarketing) {
    const box = await visibleElement(page, "[data-consented-marketing]");
    await box.click();
    await wait(1600);
  } else {
    await wait(2200); // Hold on the unticked box.
  }

  const submit = await visibleElement(page, "[data-consented-submit]");
  await submit.click();
  await wait(5000);
};

/** One failed scene must not cost the whole run. */
const scene = async (browser, name, body) => {
  const { context, page } = await openStore(browser);
  const recorder = await page.screencast({ path: `${SCENES}/${name}.webm` });
  let failure = null;
  try {
    await wait(1400);
    await body(page);
    await wait(2000);
  } catch (error) {
    failure = error;
  } finally {
    await recorder.stop();
    await context.close();
  }
  console.log(failure ? `  ${name}.webm  (PARTIAL: ${failure.message})` : `  ${name}.webm`);
};

const addToCart = async (page, handle) => {
  await page.goto(`${STORE}/products/${handle}`, { waitUntil: "networkidle2" });
  await acceptCookies(page);
  const variantId = await page.evaluate(() => {
    const input = document.querySelector('form[action*="/cart/add"] [name="id"]');
    return input?.value || null;
  });
  if (variantId) await page.goto(`${STORE}/cart/${variantId}:1`, { waitUntil: "networkidle2" });
};

/** Re-running one scene should not mean re-running all six. */
const only = process.argv.slice(2);
const wanted = (id) => only.length === 0 || only.includes(id);

const browser = await puppeteer.launch({ headless: "new", args: ["--lang=en-GB"] });
await mkdir(SCENES, { recursive: true });

try {
  // r1 — save for later, start to finish, with the shopper ticking marketing.
  if (wanted("r1"))
    await scene(browser, "r1-save-for-later", async (page) => {
      await page.goto(`${STORE}/products/everyday-hoodie`, { waitUntil: "networkidle2" });
      await acceptCookies(page);
      await wait(2600); // The product page, before anything is clicked.
      if (!(await openWidgetModal(page, "save_for_later"))) {
        await clickByText(page, "save this for later");
      }
      await wait(3200); // The form as it opens: marketing box unticked.
      await fillAndSubmit(page, { tickMarketing: true });
    });

  // r2 — the same widget, left unticked. A refusal is a record too.
  if (wanted("r2"))
    await scene(browser, "r2-unticked", async (page) => {
      await page.goto(`${STORE}/products/canvas-sneakers`, { waitUntil: "networkidle2" });
      await acceptCookies(page);
      await wait(1600);
      if (!(await openWidgetModal(page, "save_for_later"))) {
        await clickByText(page, "save this for later");
      }
      await wait(2600);
      await fillAndSubmit(page, { tickMarketing: false });
    });

  // r3 — cart save, from an empty cart to the confirmation.
  if (wanted("r3"))
    await scene(browser, "r3-cart-save", async (page) => {
      await addToCart(page, "light-puffer-jacket");
      await page.goto(`${STORE}/cart`, { waitUntil: "networkidle2" });
      await wait(3000); // The cart page with the Save cart block in the theme.
      if (!(await openWidgetModal(page, "cart_save"))) {
        await clickByText(page, "email me my cart|save my cart|email my cart");
      }
      await wait(2800);
      await fillAndSubmit(page, { tickMarketing: true });
    });

  // r4 — declining cookies, and the prompt that only a decline produces.
  if (wanted("r4"))
    await scene(browser, "r4-rejection-recovery", async (page) => {
      await page.goto(`${STORE}/products/light-puffer-jacket`, { waitUntil: "networkidle2" });
      await wait(2200); // The banner, before the choice.
      if (await declineCookies(page)) await wait(6000); // The delay, then the prompt.
      await clickByText(page, "save it by email|email it to me|save this");
      await wait(3200);
      await fillAndSubmit(page, { tickMarketing: false });
    });

  // r5 — the wishlist: no account, survives a reload, emailed only on request.
  if (wanted("r5"))
    await scene(browser, "r5-wishlist", async (page) => {
      for (const handle of ["cashmere-beanie", "canvas-sneakers", "white-leather-sneakers"]) {
        await page.goto(`${STORE}/products/${handle}`, { waitUntil: "networkidle2" });
        await acceptCookies(page);
        await wait(1100);
        await clickByText(page, "add to wishlist");
        await wait(1500); // The heart filling, and the header count going up.
      }
      await page.reload({ waitUntil: "networkidle2" });
      await wait(3000); // Proof it survived the reload — no login anywhere.
      await page.goto(`${STORE}/apps/kukis/wishlist`, { waitUntil: "networkidle2" });
      await wait(5000);
    });

  // r6 — the price-drop alert form, the only place the wishlist asks for an
  // email. It is a plain form on the page, not a modal, and its two checkboxes
  // are separate: alerts are required, marketing is not.
  if (wanted("r6"))
    await scene(browser, "r6-wishlist-claim", async (page) => {
      for (const handle of ["cashmere-beanie", "white-leather-sneakers"]) {
        await page.goto(`${STORE}/products/${handle}`, { waitUntil: "networkidle2" });
        await acceptCookies(page);
        await clickByText(page, "add to wishlist");
        await wait(1200);
      }
      await page.goto(`${STORE}/apps/kukis/wishlist`, { waitUntil: "networkidle2" });
      await wait(2600);

      const alerts = await page.waitForSelector('form input[name="alertConsent"]', {
        visible: true,
        timeout: 12000,
      });
      await alerts.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await wait(2400); // The form as it stands: both boxes unticked.

      const email = await page.waitForSelector('form input[name="email"]', { visible: true });
      await email.click();
      await page.keyboard.type(DEMO_EMAIL, { delay: 95 });
      await wait(1200);

      await alerts.click(); // Alerts: required, and still the shopper's own click.
      await wait(1600);

      const marketing = await page.$('form input[name="marketingConsent"]');
      if (marketing) {
        await marketing.click();
        await wait(1600);
      }

      await clickByText(page, "alert|price drop|notify|tell me");
      await wait(5000);
    });
} finally {
  await browser.close();
}

console.log(`\nDone.\n  ${SCENES}`);
