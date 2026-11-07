import { describe, expect, it } from "vitest";
import { faqs, finalCta, pricing } from "./site";
import { PRICE_EUR, THRESHOLD_EUR } from "../lib/revenueCalc";
import siteSource from "./site.ts?raw";
import indexHtml from "../../index.html?raw";
import termsHtml from "../../public/legal/terms.html?raw";

/**
 * The site, the Shopify listing and the app must state the same pricing rule.
 * These checks keep the site's copy on "€49.99 only in a cycle Kukis recovers
 * more than €250" and keep the retired free trial from creeping back.
 *
 * Files are read through Vite's `?raw` imports rather than `node:fs`, because
 * the site's tsconfig has no Node types.
 */

// The app's pricing source, from the sibling repo. A glob matches nothing,
// rather than failing, when that repo isn't checked out next to this one.
const appPricing = Object.values(
  import.meta.glob<string>("../../../App/consented-cart/app/modules/billing/pricing.ts", {
    query: "?raw",
    import: "default",
    eager: true,
  })
)[0];

const costAnswer = faqs.find((f) => f.q === "What does it cost?")?.a ?? "";

describe("pricing copy", () => {
  it.each([
    ["pricing card", JSON.stringify(pricing)],
    ["FAQ answer", costAnswer],
    ["final call to action", JSON.stringify(finalCta)],
  ])("%s names the charge and the threshold", (_name, text) => {
    expect(text).toContain("€49.99");
    expect(text).toContain("€250");
  });

  it.each([
    ["src/data/site.ts", siteSource],
    ["index.html", indexHtml],
    ["public/legal/terms.html", termsHtml],
  ])("%s no longer mentions a free trial", (_path, text) => {
    expect(text).not.toMatch(/free trial|30-day free/i);
  });

  it("matches the app's billing numbers", () => {
    // Local cross-repo check: the app lives in a sibling repo, which CI for
    // this site doesn't check out. When it's absent there's nothing to compare.
    if (appPricing === undefined) return;

    const eur = appPricing.match(
      /EUR:\s*\{[^}]*chargeCents:\s*(\d+)[^}]*thresholdCents:\s*(\d+)/
    );
    expect(eur, "EUR entry not found in the app's pricing.ts").not.toBeNull();
    const [, chargeCents, thresholdCents] = eur!;
    expect(Number(chargeCents)).toBe(Math.round(PRICE_EUR * 100));
    expect(Number(thresholdCents)).toBe(THRESHOLD_EUR * 100);
  });
});
