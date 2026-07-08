import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { Check, X, ArrowRight } from "lucide-react";
import { Section, SectionHead } from "../ui/Section";
import { Reveal } from "../ui/Reveal";
import { usePrefersReducedMotion } from "../../lib/useReducedMotion";
import { publicAsset } from "../../lib/publicAsset";
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
          <CookieMascot count={count} qualified={qualified} reduced={reduced} />
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

/** The Kukis cookie mascot: eyes follow the cursor, reacts happily on qualify. */
function CookieMascot({
  count,
  qualified,
  reduced,
}: {
  count: number;
  qualified: boolean;
  reduced: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 220, damping: 18, mass: 0.4 };
  const sx = useSpring(px, spring);
  const sy = useSpring(py, spring);

  // pupils track the cursor (motion values, no re-renders)
  useEffect(() => {
    if (reduced) return;
    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width * 0.5;
      const cy = r.top + r.height * 0.48;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const max = r.width * 0.032;
      px.set((dx / dist) * max);
      py.set((dy / dist) * max);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduced, px, py]);

  const bubble =
    count === 0
      ? "Tick away!"
      : qualified
        ? "You're my kind of store!"
        : "Ooh, promising.";

  const pupilCls = "pointer-events-none absolute rounded-full bg-[#2a170c]";
  const pupilStyle = { width: "8.5%", height: "8.5%", x: sx, y: sy } as const;

  return (
    <div className="relative w-[132px] shrink-0 md:w-[200px]">
      {/* speech bubble */}
      <motion.div
        key={bubble}
        initial={reduced ? false : { opacity: 0, y: 6, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -top-2 left-1/2 z-10 max-w-[180px] -translate-x-1/2 -translate-y-full rounded-2xl border border-chip/15 bg-milk px-3 py-1.5 text-center text-[12px] font-semibold leading-tight text-cocoa shadow-soft"
      >
        {bubble}
        <span className="absolute -bottom-[5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-chip/15 bg-milk" />
      </motion.div>

      {/* mascot body: idle bob, happy hop on qualify */}
      <motion.div
        ref={ref}
        className="relative"
        animate={reduced ? { y: 0, rotate: 0 } : qualified ? "happy" : "idle"}
        variants={{
          idle: { y: [0, -5, 0], rotate: 0 },
          happy: { y: [0, -16, 0], rotate: [0, -7, 7, 0] },
        }}
        transition={
          qualified
            ? { duration: 0.6, ease: "easeOut" }
            : { duration: 3, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }
        }
      >
        <img
          src={publicAsset("mascot/cookie.png")}
          alt="Kukis cookie mascot"
          className="w-full select-none drop-shadow-[0_14px_22px_rgba(90,52,32,0.22)]"
          draggable={false}
        />
        {/* pupils on the white eyes */}
        <motion.div className={pupilCls} style={{ ...pupilStyle, left: "31.4%", top: "44.5%" }} />
        <motion.div className={pupilCls} style={{ ...pupilStyle, left: "58.6%", top: "43.5%" }} />
      </motion.div>
    </div>
  );
}
