import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Check } from "lucide-react";
import { Section, SectionHead } from "../ui/Section";
import { Reveal } from "../ui/Reveal";
import { usePrefersReducedMotion } from "../../lib/useReducedMotion";
import { compare } from "../../data/site";

const TOKENS = 50;
// deterministic ~50/50 split: which shoppers declined cookies (the crumbs Kukis catches)
const declined = (i: number) => (((i + 1) * 2654435761) >>> 0) % 100 < 50;

/**
 * Why Kukis: a coverage grid. Cookie tools reach the shoppers who accept cookies;
 * Kukis catches the other half, the ones who declined (the cookie crumbs).
 */
export function WhyKukis() {
  const reduced = usePrefersReducedMotion();
  const [caught, setCaught] = useState(reduced);
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reduced) return;
    const el = gridRef.current;
    if (!el) return;
    let timer: number | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          io.disconnect();
          timer = window.setTimeout(() => setCaught(true), 1500);
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [reduced]);

  return (
    <Section id="why">
      <Reveal>
        <SectionHead
          title="Built for the shoppers others give up on."
          sub="Cookie-based tools only reach the shoppers who accept cookies. Kukis catches the other half, the ones who declined."
        />
      </Reveal>

      <Reveal>
        <div className="mt-9 grid items-center gap-8 rounded-[24px] border border-chip/15 bg-cream p-6 md:grid-cols-[0.85fr_1.15fr] md:gap-12 md:p-8">
          {/* left: the number + message */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-ink">
              The cookie-crumb half
            </span>
            <AnimatePresence mode="wait">
              <motion.div
                key={caught ? "caught" : "lost"}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div
                  className={`mt-2 font-display text-[clamp(44px,6vw,66px)] font-extrabold leading-none tracking-[-0.03em] ${
                    caught ? "text-amber-ink" : "text-cherry-deep"
                  }`}
                >
                  ~50%
                </div>
                <div className="mt-2 text-[0.96875rem] font-semibold text-cocoa">
                  {caught
                    ? "decline cookies, caught by Kukis"
                    : "decline cookies and slip away"}
                </div>
              </motion.div>
            </AnimatePresence>
            <p className="mt-4 max-w-[40ch] text-[0.90625rem] leading-relaxed text-cocoa-soft">
              Cookie-based tools only see the shoppers who accept. The other half
              decline and vanish. Kukis never needed cookies, so it captures a
              consented email from that half, the crumbs everyone else drops.
            </p>
          </div>

          {/* right: the crowd, split into two groups */}
          <div>
            <div className="mb-3 text-[0.78125rem] font-medium text-crumb">
              Your EU shoppers, cookie choice by choice
            </div>
            <div ref={gridRef} className="grid grid-cols-10 gap-2">
              {Array.from({ length: TOKENS }).map((_, i) => {
                const isDeclined = declined(i);
                const wave = caught && isDeclined ? `${i * 10}ms` : "0ms";
                const cls = isDeclined
                  ? caught
                    ? "scale-100 text-amber opacity-100 drop-shadow-[0_0_5px_rgba(232,176,75,0.55)]"
                    : "scale-90 text-cocoa/15"
                  : "scale-95 text-blueberry/80";
                return (
                  <span key={i} aria-hidden className="flex aspect-square items-center justify-center">
                    <User
                      className={`h-full w-full transition-all duration-300 ${cls}`}
                      style={{ transitionDelay: reduced ? "0ms" : wave }}
                      strokeWidth={2}
                    />
                  </span>
                );
              })}
            </div>
            {/* legend */}
            <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.75rem] text-cocoa-soft">
              <span className="flex items-center gap-1.5">
                <User size={13} className="text-amber" strokeWidth={2.5} aria-hidden />
                Declined cookies, caught by Kukis
              </span>
              <span className="flex items-center gap-1.5">
                <User size={13} className="text-blueberry/80" strokeWidth={2.5} aria-hidden />
                Accepted, reached by cookie tools
              </span>
            </div>
          </div>
        </div>
      </Reveal>

      {/* the substance, kept light */}
      <Reveal delay={0.1}>
        <div className="mt-7 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          {compare.us.points.map((p) => (
            <div key={p} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-consent/15">
                <Check size={12} strokeWidth={3} className="text-consent-ink" aria-hidden />
              </span>
              <span className="text-[0.84375rem] leading-snug text-cocoa-soft">{p}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
