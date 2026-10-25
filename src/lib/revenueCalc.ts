/**
 * The revenue calculator's math, kept apart from the UI so it can be tested.
 *
 * Every rate is a percentage as the slider shows it (8 means 8%). The model:
 * sessions become abandoned carts and product browsers; a share of each saves
 * by email; cookie decliners also see the Rejection Recovery offer; saves come
 * back as orders at a fixed rate; orders times AOV is revenue.
 */

/** Kukis costs $49.99 a month. The calculator works in euros, so about €46. */
export const PRICE_EUR = 46;

export type RateKey = "atc" | "aband" | "pv" | "uc" | "up" | "ur" | "oc" | "op" | "mo";

export const ASSUMPTIONS: {
  id: RateKey;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
}[] = [
  { id: "atc", label: "Sessions that add to cart", value: 8, min: 1, max: 20, step: 0.5 },
  { id: "aband", label: "Carts abandoned", value: 70, min: 40, max: 90, step: 1 },
  { id: "pv", label: "Sessions that browse products without adding to cart", value: 50, min: 10, max: 80, step: 1 },
  { id: "uc", label: "Abandoned carts saved with “Save my cart”", value: 3, min: 0.5, max: 10, step: 0.5 },
  { id: "up", label: "Product browsers who save for later or wishlist", value: 0.5, min: 0.1, max: 3, step: 0.1 },
  { id: "ur", label: "Cookie decliners who use the Rejection Recovery offer", value: 1, min: 0.1, max: 5, step: 0.1 },
  { id: "oc", label: "Saved carts that come back as an order", value: 10, min: 2, max: 25, step: 1 },
  { id: "op", label: "Saved products that come back as an order", value: 4, min: 1, max: 15, step: 0.5 },
  { id: "mo", label: "Saves that also tick the marketing box", value: 30, min: 5, max: 60, step: 1 },
];

export const DEFAULT_RATES = Object.fromEntries(
  ASSUMPTIONS.map((a) => [a.id, a.value])
) as Record<RateKey, number>;

/** Scales how often shoppers use the widgets. Order rates stay the same. */
export const SCENARIOS = [
  { label: "Cautious", factor: 0.5 },
  { label: "Expected", factor: 1 },
  { label: "Strong", factor: 1.6 },
] as const;

export type CalcInput = {
  sessions: number;
  aov: number;
  /** Percent of shoppers who decline cookies. */
  declinePct: number;
  /** Scenario factor applied to the save rates. */
  factor: number;
  rates: Record<RateKey, number>;
};

export function calculate({ sessions, aov, declinePct, factor, rates }: CalcInput) {
  const r = Object.fromEntries(
    Object.entries(rates).map(([k, v]) => [k, v / 100])
  ) as Record<RateKey, number>;
  const d = declinePct / 100;

  const carts = sessions * r.atc * r.aband;
  const browsers = sessions * r.pv;
  const cartsDeclined = carts * d;
  const browsersDeclined = browsers * d;

  const savesCart = carts * r.uc * factor;
  const savesProduct = browsers * r.up * factor;
  const savesRecoveryCart = cartsDeclined * r.ur * factor;
  const savesRecoveryProduct = browsersDeclined * r.ur * factor;
  const savesRecovery = savesRecoveryCart + savesRecoveryProduct;

  const ordersCart = savesCart * r.oc;
  const ordersProduct = savesProduct * r.op;
  const ordersRecovery = savesRecoveryCart * r.oc + savesRecoveryProduct * r.op;

  const saves = savesCart + savesProduct + savesRecovery;
  const orders = ordersCart + ordersProduct + ordersRecovery;
  const revenue = orders * aov;
  const marketingYes = saves * r.mo;

  // Shoppers who declined cookies: their share of the ordinary widgets, plus
  // every Rejection Recovery save (only decliners ever see that offer).
  const declinedSaves = (savesCart + savesProduct) * d + savesRecovery;
  const declinedOrders = (ordersCart + ordersProduct) * d + ordersRecovery;

  return {
    carts,
    browsers,
    decliners: cartsDeclined + browsersDeclined,
    savesCart,
    savesProduct,
    savesRecovery,
    savesRecoveryCart,
    savesRecoveryProduct,
    ordersCart,
    ordersProduct,
    ordersRecovery,
    saves,
    orders,
    revenue,
    marketingYes,
    declinedSaves,
    declinedMarketingYes: declinedSaves * r.mo,
    declinedRevenue: declinedOrders * aov,
    payback: revenue / PRICE_EUR,
    breakEvenOrders: Math.max(1, Math.ceil(PRICE_EUR / aov)),
  };
}

export type CalcResult = ReturnType<typeof calculate>;
