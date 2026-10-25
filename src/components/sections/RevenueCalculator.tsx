import { useId, useState, type CSSProperties } from "react";
import { ArrowRight, Cookie } from "lucide-react";
import { Section, SectionHead } from "../ui/Section";
import { Reveal } from "../ui/Reveal";
import { Button } from "../ui/Button";
import { site } from "../../data/site";
import { cn } from "../../lib/cn";
import { DEFAULT_RATES, PRICE_EUR, SCENARIOS, calculate } from "../../lib/revenueCalc";

// English page, euro amounts: en-IE gives "€1,234" and "1.5", which reads
// right next to English copy.
const LOCALE = "en-IE";
const eur = (n: number) => "€" + Math.round(n).toLocaleString(LOCALE);
const int = (n: number) => Math.round(n).toLocaleString(LOCALE);
const one = (n: number) => (Math.round(n * 10) / 10).toLocaleString(LOCALE);

const eyebrow = "text-xs font-semibold uppercase tracking-[0.12em]";

function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  const id = useId();
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-medium text-cocoa">
          {label}
        </label>
        <output
          htmlFor={id}
          className="shrink-0 font-display text-[1.5rem] font-bold leading-none tabular-nums text-cocoa"
        >
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="calc-range"
        style={{ "--fill": `${fill}%` } as CSSProperties}
      />
      {hint && <span className="text-[0.8125rem] leading-snug text-crumb">{hint}</span>}
    </div>
  );
}

/**
 * "What is Kukis worth to your store?" Three sliders and a scenario on the
 * left; on the right, a dark result card: the monthly estimate, how it splits
 * across the widgets, and the share that comes from cookie decliners.
 */
export function RevenueCalculator() {
  const [sessions, setSessions] = useState(20000);
  const [aov, setAov] = useState(75);
  const [declinePct, setDeclinePct] = useState(40);
  const [factor, setFactor] = useState<number>(1);

  const r = calculate({ sessions, aov, declinePct, factor, rates: DEFAULT_RATES });

  const parts = [
    { name: "Save my cart", orders: r.ordersCart, dot: "bg-amber" },
    { name: "Save for later & Wishlist", orders: r.ordersProduct, dot: "bg-[#7DB3EA]" },
    { name: "Rejection Recovery", orders: r.ordersRecovery, dot: "bg-[#E0605A]" },
  ];

  return (
    <Section id="calculator">
      <Reveal>
        <SectionHead
          eyebrow="Calculator"
          title="What is Kukis worth to your store?"
          sub="Three sliders, your numbers. See what saved carts and products could bring back each month, including from shoppers who declined your cookies."
        />
      </Reveal>

      <Reveal delay={0.05}>
        <div className="mx-auto mt-11 grid max-w-[1000px] gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* Inputs */}
          <section
            aria-label="Your store"
            className="flex flex-col rounded-[24px] border border-chip/15 bg-cream p-6 md:p-8"
          >
            <div className={cn(eyebrow, "text-blueberry")}>Your store</div>

            <div className="mt-6 flex flex-col gap-7">
              <Slider
                label="Monthly sessions"
                value={sessions}
                display={int(sessions)}
                min={2000}
                max={200000}
                step={1000}
                onChange={setSessions}
                hint="Shopify admin → Analytics → Sessions, last 30 days."
              />
              <Slider
                label="Average order value"
                value={aov}
                display={`€${aov}`}
                min={15}
                max={300}
                step={5}
                onChange={setAov}
              />
              <Slider
                label="Shoppers who decline cookies"
                value={declinePct}
                display={`${declinePct}%`}
                min={10}
                max={70}
                step={1}
                onChange={setDeclinePct}
                hint="EU stores usually see 30–60%. Your cookie app shows the real figure."
              />

              <div className="flex flex-col gap-3">
                <span className="font-medium text-cocoa">How much shoppers use the widgets</span>
                <div role="group" aria-label="Scenario" className="flex gap-1 rounded-full bg-chip/[0.08] p-1">
                  {SCENARIOS.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      aria-pressed={factor === s.factor}
                      onClick={() => setFactor(s.factor)}
                      className={cn(
                        "flex-1 cursor-pointer rounded-full px-2 py-2 text-[0.875rem] font-semibold transition-colors",
                        factor === s.factor
                          ? "bg-cocoa text-milk shadow-[0_2px_6px_rgba(46,28,16,0.25)]"
                          : "text-cocoa hover:bg-cream"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-8 border-t border-chip/10 pt-5 text-[0.8125rem] leading-relaxed text-crumb md:mt-auto">
              Estimates from typical e-commerce rates, not a promise. Once installed, the Kukis dashboard shows your
              store's real recovered revenue, as Shopify reports it. $49.99 a month is used here as about €{PRICE_EUR}.
            </p>
          </section>

          {/* Result */}
          <section
            aria-label="Estimated result"
            className="relative overflow-hidden rounded-[24px] p-6 text-[#FBF3E4] shadow-[0_30px_60px_-30px_rgba(46,28,16,0.65)] md:p-8"
            style={{ background: "linear-gradient(180deg, #2a1b11 0%, #1d130a 100%)" }}
          >
            {/* warm glow behind the number */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-[90px]"
              style={{ background: "radial-gradient(circle, rgba(232,176,75,0.22) 0%, transparent 70%)" }}
            />

            <div className="relative">
              <div className={cn(eyebrow, "text-[#c9b7a1]")}>Estimated extra revenue</div>
              <div
                aria-live="polite"
                className="mt-3 font-display text-[clamp(52px,8vw,76px)] font-extrabold leading-none tracking-[-0.03em] tabular-nums"
              >
                {eur(r.revenue)}
                <span className="ml-2 text-[0.3em] font-semibold tracking-normal text-[#c9b7a1]">a month</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-consent/20 px-3 py-1 text-[0.8125rem] font-semibold tabular-nums text-[#86dcae]">
                  {r.payback >= 1 ? `${one(r.payback)}× what Kukis costs` : "Below cost at these rates"}
                </span>
                <span className="rounded-full bg-white/[0.08] px-3 py-1 text-[0.8125rem] font-semibold tabular-nums text-[#e0cdb6]">
                  Pays for itself at {r.breakEvenOrders} order{r.breakEvenOrders > 1 ? "s" : ""} a month
                </span>
              </div>

              {/* One bar, split by widget */}
              <div className="mt-7" aria-hidden>
                <div className="flex h-3 gap-[3px] overflow-hidden rounded-full">
                  {parts.map((p) => (
                    <div
                      key={p.name}
                      className={cn("h-full transition-[flex-grow] duration-300 motion-reduce:transition-none", p.dot)}
                      style={{ flexGrow: Math.max(p.orders, 0.0001), flexBasis: 0 }}
                    />
                  ))}
                </div>
              </div>
              <ul className="mt-4 flex flex-col gap-2.5">
                {parts.map((p) => (
                  <li key={p.name} className="flex items-center gap-3 text-[0.875rem] sm:text-[0.9375rem]">
                    <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", p.dot)} aria-hidden />
                    <span className="min-w-0 flex-1 text-[#e0cdb6]">{p.name}</span>
                    <span className="hidden shrink-0 tabular-nums text-[#a48d76] sm:inline">{one(p.orders)} orders</span>
                    <span className="shrink-0 text-right font-semibold tabular-nums sm:w-16">{eur(p.orders * aov)}</span>
                  </li>
                ))}
              </ul>

              <dl className="mt-7 grid grid-cols-3 divide-x divide-white/10 border-y border-white/10 py-4">
                {[
                  ["Saves", int(r.saves)],
                  ["Orders back", one(r.orders)],
                  ["Marketing yeses", int(r.marketingYes)],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col justify-between px-3 first:pl-0 last:pr-0">
                    <dt className="text-[0.75rem] leading-snug text-[#a48d76]">{k}</dt>
                    <dd className="mt-0.5 font-display text-[1.5rem] font-bold tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-amber/[0.12] px-4 py-3.5 text-[0.875rem] leading-relaxed text-[#e0cdb6]">
                <Cookie size={18} className="mt-0.5 shrink-0 text-amber" aria-hidden />
                <span>
                  <b className="font-semibold tabular-nums text-amber">{eur(r.declinedRevenue)}</b> of this comes from
                  shoppers who declined cookies: <b className="font-semibold tabular-nums text-[#FBF3E4]">{int(r.declinedSaves)}</b> saves
                  and <b className="font-semibold tabular-nums text-[#FBF3E4]">{int(r.declinedMarketingYes)}</b> marketing
                  yeses a month that cookie-based tools can't reach.
                </span>
              </div>

              <Button href={site.installHref} size="lg" className="mt-6 w-full">
                Try it free for 30 days <ArrowRight size={18} aria-hidden />
              </Button>
            </div>
          </section>
        </div>
      </Reveal>
    </Section>
  );
}
