import { describe, expect, it } from "vitest";
import { DEFAULT_RATES, calculate } from "./revenueCalc";

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
    expect(r.payback).toBeCloseTo(555.6 / 46);
    expect(r.breakEvenOrders).toBe(1);
  });

  it("scales saves with the scenario but not the order rate per save", () => {
    const base = calculate(defaults);
    const strong = calculate({ ...defaults, factor: 1.6 });
    expect(strong.saves).toBeCloseTo(base.saves * 1.6);
    expect(strong.orders / strong.saves).toBeCloseTo(base.orders / base.saves);
  });

  it("needs more than one order to break even on a small basket", () => {
    expect(calculate({ ...defaults, aov: 15 }).breakEvenOrders).toBe(4);
  });

  it("has no Rejection Recovery revenue when nobody declines cookies", () => {
    const r = calculate({ ...defaults, declinePct: 0 });
    expect(r.ordersRecovery).toBe(0);
    expect(r.declinedRevenue).toBe(0);
  });
});
