import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ArrowRight } from "lucide-react";
import { Section, SectionHead } from "../ui/Section";
import { Reveal } from "../ui/Reveal";
import { CookieMascot } from "../ui/CookieMascot";
import { usePrefersReducedMotion } from "../../lib/useReducedMotion";
import { builtFor, site } from "../../data/site";

// first-person versions of the real ICP traits, so the merchant can self-check
const CHECKS = [
  "I run an EU Shopify store",
  "I'm a small-to-mid DTC brand (~€100k-€2M)",
  "I don't have a legal team",
  "I want cart recovery without a heavy email stack",
];

/** Qualify the visitor as a 10-second self-check with a live fit verdict. */
export function BuiltFor() {
  const reduced = usePrefersReducedMotion();
  const [checked, setChecked] = useState<boolean[]>([false, false, false, false]);
  const count = checked.filter(Boolean).length;
  const qualified = count >= 3;
  const toggle = (i: number) =>
    setChecked((c) => c.map((v, idx) => (idx === i ? !v : v)));

  const verdict =
    count === 0
      ? "Tick the ones that sound like you."
      : qualified
        ? "Kukis is built for you."
        : "Looking like a fit.";

  return (
    <Section>
      <Reveal>
        <SectionHead
          title="Who Kukis is for, and who it isn't."
          sub="Tick what's true for your store."
        />
      </Reveal>

      <Reveal>
        <div className="mx-auto mt-9 flex max-w-[900px] flex-col items-center gap-5 md:flex-row md:gap-9">
          <CookieMascot
            mood={qualified ? "happy" : count > 0 ? "promising" : "idle"}
            bubble={
              count === 0
                ? "Tick away!"
                : qualified
                  ? "You're my kind of store!"
                  : "Ooh, promising."
            }
          />
          <div className="w-full max-w-[600px] rounded-[24px] border border-chip/15 bg-cream p-6 shadow-[0_18px_44px_-22px_rgba(90,52,32,0.28)] md:p-8">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-amber">
            Is this you?
          </div>

          <div className="mt-4 flex flex-col gap-2.5">
            {CHECKS.map((label, i) => (
              <button
                key={i}
                type="button"
                role="checkbox"
                aria-checked={checked[i]}
                onClick={() => toggle(i)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors duration-200 ${
                  checked[i]
                    ? "border-consent/40 bg-consent/[0.07]"
                    : "border-chip/15 bg-milk hover:border-chip/35"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors duration-200 ${
                    checked[i]
                      ? "border-consent bg-consent"
                      : "border-chip/40 bg-cream"
                  }`}
                >
                  {checked[i] && (
                    <motion.span
                      initial={reduced ? false : { scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 16 }}
                    >
                      <Check size={15} strokeWidth={3} className="text-white" aria-hidden />
                    </motion.span>
                  )}
                </span>
                <span
                  className={`text-[15px] ${
                    checked[i] ? "font-medium text-cocoa" : "text-cocoa-soft"
                  }`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* fit meter */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="font-medium text-crumb">Fit</span>
              <span className="font-semibold text-cocoa">{count}/4</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-chip/12">
              <div
                className={`h-full rounded-full transition-[width,background-color] duration-500 ease-out ${
                  qualified ? "bg-consent" : "bg-amber"
                }`}
                style={{ width: `${(count / CHECKS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* verdict + CTA */}
          <div
            className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"
            aria-live="polite"
          >
            <motion.span
              key={verdict}
              initial={reduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`font-display text-[18px] font-bold ${
                qualified ? "text-consent" : "text-cocoa"
              }`}
            >
              {verdict}
            </motion.span>

            <AnimatePresence>
              {qualified && (
                <motion.a
                  href={site.demoHref}
                  initial={reduced ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-cherry px-5 py-2.5 text-[14px] font-semibold text-milk transition-colors hover:bg-cherry-deep"
                >
                  Book a demo
                  <ArrowRight size={15} aria-hidden />
                </motion.a>
              )}
            </AnimatePresence>
          </div>
          </div>
        </div>
      </Reveal>

      {/* honest disqualifiers, kept low-key */}
      <Reveal delay={0.1}>
        <div className="mx-auto mt-7 max-w-[600px]">
          <div className="mb-3 text-center text-[12.5px] font-semibold uppercase tracking-[0.12em] text-crumb">
            Not built for
          </div>
          <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {builtFor.not.items.map((it) => (
              <div key={it} className="flex items-start gap-2.5">
                <X size={15} className="mt-0.5 shrink-0 text-crumb/70" aria-hidden />
                <span className="text-[13.5px] leading-snug text-crumb">{it}</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
