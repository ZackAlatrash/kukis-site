import { describe, expect, it } from "vitest";
import { DEFAULT_RATES, PRICE_EUR, THRESHOLD_EUR, calculate, costFor } from "./revenueCalc";

const defaults = {
  sessions: 20000,
  aov: 75,
  declinePct: 40,
  factor: 1,
  rates: DEFAULT_RATES,
};

describe("calculate", () => {
  // Worked by hand from the original calculator's formulas, so the port to
  // React is checked against the same numbers it showed.
  it("matches the original calculator at its default settings", () => {
    const r = calculate(defaults);
    expect(r.carts).toBeCloseTo(1120);
    expect(r.browsers).toBeCloseTo(10000);
    expect(r.saves).toBeCloseTo(128.08);
    expect(r.orders).toBeCloseTo(7.408);
    expect(r.revenue).toBeCloseTo(555.6);
    expect(r.marketingYes).toBeCloseTo(38.424);
    expect(r.declinedSaves).toBeCloseTo(77.92);
    expect(r.declinedRevenue).toBeCloseTo(314.4);
    expect(r.charged).toBe(true);
    expect(r.cost).toBe(49.99);
  });

  it("scales saves with the scenario but not the order rate per save", () => {
    const base = calculate(defaults);
    const strong = calculate({ ...defaults, factor: 1.6 });
    expect(strong.saves).toBeCloseTo(base.saves * 1.6);
    expect(strong.orders / strong.saves).toBeCloseTo(base.orders / base.saves);
  });

  it("charges €49.99 only when recovered revenue is more than €250", () => {
    expect(PRICE_EUR).toBe(49.99);
    expect(THRESHOLD_EUR).toBe(250);
    expect(costFor(0)).toBe(0);
    expect(costFor(250)).toBe(0); // exactly the threshold is not "more than"
    expect(costFor(250.01)).toBe(49.99);
  });

  it("costs nothing in a month under the threshold", () => {
    const r = calculate({ ...defaults, sessions: 2000 });
    expect(r.revenue).toBeLessThan(250);
    expect(r.charged).toBe(false);
    expect(r.cost).toBe(0);
  });

  it("has no Rejection Recovery revenue when nobody declines cookies", () => {
    const r = calculate({ ...defaults, declinePct: 0 });
    expect(r.ordersRecovery).toBe(0);
    expect(r.declinedRevenue).toBe(0);
  });
});
